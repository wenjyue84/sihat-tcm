/**
 * Voice Command Handler Interfaces
 *
 * Comprehensive type definitions for voice recognition, synthesis,
 * and command handling in the Sihat TCM application.
 */

export interface VoiceCommand {
  command: string;
  patterns: string[];
  action: (params?: any) => void | Promise<void>;
  description: string;
  category: "navigation" | "input" | "control" | "accessibility";
  enabled: boolean;
}

export interface VoiceRecognitionOptions {
  language: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  grammars?: SpeechGrammarList;
}

export interface VoiceSynthesisOptions {
  voice?: SpeechSynthesisVoice;
  volume: number;
  rate: number;
  pitch: number;
  language: string;
}

export interface VoiceCommandHandlerOptions {
  recognition?: Partial<VoiceRecognitionOptions>;
  synthesis?: Partial<VoiceSynthesisOptions>;
  enableFeedback: boolean;
  enableCommands: boolean;
  enableDictation: boolean;
  autoStart: boolean;
  debugMode: boolean;
}

export interface VoiceRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
  alternatives?: string[];
}

export interface VoiceCommandMatch {
  command: VoiceCommand;
  confidence: number;
  parameters?: Record<string, any>;
}

export type VoiceEventType =
  | "start"
  | "stop"
  | "result"
  | "command"
  | "error"
  | "speechstart"
  | "speechend"
  | "dictation";

export interface VoiceEvent {
  type: VoiceEventType;
  data?: any;
  timestamp: number;
}

export interface VoiceStatus {
  isEnabled: boolean;
  isListening: boolean;
  isDictationMode: boolean;
  isSpeaking: boolean;
  commandCount: number;
  language: string;
}

export interface VoiceSupportInfo {
  recognition: boolean;
  synthesis: boolean;
  fullSupport: boolean;
}

// Event listener types
export type VoiceEventListener = (event: VoiceEvent) => void;
export type VoiceEventListenerMap = Map<VoiceEventType, Set<VoiceEventListener>>;

// Command processing types
export interface CommandProcessingContext {
  transcript: string;
  confidence: number;
  language: string;
  isDictationMode: boolean;
}

export interface CommandExecutionContext {
  match: VoiceCommandMatch;
  enableFeedback: boolean;
  debugMode: boolean;
}

// Speech synthesis types
export interface SpeechQueueItem {
  text: string;
  options?: Partial<VoiceSynthesisOptions>;
  resolve: () => void;
  reject: (error: any) => void;
}

// Recognition event types (extending browser types)
export interface ExtendedSpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

export interface ExtendedSpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}
