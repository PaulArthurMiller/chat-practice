"""
Conversation context manager.
Maintains chat history and manages context window for Claude API.
"""
from typing import List, Dict, Any
import logging

logger = logging.getLogger(__name__)


class ConversationManager:
    """
    Manages conversation context for chat sessions.
    Maintains message history and enforces context limits.
    """

    def __init__(self, max_context_messages: int = 10):
        """
        Initializes the conversation manager.

        Args:
            max_context_messages: Maximum number of messages to maintain in context
        """
        self.max_context_messages = max_context_messages
        self.messages: List[Dict[str, str]] = []
        logger.info(f"ConversationManager initialized with max_context={max_context_messages}")

    def add_message(self, role: str, content: str) -> None:
        """
        Adds a message to the conversation history.

        Args:
            role: Message role ('user' or 'assistant')
            content: Message content
        """
        message = {'role': role, 'content': content}
        self.messages.append(message)
        logger.debug(f"Added message: role={role}, content_length={len(content)}")

        # Trim history if exceeds max context
        self._trim_history()

    def _trim_history(self) -> None:
        """
        Trims message history to stay within context limits.
        Removes oldest messages first, but keeps at least one user message.
        """
        if len(self.messages) > self.max_context_messages:
            removed_count = len(self.messages) - self.max_context_messages
            self.messages = self.messages[-self.max_context_messages:]
            logger.info(f"Trimmed {removed_count} messages from history")

    def get_messages(self) -> List[Dict[str, str]]:
        """
        Returns the current conversation history.

        Returns:
            List of message dictionaries with 'role' and 'content' keys
        """
        return self.messages.copy()

    def clear(self) -> None:
        """
        Clears all conversation history.
        """
        message_count = len(self.messages)
        self.messages = []
        logger.info(f"Cleared {message_count} messages from history")

    def get_context_size(self) -> int:
        """
        Returns the current number of messages in context.

        Returns:
            int: Number of messages in history
        """
        return len(self.messages)
