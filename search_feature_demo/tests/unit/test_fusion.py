"""
Unit tests for Reciprocal Rank Fusion (RRF) math.

Validates the RRF formula, score accumulation for overlapping docs,
filtering by metadata candidates, and edge cases.
"""

from __future__ import annotations

import sys
import os

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from retrieval.fusion import filter_by_metadata_candidates, reciprocal_rank_fusion


class TestRRFBasicMath:
    """Verify the core RRF formula produces correct scores."""

    def test_single_ranker_scores(self):
        """Single ranker: RRF score = 1/(k + rank + 1) for each doc."""
        results = [
            {"message_id": "a", "score": 10.0},
            {"message_id": "b", "score": 5.0},
            {"message_id": "c", "score": 1.0},
        ]
        fused = reciprocal_rank_fusion(results, k=60, top_n=10)

        # Doc "a" at rank 0: score = 1/(60+0+1) = 1/61
        assert len(fused) == 3
        assert fused[0]["message_id"] == "a"
        assert abs(fused[0]["rrf_score"] - 1.0 / 61) < 1e-10

        # Doc "b" at rank 1: score = 1/(60+1+1) = 1/62
        assert fused[1]["message_id"] == "b"
        assert abs(fused[1]["rrf_score"] - 1.0 / 62) < 1e-10

    def test_two_rankers_no_overlap(self):
        """Two rankers with no overlap: each doc gets one RRF contribution."""
        r1 = [{"message_id": "a", "score": 10.0}]
        r2 = [{"message_id": "b", "score": 5.0}]

        fused = reciprocal_rank_fusion(r1, r2, k=60, top_n=10)
        scores = {f["message_id"]: f["rrf_score"] for f in fused}

        # Both should have score = 1/(60+0+1) = 1/61
        assert abs(scores["a"] - 1.0 / 61) < 1e-10
        assert abs(scores["b"] - 1.0 / 61) < 1e-10

    def test_two_rankers_with_overlap(self):
        """
        Overlapping doc should score higher than non-overlapping ones.

        Doc "x" appears at rank 0 in both rankers:
          RRF("x") = 1/(60+1) + 1/(60+1) = 2/61
        Doc "a" appears only in ranker 1 at rank 1:
          RRF("a") = 1/(60+2) = 1/62
        """
        r1 = [
            {"message_id": "x", "score": 10.0},
            {"message_id": "a", "score": 5.0},
        ]
        r2 = [
            {"message_id": "x", "score": 8.0},
            {"message_id": "b", "score": 3.0},
        ]

        fused = reciprocal_rank_fusion(r1, r2, k=60, top_n=10)
        scores = {f["message_id"]: f["rrf_score"] for f in fused}

        assert scores["x"] > scores["a"]
        assert scores["x"] > scores["b"]
        expected_x = 1.0 / 61 + 1.0 / 61
        assert abs(scores["x"] - expected_x) < 1e-10

    def test_k_parameter_effect(self):
        """Higher k values dampen rank differences."""
        r1 = [
            {"message_id": "a", "score": 10.0},
            {"message_id": "b", "score": 5.0},
        ]

        fused_k10 = reciprocal_rank_fusion(r1, k=10, top_n=10)
        fused_k1000 = reciprocal_rank_fusion(r1, k=1000, top_n=10)

        # With k=10: difference between rank 0 and 1 is more pronounced
        diff_k10 = fused_k10[0]["rrf_score"] - fused_k10[1]["rrf_score"]
        diff_k1000 = fused_k1000[0]["rrf_score"] - fused_k1000[1]["rrf_score"]

        assert diff_k10 > diff_k1000


class TestRRFTopN:
    """Verify top_n truncation."""

    def test_top_n_limits_output(self):
        items = [{"message_id": f"doc{i}", "score": 100 - i} for i in range(20)]
        fused = reciprocal_rank_fusion(items, k=60, top_n=5)
        assert len(fused) == 5

    def test_top_n_larger_than_input(self):
        items = [{"message_id": "a", "score": 1.0}]
        fused = reciprocal_rank_fusion(items, k=60, top_n=100)
        assert len(fused) == 1


class TestRRFEdgeCases:
    """Edge case tests."""

    def test_empty_input(self):
        fused = reciprocal_rank_fusion([], k=60, top_n=10)
        assert fused == []

    def test_single_doc_single_ranker(self):
        fused = reciprocal_rank_fusion(
            [{"message_id": "only", "score": 1.0}], k=60, top_n=10
        )
        assert len(fused) == 1
        assert fused[0]["message_id"] == "only"

    def test_three_rankers(self):
        """RRF works with more than two rankers."""
        r1 = [{"message_id": "a", "score": 10.0}]
        r2 = [{"message_id": "a", "score": 8.0}]
        r3 = [{"message_id": "a", "score": 6.0}]

        fused = reciprocal_rank_fusion(r1, r2, r3, k=60, top_n=10)
        expected = 3.0 / 61  # Three contributions from rank 0
        assert abs(fused[0]["rrf_score"] - expected) < 1e-10


class TestMetadataFilter:
    """Tests for the metadata candidate filter."""

    def test_filter_keeps_matching(self):
        fused = [
            {"message_id": "a", "rrf_score": 0.5},
            {"message_id": "b", "rrf_score": 0.3},
            {"message_id": "c", "rrf_score": 0.1},
        ]
        metadata_ids = {"a", "c"}
        filtered = filter_by_metadata_candidates(fused, metadata_ids)

        assert len(filtered) == 2
        assert filtered[0]["message_id"] == "a"
        assert filtered[1]["message_id"] == "c"

    def test_filter_none_passes_all(self):
        fused = [{"message_id": "a"}, {"message_id": "b"}]
        filtered = filter_by_metadata_candidates(fused, None)
        assert len(filtered) == 2

    def test_filter_empty_set_removes_all(self):
        fused = [{"message_id": "a"}, {"message_id": "b"}]
        filtered = filter_by_metadata_candidates(fused, set())
        assert len(filtered) == 0

    def test_filter_preserves_order(self):
        fused = [
            {"message_id": "c", "rrf_score": 0.1},
            {"message_id": "a", "rrf_score": 0.5},
            {"message_id": "b", "rrf_score": 0.3},
        ]
        metadata_ids = {"a", "b", "c"}
        filtered = filter_by_metadata_candidates(fused, metadata_ids)
        # Order should be preserved (c, a, b) — same as input
        assert [f["message_id"] for f in filtered] == ["c", "a", "b"]
