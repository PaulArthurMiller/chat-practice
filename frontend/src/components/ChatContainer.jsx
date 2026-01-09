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
    <div className="flex flex-col h-screen w-full mx-auto bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white px-8 py-6 shadow-2xl">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="text-5xl">💬</div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight">Chat with Claude</h1>
              <p className="text-lg text-indigo-100 mt-1">Powered by Claude Sonnet 4.5</p>
            </div>
          </div>
          <button
            onClick={clearConversation}
            className="px-6 py-3 bg-white/20 hover:bg-white/30 rounded-xl text-lg font-medium transition-all duration-200 hover:scale-105 backdrop-blur-sm flex items-center space-x-2"
            title="Clear conversation history"
          >
            <span className="text-2xl">🗑️</span>
            <span>Clear Chat</span>
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-800 px-8 py-5 flex justify-between items-center shadow-lg">
          <div className="flex items-center space-x-4">
            <span className="text-3xl">⚠️</span>
            <span className="font-medium text-lg">{error}</span>
          </div>
          <button
            onClick={clearError}
            className="text-red-600 hover:text-red-800 font-bold text-2xl transition-colors"
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
