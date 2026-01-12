"""
Tests for input validation.
Tests boundary conditions, edge cases, and security-related validation.
"""
import pytest
import json


class TestInputValidation:
    """Test suite for input validation rules."""

    def test_min_length_boundary(self, client):
        """Test messages at minimum length boundary."""
        # Exactly 1 character (minimum)
        response = client.post(
            '/api/chat',
            data=json.dumps({'message': 'a'}),
            content_type='application/json'
        )
        assert response.status_code == 200

        # 0 characters (below minimum)
        response = client.post(
            '/api/chat',
            data=json.dumps({'message': ''}),
            content_type='application/json'
        )
        assert response.status_code == 400

    def test_max_length_boundary(self, client):
        """Test messages at maximum length boundary."""
        # Exactly 10000 characters (maximum)
        max_message = 'x' * 10000
        response = client.post(
            '/api/chat',
            data=json.dumps({'message': max_message}),
            content_type='application/json'
        )
        assert response.status_code == 200

        # 10001 characters (over maximum)
        over_max_message = 'x' * 10001
        response = client.post(
            '/api/chat',
            data=json.dumps({'message': over_max_message}),
            content_type='application/json'
        )
        assert response.status_code == 400
        data = response.get_json()
        assert '10000' in data['error']

    def test_whitespace_handling(self, client):
        """Test various whitespace scenarios."""
        # Leading/trailing whitespace with content
        response = client.post(
            '/api/chat',
            data=json.dumps({'message': '  valid message  '}),
            content_type='application/json'
        )
        assert response.status_code == 200

        # Only spaces
        response = client.post(
            '/api/chat',
            data=json.dumps({'message': '     '}),
            content_type='application/json'
        )
        assert response.status_code == 400

        # Only tabs
        response = client.post(
            '/api/chat',
            data=json.dumps({'message': '\t\t\t'}),
            content_type='application/json'
        )
        assert response.status_code == 400

        # Only newlines
        response = client.post(
            '/api/chat',
            data=json.dumps({'message': '\n\n\n'}),
            content_type='application/json'
        )
        assert response.status_code == 400

        # Mixed whitespace
        response = client.post(
            '/api/chat',
            data=json.dumps({'message': ' \t\n \r '}),
            content_type='application/json'
        )
        assert response.status_code == 400

    def test_allowed_control_characters(self, client):
        """Test that allowed control characters (newline, tab, CR) are accepted."""
        # Newline
        response = client.post(
            '/api/chat',
            data=json.dumps({'message': 'Line 1\nLine 2'}),
            content_type='application/json'
        )
        assert response.status_code == 200

        # Tab
        response = client.post(
            '/api/chat',
            data=json.dumps({'message': 'Column1\tColumn2'}),
            content_type='application/json'
        )
        assert response.status_code == 200

        # Carriage return
        response = client.post(
            '/api/chat',
            data=json.dumps({'message': 'Line 1\r\nLine 2'}),
            content_type='application/json'
        )
        assert response.status_code == 200

    def test_disallowed_control_characters(self, client):
        """Test that disallowed control characters are rejected."""
        # Test various control characters (0x00-0x1F except \n, \t, \r)
        disallowed_chars = [
            '\x00',  # Null
            '\x01',  # Start of heading
            '\x02',  # Start of text
            '\x03',  # End of text
            '\x04',  # End of transmission
            '\x07',  # Bell
            '\x08',  # Backspace
            '\x0B',  # Vertical tab
            '\x0C',  # Form feed
            '\x0E',  # Shift out
            '\x0F',  # Shift in
            '\x10',  # Data link escape
            '\x1B',  # Escape
            '\x1F',  # Unit separator
        ]

        for char in disallowed_chars:
            response = client.post(
                '/api/chat',
                data=json.dumps({'message': f'test{char}message'}),
                content_type='application/json'
            )
            assert response.status_code == 400, f"Control character {repr(char)} should be rejected"

    def test_unicode_validation(self, client):
        """Test validation with various unicode characters."""
        # Common unicode
        response = client.post(
            '/api/chat',
            data=json.dumps({'message': 'Hello 世界 🌍'}),
            content_type='application/json'
        )
        assert response.status_code == 200

        # Emoji sequences
        response = client.post(
            '/api/chat',
            data=json.dumps({'message': '👨‍👩‍👧‍👦 family emoji'}),
            content_type='application/json'
        )
        assert response.status_code == 200

        # Right-to-left text
        response = client.post(
            '/api/chat',
            data=json.dumps({'message': 'مرحبا بالعالم'}),
            content_type='application/json'
        )
        assert response.status_code == 200

    def test_special_json_characters(self, client):
        """Test messages containing characters that need JSON escaping."""
        # Quotes
        response = client.post(
            '/api/chat',
            data=json.dumps({'message': 'He said "hello"'}),
            content_type='application/json'
        )
        assert response.status_code == 200

        # Backslashes
        response = client.post(
            '/api/chat',
            data=json.dumps({'message': 'Path: C:\\Users\\Test'}),
            content_type='application/json'
        )
        assert response.status_code == 200

        # Mixed special characters
        response = client.post(
            '/api/chat',
            data=json.dumps({'message': 'Special: \\ " \' / '}),
            content_type='application/json'
        )
        assert response.status_code == 200

    def test_sql_injection_patterns(self, client):
        """Test that potential SQL injection patterns are handled safely."""
        # Note: Our app doesn't use SQL, but test these are accepted as normal text
        sql_patterns = [
            "'; DROP TABLE users; --",
            "1' OR '1'='1",
            "admin'--",
            "1; DELETE FROM messages",
        ]

        for pattern in sql_patterns:
            response = client.post(
                '/api/chat',
                data=json.dumps({'message': pattern}),
                content_type='application/json'
            )
            # Should be accepted as normal text (we don't use SQL)
            assert response.status_code == 200

    def test_xss_patterns(self, client):
        """Test that potential XSS patterns are handled safely."""
        xss_patterns = [
            '<script>alert("XSS")</script>',
            '<img src=x onerror=alert(1)>',
            'javascript:alert(1)',
            '<svg onload=alert(1)>',
        ]

        for pattern in xss_patterns:
            response = client.post(
                '/api/chat',
                data=json.dumps({'message': pattern}),
                content_type='application/json'
            )
            # Should be accepted as normal text (frontend handles escaping)
            assert response.status_code == 200

    def test_message_type_validation(self, client):
        """Test validation of message field type."""
        # Integer instead of string
        response = client.post(
            '/api/chat',
            data=json.dumps({'message': 123}),
            content_type='application/json'
        )
        assert response.status_code == 400

        # List instead of string
        response = client.post(
            '/api/chat',
            data=json.dumps({'message': ['test', 'message']}),
            content_type='application/json'
        )
        assert response.status_code == 400

        # Object instead of string
        response = client.post(
            '/api/chat',
            data=json.dumps({'message': {'text': 'test'}}),
            content_type='application/json'
        )
        assert response.status_code == 400

        # Null
        response = client.post(
            '/api/chat',
            data=json.dumps({'message': None}),
            content_type='application/json'
        )
        assert response.status_code == 400

    def test_multiple_newlines_in_content(self, client):
        """Test that multiple consecutive newlines are preserved."""
        message_with_newlines = "Paragraph 1\n\nParagraph 2\n\n\nParagraph 3"

        response = client.post(
            '/api/chat',
            data=json.dumps({'message': message_with_newlines}),
            content_type='application/json'
        )

        assert response.status_code == 200

    def test_very_long_single_line(self, client):
        """Test validation with very long single line (no newlines)."""
        # 5000 character single line
        long_line = 'a' * 5000

        response = client.post(
            '/api/chat',
            data=json.dumps({'message': long_line}),
            content_type='application/json'
        )

        assert response.status_code == 200

    def test_many_short_lines(self, client):
        """Test message with many short lines."""
        # 100 lines of "test\n"
        many_lines = 'test\n' * 100

        response = client.post(
            '/api/chat',
            data=json.dumps({'message': many_lines}),
            content_type='application/json'
        )

        assert response.status_code == 200

    def test_numeric_string_message(self, client):
        """Test that numeric strings are accepted."""
        response = client.post(
            '/api/chat',
            data=json.dumps({'message': '12345'}),
            content_type='application/json'
        )
        assert response.status_code == 200

    def test_error_message_quality(self, client):
        """Test that validation errors provide clear, helpful messages."""
        # Too long
        response = client.post(
            '/api/chat',
            data=json.dumps({'message': 'x' * 10001}),
            content_type='application/json'
        )
        data = response.get_json()
        assert 'error' in data
        assert 'code' in data
        assert data['code'] == 'MESSAGE_TOO_LONG'

        # Null bytes
        response = client.post(
            '/api/chat',
            data=json.dumps({'message': 'test\x00message'}),
            content_type='application/json'
        )
        data = response.get_json()
        assert data['code'] == 'INVALID_CHARACTERS'
        assert 'null' in data['error'].lower()

        # Control characters
        response = client.post(
            '/api/chat',
            data=json.dumps({'message': 'test\x01message'}),
            content_type='application/json'
        )
        data = response.get_json()
        assert data['code'] == 'INVALID_CHARACTERS'
        assert 'control' in data['error'].lower()
