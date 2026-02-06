/**
 * AI Model Router - Modular Architecture
 *
 * This is the new modular approach to AI model routing.
 * Use these exports for new code instead of the legacy aiModelRouter.ts
 */

// Core interfaces
export type {
  ModelSelectionCriteria,
  RequestComplexity,
  RequestComplexityType,
  ComplexityFactors,
  ModelPerformanceMetrics,
  ModelCapabilities,
  ModelRouterConfig,
} from "./interfaces/ModelInterfaces";

// Main router classes
export { AIModelRouter } from "./ModelRouter";
export {
  EnhancedAIModelRouter,
  defaultEnhancedRouter,
  createEnhancedRouter,
} from "./core/EnhancedAIModelRouter";

// Specialized components
export { ComplexityAnalyzer } from "./analysis/ComplexityAnalyzer";
export { ModelSelectionStrategy } from "./selection/ModelSelectionStrategy";
export { PerformanceMonitor } from "./monitoring/PerformanceMonitor";

// Factory and utilities
export {
  ModelFactory,
  defaultModelRouter,
  highPerformanceRouter,
  testingRouter,
} from "./factories/ModelFactory";

export { routeAIRequest, createSelectionCriteria } from "./utils/RouterUtils";

// Convenience function for quick setup
export function createAIRouter(appName: string = "SihatTCM", config?: Partial<ModelRouterConfig>) {
  return ModelFactory.createCustomRouter(appName, config || {});
}
