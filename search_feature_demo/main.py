"""
Main entry point for the AI Email Search Service.

Starts both the HTTP (FastAPI/uvicorn) and gRPC servers concurrently.
Initializes all services (embedding model, DB connections) at startup.

Usage:
    python main.py
    python main.py --http-only
    python main.py --grpc-only
"""

from __future__ import annotations

import argparse
import logging
import sys
import threading
import time

import config as cfg


def _setup_logging():
    """Configure structured logging based on config."""
    log_level = getattr(logging, cfg.LOG_LEVEL.upper(), logging.INFO)

    if cfg.LOG_FORMAT == "json":
        try:
            import structlog

            structlog.configure(
                processors=[
                    structlog.contextvars.merge_contextvars,
                    structlog.processors.add_log_level,
                    structlog.processors.TimeStamper(fmt="iso"),
                    structlog.dev.ConsoleRenderer()
                    if cfg.LOG_FORMAT == "console"
                    else structlog.processors.JSONRenderer(),
                ],
                wrapper_class=structlog.make_filtering_bound_logger(log_level),
                context_class=dict,
                logger_factory=structlog.PrintLoggerFactory(),
                cache_logger_on_first_use=True,
            )
        except ImportError:
            # Fall back to standard logging if structlog not installed
            logging.basicConfig(
                level=log_level,
                format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
            )
    else:
        logging.basicConfig(
            level=log_level,
            format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
        )


def warmup_models():
    """Warm up lazy-loaded models to avoid cold-start latency."""
    logger = logging.getLogger("main")
    logger.info("Warming up models (this may take a few seconds)...")
    
    # 1. Spacy (Query Router)
    from router.nl_intent_parser import _get_nlp
    _get_nlp()
    
    # 2. Embedding Model
    from embeddings.embedding_service import get_embedding_service
    get_embedding_service()
    
    # 3. Reranker Model
    from reranking.reranker import _get_model
    _get_model()
    
    # 4. ChromaDB Client (Vector search)
    from retrieval.vector_search import _get_collection
    _get_collection()

    logger.info("Model warm-up complete.")

def start_http_server():
    """Start the FastAPI HTTP server."""
    import uvicorn

    from api.http_server import create_app

    app = create_app()
    logger = logging.getLogger("main")
    logger.info("Starting HTTP server on port %d ...", cfg.HTTP_PORT)

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=cfg.HTTP_PORT,
        log_level=cfg.LOG_LEVEL.lower(),
    )


def start_grpc_server():
    """Start the gRPC server."""
    from grpc_app.server import serve

    logger = logging.getLogger("main")
    logger.info("Starting gRPC server on port %d ...", cfg.GRPC_PORT)
    server = serve(port=cfg.GRPC_PORT)

    try:
        while True:
            time.sleep(86400)
    except KeyboardInterrupt:
        logger.info("Shutting down gRPC server...")
        server.stop(grace=5)


def main():
    """Parse arguments and start servers."""
    parser = argparse.ArgumentParser(
        description="AI Email Search Service — Hybrid Search Engine"
    )
    parser.add_argument(
        "--http-only",
        action="store_true",
        help="Start only the HTTP (FastAPI) server.",
    )
    parser.add_argument(
        "--grpc-only",
        action="store_true",
        help="Start only the gRPC server.",
    )
    args = parser.parse_args()

    _setup_logging()
    logger = logging.getLogger("main")

    logger.info("=" * 60)
    logger.info("  AI Email Search Service")
    logger.info("  Device: %s", cfg.resolve_device())
    logger.info("  HTTP port: %d | gRPC port: %d", cfg.HTTP_PORT, cfg.GRPC_PORT)
    logger.info("=" * 60)

    warmup_models()

    if args.http_only:
        start_http_server()
    elif args.grpc_only:
        start_grpc_server()
    else:
        # Start gRPC in a background thread, HTTP in foreground
        grpc_thread = threading.Thread(target=start_grpc_server, daemon=True)
        grpc_thread.start()
        logger.info("gRPC server started in background thread.")

        # HTTP server runs in foreground (blocks until Ctrl+C)
        start_http_server()


if __name__ == "__main__":
    main()
