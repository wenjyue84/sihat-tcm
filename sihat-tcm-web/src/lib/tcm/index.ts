/**
 * TCM (Traditional Chinese Medicine) Utilities
 * 
 * Barrel export for all TCM-specific utilities
 * 
 * Note: Files are still in lib root. This index provides a clean import path.
 * When files are moved to tcm/ subdirectory, update paths accordingly.
 */

// Re-export from current locations (lib root)
export * from "../tcm-utils";
export * from "../fiveElementsScoreCalculator";
export * from "../medicalHistoryParser";
export * from "../enhancedTonguePrompt";

