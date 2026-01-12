"""
Pytest configuration and shared fixtures.
Provides test fixtures for Flask app, mocked services, and test data.
"""
import pytest
import os
import sys
from unittest.mock import Mock, MagicMock
from flask import Flask

# Set testing environment variables BEFORE imports
os.environ['ANTHROPIC_API_KEY'] = 'test-api-key-12345'
os.environ['FLASK_ENV'] = 'testing'

# Import rate_limiter and replace rate_limit function before app imports it
from src.api.utils import rate_limiter

# Mock rate limiter to disable it for tests
def mock_rate_limit(*args, **kwargs):
    """Mock rate limit decorator that does nothing in tests."""
    def decorator(f):
        return f
    return decorator

# Replace the rate_limit function with mock
rate_limiter.rate_limit = mock_rate_limit

# Now import app after patching
from src.api.app import create_app
from src.api.services.chat_service import ChatService
from src.api.services.conversation_manager import ConversationManager
from src.api.config.config import Config


@pytest.fixture
def app(mock_anthropic_client):
    """
    Create and configure a Flask app instance for testing.

    Returns:
        Flask: Configured Flask application in testing mode
    """
    # Create app in testing mode
    app = create_app()
    app.config['TESTING'] = True

    # Replace the chat service with a mocked one
    from src.api.routes import chat_routes
    chat_routes.chat_service.client = mock_anthropic_client

    yield app


@pytest.fixture
def client(app):
    """
    Create a test client for the Flask app.

    Args:
        app: Flask application fixture

    Returns:
        FlaskClient: Test client for making requests
    """
    return app.test_client()


@pytest.fixture
def mock_anthropic_client():
    """
    Create a mocked Anthropic client.

    Returns:
        Mock: Mocked Anthropic client with messages.create method
    """
    mock_client = Mock()
    mock_client.messages = Mock()
    mock_client.messages.create = Mock()
    return mock_client


@pytest.fixture
def mock_streaming_response():
    """
    Create a mock streaming response from Claude API.
    Simulates content_block_delta events with text chunks.

    Returns:
        list: List of mock streaming events
    """
    # Mock event objects
    class MockDelta:
        def __init__(self, text):
            self.text = text

    class MockEvent:
        def __init__(self, event_type, text=None):
            self.type = event_type
            if text:
                self.delta = MockDelta(text)

    # Return a list of mock events (simulates streaming)
    return [
        MockEvent('content_block_start'),
        MockEvent('content_block_delta', 'Hello'),
        MockEvent('content_block_delta', ' '),
        MockEvent('content_block_delta', 'world'),
        MockEvent('content_block_delta', '!'),
        MockEvent('content_block_stop'),
        MockEvent('message_stop')
    ]


@pytest.fixture
def sample_messages():
    """
    Sample message list for testing.

    Returns:
        list: List of message dictionaries
    """
    return [
        {'role': 'user', 'content': 'Hello, how are you?'},
        {'role': 'assistant', 'content': 'I am doing well, thank you!'},
        {'role': 'user', 'content': 'What is 2+2?'}
    ]


@pytest.fixture
def conversation_manager():
    """
    Create a fresh ConversationManager instance.

    Returns:
        ConversationManager: New conversation manager
    """
    return ConversationManager(max_context_messages=10)


@pytest.fixture
def chat_service(mock_anthropic_client):
    """
    Create a ChatService with mocked Anthropic client.

    Args:
        mock_anthropic_client: Mocked Anthropic client fixture

    Returns:
        ChatService: Chat service with mocked client
    """
    service = ChatService(api_key='test-key')
    service.client = mock_anthropic_client
    return service


@pytest.fixture
def valid_chat_request():
    """
    Valid chat request payload for testing.

    Returns:
        dict: Valid request payload
    """
    return {
        'message': 'This is a valid test message.'
    }


@pytest.fixture
def invalid_chat_requests():
    """
    Collection of invalid chat request payloads.

    Returns:
        dict: Dictionary of invalid payloads with descriptions
    """
    return {
        'empty_message': {'message': ''},
        'whitespace_only': {'message': '   '},
        'too_long': {'message': 'x' * 10001},
        'null_bytes': {'message': 'test\x00message'},
        'control_chars': {'message': 'test\x01message'},
        'missing_field': {},
        'wrong_type': {'message': 123}
    }
