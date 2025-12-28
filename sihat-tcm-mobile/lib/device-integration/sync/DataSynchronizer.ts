/**
 * Data Synchronizer - Handles data synchronization with backend services
 * 
 * Manages queuing, batching, and synchronization of health data with remote servers.
 * Includes offline support, retry mechanisms, and conflict resolution.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { SyncQueueItem, SyncResult, SyncStatus } from '../interfaces/DeviceInterfaces';

export class DataSynchronizer {
  private syncQueue: SyncQueueItem[] = [];
  private isOnline = true;
  private syncInterval?: NodeJS.Timeout;
  private lastSyncTime?: Date;
  private readonly context = 'DataSynchronizer';
  
  // Configuration
  private readonly config = {
    maxQueueSize: 1000,
    batchSize: 50,
    retryAttempts: 3,
    retryDelay: 1000,
    syncIntervalMinutes: 15,
  };

  constructor() {
    this.loadQueueFromStorage();
    this.setupNetworkListener();
  }

  /**
   * Add item to sync queue
   */
  public async addToQueue(item: SyncQueueItem): Promise<void> {
    try {
      // Add timestamp if not present
      if (!item.timestamp) {
        item.timestamp = Date.now();
      }

      // Add unique ID
      item.id = `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      this.syncQueue.push(item);

      // Maintain queue size limit
      if (this.syncQueue.length > this.config.maxQueueSize) {
        this.syncQueue = this.syncQueue.slice(-this.config.maxQueueSize);
        console.warn(`[${this.context}] Queue size limit reached, removing oldest items`);
      }

      // Save to storage
      await this.saveQueueToStorage();

      console.log(`[${this.context}] Added item to sync queue:`, item.type);

      // Trigger immediate sync if online
      if (this.isOnline) {
        this.syncNow();
      }
    } catch (error) {
      console.error(`[${this.context}] Failed to add item to queue:`, error);
    }
  }

  /**
   * Start periodic synchronization
   */
  public startPeriodicSync(intervalMinutes: number = this.config.syncIntervalMinutes): void {
    this.stopPeriodicSync();
    
    this.syncInterval = setInterval(() => {
      if (this.isOnline && this.syncQueue.length > 0) {
        this.syncNow();
      }
    }, intervalMinutes * 60 * 1000);

    console.log(`[${this.context}] Started periodic sync every ${intervalMinutes} minutes`);
  }

  /**
   * Stop periodic synchronization
   */
  public stopPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = undefined;
      console.log(`[${this.context}] Stopped periodic sync`);
    }
  }

  /**
   * Update sync interval
   */
  public updateSyncInterval(intervalMinutes: number): void {
    this.config.syncIntervalMinutes = intervalMinutes;
    this.startPeriodicSync(intervalMinutes);
  }

  /**
   * Trigger immediate synchronization
   */
  public async syncNow(): Promise<SyncResult> {
    if (!this.isOnline) {
      return {
        success: false,
        error: 'Device is offline',
        syncedCount: 0,
        failedCount: 0,
      };
    }

    if (this.syncQueue.length === 0) {
      return {
        success: true,
        syncedCount: 0,
        failedCount: 0,
      };
    }

    console.log(`[${this.context}] Starting sync of ${this.syncQueue.length} items...`);

    try {
      const result = await this.performSync();
      this.lastSyncTime = new Date();
      
      console.log(`[${this.context}] Sync completed:`, {
        synced: result.syncedCount,
        failed: result.failedCount,
      });

      return result;
    } catch (error) {
      console.error(`[${this.context}] Sync failed:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown sync error',
        syncedCount: 0,
        failedCount: this.syncQueue.length,
      };
    }
  }

  /**
   * Get sync queue size
   */
  public getQueueSize(): number {
    return this.syncQueue.length;
  }

  /**
   * Get last sync time
   */
  public getLastSyncTime(): Date | undefined {
    return this.lastSyncTime;
  }

  /**
   * Get sync status
   */
  public getSyncStatus(): SyncStatus {
    return {
      isOnline: this.isOnline,
      queueSize: this.syncQueue.length,
      lastSyncTime: this.lastSyncTime,
      isPeriodicSyncActive: !!this.syncInterval,
      syncIntervalMinutes: this.config.syncIntervalMinutes,
    };
  }

  /**
   * Clear sync queue
   */
  public async clearQueue(): Promise<void> {
    this.syncQueue = [];
    await this.saveQueueToStorage();
    console.log(`[${this.context}] Sync queue cleared`);
  }

  /**
   * Cleanup resources
   */
  public async cleanup(): Promise<void> {
    console.log(`[${this.context}] Cleaning up...`);
    
    this.stopPeriodicSync();
    await this.saveQueueToStorage();
    
    console.log(`[${this.context}] Cleanup complete`);
  }

  // Private methods

  /**
   * Perform actual synchronization
   */
  private async performSync(): Promise<SyncResult> {
    const batches = this.createBatches();
    let syncedCount = 0;
    let failedCount = 0;
    const failedItems: SyncQueueItem[] = [];

    for (const batch of batches) {
      try {
        const batchResult = await this.syncBatch(batch);
        syncedCount += batchResult.syncedCount;
        failedCount += batchResult.failedCount;
        
        // Remove successfully synced items from queue
        if (batchResult.success) {
          this.removeSyncedItems(batch);
        } else {
          failedItems.push(...batch);
        }
      } catch (error) {
        console.error(`[${this.context}] Batch sync failed:`, error);
        failedItems.push(...batch);
        failedCount += batch.length;
      }
    }

    // Update queue with failed items (for retry)
    this.syncQueue = failedItems;
    await this.saveQueueToStorage();

    return {
      success: failedCount === 0,
      syncedCount,
      failedCount,
      error: failedCount > 0 ? `${failedCount} items failed to sync` : undefined,
    };
  }

  /**
   * Create batches from sync queue
   */
  private createBatches(): SyncQueueItem[][] {
    const batches: SyncQueueItem[][] = [];
    
    for (let i = 0; i < this.syncQueue.length; i += this.config.batchSize) {
      batches.push(this.syncQueue.slice(i, i + this.config.batchSize));
    }
    
    return batches;
  }

  /**
   * Sync a batch of items
   */
  private async syncBatch(batch: SyncQueueItem[]): Promise<SyncResult> {
    try {
      // Prepare batch data for API
      const batchData = {
        items: batch.map(item => ({
          id: item.id,
          type: item.type,
          data: item.data,
          timestamp: item.timestamp,
          deviceId: item.deviceId,
        })),
        batchId: `batch_${Date.now()}`,
        timestamp: Date.now(),
      };

      // Make API call (simulated for now)
      const response = await this.callSyncAPI(batchData);
      
      if (response.success) {
        return {
          success: true,
          syncedCount: batch.length,
          failedCount: 0,
        };
      } else {
        throw new Error(response.error || 'Sync API call failed');
      }
    } catch (error) {
      console.error(`[${this.context}] Batch sync error:`, error);
      
      // Retry logic
      const retryResult = await this.retryBatch(batch);
      return retryResult;
    }
  }

  /**
   * Retry failed batch with exponential backoff
   */
  private async retryBatch(batch: SyncQueueItem[]): Promise<SyncResult> {
    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        console.log(`[${this.context}] Retry attempt ${attempt}/${this.config.retryAttempts}`);
        
        // Exponential backoff delay
        const delay = this.config.retryDelay * Math.pow(2, attempt - 1);
        await this.sleep(delay);
        
        const batchData = {
          items: batch.map(item => ({
            id: item.id,
            type: item.type,
            data: item.data,
            timestamp: item.timestamp,
            deviceId: item.deviceId,
          })),
          batchId: `retry_batch_${Date.now()}`,
          timestamp: Date.now(),
          retryAttempt: attempt,
        };

        const response = await this.callSyncAPI(batchData);
        
        if (response.success) {
          console.log(`[${this.context}] Retry successful on attempt ${attempt}`);
          return {
            success: true,
            syncedCount: batch.length,
            failedCount: 0,
          };
        }
      } catch (error) {
        console.error(`[${this.context}] Retry attempt ${attempt} failed:`, error);
      }
    }

    // All retries failed
    return {
      success: false,
      syncedCount: 0,
      failedCount: batch.length,
      error: 'All retry attempts failed',
    };
  }

  /**
   * Call sync API (simulated)
   */
  private async callSyncAPI(batchData: any): Promise<{ success: boolean; error?: string }> {
    // Simulate API call delay
    await this.sleep(500 + Math.random() * 1000);
    
    // Simulate occasional failures for testing
    if (Math.random() < 0.1) { // 10% failure rate
      throw new Error('Simulated API failure');
    }

    // In a real implementation, this would make an actual HTTP request
    console.log(`[${this.context}] Syncing batch with ${batchData.items.length} items`);
    
    // Simulate successful response
    return { success: true };
  }

  /**
   * Remove successfully synced items from queue
   */
  private removeSyncedItems(syncedItems: SyncQueueItem[]): void {
    const syncedIds = new Set(syncedItems.map(item => item.id));
    this.syncQueue = this.syncQueue.filter(item => !syncedIds.has(item.id));
  }

  /**
   * Load sync queue from storage
   */
  private async loadQueueFromStorage(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('deviceSyncQueue');
      if (stored) {
        this.syncQueue = JSON.parse(stored);
        console.log(`[${this.context}] Loaded ${this.syncQueue.length} items from storage`);
      }
    } catch (error) {
      console.error(`[${this.context}] Failed to load sync queue from storage:`, error);
      this.syncQueue = [];
    }
  }

  /**
   * Save sync queue to storage
   */
  private async saveQueueToStorage(): Promise<void> {
    try {
      await AsyncStorage.setItem('deviceSyncQueue', JSON.stringify(this.syncQueue));
    } catch (error) {
      console.error(`[${this.context}] Failed to save sync queue to storage:`, error);
    }
  }

  /**
   * Setup network connectivity listener
   */
  private setupNetworkListener(): void {
    // In a real implementation, you would use @react-native-community/netinfo
    // For now, we'll simulate network status
    
    // Simulate network status changes
    setInterval(() => {
      const wasOnline = this.isOnline;
      // Simulate 95% uptime
      this.isOnline = Math.random() > 0.05;
      
      if (!wasOnline && this.isOnline) {
        console.log(`[${this.context}] Network connection restored, triggering sync`);
        this.syncNow();
      } else if (wasOnline && !this.isOnline) {
        console.log(`[${this.context}] Network connection lost`);
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get queue statistics
   */
  public getQueueStatistics(): {
    totalItems: number;
    itemsByType: Record<string, number>;
    oldestItem?: Date;
    newestItem?: Date;
  } {
    const stats = {
      totalItems: this.syncQueue.length,
      itemsByType: {} as Record<string, number>,
      oldestItem: undefined as Date | undefined,
      newestItem: undefined as Date | undefined,
    };

    if (this.syncQueue.length === 0) {
      return stats;
    }

    // Count items by type
    for (const item of this.syncQueue) {
      stats.itemsByType[item.type] = (stats.itemsByType[item.type] || 0) + 1;
    }

    // Find oldest and newest items
    const timestamps = this.syncQueue.map(item => item.timestamp).sort((a, b) => a - b);
    stats.oldestItem = new Date(timestamps[0]);
    stats.newestItem = new Date(timestamps[timestamps.length - 1]);

    return stats;
  }

  /**
   * Force sync specific item types
   */
  public async syncItemType(itemType: string): Promise<SyncResult> {
    const itemsToSync = this.syncQueue.filter(item => item.type === itemType);
    
    if (itemsToSync.length === 0) {
      return {
        success: true,
        syncedCount: 0,
        failedCount: 0,
      };
    }

    console.log(`[${this.context}] Syncing ${itemsToSync.length} items of type ${itemType}`);
    
    try {
      const result = await this.syncBatch(itemsToSync);
      
      if (result.success) {
        this.removeSyncedItems(itemsToSync);
        await this.saveQueueToStorage();
      }
      
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        syncedCount: 0,
        failedCount: itemsToSync.length,
      };
    }
  }
}