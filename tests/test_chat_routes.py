"""
Tests for chat routes.
Tests HTTP endpoints, request validation, and response handling.
"""
import pytest
import json
from unittest.mock import patch, Mock
from src.api.utils.error_handlers import APIError


class TestChatRoutes:
    """Test suite for chat API routes."""

    def test_health_check(self, client):
        """Test the health check endpoint returns 200."""
        response = client.get('/api/health')
        assert response.status_code == 200
        data = response.get_json()
        assert data['status'] == 'ok'
        assert data['service'] == 'chat-api'

    def test_chat_valid_request(self, client, valid_chat_request, mock_streaming_response):
        """Test chat endpoint with valid request."""
        # Mock the ChatService to return streaming response
        with patch('src.api.routes.chat_routes.chat_service') as mock_service:
            # Setup mock to return SSE formatted chunks
            mock_service.stream_response.return_value = [
                'data: {"text":"Hello"}\n\n',
                'data: {"text":" world"}\n\n'
            ]

            response = client.post(
                '/api/chat',
                data=json.dumps(valid_chat_request),
                content_type='application/json'
            )

            assert response.status_code == 200
            assert response.content_type == 'text/event-stream; charset=utf-8'

    def test_chat_empty_message(self, client):
        """Test chat endpoint rejects empty message."""
        response = client.post(
            '/api/chat',
            data=json.dumps({'message': ''}),
            content_type='application/json'
        )

        assert response.status_code == 400
        data = response.get_json()
        assert 'error' in data
        assert 'empty' in data['error'].lower() or 'short' in data['error'].lower()

    def test_chat_whitespace_only_message(self, client):
        """Test chat endpoint rejects whitespace-only message."""
        response = client.post(
            '/api/chat',
            data=json.dumps({'message': '   \n\t  '}),
            content_type='application/json'
        )

        assert response.status_code == 400
        data = response.get_json()
        assert 'error' in data

    def test_chat_message_too_long(self, client):
        """Test chat endpoint rejects message exceeding max length."""
        long_message = 'x' * 10001  # Exceeds MAX_MESSAGE_LENGTH of 10000
        response = client.post(
            '/api/chat',
            data=json.dumps({'message': long_message}),
            content_type='application/json'
        )

        assert response.status_code == 400
        data = response.get_json()
        assert 'error' in data
        assert 'too long' in data['error'].lower() or '10000' in data['error']

    def test_chat_null_bytes_in_message(self, client):
        """Test chat endpoint rejects message with null bytes."""
        response = client.post(
            '/api/chat',
            data=json.dumps({'message': 'test\x00message'}),
            content_type='application/json'
        )

        assert response.status_code == 400
        data = response.get_json()
        assert 'error' in data
        assert 'invalid' in data['error'].lower()

    def test_chat_control_characters_in_message(self, client):
        """Test chat endpoint rejects message with invalid control characters."""
        response = client.post(
            '/api/chat',
            data=json.dumps({'message': 'test\x01message'}),
            content_type='application/json'
        )

        assert response.status_code == 400
        data = response.get_json()
        assert 'error' in data
        assert 'control' in data['error'].lower() or 'invalid' in data['error'].lower()

    def test_chat_missing_message_field(self, client):
        """Test chat endpoint rejects request without message field."""
        response = client.post(
            '/api/chat',
            data=json.dumps({}),
            content_type='application/json'
        )

        assert response.status_code == 400
        data = response.get_json()
        assert 'error' in data

    def test_chat_invalid_json(self, client):
        """Test chat endpoint handles invalid JSON."""
        response = client.post(
            '/api/chat',
            data='invalid json{',
            content_type='application/json'
        )

        assert response.status_code == 400

    def test_chat_wrong_content_type(self, client, valid_chat_request):
        """Test chat endpoint requires application/json content type."""
        response = client.post(
            '/api/chat',
            data=json.dumps(valid_chat_request),
            content_type='text/plain'
        )

        # Should either reject or handle gracefully
        assert response.status_code in [400, 415]

    def test_chat_streaming_format(self, client, valid_chat_request):
        """Test that chat response uses correct SSE format with JSON encoding."""
        with patch('src.api.routes.chat_routes.chat_service') as mock_service:
            # Setup mock to return properly formatted SSE
            mock_service.stream_response.return_value = [
                'data: {"text":"Test"}\n\n',
                'data: {"text":" message"}\n\n'
            ]

            response = client.post(
                '/api/chat',
                data=json.dumps(valid_chat_request),
                content_type='application/json'
            )

            # Get response data
            response_data = response.get_data(as_text=True)

            # Verify SSE format
            assert 'data: ' in response_data
            assert '\n\n' in response_data

            # Verify JSON encoding
            lines = response_data.split('\n\n')
            for line in lines:
                if line.startswith('data: '):
                    json_str = line[6:]  # Remove 'data: ' prefix
                    if json_str:  # Skip empty lines
                        parsed = json.loads(json_str)
                        assert 'text' in parsed

    def test_chat_conversation_context_maintained(self, client, valid_chat_request):
        """Test that conversation context is maintained across messages."""
        with patch('src.api.routes.chat_routes.chat_service') as mock_service, \
             patch('src.api.routes.chat_routes.conversation_manager') as mock_manager:

            mock_service.stream_response.return_value = ['data: {"text":"Response"}\n\n']
            mock_manager.get_messages.return_value = []

            # Send first message
            response1 = client.post(
                '/api/chat',
                data=json.dumps({'message': 'First message'}),
                content_type='application/json'
            )
            assert response1.status_code == 200

            # Verify conversation manager was called to add message
            assert mock_manager.add_message.call_count >= 1

    def test_chat_api_error_handling(self, client, valid_chat_request):
        """Test that API errors during streaming cause connection to close with error."""
        with patch('src.api.routes.chat_routes.chat_service') as mock_service:
            # Simulate API error during streaming
            mock_service.stream_response.side_effect = APIError(
                message='Claude API unavailable',
                code='SERVICE_UNAVAILABLE',
                status_code=503
            )

            # The error during streaming generation causes the exception to propagate
            # In production, this results in connection termination
            # In tests with Flask test client, the exception propagates during response consumption
            with pytest.raises(APIError) as exc_info:
                response = client.post(
                    '/api/chat',
                    data=json.dumps(valid_chat_request),
                    content_type='application/json'
                )
                # Try to consume the response body (triggers generator execution)
                _ = response.get_data()

            assert 'Claude API unavailable' in str(exc_info.value.message)

    @pytest.mark.skip(reason="Rate limiting is globally mocked for testing - test in isolation if needed")
    def test_chat_rate_limiting(self, client, valid_chat_request):
        """Test that rate limiting is applied to chat endpoint."""
        # NOTE: Rate limiting is mocked away in conftest.py to prevent test interference
        # To test rate limiting in isolation, create a separate test file without the mock
        with patch('src.api.routes.chat_routes.chat_service') as mock_service:
            mock_service.stream_response.return_value = ['data: {"text":"OK"}\n\n']

            # Make multiple rapid requests to trigger rate limit
            responses = []
            for _ in range(15):  # Exceeds default limit of 10
                response = client.post(
                    '/api/chat',
                    data=json.dumps(valid_chat_request),
                    content_type='application/json'
                )
                responses.append(response)

            # At least one should be rate limited
            status_codes = [r.status_code for r in responses]
            assert 429 in status_codes

    def test_chat_newlines_preserved_in_streaming(self, client, valid_chat_request):
        """Test that newlines in content are preserved through JSON encoding."""
        with patch('src.api.routes.chat_routes.chat_service') as mock_service:
            # Return content with newlines
            mock_service.stream_response.return_value = [
                'data: {"text":"Line 1\\n\\n"}\n\n',
                'data: {"text":"Line 2\\n"}\n\n',
                'data: {"text":"Line 3"}\n\n'
            ]

            response = client.post(
                '/api/chat',
                data=json.dumps(valid_chat_request),
                content_type='application/json'
            )

            response_data = response.get_data(as_text=True)

            # Parse chunks and verify newlines are in the JSON data, not breaking SSE format
            chunks = []
            for line in response_data.split('\n\n'):
                if line.startswith('data: '):
                    json_str = line[6:]
                    if json_str:
                        parsed = json.loads(json_str)
                        chunks.append(parsed['text'])

            full_text = ''.join(chunks)
            assert '\n\n' in full_text  # Newlines preserved in content
            assert full_text == 'Line 1\n\nLine 2\nLine 3'
