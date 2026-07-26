"""
gRPC server for the search service.

Wraps :class:`SearchPipeline` — the same pipeline used by the HTTP API.
Runs on a separate port (default 50052) from the existing python-service
Q&A gRPC server (port 50051).
"""

from __future__ import annotations

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
    if os.path.exists(pb2_path):
        return

    os.makedirs(_GENERATED_DIR, exist_ok=True)

    logger.info("Generating gRPC stubs from search.proto ...")
    from grpc_tools import protoc

    proto_path = os.path.join(_GRPC_DIR, "search.proto")
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
        try:
            logger.info(f"AskQuestion received: '{request.question}' for user: {request.user_email}")
            user_email = request.user_email
            question = request.question
            top_k = request.top_k or 5

            # 1. Use the new Hybrid Search Pipeline to find context emails
            response = self._pipeline.search(
                raw_query=question,
                user_email=user_email,
                limit=top_k,
                offset=0,
            )

            from retrieval.mongo_metadata_search import _get_collection
            coll = _get_collection()

            context_emails = []
            sources = []
            for r in response.results:
                doc = coll.find_one({"messageId": r.email_id, "userEmail": user_email})
                if doc:
                    context_emails.append(doc)
                    sources.append(search_pb2.SourceEmail(
                        message_id=r.email_id,
                        subject=r.subject,
                        score=float(r.scores.final)
                    ))

            logger.info(f"Found {len(context_emails)} emails for context.")

            # 2. Stream Gemini generated tokens
            from llm.gemini_service import stream_answer
            for chunk_text in stream_answer(question, context_emails):
                yield search_pb2.AskResponseChunk(
                    text_delta=chunk_text,
                    is_final=False,
                    sources=[]
                )

            # 3. Final chunk with source metadata
            yield search_pb2.AskResponseChunk(
                text_delta="",
                is_final=True,
                sources=sources
            )

        except Exception as e:
            logger.error(f"AskQuestion streaming error: {e}")
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(str(e))
            return


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

    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    search_pb2_grpc.add_SearchServiceServicer_to_server(
        SearchServiceServicer(), server
    )
    server.add_insecure_port(f"[::]:{port}")
    server.start()
    logger.info("=== Search gRPC server running on port %d ===", port)
    return server
