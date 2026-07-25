"""
Unit tests for the query result cache.

Tests LRU eviction, TTL expiry, per-user invalidation,
deterministic key generation, and cache hit/miss behavior.
"""

from __future__ import annotations

import sys
import os
import time

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from cache.query_cache import InMemoryQueryCache


class TestCacheKeyGeneration:
    """Tests for deterministic cache key generation."""

    def test_same_inputs_same_key(self):
        k1 = InMemoryQueryCache.make_key("hello", "user@test.com")
        k2 = InMemoryQueryCache.make_key("hello", "user@test.com")
        assert k1 == k2

    def test_different_queries_different_keys(self):
        k1 = InMemoryQueryCache.make_key("hello", "user@test.com")
        k2 = InMemoryQueryCache.make_key("world", "user@test.com")
        assert k1 != k2

    def test_different_users_different_keys(self):
        k1 = InMemoryQueryCache.make_key("hello", "alice@test.com")
        k2 = InMemoryQueryCache.make_key("hello", "bob@test.com")
        assert k1 != k2

    def test_case_insensitive_query(self):
        k1 = InMemoryQueryCache.make_key("Hello World", "user@test.com")
        k2 = InMemoryQueryCache.make_key("hello world", "user@test.com")
        assert k1 == k2

    def test_operators_affect_key(self):
        k1 = InMemoryQueryCache.make_key("hello", "user@test.com", operators={"from": "sarah"})
        k2 = InMemoryQueryCache.make_key("hello", "user@test.com", operators={})
        assert k1 != k2

    def test_limit_offset_affect_key(self):
        k1 = InMemoryQueryCache.make_key("hello", "user@test.com", limit=20)
        k2 = InMemoryQueryCache.make_key("hello", "user@test.com", limit=10)
        assert k1 != k2


class TestCacheHitMiss:
    """Tests for cache get/set behavior."""

    def test_miss_returns_none(self):
        cache = InMemoryQueryCache(max_size=10, ttl_seconds=60)
        assert cache.get("nonexistent") is None

    def test_hit_returns_value(self):
        cache = InMemoryQueryCache(max_size=10, ttl_seconds=60)
        cache.set("key1", {"result": "data"}, user_email="user@test.com")
        assert cache.get("key1") == {"result": "data"}

    def test_overwrite(self):
        cache = InMemoryQueryCache(max_size=10, ttl_seconds=60)
        cache.set("key1", "first", user_email="user@test.com")
        cache.set("key1", "second", user_email="user@test.com")
        assert cache.get("key1") == "second"


class TestCacheTTL:
    """Tests for TTL expiry behavior."""

    def test_ttl_expiry(self):
        cache = InMemoryQueryCache(max_size=10, ttl_seconds=1)
        cache.set("key1", "value", user_email="user@test.com")
        assert cache.get("key1") == "value"

        # Wait for TTL to expire
        time.sleep(1.5)
        assert cache.get("key1") is None


class TestCacheLRU:
    """Tests for LRU eviction."""

    def test_lru_eviction(self):
        cache = InMemoryQueryCache(max_size=3, ttl_seconds=60)
        cache.set("k1", "v1", user_email="user@test.com")
        cache.set("k2", "v2", user_email="user@test.com")
        cache.set("k3", "v3", user_email="user@test.com")

        # Adding a 4th entry should evict the oldest (k1)
        cache.set("k4", "v4", user_email="user@test.com")

        assert cache.get("k1") is None
        assert cache.get("k4") == "v4"


class TestCacheInvalidation:
    """Tests for per-user cache invalidation."""

    def test_invalidate_user(self):
        cache = InMemoryQueryCache(max_size=10, ttl_seconds=60)
        cache.set("k1", "v1", user_email="alice@test.com")
        cache.set("k2", "v2", user_email="alice@test.com")
        cache.set("k3", "v3", user_email="bob@test.com")

        count = cache.invalidate_user("alice@test.com")
        assert count == 2
        assert cache.get("k1") is None
        assert cache.get("k2") is None
        assert cache.get("k3") == "v3"  # Bob's cache untouched

    def test_invalidate_nonexistent_user(self):
        cache = InMemoryQueryCache(max_size=10, ttl_seconds=60)
        count = cache.invalidate_user("nobody@test.com")
        assert count == 0

    def test_clear_all(self):
        cache = InMemoryQueryCache(max_size=10, ttl_seconds=60)
        cache.set("k1", "v1", user_email="user@test.com")
        cache.set("k2", "v2", user_email="user@test.com")
        cache.clear()
        assert cache.get("k1") is None
        assert cache.get("k2") is None
