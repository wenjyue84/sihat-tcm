/**
 * Voice Command System - Barrel Export
 *
 * Provides a clean interface to the modular voice command system
 * for the Sihat TCM application.
 */

// Main orchestrator
export {
  VoiceCommandHandler,
  getVoiceCommandHandler,
  checkVoiceSupport,
} from "./VoiceCommandHandler";

// Core managers
export { SpeechRecognitionManager } from "./core/SpeechRecognitionManager";
export { SpeechSynthesisManager } from "./core/SpeechSynthesisManager";

// Command system
export { CommandRegistry } from "./commands/CommandRegistry";
export { DictationManager } from "./commands/DictationManager";
export type { DictationOptions, DictationResult } from "./commands/DictationManager";

// Interfaces and types
export type {
  VoiceCommand,
  VoiceRecognitionOptions,
  VoiceSynthesisOptions,
  VoiceCommandHandlerOptions,
  VoiceRecognitionResult,
  VoiceCommandMatch,
  VoiceEventType,
  VoiceEvent,
  VoiceStatus,
  VoiceSupportInfo,
  VoiceEventListener,
  CommandProcessingContext,
  CommandExecutionContext,
  SpeechQueueItem,
} from "./interfaces/VoiceInterfaces";

// Default instance for backward compatibility
import { getVoiceCommandHandler } from "./VoiceCommandHandler";
export const voiceCommandHandler = getVoiceCommandHandler();
