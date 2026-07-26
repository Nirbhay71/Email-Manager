# Search Pipeline Benchmark Results

**Corpus**: 100000

## Latency
| Stage | p95 (ms) |
|---|---|
| routing | 6.23 |
| metadata | 168.61 |
| bm25 | 93.89 |
| vector | 356.06 |
| fusion | 2.31 |
| fetch | 21.27 |
| rerank | 1269.14 |
| total_e2e | 3312.75 |
| **Total** | **3312.75** |
