import sys
import os
import time

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from pipeline.search_pipeline import get_search_pipeline
from main import warmup_models
from retrieval.bm25_search import _corpus_cache

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

def main():
    print("Warming up models...")
    warmup_models()
    
    pipeline = get_search_pipeline()
    user_email = "bench@test.com"
    
    # 20 unique queries to simulate a session
    queries = [f"project update {i}" for i in range(20)]
    
    print("\n--- Session Simulation Benchmark (100k corpus) ---")
    
    # Force clear both caches before starting the session
    pipeline._cache._cache.clear()
    _corpus_cache.clear()
    
    bm25_times = []
    
    for i, query in enumerate(queries):
        # We clear the pipeline cache so we actually run retrieval,
        # but we DO NOT clear _corpus_cache, simulating a session.
        pipeline._cache._cache.clear()
        
        t0 = time.perf_counter()
        resp = pipeline.search(query, user_email, limit=20)
        total_ms = (time.perf_counter() - t0) * 1000
        
        if resp.degraded and "bm25" in resp.stages_timed_out:
            print(f"Query {i+1:<2} | e2e: {total_ms:>7.1f}ms | bm25: TIMED OUT (>2000ms)")
            # Sleep 1 second to allow the background thread to finish building the BM25 corpus cache
            if i == 0:
                print("  [Waiting 1s for background BM25 index build to complete...]")
                time.sleep(1.0)
        else:
            print(f"Query {i+1:<2} | e2e: {total_ms:>7.1f}ms | bm25: {resp.timings.bm25_ms:>6.1f}ms")
            bm25_times.append(resp.timings.bm25_ms)
            
    if bm25_times:
        p50 = _percentile(bm25_times, 50)
        p95 = _percentile(bm25_times, 95)
        print(f"\nSession BM25 Stats (excluding timeout): p50={p50:.1f}ms, p95={p95:.1f}ms")

if __name__ == "__main__":
    main()
