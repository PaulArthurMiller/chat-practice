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
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full text-gray-500">
          <div className="text-center">
            <p className="text-xl mb-2">👋 Welcome!</p>
            <p>Send a message to start the conversation</p>
          </div>
        </div>
      ) : (
        <>
          {messages.map((message) => (
            <Message key={message.id} message={message} />
          ))}
          {isLoading && (
            <div className="flex justify-start mb-4">
              <div className="bg-gray-200 text-gray-800 rounded-lg px-4 py-2">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
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
