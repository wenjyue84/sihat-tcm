/**
 * Notification permissions management
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

export class NotificationPermissions {
  private readonly context = 'NotificationPermissions';

  /**
   * Request notification permissions with proper error handling
   */
  public async requestPermissions(): Promise<{ granted: boolean; status?: string }> {
    try {
      if (!Device.isDevice) {
        console.warn(`[${this.context}] Must use physical device for Push Notifications`);
        return { granted: false };
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      console.log(`[${this.context}] Permission status: ${finalStatus}`);
      
      return { 
        granted: finalStatus === 'granted', 
        status: finalStatus 
      };
    } catch (error) {
      console.error(`[${this.context}] Permission request failed:`, error);
      return { granted: false };
    }
  }

  /**
   * Check current permission status
   */
  public async checkPermissions(): Promise<{ granted: boolean; status: string }> {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      return {
        granted: status === 'granted',
        status
      };
    } catch (error) {
      console.error(`[${this.context}] Permission check failed:`, error);
      return { granted: false, status: 'unknown' };
    }
  }

  /**
   * Get detailed permission information
   */
  public async getPermissionDetails(): Promise<any> {
    try {
      return await Notifications.getPermissionsAsync();
    } catch (error) {
      console.error(`[${this.context}] Failed to get permission details:`, error);
      return null;
    }
  }
}