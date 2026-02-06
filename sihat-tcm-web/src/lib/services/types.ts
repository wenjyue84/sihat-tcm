/**
 * Common types for the service layer
 */

import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Generic result type for service operations
 */
export interface ServiceResult<T = unknown> {
  data: T | null;
  error: ServiceError | null;
}

export interface ServiceError {
  message: string;
  code?: string;
  details?: unknown;
}

/**
 * Pagination options for list operations
 */
export interface PaginationOptions {
  page?: number;
  limit?: number;
  offset?: number;
}

/**
 * Sort options for list operations
 */
export interface SortOptions {
  column: string;
  ascending?: boolean;
}

/**
 * Common filter operators
 */
export interface FilterOptions {
  eq?: Record<string, unknown>;
  neq?: Record<string, unknown>;
  gt?: Record<string, number | string>;
  lt?: Record<string, number | string>;
  in?: Record<string, unknown[]>;
  is?: Record<string, null>;
  isNot?: Record<string, null>;
}

/**
 * Base service interface that all services implement
 */
export interface BaseService<T, CreateDTO, UpdateDTO> {
  getById(id: string): Promise<ServiceResult<T>>;
  list(options?: PaginationOptions & SortOptions): Promise<ServiceResult<T[]>>;
  create(data: CreateDTO): Promise<ServiceResult<T>>;
  update(id: string, data: UpdateDTO): Promise<ServiceResult<T>>;
  delete(id: string): Promise<ServiceResult<void>>;
}

/**
 * Supabase client type alias
 */
export type SupabaseInstance = SupabaseClient;

/**
 * Helper to convert Supabase errors to ServiceError
 */
export function toServiceError(error: unknown): ServiceError {
  if (error && typeof error === "object" && "message" in error) {
    const e = error as { message: string; code?: string; details?: unknown };
    return {
      message: e.message,
      code: e.code,
      details: e.details,
    };
  }
  return { message: String(error) };
}
