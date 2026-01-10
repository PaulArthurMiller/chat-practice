"""
Chat service for Claude API integration.
Handles communication with Anthropic's Claude API and manages streaming responses.
"""
from typing import Generator, List, Dict, Any
import logging
import sys
from anthropic import Anthropic
from src.api.config.config import Config
from src.api.utils.error_handlers import APIError

logger = logging.getLogger(__name__)


class ChatService:
    """
    Service for interacting with Claude API.
    Handles message sending and streaming response generation.
    """

    def __init__(self, api_key: str, model: str = "claude-sonnet-4-5-20250929"):
        """
        Initializes the chat service.

        Args:
            api_key: Anthropic API key
            model: Claude model to use (default: claude-sonnet-4-5-20250929)
                   Note: Model name format uses dashes throughout, e.g.,
                   claude-sonnet-4-5-20250929 (not claude-sonnet-4.5-20250929)
        """
        self.client = Anthropic(api_key=api_key)
        self.model = model
        logger.info(f"ChatService initialized with model={model}")

    def send_message(
        self,
        messages: List[Dict[str, str]],
        stream: bool = True,
        max_tokens: int = 1024
    ) -> Any:
        """
        Sends messages to Claude API.

        Args:
            messages: List of message dictionaries with 'role' and 'content'
            stream: Whether to stream the response (default: True)
            max_tokens: Maximum tokens in response (default: 1024)

        Returns:
            API response (streaming or complete)

        Raises:
            APIError: If API call fails
        """
        try:
            logger.info(f"Sending message to Claude API: message_count={len(messages)}, stream={stream}")

            response = self.client.messages.create(
                model=self.model,
                max_tokens=max_tokens,
                messages=messages,
                stream=stream
            )

            logger.info("Successfully received response from Claude API")
            return response

        except Exception as e:
            logger.error(f"Error calling Claude API: {str(e)}", exc_info=True)
            raise APIError(
                message=f"Failed to communicate with Claude API: {str(e)}",
                code="CLAUDE_API_ERROR",
                status_code=502
            )

    def stream_response(
        self,
        messages: List[Dict[str, str]],
        max_tokens: int = 1024
    ) -> Generator[str, None, None]:
        """
        Streams response from Claude API in SSE format.
        Yields properly formatted SSE data chunks.

        Args:
            messages: List of message dictionaries with 'role' and 'content'
            max_tokens: Maximum tokens in response (default: 1024)

        Yields:
            str: SSE-formatted data chunks (data: {json}\n\n)

        Raises:
            APIError: If streaming fails
        """
        try:
            stream = self.send_message(messages, stream=True, max_tokens=max_tokens)

            logger.info("Starting to stream response")

            chunk_count = 0
            total_length = 0

            # Stream the response text chunks
            for event in stream:
                # Handle different event types from Claude streaming API
                if event.type == 'content_block_delta':
                    if hasattr(event.delta, 'text'):
                        text_chunk = event.delta.text
                        chunk_count += 1
                        total_length += len(text_chunk)

                        # EXPLICIT DEBUG OUTPUT
                        preview = text_chunk[:50].replace('\n', '\\n')
                        print(f"🔵 BACKEND CHUNK {chunk_count}: '{preview}...' (len={len(text_chunk)})", flush=True)
                        sys.stdout.flush()

                        # Format as SSE: data: {content}\n\n
                        sse_chunk = f"data: {text_chunk}\n\n"

                        # Debug the SSE format
                        print(f"🔵 SSE FORMAT: {repr(sse_chunk[:60])}...", flush=True)

                        yield sse_chunk

                        # Log chunk details for debugging
                        logger.debug(f"Chunk #{chunk_count}: {len(text_chunk)} chars | Preview: {text_chunk[:50]}...")

                elif event.type == 'message_stop':
                    logger.info(f"Stream completed: {chunk_count} chunks, {total_length} total chars")
                    break

        except APIError:
            # Re-raise API errors
            raise
        except Exception as e:
            logger.error(f"Error during streaming: {str(e)}", exc_info=True)
            raise APIError(
                message=f"Streaming failed: {str(e)}",
                code="STREAMING_ERROR",
                status_code=500
            )
