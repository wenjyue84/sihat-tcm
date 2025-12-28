"use server";

/**
 * Server Actions - Main Entry Point
 *
 * This file maintains backward compatibility by re-exporting all server actions
 * from their domain-specific modules.
 *
 * =========================================================================
 * REFACTORED: This file now re-exports from modular action files.
 * For direct imports, use: import { actionName } from '@/lib/actions/[domain]'
 *
 * Domain modules:
 * - @/lib/actions/diagnosis      - Session CRUD, guest migration
 * - @/lib/actions/patient-history - History, trends, symptoms
 * - @/lib/actions/medical-reports - Report management
 * - @/lib/actions/patient-medicines - Medicine management
 * - @/lib/actions/family          - Family member management
 * - @/lib/actions/translation     - AI translation
 * =========================================================================
 */

// Re-export all actions from modular files
export * from "./actions/index";
