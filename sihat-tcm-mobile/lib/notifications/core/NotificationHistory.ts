/**
 * Notification history management
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { NotificationHistory as NotificationHistoryItem } from '../interfaces/NotificationInterfaces';

export class NotificationHistory {
  private readonly context = 'NotificationHistory';
  private notificationHistory: NotificationHistoryItem[] = [];
  private readonly maxHistorySize: number;

  constructor(maxHistorySize: number = 1000) {
    this.maxHistorySize = maxHistorySize;
  }

  /**
   * Add notification to history
   */
  public addNotification(notification: Omit<NotificationHistoryItem, 'deviceType'>): void {
    const historyItem: NotificationHistoryItem = {
      ...notification,
      deviceType: Platform.OS,
    };

    this.notificationHistory.unshift(historyItem);

    // Maintain history size limit
    if (this.notificationHistory.length > this.maxHistorySize) {
      this.notificationHistory = this.notificationHistory.slice(0, this.maxHistorySize);
    }

    // Save to storage asynchronously
    this.saveToStorage().catch(error => 
      console.error(`[${this.context}] Failed to save notification history:`, error)
    );
  }

  /**
   * Mark notification as clicked
   */
  public markAsClicked(notificationId: string): void {
    const historyIndex = this.notificationHistory.findIndex(
      item => item.id === notificationId
    );
    
    if (historyIndex !== -1) {
      this.notificationHistory[historyIndex].clicked = true;
      this.notificationHistory[historyIndex].clickedAt = Date.now();
      this.saveToStorage().catch(console.error);
    }
  }

  /**
   * Get notification history
   */
  public getHistory(limit?: number): NotificationHistoryItem[] {
    if (limit) {
      return this.notificationHistory.slice(0, limit);
    }
    return [...this.notificationHistory];
  }

  /**
   * Get history by category
   */
  public getHistoryByCategory(category: string, limit?: number): NotificationHistoryItem[] {
    const filtered = this.notificationHistory.filter(item => item.category === category);
    if (limit) {
      return filtered.slice(0, limit);
    }
    return filtered;
  }

  /**
   * Get unread notifications
   */
  public getUnreadNotifications(): NotificationHistoryItem[] {
    return this.notificationHistory.filter(item => !item.clicked);
  }

  /**
   * Clear history
   */
  public async clearHistory(): Promise<void> {
    try {
      this.notificationHistory = [];
      await AsyncStorage.removeItem('notificationHistory');
      console.log(`[${this.context}] History cleared`);
    } catch (error) {
      console.error(`[${this.context}] Failed to clear history:`, error);
    }
  }

  /**
   * Load history from storage
   */
  public async loadFromStorage(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('notificationHistory');
      if (stored) {
        this.notificationHistory = JSON.parse(stored);
        console.log(`[${this.context}] History loaded: ${this.notificationHistory.length} items`);
      }
    } catch (error) {
      console.error(`[${this.context}] Failed to load notification history:`, error);
    }
  }

  /**
   * Save history to storage
   */
  public async saveToStorage(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        'notificationHistory', 
        JSON.stringify(this.notificationHistory)
      );
    } catch (error) {
      console.error(`[${this.context}] Failed to save notification history:`, error);
    }
  }

  /**
   * Get history statistics
   */
  public getStats(): {
    total: number;
    unread: number;
    byCategory: Record<string, number>;
    clickRate: number;
  } {
    const byCategory: Record<string, number> = {};
    let clickedCount = 0;

    for (const item of this.notificationHistory) {
      byCategory[item.category] = (byCategory[item.category] || 0) + 1;
      if (item.clicked) {
        clickedCount++;
      }
    }

    return {
      total: this.notificationHistory.length,
      unread: this.notificationHistory.length - clickedCount,
      byCategory,
      clickRate: this.notificationHistory.length > 0 ? clickedCount / this.notificationHistory.length : 0,
    };
  }
}