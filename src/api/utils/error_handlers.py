"""
Error handling utilities and decorators.
Provides consistent error responses across the API.
"""
from functools import wraps
from typing import Callable, Dict, Any, Tuple
from flask import jsonify
import logging

logger = logging.getLogger(__name__)


class APIError(Exception):
    """
    Base exception for API errors.

    Attributes:
        message: Human-readable error message
        code: Error code for client handling
        status_code: HTTP status code
    """

    def __init__(self, message: str, code: str = 'API_ERROR', status_code: int = 500):
        self.message = message
        self.code = code
        self.status_code = status_code
        super().__init__(self.message)

    def to_dict(self) -> Dict[str, Any]:
        """
        Converts exception to dictionary for JSON response.

        Returns:
            Dict containing error, code, and status
        """
        return {
            'error': self.message,
            'code': self.code,
            'status': self.status_code
        }


def handle_errors(f: Callable) -> Callable:
    """
    Decorator to handle exceptions in route handlers.
    Catches exceptions and returns consistent JSON error responses.

    Args:
        f: The route handler function to wrap

    Returns:
        Wrapped function with error handling
    """
    @wraps(f)
    def decorated_function(*args, **kwargs) -> Any:
        try:
            return f(*args, **kwargs)
        except APIError as e:
            logger.error(f"API Error: {e.message}", exc_info=True)
            return jsonify(e.to_dict()), e.status_code
        except Exception as e:
            logger.error(f"Unexpected error: {str(e)}", exc_info=True)
            error_response = {
                'error': 'An unexpected error occurred',
                'code': 'INTERNAL_ERROR',
                'status': 500
            }
            return jsonify(error_response), 500

    return decorated_function
