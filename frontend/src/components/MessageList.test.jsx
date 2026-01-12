/**
 * Tests for MessageList component.
 * Tests message rendering, empty state, and auto-scroll behavior.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { MessageList } from './MessageList';

// Mock the Message component
jest.mock('./Message', () => ({
  Message: ({ message }) => (
    <div data-testid={`message-${message.id}`}>
      {message.role}: {message.content}
    </div>
  )
}));

describe('MessageList Component', () => {
  const sampleMessages = [
    { id: '1', role: 'user', content: 'Hello' },
    { id: '2', role: 'assistant', content: 'Hi there!' },
    { id: '3', role: 'user', content: 'How are you?' }
  ];

  test('renders empty state when no messages', () => {
    render(<MessageList messages={[]} isLoading={false} />);

    expect(screen.getByText(/Welcome to Claude Chat!/i)).toBeInTheDocument();
    expect(screen.getByText(/Start a conversation/i)).toBeInTheDocument();
  });

  test('renders all messages when provided', () => {
    render(<MessageList messages={sampleMessages} isLoading={false} />);

    expect(screen.getByTestId('message-1')).toBeInTheDocument();
    expect(screen.getByTestId('message-2')).toBeInTheDocument();
    expect(screen.getByTestId('message-3')).toBeInTheDocument();
  });

  test('does not render empty state when messages exist', () => {
    render(<MessageList messages={sampleMessages} isLoading={false} />);

    expect(screen.queryByText(/Welcome to Claude Chat!/i)).not.toBeInTheDocument();
  });

  test('renders messages in correct order', () => {
    render(<MessageList messages={sampleMessages} isLoading={false} />);

    const messages = screen.getAllByTestId(/message-/);
    expect(messages).toHaveLength(3);
    expect(messages[0]).toHaveTextContent('user: Hello');
    expect(messages[1]).toHaveTextContent('assistant: Hi there!');
    expect(messages[2]).toHaveTextContent('user: How are you?');
  });

  test('renders single message', () => {
    const singleMessage = [{ id: '1', role: 'user', content: 'Test message' }];
    render(<MessageList messages={singleMessage} isLoading={false} />);

    expect(screen.getByTestId('message-1')).toBeInTheDocument();
    expect(screen.getByText(/user: Test message/)).toBeInTheDocument();
  });

  test('handles empty message content', () => {
    const messagesWithEmpty = [
      { id: '1', role: 'user', content: '' }
    ];
    render(<MessageList messages={messagesWithEmpty} isLoading={false} />);

    expect(screen.getByTestId('message-1')).toBeInTheDocument();
  });

  test('handles long message content', () => {
    const longContent = 'x'.repeat(1000);
    const messagesWithLong = [
      { id: '1', role: 'user', content: longContent }
    ];
    render(<MessageList messages={messagesWithLong} isLoading={false} />);

    expect(screen.getByTestId('message-1')).toHaveTextContent(longContent);
  });

  test('handles messages with newlines', () => {
    const multilineContent = 'Line 1\nLine 2\nLine 3';
    const messagesWithNewlines = [
      { id: '1', role: 'user', content: multilineContent }
    ];
    render(<MessageList messages={messagesWithNewlines} isLoading={false} />);

    expect(screen.getByTestId('message-1')).toHaveTextContent(multilineContent);
  });

  test('handles alternating user and assistant messages', () => {
    const alternatingMessages = [
      { id: '1', role: 'user', content: 'Question 1' },
      { id: '2', role: 'assistant', content: 'Answer 1' },
      { id: '3', role: 'user', content: 'Question 2' },
      { id: '4', role: 'assistant', content: 'Answer 2' }
    ];
    render(<MessageList messages={alternatingMessages} isLoading={false} />);

    expect(screen.getAllByTestId(/message-/)).toHaveLength(4);
  });

  test('updates when messages array changes', () => {
    const { rerender } = render(<MessageList messages={[]} isLoading={false} />);

    expect(screen.getByText(/Welcome to Claude Chat!/i)).toBeInTheDocument();

    rerender(<MessageList messages={sampleMessages} isLoading={false} />);

    expect(screen.queryByText(/Welcome to Claude Chat!/i)).not.toBeInTheDocument();
    expect(screen.getAllByTestId(/message-/)).toHaveLength(3);
  });

  test('handles isLoading prop', () => {
    render(<MessageList messages={sampleMessages} isLoading={true} />);

    // Component should still render messages even when loading
    expect(screen.getAllByTestId(/message-/)).toHaveLength(3);
  });

  test('empty state shows helpful suggestions', () => {
    render(<MessageList messages={[]} isLoading={false} />);

    expect(screen.getByText(/Try asking:/i)).toBeInTheDocument();
    expect(screen.getByText(/Explain a concept/i)).toBeInTheDocument();
  });

  test('handles special characters in message content', () => {
    const specialMessages = [
      { id: '1', role: 'user', content: 'Test <script>alert("xss")</script>' },
      { id: '2', role: 'assistant', content: 'Test & special " characters' }
    ];
    render(<MessageList messages={specialMessages} isLoading={false} />);

    expect(screen.getByTestId('message-1')).toBeInTheDocument();
    expect(screen.getByTestId('message-2')).toBeInTheDocument();
  });

  test('handles unicode content', () => {
    const unicodeMessages = [
      { id: '1', role: 'user', content: '你好世界 🌍' },
      { id: '2', role: 'assistant', content: 'مرحبا 👋' }
    ];
    render(<MessageList messages={unicodeMessages} isLoading={false} />);

    expect(screen.getByText(/你好世界 🌍/)).toBeInTheDocument();
    expect(screen.getByText(/مرحبا 👋/)).toBeInTheDocument();
  });

  test('renders without crashing when given empty array', () => {
    expect(() => {
      render(<MessageList messages={[]} isLoading={false} />);
    }).not.toThrow();
  });

  test('renders scrollable container', () => {
    const { container } = render(<MessageList messages={sampleMessages} isLoading={false} />);

    const scrollContainer = container.querySelector('.overflow-y-auto');
    expect(scrollContainer).toBeInTheDocument();
  });
});
