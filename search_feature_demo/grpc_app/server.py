"""
gRPC server for the search service.

Wraps :class:`SearchPipeline` — the same pipeline used by the HTTP API.
Runs on a separate port (default 50052) from the existing python-service
Q&A gRPC server (port 50051).
"""

from __future__ import annotations

import hmac
import logging
import os
import sys
import time
from concurrent import futures

import grpc

import config as cfg

logger = logging.getLogger(__name__)

# Ensure generated stubs are on the path
_GRPC_DIR = os.path.dirname(os.path.abspath(__file__))
_GENERATED_DIR = os.path.join(_GRPC_DIR, "generated")
if _GENERATED_DIR not in sys.path:
    sys.path.insert(0, _GENERATED_DIR)


def _ensure_generated():
    """
    Check that gRPC Python stubs exist; generate them if missing.

    Runs ``grpc_tools.protoc`` to compile ``search.proto``.
    """
    pb2_path = os.path.join(_GENERATED_DIR, "search_pb2.py")
    proto_path = os.path.join(_GRPC_DIR, "search.proto")
    # Regenerate when the proto changed since the stubs were built, so a new
    # RPC never silently goes missing from a stale stub.
    if os.path.exists(pb2_path) and os.path.getmtime(pb2_path) >= os.path.getmtime(proto_path):
        return

    os.makedirs(_GENERATED_DIR, exist_ok=True)

    logger.info("Generating gRPC stubs from search.proto ...")
    from grpc_tools import protoc

    result = protoc.main(
        [
            "grpc_tools.protoc",
            f"-I{_GRPC_DIR}",
            f"--python_out={_GENERATED_DIR}",
            f"--grpc_python_out={_GENERATED_DIR}",
            proto_path,
        ]
    )
    if result != 0:
        raise RuntimeError(f"protoc failed with exit code {result}")
    logger.info("gRPC stubs generated in %s", _GENERATED_DIR)


# Generate stubs on import
_ensure_generated()

import search_pb2
import search_pb2_grpc


class SearchServiceServicer(search_pb2_grpc.SearchServiceServicer):
    """
    Implements the SearchService gRPC service.

    Delegates to the shared SearchPipeline for all search logic.
    """

    def __init__(self) -> None:
        from pipeline.search_pipeline import get_search_pipeline

        self._pipeline = get_search_pipeline()

    def Search(self, request, context):
        """
        Handle a Search RPC call.

        Args:
            request: SearchRequest protobuf message.
            context: gRPC server context.

        Returns:
            SearchResponse protobuf message.
        """
        try:
            import sys
            sys.stderr.write(f"\n[HOP 2: gRPC Server] Received request for query='{request.query}', user_email='{request.user_email}'\n")
            sys.stderr.flush()
            response = self._pipeline.search(
                raw_query=request.query,
                user_email=request.user_email,
                limit=request.limit or 20,
                offset=request.offset or 0,
            )

            # Convert Pydantic model to protobuf
            results_pb = []
            for r in response.results:
                results_pb.append(
                    search_pb2.SearchResult(
                        email_id=r.email_id,
                        subject=r.subject,
                        sender=r.sender,
                        date=r.date,
                        snippet=r.snippet,
                        scores=search_pb2.ScoreBreakdown(
                            bm25=r.scores.bm25,
                            vector=r.scores.vector,
                            rerank=r.scores.rerank,
                            final=r.scores.final,
                        ),
                    )
                )

            # Convert operators dict to map<string, string>
            ops_map = {}
            for k, v in response.query_interpretation.operators.items():
                ops_map[k] = str(v)

            return search_pb2.SearchResponse(
                results=results_pb,
                total=response.total,
                query_interpretation=search_pb2.QueryInterpretation(
                    operators=ops_map,
                    free_text=response.query_interpretation.free_text,
                    detected_sender=response.query_interpretation.detected_sender or "",
                ),
                timings=search_pb2.StageTimings(
                    total_ms=response.timings.total_ms,
                    routing_ms=response.timings.routing_ms,
                    metadata_ms=response.timings.metadata_ms,
                    bm25_ms=response.timings.bm25_ms,
                    vector_ms=response.timings.vector_ms,
                    fusion_ms=response.timings.fusion_ms,
                    rerank_ms=response.timings.rerank_ms,
                ),
                degraded=response.degraded,
                stages_timed_out=response.stages_timed_out,
            )

        except Exception as exc:
            logger.error("gRPC Search error: %s", exc, exc_info=True)
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(str(exc))
            return search_pb2.SearchResponse()

    def EmbedAndStore(self, request, context):
        try:
            logger.info(f"Embedding request received for messageId: {request.message_id}")
            text_to_embed = f"{request.subject} {request.body}"

            from embeddings.embedding_service import get_embedding_service
            from retrieval.vector_search import store_email_vector
            from retrieval.bm25_search import invalidate_user_corpus

            embedder = get_embedding_service()
            vector = embedder.embed_query(text_to_embed)

            store_email_vector(
                message_id=request.message_id,
                vector=vector,
                user_email=request.user_email,
                subject=request.subject
            )

            # Invalidate BM25 cache so the new email is included in the next search
            invalidate_user_corpus(request.user_email)

            return search_pb2.EmbedResponse(success=True, error="")
        except Exception as e:
            logger.error(f"EmbedAndStore error: {e}")
            return search_pb2.EmbedResponse(success=False, error=str(e))

    def AskQuestion(self, request, context):
        """
        Streams progress events, then the answer, then a final chunk with
        sources and per-stage timings.

        Chunk kinds (all AskResponseChunk):
          - stage set, no text      -> progress ("routing", "searching",
                                       "ranking", "reading", "generating")
          - text_delta set          -> answer text
          - is_final                -> sources, timings (ms), model
        """
        import queue
        import threading

        t_start = time.perf_counter()
        timings: dict[str, float] = {}
        user_email = request.user_email
        question = request.question
        top_k = request.top_k or 5
        try:
            logger.info("AskQuestion received (top_k=%d)", top_k)

            # 1. Run the hybrid search in a worker thread so its stage
            #    callbacks can be streamed to the client as they happen.
            events: queue.Queue = queue.Queue()
            outcome: dict = {}

            def run_search():
                try:
                    outcome["response"] = self._pipeline.search(
                        raw_query=question,
                        user_email=user_email,
                        limit=top_k,
                        offset=0,
                        on_stage=lambda stage: events.put(("stage", stage)),
                    )
                except Exception as exc:  # surfaced below, in this thread
                    outcome["error"] = exc
                finally:
                    events.put(("done", None))

            yield search_pb2.AskResponseChunk(stage="routing")
            threading.Thread(target=run_search, name="ask-search", daemon=True).start()
            last_stage = "routing"
            while True:
                kind, stage = events.get()
                if kind == "done":
                    break
                if stage != last_stage:
                    last_stage = stage
                    yield search_pb2.AskResponseChunk(stage=stage)
            if "error" in outcome:
                raise outcome["error"]

            response = outcome["response"]
            st = response.timings
            timings.update({
                "routing_ms": st.routing_ms,
                "bm25_ms": st.bm25_ms,
                "vector_ms": st.vector_ms,
                "rerank_ms": st.rerank_ms,
                "search_ms": (time.perf_counter() - t_start) * 1000,
            })

            # 2. Load the matched emails' content in one query (was one
            #    find_one per result), preserving the ranking order.
            yield search_pb2.AskResponseChunk(stage=f"reading:{len(response.results)}")
            t0 = time.perf_counter()
            from retrieval.mongo_metadata_search import _get_collection
            ids = [r.email_id for r in response.results]
            docs = {
                d["messageId"]: d
                for d in _get_collection().find({"messageId": {"$in": ids}, "userEmail": user_email})
            } if ids else {}
            context_emails = []
            sources = []
            for r in response.results:
                doc = docs.get(r.email_id)
                if doc:
                    context_emails.append(doc)
                    sources.append(search_pb2.SourceEmail(
                        message_id=r.email_id,
                        subject=r.subject,
                        score=float(r.scores.final)
                    ))
            timings["context_ms"] = (time.perf_counter() - t0) * 1000
            logger.info("Found %d emails for context.", len(context_emails))

            # 3. Stream Gemini's answer.
            yield search_pb2.AskResponseChunk(stage="generating")
            from llm.gemini_service import stream_answer
            meta: dict = {}
            t_llm = time.perf_counter()
            first_token_ms = None
            for chunk_text in stream_answer(question, context_emails, meta):
                if first_token_ms is None:
                    first_token_ms = (time.perf_counter() - t_llm) * 1000
                yield search_pb2.AskResponseChunk(text_delta=chunk_text, is_final=False)

            timings["llm_first_token_ms"] = first_token_ms or 0.0
            timings["llm_total_ms"] = (time.perf_counter() - t_llm) * 1000
            timings["llm_attempts"] = float(meta.get("attempts", 0))
            timings["total_ms"] = (time.perf_counter() - t_start) * 1000
            logger.info(
                "AskQuestion done in %.0f ms (search %.0f, rerank %.0f, context %.0f, llm first token %.0f / total %.0f, model %s)",
                timings["total_ms"], timings["search_ms"], timings["rerank_ms"], timings["context_ms"],
                timings["llm_first_token_ms"], timings["llm_total_ms"], meta.get("model", "-"),
            )

            # 4. Final chunk with source metadata + timings.
            yield search_pb2.AskResponseChunk(
                text_delta="",
                is_final=True,
                sources=sources,
                timings=timings,
                model=meta.get("model", ""),
            )

        except Exception as e:
            logger.error(f"AskQuestion streaming error: {e}")
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details("AskQuestion failed")
            return

    def DeleteUserData(self, request, context):
        try:
            from retrieval.vector_search import delete_user_vectors
            from retrieval.bm25_search import invalidate_user_corpus

            deleted = delete_user_vectors(request.user_email)
            invalidate_user_corpus(request.user_email)
            return search_pb2.DeleteUserDataResponse(success=True, deleted=deleted, error="")
        except Exception as e:
            logger.error(f"DeleteUserData error: {e}")
            return search_pb2.DeleteUserDataResponse(success=False, deleted=0, error="delete failed")


class _ServiceTokenInterceptor(grpc.ServerInterceptor):
    """
    Rejects any RPC that doesn't present the shared 'x-service-token' metadata
    value. Fails closed outside development — if SERVICE_TOKEN isn't
    configured, every call is rejected rather than silently allowed through.
    """

    def __init__(self) -> None:
        def deny(_request, context):
            context.abort(grpc.StatusCode.UNAUTHENTICATED, "Unauthorized")

        # Two shapes: Search/EmbedAndStore are unary_unary, AskQuestion is
        # unary_stream (server-streaming). Denying a streaming call with a
        # unary_unary handler mismatches the RPC's actual shape and breaks
        # the call outright instead of returning a clean auth error, so we
        # pick the matching handler type in intercept_service below.
        self._deny_unary_unary = grpc.unary_unary_rpc_method_handler(deny)
        self._deny_unary_stream = grpc.unary_stream_rpc_method_handler(deny)

    def _authorized(self, handler_call_details) -> bool:
        if not cfg.SERVICE_TOKEN:
            return cfg.ENVIRONMENT == "development"
        metadata = dict(handler_call_details.invocation_metadata or [])
        return hmac.compare_digest(metadata.get("x-service-token", ""), cfg.SERVICE_TOKEN)

    def intercept_service(self, continuation, handler_call_details):
        handler = continuation(handler_call_details)
        if handler is None or self._authorized(handler_call_details):
            return handler

        return self._deny_unary_stream if handler.response_streaming else self._deny_unary_unary


def serve(port: int | None = None) -> grpc.Server:
    """
    Start the gRPC search server.

    Args:
        port: Port to listen on (default from config).

    Returns:
        The running grpc.Server instance.
    """
    if port is None:
        port = cfg.GRPC_PORT

    server = grpc.server(
        futures.ThreadPoolExecutor(max_workers=10),
        interceptors=[_ServiceTokenInterceptor()],
    )
    search_pb2_grpc.add_SearchServiceServicer_to_server(
        SearchServiceServicer(), server
    )
    # Bind to localhost only — this service is reached exclusively by the
    # Node backend running on the same host/private network.
    server.add_insecure_port(f"{cfg.GRPC_BIND_HOST}:{port}")
    server.start()
    logger.info("=== Search gRPC server running on %s:%d ===", cfg.GRPC_BIND_HOST, port)
    return server
