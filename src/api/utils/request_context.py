"""
Request context utilities.
Provides request ID generation and context management for logging.
"""
import uuid
from flask import g, request
from functools import wraps
from typing import Callable, Optional
import logging


def get_request_id() -> str:
    """
    Gets the current request ID from Flask's g object.
    Generates a new one if not present.

    Returns:
        str: The request ID (UUID format)
    """
    if not hasattr(g, 'request_id'):
        g.request_id = str(uuid.uuid4())
    return g.request_id


def add_request_id_to_app(app) -> None:
    """
    Adds request ID middleware to Flask app.
    Generates a unique request ID for each request and stores in g.

    Args:
        app: Flask application instance
    """
    @app.before_request
    def generate_request_id():
        """Generates and stores request ID before each request."""
        g.request_id = str(uuid.uuid4())

    @app.after_request
    def add_request_id_header(response):
        """Adds request ID to response headers for tracing."""
        response.headers['X-Request-ID'] = get_request_id()
        return response


class RequestContextFilter(logging.Filter):
    """
    Logging filter that adds request ID to log records.
    Allows request tracing through logs.
    """

    def filter(self, record):
        """
        Adds request_id to log record if available.

        Args:
            record: Log record to modify

        Returns:
            bool: Always True (doesn't filter out records)
        """
        record.request_id = get_request_id() if hasattr(g, 'request_id') else 'N/A'
        return True
