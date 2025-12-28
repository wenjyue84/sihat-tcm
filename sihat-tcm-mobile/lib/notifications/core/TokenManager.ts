/**
 * Push token management
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';

export class TokenManager {
  private readonly context = 'TokenManager';
  private expoPushToken: string | null = null;

  /**
   * Register for push notifications and get token
   */
  public async registerForPushNotifications(): Promise<string | null> {
    try {
      if (!Device.isDevice) {
        console.warn(`[${this.context}] Must use physical device for Push Notifications`);
        return null;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PROJECT_ID || 'your-expo-project-id',
      });
      
      this.expoPushToken = token.data;
      console.log(`[${this.context}] Push token obtained`);
      
      // Store token for server registration
      await AsyncStorage.setItem('expoPushToken', this.expoPushToken);
      
      return this.expoPushToken;
    } catch (error) {
      console.error(`[${this.context}] Token registration failed:`, error);
      throw error;
    }
  }

  /**
   * Get current push token
   */
  public getPushToken(): string | null {
    return this.expoPushToken;
  }

  /**
   * Load stored token from storage
   */
  public async loadStoredToken(): Promise<string | null> {
    try {
      const storedToken = await AsyncStorage.getItem('expoPushToken');
      if (storedToken) {
        this.expoPushToken = storedToken;
      }
      return this.expoPushToken;
    } catch (error) {
      console.error(`[${this.context}] Failed to load stored token:`, error);
      return null;
    }
  }

  /**
   * Clear stored token
   */
  public async clearToken(): Promise<void> {
    try {
      this.expoPushToken = null;
      await AsyncStorage.removeItem('expoPushToken');
      console.log(`[${this.context}] Token cleared`);
    } catch (error) {
      console.error(`[${this.context}] Failed to clear token:`, error);
    }
  }

  /**
   * Refresh token if needed
   */
  public async refreshToken(): Promise<string | null> {
    try {
      return await this.registerForPushNotifications();
    } catch (error) {
      console.error(`[${this.context}] Token refresh failed:`, error);
      return null;
    }
  }
}