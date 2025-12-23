/**
 * Biometric Authentication Utility
 * 
 * Handles secure storage and retrieval of user credentials
 * for biometric (Face ID / Fingerprint) login.
 * 
 * Uses expo-secure-store for encrypted credential storage
 * in the device's secure keychain/keystore.
 */

import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Secure storage keys
const SECURE_KEYS = {
    EMAIL: 'sihat_biometric_email',
    PASSWORD: 'sihat_biometric_password',
};

// Preference key (non-sensitive, can use AsyncStorage)
const BIOMETRIC_ENABLED_KEY = 'biometricEnabled';

/**
 * Check if the device supports biometric authentication
 * @returns {Promise<{supported: boolean, enrolled: boolean, type: string}>}
 */
export const checkBiometricSupport = async () => {
    try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();

        let type = 'Biometrics';
        if (hasHardware && isEnrolled) {
            const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
            if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
                type = 'Face ID';
            } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
                type = 'Fingerprint';
            }
        }

        return {
            supported: hasHardware,
            enrolled: isEnrolled,
            type,
        };
    } catch (error) {
        console.error('Error checking biometric support:', error);
        return { supported: false, enrolled: false, type: 'Unknown' };
    }
};

/**
 * Check if biometric login is enabled for this user
 * @returns {Promise<boolean>}
 */
export const isBiometricEnabled = async () => {
    try {
        const enabled = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
        return enabled === 'true';
    } catch (error) {
        console.error('Error checking biometric preference:', error);
        return false;
    }
};

/**
 * Check if credentials are stored for biometric login
 * @returns {Promise<boolean>}
 */
export const hasStoredCredentials = async () => {
    try {
        const email = await SecureStore.getItemAsync(SECURE_KEYS.EMAIL);
        const password = await SecureStore.getItemAsync(SECURE_KEYS.PASSWORD);
        return !!(email && password);
    } catch (error) {
        console.error('Error checking stored credentials:', error);
        return false;
    }
};

/**
 * Store credentials securely for biometric login
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @returns {Promise<boolean>} - Success status
 */
export const storeCredentials = async (email, password) => {
    try {
        if (!email || !password) {
            throw new Error('Email and password are required');
        }

        await SecureStore.setItemAsync(SECURE_KEYS.EMAIL, email);
        await SecureStore.setItemAsync(SECURE_KEYS.PASSWORD, password);
        await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, 'true');

        console.log('[BiometricAuth] Credentials stored securely');
        return true;
    } catch (error) {
        console.error('Error storing credentials:', error);
        return false;
    }
};

/**
 * Retrieve stored credentials after biometric authentication
 * @returns {Promise<{email: string, password: string} | null>}
 */
export const getStoredCredentials = async () => {
    try {
        const email = await SecureStore.getItemAsync(SECURE_KEYS.EMAIL);
        const password = await SecureStore.getItemAsync(SECURE_KEYS.PASSWORD);

        if (email && password) {
            return { email, password };
        }
        return null;
    } catch (error) {
        console.error('Error retrieving credentials:', error);
        return null;
    }
};

/**
 * Delete stored credentials (when disabling biometrics)
 * @returns {Promise<boolean>}
 */
export const clearStoredCredentials = async () => {
    try {
        await SecureStore.deleteItemAsync(SECURE_KEYS.EMAIL);
        await SecureStore.deleteItemAsync(SECURE_KEYS.PASSWORD);
        await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, 'false');

        console.log('[BiometricAuth] Credentials cleared');
        return true;
    } catch (error) {
        console.error('Error clearing credentials:', error);
        return false;
    }
};

/**
 * Perform biometric authentication
 * @param {string} promptMessage - Message to show in the biometric prompt
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const authenticateWithBiometrics = async (promptMessage = 'Authenticate to login') => {
    try {
        const { supported, enrolled, type } = await checkBiometricSupport();

        if (!supported) {
            return { success: false, error: 'not_supported' };
        }

        if (!enrolled) {
            return { success: false, error: 'not_enrolled' };
        }

        const result = await LocalAuthentication.authenticateAsync({
            promptMessage: promptMessage || `Login with ${type}`,
            cancelLabel: 'Cancel',
            disableDeviceFallback: false,
            fallbackLabel: 'Use Passcode',
        });

        if (result.success) {
            return { success: true };
        } else {
            return { success: false, error: result.error || 'authentication_failed' };
        }
    } catch (error) {
        console.error('Biometric authentication error:', error);
        return { success: false, error: 'unknown_error' };
    }
};

/**
 * Complete biometric login flow:
 * 1. Check if credentials are stored
 * 2. Authenticate with biometrics
 * 3. Return credentials for login
 * 
 * @returns {Promise<{success: boolean, credentials?: {email: string, password: string}, error?: string}>}
 */
export const performBiometricLogin = async () => {
    try {
        // Check if biometrics are enabled and credentials exist
        const enabled = await isBiometricEnabled();
        if (!enabled) {
            return { success: false, error: 'biometrics_not_enabled' };
        }

        const hasCredentials = await hasStoredCredentials();
        if (!hasCredentials) {
            return { success: false, error: 'no_stored_credentials' };
        }

        // Authenticate with biometrics
        const authResult = await authenticateWithBiometrics('Login with biometrics');
        if (!authResult.success) {
            return { success: false, error: authResult.error };
        }

        // Retrieve credentials
        const credentials = await getStoredCredentials();
        if (!credentials) {
            return { success: false, error: 'credential_retrieval_failed' };
        }

        return { success: true, credentials };
    } catch (error) {
        console.error('Biometric login error:', error);
        return { success: false, error: 'unknown_error' };
    }
};

export default {
    checkBiometricSupport,
    isBiometricEnabled,
    hasStoredCredentials,
    storeCredentials,
    getStoredCredentials,
    clearStoredCredentials,
    authenticateWithBiometrics,
    performBiometricLogin,
};
