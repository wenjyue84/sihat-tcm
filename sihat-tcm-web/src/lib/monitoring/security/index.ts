/**
 * @fileoverview Security Monitoring System Exports
 *
 * Central export point for the modular security monitoring system.
 * Provides clean API access to all security system components.
 *
 * @author Sihat TCM Development Team
 * @version 1.0
 */

// Main orchestrator
export { SecurityMonitor, securityMonitor, createSecurityMiddleware } from "./SecurityMonitor";

// Core components
export { EventTracker } from "./core/EventTracker";
export { SecurityRuleEngine } from "./core/SecurityRuleEngine";

// Analysis components
export { ThreatAnalyzer } from "./analysis/ThreatAnalyzer";

// Interfaces and types
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
} from "./interfaces/SecurityInterfaces";

// Convenience exports for backward compatibility
export { securityMonitor as default } from "./SecurityMonitor";
