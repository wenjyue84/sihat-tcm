/**
 * @fileoverview Security Monitoring System
 * 
 * Comprehensive security monitoring for Sihat TCM platform.
 * Tracks authentication attempts, suspicious activities, and security events.
 * 
 * @author Sihat TCM Development Team
 * @version 3.0
 */

import { devLog } from '@/lib/systemLogger';
import { alertManager } from './alertManager';

/**
 * Security event types
 */
export type SecurityEventType = 
  | 'login_attempt'
  | 'login_success'
  | 'login_failure'
  | 'password_reset'
  | 'account_lockout'
  | 'suspicious_activity'
  | 'data_access'
  | 'privilege_escalation'
  | 'api_abuse'
  | 'injection_attempt'
  | 'xss_attempt'
  | 'csrf_attempt'
  | 'rate_limit_exceeded'
  | 'unauthorized_access';

/**
 * Security event interface
 */
export interface SecurityEvent {
  id: string;
  type: SecurityEventType;
  severity: 'low' | 'medium' | 'high' | 'critical';
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
interface IPTrackingInfo {
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
}

/**
 * User security profile
 */
interface UserSecurityProfile {
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
}

/**
 * Security rule interface
 */
interface SecurityRule {
  id: string;
  name: string;
  description: string;
  type: SecurityEventType;
  condition: (event: SecurityEvent, context: SecurityContext) => boolean;
  action: (event: SecurityEvent, context: SecurityContext) => Promise<void>;
  enabled: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Security context
 */
interface SecurityContext {
  ipTracking: Map<string, IPTrackingInfo>;
  userProfiles: Map<string, UserSecurityProfile>;
  recentEvents: SecurityEvent[];
}

/**
 * Security Monitor class
 */
export class SecurityMonitor {
  private static instance: SecurityMonitor;
  private events: SecurityEvent[] = [];
  private ipTracking: Map<string, IPTrackingInfo> = new Map();
  private userProfiles: Map<string, UserSecurityProfile> = new Map();
  private securityRules: Map<string, SecurityRule> = new Map();
  private isEnabled: boolean;
  private maxEventsInMemory: number = 10000;
  private cleanupInterval: number = 3600000; // 1 hour

  private constructor() {
    this.isEnabled = process.env.ENABLE_SECURITY_MONITORING === 'true';
    
    if (this.isEnabled) {
      this.initializeSecurityRules();
      this.startPeriodicCleanup();
    }
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): SecurityMonitor {
    if (!SecurityMonitor.instance) {
      SecurityMonitor.instance = new SecurityMonitor();
    }
    return SecurityMonitor.instance;
  }

  /**
   * Initialize security rules
   */
  private initializeSecurityRules(): void {
    const rules: SecurityRule[] = [
      {
        id: 'multiple_failed_logins',
        name: 'Multiple Failed Login Attempts',
        description: 'Detect multiple failed login attempts from same IP',
        type: 'login_failure',
        condition: (event, context) => {
          const ipInfo = context.ipTracking.get(event.ipAddress);
          return ipInfo ? ipInfo.failedLogins >= 5 : false;
        },
        action: async (event, context) => {
          await this.blockIP(event.ipAddress, 3600000); // Block for 1 hour
          await this.sendSecurityAlert('Multiple failed login attempts detected', event);
        },
        enabled: true,
        severity: 'high'
      },
      {
        id: 'suspicious_login_location',
        name: 'Suspicious Login Location',
        description: 'Detect login from unusual location',
        type: 'login_success',
        condition: (event, context) => {
          const userProfile = context.userProfiles.get(event.userId || '');
          if (!userProfile || !event.ipAddress) return false;
          
          return !userProfile.knownIPs.includes(event.ipAddress);
        },
        action: async (event, context) => {
          await this.sendSecurityAlert('Login from new location detected', event);
        },
        enabled: true,
        severity: 'medium'
      },
      {
        id: 'rapid_requests',
        name: 'Rapid API Requests',
        description: 'Detect rapid API requests indicating potential abuse',
        type: 'api_abuse',
        condition: (event, context) => {
          const recentEvents = context.recentEvents.filter(e => 
            e.ipAddress === event.ipAddress && 
            e.timestamp > Date.now() - 60000 // Last minute
          );
          return recentEvents.length > 100; // More than 100 requests per minute
        },
        action: async (event, context) => {
          await this.blockIP(event.ipAddress, 1800000); // Block for 30 minutes
          await this.sendSecurityAlert('API abuse detected - rapid requests', event);
        },
        enabled: true,
        severity: 'high'
      },
      {
        id: 'sql_injection_attempt',
        name: 'SQL Injection Attempt',
        description: 'Detect potential SQL injection in request payload',
        type: 'injection_attempt',
        condition: (event, context) => {
          if (!event.payload) return false;
          
          const payload = JSON.stringify(event.payload).toLowerCase();
          const sqlPatterns = [
            'union select',
            'drop table',
            'insert into',
            'delete from',
            'update set',
            '-- ',
            '; --',
            'xp_cmdshell',
            'sp_executesql'
          ];
          
          return sqlPatterns.some(pattern => payload.includes(pattern));
        },
        action: async (event, context) => {
          await this.blockIP(event.ipAddress, 7200000); // Block for 2 hours
          await this.sendSecurityAlert('SQL injection attempt detected', event);
        },
        enabled: true,
        severity: 'critical'
      },
      {
        id: 'xss_attempt',
        name: 'XSS Attempt',
        description: 'Detect potential XSS in request payload',
        type: 'xss_attempt',
        condition: (event, context) => {
          if (!event.payload) return false;
          
          const payload = JSON.stringify(event.payload).toLowerCase();
          const xssPatterns = [
            '<script',
            'javascript:',
            'onload=',
            'onerror=',
            'onclick=',
            'eval(',
            'alert(',
            'document.cookie'
          ];
          
          return xssPatterns.some(pattern => payload.includes(pattern));
        },
        action: async (event, context) => {
          await this.blockIP(event.ipAddress, 3600000); // Block for 1 hour
          await this.sendSecurityAlert('XSS attempt detected', event);
        },
        enabled: true,
        severity: 'high'
      },
      {
        id: 'privilege_escalation',
        name: 'Privilege Escalation Attempt',
        description: 'Detect attempts to access admin endpoints without proper authorization',
        type: 'privilege_escalation',
        condition: (event, context) => {
          return event.endpoint?.startsWith('/api/admin') && 
                 event.metadata?.userRole !== 'admin';
        },
        action: async (event, context) => {
          await this.sendSecurityAlert('Privilege escalation attempt detected', event);
        },
        enabled: true,
        severity: 'high'
      }
    ];

    rules.forEach(rule => {
      this.securityRules.set(rule.id, rule);
    });

    devLog('info', 'SecurityMonitor', `Initialized ${rules.length} security rules`);
  }

  /**
   * Record security event
   */
  public recordEvent(event: Omit<SecurityEvent, 'id' | 'timestamp'>): void {
    if (!this.isEnabled) return;

    const securityEvent: SecurityEvent = {
      ...event,
      id: `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    };

    this.events.push(securityEvent);
    
    // Update IP tracking
    this.updateIPTracking(securityEvent);
    
    // Update user profile
    if (securityEvent.userId) {
      this.updateUserProfile(securityEvent);
    }
    
    // Check security rules
    this.checkSecurityRules(securityEvent);
    
    // Log security event
    devLog('info', 'SecurityMonitor', `Security event recorded: ${event.type}`, {
      eventId: securityEvent.id,
      severity: event.severity,
      ipAddress: event.ipAddress,
      userId: event.userId
    });
    
    // Cleanup old events if needed
    if (this.events.length > this.maxEventsInMemory) {
      this.events = this.events.slice(-this.maxEventsInMemory);
    }
  }

  /**
   * Update IP tracking information
   */
  private updateIPTracking(event: SecurityEvent): void {
    let ipInfo = this.ipTracking.get(event.ipAddress);
    
    if (!ipInfo) {
      ipInfo = {
        ipAddress: event.ipAddress,
        firstSeen: event.timestamp,
        lastSeen: event.timestamp,
        requestCount: 0,
        failedLogins: 0,
        successfulLogins: 0,
        suspiciousActivities: 0,
        isBlocked: false
      };
      this.ipTracking.set(event.ipAddress, ipInfo);
    }
    
    ipInfo.lastSeen = event.timestamp;
    ipInfo.requestCount++;
    
    switch (event.type) {
      case 'login_failure':
        ipInfo.failedLogins++;
        break;
      case 'login_success':
        ipInfo.successfulLogins++;
        ipInfo.failedLogins = 0; // Reset failed attempts on success
        break;
      case 'suspicious_activity':
      case 'injection_attempt':
      case 'xss_attempt':
      case 'api_abuse':
        ipInfo.suspiciousActivities++;
        break;
    }
  }

  /**
   * Update user security profile
   */
  private updateUserProfile(event: SecurityEvent): void {
    if (!event.userId) return;
    
    let profile = this.userProfiles.get(event.userId);
    
    if (!profile) {
      profile = {
        userId: event.userId,
        lastLogin: 0,
        failedLoginAttempts: 0,
        isLocked: false,
        suspiciousActivities: 0,
        knownIPs: [],
        mfaEnabled: false
      };
      this.userProfiles.set(event.userId, profile);
    }
    
    switch (event.type) {
      case 'login_success':
        profile.lastLogin = event.timestamp;
        profile.failedLoginAttempts = 0;
        if (!profile.knownIPs.includes(event.ipAddress)) {
          profile.knownIPs.push(event.ipAddress);
          // Keep only last 10 known IPs
          if (profile.knownIPs.length > 10) {
            profile.knownIPs = profile.knownIPs.slice(-10);
          }
        }
        break;
      case 'login_failure':
        profile.failedLoginAttempts++;
        profile.lastFailedLogin = event.timestamp;
        
        // Lock account after 5 failed attempts
        if (profile.failedLoginAttempts >= 5) {
          profile.isLocked = true;
          profile.lockedUntil = event.timestamp + 1800000; // Lock for 30 minutes
        }
        break;
      case 'suspicious_activity':
      case 'injection_attempt':
      case 'xss_attempt':
        profile.suspiciousActivities++;
        break;
    }
  }

  /**
   * Check security rules
   */
  private checkSecurityRules(event: SecurityEvent): void {
    const context: SecurityContext = {
      ipTracking: this.ipTracking,
      userProfiles: this.userProfiles,
      recentEvents: this.events.slice(-1000) // Last 1000 events
    };
    
    for (const rule of this.securityRules.values()) {
      if (!rule.enabled) continue;
      
      try {
        if (rule.condition(event, context)) {
          devLog('warn', 'SecurityMonitor', `Security rule triggered: ${rule.name}`, {
            ruleId: rule.id,
            eventId: event.id,
            severity: rule.severity
          });
          
          // Execute rule action
          rule.action(event, context).catch(error => {
            devLog('error', 'SecurityMonitor', `Failed to execute security rule action: ${rule.id}`, { error });
          });
        }
      } catch (error) {
        devLog('error', 'SecurityMonitor', `Error checking security rule: ${rule.id}`, { error });
      }
    }
  }

  /**
   * Block IP address
   */
  private async blockIP(ipAddress: string, duration: number): Promise<void> {
    const ipInfo = this.ipTracking.get(ipAddress);
    if (ipInfo) {
      ipInfo.isBlocked = true;
      ipInfo.blockedUntil = Date.now() + duration;
    }
    
    devLog('warn', 'SecurityMonitor', `IP address blocked: ${ipAddress}`, {
      duration: duration / 1000 / 60, // minutes
      blockedUntil: new Date(Date.now() + duration).toISOString()
    });
    
    // Store in database for persistence across restarts
    try {
      await fetch('/api/security/block-ip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ipAddress,
          blockedUntil: Date.now() + duration,
          reason: 'Automated security block'
        })
      });
    } catch (error) {
      devLog('error', 'SecurityMonitor', 'Failed to persist IP block', { error });
    }
  }

  /**
   * Send security alert
   */
  private async sendSecurityAlert(message: string, event: SecurityEvent): Promise<void> {
    // Record alert metric
    alertManager.recordMetric('security_alert', 1);
    
    // Send to alert manager
    alertManager.recordMetric('security_events', 1);
    
    // Send immediate notification for critical events
    if (event.severity === 'critical') {
      try {
        if (process.env.SECURITY_WEBHOOK) {
          await fetch(process.env.SECURITY_WEBHOOK, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'security_alert',
              message,
              event,
              timestamp: Date.now(),
              service: 'sihat-tcm'
            })
          });
        }
        
        if (process.env.SLACK_WEBHOOK_URL) {
          await fetch(process.env.SLACK_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              channel: '#security-alerts',
              text: `🚨 SECURITY ALERT: ${message}`,
              attachments: [{
                color: 'danger',
                fields: [
                  {
                    title: 'Event Type',
                    value: event.type,
                    short: true
                  },
                  {
                    title: 'Severity',
                    value: event.severity.toUpperCase(),
                    short: true
                  },
                  {
                    title: 'IP Address',
                    value: event.ipAddress,
                    short: true
                  },
                  {
                    title: 'User ID',
                    value: event.userId || 'Anonymous',
                    short: true
                  },
                  {
                    title: 'Description',
                    value: event.description,
                    short: false
                  }
                ]
              }]
            })
          });
        }
      } catch (error) {
        devLog('error', 'SecurityMonitor', 'Failed to send security alert', { error });
      }
    }
  }

  /**
   * Check if IP is blocked
   */
  public isIPBlocked(ipAddress: string): boolean {
    const ipInfo = this.ipTracking.get(ipAddress);
    if (!ipInfo || !ipInfo.isBlocked) return false;
    
    // Check if block has expired
    if (ipInfo.blockedUntil && Date.now() > ipInfo.blockedUntil) {
      ipInfo.isBlocked = false;
      ipInfo.blockedUntil = undefined;
      return false;
    }
    
    return true;
  }

  /**
   * Check if user is locked
   */
  public isUserLocked(userId: string): boolean {
    const profile = this.userProfiles.get(userId);
    if (!profile || !profile.isLocked) return false;
    
    // Check if lock has expired
    if (profile.lockedUntil && Date.now() > profile.lockedUntil) {
      profile.isLocked = false;
      profile.lockedUntil = undefined;
      profile.failedLoginAttempts = 0;
      return false;
    }
    
    return true;
  }

  /**
   * Get security statistics
   */
  public getSecurityStatistics(): {
    totalEvents: number;
    eventsByType: Record<SecurityEventType, number>;
    blockedIPs: number;
    lockedUsers: number;
    recentEvents: SecurityEvent[];
  } {
    const eventsByType = {} as Record<SecurityEventType, number>;
    
    this.events.forEach(event => {
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
    });
    
    const blockedIPs = Array.from(this.ipTracking.values()).filter(ip => ip.isBlocked).length;
    const lockedUsers = Array.from(this.userProfiles.values()).filter(user => user.isLocked).length;
    const recentEvents = this.events.slice(-50); // Last 50 events
    
    return {
      totalEvents: this.events.length,
      eventsByType,
      blockedIPs,
      lockedUsers,
      recentEvents
    };
  }

  /**
   * Start periodic cleanup
   */
  private startPeriodicCleanup(): void {
    setInterval(() => {
      this.cleanupExpiredBlocks();
      this.cleanupOldEvents();
    }, this.cleanupInterval);
  }

  /**
   * Cleanup expired blocks and locks
   */
  private cleanupExpiredBlocks(): void {
    const now = Date.now();
    
    // Cleanup expired IP blocks
    for (const [ip, info] of this.ipTracking.entries()) {
      if (info.isBlocked && info.blockedUntil && now > info.blockedUntil) {
        info.isBlocked = false;
        info.blockedUntil = undefined;
        devLog('info', 'SecurityMonitor', `IP block expired: ${ip}`);
      }
    }
    
    // Cleanup expired user locks
    for (const [userId, profile] of this.userProfiles.entries()) {
      if (profile.isLocked && profile.lockedUntil && now > profile.lockedUntil) {
        profile.isLocked = false;
        profile.lockedUntil = undefined;
        profile.failedLoginAttempts = 0;
        devLog('info', 'SecurityMonitor', `User lock expired: ${userId}`);
      }
    }
  }

  /**
   * Cleanup old events
   */
  private cleanupOldEvents(): void {
    const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago
    const initialCount = this.events.length;
    
    this.events = this.events.filter(event => event.timestamp > cutoffTime);
    
    const removedCount = initialCount - this.events.length;
    if (removedCount > 0) {
      devLog('info', 'SecurityMonitor', `Cleaned up ${removedCount} old security events`);
    }
  }

  /**
   * Export security data for analysis
   */
  public exportSecurityData(): {
    events: SecurityEvent[];
    ipTracking: IPTrackingInfo[];
    userProfiles: UserSecurityProfile[];
    statistics: any;
  } {
    return {
      events: this.events,
      ipTracking: Array.from(this.ipTracking.values()),
      userProfiles: Array.from(this.userProfiles.values()),
      statistics: this.getSecurityStatistics()
    };
  }
}

/**
 * Global security monitor instance
 */
export const securityMonitor = SecurityMonitor.getInstance();

/**
 * Middleware for automatic security monitoring
 */
export function createSecurityMiddleware() {
  return (req: any, res: any, next: any) => {
    const startTime = Date.now();
    
    // Check if IP is blocked
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    if (securityMonitor.isIPBlocked(clientIP)) {
      return res.status(403).json({ error: 'IP address is blocked' });
    }
    
    // Record request event
    securityMonitor.recordEvent({
      type: 'data_access',
      severity: 'low',
      description: `API request to ${req.url}`,
      userId: req.user?.id,
      ipAddress: clientIP,
      userAgent: req.headers['user-agent'],
      endpoint: req.url,
      method: req.method,
      payload: req.method === 'POST' ? req.body : undefined
    });
    
    next();
  };
}