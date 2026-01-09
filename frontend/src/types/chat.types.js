/**
 * Type definitions for chat application.
 * Using JSDoc for type safety in JavaScript.
 */

/**
 * @typedef {Object} IMessage
 * @property {string} id - Unique message identifier
 * @property {'user' | 'assistant'} role - Message sender role
 * @property {string} content - Message text content
 * @property {Date} timestamp - When the message was created
 */

/**
 * @typedef {Object} IChatRequest
 * @property {string} message - The user's message to send
 */

/**
 * @typedef {Object} IChatError
 * @property {string} error - Error message
 * @property {string} code - Error code
 * @property {number} status - HTTP status code
 */

/**
 * @typedef {Object} IChatState
 * @property {IMessage[]} messages - Array of chat messages
 * @property {boolean} isLoading - Whether a request is in progress
 * @property {string | null} error - Error message if any
 * @property {(message: string) => Promise<void>} sendMessage - Function to send a message
 * @property {() => void} clearError - Function to clear error state
 * @property {() => Promise<void>} clearConversation - Function to clear all messages
 */

export {};
