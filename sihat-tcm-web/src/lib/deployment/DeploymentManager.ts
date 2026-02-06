/**
 * Deployment Manager for Production Rollout
 * Manages deployment phases, monitoring, and rollback capabilities
 */

import { AppError, ERROR_CODES } from "../errors/AppError";
import { EventSystem } from "../events/EventSystem";
import { FeatureFlagManager } from "../feature-flags/FeatureFlagManager";

export interface DeploymentPhase {
  id: string;
  name: string;
  description: string;
  flags: string[];
  rolloutPercentages: Record<string, number>;
  prerequisites: string[];
  healthChecks: string[];
  rollbackTriggers: RollbackTrigger[];
  estimatedDuration: number; // in minutes
  status: "pending" | "in_progress" | "completed" | "failed" | "rolled_back";
  startedAt?: Date;
  completedAt?: Date;
}

export interface RollbackTrigger {
  metric: string;
  threshold: number;
  operator: "gt" | "lt" | "eq" | "gte" | "lte";
  description: string;
}

export interface DeploymentMetrics {
  errorRate: number;
  responseTime: number;
  throughput: number;
  memoryUsage: number;
  cpuUsage: number;
  userSatisfaction: number;
  featureFlagUsage: Record<string, number>;
}

export interface HealthCheck {
  name: string;
  endpoint?: string;
  function?: () => Promise<boolean>;
  timeout: number;
  retries: number;
  description: string;
}

export class DeploymentManager {
  private eventSystem: EventSystem;
  private featureFlagManager: FeatureFlagManager;
  private phases: Map<string, DeploymentPhase> = new Map();
  private currentPhase: string | null = null;
  private healthChecks: Map<string, HealthCheck> = new Map();
  private metrics: DeploymentMetrics | null = null;
  private rollbackInProgress = false;

  constructor(eventSystem: EventSystem, featureFlagManager: FeatureFlagManager) {
    this.eventSystem = eventSystem;
    this.featureFlagManager = featureFlagManager;
    this.initializeHealthChecks();
    this.setupEventListeners();
  }

  /**
   * Emit event helper
   */
  private emitEvent(type: string, data?: Record<string, unknown>): void {
    this.eventSystem
      .emit({
        type,
        timestamp: new Date(),
        source: "DeploymentManager",
        id: `dm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        data,
      })
      .catch(() => {
        /* fire-and-forget */
      });
  }

  /**
   * Initialize standard health checks
   */
  private initializeHealthChecks(): void {
    const healthChecks: HealthCheck[] = [
      {
        name: "ai_model_router_health",
        function: async () => {
          // Check AI model router health
          try {
            // Simulate health check
            return true;
          } catch {
            return false;
          }
        },
        timeout: 5000,
        retries: 3,
        description: "AI Model Router health check",
      },
      {
        name: "database_connectivity",
        function: async () => {
          // Check database connectivity
          try {
            // Simulate database check
            return true;
          } catch {
            return false;
          }
        },
        timeout: 3000,
        retries: 2,
        description: "Database connectivity check",
      },
      {
        name: "event_system_health",
        function: async () => {
          // Check event system health
          try {
            this.emitEvent("health:check", { timestamp: new Date() });
            return true;
          } catch {
            return false;
          }
        },
        timeout: 2000,
        retries: 2,
        description: "Event system health check",
      },
    ];

    healthChecks.forEach((check) => {
      this.healthChecks.set(check.name, check);
    });
  }

  /**
   * Setup event listeners for monitoring
   */
  private setupEventListeners(): void {
    this.eventSystem.on("deployment:metricsUpdated", (event) => {
      if (event.data?.metrics) {
        this.metrics = event.data.metrics as DeploymentMetrics;
      }
      this.checkRollbackTriggers();
    });

    this.eventSystem.on("deployment:healthCheckFailed", (event) => {
      this.handleHealthCheckFailure(
        event.data?.checkName as string,
        event.data?.error as string
      );
    });
  }

  /**
   * Add a deployment phase
   */
  addPhase(phase: DeploymentPhase): void {
    try {
      if (this.phases.has(phase.id)) {
        throw new AppError(
          ERROR_CODES.ALREADY_EXISTS,
          `Deployment phase '${phase.id}' already exists`
        );
      }

      this.phases.set(phase.id, {
        ...phase,
        status: "pending",
      });

      this.emitEvent("deployment:phaseAdded", { phase });
    } catch (error) {
      throw new AppError(
        ERROR_CODES.OPERATION_FAILED,
        `Failed to add deployment phase '${phase.id}'`,
        { metadata: { error: error instanceof Error ? error.message : "Unknown error" } }
      );
    }
  }

  /**
   * Start a deployment phase
   */
  async startPhase(phaseId: string): Promise<void> {
    try {
      const phase = this.phases.get(phaseId);
      if (!phase) {
        throw new AppError(ERROR_CODES.NOT_FOUND, `Deployment phase '${phaseId}' not found`);
      }

      if (phase.status !== "pending") {
        throw new AppError(
          ERROR_CODES.INVALID_STATE,
          `Cannot start phase '${phaseId}' with status '${phase.status}'`
        );
      }

      // Check prerequisites
      await this.checkPrerequisites(phase);

      // Run health checks
      await this.runHealthChecks(phase.healthChecks);

      // Update phase status
      phase.status = "in_progress";
      phase.startedAt = new Date();
      this.currentPhase = phaseId;

      // Update feature flags
      await this.updateFeatureFlags(phase);

      this.emitEvent("deployment:phaseStarted", {
        phaseId,
        phase,
        timestamp: new Date(),
      });

      // Start monitoring
      this.startPhaseMonitoring(phase);
    } catch (error) {
      const phase = this.phases.get(phaseId);
      if (phase) {
        phase.status = "failed";
      }

      this.emitEvent("deployment:phaseFailed", {
        phaseId,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      throw error;
    }
  }

  /**
   * Complete a deployment phase
   */
  async completePhase(phaseId: string): Promise<void> {
    try {
      const phase = this.phases.get(phaseId);
      if (!phase) {
        throw new AppError(ERROR_CODES.NOT_FOUND, `Deployment phase '${phaseId}' not found`);
      }

      if (phase.status !== "in_progress") {
        throw new AppError(
          ERROR_CODES.INVALID_STATE,
          `Cannot complete phase '${phaseId}' with status '${phase.status}'`
        );
      }

      // Final health checks
      await this.runHealthChecks(phase.healthChecks);

      // Validate metrics
      await this.validatePhaseMetrics(phase);

      // Update phase status
      phase.status = "completed";
      phase.completedAt = new Date();

      if (this.currentPhase === phaseId) {
        this.currentPhase = null;
      }

      this.emitEvent("deployment:phaseCompleted", {
        phaseId,
        phase,
        duration: phase.completedAt.getTime() - (phase.startedAt?.getTime() || 0),
      });
    } catch (error) {
      await this.rollbackPhase(phaseId, "Validation failed during completion");
      throw error;
    }
  }

  /**
   * Rollback a deployment phase
   */
  async rollbackPhase(phaseId: string, reason: string): Promise<void> {
    try {
      if (this.rollbackInProgress) {
        throw new AppError(ERROR_CODES.INVALID_STATE, "Rollback already in progress");
      }

      this.rollbackInProgress = true;

      const phase = this.phases.get(phaseId);
      if (!phase) {
        throw new AppError(ERROR_CODES.NOT_FOUND, `Deployment phase '${phaseId}' not found`);
      }

      this.emitEvent("deployment:rollbackStarted", {
        phaseId,
        reason,
        timestamp: new Date(),
      });

      // Disable all flags for this phase
      for (const flagKey of phase.flags) {
        this.featureFlagManager.updateFlag(flagKey, {
          enabled: false,
          rolloutPercentage: 0,
        });
      }

      // Update phase status
      phase.status = "rolled_back";
      phase.completedAt = new Date();

      if (this.currentPhase === phaseId) {
        this.currentPhase = null;
      }

      this.emitEvent("deployment:rollbackCompleted", {
        phaseId,
        reason,
        timestamp: new Date(),
      });
    } catch (error) {
      this.emitEvent("deployment:rollbackFailed", {
        phaseId,
        reason,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    } finally {
      this.rollbackInProgress = false;
    }
  }

  /**
   * Check prerequisites for a phase
   */
  private async checkPrerequisites(phase: DeploymentPhase): Promise<void> {
    for (const prerequisiteId of phase.prerequisites) {
      const prerequisite = this.phases.get(prerequisiteId);
      if (!prerequisite || prerequisite.status !== "completed") {
        throw new AppError(
          ERROR_CODES.PREREQUISITE_NOT_MET,
          `Prerequisite phase '${prerequisiteId}' not completed`
        );
      }
    }
  }

  /**
   * Run health checks
   */
  private async runHealthChecks(checkNames: string[]): Promise<void> {
    const results = await Promise.allSettled(
      checkNames.map((name) => this.runSingleHealthCheck(name))
    );

    const failures = results
      .map((result, index) => ({ result, name: checkNames[index] }))
      .filter(({ result }) => result.status === "rejected")
      .map(({ name, result }) => ({
        name,
        error: result.status === "rejected" ? result.reason : "Unknown error",
      }));

    if (failures.length > 0) {
      throw new AppError(ERROR_CODES.HEALTH_CHECK_FAILED, "Health checks failed", { metadata: { failures } });
    }
  }

  /**
   * Run a single health check
   */
  private async runSingleHealthCheck(checkName: string): Promise<void> {
    const check = this.healthChecks.get(checkName);
    if (!check) {
      throw new AppError(ERROR_CODES.NOT_FOUND, `Health check '${checkName}' not found`);
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= check.retries; attempt++) {
      try {
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error("Health check timeout")), check.timeout);
        });

        if (check.function) {
          const result = await Promise.race([check.function(), timeoutPromise]);

          if (result) {
            this.emitEvent("deployment:healthCheckPassed", {
              checkName,
              attempt: attempt + 1,
            });
            return;
          }
        }

        throw new Error("Health check returned false");
      } catch (error) {
        lastError = error instanceof Error ? error : new Error("Unknown error");

        if (attempt < check.retries) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
        }
      }
    }

    this.emitEvent("deployment:healthCheckFailed", {
      checkName,
      error: lastError?.message || "Unknown error",
    });

    throw lastError || new Error("Health check failed");
  }

  /**
   * Update feature flags for a phase
   */
  private async updateFeatureFlags(phase: DeploymentPhase): Promise<void> {
    try {
      this.featureFlagManager.updateRolloutPercentages(phase.rolloutPercentages);

      this.emitEvent("deployment:featureFlagsUpdated", {
        phaseId: phase.id,
        rolloutPercentages: phase.rolloutPercentages,
      });
    } catch (error) {
      throw new AppError(ERROR_CODES.OPERATION_FAILED, "Failed to update feature flags", {
        metadata: { error: error instanceof Error ? error.message : "Unknown error" },
      });
    }
  }

  /**
   * Start monitoring for a phase
   */
  private startPhaseMonitoring(phase: DeploymentPhase): void {
    const monitoringInterval = setInterval(() => {
      this.checkRollbackTriggers();
    }, 30000); // Check every 30 seconds

    // Store interval for cleanup
    (phase as any).monitoringInterval = monitoringInterval;

    // Auto-cleanup after estimated duration + buffer
    setTimeout(
      () => {
        clearInterval(monitoringInterval);
      },
      (phase.estimatedDuration + 30) * 60 * 1000
    );
  }

  /**
   * Check rollback triggers
   */
  private checkRollbackTriggers(): void {
    if (!this.currentPhase || !this.metrics) {
      return;
    }

    const phase = this.phases.get(this.currentPhase);
    if (!phase || phase.status !== "in_progress") {
      return;
    }

    for (const trigger of phase.rollbackTriggers) {
      const metricValue = this.getMetricValue(trigger.metric);
      if (metricValue !== null && this.evaluateTrigger(metricValue, trigger)) {
        this.emitEvent("deployment:rollbackTriggered", {
          phaseId: this.currentPhase,
          trigger,
          metricValue,
          timestamp: new Date(),
        });

        // Automatic rollback
        this.rollbackPhase(this.currentPhase, `Rollback trigger: ${trigger.description}`);
        break;
      }
    }
  }

  /**
   * Get metric value by name
   */
  private getMetricValue(metricName: string): number | null {
    if (!this.metrics) return null;

    switch (metricName) {
      case "errorRate":
        return this.metrics.errorRate;
      case "responseTime":
        return this.metrics.responseTime;
      case "throughput":
        return this.metrics.throughput;
      case "memoryUsage":
        return this.metrics.memoryUsage;
      case "cpuUsage":
        return this.metrics.cpuUsage;
      case "userSatisfaction":
        return this.metrics.userSatisfaction;
      default:
        return null;
    }
  }

  /**
   * Evaluate rollback trigger
   */
  private evaluateTrigger(value: number, trigger: RollbackTrigger): boolean {
    switch (trigger.operator) {
      case "gt":
        return value > trigger.threshold;
      case "gte":
        return value >= trigger.threshold;
      case "lt":
        return value < trigger.threshold;
      case "lte":
        return value <= trigger.threshold;
      case "eq":
        return value === trigger.threshold;
      default:
        return false;
    }
  }

  /**
   * Validate phase metrics
   */
  private async validatePhaseMetrics(phase: DeploymentPhase): Promise<void> {
    if (!this.metrics) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, "No metrics available for validation");
    }

    // Define acceptable thresholds
    const thresholds = {
      errorRate: 5.0, // Max 5% error rate
      responseTime: 2000, // Max 2 second response time
      memoryUsage: 80, // Max 80% memory usage
      cpuUsage: 70, // Max 70% CPU usage
    };

    const violations: string[] = [];

    if (this.metrics.errorRate > thresholds.errorRate) {
      violations.push(`Error rate too high: ${this.metrics.errorRate}%`);
    }

    if (this.metrics.responseTime > thresholds.responseTime) {
      violations.push(`Response time too high: ${this.metrics.responseTime}ms`);
    }

    if (this.metrics.memoryUsage > thresholds.memoryUsage) {
      violations.push(`Memory usage too high: ${this.metrics.memoryUsage}%`);
    }

    if (this.metrics.cpuUsage > thresholds.cpuUsage) {
      violations.push(`CPU usage too high: ${this.metrics.cpuUsage}%`);
    }

    if (violations.length > 0) {
      throw new AppError(ERROR_CODES.VALIDATION_ERROR, "Phase metrics validation failed", {
        metadata: { violations },
      });
    }
  }

  /**
   * Handle health check failure
   */
  private handleHealthCheckFailure(checkName: string, error: string): void {
    if (this.currentPhase) {
      this.rollbackPhase(this.currentPhase, `Health check failed: ${checkName} - ${error}`);
    }
  }

  /**
   * Get deployment status
   */
  getDeploymentStatus(): {
    currentPhase: string | null;
    phases: DeploymentPhase[];
    metrics: DeploymentMetrics | null;
  } {
    return {
      currentPhase: this.currentPhase,
      phases: Array.from(this.phases.values()),
      metrics: this.metrics,
    };
  }

  /**
   * Update deployment metrics
   */
  updateMetrics(metrics: DeploymentMetrics): void {
    this.metrics = metrics;
    this.emitEvent("deployment:metricsUpdated", {
      metrics,
      timestamp: new Date(),
    });
  }
}
