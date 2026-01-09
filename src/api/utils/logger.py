"""
Logging configuration for the application.
Provides consistent logging setup across all modules.
"""
import logging
import sys
from typing import Optional


def setup_logger(
    name: str,
    level: int = logging.INFO,
    format_string: Optional[str] = None
) -> logging.Logger:
    """
    Sets up and returns a logger with consistent formatting.

    Args:
        name: Name of the logger (typically __name__ from calling module)
        level: Logging level (default: INFO)
        format_string: Custom format string (optional)

    Returns:
        logging.Logger: Configured logger instance
    """
    logger = logging.getLogger(name)
    logger.setLevel(level)

    # Avoid adding handlers multiple times
    if logger.handlers:
        return logger

    # Console handler
    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(level)

    # Default format: timestamp - logger name - level - message
    if format_string is None:
        format_string = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'

    formatter = logging.Formatter(format_string)
    handler.setFormatter(formatter)

    logger.addHandler(handler)

    return logger


# Create a default logger for the API
api_logger = setup_logger('chat_api')
