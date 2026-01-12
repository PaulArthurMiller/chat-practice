"""
Tests for ChatService.
Tests Claude API integration, message handling, and streaming responses.
"""
import pytest
import json
from unittest.mock import Mock, patch
from src.api.services.chat_service import ChatService
from src.api.utils.error_handlers import APIError


class TestChatService:
    """Test suite for ChatService class."""

    def test_initialization(self):
        """Test ChatService initializes correctly with API key."""
        service = ChatService(api_key='test-key-123')
        assert service.client is not None
        assert service.model == 'claude-sonnet-4-5-20250929'

    def test_send_message_non_streaming(self, chat_service, mock_anthropic_client, sample_messages):
        """Test sending a non-streaming message to Claude API."""
        # Setup mock response
        mock_response = Mock()
        mock_response.content = [Mock(text='This is a test response')]
        mock_anthropic_client.messages.create.return_value = mock_response

        # Call service
        response = chat_service.send_message(sample_messages, stream=False)

        # Verify
        mock_anthropic_client.messages.create.assert_called_once()
        call_kwargs = mock_anthropic_client.messages.create.call_args[1]
        assert call_kwargs['model'] == 'claude-sonnet-4-5-20250929'
        assert call_kwargs['messages'] == sample_messages
        assert call_kwargs['max_tokens'] == 1024
        assert call_kwargs['stream'] is False

    def test_send_message_streaming(self, chat_service, mock_anthropic_client, sample_messages):
        """Test sending a streaming message to Claude API."""
        # Setup mock streaming response
        mock_stream = Mock()
        mock_anthropic_client.messages.create.return_value = mock_stream

        # Call service
        response = chat_service.send_message(sample_messages, stream=True, max_tokens=2048)

        # Verify
        mock_anthropic_client.messages.create.assert_called_once()
        call_kwargs = mock_anthropic_client.messages.create.call_args[1]
        assert call_kwargs['stream'] is True
        assert call_kwargs['max_tokens'] == 2048
        assert response == mock_stream

    def test_send_message_api_error(self, chat_service, mock_anthropic_client, sample_messages):
        """Test handling of API errors from Claude."""
        # Setup mock to raise exception
        mock_anthropic_client.messages.create.side_effect = Exception('API connection failed')

        # Verify exception is raised
        with pytest.raises(APIError) as exc_info:
            chat_service.send_message(sample_messages)

        assert 'Failed to communicate with Claude API' in str(exc_info.value.message)

    def test_stream_response_success(self, chat_service, mock_streaming_response):
        """Test successful streaming response processing."""
        # Mock send_message to return streaming events
        with patch.object(chat_service, 'send_message', return_value=mock_streaming_response):
            # Collect all chunks
            chunks = list(chat_service.stream_response([{'role': 'user', 'content': 'test'}]))

            # Verify chunks are in SSE format with JSON encoding
            assert len(chunks) > 0
            for chunk in chunks:
                assert chunk.startswith('data: ')
                assert chunk.endswith('\n\n')

                # Verify JSON structure
                json_str = chunk[6:-2]  # Remove 'data: ' and '\n\n'
                parsed = json.loads(json_str)
                assert 'text' in parsed
                assert isinstance(parsed['text'], str)

    def test_stream_response_assembles_text(self, chat_service, mock_streaming_response):
        """Test that streaming chunks are properly assembled."""
        with patch.object(chat_service, 'send_message', return_value=mock_streaming_response):
            # Collect and parse all chunks
            full_text = ''
            for chunk in chat_service.stream_response([{'role': 'user', 'content': 'test'}]):
                json_str = chunk[6:-2]
                parsed = json.loads(json_str)
                full_text += parsed['text']

            # Verify complete message
            assert full_text == 'Hello world!'

    def test_stream_response_json_encoding_preserves_newlines(self, chat_service):
        """Test that JSON encoding properly handles content with newlines."""
        # Create mock events with newlines
        class MockDelta:
            def __init__(self, text):
                self.text = text

        class MockEvent:
            def __init__(self, event_type, text=None):
                self.type = event_type
                if text:
                    self.delta = MockDelta(text)

        mock_events = [
            MockEvent('content_block_delta', 'Line 1\n\n'),
            MockEvent('content_block_delta', 'Line 2\n'),
            MockEvent('content_block_delta', 'Line 3'),
            MockEvent('message_stop')
        ]

        with patch.object(chat_service, 'send_message', return_value=mock_events):
            # Collect chunks
            chunks = list(chat_service.stream_response([{'role': 'user', 'content': 'test'}]))

            # Parse and verify newlines are preserved
            full_text = ''
            for chunk in chunks:
                json_str = chunk[6:-2]
                parsed = json.loads(json_str)
                full_text += parsed['text']

            assert full_text == 'Line 1\n\nLine 2\nLine 3'

    def test_stream_response_handles_empty_chunks(self, chat_service):
        """Test streaming handles events without text gracefully."""
        class MockEvent:
            def __init__(self, event_type):
                self.type = event_type

        mock_events = [
            MockEvent('content_block_start'),
            MockEvent('content_block_stop'),
            MockEvent('message_stop')
        ]

        with patch.object(chat_service, 'send_message', return_value=mock_events):
            chunks = list(chat_service.stream_response([{'role': 'user', 'content': 'test'}]))

            # Should yield no chunks (no text content)
            assert len(chunks) == 0

    def test_stream_response_api_error(self, chat_service):
        """Test error handling during streaming."""
        with patch.object(chat_service, 'send_message', side_effect=Exception('Stream failed')):
            with pytest.raises(APIError) as exc_info:
                list(chat_service.stream_response([{'role': 'user', 'content': 'test'}]))

            assert 'Streaming failed' in str(exc_info.value.message)
