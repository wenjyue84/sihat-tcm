/**
 * Utility functions for AI model routing
 */

import { ModelSelectionCriteria } from "../interfaces/ModelInterfaces";
import { DoctorLevel } from "../../doctorLevels";
import { StreamCallOptions, GenerateCallOptions } from "../../modelFallback";
import { defaultModelRouter, ModelFactory } from "../factories/ModelFactory";

/**
 * Helper function to quickly analyze and route a request
 */
import type { AIRequest } from "@/types/ai-request";

export async function routeAIRequest(
  request: Partial<AIRequest> & {
    doctorLevel?: DoctorLevel;
    preferredModel?: string;
  },
  callOptions: StreamCallOptions | GenerateCallOptions,
  options: {
    streaming?: boolean;
    validator?: (text: string) => { valid: boolean; parsed?: Record<string, unknown> };
    apiKey?: string;
    context?: string;
    routerConfig?: any;
  } = {}
) {
  // Create or use existing router
  const router = options.context 
    ? ModelFactory.createCustomRouter(options.context, options.routerConfig || {})
    : defaultModelRouter;

  // Analyze complexity
  const complexity = router.analyzeComplexity(request);

  // Build selection criteria
  const criteria: ModelSelectionCriteria = {
    complexity,
    doctorLevel: request.doctorLevel,
    requiresVision: Boolean(request.images && request.images.length > 0),
    requiresStreaming: options.streaming,
    preferredModels: request.preferredModel ? [request.preferredModel] : undefined,
  };

  // Route the request
  if (options.streaming) {
    return router.streamWithRouting(criteria, callOptions as StreamCallOptions);
  } else {
    return router.generateWithRouting(criteria, callOptions as GenerateCallOptions);
  }
}

/**
 * Create model selection criteria from request parameters
 */
export function createSelectionCriteria(
  request: Partial<AIRequest> & {
    doctorLevel?: DoctorLevel;
    preferredModel?: string;
  },
  options: {
    requiresVision?: boolean;
    requiresStreaming?: boolean;
    maxLatency?: number;
    language?: string;
  } = {}
): { complexity: any; criteria: ModelSelectionCriteria } {
  const router = defaultModelRouter;
  const complexity = router.analyzeComplexity(request);

  const criteria: ModelSelectionCriteria = {
    complexity,
    doctorLevel: request.doctorLevel,
    requiresVision: options.requiresVision ?? Boolean(request.images?.length),
    requiresStreaming: options.requiresStreaming,
    maxLatency: options.maxLatency,
    language: options.language,
    preferredModels: request.preferredModel ? [request.preferredModel] : undefined,
  };

  return { complexity, criteria };
}