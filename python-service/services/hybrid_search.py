def reciprocal_rank_fusion(vector_results: list[dict], keyword_results: list[dict], k: int = 60) -> list[tuple[str, float]]:
    """
    Combines dense vector search results and sparse keyword search results
    using Reciprocal Rank Fusion (RRF).
    
    Formula: RRF_Score(doc) = sum( 1 / (k + rank_i) )
    Returns a sorted list of tuples: [(message_id, rrf_score), ...]
    """
    scores = {}

    for rank, item in enumerate(vector_results):
        msg_id = item['message_id']
        scores[msg_id] = scores.get(msg_id, 0.0) + 1.0 / (k + rank + 1)

    for rank, item in enumerate(keyword_results):
        msg_id = item['message_id']
        scores[msg_id] = scores.get(msg_id, 0.0) + 1.0 / (k + rank + 1)

    sorted_results = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    return sorted_results
