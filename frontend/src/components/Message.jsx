/**
 * Individual message component.
 * Displays a single chat message with role-based styling.
 */

import React from 'react';

/**
 * @typedef {import('../types/chat.types').IMessage} IMessage
 */

/**
 * Message component props.
 *
 * @typedef {Object} MessageProps
 * @property {IMessage} message - The message to display
 */

/**
 * Renders a single chat message.
 *
 * @param {MessageProps} props
 * @returns {JSX.Element}
 */
export function Message({ message }) {
  const isUser = message.role === 'user';

  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 px-2 animate-fadeIn`}
    >
      <div
        className={`max-w-[75%] rounded-2xl px-5 py-3 shadow-md ${
          isUser
            ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-br-sm'
            : 'bg-white text-gray-800 rounded-bl-sm border border-gray-200'
        }`}
      >
        <div className={`text-xs font-semibold mb-2 flex items-center space-x-2 ${isUser ? 'text-indigo-100' : 'text-gray-600'}`}>
          <span>{isUser ? '👤' : '🤖'}</span>
          <span>{isUser ? 'You' : 'Claude'}</span>
        </div>
        <div className="whitespace-pre-wrap break-words leading-relaxed">
          {message.content}
        </div>
        <div className={`text-xs mt-2 ${isUser ? 'text-indigo-200' : 'text-gray-500'}`}>
          {message.timestamp.toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}
