/**
 * Enhanced AI Diagnostic Engine - Integration layer for all AI diagnostic components
 *
 * This module provides a unified interface that combines the AIModelRouter,
 * PersonalizationEngine, and MedicalSafetyValidator for comprehensive AI diagnostics.
 *
 * Key Features:
 * - Intelligent AI model selection based on request complexity
 * - Automatic fallback handling for improved reliability
 * - Personalized recommendations based on user history and preferences
 * - Comprehensive medical safety validation
 * - Performance monitoring and optimization
 * - Learning from user feedback for continuous improvement
 *
 * Usage Example:
 * ```typescript
 * const engine = new EnhancedAIDiagnosticEngine('MyApp');
 * const result = await engine.processEnhancedDiagnosis({
 *   userId: 'user123',
 *   doctorLevel: 'expert',
 *   messages: chatHistory,
 *   images: tongueImages,
 *   requiresPersonalization: true,
 *   requiresSafetyValidation: true
 * });
 * ```
 *
 * @author Sihat TCM Development Team
 * @version 5.0.0 - Refactored to use modular architecture
 * @since 2024-12-26
 */

// Re-export from the new modular implementation
export {
  EnhancedAIDiagnosticEngine,
  defaultEnhancedAIDiagnosticEngine,
  processEnhancedDiagnosis
} from './diagnostic/EnhancedAIDiagnosticEngine';

// Re-export interfaces for backward compatibility
export type {
  EnhancedDiagnosticRequest,
  EnhancedDiagnosticResponse,
  DiagnosticConfig,
  DiagnosticStats,
  DiagnosticFeedback
} from './diagnostic/interfaces/DiagnosticInterfaces';


