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
    <form onSubmit={handleSubmit} className="border-t border-gray-200 bg-white p-6 shadow-lg">
      <div className="flex space-x-3">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={disabled ? "Waiting for response..." : "Type your message... (Enter to send, Shift+Enter for newline)"}
          className="flex-1 resize-none border-2 border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-500 transition-all duration-200"
          rows={3}
        />
        <button
          type="submit"
          disabled={disabled || !message.trim()}
          className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-indigo-200 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-md hover:shadow-lg disabled:shadow-none transform hover:scale-105 disabled:scale-100"
        >
          {disabled ? (
            <span className="flex items-center space-x-2">
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Sending...</span>
            </span>
          ) : (
            <span className="flex items-center space-x-2">
              <span>Send</span>
              <span>📤</span>
            </span>
          )}
        </button>
      </div>
      <div className="text-xs text-gray-500 mt-3 flex items-center space-x-2">
        <span>💡</span>
        <span>Press <kbd className="px-2 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs font-mono">Enter</kbd> to send, <kbd className="px-2 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs font-mono">Shift+Enter</kbd> for a new line</span>
      </div>
    </form>
  );
}
