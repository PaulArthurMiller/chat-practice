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
    <div className="flex-1 overflow-y-auto p-8 space-y-2 bg-gradient-to-b from-gray-50 to-blue-50">
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center max-w-2xl">
            <div className="text-9xl mb-6">💬</div>
            <h2 className="text-5xl font-bold text-gray-800 mb-4">Welcome to Claude Chat!</h2>
            <p className="text-xl text-gray-600 mb-8">Start a conversation by typing a message below. I'm here to help!</p>
            <div className="bg-white rounded-2xl p-6 shadow-xl border-2 border-indigo-200 text-left text-lg text-gray-700">
              <p className="font-semibold mb-4 flex items-center space-x-2">
                <span className="text-2xl">💡</span>
                <span className="text-xl">Try asking:</span>
              </p>
              <ul className="space-y-2 list-disc list-inside ml-4">
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
            <div className="flex justify-start mb-6 px-4 animate-fadeIn">
              <div className="bg-white text-gray-800 rounded-2xl rounded-bl-sm px-6 py-4 shadow-lg border-2 border-gray-200">
                <div className="flex items-center space-x-2 mb-3">
                  <span className="text-2xl">🤖</span>
                  <span className="text-base font-semibold text-gray-600">Claude</span>
                </div>
                <div className="flex space-x-3">
                  <div className="w-4 h-4 bg-indigo-500 rounded-full animate-bounce"></div>
                  <div className="w-4 h-4 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                  <div className="w-4 h-4 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
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
