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
    <div className="flex flex-col h-screen max-w-5xl mx-auto bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4 shadow-lg">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Chat with Claude</h1>
            <p className="text-sm text-indigo-100 mt-1">Powered by Claude Sonnet 4.5</p>
          </div>
          <button
            onClick={clearConversation}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 backdrop-blur-sm"
            title="Clear conversation history"
          >
            🗑️ Clear Chat
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-800 px-6 py-4 flex justify-between items-center shadow-sm">
          <div className="flex items-center space-x-3">
            <span className="text-xl">⚠️</span>
            <span className="font-medium">{error}</span>
          </div>
          <button
            onClick={clearError}
            className="text-red-600 hover:text-red-800 font-bold text-xl transition-colors"
            title="Dismiss error"
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
