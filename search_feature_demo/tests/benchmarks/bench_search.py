"""
Benchmark suite for the search pipeline.
Modified to seed ai_email_manager and ChromaDB, and benchmark all stages.
"""

from __future__ import annotations

import argparse
import os
import random
import shutil
import string
import sys
import tempfile
import time
from datetime import datetime, timedelta
from pathlib import Path

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

def _percentile(data: list[float], pct: int) -> float:
    if not data:
        return 0.0
    sorted_data = sorted(data)
    k = (len(sorted_data) - 1) * pct / 100
    f = int(k)
    c = f + 1
    if c >= len(sorted_data):
        return sorted_data[f]
    return sorted_data[f] + (k - f) * (sorted_data[c] - sorted_data[f])

SENDERS = ["sarah@company.com", "john@partner.org", "alice@startup.io", "bob@university.edu"]
SUBJECTS = ["Q3 Budget Review", "Meeting Notes", "Internship Deadline", "Project Update"]
QUERIES = ["budget review Q3", "from:sarah meeting notes", "project update status"]

def seed_mongo(corpus_size: int, db_name: str, user_email: str):
    import config as cfg
    from pymongo import MongoClient
    import chromadb
    from embeddings.embedding_service import get_embedding_service

    client = MongoClient("mongodb://localhost:27017")
    db = client[db_name]
    db.drop_collection("emails")
    coll = db["emails"]

    chroma_client = chromadb.PersistentClient(path=cfg.CHROMA_PERSIST_DIR)
    try:
        chroma_client.delete_collection("emails")
    except:
        pass
    chroma_coll = chroma_client.create_collection("emails", metadata={"hnsw:space": "cosine"})

    embedder = get_embedding_service()
    batch_size = 1000
    base_date = datetime(2024, 1, 1)
    total_inserted = 0

    print(f"  Seeding {corpus_size} emails into MongoDB ({db_name}) and ChromaDB...")

    while total_inserted < corpus_size:
        batch = []
        texts_to_embed = []
        ids = []
        metadatas = []

        chunk = min(batch_size, corpus_size - total_inserted)
        for i in range(chunk):
            idx = total_inserted + i
            suffix = "".join(random.choices(string.ascii_lowercase, k=6))
            msg_id = f"bench-{idx:07d}-{suffix}"
            if idx == 500:
                subj = "Urgent: Q3 Budget Review Meeting"
                body = "Please review the Q3 budget report before our finance meeting tomorrow. The budget review is critical."
            else:
                subj = f"Email {idx} " + random.choice(SUBJECTS)
                words = random.choices(["finance", "meeting", "notes", "project", "update", "deadline", "internship", "report", "urgent", "approved", "declined", "attach", "file", "invoice"], k=5)
                body = f"Email body content {idx}. " + " ".join(words)
            
            # Mongo document
            batch.append({
                "userEmail": user_email,
                "messageId": msg_id,
                "from": random.choice(SENDERS),
                "to": user_email,
                "subject": subj,
                "body": body,
                "createdAt": base_date + timedelta(days=idx % 365, hours=random.randint(0, 23)),
                "updatedAt": base_date + timedelta(days=idx % 365, hours=random.randint(0, 23)),
                "detectedDate": None,
                "calendarEventId": None,
                "smsSent": False,
            })
            
            # ChromaDB
            texts_to_embed.append(f"{subj} {body}")
            ids.append(msg_id)
            metadatas.append({"user_email": user_email, "subject": subj})

        coll.insert_many(batch)
        
        t0 = time.perf_counter()
        embeddings = embedder.embed_documents(texts_to_embed)
        t_embed = time.perf_counter() - t0
        print(f"  > Embedded {chunk} docs in {t_embed:.2f}s ({chunk/t_embed:.1f} docs/s)")

        chroma_coll.add(
            embeddings=embeddings,
            documents=texts_to_embed,
            metadatas=metadatas,
            ids=ids
        )

        total_inserted += chunk

    coll.create_index([("subject", "text"), ("body", "text")])
    coll.create_index("userEmail")
    print(f"  ✓ Seeded {total_inserted} emails.")
    return client

def run_benchmarks(corpus_size: int):
    import platform
    import config as cfg

    db_name = "ai_email_manager" # Ensure we point to the real database
    user_email = "bench@test.com"

    # Remove CPU override to allow GPU if available
    # os.environ["DEVICE"] = "cpu"

    client = seed_mongo(corpus_size, db_name, user_email)

    from pipeline.search_pipeline import SearchPipeline
    from router.models import SearchQuery
    from router.query_router import route_query
    from main import warmup_models

    pipeline = SearchPipeline()

    metadata_times = []
    bm25_times = []
    routing_times = []
    vector_times = []
    fusion_times = []
    fetch_times = []
    rerank_times = []
    total_times = []

    warmup_runs = 1
    bench_runs = 5
    print(f"\n  Running benchmarks ({bench_runs} iterations per query)...")

    warmup_models()

    for query_text in QUERIES:
        for run_idx in range(warmup_runs + bench_runs):
            is_warmup = run_idx < warmup_runs

            t0 = time.perf_counter()
            resp = pipeline.search(query_text, user_email, limit=20, offset=0)
            total_time = (time.perf_counter() - t0) * 1000

            if not is_warmup:
                timings = resp.timings
                routing_times.append(timings.routing_ms)
                metadata_times.append(timings.metadata_ms)
                bm25_times.append(timings.bm25_ms)
                vector_times.append(timings.vector_ms)
                fusion_times.append(timings.fusion_ms)
                fetch_times.append(timings.fetch_ms)
                rerank_times.append(timings.rerank_ms)
                total_times.append(timings.total_ms)

    results = {
        "corpus_size": corpus_size,
        "platform": platform.platform(),
        "processor": platform.processor(),
        "python": platform.python_version(),
        "queries_run": len(QUERIES) * bench_runs,
        "stages": {
            "routing": _calc_stats(routing_times),
            "metadata": _calc_stats(metadata_times),
            "bm25": _calc_stats(bm25_times),
            "vector": _calc_stats(vector_times),
            "fusion": _calc_stats(fusion_times),
            "fetch": _calc_stats(fetch_times),
            "rerank": _calc_stats(rerank_times),
            "total_e2e": _calc_stats(total_times),
        },
    }

    _write_results_md(results)
    print("\n  ── Benchmark Results ──")
    print(f"    routing     : p50={results['stages']['routing']['p50_ms']:8.2f} ms, p95={results['stages']['routing']['p95_ms']:8.2f} ms")
    print(f"    metadata    : p50={results['stages']['metadata']['p50_ms']:8.2f} ms, p95={results['stages']['metadata']['p95_ms']:8.2f} ms")
    print(f"    bm25        : p50={results['stages']['bm25']['p50_ms']:8.2f} ms, p95={results['stages']['bm25']['p95_ms']:8.2f} ms")
    print(f"    vector      : p50={results['stages']['vector']['p50_ms']:8.2f} ms, p95={results['stages']['vector']['p95_ms']:8.2f} ms")
    print(f"    fusion      : p50={results['stages']['fusion']['p50_ms']:8.2f} ms, p95={results['stages']['fusion']['p95_ms']:8.2f} ms")
    print(f"    fetch       : p50={results['stages']['fetch']['p50_ms']:8.2f} ms, p95={results['stages']['fetch']['p95_ms']:8.2f} ms")
    print(f"    rerank      : p50={results['stages']['rerank']['p50_ms']:8.2f} ms, p95={results['stages']['rerank']['p95_ms']:8.2f} ms")
    print("")
    print(f"    Measured e2e p95: {results['stages']['total_e2e']['p95_ms']:.2f} ms")

def _calc_stats(data):
    if not data: return {"p50_ms": 0, "p95_ms": 0, "avg_ms": 0}
    return {
        "p50_ms": round(_percentile(data, 50), 2),
        "p95_ms": round(_percentile(data, 95), 2),
        "avg_ms": round(sum(data) / len(data), 2),
    }

def _write_results_md(results: dict):
    output_path = os.path.join(os.path.dirname(__file__), "results.md")
    lines = [f"# Search Pipeline Benchmark Results", "", f"**Corpus**: {results['corpus_size']}"]
    lines.extend(["", "## Latency", "| Stage | p95 (ms) |", "|---|---|"])
    for s, st in results["stages"].items():
        lines.append(f"| {s} | {st['p95_ms']} |")
    lines.append(f"| **Total** | **{results['stages']['total_e2e']['p95_ms']}** |")
    with open(output_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--corpus-size", type=int, default=10000)
    args = parser.parse_args()
    try:
        run_benchmarks(args.corpus_size)
    except Exception as exc:
        print(f"\n  ✗ Benchmark failed: {exc}")
        sys.exit(1)
