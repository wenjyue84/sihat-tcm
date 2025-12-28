/**
 * Google AI Module - Centralized AI Instance Creator
 * 
 * This module provides a function to create GoogleGenerativeAI instances
 * using the API key fetched from the admin dashboard.
 * 
 * Usage:
 *   import { getGenAI } from '../../lib/googleAI';
 *   const genAI = getGenAI();
 *   const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { getApiKeySync, API_CONFIG } from './apiConfig';

/**
 * Get a GoogleGenerativeAI instance with the current API key.
 * Uses the API key fetched from admin dashboard, or fallback if not available.
 * 
 * @returns {GoogleGenerativeAI} A configured GoogleGenerativeAI instance
 */
export function getGenAI() {
    const apiKey = getApiKeySync();
    return new GoogleGenerativeAI(apiKey);
}

/**
 * Get a generative model with the specified configuration.
 * Convenience function that combines getGenAI() and getGenerativeModel().
 * 
 * @param {Object} config - Model configuration (model, systemInstruction, etc.)
 * @returns {GenerativeModel} A configured GenerativeModel instance
 */
export function getGenerativeModel(config) {
    const genAI = getGenAI();
    return genAI.getGenerativeModel(config);
}

// Re-export API_CONFIG for convenience
export { API_CONFIG };
