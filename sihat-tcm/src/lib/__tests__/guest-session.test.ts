/**
 * Phase 2: Guest Session Management Tests
 * 
 * Tests for guest session token management and utilities.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    generateGuestSessionToken,
    saveGuestSessionToken,
    getGuestSessionToken,
    clearGuestSessionToken,
    hasGuestSessionToken
} from '../guestSession';

// Mock sessionStorage
const mockSessionStorage = (() => {
    let store: Record<string, string> = {};

    return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => {
            store[key] = value.toString();
        },
        removeItem: (key: string) => {
            delete store[key];
        },
        clear: () => {
            store = {};
        }
    };
})();

describe('Phase 2: Guest Session Management', () => {
    beforeEach(() => {
        // Reset sessionStorage mock
        mockSessionStorage.clear();
        
        // Mock window.sessionStorage
        Object.defineProperty(window, 'sessionStorage', {
            value: mockSessionStorage,
            writable: true
        });
    });

    describe('generateGuestSessionToken', () => {
        it('should generate a valid UUID', () => {
            const token = generateGuestSessionToken();

            expect(token).toBeDefined();
            expect(typeof token).toBe('string');
            expect(token.length).toBeGreaterThan(0);
        });

        it('should generate unique tokens', () => {
            const token1 = generateGuestSessionToken();
            const token2 = generateGuestSessionToken();

            expect(token1).not.toBe(token2);
        });

        it('should generate tokens in UUID format', () => {
            const token = generateGuestSessionToken();
            // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

            expect(token).toMatch(uuidRegex);
        });
    });

    describe('saveGuestSessionToken', () => {
        it('should save token to sessionStorage', () => {
            const token = 'test-token-123';
            saveGuestSessionToken(token);

            expect(mockSessionStorage.getItem('guest_session_token')).toBe(token);
        });

        it('should overwrite existing token', () => {
            const token1 = 'token-1';
            const token2 = 'token-2';

            saveGuestSessionToken(token1);
            expect(mockSessionStorage.getItem('guest_session_token')).toBe(token1);

            saveGuestSessionToken(token2);
            expect(mockSessionStorage.getItem('guest_session_token')).toBe(token2);
        });

        it('should handle empty string token', () => {
            saveGuestSessionToken('');
            // sessionStorage.getItem returns null for empty strings in some implementations
            const retrieved = getGuestSessionToken();
            // The function should handle empty strings gracefully
            expect(retrieved === '' || retrieved === null).toBe(true);
        });
    });

    describe('getGuestSessionToken', () => {
        it('should retrieve saved token', () => {
            const token = 'test-token-456';
            mockSessionStorage.setItem('guest_session_token', token);

            const retrieved = getGuestSessionToken();
            expect(retrieved).toBe(token);
        });

        it('should return null if no token exists', () => {
            const retrieved = getGuestSessionToken();
            expect(retrieved).toBeNull();
        });

        it('should return null after token is cleared', () => {
            const token = 'test-token-789';
            saveGuestSessionToken(token);
            clearGuestSessionToken();

            const retrieved = getGuestSessionToken();
            expect(retrieved).toBeNull();
        });
    });

    describe('clearGuestSessionToken', () => {
        it('should remove token from sessionStorage', () => {
            const token = 'test-token-clear';
            saveGuestSessionToken(token);
            expect(getGuestSessionToken()).toBe(token);

            clearGuestSessionToken();
            expect(getGuestSessionToken()).toBeNull();
        });

        it('should not error if no token exists', () => {
            expect(() => clearGuestSessionToken()).not.toThrow();
        });

        it('should clear only guest session token', () => {
            mockSessionStorage.setItem('guest_session_token', 'token-1');
            mockSessionStorage.setItem('other_key', 'other-value');

            clearGuestSessionToken();

            expect(mockSessionStorage.getItem('guest_session_token')).toBeNull();
            expect(mockSessionStorage.getItem('other_key')).toBe('other-value');
        });
    });

    describe('hasGuestSessionToken', () => {
        it('should return true when token exists', () => {
            saveGuestSessionToken('test-token');
            expect(hasGuestSessionToken()).toBe(true);
        });

        it('should return false when no token exists', () => {
            expect(hasGuestSessionToken()).toBe(false);
        });

        it('should return false after token is cleared', () => {
            saveGuestSessionToken('test-token');
            clearGuestSessionToken();
            expect(hasGuestSessionToken()).toBe(false);
        });
    });

    describe('Integration', () => {
        it('should handle full guest session flow', () => {
            // Generate token
            const token = generateGuestSessionToken();
            expect(token).toBeDefined();

            // Save token
            saveGuestSessionToken(token);
            expect(hasGuestSessionToken()).toBe(true);
            expect(getGuestSessionToken()).toBe(token);

            // Clear token
            clearGuestSessionToken();
            expect(hasGuestSessionToken()).toBe(false);
            expect(getGuestSessionToken()).toBeNull();
        });

        it('should handle multiple token operations', () => {
            const token1 = generateGuestSessionToken();
            saveGuestSessionToken(token1);
            expect(getGuestSessionToken()).toBe(token1);

            const token2 = generateGuestSessionToken();
            saveGuestSessionToken(token2);
            expect(getGuestSessionToken()).toBe(token2);
            expect(getGuestSessionToken()).not.toBe(token1);
        });
    });
});

