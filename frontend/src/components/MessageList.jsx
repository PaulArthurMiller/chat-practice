/**
 * Message list component.
 * Displays the conversation history with auto-scroll.
 */

import React, { useEffect, useRef } from 'react';
import { Message } from './Message';

/**
 * @typedef {import('../types/chat.types').IMessage} IMessage
 */

/**
 * MessageList component props.
 *
 * @typedef {Object} MessageListProps
 * @property {IMessage[]} messages - Array of messages to display
 * @property {boolean} isLoading - Whether a message is being loaded
 */

/**
 * Renders the list of chat messages.
 * Auto-scrolls to bottom when new messages arrive.
 *
 * @param {MessageListProps} props
 * @returns {JSX.Element}
 */
export function MessageList({ messages, isLoading }) {
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-2 bg-gradient-to-b from-gray-50 to-gray-100">
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">💬</div>
            <h2 className="text-2xl font-bold text-gray-700 mb-2">Welcome to Claude Chat!</h2>
            <p className="text-gray-500 mb-6">Start a conversation by typing a message below. I'm here to help!</p>
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 text-left text-sm text-gray-600">
              <p className="font-semibold mb-2">💡 Try asking:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Explain a concept</li>
                <li>Help with coding</li>
                <li>Creative writing</li>
                <li>General questions</li>
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <>
          {messages.map((message) => (
            <Message key={message.id} message={message} />
          ))}
          {isLoading && (
            <div className="flex justify-start mb-4 px-2 animate-fadeIn">
              <div className="bg-white text-gray-800 rounded-2xl rounded-bl-sm px-5 py-3 shadow-md border border-gray-200">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-xs font-semibold text-gray-600">🤖 Claude</span>
                </div>
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}
