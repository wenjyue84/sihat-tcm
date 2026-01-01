/**
 * Guest Session Management for Mobile
 * 
 * Utilities for managing guest diagnosis sessions using AsyncStorage
 * Guest sessions are stored in AsyncStorage and can be migrated to authenticated users
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const GUEST_SESSION_TOKEN_KEY = 'guest_session_token';

/**
 * Generate a unique session token for guest users
 */
export function generateGuestSessionToken() {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Save guest session token to AsyncStorage
 * @param {string} token - The session token to save
 */
export async function saveGuestSessionToken(token) {
    try {
        await AsyncStorage.setItem(GUEST_SESSION_TOKEN_KEY, token);
    } catch (error) {
        console.error('Failed to save guest session token:', error);
    }
}

/**
 * Get guest session token from AsyncStorage
 * @returns {Promise<string|null>} The session token or null if not found
 */
export async function getGuestSessionToken() {
    try {
        return await AsyncStorage.getItem(GUEST_SESSION_TOKEN_KEY);
    } catch (error) {
        console.error('Failed to get guest session token:', error);
        return null;
    }
}

/**
 * Clear guest session token from AsyncStorage
 */
export async function clearGuestSessionToken() {
    try {
        await AsyncStorage.removeItem(GUEST_SESSION_TOKEN_KEY);
    } catch (error) {
        console.error('Failed to clear guest session token:', error);
    }
}

/**
 * Check if a session token exists
 * @returns {Promise<boolean>} True if a guest session token exists
 */
export async function hasGuestSessionToken() {
    const token = await getGuestSessionToken();
    return token !== null;
}

