/**
 * @fileoverview Security Monitoring Interfaces
 * 
 * Core interfaces and types for the security monitoring system.
 * Defines structures for security events, tracking, and analysis.
 * 
 * @author Sihat TCM Development Team
 * @version 1.0
 */

/**
 * Security event types
 */
export type SecurityEventType =
  | "login_attempt"
  | "login_success"
  | "login_failure"
  | "password_reset"
  | "account_lockout"
  | "suspicious_activity"
  | "data_access"
  | "privilege_escalation"
  | "api_abuse"
  | "injection_attempt"
  | "xss_attempt"
  | "csrf_attempt"
  | "rate_limit_exceeded"
  | "unauthorized_access";

/**
 * Security event interface
 */
export interface SecurityEvent {
  id: string;
  type: SecurityEventType;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  userId?: string;
  ipAddress: string;
  userAgent?: string;
  endpoint?: string;
  method?: string;
  payload?: any;
  timestamp: number;
  metadata?: Record<string, any>;
}

/**
 * IP tracking information
 */
export interface IPTrackingInfo {
  ipAddress: string;
  firstSeen: number;
  lastSeen: number;
  requestCount: number;
  failedLogins: number;
  successfulLogins: number;
  suspiciousActivities: number;
  isBlocked: boolean;
  blockedUntil?: number;
  country?: string;
  city?: string;
  isp?: string;
  riskScore: number;
}

/**
 * User security profile
 */
export interface UserSecurityProfile {
  userId: string;
  lastLogin: number;
  failedLoginAttempts: number;
  lastFailedLogin?: number;
  isLocked: boolean;
  lockedUntil?: number;
  suspiciousActivities: number;
  knownIPs: string[];
  lastPasswordChange?: number;
  mfaEnabled: boolean;
  riskScore: number;
  securityFlags: string[];
}

/**
 * Security rule interface
 */
export interface SecurityRule {
  id: string;
  name: string;
  description: string;
  type: SecurityEventType;
  condition: (event: SecurityEvent, context: SecurityContext) => boolean;
  action: (event: SecurityEvent, context: SecurityContext) => Promise<void>;
  enabled: boolean;
  severity: "low" | "medium" | "high" | "critical";
  priority: number;
}

/**
 * Security context for rule evaluation
 */
export interface SecurityContext {
  ipTracking: Map<string, IPTrackingInfo>;
  userProfiles: Map<string, UserSecurityProfile>;
  recentEvents: SecurityEvent[];
  blockedIPs: Set<string>;
  lockedUsers: Set<string>;
}

/**
 * Security alert interface
 */
export interface SecurityAlert {
  id: string;
  ruleId: string;
  event: SecurityEvent;
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  timestamp: number;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: number;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: number;
}

/**
 * Security statistics interface
 */
export interface SecurityStatistics {
  totalEvents: number;
  eventsByType: Record<SecurityEventType, number>;
  eventsBySeverity: Record<string, number>;
  blockedIPs: number;
  lockedUsers: number;
  recentEvents: SecurityEvent[];
  topRiskyIPs: IPTrackingInfo[];
  topRiskyUsers: UserSecurityProfile[];
  alertsByRule: Record<string, number>;
}

/**
 * Threat assessment result
 */
export interface ThreatAssessment {
  riskLevel: "low" | "medium" | "high" | "critical";
  riskScore: number;
  factors: string[];
  recommendations: string[];
  immediateActions: string[];
}

/**
 * Security configuration
 */
export interface SecurityConfig {
  enabled: boolean;
  maxEventsInMemory: number;
  cleanupInterval: number;
  ipBlockDuration: number;
  userLockDuration: number;
  maxFailedLogins: number;
  rateLimit: {
    requests: number;
    window: number; // milliseconds
  };
  alertThresholds: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
}

/**
 * Geolocation information
 */
export interface GeolocationInfo {
  country?: string;
  region?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  isp?: string;
  organization?: string;
  timezone?: string;
}

/**
 * Attack pattern interface
 */
export interface AttackPattern {
  id: string;
  name: string;
  description: string;
  indicators: string[];
  severity: "low" | "medium" | "high" | "critical";
  mitigation: string[];
}

/**
 * Security report interface
 */
export interface SecurityReport {
  id: string;
  title: string;
  period: {
    start: number;
    end: number;
  };
  summary: SecurityStatistics;
  incidents: SecurityAlert[];
  threatAssessment: ThreatAssessment;
  recommendations: string[];
  generatedAt: number;
  generatedBy?: string;
}