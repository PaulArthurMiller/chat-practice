/**
 * Custom hook for chat API communication.
 * Manages chat state, API calls, and streaming responses.
 */

import { useState, useCallback, useRef } from 'react';

/**
 * @typedef {import('../types/chat.types').IMessage} IMessage
 * @typedef {import('../types/chat.types').IChatState} IChatState
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Retry configuration for transient errors
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000; // Start with 1 second
const RETRYABLE_STATUS_CODES = [500, 502, 503, 504]; // Server errors that may be transient

/**
 * Delays execution for specified milliseconds.
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise<void>}
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Checks if an error is retryable.
 * @param {Error} error - The error to check
 * @param {number} status - HTTP status code
 * @returns {boolean}
 */
const isRetryable = (error, status) => {
  // Network errors (fetch failures)
  if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
    return true;
  }
  // Server errors that might be transient
  return RETRYABLE_STATUS_CODES.includes(status);
};

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

    // Create assistant message placeholder for streaming
    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, assistantMessage]);

    // Retry logic with exponential backoff
    let lastError = null;
    let lastStatus = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        // Send POST request to initiate streaming
        const response = await fetch(`${API_BASE_URL}/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message: messageText }),
        });

        // Parse error responses
        if (!response.ok) {
          lastStatus = response.status;
          let errorMessage = `HTTP error! status: ${response.status}`;

          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;

            // Special handling for rate limit errors
            if (response.status === 429) {
              setError(`⏱️ ${errorMessage}`);
              setIsLoading(false);
              // Remove empty assistant message
              setMessages(prev => prev.filter(msg => msg.id !== assistantMessageId));
              return; // Don't retry rate limit errors
            }
          } catch (parseError) {
            // If JSON parsing fails, use generic error message
            console.warn('Failed to parse error response:', parseError);
          }

          throw new Error(errorMessage);
        }

        // Handle SSE streaming with robust chunk accumulation
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        let buffer = '';
        let accumulatedContent = ''; // Accumulate all chunks locally (never dropped)
        let pendingUpdate = false;
        let animationFrameId = null;

        // Debounced update function using requestAnimationFrame
        // This ensures updates happen at browser's render cycle, preventing collisions
        const scheduleUpdate = () => {
          if (pendingUpdate) return; // Already scheduled

          pendingUpdate = true;
          animationFrameId = requestAnimationFrame(() => {
            setMessages(prev => prev.map(msg =>
              msg.id === assistantMessageId
                ? { ...msg, content: accumulatedContent }
                : msg
            ));
            pendingUpdate = false;
          });
        };

        try {
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

                // EXPLICIT DEBUG OUTPUT
                console.log('🟢 FRONTEND RECEIVED:', data.substring(0, 50) + '...');
                console.log('🟢 Data length:', data.length);

                // Accumulate content locally (this never drops data)
                accumulatedContent += data;

                console.log('🟢 Accumulated so far:', accumulatedContent.length, 'chars');

                // Log chunk for debugging
                console.debug(`Chunk ${accumulatedContent.length} chars:`, data.substring(0, 50) + '...');
              }
            }

            // Schedule UI update (debounced to animation frame)
            scheduleUpdate();
          }

          // Cancel any pending animation frame
          if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
          }

          // Final update with complete accumulated content (ensures everything is displayed)
          console.log('🟢 FINAL ACCUMULATED CONTENT LENGTH:', accumulatedContent.length);
          console.log('🟢 FINAL CONTENT PREVIEW:', accumulatedContent.substring(0, 200) + '...');

          setMessages(prev => prev.map(msg =>
            msg.id === assistantMessageId
              ? { ...msg, content: accumulatedContent }
              : msg
          ));

          console.log(`✅ Streaming complete. Total: ${accumulatedContent.length} chars`);

          // Streaming completed successfully
          setIsLoading(false);
          return; // Exit successfully

        } catch (streamError) {
          // Cancel any pending animation frame
          if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
          }

          // Handle streaming errors gracefully
          console.error('Streaming error:', streamError);

          if (accumulatedContent) {
            // If we got partial content, keep it and show error
            setMessages(prev => prev.map(msg =>
              msg.id === assistantMessageId
                ? { ...msg, content: accumulatedContent }
                : msg
            ));
            setError('⚠️ Connection interrupted. Partial response received.');
            setIsLoading(false);
            return;
          } else {
            // No content received, treat as retryable
            throw new Error('Streaming failed: ' + streamError.message);
          }
        }

      } catch (err) {
        lastError = err;
        console.error(`Attempt ${attempt + 1} failed:`, err);

        // Check if should retry
        if (attempt < MAX_RETRIES && isRetryable(err, lastStatus)) {
          const delayMs = RETRY_DELAY_MS * Math.pow(2, attempt); // Exponential backoff
          console.log(`Retrying in ${delayMs}ms...`);
          await delay(delayMs);
          continue; // Try again
        }

        // All retries exhausted or non-retryable error
        break;
      }
    }

    // If we get here, all attempts failed
    console.error('All retry attempts failed:', lastError);

    // Show user-friendly error message
    let errorMessage = lastError?.message || 'Failed to send message';
    if (lastStatus && RETRYABLE_STATUS_CODES.includes(lastStatus)) {
      errorMessage = `🔌 ${errorMessage}. Server may be temporarily unavailable.`;
    }

    setError(errorMessage);
    setIsLoading(false);

    // Remove empty assistant message on complete failure
    setMessages(prev => prev.filter(msg => msg.id !== assistantMessageId));
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
        let errorMessage = 'Failed to clear conversation';

        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          console.warn('Failed to parse error response:', parseError);
        }

        throw new Error(errorMessage);
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
