"""
Rate limiting decorator for API endpoints.
Prevents excessive API calls within a time window.
"""
from functools import wraps
from typing import Callable, Dict
from time import time
import logging

logger = logging.getLogger(__name__)


class RateLimiter:
    """
    Simple in-memory rate limiter.
    Tracks API calls per identifier (e.g., IP address).

    Note: This is a basic implementation. For production, consider
    using Redis or a proper rate limiting library.
    """

    def __init__(self, max_calls: int, period: int):
        """
        Initializes the rate limiter.

        Args:
            max_calls: Maximum number of calls allowed
            period: Time period in seconds
        """
        self.max_calls = max_calls
        self.period = period
        self.calls: Dict[str, list] = {}

    def is_allowed(self, identifier: str) -> bool:
        """
        Checks if a request should be allowed.

        Args:
            identifier: Unique identifier for the requester (e.g., IP)

        Returns:
            bool: True if request is allowed, False if rate limited
        """
        now = time()

        # Initialize or get call history for this identifier
        if identifier not in self.calls:
            self.calls[identifier] = []

        # Remove old calls outside the time window
        self.calls[identifier] = [
            call_time for call_time in self.calls[identifier]
            if now - call_time < self.period
        ]

        # Check if under limit
        if len(self.calls[identifier]) < self.max_calls:
            self.calls[identifier].append(now)
            return True

        logger.warning(f"Rate limit exceeded for {identifier}")
        return False


def rate_limit(max_calls: int, period: int) -> Callable:
    """
    Decorator factory for rate limiting endpoints.

    Args:
        max_calls: Maximum number of calls allowed
        period: Time period in seconds

    Returns:
        Decorator function
    """
    limiter = RateLimiter(max_calls, period)

    def decorator(f: Callable) -> Callable:
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Use a simple identifier (could be enhanced with request.remote_addr)
            identifier = 'default'

            if not limiter.is_allowed(identifier):
                from flask import jsonify
                return jsonify({
                    'error': 'Rate limit exceeded',
                    'code': 'RATE_LIMIT_EXCEEDED',
                    'status': 429
                }), 429

            return f(*args, **kwargs)

        return decorated_function

    return decorator
