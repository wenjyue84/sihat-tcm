/**
 * @fileoverview Threat Analysis System
 * 
 * Analyzes security events and patterns to identify potential threats.
 * Provides risk assessment and threat intelligence capabilities.
 * 
 * @author Sihat TCM Development Team
 * @version 1.0
 */

import { devLog } from "@/lib/systemLogger";
import type { 
  SecurityEvent, 
  IPTrackingInfo, 
  UserSecurityProfile, 
  ThreatAssessment,
  AttackPattern,
  GeolocationInfo 
} from "../interfaces/SecurityInterfaces";

/**
 * Threat analyzer for security intelligence and risk assessment
 */
export class ThreatAnalyzer {
  private attackPatterns: Map<string, AttackPattern> = new Map();
  private geoCache: Map<string, GeolocationInfo> = new Map();

  constructor() {
    this.initializeAttackPatterns();
  }

  /**
   * Initialize known attack patterns
   */
  private initializeAttackPatterns(): void {
    const patterns: AttackPattern[] = [
      {
        id: "brute_force_login",
        name: "Brute Force Login Attack",
        description: "Systematic attempts to guess user credentials",
        indicators: [
          "high_failed_login_rate",
          "sequential_username_attempts",
          "dictionary_password_patterns"
        ],
        severity: "high",
        mitigation: [
          "Implement account lockout policies",
          "Use CAPTCHA after failed attempts",
          "Enable multi-factor authentication",
          "Monitor and block suspicious IPs"
        ],
      },
      {
        id: "sql_injection_attack",
        name: "SQL Injection Attack",
        description: "Attempts to inject malicious SQL code",
        indicators: [
          "sql_keywords_in_payload",
          "union_select_patterns",
          "comment_injection_attempts"
        ],
        severity: "critical",
        mitigation: [
          "Use parameterized queries",
          "Implement input validation",
          "Apply principle of least privilege",
          "Regular security code reviews"
        ],
      },
      {
        id: "xss_attack",
        name: "Cross-Site Scripting Attack",
        description: "Attempts to inject malicious scripts",
        indicators: [
          "script_tags_in_input",
          "javascript_protocol_usage",
          "event_handler_injection"
        ],
        severity: "high",
        mitigation: [
          "Implement Content Security Policy",
          "Sanitize user input",
          "Use output encoding",
          "Validate all user inputs"
        ],
      },
      {
        id: "ddos_attack",
        name: "Distributed Denial of Service",
        description: "Attempts to overwhelm system resources",
        indicators: [
          "high_request_volume",
          "multiple_source_ips",
          "resource_exhaustion_patterns"
        ],
        severity: "critical",
        mitigation: [
          "Implement rate limiting",
          "Use CDN and load balancers",
          "Deploy DDoS protection services",
          "Monitor traffic patterns"
        ],
      },
      {
        id: "account_takeover",
        name: "Account Takeover Attempt",
        description: "Attempts to gain unauthorized access to user accounts",
        indicators: [
          "credential_stuffing_patterns",
          "session_hijacking_attempts",
          "unusual_login_locations"
        ],
        severity: "high",
        mitigation: [
          "Implement device fingerprinting",
          "Monitor login anomalies",
          "Use behavioral analytics",
          "Require re-authentication for sensitive actions"
        ],
      },
    ];

    patterns.forEach(pattern => {
      this.attackPatterns.set(pattern.id, pattern);
    });

    devLog("info", "ThreatAnalyzer", `Initialized ${patterns.length} attack patterns`);
  }

  /**
   * Analyze threat level for an IP address
   */
  public analyzeIPThreat(ipInfo: IPTrackingInfo, recentEvents: SecurityEvent[]): ThreatAssessment {
    let riskScore = ipInfo.riskScore;
    const factors: string[] = [];
    const recommendations: string[] = [];
    const immediateActions: string[] = [];

    // Analyze failed login patterns
    if (ipInfo.failedLogins > 10) {
      riskScore += 20;
      factors.push(`High failed login count: ${ipInfo.failedLogins}`);
      recommendations.push("Implement progressive delays for failed logins");
      
      if (ipInfo.failedLogins > 20) {
        immediateActions.push("Block IP address immediately");
      }
    }

    // Analyze suspicious activities
    if (ipInfo.suspiciousActivities > 5) {
      riskScore += 25;
      factors.push(`Multiple suspicious activities: ${ipInfo.suspiciousActivities}`);
      recommendations.push("Investigate IP address history and patterns");
      
      if (ipInfo.suspiciousActivities > 10) {
        immediateActions.push("Add IP to high-risk monitoring list");
      }
    }

    // Analyze request patterns
    const recentIPEvents = recentEvents.filter(e => e.ipAddress === ipInfo.ipAddress);
    const requestRate = this.calculateRequestRate(recentIPEvents);
    
    if (requestRate > 100) { // More than 100 requests per minute
      riskScore += 15;
      factors.push(`High request rate: ${requestRate} req/min`);
      recommendations.push("Implement rate limiting");
      
      if (requestRate > 500) {
        immediateActions.push("Apply emergency rate limiting");
      }
    }

    // Analyze geolocation risks
    if (ipInfo.country) {
      const geoRisk = this.assessGeolocationRisk(ipInfo.country);
      riskScore += geoRisk;
      
      if (geoRisk > 0) {
        factors.push(`Geographic risk factor: ${ipInfo.country}`);
        recommendations.push("Verify user identity for high-risk locations");
      }
    }

    // Analyze attack patterns
    const detectedPatterns = this.detectAttackPatterns(recentIPEvents);
    detectedPatterns.forEach(pattern => {
      riskScore += this.getPatternRiskScore(pattern);
      factors.push(`Detected attack pattern: ${pattern.name}`);
      recommendations.push(...pattern.mitigation);
      
      if (pattern.severity === "critical") {
        immediateActions.push(`Respond to ${pattern.name} immediately`);
      }
    });

    // Cap risk score
    riskScore = Math.min(100, riskScore);

    return {
      riskLevel: this.getRiskLevel(riskScore),
      riskScore,
      factors,
      recommendations: [...new Set(recommendations)], // Remove duplicates
      immediateActions: [...new Set(immediateActions)],
    };
  }

  /**
   * Analyze threat level for a user
   */
  public analyzeUserThreat(userProfile: UserSecurityProfile, recentEvents: SecurityEvent[]): ThreatAssessment {
    let riskScore = userProfile.riskScore;
    const factors: string[] = [];
    const recommendations: string[] = [];
    const immediateActions: string[] = [];

    // Analyze failed login attempts
    if (userProfile.failedLoginAttempts > 3) {
      riskScore += 15;
      factors.push(`Recent failed login attempts: ${userProfile.failedLoginAttempts}`);
      recommendations.push("Enable account monitoring");
      
      if (userProfile.failedLoginAttempts > 10) {
        immediateActions.push("Lock account temporarily");
      }
    }

    // Analyze suspicious activities
    if (userProfile.suspiciousActivities > 3) {
      riskScore += 20;
      factors.push(`Suspicious activities detected: ${userProfile.suspiciousActivities}`);
      recommendations.push("Require additional verification");
      
      if (userProfile.suspiciousActivities > 8) {
        immediateActions.push("Flag account for manual review");
      }
    }

    // Analyze login patterns
    const userEvents = recentEvents.filter(e => e.userId === userProfile.userId);
    const loginLocations = this.analyzeLoginLocations(userEvents, userProfile.knownIPs);
    
    if (loginLocations.newLocations > 0) {
      riskScore += 10 * loginLocations.newLocations;
      factors.push(`Logins from ${loginLocations.newLocations} new locations`);
      recommendations.push("Verify identity for new login locations");
      
      if (loginLocations.newLocations > 3) {
        immediateActions.push("Require multi-factor authentication");
      }
    }

    // Analyze security flags
    const recentFlags = userProfile.securityFlags.filter(flag => {
      const timestamp = parseInt(flag.split('_').pop() || '0');
      return Date.now() - timestamp < 24 * 60 * 60 * 1000; // Last 24 hours
    });

    if (recentFlags.length > 5) {
      riskScore += 25;
      factors.push(`Multiple security flags in 24h: ${recentFlags.length}`);
      recommendations.push("Conduct security review");
      immediateActions.push("Escalate to security team");
    }

    // Check for account compromise indicators
    const compromiseIndicators = this.detectCompromiseIndicators(userEvents);
    compromiseIndicators.forEach(indicator => {
      riskScore += 30;
      factors.push(`Compromise indicator: ${indicator}`);
      recommendations.push("Force password reset");
      immediateActions.push("Suspend account pending investigation");
    });

    // MFA analysis
    if (!userProfile.mfaEnabled) {
      riskScore += 10;
      factors.push("Multi-factor authentication not enabled");
      recommendations.push("Enable multi-factor authentication");
    }

    // Cap risk score
    riskScore = Math.min(100, riskScore);

    return {
      riskLevel: this.getRiskLevel(riskScore),
      riskScore,
      factors,
      recommendations: [...new Set(recommendations)],
      immediateActions: [...new Set(immediateActions)],
    };
  }

  /**
   * Calculate request rate from events
   */
  private calculateRequestRate(events: SecurityEvent[]): number {
    if (events.length === 0) return 0;

    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const recentEvents = events.filter(e => e.timestamp > oneMinuteAgo);
    
    return recentEvents.length;
  }

  /**
   * Assess geolocation risk
   */
  private assessGeolocationRisk(country: string): number {
    // High-risk countries (this would typically come from threat intelligence feeds)
    const highRiskCountries = ["CN", "RU", "KP", "IR"];
    const mediumRiskCountries = ["PK", "BD", "NG", "ID"];
    
    if (highRiskCountries.includes(country)) {
      return 20;
    } else if (mediumRiskCountries.includes(country)) {
      return 10;
    }
    
    return 0;
  }

  /**
   * Detect attack patterns in events
   */
  private detectAttackPatterns(events: SecurityEvent[]): AttackPattern[] {
    const detectedPatterns: AttackPattern[] = [];

    // Check for brute force patterns
    const loginFailures = events.filter(e => e.type === "login_failure");
    if (loginFailures.length > 10) {
      const pattern = this.attackPatterns.get("brute_force_login");
      if (pattern) detectedPatterns.push(pattern);
    }

    // Check for injection patterns
    const injectionAttempts = events.filter(e => 
      e.type === "injection_attempt" || e.type === "xss_attempt"
    );
    if (injectionAttempts.length > 0) {
      injectionAttempts.forEach(event => {
        if (event.type === "injection_attempt") {
          const pattern = this.attackPatterns.get("sql_injection_attack");
          if (pattern) detectedPatterns.push(pattern);
        } else if (event.type === "xss_attempt") {
          const pattern = this.attackPatterns.get("xss_attack");
          if (pattern) detectedPatterns.push(pattern);
        }
      });
    }

    // Check for DDoS patterns
    if (events.length > 1000) { // High volume of events
      const pattern = this.attackPatterns.get("ddos_attack");
      if (pattern) detectedPatterns.push(pattern);
    }

    return detectedPatterns;
  }

  /**
   * Get risk score for attack pattern
   */
  private getPatternRiskScore(pattern: AttackPattern): number {
    switch (pattern.severity) {
      case "critical": return 40;
      case "high": return 25;
      case "medium": return 15;
      case "low": return 5;
      default: return 0;
    }
  }

  /**
   * Analyze login locations
   */
  private analyzeLoginLocations(events: SecurityEvent[], knownIPs: string[]): {
    newLocations: number;
    suspiciousPatterns: string[];
  } {
    const loginEvents = events.filter(e => e.type === "login_success");
    const newIPs = loginEvents
      .map(e => e.ipAddress)
      .filter(ip => !knownIPs.includes(ip));
    
    const uniqueNewIPs = [...new Set(newIPs)];
    const suspiciousPatterns: string[] = [];

    // Check for rapid location changes
    if (uniqueNewIPs.length > 2) {
      suspiciousPatterns.push("Multiple new locations in short time");
    }

    // Check for impossible travel
    // This would require geolocation data and time analysis
    // Simplified version here
    if (loginEvents.length > 1) {
      const timeDiffs = loginEvents
        .slice(1)
        .map((event, i) => event.timestamp - loginEvents[i].timestamp);
      
      const rapidLogins = timeDiffs.filter(diff => diff < 300000); // 5 minutes
      if (rapidLogins.length > 0 && uniqueNewIPs.length > 1) {
        suspiciousPatterns.push("Impossible travel detected");
      }
    }

    return {
      newLocations: uniqueNewIPs.length,
      suspiciousPatterns,
    };
  }

  /**
   * Detect account compromise indicators
   */
  private detectCompromiseIndicators(events: SecurityEvent[]): string[] {
    const indicators: string[] = [];

    // Check for privilege escalation attempts
    const privEscalation = events.filter(e => e.type === "privilege_escalation");
    if (privEscalation.length > 0) {
      indicators.push("Privilege escalation attempts");
    }

    // Check for data access anomalies
    const dataAccess = events.filter(e => e.type === "data_access");
    if (dataAccess.length > 50) { // Unusually high data access
      indicators.push("Abnormal data access patterns");
    }

    // Check for suspicious API usage
    const apiAbuse = events.filter(e => e.type === "api_abuse");
    if (apiAbuse.length > 0) {
      indicators.push("API abuse detected");
    }

    return indicators;
  }

  /**
   * Get risk level from score
   */
  private getRiskLevel(score: number): "low" | "medium" | "high" | "critical" {
    if (score >= 80) return "critical";
    if (score >= 60) return "high";
    if (score >= 30) return "medium";
    return "low";
  }

  /**
   * Generate comprehensive threat report
   */
  public generateThreatReport(
    events: SecurityEvent[],
    ipTracking: IPTrackingInfo[],
    userProfiles: UserSecurityProfile[]
  ): {
    summary: {
      totalThreats: number;
      criticalThreats: number;
      highRiskIPs: number;
      highRiskUsers: number;
    };
    topThreats: {
      ips: Array<{ ip: string; assessment: ThreatAssessment }>;
      users: Array<{ userId: string; assessment: ThreatAssessment }>;
    };
    attackPatterns: AttackPattern[];
    recommendations: string[];
  } {
    const ipAssessments = ipTracking.map(ip => ({
      ip: ip.ipAddress,
      assessment: this.analyzeIPThreat(ip, events),
    }));

    const userAssessments = userProfiles.map(user => ({
      userId: user.userId,
      assessment: this.analyzeUserThreat(user, events),
    }));

    const criticalIPs = ipAssessments.filter(a => a.assessment.riskLevel === "critical");
    const criticalUsers = userAssessments.filter(a => a.assessment.riskLevel === "critical");
    const highRiskIPs = ipAssessments.filter(a => 
      a.assessment.riskLevel === "high" || a.assessment.riskLevel === "critical"
    );
    const highRiskUsers = userAssessments.filter(a => 
      a.assessment.riskLevel === "high" || a.assessment.riskLevel === "critical"
    );

    // Detect active attack patterns
    const detectedPatterns = this.detectAttackPatterns(events);

    // Aggregate recommendations
    const allRecommendations = [
      ...ipAssessments.flatMap(a => a.assessment.recommendations),
      ...userAssessments.flatMap(a => a.assessment.recommendations),
    ];
    const uniqueRecommendations = [...new Set(allRecommendations)];

    return {
      summary: {
        totalThreats: criticalIPs.length + criticalUsers.length,
        criticalThreats: criticalIPs.length + criticalUsers.length,
        highRiskIPs: highRiskIPs.length,
        highRiskUsers: highRiskUsers.length,
      },
      topThreats: {
        ips: ipAssessments
          .sort((a, b) => b.assessment.riskScore - a.assessment.riskScore)
          .slice(0, 10),
        users: userAssessments
          .sort((a, b) => b.assessment.riskScore - a.assessment.riskScore)
          .slice(0, 10),
      },
      attackPatterns: detectedPatterns,
      recommendations: uniqueRecommendations.slice(0, 20), // Top 20 recommendations
    };
  }

  /**
   * Get attack pattern by ID
   */
  public getAttackPattern(patternId: string): AttackPattern | undefined {
    return this.attackPatterns.get(patternId);
  }

  /**
   * Get all attack patterns
   */
  public getAllAttackPatterns(): AttackPattern[] {
    return Array.from(this.attackPatterns.values());
  }
}