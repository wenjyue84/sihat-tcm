/**
 * useNotifications Hook
 * 
 * Custom hook for managing notification state and operations
 * Provides a clean interface for components to interact with notifications
 */

import { useState, useEffect, useCallback } from 'react';
import MobileNotificationManager from '../lib/MobileNotificationManager';
import { NotificationPreferences, NotificationStats, ApiResponse } from '../types';

interface UseNotificationsReturn {
    // State
    preferences: NotificationPreferences;
    stats: NotificationStats;
    isLoading: boolean;
    isInitialized: boolean;
    error: string | null;

    // Actions
    updatePreferences: (newPreferences: Partial<NotificationPreferences>) => Promise<boolean>;
    sendTestNotification: () => Promise<boolean>;
    resetToDefaults: () => Promise<boolean>;
    refreshStats: () => Promise<void>;
    initialize: () => Promise<boolean>;
    
    // Utilities
    clearError: () => void;
}

export function useNotifications(): UseNotificationsReturn {
    const [preferences, setPreferences] = useState<NotificationPreferences>({
        enabled: true,
        healthReminders: true,
        medicationAlerts: true,
        appointmentReminders: true,
        exerciseReminders: true,
        sleepReminders: true,
        quietHours: {
            enabled: true,
            start: '22:00',
            end: '07:00',
        },
        frequency: {
            daily: true,
            weekly: true,
            monthly: false,
        },
        categories: {
            health: true,
            medication: true,
            exercise: true,
            diet: true,
            sleep: true,
            appointments: true,
        },
    });

    const [stats, setStats] = useState<NotificationStats>({
        totalScheduled: 0,
        totalReceived: 0,
        preferences,
        isInitialized: false,
    });

    const [isLoading, setIsLoading] = useState(true);
    const [isInitialized, setIsInitialized] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Initialize notification system
     */
    const initialize = useCallback(async (): Promise<boolean> => {
        try {
            setIsLoading(true);
            setError(null);

            const result = await MobileNotificationManager.initialize();
            
            if (result.success) {
                setIsInitialized(true);
                await refreshStats();
                return true;
            } else {
                setError(result.error || 'Failed to initialize notifications');
                return false;
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
            setError(errorMessage);
            return false;
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Refresh notification statistics
     */
    const refreshStats = useCallback(async (): Promise<void> => {
        try {
            const currentStats = MobileNotificationManager.getNotificationStats();
            setStats(currentStats);
            
            if (currentStats.preferences) {
                setPreferences(currentStats.preferences);
            }
        } catch (err) {
            console.error('Failed to refresh notification stats:', err);
        }
    }, []);

    /**
     * Update notification preferences
     */
    const updatePreferences = useCallback(async (
        newPreferences: Partial<NotificationPreferences>
    ): Promise<boolean> => {
        try {
            setError(null);
            
            const success = await MobileNotificationManager.updatePreferences(newPreferences);
            
            if (success) {
                // Update local state
                setPreferences(prev => ({ ...prev, ...newPreferences }));
                await refreshStats();
                return true;
            } else {
                setError('Failed to update preferences');
                return false;
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to update preferences';
            setError(errorMessage);
            return false;
        }
    }, [refreshStats]);

    /**
     * Send test notification
     */
    const sendTestNotification = useCallback(async (): Promise<boolean> => {
        try {
            setError(null);
            
            await MobileNotificationManager.scheduleTCMNotification('constitutionTips', {
                isTest: true,
                message: 'This is a test notification from Sihat TCM',
            }, { seconds: 2 });
            
            return true;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to send test notification';
            setError(errorMessage);
            return false;
        }
    }, []);

    /**
     * Reset preferences to defaults
     */
    const resetToDefaults = useCallback(async (): Promise<boolean> => {
        const defaultPreferences: NotificationPreferences = {
            enabled: true,
            healthReminders: true,
            medicationAlerts: true,
            appointmentReminders: true,
            exerciseReminders: true,
            sleepReminders: true,
            quietHours: {
                enabled: true,
                start: '22:00',
                end: '07:00',
            },
            frequency: {
                daily: true,
                weekly: true,
                monthly: false,
            },
            categories: {
                health: true,
                medication: true,
                exercise: true,
                diet: true,
                sleep: true,
                appointments: true,
            },
        };

        return updatePreferences(defaultPreferences);
    }, [updatePreferences]);

    /**
     * Clear error state
     */
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    // Initialize on mount
    useEffect(() => {
        initialize();
    }, [initialize]);

    // Periodic stats refresh
    useEffect(() => {
        if (!isInitialized) return;

        const interval = setInterval(refreshStats, 30000); // Every 30 seconds
        return () => clearInterval(interval);
    }, [isInitialized, refreshStats]);

    return {
        // State
        preferences,
        stats,
        isLoading,
        isInitialized,
        error,

        // Actions
        updatePreferences,
        sendTestNotification,
        resetToDefaults,
        refreshStats,
        initialize,

        // Utilities
        clearError,
    };
}