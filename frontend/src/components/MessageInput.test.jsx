/**
 * Tests for MessageInput component.
 * Tests user input, validation, character counter, and form submission.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MessageInput } from './MessageInput';

describe('MessageInput Component', () => {
  const mockOnSendMessage = jest.fn();
  const MAX_MESSAGE_LENGTH = 10000;

  beforeEach(() => {
    mockOnSendMessage.mockClear();
  });

  test('renders textarea and send button', () => {
    render(<MessageInput onSendMessage={mockOnSendMessage} disabled={false} />);

    expect(screen.getByPlaceholderText(/Type your message here/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
  });

  test('sends message when send button clicked', async () => {
    const user = userEvent.setup();
    render(<MessageInput onSendMessage={mockOnSendMessage} disabled={false} />);

    const textarea = screen.getByPlaceholderText(/Type your message here/i);
    const sendButton = screen.getByRole('button', { name: /send/i });

    await user.type(textarea, 'Test message');
    await user.click(sendButton);

    expect(mockOnSendMessage).toHaveBeenCalledWith('Test message');
    expect(mockOnSendMessage).toHaveBeenCalledTimes(1);
  });

  test('clears input after sending message', async () => {
    const user = userEvent.setup();
    render(<MessageInput onSendMessage={mockOnSendMessage} disabled={false} />);

    const textarea = screen.getByPlaceholderText(/Type your message here/i);
    const sendButton = screen.getByRole('button', { name: /send/i });

    await user.type(textarea, 'Test message');
    await user.click(sendButton);

    expect(textarea.value).toBe('');
  });

  test('does not send empty message', async () => {
    const user = userEvent.setup();
    render(<MessageInput onSendMessage={mockOnSendMessage} disabled={false} />);

    const sendButton = screen.getByRole('button', { name: /send/i });
    await user.click(sendButton);

    expect(mockOnSendMessage).not.toHaveBeenCalled();
  });

  test('does not send whitespace-only message', async () => {
    const user = userEvent.setup();
    render(<MessageInput onSendMessage={mockOnSendMessage} disabled={false} />);

    const textarea = screen.getByPlaceholderText(/Type your message here/i);
    const sendButton = screen.getByRole('button', { name: /send/i });

    await user.type(textarea, '   ');
    await user.click(sendButton);

    expect(mockOnSendMessage).not.toHaveBeenCalled();
  });

  test('send button is disabled when input is empty', () => {
    render(<MessageInput onSendMessage={mockOnSendMessage} disabled={false} />);

    const sendButton = screen.getByRole('button', { name: /send/i });
    expect(sendButton).toBeDisabled();
  });

  test('send button is enabled when input has text', async () => {
    const user = userEvent.setup();
    render(<MessageInput onSendMessage={mockOnSendMessage} disabled={false} />);

    const textarea = screen.getByPlaceholderText(/Type your message here/i);
    const sendButton = screen.getByRole('button', { name: /send/i });

    await user.type(textarea, 'Test');
    expect(sendButton).not.toBeDisabled();
  });

  test('send button is disabled when component is disabled', () => {
    render(<MessageInput onSendMessage={mockOnSendMessage} disabled={true} />);

    const sendButton = screen.getByRole('button');
    expect(sendButton).toBeDisabled();
  });

  test('textarea is disabled when component is disabled', () => {
    render(<MessageInput onSendMessage={mockOnSendMessage} disabled={true} />);

    const textarea = screen.getByPlaceholderText(/Waiting for response/i);
    expect(textarea).toBeDisabled();
  });

  test('displays character counter', async () => {
    const user = userEvent.setup();
    render(<MessageInput onSendMessage={mockOnSendMessage} disabled={false} />);

    const textarea = screen.getByPlaceholderText(/Type your message here/i);

    // Initially shows 0
    expect(screen.getByText(/0.*10,000/)).toBeInTheDocument();

    // Updates as user types
    await user.type(textarea, 'Hello');
    expect(screen.getByText(/5.*10,000/)).toBeInTheDocument();
  });

  test('character counter shows warning color near limit', async () => {
    const user = userEvent.setup();
    render(<MessageInput onSendMessage={mockOnSendMessage} disabled={false} />);

    const textarea = screen.getByPlaceholderText(/Type your message here/i);

    // Type message approaching limit (90%+)
    const longMessage = 'x'.repeat(9500);
    await user.type(textarea, longMessage);

    const counter = screen.getByText(/9,500.*10,000/);
    expect(counter).toHaveClass('text-yellow-600');
  });

  test('character counter shows error color over limit', async () => {
    const user = userEvent.setup();
    render(<MessageInput onSendMessage={mockOnSendMessage} disabled={false} />);

    const textarea = screen.getByPlaceholderText(/Type your message here/i);

    // Type message over limit
    const tooLong = 'x'.repeat(10001);
    await user.type(textarea, tooLong);

    const counter = screen.getByText(/10,001.*10,000/);
    expect(counter).toHaveClass('text-red-600');
  });

  test('shows warning message when over limit', async () => {
    const user = userEvent.setup();
    render(<MessageInput onSendMessage={mockOnSendMessage} disabled={false} />);

    const textarea = screen.getByPlaceholderText(/Type your message here/i);

    // Type message over limit
    const tooLong = 'x'.repeat(10001);
    await user.type(textarea, tooLong);

    expect(screen.getByText(/Too long/i)).toBeInTheDocument();
  });

  test('disables send button when message is too long', async () => {
    const user = userEvent.setup();
    render(<MessageInput onSendMessage={mockOnSendMessage} disabled={false} />);

    const textarea = screen.getByPlaceholderText(/Type your message here/i);
    const sendButton = screen.getByRole('button', { name: /send/i });

    // Type message over limit
    const tooLong = 'x'.repeat(10001);
    await user.type(textarea, tooLong);

    expect(sendButton).toBeDisabled();
  });

  test('does not send message when over length limit', async () => {
    const user = userEvent.setup();
    render(<MessageInput onSendMessage={mockOnSendMessage} disabled={false} />);

    const textarea = screen.getByPlaceholderText(/Type your message here/i);

    // Type message over limit and try to submit
    const tooLong = 'x'.repeat(10001);
    await user.type(textarea, tooLong);

    // Try submitting form
    fireEvent.submit(textarea.closest('form'));

    expect(mockOnSendMessage).not.toHaveBeenCalled();
  });

  test('sends message on Enter key', async () => {
    const user = userEvent.setup();
    render(<MessageInput onSendMessage={mockOnSendMessage} disabled={false} />);

    const textarea = screen.getByPlaceholderText(/Type your message here/i);

    await user.type(textarea, 'Test message{Enter}');

    expect(mockOnSendMessage).toHaveBeenCalledWith('Test message');
  });

  test('adds newline on Shift+Enter', async () => {
    const user = userEvent.setup();
    render(<MessageInput onSendMessage={mockOnSendMessage} disabled={false} />);

    const textarea = screen.getByPlaceholderText(/Type your message here/i);

    await user.type(textarea, 'Line 1{Shift>}{Enter}{/Shift}Line 2');

    expect(textarea.value).toContain('\n');
    expect(mockOnSendMessage).not.toHaveBeenCalled();
  });

  test('displays keyboard shortcut hint', () => {
    render(<MessageInput onSendMessage={mockOnSendMessage} disabled={false} />);

    expect(screen.getByText(/Enter.*to send/i)).toBeInTheDocument();
    expect(screen.getByText(/Shift.*Enter/i)).toBeInTheDocument();
  });

  test('shows loading state when disabled', () => {
    render(<MessageInput onSendMessage={mockOnSendMessage} disabled={true} />);

    expect(screen.getByText(/Sending/i)).toBeInTheDocument();
  });

  test('preserves message content with newlines', async () => {
    const user = userEvent.setup();
    render(<MessageInput onSendMessage={mockOnSendMessage} disabled={false} />);

    const textarea = screen.getByPlaceholderText(/Type your message here/i);
    const sendButton = screen.getByRole('button', { name: /send/i });

    const multilineMessage = 'Line 1\n\nLine 2\nLine 3';
    await user.type(textarea, multilineMessage);
    await user.click(sendButton);

    expect(mockOnSendMessage).toHaveBeenCalledWith(multilineMessage);
  });

  test('handles maximum valid length message', async () => {
    const user = userEvent.setup();
    render(<MessageInput onSendMessage={mockOnSendMessage} disabled={false} />);

    const textarea = screen.getByPlaceholderText(/Type your message here/i);
    const sendButton = screen.getByRole('button', { name: /send/i });

    // Exactly max length
    const maxMessage = 'x'.repeat(MAX_MESSAGE_LENGTH);
    await user.type(textarea, maxMessage);
    await user.click(sendButton);

    expect(mockOnSendMessage).toHaveBeenCalledWith(maxMessage);
    expect(sendButton).not.toBeDisabled();
  });

  test('character counter uses locale-formatted numbers', async () => {
    const user = userEvent.setup();
    render(<MessageInput onSendMessage={mockOnSendMessage} disabled={false} />);

    const textarea = screen.getByPlaceholderText(/Type your message here/i);

    await user.type(textarea, 'x'.repeat(1000));

    // Should show "1,000" not "1000"
    expect(screen.getByText(/1,000.*10,000/)).toBeInTheDocument();
  });
});
