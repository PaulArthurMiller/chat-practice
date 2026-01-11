"""
Chat routes Blueprint.
Handles HTTP endpoints for chat functionality.
"""
from flask import Blueprint, request, Response, jsonify
from typing import Dict, Any
import logging
import json
from src.api.services.chat_service import ChatService
from src.api.services.conversation_manager import ConversationManager
from src.api.config.config import Config
from src.api.utils.error_handlers import handle_errors, APIError
from src.api.utils.rate_limiter import rate_limit

logger = logging.getLogger(__name__)

# Create Blueprint
chat_bp = Blueprint('chat', __name__, url_prefix='/api')

# Initialize services (will be properly initialized in app factory)
chat_service: ChatService = None
conversation_manager: ConversationManager = None
app_config: Config = None


def init_chat_services(config: Config) -> None:
    """
    Initializes chat services with configuration.
    Called from app factory.

    Args:
        config: Application configuration
    """
    global chat_service, conversation_manager, app_config

    app_config = config
    chat_service = ChatService(
        api_key=config.ANTHROPIC_API_KEY,
        model=config.ANTHROPIC_MODEL
    )
    conversation_manager = ConversationManager(
        max_context_messages=config.MAX_CONTEXT_MESSAGES
    )
    logger.info(f"Chat services initialized with model={config.ANTHROPIC_MODEL}, max_tokens={config.MAX_TOKENS}")


@chat_bp.route('/health', methods=['GET'])
def health_check() -> Dict[str, str]:
    """
    Health check endpoint.

    Returns:
        JSON response with status
    """
    return jsonify({'status': 'ok', 'service': 'chat-api'})


@chat_bp.route('/chat', methods=['POST'])
@handle_errors
@rate_limit(max_calls=10, period=60)
def chat() -> Response:
    """
    Chat endpoint for sending messages to Claude.
    Accepts JSON with 'message' field and streams response.

    Request Body:
        {
            "message": str  # User's message (1-10000 chars)
        }

    Returns:
        Streaming response (SSE format with JSON-encoded data) with Claude's reply

    Raises:
        APIError: If request is invalid or processing fails
    """
    logger.info("Received chat request")

    # Validate request
    if not request.is_json:
        raise APIError(
            message="Request must be JSON",
            code="INVALID_REQUEST",
            status_code=400
        )

    data = request.get_json()
    user_message = data.get('message', '').strip()

    # Validate message presence
    if not user_message:
        raise APIError(
            message="Message is required and cannot be empty",
            code="MISSING_MESSAGE",
            status_code=400
        )

    # Validate message length
    MIN_MESSAGE_LENGTH = 1
    MAX_MESSAGE_LENGTH = 10000

    if len(user_message) < MIN_MESSAGE_LENGTH:
        raise APIError(
            message=f"Message must be at least {MIN_MESSAGE_LENGTH} character",
            code="MESSAGE_TOO_SHORT",
            status_code=400
        )

    if len(user_message) > MAX_MESSAGE_LENGTH:
        raise APIError(
            message=f"Message must be no more than {MAX_MESSAGE_LENGTH} characters",
            code="MESSAGE_TOO_LONG",
            status_code=400
        )

    # Sanitize input: check for null bytes and control characters
    if '\x00' in user_message:
        raise APIError(
            message="Message contains invalid characters (null bytes)",
            code="INVALID_CHARACTERS",
            status_code=400
        )

    # Check for problematic control characters (except newline, tab, carriage return)
    control_chars = set(chr(i) for i in range(32)) - {'\n', '\t', '\r'}
    if any(char in user_message for char in control_chars):
        raise APIError(
            message="Message contains invalid control characters",
            code="INVALID_CHARACTERS",
            status_code=400
        )

    logger.info(f"Processing message: length={len(user_message)}")

    # Add user message to conversation
    conversation_manager.add_message('user', user_message)

    # Get conversation history
    messages = conversation_manager.get_messages()

    # Stream response from Claude
    def generate():
        """
        Generator function for SSE streaming.
        Properly handles connection cleanup and error cases.
        """
        assistant_message = []  # Collect chunks as list for efficiency
        chunk_count = 0

        try:
            for chunk in chat_service.stream_response(messages, max_tokens=app_config.MAX_TOKENS):
                # Extract text content from JSON-encoded SSE format: "data: {"text":"..."}\n\n"
                if chunk.startswith("data: ") and chunk.endswith("\n\n"):
                    json_str = chunk[6:-2]  # Remove "data: " prefix and "\n\n" suffix
                    try:
                        parsed = json.loads(json_str)
                        text = parsed.get("text", "")
                        assistant_message.append(text)
                        chunk_count += 1
                    except json.JSONDecodeError as e:
                        logger.error(f"Failed to parse JSON chunk: {json_str[:100]}", exc_info=True)

                yield chunk

            # Add assistant's complete response to conversation
            complete_message = "".join(assistant_message)
            conversation_manager.add_message('assistant', complete_message)
            logger.info(f"Completed streaming: {chunk_count} chunks sent, {len(complete_message)} total chars")

        except APIError as e:
            # API errors are already logged and formatted
            logger.error(f"API error in stream generator: {e.message}", exc_info=True)
            # Don't yield error - let connection close and frontend retry logic handle it
            raise
        except Exception as e:
            # Unexpected errors
            logger.error(f"Unexpected error in stream generator: {str(e)}", exc_info=True)
            # Don't yield error - close connection cleanly
            raise
        finally:
            # Ensure any cleanup happens
            logger.debug(f"Stream generator cleanup completed (sent {chunk_count} chunks)")

    # Return streaming response with SSE headers
    return Response(
        generate(),
        mimetype='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'X-Accel-Buffering': 'no',
            'Connection': 'keep-alive'
        }
    )


@chat_bp.route('/chat/clear', methods=['POST'])
@handle_errors
def clear_conversation() -> Dict[str, str]:
    """
    Clears the conversation history.

    Returns:
        JSON response confirming clear
    """
    conversation_manager.clear()
    logger.info("Conversation history cleared")
    return jsonify({'status': 'ok', 'message': 'Conversation cleared'})
