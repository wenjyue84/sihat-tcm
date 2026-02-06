/**
 * Constants and Configuration
 *
 * Barrel export for all constants and configuration files
 */

// AI Model constants (organized)
export * from "./ai-models";

// Doctor level constants (organized)
export * from "./doctor-levels";

// Re-export from current locations (lib root) for backward compatibility
export * from "../systemPrompts";

/**
 * Error codes used by the structured error system (errors/AppError.ts)
 */
export const ERROR_CODES = {
  // Validation
  VALIDATION_ERROR: "VALIDATION_ERROR",
  // Authentication & Authorization
  AUTHENTICATION_ERROR: "AUTHENTICATION_ERROR",
  AUTHORIZATION_ERROR: "AUTHORIZATION_ERROR",
  // Resource
  NOT_FOUND: "NOT_FOUND",
  ALREADY_EXISTS: "ALREADY_EXISTS",
  // Rate Limiting
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  // AI
  AI_MODEL_ERROR: "AI_MODEL_ERROR",
  // Network
  NETWORK_ERROR: "NETWORK_ERROR",
  // System
  INTERNAL_ERROR: "INTERNAL_ERROR",
  CONFIGURATION_ERROR: "CONFIGURATION_ERROR",
  OPERATION_FAILED: "OPERATION_FAILED",
  INVALID_STATE: "INVALID_STATE",
  PREREQUISITE_NOT_MET: "PREREQUISITE_NOT_MET",
  HEALTH_CHECK_FAILED: "HEALTH_CHECK_FAILED",
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
