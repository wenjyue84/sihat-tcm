/**
 * Diagnostic System - Modular AI diagnostic engine
 *
 * This module provides a comprehensive AI diagnostic system with modular architecture.
 * All components are designed to work together while maintaining clear separation of concerns.
 *
 * @example Basic Usage
 * ```typescript
 * import { EnhancedAIDiagnosticEngine } from '@/lib/diagnostic';
 *
 * const engine = new EnhancedAIDiagnosticEngine();
 * const result = await engine.processEnhancedDiagnosis({
 *   userId: 'user123',
 *   messages: chatHistory,
 *   requiresPersonalization: true
 * });
 * ```
 *
 * @example Advanced Usage with Custom Configuration
 * ```typescript
 * import {
 *   EnhancedAIDiagnosticEngine,
 *   DiagnosticOrchestrator,
 *   DiagnosticMonitor
 * } from '@/lib/diagnostic';
 *
 * const engine = new EnhancedAIDiagnosticEngine('CustomEngine');
 * const stats = engine.getPerformanceStats();
 * ```
 */

// Main engine
export {
  EnhancedAIDiagnosticEngine,
  defaultEnhancedAIDiagnosticEngine,
  processEnhancedDiagnosis,
} from "./EnhancedAIDiagnosticEngine";

// Core components
export { DiagnosticOrchestrator } from "./core/DiagnosticOrchestrator";
export {
  DiagnosisSessionManager,
  diagnosisSessionManager,
  createDiagnosisSessionManager,
} from "./core/DiagnosisSessionManager";

// Monitoring and analytics
export { DiagnosticMonitor } from "./monitoring/DiagnosticMonitor";

// Learning and feedback
export { FeedbackProcessor } from "./learning/FeedbackProcessor";

// Interfaces and types
export type {
  // Main interfaces
  EnhancedDiagnosticRequest,
  EnhancedDiagnosticResponse,
  DiagnosticConfig,
  DiagnosticStats,

  // Processing interfaces
  DiagnosticStep,
  ProcessingPipeline,
  DiagnosticContext,

  // Monitoring interfaces
  DiagnosticMetrics,
  PerformanceAnalytics,
  DiagnosticHistory,

  // Feedback interfaces
  DiagnosticFeedback,
  FeedbackAnalysis,
  UserFeedbackPattern,
  FeedbackTrends,
} from "./interfaces/DiagnosticInterfaces";

/**
 * Diagnostic system version and metadata
 */
export const DIAGNOSTIC_SYSTEM_VERSION = "1.0.0";
export const DIAGNOSTIC_SYSTEM_NAME = "Enhanced AI Diagnostic Engine";

/**
 * Quick start function for simple diagnostic requests
 */
export async function quickDiagnosis(
  userId: string,
  messages: any[],
  options?: {
    doctorLevel?: string;
    language?: "en" | "zh" | "ms";
    requiresPersonalization?: boolean;
    requiresSafetyValidation?: boolean;
  }
) {
  return processEnhancedDiagnosis({
    userId,
    messages,
    doctorLevel: options?.doctorLevel as any,
    language: options?.language,
    requiresPersonalization: options?.requiresPersonalization ?? true,
    requiresSafetyValidation: options?.requiresSafetyValidation ?? true,
  });
}
