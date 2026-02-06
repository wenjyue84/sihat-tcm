/**
 * Enhanced AI Diagnostic Engine - Main orchestrator for AI diagnostics
 *
 * Integrates all diagnostic components into a unified, easy-to-use interface.
 * This is the new modular version that delegates to specialized components.
 */

import {
  EnhancedDiagnosticRequest,
  EnhancedDiagnosticResponse,
  DiagnosticConfig,
  DiagnosticStats,
} from "./interfaces/DiagnosticInterfaces";
import { DiagnosticOrchestrator } from "./core/DiagnosticOrchestrator";
import { DiagnosticMonitor } from "./monitoring/DiagnosticMonitor";
import { FeedbackProcessor, DiagnosticFeedback } from "./learning/FeedbackProcessor";
import { devLog, logError, logInfo } from "../systemLogger";

/**
 * Enhanced AI Diagnostic Engine with modular architecture
 */
export class EnhancedAIDiagnosticEngine {
  private context: string;

  // Core components
  private orchestrator: DiagnosticOrchestrator;
  private monitor: DiagnosticMonitor;
  private feedbackProcessor: FeedbackProcessor;

  constructor(context: string = "EnhancedAIDiagnosticEngine") {
    this.context = context;

    // Initialize components
    this.orchestrator = new DiagnosticOrchestrator(`${context}/Orchestrator`);
    this.monitor = new DiagnosticMonitor(`${context}/Monitor`);
    this.feedbackProcessor = new FeedbackProcessor(`${context}/Feedback`);
  }

  /**
   * Process enhanced diagnostic request
   */
  async processEnhancedDiagnosis(
    request: EnhancedDiagnosticRequest
  ): Promise<EnhancedDiagnosticResponse> {
    const startTime = Date.now();

    try {
      devLog("info", this.context, "Processing enhanced diagnosis", {
        userId: request.userId,
        doctorLevel: request.doctorLevel,
      });

      // Process through orchestrator
      const response = await this.orchestrator.processEnhancedDiagnosis(request);

      // Record completion in monitor
      const processingTime = Date.now() - startTime;
      const steps = this.orchestrator.getProcessingSteps();

      this.monitor.recordDiagnosticCompletion(
        request.userId,
        response.modelUsed,
        processingTime,
        true, // success
        steps
      );

      logInfo(this.context, "Enhanced diagnosis completed successfully", {
        userId: request.userId,
        modelUsed: response.modelUsed,
        processingTime,
      });

      return response;
    } catch (error) {
      // Record failure in monitor
      const processingTime = Date.now() - startTime;
      const steps = this.orchestrator.getProcessingSteps();

      this.monitor.recordDiagnosticCompletion(
        request.userId,
        "unknown",
        processingTime,
        false, // failure
        steps
      );

      logError(this.context, "Enhanced diagnosis failed", {
        error,
        userId: request.userId,
        processingTime,
      });

      throw error;
    }
  }

  /**
   * Update learning from user feedback
   */
  async updateLearningFromFeedback(feedback: DiagnosticFeedback): Promise<void> {
    try {
      await this.feedbackProcessor.processFeedback(feedback);

      devLog("info", this.context, "Learning updated from feedback", {
        userId: feedback.userId,
        sessionId: feedback.sessionId,
        diagnosisAccuracy: feedback.diagnosisAccuracy,
      });
    } catch (error) {
      logError(this.context, "Failed to update learning from feedback", { error });
      throw error;
    }
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats(): {
    diagnostic: DiagnosticStats;
    feedback: ReturnType<FeedbackProcessor["getFeedbackAnalysis"]>;
    performance: ReturnType<DiagnosticMonitor["getPerformanceAnalytics"]>;
  } {
    return {
      diagnostic: this.monitor.getStats(),
      feedback: this.feedbackProcessor.getFeedbackAnalysis(),
      performance: this.monitor.getPerformanceAnalytics(),
    };
  }

  /**
   * Get feedback trends
   */
  getFeedbackTrends(days: number = 30) {
    return this.feedbackProcessor.getFeedbackTrends(days);
  }

  /**
   * Get user-specific feedback pattern
   */
  getUserFeedbackPattern(userId: string) {
    return this.feedbackProcessor.getUserFeedbackPattern(userId);
  }

  /**
   * Get recent processing history
   */
  getRecentHistory(limit: number = 50) {
    return this.monitor.getRecentHistory(limit);
  }

  /**
   * Update system configuration
   */
  updateConfiguration(config: Partial<DiagnosticConfig>): void {
    this.orchestrator.updateConfiguration(config);
    logInfo(this.context, "Configuration updated", { config });
  }

  /**
   * Export system data for analysis
   */
  exportSystemData(): {
    monitoring: ReturnType<DiagnosticMonitor["exportData"]>;
    feedback: ReturnType<FeedbackProcessor["getFeedbackAnalysis"]>;
    configuration: DiagnosticConfig;
  } {
    return {
      monitoring: this.monitor.exportData(),
      feedback: this.feedbackProcessor.getFeedbackAnalysis(),
      configuration: {} as DiagnosticConfig, // Would get from orchestrator
    };
  }

  /**
   * Reset system statistics
   */
  resetStatistics(): void {
    this.monitor.resetStats();
    this.monitor.clearHistory();
    logInfo(this.context, "System statistics reset");
  }
}

/**
 * Create a singleton instance for the application
 */
export const defaultEnhancedAIDiagnosticEngine = new EnhancedAIDiagnosticEngine(
  "DefaultEnhancedEngine"
);

/**
 * Convenience function for enhanced diagnosis
 */
export async function processEnhancedDiagnosis(
  request: EnhancedDiagnosticRequest
): Promise<EnhancedDiagnosticResponse> {
  return defaultEnhancedAIDiagnosticEngine.processEnhancedDiagnosis(request);
}
