/**
 * Notification Schedule Command Implementation
 */

import { Command, CommandResult, ValidationResult } from '../interfaces/CommandInterfaces';

export class ScheduleNotificationCommand implements Command {
  public readonly id: string;
  public readonly type = 'notification:schedule';
  public readonly description: string;
  public readonly timestamp = new Date();
  public readonly metadata?: Record<string, any>;

  private scheduledNotificationId?: string;

  constructor(
    private notificationRequest: any,
    private notificationService: any,
    metadata?: Record<string, any>
  ) {
    this.id = `schedule-notification-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    this.description = `Schedule notification: ${notificationRequest.title}`;
    this.metadata = metadata;
  }

  async execute(): Promise<CommandResult> {
    const startTime = Date.now();
    
    try {
      const notificationId = await this.notificationService.schedule(this.notificationRequest);
      this.scheduledNotificationId = notificationId;
      
      return {
        success: true,
        data: { notificationId },
        executionTime: Date.now() - startTime,
        metadata: {
          notificationId,
          title: this.notificationRequest.title,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime: Date.now() - startTime,
      };
    }
  }

  async undo(): Promise<CommandResult> {
    const startTime = Date.now();
    
    try {
      if (!this.scheduledNotificationId) {
        return {
          success: false,
          error: 'No notification to cancel',
          executionTime: Date.now() - startTime,
        };
      }

      const cancelled = await this.notificationService.cancel(this.scheduledNotificationId);
      
      return {
        success: cancelled,
        data: { cancelled },
        executionTime: Date.now() - startTime,
        metadata: {
          cancelledNotificationId: this.scheduledNotificationId,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime: Date.now() - startTime,
      };
    }
  }

  canUndo(): boolean {
    return Boolean(this.scheduledNotificationId);
  }

  async validate(): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!this.notificationRequest.title) {
      errors.push('Notification title is required');
    }

    if (!this.notificationRequest.body) {
      errors.push('Notification body is required');
    }

    if (!this.notificationService) {
      errors.push('Notification service is required');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}