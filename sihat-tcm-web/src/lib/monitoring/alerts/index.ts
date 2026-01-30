/**
 * @fileoverview Alert System Exports
 * 
 * Central export point for the modular alert management system.
 * Provides clean API access to all alert system components.
 * 
 * @author Sihat TCM Development Team
 * @version 1.0
 */

// Main orchestrator
export { AlertManager, alertManager } from "./AlertManager";

// Core components
export { MetricCollector } from "./core/MetricCollector";
export { AlertRuleEngine } from "./core/AlertRuleEngine";
export { IncidentManager } from "./core/IncidentManager";

// Notification system
export { NotificationDispatcher } from "./notifications/NotificationDispatcher";

// Interfaces and types
export type {
  Alert,
  AlertRule,
  AlertCondition,
  AlertSeverity,
  AlertCategory,
  Incident,
  IncidentTimelineEntry,
  NotificationChannel,
  NotificationContext,
  MetricHistoryEntry,
  AlertStatistics,
  AlertManagerConfig,
  AlertEvaluationContext,
  EscalationConfig,
} from "./interfaces/AlertInterfaces";

// Convenience exports for backward compatibility
export { alertManager as default } from "./AlertManager";