/**
 * @fileoverview Security Monitoring System (Legacy Wrapper)
 *
 * Legacy wrapper for backward compatibility with the refactored security system.
 * This file maintains the original API while using the new modular architecture.
 *
 * @author Sihat TCM Development Team
 * @version 3.0 (Refactored)
 */

// Re-export everything from the new modular system
export {
  SecurityMonitor,
  securityMonitor,
  createSecurityMiddleware,
  EventTracker,
  SecurityRuleEngine,
  ThreatAnalyzer,
} from "./security";

export type {
  SecurityEvent,
  SecurityEventType,
  IPTrackingInfo,
  UserSecurityProfile,
  SecurityRule,
  SecurityContext,
  SecurityAlert,
  SecurityStatistics,
  ThreatAssessment,
  AttackPattern,
  SecurityConfig,
  GeolocationInfo,
  SecurityReport,
} from "./security";

// Default export for backward compatibility
export { securityMonitor as default } from "./security";
