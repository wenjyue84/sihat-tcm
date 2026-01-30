/**
 * @fileoverview Security Event Tracking System
 * 
 * Handles collection, storage, and analysis of security events.
 * Provides real-time tracking and historical analysis capabilities.
 * 
 * @author Sihat TCM Development Team
 * @version 1.0
 */

import { devLog } from "@/lib/systemLogger";
import type { 
  SecurityEvent, 
  SecurityEventType, 
  IPTrackingInfo, 
  UserSecurityProfile,
  GeolocationInfo 
} from "../interfaces/SecurityInterfaces";

/**
 * Security event tracker for monitoring and analyzing security events
 */
export class EventTracker {
  private events: SecurityEvent[] = [];
  private ipTracking: Map<string, IPTrackingInfo> = new Map();
  private userProfiles: Map<string, UserSecurityProfile> = new Map();
  private readonly maxEventsInMemory: number = 10000;
  private readonly cleanupInterval: number = 3600000; // 1 hour
  private cleanupTimer?: NodeJS.Timeout;

  constructor() {
    this.startPeriodicCleanup();
  }

  /**
   * Record a security event
   */
  public recordEvent(event: Omit<SecurityEvent, "id" | "timestamp">): SecurityEvent {
    const securityEvent: SecurityEvent = {
      ...event,
      id: `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };

    this.events.push(securityEvent);

    // Update tracking information
    this.updateIPTracking(securityEvent);
    
    if (securityEvent.userId) {
      this.updateUserProfile(securityEvent);
    }

    devLog("info", "EventTracker", `Security event recorded: ${event.type}`, {
      eventId: securityEvent.id,
      severity: event.severity,
      ipAddress: event.ipAddress,
      userId: event.userId,
    });

    // Cleanup old events if needed
    if (this.events.length > this.maxEventsInMemory) {
      this.cleanupOldEvents();
    }

    return securityEvent;
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
        isBlocked: false,
        riskScore: 0,
      };
      this.ipTracking.set(event.ipAddress, ipInfo);
    }

    ipInfo.lastSeen = event.timestamp;
    ipInfo.requestCount++;

    // Update counters based on event type
    switch (event.type) {
      case "login_failure":
        ipInfo.failedLogins++;
        ipInfo.riskScore += 10;
        break;
      case "login_success":
        ipInfo.successfulLogins++;
        ipInfo.failedLogins = Math.max(0, ipInfo.failedLogins - 1); // Reduce on success
        ipInfo.riskScore = Math.max(0, ipInfo.riskScore - 5);
        break;
      case "suspicious_activity":
      case "injection_attempt":
      case "xss_attempt":
      case "api_abuse":
        ipInfo.suspiciousActivities++;
        ipInfo.riskScore += 25;
        break;
      case "unauthorized_access":
        ipInfo.riskScore += 15;
        break;
      case "rate_limit_exceeded":
        ipInfo.riskScore += 5;
        break;
    }

    // Cap risk score
    ipInfo.riskScore = Math.min(100, ipInfo.riskScore);
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
        mfaEnabled: false,
        riskScore: 0,
        securityFlags: [],
      };
      this.userProfiles.set(event.userId, profile);
    }

    // Update profile based on event type
    switch (event.type) {
      case "login_success":
        profile.lastLogin = event.timestamp;
        profile.failedLoginAttempts = 0;
        profile.riskScore = Math.max(0, profile.riskScore - 10);
        
        // Add IP to known IPs if not already present
        if (!profile.knownIPs.includes(event.ipAddress)) {
          profile.knownIPs.push(event.ipAddress);
          
          // Keep only last 10 known IPs
          if (profile.knownIPs.length > 10) {
            profile.knownIPs = profile.knownIPs.slice(-10);
          }
          
          // Flag login from new location
          profile.securityFlags.push(`new_location_${event.timestamp}`);
        }
        break;

      case "login_failure":
        profile.failedLoginAttempts++;
        profile.lastFailedLogin = event.timestamp;
        profile.riskScore += 15;

        // Lock account after threshold
        if (profile.failedLoginAttempts >= 5) {
          profile.isLocked = true;
          profile.lockedUntil = event.timestamp + 1800000; // 30 minutes
          profile.securityFlags.push(`auto_locked_${event.timestamp}`);
        }
        break;

      case "suspicious_activity":
      case "injection_attempt":
      case "xss_attempt":
        profile.suspiciousActivities++;
        profile.riskScore += 20;
        profile.securityFlags.push(`${event.type}_${event.timestamp}`);
        break;

      case "privilege_escalation":
        profile.riskScore += 30;
        profile.securityFlags.push(`privilege_escalation_${event.timestamp}`);
        break;
    }

    // Cap risk score and limit flags
    profile.riskScore = Math.min(100, profile.riskScore);
    
    // Keep only recent flags (last 50)
    if (profile.securityFlags.length > 50) {
      profile.securityFlags = profile.securityFlags.slice(-50);
    }
  }

  /**
   * Get events by type
   */
  public getEventsByType(type: SecurityEventType, limit?: number): SecurityEvent[] {
    const filtered = this.events.filter(event => event.type === type);
    return limit ? filtered.slice(-limit) : filtered;
  }

  /**
   * Get events by IP address
   */
  public getEventsByIP(ipAddress: string, limit?: number): SecurityEvent[] {
    const filtered = this.events.filter(event => event.ipAddress === ipAddress);
    return limit ? filtered.slice(-limit) : filtered;
  }

  /**
   * Get events by user ID
   */
  public getEventsByUser(userId: string, limit?: number): SecurityEvent[] {
    const filtered = this.events.filter(event => event.userId === userId);
    return limit ? filtered.slice(-limit) : filtered;
  }

  /**
   * Get events within time window
   */
  public getEventsInTimeWindow(
    startTime: number, 
    endTime: number = Date.now()
  ): SecurityEvent[] {
    return this.events.filter(
      event => event.timestamp >= startTime && event.timestamp <= endTime
    );
  }

  /**
   * Get events by severity
   */
  public getEventsBySeverity(severity: string, limit?: number): SecurityEvent[] {
    const filtered = this.events.filter(event => event.severity === severity);
    return limit ? filtered.slice(-limit) : filtered;
  }

  /**
   * Get IP tracking information
   */
  public getIPInfo(ipAddress: string): IPTrackingInfo | undefined {
    return this.ipTracking.get(ipAddress);
  }

  /**
   * Get all IP tracking information
   */
  public getAllIPInfo(): IPTrackingInfo[] {
    return Array.from(this.ipTracking.values());
  }

  /**
   * Get user security profile
   */
  public getUserProfile(userId: string): UserSecurityProfile | undefined {
    return this.userProfiles.get(userId);
  }

  /**
   * Get all user profiles
   */
  public getAllUserProfiles(): UserSecurityProfile[] {
    return Array.from(this.userProfiles.values());
  }

  /**
   * Get high-risk IPs
   */
  public getHighRiskIPs(threshold: number = 50): IPTrackingInfo[] {
    return Array.from(this.ipTracking.values())
      .filter(ip => ip.riskScore >= threshold)
      .sort((a, b) => b.riskScore - a.riskScore);
  }

  /**
   * Get high-risk users
   */
  public getHighRiskUsers(threshold: number = 50): UserSecurityProfile[] {
    return Array.from(this.userProfiles.values())
      .filter(user => user.riskScore >= threshold)
      .sort((a, b) => b.riskScore - a.riskScore);
  }

  /**
   * Get recent events
   */
  public getRecentEvents(limit: number = 100): SecurityEvent[] {
    return this.events.slice(-limit);
  }

  /**
   * Search events by criteria
   */
  public searchEvents(criteria: {
    type?: SecurityEventType;
    severity?: string;
    ipAddress?: string;
    userId?: string;
    startTime?: number;
    endTime?: number;
    limit?: number;
  }): SecurityEvent[] {
    let filtered = this.events;

    if (criteria.type) {
      filtered = filtered.filter(event => event.type === criteria.type);
    }

    if (criteria.severity) {
      filtered = filtered.filter(event => event.severity === criteria.severity);
    }

    if (criteria.ipAddress) {
      filtered = filtered.filter(event => event.ipAddress === criteria.ipAddress);
    }

    if (criteria.userId) {
      filtered = filtered.filter(event => event.userId === criteria.userId);
    }

    if (criteria.startTime) {
      filtered = filtered.filter(event => event.timestamp >= criteria.startTime!);
    }

    if (criteria.endTime) {
      filtered = filtered.filter(event => event.timestamp <= criteria.endTime!);
    }

    return criteria.limit ? filtered.slice(-criteria.limit) : filtered;
  }

  /**
   * Get event statistics
   */
  public getEventStatistics(): {
    totalEvents: number;
    eventsByType: Record<SecurityEventType, number>;
    eventsBySeverity: Record<string, number>;
    eventsLast24Hours: number;
    eventsLastHour: number;
    uniqueIPs: number;
    uniqueUsers: number;
  } {
    const now = Date.now();
    const last24Hours = now - (24 * 60 * 60 * 1000);
    const lastHour = now - (60 * 60 * 1000);

    const eventsByType = {} as Record<SecurityEventType, number>;
    const eventsBySeverity = {} as Record<string, number>;
    const uniqueIPs = new Set<string>();
    const uniqueUsers = new Set<string>();

    let eventsLast24Hours = 0;
    let eventsLastHour = 0;

    this.events.forEach(event => {
      // Count by type
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
      
      // Count by severity
      eventsBySeverity[event.severity] = (eventsBySeverity[event.severity] || 0) + 1;
      
      // Track unique IPs and users
      uniqueIPs.add(event.ipAddress);
      if (event.userId) {
        uniqueUsers.add(event.userId);
      }

      // Count recent events
      if (event.timestamp >= last24Hours) {
        eventsLast24Hours++;
      }
      if (event.timestamp >= lastHour) {
        eventsLastHour++;
      }
    });

    return {
      totalEvents: this.events.length,
      eventsByType,
      eventsBySeverity,
      eventsLast24Hours,
      eventsLastHour,
      uniqueIPs: uniqueIPs.size,
      uniqueUsers: uniqueUsers.size,
    };
  }

  /**
   * Start periodic cleanup
   */
  private startPeriodicCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupOldEvents();
      this.cleanupExpiredLocks();
    }, this.cleanupInterval);
  }

  /**
   * Cleanup old events
   */
  private cleanupOldEvents(): void {
    const cutoffTime = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days ago
    const initialCount = this.events.length;

    this.events = this.events.filter(event => event.timestamp > cutoffTime);

    const removedCount = initialCount - this.events.length;
    if (removedCount > 0) {
      devLog("info", "EventTracker", `Cleaned up ${removedCount} old security events`);
    }
  }

  /**
   * Cleanup expired user locks
   */
  private cleanupExpiredLocks(): void {
    const now = Date.now();
    let unlockedCount = 0;

    for (const profile of this.userProfiles.values()) {
      if (profile.isLocked && profile.lockedUntil && now > profile.lockedUntil) {
        profile.isLocked = false;
        profile.lockedUntil = undefined;
        profile.failedLoginAttempts = 0;
        profile.riskScore = Math.max(0, profile.riskScore - 20);
        unlockedCount++;
      }
    }

    if (unlockedCount > 0) {
      devLog("info", "EventTracker", `Unlocked ${unlockedCount} expired user accounts`);
    }
  }

  /**
   * Export tracking data
   */
  public exportData(): {
    events: SecurityEvent[];
    ipTracking: IPTrackingInfo[];
    userProfiles: UserSecurityProfile[];
  } {
    return {
      events: [...this.events],
      ipTracking: Array.from(this.ipTracking.values()),
      userProfiles: Array.from(this.userProfiles.values()),
    };
  }

  /**
   * Import tracking data
   */
  public importData(data: {
    events?: SecurityEvent[];
    ipTracking?: IPTrackingInfo[];
    userProfiles?: UserSecurityProfile[];
  }): void {
    if (data.events) {
      this.events = [...data.events];
    }

    if (data.ipTracking) {
      this.ipTracking.clear();
      data.ipTracking.forEach(ip => {
        this.ipTracking.set(ip.ipAddress, ip);
      });
    }

    if (data.userProfiles) {
      this.userProfiles.clear();
      data.userProfiles.forEach(profile => {
        this.userProfiles.set(profile.userId, profile);
      });
    }

    devLog("info", "EventTracker", "Imported security tracking data");
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }

    this.events = [];
    this.ipTracking.clear();
    this.userProfiles.clear();

    devLog("info", "EventTracker", "EventTracker destroyed");
  }
}