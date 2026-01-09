/**
 * Custom hook for chat API communication.
 * Manages chat state, API calls, and streaming responses.
 */

import { useState, useCallback } from 'react';

/**
 * @typedef {import('../types/chat.types').IMessage} IMessage
 * @typedef {import('../types/chat.types').IChatState} IChatState
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/**
 * Hook for managing chat API interactions.
 *
 * @returns {IChatState} Chat state and methods
 */
export function useChatAPI() {
  const [messages, setMessages] = useState(/** @type {IMessage[]} */ ([]));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(/** @type {string | null} */ (null));

  /**
   * Sends a message to the chat API and handles streaming response.
   *
   * @param {string} messageText - The message to send
   * @returns {Promise<void>}
   */
  const sendMessage = useCallback(async (messageText) => {
    if (!messageText.trim() || isLoading) {
      return;
    }

    setIsLoading(true);
    setError(null);

    // Add user message immediately
    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);

    try {
      // Create assistant message placeholder for streaming
      const assistantMessageId = (Date.now() + 1).toString();
      const assistantMessage = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Send POST request to initiate streaming
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: messageText }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Handle SSE streaming
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        // Decode the chunk and add to buffer
        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE messages in buffer
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || ''; // Keep incomplete message in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6); // Remove 'data: ' prefix

            // Update assistant message with new content
            setMessages(prev => prev.map(msg =>
              msg.id === assistantMessageId
                ? { ...msg, content: msg.content + data }
                : msg
            ));
          }
        }
      }

      setIsLoading(false);

    } catch (err) {
      console.error('Error sending message:', err);
      setError(err.message || 'Failed to send message');
      setIsLoading(false);
    }
  }, [isLoading]);

  /**
   * Clears the error state.
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Clears the entire conversation.
   *
   * @returns {Promise<void>}
   */
  const clearConversation = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/chat/clear`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to clear conversation');
      }

      setMessages([]);
      setError(null);

    } catch (err) {
      console.error('Error clearing conversation:', err);
      setError(err.message || 'Failed to clear conversation');
    }
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearError,
    clearConversation,
  };
}
