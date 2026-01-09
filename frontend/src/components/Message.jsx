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
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6 px-4 animate-fadeIn`}
    >
      <div
        className={`max-w-[80%] rounded-2xl px-6 py-4 shadow-lg ${
          isUser
            ? 'bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-600 text-white rounded-br-sm'
            : 'bg-white text-gray-800 rounded-bl-sm border-2 border-gray-200'
        }`}
      >
        <div className={`text-sm font-semibold mb-3 flex items-center space-x-2 ${isUser ? 'text-indigo-100' : 'text-gray-600'}`}>
          <span className="text-2xl">{isUser ? '👤' : '🤖'}</span>
          <span className="text-base">{isUser ? 'You' : 'Claude'}</span>
        </div>
        <div className="whitespace-pre-wrap break-words leading-relaxed text-lg">
          {message.content}
        </div>
        <div className={`text-sm mt-3 ${isUser ? 'text-indigo-200' : 'text-gray-500'}`}>
          {message.timestamp.toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}
