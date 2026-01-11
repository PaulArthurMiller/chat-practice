/**
 * Message input component.
 * Handles user input and message submission.
 */

import React, { useState } from 'react';

// Validation constants
// IMPORTANT: Must match backend limits in src/api/routes/chat_routes.py
// Backend enforces: MIN_MESSAGE_LENGTH=1, MAX_MESSAGE_LENGTH=10000
const MAX_MESSAGE_LENGTH = 10000;

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

  // Calculate validation state
  const messageLength = message.length;
  const isMessageTooLong = messageLength > MAX_MESSAGE_LENGTH;
  const isMessageEmpty = !message.trim();
  const isApproachingLimit = messageLength > MAX_MESSAGE_LENGTH * 0.9; // 90% threshold

  /**
   * Handles form submission.
   * @param {React.FormEvent} e
   */
  const handleSubmit = (e) => {
    e.preventDefault();

    // Only submit if message is valid and not disabled
    if (!isMessageEmpty && !isMessageTooLong && !disabled) {
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
    <form onSubmit={handleSubmit} className="border-t-4 border-indigo-200 bg-white p-8 shadow-2xl">
      <div className="flex flex-col items-center space-y-4">
        <div className="w-full max-w-4xl flex space-x-4">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={disabled ? "Waiting for response..." : "Type your message here... (Enter to send, Shift+Enter for newline)"}
            className="flex-1 resize-none border-3 border-gray-300 rounded-2xl px-6 py-4 text-lg focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-200 disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-500 transition-all duration-200 shadow-md"
            rows={4}
          />
          <button
            type="submit"
            disabled={disabled || isMessageEmpty || isMessageTooLong}
            className="px-10 py-4 bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-600 text-white rounded-2xl hover:from-indigo-600 hover:via-purple-700 hover:to-pink-700 focus:outline-none focus:ring-4 focus:ring-indigo-300 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 font-semibold text-lg shadow-xl hover:shadow-2xl disabled:shadow-none transform hover:scale-105 disabled:scale-100"
          >
            {disabled ? (
              <span className="flex items-center space-x-3">
                <svg className="animate-spin h-7 w-7" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Sending...</span>
              </span>
            ) : (
              <span className="flex items-center space-x-3">
                <span>Send</span>
                <span className="text-2xl">📤</span>
              </span>
            )}
          </button>
        </div>

        {/* Character counter with validation feedback */}
        <div className="w-full max-w-4xl flex justify-between items-center">
          <div className="text-base text-gray-600 flex items-center space-x-3">
            <span className="text-2xl">💡</span>
            <span>Press <kbd className="px-3 py-1 bg-gray-100 border-2 border-gray-300 rounded text-sm font-mono">Enter</kbd> to send, <kbd className="px-3 py-1 bg-gray-100 border-2 border-gray-300 rounded text-sm font-mono">Shift+Enter</kbd> for a new line</span>
          </div>

          <div className="flex items-center space-x-2">
            <span className={`text-sm font-medium ${
              isMessageTooLong
                ? 'text-red-600'
                : isApproachingLimit
                  ? 'text-yellow-600'
                  : 'text-gray-500'
            }`}>
              {messageLength.toLocaleString()} / {MAX_MESSAGE_LENGTH.toLocaleString()}
            </span>
            {isMessageTooLong && (
              <span className="text-xs text-red-600 font-semibold">⚠️ Too long</span>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}
