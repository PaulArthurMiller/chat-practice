/**
 * Message input component.
 * Handles user input and message submission.
 */

import React, { useState } from 'react';

/**
 * MessageInput component props.
 *
 * @typedef {Object} MessageInputProps
 * @property {(message: string) => void} onSendMessage - Callback when message is sent
 * @property {boolean} disabled - Whether input is disabled
 */

/**
 * Input field for composing and sending messages.
 *
 * @param {MessageInputProps} props
 * @returns {JSX.Element}
 */
export function MessageInput({ onSendMessage, disabled }) {
  const [message, setMessage] = useState('');

  /**
   * Handles form submission.
   * @param {React.FormEvent} e
   */
  const handleSubmit = (e) => {
    e.preventDefault();

    if (message.trim() && !disabled) {
      onSendMessage(message);
      setMessage('');
    }
  };

  /**
   * Handles keyboard shortcuts (Enter to send, Shift+Enter for newline).
   * @param {React.KeyboardEvent<HTMLTextAreaElement>} e
   */
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border-t border-gray-300 p-4">
      <div className="flex space-x-2">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Type your message... (Enter to send, Shift+Enter for newline)"
          className="flex-1 resize-none border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          rows={3}
        />
        <button
          type="submit"
          disabled={disabled || !message.trim()}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          Send
        </button>
      </div>
      <div className="text-xs text-gray-500 mt-2">
        Press Enter to send, Shift+Enter for a new line
      </div>
    </form>
  );
}
