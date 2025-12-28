/**
 * TCM Doctor AI System Prompts - Modular Export
 *
 * This module re-exports all system prompts from their domain-specific files
 * for backward compatibility with existing imports from '@/lib/systemPrompts'
 *
 * @module prompts
 */

// ============================================================================
// DIAGNOSTIC PROMPTS (四诊 - Four Examinations)
// ============================================================================
export {
    INTERACTIVE_CHAT_PROMPT,
    INQUIRY_SUMMARY_PROMPT,
    buildChatPromptWithContext,
} from "./diagnosis-inquiry";

export {
    TONGUE_ANALYSIS_PROMPT,
    FACE_ANALYSIS_PROMPT,
    BODY_ANALYSIS_PROMPT,
    getImageAnalysisPrompt,
} from "./diagnosis-visual";

export { LISTENING_ANALYSIS_PROMPT } from "./diagnosis-audio";

export { FINAL_ANALYSIS_PROMPT } from "./diagnosis-final";

// ============================================================================
// CONSULTATION PROMPTS
// ============================================================================
export { WESTERN_DOCTOR_PROMPT } from "./consultation-western";

export { HEART_COMPANION_PROMPT } from "./consultation-companion";

// ============================================================================
// MEAL PLANNER PROMPTS
// ============================================================================
export {
    MEAL_PLANNER_PROMPT,
    MEAL_SWAP_PROMPT,
    FOOD_CHECKER_PROMPT,
} from "./meal-planner";

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
export { getPromptSummaries } from "./helpers";
