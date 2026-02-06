/**
 * @fileoverview Notification Dispatcher
 *
 * Handles dispatching notifications to various channels (Slack, email, SMS, webhook, PagerDuty).
 * Formats messages based on alert severity and incident context.
 *
 * @author Sihat TCM Development Team
 * @version 1.0
 */

import { devLog } from "@/lib/systemLogger";
import type {
  Alert,
  Incident,
  NotificationChannel,
  NotificationContext,
} from "../interfaces/AlertInterfaces";

/**
 * Notification Dispatcher class
 * Sends notifications to configured channels when alerts are triggered
 */
export class NotificationDispatcher {
  private readonly service: string;
  private readonly environment: string;

  constructor() {
    this.service = process.env.SERVICE_NAME || "sihat-tcm";
    this.environment = process.env.NODE_ENV || "development";
  }

  /**
   * Send notifications to all configured channels
   */
  public async sendNotifications(
    alert: Alert,
    channels: NotificationChannel[],
    incident?: Incident
  ): Promise<void> {
    const context: NotificationContext = {
      alert,
      incident,
      service: this.service,
      environment: this.environment,
      timestamp: Date.now(),
    };

    const enabledChannels = channels.filter((channel) => channel.enabled);

    if (enabledChannels.length === 0) {
      devLog("debug", "NotificationDispatcher", "No enabled notification channels configured");
      return;
    }

    const notificationPromises = enabledChannels.map((channel) =>
      this.sendToChannel(channel, context).catch((error) => {
        devLog(
          "error",
          "NotificationDispatcher",
          `Failed to send notification to ${channel.type}`,
          {
            error: error instanceof Error ? error.message : String(error),
            channelType: channel.type,
            alertId: alert.id,
          }
        );
      })
    );

    await Promise.allSettled(notificationPromises);
  }

  /**
   * Send notification to a specific channel
   */
  private async sendToChannel(
    channel: NotificationChannel,
    context: NotificationContext
  ): Promise<void> {
    switch (channel.type) {
      case "slack":
        await this.sendSlackNotification(channel.config, context);
        break;
      case "email":
        await this.sendEmailNotification(channel.config, context);
        break;
      case "sms":
        await this.sendSMSNotification(channel.config, context);
        break;
      case "webhook":
        await this.sendWebhookNotification(channel.config, context);
        break;
      case "pagerduty":
        await this.sendPagerDutyNotification(channel.config, context);
        break;
      default:
        devLog("warn", "NotificationDispatcher", `Unknown channel type: ${channel.type}`);
    }
  }

  /**
   * Send Slack notification
   */
  private async sendSlackNotification(
    config: Record<string, unknown>,
    context: NotificationContext
  ): Promise<void> {
    const webhookUrl = (config.webhookUrl as string) || process.env.SLACK_WEBHOOK_URL;

    if (!webhookUrl) {
      devLog("warn", "NotificationDispatcher", "Slack webhook URL not configured");
      return;
    }

    const color = this.getSeverityColor(context.alert.severity);
    const channel = (config.channel as string) || "#alerts";

    const payload = {
      channel,
      attachments: [
        {
          color,
          title: `[${context.alert.severity.toUpperCase()}] ${context.alert.title}`,
          text: context.alert.description,
          fields: [
            {
              title: "Service",
              value: context.service,
              short: true,
            },
            {
              title: "Environment",
              value: context.environment,
              short: true,
            },
            {
              title: "Category",
              value: context.alert.category,
              short: true,
            },
            {
              title: "Source",
              value: context.alert.source,
              short: true,
            },
          ],
          footer: "Sihat TCM Alert System",
          ts: Math.floor(context.timestamp / 1000),
        },
      ],
    };

    // Add incident information if available
    if (context.incident) {
      payload.attachments[0].fields.push({
        title: "Incident",
        value: `${context.incident.id} (${context.incident.status})`,
        short: true,
      });
    }

    await this.sendHTTPRequest(webhookUrl, payload);

    devLog("debug", "NotificationDispatcher", "Slack notification sent", {
      alertId: context.alert.id,
      channel,
    });
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(
    config: Record<string, unknown>,
    context: NotificationContext
  ): Promise<void> {
    const emailEndpoint = (config.endpoint as string) || process.env.EMAIL_NOTIFICATION_ENDPOINT;

    if (!emailEndpoint) {
      devLog("warn", "NotificationDispatcher", "Email notification endpoint not configured");
      return;
    }

    const recipients = (config.recipients as string[]) || [];

    if (recipients.length === 0) {
      devLog("warn", "NotificationDispatcher", "No email recipients configured");
      return;
    }

    const subject = `[${context.alert.severity.toUpperCase()}] ${context.alert.title} - ${context.service}`;

    const payload = {
      to: recipients,
      subject,
      body: this.formatEmailBody(context),
    };

    await this.sendHTTPRequest(emailEndpoint, payload);

    devLog("debug", "NotificationDispatcher", "Email notification sent", {
      alertId: context.alert.id,
      recipientCount: recipients.length,
    });
  }

  /**
   * Send SMS notification
   */
  private async sendSMSNotification(
    config: Record<string, unknown>,
    context: NotificationContext
  ): Promise<void> {
    const smsEndpoint = (config.endpoint as string) || process.env.SMS_NOTIFICATION_ENDPOINT;

    if (!smsEndpoint) {
      devLog("warn", "NotificationDispatcher", "SMS notification endpoint not configured");
      return;
    }

    const phoneNumbers = (config.phoneNumbers as string[]) || [];

    if (phoneNumbers.length === 0) {
      devLog("warn", "NotificationDispatcher", "No SMS recipients configured");
      return;
    }

    // SMS messages should be concise
    const message = `[${context.alert.severity.toUpperCase()}] ${context.alert.title}: ${context.alert.description.substring(0, 100)}`;

    const payload = {
      to: phoneNumbers,
      message,
    };

    await this.sendHTTPRequest(smsEndpoint, payload);

    devLog("debug", "NotificationDispatcher", "SMS notification sent", {
      alertId: context.alert.id,
      recipientCount: phoneNumbers.length,
    });
  }

  /**
   * Send webhook notification
   */
  private async sendWebhookNotification(
    config: Record<string, unknown>,
    context: NotificationContext
  ): Promise<void> {
    const webhookUrl = config.url as string;

    if (!webhookUrl) {
      devLog("warn", "NotificationDispatcher", "Webhook URL not configured");
      return;
    }

    const payload = {
      type: "alert",
      alert: context.alert,
      incident: context.incident,
      service: context.service,
      environment: context.environment,
      timestamp: context.timestamp,
    };

    const headers = (config.headers as Record<string, string>) || {};

    await this.sendHTTPRequest(webhookUrl, payload, headers);

    devLog("debug", "NotificationDispatcher", "Webhook notification sent", {
      alertId: context.alert.id,
      url: webhookUrl,
    });
  }

  /**
   * Send PagerDuty notification
   */
  private async sendPagerDutyNotification(
    config: Record<string, unknown>,
    context: NotificationContext
  ): Promise<void> {
    const routingKey = (config.routingKey as string) || process.env.PAGERDUTY_ROUTING_KEY;

    if (!routingKey) {
      devLog("warn", "NotificationDispatcher", "PagerDuty routing key not configured");
      return;
    }

    const severity = this.mapToPagerDutySeverity(context.alert.severity);

    const payload = {
      routing_key: routingKey,
      event_action: "trigger",
      dedup_key: context.alert.id,
      payload: {
        summary: `${context.alert.title}: ${context.alert.description}`,
        severity,
        source: context.service,
        component: context.alert.source,
        group: context.alert.category,
        class: context.alert.severity,
        custom_details: {
          alert_id: context.alert.id,
          environment: context.environment,
          incident_id: context.incident?.id,
          timestamp: new Date(context.timestamp).toISOString(),
          ...context.alert.metadata,
        },
      },
    };

    await this.sendHTTPRequest("https://events.pagerduty.com/v2/enqueue", payload);

    devLog("debug", "NotificationDispatcher", "PagerDuty notification sent", {
      alertId: context.alert.id,
      severity,
    });
  }

  /**
   * Test a notification channel
   */
  public async testChannel(channel: NotificationChannel): Promise<boolean> {
    const testAlert: Alert = {
      id: `test_${Date.now()}`,
      title: "Test Alert",
      description: "This is a test notification from Sihat TCM Alert System",
      severity: "info",
      category: "system_health",
      source: "NotificationDispatcher",
      timestamp: Date.now(),
      metadata: { test: true },
    };

    const context: NotificationContext = {
      alert: testAlert,
      service: this.service,
      environment: this.environment,
      timestamp: Date.now(),
    };

    try {
      await this.sendToChannel(channel, context);
      devLog("info", "NotificationDispatcher", `Channel test successful: ${channel.type}`);
      return true;
    } catch (error) {
      devLog("error", "NotificationDispatcher", `Channel test failed: ${channel.type}`, {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * Send HTTP request with error handling
   */
  private async sendHTTPRequest(
    url: string,
    payload: Record<string, unknown>,
    additionalHeaders: Record<string, string> = {}
  ): Promise<void> {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...additionalHeaders,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP request failed: ${response.status} ${response.statusText}`);
    }
  }

  /**
   * Get color based on severity for Slack notifications
   */
  private getSeverityColor(severity: Alert["severity"]): string {
    switch (severity) {
      case "critical":
        return "#FF0000"; // Red
      case "error":
        return "#FF6600"; // Orange
      case "warning":
        return "#FFCC00"; // Yellow
      case "info":
      default:
        return "#0066FF"; // Blue
    }
  }

  /**
   * Map alert severity to PagerDuty severity
   */
  private mapToPagerDutySeverity(severity: Alert["severity"]): string {
    switch (severity) {
      case "critical":
        return "critical";
      case "error":
        return "error";
      case "warning":
        return "warning";
      case "info":
      default:
        return "info";
    }
  }

  /**
   * Format email body
   */
  private formatEmailBody(context: NotificationContext): string {
    const lines = [
      `Alert: ${context.alert.title}`,
      `Severity: ${context.alert.severity.toUpperCase()}`,
      ``,
      `Description:`,
      context.alert.description,
      ``,
      `Details:`,
      `- Service: ${context.service}`,
      `- Environment: ${context.environment}`,
      `- Category: ${context.alert.category}`,
      `- Source: ${context.alert.source}`,
      `- Time: ${new Date(context.timestamp).toISOString()}`,
    ];

    if (context.incident) {
      lines.push(
        ``,
        `Incident:`,
        `- ID: ${context.incident.id}`,
        `- Status: ${context.incident.status}`,
        `- Alert Count: ${context.incident.alerts.length}`
      );
    }

    lines.push(``, `---`, `Sihat TCM Alert System`);

    return lines.join("\n");
  }
}
