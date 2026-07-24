import os
import sys
import time
import logging
import grpc
from concurrent import futures
from dotenv import load_dotenv

# Ensure 'generated' folder is on python path
sys.path.append(os.path.join(os.path.dirname(__file__), "generated"))

from services import embedder, vector_store, keyword_store, hybrid_search, gemini_service

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("gRPCServer")

GRPC_PORT = os.getenv("GRPC_PORT", "50051")

try:
    import search_pb2
    import search_pb2_grpc
except ImportError:
    logger.error("Protobuf stubs not found in 'generated/'! Run the protoc codegen command first.")
    sys.exit(1)


class EmailSearchServicer(search_pb2_grpc.EmailSearchServiceServicer):
    """
    Implements EmailSearchService defined in protos/search.proto
    Uses synchronous gRPC server to avoid asyncio event loop issues on Windows.
    """

    def EmbedAndStore(self, request, context):
        try:
            logger.info(f"Embedding request received for messageId: {request.message_id}")
            text_to_embed = f"{request.subject} {request.body}"

            # 1. Embed text on GPU
            vector = embedder.embed(text_to_embed)

            # 2. Store vector in ChromaDB
            vector_store.store_email_vector(
                message_id=request.message_id,
                vector=vector,
                user_email=request.user_email,
                subject=request.subject
            )

            return search_pb2.EmbedResponse(success=True, error="")
        except Exception as e:
            logger.error(f"EmbedAndStore error: {e}")
            return search_pb2.EmbedResponse(success=False, error=str(e))

    def AskQuestion(self, request, context):
        """
        Server-side streaming RPC.
        Yields AskResponseChunk messages back to the Node.js client.
        """
        try:
            logger.info(f"AskQuestion received: '{request.question}' for user: {request.user_email}")
            user_email = request.user_email
            question = request.question
            top_k = request.top_k or 5

            # 1. Embed question
            query_vector = embedder.embed(question)

            # 2. Dense vector search
            vector_res = vector_store.query_vector_store(query_vector, user_email, top_k * 2)

            # 3. Sparse keyword search
            keyword_res = keyword_store.search_keyword_store(question, user_email, top_k * 2)

            # 4. Reciprocal Rank Fusion
            rrf_ranked = hybrid_search.reciprocal_rank_fusion(vector_res, keyword_res)

            # 5. Fetch full email bodies from Mongo for context
            context_emails = []
            sources = []
            for msg_id, score in rrf_ranked[:top_k]:
                doc = keyword_store.emails_collection.find_one({"messageId": msg_id, "userEmail": user_email})
                if doc:
                    context_emails.append(doc)
                    sources.append(search_pb2.SourceEmail(
                        message_id=msg_id,
                        subject=doc.get("subject", ""),
                        score=float(score)
                    ))

            logger.info(f"Found {len(context_emails)} emails for context.")

            # 6. Stream Gemini generated tokens
            for chunk_text in gemini_service.stream_answer(question, context_emails):
                yield search_pb2.AskResponseChunk(
                    text_delta=chunk_text,
                    is_final=False,
                    sources=[]
                )

            # 7. Final chunk with source metadata
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


def serve():
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    search_pb2_grpc.add_EmailSearchServiceServicer_to_server(EmailSearchServicer(), server)
    server.add_insecure_port(f"[::]:{GRPC_PORT}")
    server.start()
    logger.info(f"=== Python gRPC Search Server running on port {GRPC_PORT} ===")
    try:
        while True:
            time.sleep(86400)  # Keep alive
    except KeyboardInterrupt:
        logger.info("Shutting down gRPC server...")
        server.stop(grace=5)


if __name__ == "__main__":
    serve()
