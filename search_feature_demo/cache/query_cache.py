"""
Query result cache with LRU eviction and TTL expiry.

Caches final search results keyed by a hash of the normalized query
plus user_email and filters. Provides a simple interface that can be
swapped to Redis later without changing call sites.

Current backend: ``cachetools.TTLCache`` (in-memory).
Future backend: Redis (implement ``RedisQueryCache`` with the same
interface and swap via config flag).
"""

from __future__ import annotations

import hashlib
import json
import logging
from typing import Any, Protocol

from cachetools import TTLCache

import config as cfg

logger = logging.getLogger(__name__)


class QueryCacheBackend(Protocol):
    """
    Protocol defining the cache interface.

    Any backend (in-memory, Redis, Memcached) can implement this
    for drop-in replacement.
    """

    def get(self, key: str) -> Any | None:
        """Retrieve a cached value by key, or None if miss."""
        ...

    def set(self, key: str, value: Any) -> None:
        """Store a value under the given key."""
        ...

    def invalidate_user(self, user_email: str) -> int:
        """Invalidate all cached entries for a given user. Returns count removed."""
        ...

    def clear(self) -> None:
        """Clear the entire cache."""
        ...


class InMemoryQueryCache:
    """
    In-memory LRU + TTL query cache using ``cachetools.TTLCache``.

    Args:
        max_size: Maximum number of cached entries.
        ttl_seconds: Time-to-live for each entry in seconds.
    """

    def __init__(
        self,
        max_size: int = cfg.CACHE_MAX_SIZE,
        ttl_seconds: int = cfg.CACHE_TTL_SECONDS,
    ) -> None:
        self._cache: TTLCache[str, Any] = TTLCache(
            maxsize=max_size, ttl=ttl_seconds
        )
        # Track which keys belong to which user for invalidation
        self._user_keys: dict[str, set[str]] = {}

    @staticmethod
    def make_key(
        query_text: str,
        user_email: str,
        operators: dict | None = None,
        limit: int = 20,
        offset: int = 0,
    ) -> str:
        """
        Produce a deterministic cache key from query parameters.

        Args:
            query_text: The raw or free-text query.
            user_email: User email for isolation.
            operators: Structured operator dict.
            limit: Result limit.
            offset: Pagination offset.

        Returns:
            A hex digest string suitable as a cache key.
        """
        blob = json.dumps(
            {
                "q": query_text.strip().lower(),
                "u": user_email.lower(),
                "ops": operators or {},
                "limit": limit,
                "offset": offset,
            },
            sort_keys=True,
        )
        return hashlib.sha256(blob.encode()).hexdigest()[:24]

    def get(self, key: str) -> Any | None:
        """
        Retrieve a cached search response.

        Args:
            key: Cache key from :meth:`make_key`.

        Returns:
            Cached value or None on miss.
        """
        result = self._cache.get(key)
        if result is not None:
            logger.debug("Cache HIT: key=%s", key)
        else:
            logger.debug("Cache MISS: key=%s", key)
        return result

    def set(self, key: str, value: Any, user_email: str = "") -> None:
        """
        Store a search response in the cache.

        Args:
            key: Cache key from :meth:`make_key`.
            value: The search response to cache.
            user_email: User email for invalidation tracking.
        """
        self._cache[key] = value
        if user_email:
            self._user_keys.setdefault(user_email.lower(), set()).add(key)
        logger.debug("Cache SET: key=%s, user=%s", key, user_email)

    def invalidate_user(self, user_email: str) -> int:
        """
        Remove all cached entries for a specific user.

        Called when new emails are ingested for this user to ensure
        fresh search results.

        Args:
            user_email: The user whose cache entries to remove.

        Returns:
            Number of entries removed.
        """
        keys = self._user_keys.pop(user_email.lower(), set())
        count = 0
        for key in keys:
            if key in self._cache:
                del self._cache[key]
                count += 1
        logger.info(
            "Cache invalidated for user=%s: %d entries removed",
            user_email,
            count,
        )
        return count

    def clear(self) -> None:
        """Clear the entire cache."""
        self._cache.clear()
        self._user_keys.clear()
        logger.info("Cache cleared entirely.")


# Module-level singleton
_cache_instance: InMemoryQueryCache | None = None


def get_query_cache() -> InMemoryQueryCache:
    """
    Return the module-level singleton query cache.

    Initializes on first call.
    """
    global _cache_instance
    if _cache_instance is None:
        _cache_instance = InMemoryQueryCache()
    return _cache_instance
