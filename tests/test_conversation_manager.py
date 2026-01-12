"""
Tests for ConversationManager.
Tests conversation history management, context limits, and message operations.
"""
import pytest
from src.api.services.conversation_manager import ConversationManager


class TestConversationManager:
    """Test suite for ConversationManager class."""

    def test_initialization(self):
        """Test ConversationManager initializes with correct defaults."""
        manager = ConversationManager(max_context_messages=10)
        assert manager.max_context_messages == 10
        assert manager.get_context_size() == 0
        assert manager.get_messages() == []

    def test_add_single_message(self, conversation_manager):
        """Test adding a single message to conversation."""
        conversation_manager.add_message('user', 'Hello, world!')

        messages = conversation_manager.get_messages()
        assert len(messages) == 1
        assert messages[0]['role'] == 'user'
        assert messages[0]['content'] == 'Hello, world!'

    def test_add_multiple_messages(self, conversation_manager):
        """Test adding multiple messages maintains order."""
        conversation_manager.add_message('user', 'First message')
        conversation_manager.add_message('assistant', 'Second message')
        conversation_manager.add_message('user', 'Third message')

        messages = conversation_manager.get_messages()
        assert len(messages) == 3
        assert messages[0]['content'] == 'First message'
        assert messages[1]['content'] == 'Second message'
        assert messages[2]['content'] == 'Third message'

    def test_get_messages_returns_copy(self, conversation_manager):
        """Test that get_messages returns a copy, not reference."""
        conversation_manager.add_message('user', 'Test message')

        messages1 = conversation_manager.get_messages()
        messages2 = conversation_manager.get_messages()

        # Verify they're different objects
        assert messages1 is not messages2
        assert messages1 == messages2

        # Modify copy shouldn't affect internal state
        messages1.append({'role': 'user', 'content': 'Injected'})
        assert len(conversation_manager.get_messages()) == 1

    def test_context_trimming(self):
        """Test that history is trimmed when exceeding max context."""
        manager = ConversationManager(max_context_messages=5)

        # Add more messages than max
        for i in range(10):
            manager.add_message('user', f'Message {i}')

        # Verify only last 5 are kept
        messages = manager.get_messages()
        assert len(messages) == 5
        assert messages[0]['content'] == 'Message 5'
        assert messages[4]['content'] == 'Message 9'

    def test_context_trimming_preserves_order(self):
        """Test that trimming preserves message order."""
        manager = ConversationManager(max_context_messages=3)

        manager.add_message('user', 'A')
        manager.add_message('assistant', 'B')
        manager.add_message('user', 'C')
        manager.add_message('assistant', 'D')
        manager.add_message('user', 'E')

        messages = manager.get_messages()
        assert len(messages) == 3
        assert messages[0]['content'] == 'C'
        assert messages[1]['content'] == 'D'
        assert messages[2]['content'] == 'E'

    def test_clear_removes_all_messages(self, conversation_manager):
        """Test that clear removes all messages."""
        conversation_manager.add_message('user', 'Message 1')
        conversation_manager.add_message('assistant', 'Message 2')
        conversation_manager.add_message('user', 'Message 3')

        assert conversation_manager.get_context_size() == 3

        conversation_manager.clear()

        assert conversation_manager.get_context_size() == 0
        assert conversation_manager.get_messages() == []

    def test_get_context_size(self, conversation_manager):
        """Test get_context_size returns accurate count."""
        assert conversation_manager.get_context_size() == 0

        conversation_manager.add_message('user', 'Test 1')
        assert conversation_manager.get_context_size() == 1

        conversation_manager.add_message('assistant', 'Test 2')
        assert conversation_manager.get_context_size() == 2

        conversation_manager.clear()
        assert conversation_manager.get_context_size() == 0

    def test_empty_message_content(self, conversation_manager):
        """Test handling of empty message content."""
        conversation_manager.add_message('user', '')

        messages = conversation_manager.get_messages()
        assert len(messages) == 1
        assert messages[0]['content'] == ''

    def test_long_message_content(self, conversation_manager):
        """Test handling of very long message content."""
        long_content = 'x' * 10000
        conversation_manager.add_message('user', long_content)

        messages = conversation_manager.get_messages()
        assert len(messages) == 1
        assert messages[0]['content'] == long_content

    def test_alternating_roles(self, conversation_manager):
        """Test conversation with alternating user/assistant roles."""
        roles = ['user', 'assistant', 'user', 'assistant', 'user']

        for i, role in enumerate(roles):
            conversation_manager.add_message(role, f'Message {i}')

        messages = conversation_manager.get_messages()
        assert len(messages) == 5

        for i, role in enumerate(roles):
            assert messages[i]['role'] == role

    def test_max_context_of_one(self):
        """Test edge case with max_context_messages=1."""
        manager = ConversationManager(max_context_messages=1)

        manager.add_message('user', 'First')
        assert manager.get_context_size() == 1

        manager.add_message('assistant', 'Second')
        assert manager.get_context_size() == 1

        messages = manager.get_messages()
        assert messages[0]['content'] == 'Second'

    def test_unicode_content(self, conversation_manager):
        """Test handling of unicode characters in content."""
        unicode_content = '你好世界 🌍 Здравствуй мир'
        conversation_manager.add_message('user', unicode_content)

        messages = conversation_manager.get_messages()
        assert messages[0]['content'] == unicode_content

    def test_special_characters_content(self, conversation_manager):
        """Test handling of special characters and escape sequences."""
        special_content = 'Test\n\nNew\tlines\rand\x00special'
        conversation_manager.add_message('user', special_content)

        messages = conversation_manager.get_messages()
        assert messages[0]['content'] == special_content
