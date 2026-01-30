/**
 * @fileoverview Incident Management System
 * 
 * Manages incidents, escalation, timeline tracking, and incident lifecycle.
 * Groups related alerts into incidents for better incident response.
 * 
 * @author Sihat TCM Development Team
 * @version 1.0
 */

import { devLog } from "@/lib/systemLogger";
import type { 
  Alert, 
  Incident, 
  IncidentTimelineEntry, 
  AlertSeverity,
  AlertCategory 
} from "../interfaces/AlertInterfaces";

/**
 * Incident manager for handling alert grouping and incident lifecycle
 */
export class IncidentManager {
  private incidents: Map<string, Incident> = new Map();
  private readonly maxIncidentsInMemory: number = 1000;

  /**
   * Create or update incident from alert
   */
  public async createOrUpdateIncident(alert: Alert): Promise<Incident> {
    // Look for existing open incident with same category
    const existingIncident = this.findRelatedIncident(alert);

    if (existingIncident) {
      return this.addAlertToIncident(existingIncident, alert);
    } else {
      return this.createNewIncident(alert);
    }
  }

  /**
   * Find related incident for an alert
   */
  private findRelatedIncident(alert: Alert): Incident | null {
    // Look for open incidents in the same category within the last hour
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    
    for (const incident of this.incidents.values()) {
      if (
        incident.status === "open" &&
        incident.createdAt > oneHourAgo &&
        incident.alerts.some(a => a.category === alert.category)
      ) {
        return incident;
      }
    }

    return null;
  }

  /**
   * Create new incident from alert
   */
  private createNewIncident(alert: Alert): Incident {
    const incidentId = `incident_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const incident: Incident = {
      id: incidentId,
      title: `${alert.category} - ${alert.title}`,
      description: alert.description,
      severity: alert.severity,
      status: "open",
      alerts: [alert],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      timeline: [
        {
          timestamp: Date.now(),
          action: "incident_created",
          description: `Incident created from alert: ${alert.title}`,
          metadata: { alertId: alert.id },
        },
      ],
    };

    this.incidents.set(incidentId, incident);

    devLog("warn", "IncidentManager", `New incident created: ${incidentId}`, {
      severity: incident.severity,
      category: alert.category,
      alertId: alert.id,
    });

    return incident;
  }

  /**
   * Add alert to existing incident
   */
  private addAlertToIncident(incident: Incident, alert: Alert): Incident {
    // Add alert to incident
    incident.alerts.push(alert);
    incident.updatedAt = Date.now();

    // Add timeline entry
    incident.timeline.push({
      timestamp: Date.now(),
      action: "alert_added",
      description: `Added alert: ${alert.title}`,
      metadata: { alertId: alert.id },
    });

    // Escalate severity if needed
    if (this.getSeverityLevel(alert.severity) > this.getSeverityLevel(incident.severity)) {
      const previousSeverity = incident.severity;
      incident.severity = alert.severity;
      
      incident.timeline.push({
        timestamp: Date.now(),
        action: "severity_escalated",
        description: `Incident severity escalated from ${previousSeverity} to ${alert.severity}`,
        metadata: { 
          previousSeverity, 
          newSeverity: alert.severity,
          triggeringAlertId: alert.id 
        },
      });

      devLog("warn", "IncidentManager", `Incident ${incident.id} severity escalated to ${alert.severity}`);
    }

    return incident;
  }

  /**
   * Update incident status
   */
  public updateIncidentStatus(
    incidentId: string, 
    status: Incident['status'], 
    user?: string,
    notes?: string
  ): boolean {
    const incident = this.incidents.get(incidentId);
    if (!incident) return false;

    const previousStatus = incident.status;
    incident.status = status;
    incident.updatedAt = Date.now();

    if (status === "resolved" || status === "closed") {
      incident.resolvedAt = Date.now();
    }

    // Add timeline entry
    incident.timeline.push({
      timestamp: Date.now(),
      action: "status_changed",
      description: `Status changed from ${previousStatus} to ${status}${notes ? `: ${notes}` : ''}`,
      user,
      metadata: { previousStatus, newStatus: status },
    });

    devLog("info", "IncidentManager", `Incident ${incidentId} status changed to ${status}`, {
      previousStatus,
      user,
    });

    return true;
  }

  /**
   * Assign incident to user
   */
  public assignIncident(incidentId: string, assignee: string, user?: string): boolean {
    const incident = this.incidents.get(incidentId);
    if (!incident) return false;

    const previousAssignee = incident.assignee;
    incident.assignee = assignee;
    incident.updatedAt = Date.now();

    incident.timeline.push({
      timestamp: Date.now(),
      action: "assigned",
      description: `Incident assigned to ${assignee}${previousAssignee ? ` (previously: ${previousAssignee})` : ''}`,
      user,
      metadata: { assignee, previousAssignee },
    });

    devLog("info", "IncidentManager", `Incident ${incidentId} assigned to ${assignee}`);

    return true;
  }

  /**
   * Add note to incident
   */
  public addIncidentNote(
    incidentId: string, 
    note: string, 
    user?: string
  ): boolean {
    const incident = this.incidents.get(incidentId);
    if (!incident) return false;

    incident.updatedAt = Date.now();
    incident.timeline.push({
      timestamp: Date.now(),
      action: "note_added",
      description: note,
      user,
    });

    devLog("info", "IncidentManager", `Note added to incident ${incidentId}`, { user });

    return true;
  }

  /**
   * Get incident by ID
   */
  public getIncident(incidentId: string): Incident | undefined {
    return this.incidents.get(incidentId);
  }

  /**
   * Get all incidents
   */
  public getAllIncidents(): Incident[] {
    return Array.from(this.incidents.values());
  }

  /**
   * Get open incidents
   */
  public getOpenIncidents(): Incident[] {
    return Array.from(this.incidents.values()).filter(
      incident => incident.status === "open" || incident.status === "investigating"
    );
  }

  /**
   * Get incidents by severity
   */
  public getIncidentsBySeverity(severity: AlertSeverity): Incident[] {
    return Array.from(this.incidents.values()).filter(
      incident => incident.severity === severity
    );
  }

  /**
   * Get incidents by category
   */
  public getIncidentsByCategory(category: AlertCategory): Incident[] {
    return Array.from(this.incidents.values()).filter(
      incident => incident.alerts.some(alert => alert.category === category)
    );
  }

  /**
   * Get incidents assigned to user
   */
  public getIncidentsByAssignee(assignee: string): Incident[] {
    return Array.from(this.incidents.values()).filter(
      incident => incident.assignee === assignee
    );
  }

  /**
   * Auto-resolve stale incidents
   */
  public autoResolveStaleIncidents(maxAge: number = 24 * 60 * 60 * 1000): number {
    const now = Date.now();
    let resolvedCount = 0;

    for (const incident of this.incidents.values()) {
      if (
        incident.status === "open" &&
        now - incident.createdAt > maxAge
      ) {
        this.updateIncidentStatus(
          incident.id, 
          "resolved", 
          "system", 
          "Auto-resolved due to age"
        );
        resolvedCount++;
      }
    }

    if (resolvedCount > 0) {
      devLog("info", "IncidentManager", `Auto-resolved ${resolvedCount} stale incidents`);
    }

    return resolvedCount;
  }

  /**
   * Get incident statistics
   */
  public getIncidentStatistics(): {
    total: number;
    open: number;
    investigating: number;
    resolved: number;
    closed: number;
    bySeverity: Record<AlertSeverity, number>;
    byCategory: Record<string, number>;
    averageResolutionTime: number;
  } {
    const allIncidents = Array.from(this.incidents.values());
    const resolvedIncidents = allIncidents.filter(i => i.resolvedAt);
    
    const bySeverity = {} as Record<AlertSeverity, number>;
    const byCategory = {} as Record<string, number>;

    allIncidents.forEach(incident => {
      bySeverity[incident.severity] = (bySeverity[incident.severity] || 0) + 1;
      
      incident.alerts.forEach(alert => {
        byCategory[alert.category] = (byCategory[alert.category] || 0) + 1;
      });
    });

    // Calculate average resolution time
    let totalResolutionTime = 0;
    resolvedIncidents.forEach(incident => {
      if (incident.resolvedAt) {
        totalResolutionTime += incident.resolvedAt - incident.createdAt;
      }
    });
    
    const averageResolutionTime = resolvedIncidents.length > 0 
      ? totalResolutionTime / resolvedIncidents.length 
      : 0;

    return {
      total: allIncidents.length,
      open: allIncidents.filter(i => i.status === "open").length,
      investigating: allIncidents.filter(i => i.status === "investigating").length,
      resolved: allIncidents.filter(i => i.status === "resolved").length,
      closed: allIncidents.filter(i => i.status === "closed").length,
      bySeverity,
      byCategory,
      averageResolutionTime,
    };
  }

  /**
   * Get severity level for comparison
   */
  private getSeverityLevel(severity: AlertSeverity): number {
    switch (severity) {
      case "info":
        return 1;
      case "warning":
        return 2;
      case "error":
        return 3;
      case "critical":
        return 4;
      default:
        return 0;
    }
  }

  /**
   * Cleanup old incidents
   */
  public cleanupOldIncidents(maxAge: number = 30 * 24 * 60 * 60 * 1000): number {
    const cutoffTime = Date.now() - maxAge;
    const initialCount = this.incidents.size;

    for (const [id, incident] of this.incidents.entries()) {
      if (
        (incident.status === "resolved" || incident.status === "closed") &&
        incident.updatedAt < cutoffTime
      ) {
        this.incidents.delete(id);
      }
    }

    // Also enforce memory limit
    if (this.incidents.size > this.maxIncidentsInMemory) {
      const sortedIncidents = Array.from(this.incidents.entries())
        .sort(([, a], [, b]) => b.updatedAt - a.updatedAt);
      
      // Keep only the most recent incidents
      const toKeep = sortedIncidents.slice(0, this.maxIncidentsInMemory);
      this.incidents.clear();
      
      toKeep.forEach(([id, incident]) => {
        this.incidents.set(id, incident);
      });
    }

    const removedCount = initialCount - this.incidents.size;
    if (removedCount > 0) {
      devLog("info", "IncidentManager", `Cleaned up ${removedCount} old incidents`);
    }

    return removedCount;
  }

  /**
   * Export incidents for analysis
   */
  public exportIncidents(): Incident[] {
    return Array.from(this.incidents.values());
  }

  /**
   * Import incidents
   */
  public importIncidents(incidents: Incident[]): number {
    incidents.forEach(incident => {
      this.incidents.set(incident.id, incident);
    });

    devLog("info", "IncidentManager", `Imported ${incidents.length} incidents`);
    return incidents.length;
  }
}