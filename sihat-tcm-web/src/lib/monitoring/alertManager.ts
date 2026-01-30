/**
 * @fileoverview Alert Management System (Legacy Wrapper)
 *
 * Legacy wrapper for backward compatibility with the refactored alert system.
 * This file maintains the original API while using the new modular architecture.
 *
 * @author Sihat TCM Development Team
 * @version 3.0 (Refactored)
 */

// Re-export everything from the new modular system
export {
  AlertManager,
  alertManager,
  MetricCollector,
  AlertRuleEngine,
  IncidentManager,
  NotificationDispatcher,
} from "./alerts";

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
} from "./alerts";

// Default export for backward compatibility
export { alertManager as default } from "./alerts";
