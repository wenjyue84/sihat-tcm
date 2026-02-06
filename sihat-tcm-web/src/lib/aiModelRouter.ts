/**
 * AI Model Router - Legacy compatibility layer
 *
 * This file maintains backward compatibility while delegating to the new modular architecture.
 * New code should use the modular components directly from ./ai/ directory.
 *
 * @deprecated Use AIModelRouter from ./ai/ModelRouter.ts instead
 */

import { AIModelRouter } from "./ai/ModelRouter";
import { ModelFactory, defaultModelRouter } from "./ai/factories/ModelFactory";
import { routeAIRequest, createSelectionCriteria } from "./ai/utils/RouterUtils";
import {
  ModelSelectionCriteria,
  RequestComplexity,
  ModelPerformanceMetrics,
  ModelRouterConfig,
} from "./ai/interfaces/ModelInterfaces";
import { DoctorLevel } from "./doctorLevels";
import { StreamCallOptions, GenerateCallOptions } from "./modelFallback";

// Re-export types for backward compatibility
export type {
  ModelSelectionCriteria,
  RequestComplexity,
  ModelPerformanceMetrics,
  ModelRouterConfig,
};

// Re-export main class
export { AIModelRouter };

// Legacy exports - use new modular approach instead
export const createModelRouter = ModelFactory.createCustomRouter;
export { defaultModelRouter };
export { routeAIRequest };

/**
 * @deprecated Use AIModelRouter from ./ai/ModelRouter.ts
 */
export class LegacyAIModelRouter extends AIModelRouter {
  constructor(context: string = "LegacyRouter", config?: Partial<ModelRouterConfig>) {
    super(context, config);
    console.warn(
      "LegacyAIModelRouter is deprecated. Use AIModelRouter from ./ai/ModelRouter.ts instead"
    );
  }
}
