"""
Chat routes Blueprint.
Handles HTTP endpoints for chat functionality.
"""
from flask import Blueprint, request, Response, jsonify
from typing import Dict, Any
import logging
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


def init_chat_services(config: Config) -> None:
    """
    Initializes chat services with configuration.
    Called from app factory.

    Args:
        config: Application configuration
    """
    global chat_service, conversation_manager

    chat_service = ChatService(api_key=config.ANTHROPIC_API_KEY)
    conversation_manager = ConversationManager(
        max_context_messages=config.MAX_CONTEXT_MESSAGES
    )
    logger.info("Chat services initialized")


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
            "message": str  # User's message
        }

    Returns:
        Streaming response (SSE format) with Claude's reply

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

    if not user_message:
        raise APIError(
            message="Message is required",
            code="MISSING_MESSAGE",
            status_code=400
        )

    logger.info(f"Processing message: length={len(user_message)}")

    # Add user message to conversation
    conversation_manager.add_message('user', user_message)

    # Get conversation history
    messages = conversation_manager.get_messages()

    # Stream response from Claude
    def generate():
        """Generator function for SSE streaming."""
        try:
            assistant_message = ""

            for chunk in chat_service.stream_response(messages):
                assistant_message += chunk.replace("data: ", "").replace("\n\n", "")
                yield chunk

            # Add assistant's complete response to conversation
            conversation_manager.add_message('assistant', assistant_message)
            logger.info(f"Completed streaming response: length={len(assistant_message)}")

        except Exception as e:
            logger.error(f"Error in stream generator: {str(e)}", exc_info=True)
            error_data = f"data: {{\"error\": \"Streaming error\"}}\n\n"
            yield error_data

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
