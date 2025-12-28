/**
 * Notification Command Implementations
 * 
 * Command implementations for notification operations with undo/redo support
 * and comprehensive validation.
 */

import {
  Command,
  CommandResult,
  ScheduleNotificationCommand,
  UpdateNotificationPreferencesCommand,
} from '../interfaces/CommandInterfaces';

import { devLog, logError } from '../../systemLogger';
import { ErrorFactory } from '../../errors/AppError';

/**
 * Command to schedule a notification with cancellation support
 */
export class ScheduleNotificationCommandImpl implements ScheduleNotificationCommand {
  public readonly id: string;
  public readonly type = 'notification:schedule' as const;
  public readonly description: string;
  public readonly timestamp: Date;
  public readonly metadata?: any;

  private readonly notificationService: any; // Would be properly typed in real implementation
  private scheduledNotificationId?: string;

  constructor(
    public readonly data: {
      notificationRequest: any;
      scheduledNotificationId?: string;
    },
    notificationService: any,
    metadata?: any
  ) {
    this.id = `schedule-notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.description = `Schedule notification: ${data.notificationRequest.title}`;
    this.timestamp = new Date();
    this.metadata = metadata;
    this.notificationService = notificationService;
    this.scheduledNotificationId = data.scheduledNotificationId;
  }

  /**
   * Execute the notification scheduling
   */
  public async execute(): Promise<CommandResult> {
    const startTime = Date.now();

    try {
      devLog(`[ScheduleNotificationCommand] Scheduling notification: ${this.data.notificationRequest.title}`, {
        commandId: this.id,
        category: this.data.notificationRequest.category,
        priority: this.data.notificationRequest.priority,
      });

      // Validate notification request
      const validation = await this.validateNotificationRequest(this.data.notificationRequest);
      if (!validation.valid) {
        throw new Error(`Invalid notification request: ${validation.errors.join(', ')}`);
      }

      // Schedule the notification
      const scheduleResult = await this.notificationService.schedule(this.data.notificationRequest);

      if (!scheduleResult.success) {
        throw new Error(`Notification scheduling failed: ${scheduleResult.error}`);
      }

      // Store the scheduled notification ID for undo
      this.scheduledNotificationId = scheduleResult.notificationId;

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        data: {
          notificationId: this.scheduledNotificationId,
          notificationRequest: this.data.notificationRequest,
          scheduledAt: new Date(),
        },
        executionTime,
        metadata: {
          commandType: this.type,
          notificationCategory: this.data.notificationRequest.category,
          notificationPriority: this.data.notificationRequest.priority,
        },
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      logError(`[ScheduleNotificationCommand] Notification scheduling failed`, error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime,
        metadata: {
          commandType: this.type,
          notificationTitle: this.data.notificationRequest.title,
          errorType: error instanceof Error ? error.constructor.name : 'Unknown',
        },
      };
    }
  }

  /**
   * Undo the notification scheduling (cancel the notification)
   */
  public async undo(): Promise<CommandResult> {
    const startTime = Date.now();

    try {
      if (!this.scheduledNotificationId) {
        throw new Error('No scheduled notification to cancel');
      }

      devLog(`[ScheduleNotificationCommand] Cancelling scheduled notification: ${this.scheduledNotificationId}`, {
        commandId: this.id,
      });

      // Cancel the scheduled notification
      const cancelResult = await this.notificationService.cancel(this.scheduledNotificationId);

      if (!cancelResult.success) {
        throw new Error(`Failed to cancel notification: ${cancelResult.error}`);
      }

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        data: {
          cancelledNotificationId: this.scheduledNotificationId,
          cancelledAt: new Date(),
        },
        executionTime,
        metadata: {
          commandType: this.type,
          operation: 'undo',
        },
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      logError(`[ScheduleNotificationCommand] Undo failed`, error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Undo failed',
        executionTime,
        metadata: {
          commandType: this.type,
          operation: 'undo',
          errorType: error instanceof Error ? error.constructor.name : 'Unknown',
        },
      };
    }
  }

  /**
   * Check if command can be undone
   */
  public canUndo(): boolean {
    return Boolean(this.scheduledNotificationId);
  }

  /**
   * Validate command before execution
   */
  public async validate(): Promise<{ valid: boolean; errors: string[]; warnings: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate notification request
    const requestValidation = await this.validateNotificationRequest(this.data.notificationRequest);
    errors.push(...requestValidation.errors);
    warnings.push(...requestValidation.warnings);

    // Check for duplicate notifications
    if (await this.isDuplicateNotification(this.data.notificationRequest)) {
      warnings.push('Similar notification may already be scheduled');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Before execute hook
   */
  public async beforeExecute(): Promise<void> {
    devLog(`[ScheduleNotificationCommand] Preparing to schedule notification: ${this.data.notificationRequest.title}`);
    
    // Could perform additional setup here
    // e.g., check notification quotas, validate delivery time, etc.
  }

  /**
   * After execute hook
   */
  public async afterExecute(result: CommandResult): Promise<void> {
    if (result.success) {
      devLog(`[ScheduleNotificationCommand] Notification scheduled successfully: ${this.scheduledNotificationId}`);
      
      // Could trigger events, update metrics, etc.
      // this.eventEmitter.emit('notification:scheduled', { notificationId: this.scheduledNotificationId });
    } else {
      logError(`[ScheduleNotificationCommand] Notification scheduling failed: ${result.error}`);
    }
  }

  /**
   * Error handler
   */
  public async onError(error: Error): Promise<void> {
    logError(`[ScheduleNotificationCommand] Command error occurred`, error);
    
    // Could implement error recovery, notifications, etc.
  }

  // Private helper methods

  /**
   * Validate notification request structure
   */
  private async validateNotificationRequest(request: any): Promise<{ valid: boolean; errors: string[]; warnings: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!request.title || typeof request.title !== 'string') {
      errors.push('Notification title is required and must be a string');
    }

    if (!request.body || typeof request.body !== 'string') {
      errors.push('Notification body is required and must be a string');
    }

    if (!request.category || typeof request.category !== 'string') {
      errors.push('Notification category is required and must be a string');
    }

    // Validate category
    const validCategories = ['health', 'medication', 'exercise', 'diet', 'sleep', 'appointments', 'general'];
    if (request.category && !validCategories.includes(request.category)) {
      warnings.push(`Unknown notification category: ${request.category}`);
    }

    // Validate priority
    const validPriorities = ['low', 'normal', 'high', 'urgent'];
    if (request.priority && !validPriorities.includes(request.priority)) {
      warnings.push(`Unknown notification priority: ${request.priority}`);
    }

    // Validate title length
    if (request.title && request.title.length > 100) {
      warnings.push('Notification title is longer than recommended (100 characters)');
    }

    // Validate body length
    if (request.body && request.body.length > 500) {
      warnings.push('Notification body is longer than recommended (500 characters)');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Check if this is a duplicate notification
   */
  private async isDuplicateNotification(request: any): Promise<boolean> {
    try {
      // This would check against existing scheduled notifications
      // For now, return false (no duplicate detection)
      return false;
    } catch (error) {
      logError(`[ScheduleNotificationCommand] Error checking for duplicates`, error);
      return false;
    }
  }
}

/**
 * Command to update notification preferences
 */
export class UpdateNotificationPreferencesCommandImpl implements UpdateNotificationPreferencesCommand {
  public readonly id: string;
  public readonly type = 'notification:update-preferences' as const;
  public readonly description: string;
  public readonly timestamp: Date;
  public readonly metadata?: any;

  private readonly preferenceManager: any;
  private previousPreferences?: any;

  constructor(
    public readonly data: {
      preferences: any;
      previousPreferences?: any;
    },
    preferenceManager: any,
    metadata?: any
  ) {
    this.id = `update-preferences-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.description = 'Update notification preferences';
    this.timestamp = new Date();
    this.metadata = metadata;
    this.preferenceManager = preferenceManager;
    this.previousPreferences = data.previousPreferences;
  }

  /**
   * Execute the preferences update
   */
  public async execute(): Promise<CommandResult> {
    const startTime = Date.now();

    try {
      devLog(`[UpdateNotificationPreferencesCommand] Updating notification preferences`, {
        commandId: this.id,
      });

      // Get current preferences for undo
      if (!this.previousPreferences) {
        this.previousPreferences = await this.preferenceManager.getPreferences();
      }

      // Update preferences
      const updateResult = await this.preferenceManager.updatePreferences(this.data.preferences);

      if (!updateResult.success) {
        throw new Error(`Preferences update failed: ${updateResult.error}`);
      }

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        data: {
          newPreferences: this.data.preferences,
          previousPreferences: this.previousPreferences,
          updatedAt: new Date(),
        },
        executionTime,
        metadata: {
          commandType: this.type,
        },
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      logError(`[UpdateNotificationPreferencesCommand] Preferences update failed`, error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime,
        metadata: {
          commandType: this.type,
          errorType: error instanceof Error ? error.constructor.name : 'Unknown',
        },
      };
    }
  }

  /**
   * Undo the preferences update
   */
  public async undo(): Promise<CommandResult> {
    const startTime = Date.now();

    try {
      if (!this.previousPreferences) {
        throw new Error('No previous preferences to restore');
      }

      devLog(`[UpdateNotificationPreferencesCommand] Restoring previous preferences`, {
        commandId: this.id,
      });

      // Restore previous preferences
      const restoreResult = await this.preferenceManager.updatePreferences(this.previousPreferences);

      if (!restoreResult.success) {
        throw new Error(`Failed to restore previous preferences: ${restoreResult.error}`);
      }

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        data: {
          restoredPreferences: this.previousPreferences,
          restoredAt: new Date(),
        },
        executionTime,
        metadata: {
          commandType: this.type,
          operation: 'undo',
        },
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      logError(`[UpdateNotificationPreferencesCommand] Undo failed`, error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Undo failed',
        executionTime,
        metadata: {
          commandType: this.type,
          operation: 'undo',
          errorType: error instanceof Error ? error.constructor.name : 'Unknown',
        },
      };
    }
  }

  /**
   * Check if command can be undone
   */
  public canUndo(): boolean {
    return Boolean(this.previousPreferences);
  }

  /**
   * Validate command before execution
   */
  public async validate(): Promise<{ valid: boolean; errors: string[]; warnings: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate preferences structure
    if (!this.data.preferences || typeof this.data.preferences !== 'object') {
      errors.push('Preferences must be an object');
    }

    if (this.data.preferences) {
      // Validate specific preference fields
      const validFields = ['enabled', 'categories', 'quietHours', 'deliveryMethods'];
      const unknownFields = Object.keys(this.data.preferences).filter(
        field => !validFields.includes(field)
      );

      if (unknownFields.length > 0) {
        warnings.push(`Unknown preference fields: ${unknownFields.join(', ')}`);
      }

      // Validate quiet hours format
      if (this.data.preferences.quietHours) {
        const { start, end } = this.data.preferences.quietHours;
        if (!this.isValidTimeFormat(start) || !this.isValidTimeFormat(end)) {
          errors.push('Quiet hours must be in HH:MM format');
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  // Private helper methods

  /**
   * Validate time format (HH:MM)
   */
  private isValidTimeFormat(time: string): boolean {
    if (typeof time !== 'string') return false;
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  }
}

/**
 * Factory functions for creating notification commands
 */
export const NotificationCommandFactory = {
  /**
   * Create a schedule notification command
   */
  createScheduleCommand: (
    notificationRequest: any,
    notificationService: any,
    scheduledNotificationId?: string
  ): ScheduleNotificationCommandImpl => {
    return new ScheduleNotificationCommandImpl(
      { notificationRequest, scheduledNotificationId },
      notificationService
    );
  },

  /**
   * Create an update preferences command
   */
  createUpdatePreferencesCommand: (
    preferences: any,
    preferenceManager: any,
    previousPreferences?: any
  ): UpdateNotificationPreferencesCommandImpl => {
    return new UpdateNotificationPreferencesCommandImpl(
      { preferences, previousPreferences },
      preferenceManager
    );
  },
};