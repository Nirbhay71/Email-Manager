import os
import sys
import time
import logging
from concurrent import futures
import grpc
from dotenv import load_dotenv

load_dotenv()

# Ensure 'generated' folder is on python path
sys.path.append(os.path.join(os.path.dirname(__file__), "generated"))

import classifier_pb2
import classifier_pb2_grpc
from services import classifier_chroma_store as chroma_store
from services import classifier_embedder as embedder

# Import modular classification pipeline strategies and db helper
from services.pipeline import db_service
from services.pipeline.retrieval import ChromaDBRetrievalStrategy
from services.pipeline.confidence_scorer import ThresholdDifferenceConfidenceScorer
from services.pipeline.summary_generator import GeminiSummaryGenerator
from services.pipeline.reasoning_engine import GeminiReasoningEngine
from services.pipeline.orchestrator import ClassificationOrchestrator

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ClassifierServer")

# --- Tunables --------------------------------------------------------------
MIN_EXAMPLES = int(os.getenv("MIN_EXAMPLES_PER_CATEGORY", "15"))
TOP_K = int(os.getenv("RETRIEVAL_TOP_K", "8"))

SOURCE_NAME = {
    classifier_pb2.MANUAL: "manual",
    classifier_pb2.ACCEPTED: "accepted",
    classifier_pb2.CORRECTED: "corrected",
}

# Instantiate modular strategies and orchestrator
retrieval_strategy = ChromaDBRetrievalStrategy()
confidence_scorer = ThresholdDifferenceConfidenceScorer()
summary_generator = GeminiSummaryGenerator()
reasoning_engine = GeminiReasoningEngine()

orchestrator = ClassificationOrchestrator(
    retrieval_strategy=retrieval_strategy,
    confidence_scorer=confidence_scorer,
    summary_generator=summary_generator,
    reasoning_engine=reasoning_engine
)


class EmailClassifierServicer(classifier_pb2_grpc.EmailClassifierServicer):

    def EmbedAndStore(self, request, context):
        try:
            logger.info(f"EmbedAndStore request received for user: {request.user_id}, category: {request.category}")
            email = request.email
            vector = embedder.embed_document(email.subject, email.body_snippet, email.sender)

            prev_count = chroma_store.category_count(request.user_id, request.category)

            chroma_store.add_example(
                user_email=request.user_id,
                email_id=email.email_id,
                embedding=vector,
                category=request.category,
                subject=email.subject,
                sender=email.sender,
                source=SOURCE_NAME.get(request.source, "manual"),
            )

            # Lazy update queue: append email to pending updates list in MongoDB
            db_service.add_to_pending_queue(request.user_id, request.category, email.email_id)

            new_count = prev_count + 1
            threshold_crossed = prev_count < MIN_EXAMPLES <= new_count

            return classifier_pb2.StoreResponse(
                success=True,
                category_count=new_count,
                threshold_crossed=threshold_crossed,
            )
        except Exception as e:
            logger.error(f"EmbedAndStore error: {e}")
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(str(e))
            return classifier_pb2.StoreResponse(success=False, category_count=0, threshold_crossed=False)

    def Classify(self, request, context):
        try:
            logger.info(f"Classify request received for user: {request.user_id}, email subject: {request.email.subject}")
            email = request.email
            query_vector = embedder.embed_query(email.subject, email.body_snippet, email.sender)

            # Route through the Classification Orchestrator pipeline
            result = orchestrator.classify(
                user_email=request.user_id,
                email_subject=email.subject,
                email_body=email.body_snippet,
                email_sender=email.sender,
                email_embedding=query_vector
            )

            predicted_category = result["predicted_category"]
            confidence = result["confidence"]
            needs_review = result["needs_review"]
            reasoning = result["reasoning"]
            candidate_categories = result.get("candidate_categories", [])
            cold_start = result.get("cold_start", False)

            # Ensure cold start constraints: if a category doesn't have MIN_EXAMPLES, it requires review
            if predicted_category != "Unclassified":
                cat_count = chroma_store.category_count(request.user_id, predicted_category)
                if cat_count < MIN_EXAMPLES:
                    cold_start = True
                    needs_review = True

            return classifier_pb2.ClassifyResponse(
                predicted_category=predicted_category,
                confidence=confidence,
                needs_review=needs_review,
                reasoning=reasoning,
                candidate_categories=candidate_categories,
                cold_start=cold_start,
            )
        except Exception as e:
            logger.error(f"Classify error: {e}")
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(str(e))
            return classifier_pb2.ClassifyResponse(
                predicted_category="",
                confidence=0.0,
                needs_review=True,
                reasoning=f"Internal classification error: {str(e)}",
                cold_start=True,
            )

    def AddFeedback(self, request, context):
        try:
            logger.info(f"AddFeedback request received for user: {request.user_id}, category: {request.correct_category}")
            email = request.email
            source = classifier_pb2.CORRECTED if not request.was_correct else classifier_pb2.ACCEPTED
            vector = embedder.embed_document(email.subject, email.body_snippet, email.sender)

            # If user corrected a prediction, remove example from old category and mark old summary dirty
            if not request.was_correct and request.predicted_category:
                logger.info(f"Correction feedback: Moving email {email.email_id} from {request.predicted_category} to {request.correct_category}")
                chroma_store.delete_example(request.user_id, email.email_id)
                db_service.mark_summary_dirty(request.user_id, request.predicted_category)

            prev_count = chroma_store.category_count(request.user_id, request.correct_category)

            chroma_store.add_example(
                user_email=request.user_id,
                email_id=email.email_id,
                embedding=vector,
                category=request.correct_category,
                subject=email.subject,
                sender=email.sender,
                source=SOURCE_NAME[source],
            )

            # Add to pending summary queue for correct_category in MongoDB
            db_service.add_to_pending_queue(request.user_id, request.correct_category, email.email_id)

            # Synchronize email category state in MongoDB
            db_service.update_email_category(request.user_id, email.email_id, request.correct_category)

            new_count = prev_count + 1
            threshold_crossed = prev_count < MIN_EXAMPLES <= new_count

            return classifier_pb2.FeedbackResponse(
                success=True,
                category_count=new_count,
                threshold_crossed=threshold_crossed,
            )
        except Exception as e:
            logger.error(f"AddFeedback error: {e}")
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(str(e))
            return classifier_pb2.FeedbackResponse(success=False, category_count=0, threshold_crossed=False)

    def GetCategoryStatus(self, request, context):
        try:
            logger.info(f"GetCategoryStatus request received for user: {request.user_id}")
            counts = chroma_store.all_category_counts(request.user_id)
            statuses = []
            for category, count in counts.items():
                enabled = count >= MIN_EXAMPLES
                statuses.append(
                    classifier_pb2.CategoryStatus(
                        category=category,
                        count=count,
                        auto_classify_enabled=enabled,
                        examples_needed=0 if enabled else MIN_EXAMPLES - count,
                    )
                )
            return classifier_pb2.CategoryStatusResponse(categories=statuses)
        except Exception as e:
            logger.error(f"GetCategoryStatus error: {e}")
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(str(e))
            return classifier_pb2.CategoryStatusResponse(categories=[])


def serve():
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    classifier_pb2_grpc.add_EmailClassifierServicer_to_server(
        EmailClassifierServicer(), server
    )
    port = os.getenv("GRPC_PORT", "50052")
    server.add_insecure_port(f"[::]:{port}")
    server.start()
    logger.info(f"=== Classifier Python gRPC Server running on port {port} ===")
    try:
        while True:
            time.sleep(86400)
    except KeyboardInterrupt:
        logger.info("Shutting down gRPC server...")
        server.stop(grace=5)


if __name__ == "__main__":
    serve()
