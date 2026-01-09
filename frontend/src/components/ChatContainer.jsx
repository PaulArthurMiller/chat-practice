/**
 * Main chat container component.
 * Manages overall chat state and coordinates child components.
 */

import React from 'react';
import { useChatAPI } from '../hooks/useChatAPI';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';

/**
 * Main container for the chat interface.
 * Handles state management and coordinates message display and input.
 *
 * @returns {JSX.Element}
 */
export function ChatContainer() {
  const {
    messages,
    isLoading,
    error,
    sendMessage,
    clearError,
    clearConversation,
  } = useChatAPI();

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto bg-white shadow-lg">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Chat with Claude</h1>
        <button
          onClick={clearConversation}
          className="px-3 py-1 bg-blue-500 hover:bg-blue-700 rounded text-sm transition-colors"
        >
          Clear Chat
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 flex justify-between items-center">
          <span>{error}</span>
          <button
            onClick={clearError}
            className="text-red-700 hover:text-red-900 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Messages */}
      <MessageList messages={messages} isLoading={isLoading} />

      {/* Input */}
      <MessageInput onSendMessage={sendMessage} disabled={isLoading} />
    </div>
  );
}
