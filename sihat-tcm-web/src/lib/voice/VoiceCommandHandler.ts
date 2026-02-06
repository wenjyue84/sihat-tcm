/**
 * Voice Command Handler - Main Orchestrator
 *
 * Coordinates all voice-related functionality including speech recognition,
 * synthesis, command processing, and dictation for the Sihat TCM application.
 */

import {
  VoiceCommandHandlerOptions,
  VoiceRecognitionOptions,
  VoiceSynthesisOptions,
  VoiceCommand,
  VoiceRecognitionResult,
  VoiceCommandMatch,
  VoiceEventType,
  VoiceEvent,
  VoiceEventListener,
  VoiceStatus,
  VoiceSupportInfo,
} from "./interfaces/VoiceInterfaces";

import { SpeechRecognitionManager } from "./core/SpeechRecognitionManager";
import { SpeechSynthesisManager } from "./core/SpeechSynthesisManager";
import { CommandRegistry } from "./commands/CommandRegistry";
import { DictationManager, DictationResult } from "./commands/DictationManager";

export class VoiceCommandHandler {
  private recognitionManager: SpeechRecognitionManager;
  private synthesisManager: SpeechSynthesisManager;
  private commandRegistry: CommandRegistry;
  private dictationManager: DictationManager;

  private isEnabled: boolean = false;
  private currentLanguage: string = "en-US";
  private eventListeners: Map<VoiceEventType, Set<VoiceEventListener>> = new Map();
  private options: VoiceCommandHandlerOptions;

  // Default options
  private defaultOptions: VoiceCommandHandlerOptions = {
    recognition: {
      language: "en-US",
      continuous: true,
      interimResults: true,
      maxAlternatives: 3,
    },
    synthesis: {
      volume: 0.8,
      rate: 1.0,
      pitch: 1.0,
      language: "en-US",
    },
    enableFeedback: true,
    enableCommands: true,
    enableDictation: true,
    autoStart: false,
    debugMode: false,
  };

  constructor(options: Partial<VoiceCommandHandlerOptions> = {}) {
    this.options = { ...this.defaultOptions, ...options };
    this.currentLanguage = this.options.recognition?.language || "en-US";

    this.initialize();
  }

  /**
   * Initialize the voice command handler
   */
  private initialize(): void {
    if (typeof window === "undefined") return;

    // Initialize managers
    this.recognitionManager = new SpeechRecognitionManager(this.options.recognition);
    this.synthesisManager = new SpeechSynthesisManager(this.options.synthesis);
    this.commandRegistry = new CommandRegistry();
    this.dictationManager = new DictationManager({
      language: this.currentLanguage,
      autoCapitalize: true,
      autoPunctuation: true,
    });

    this.setupEventHandlers();

    if (this.options.autoStart) {
      this.start();
    }
  }

  /**
   * Setup event handlers between components
   */
  private setupEventHandlers(): void {
    // Recognition events
    this.recognitionManager.addEventListener((event) => {
      this.handleRecognitionEvent(event);
    });

    // Synthesis events
    this.synthesisManager.addEventListener((event) => {
      this.handleSynthesisEvent(event);
    });

    // Command registry events
    this.commandRegistry.addEventListener((event) => {
      this.handleCommandEvent(event);
    });

    // Dictation events
    this.dictationManager.addEventListener((event) => {
      this.handleDictationEvent(event);
    });
  }

  /**
   * Handle recognition events
   */
  private handleRecognitionEvent(event: VoiceEvent): void {
    switch (event.type) {
      case "start":
        this.emitEvent("start", event.data);
        break;
      case "stop":
        this.emitEvent("stop", event.data);
        break;
      case "result":
        this.handleRecognitionResult(event.data as VoiceRecognitionResult);
        this.emitEvent("result", event.data);
        break;
      case "error":
        this.handleRecognitionError(event.data);
        this.emitEvent("error", event.data);
        break;
      case "speechstart":
        this.emitEvent("speechstart", event.data);
        break;
      case "speechend":
        this.emitEvent("speechend", event.data);
        break;
    }
  }

  /**
   * Handle synthesis events
   */
  private handleSynthesisEvent(event: VoiceEvent): void {
    // Forward synthesis events
    this.emitEvent(event.type, event.data);
  }

  /**
   * Handle command events
   */
  private handleCommandEvent(event: VoiceEvent): void {
    if (event.type === "command") {
      this.executeCommand(event.data as VoiceCommandMatch);
    }
    this.emitEvent(event.type, event.data);
  }

  /**
   * Handle dictation events
   */
  private handleDictationEvent(event: VoiceEvent): void {
    this.emitEvent("dictation", event.data);
  }

  /**
   * Handle speech recognition results
   */
  private handleRecognitionResult(result: VoiceRecognitionResult): void {
    if (this.options.debugMode) {
      console.log("[VoiceCommandHandler] Recognition result:", result);
    }

    // Process dictation if in dictation mode
    if (this.dictationManager.isDictating()) {
      const dictationResult = this.dictationManager.processRecognitionResult(result);
      if (dictationResult) {
        this.emitEvent("dictation", dictationResult);
      }
      return;
    }

    // Process commands only for final results
    if (result.isFinal && this.options.enableCommands) {
      this.processVoiceCommand(result.transcript, result.confidence);
    }
  }

  /**
   * Handle recognition errors
   */
  private handleRecognitionError(errorData: any): void {
    console.error("[VoiceCommandHandler] Recognition error:", errorData);

    // Provide user feedback for specific errors
    if (this.options.enableFeedback && errorData.userMessage) {
      this.speak(errorData.userMessage);
    }
  }

  /**
   * Process voice command
   */
  private processVoiceCommand(transcript: string, confidence: number): void {
    const matches = this.commandRegistry.processVoiceCommand({
      transcript,
      confidence,
      language: this.currentLanguage,
      isDictationMode: this.dictationManager.isDictating(),
    });

    if (matches.length > 0) {
      const bestMatch = matches[0];
      if (bestMatch.confidence > 0.7) {
        this.executeCommand(bestMatch);
      } else if (this.options.debugMode) {
        console.log("[VoiceCommandHandler] Low confidence command match:", bestMatch);
      }
    } else if (this.options.debugMode) {
      console.log("[VoiceCommandHandler] No command matches for:", transcript);
    }
  }

  /**
   * Execute a voice command
   */
  private async executeCommand(match: VoiceCommandMatch): Promise<void> {
    try {
      if (this.options.enableFeedback) {
        this.speak(`Executing ${match.command.description}`);
      }

      await this.commandRegistry.executeCommand({
        match,
        enableFeedback: this.options.enableFeedback,
        debugMode: this.options.debugMode,
      });

      if (this.options.debugMode) {
        console.log("[VoiceCommandHandler] Command executed:", match.command.command);
      }
    } catch (error) {
      console.error("[VoiceCommandHandler] Command execution error:", error);
      if (this.options.enableFeedback) {
        this.speak("Sorry, there was an error executing that command.");
      }
    }
  }

  /**
   * Start voice recognition
   */
  public start(): void {
    if (!this.recognitionManager.isRecognitionSupported()) {
      console.warn("[VoiceCommandHandler] Speech recognition not available");
      return;
    }

    this.isEnabled = true;
    this.recognitionManager.start();
  }

  /**
   * Stop voice recognition
   */
  public stop(): void {
    this.isEnabled = false;
    this.recognitionManager.stop();

    if (this.dictationManager.isDictating()) {
      this.dictationManager.stopDictation();
    }
  }

  /**
   * Speak text using speech synthesis
   */
  public async speak(text: string, options?: Partial<VoiceSynthesisOptions>): Promise<void> {
    if (!this.options.enableFeedback) return;
    return await this.synthesisManager.speak(text, options);
  }

  /**
   * Start dictation mode
   */
  public startDictation(): void {
    if (!this.options.enableDictation) {
      console.warn("[VoiceCommandHandler] Dictation is disabled");
      return;
    }

    this.dictationManager.startDictation();

    if (this.options.enableFeedback) {
      this.speak("Dictation mode started. Speak your input.");
    }

    if (this.options.debugMode) {
      console.log("[VoiceCommandHandler] Dictation mode started");
    }
  }

  /**
   * Stop dictation mode
   */
  public stopDictation(): DictationResult {
    const result = this.dictationManager.stopDictation();

    if (this.options.enableFeedback) {
      this.speak("Dictation mode stopped.");
    }

    if (this.options.debugMode) {
      console.log("[VoiceCommandHandler] Dictation mode stopped");
    }

    return result;
  }

  /**
   * Register a new voice command
   */
  public registerCommand(command: VoiceCommand): void {
    this.commandRegistry.registerCommand(command);
  }

  /**
   * Unregister a voice command
   */
  public unregisterCommand(commandId: string): void {
    this.commandRegistry.unregisterCommand(commandId);
  }

  /**
   * Enable/disable a command
   */
  public toggleCommand(commandId: string, enabled: boolean): void {
    this.commandRegistry.toggleCommand(commandId, enabled);
  }

  /**
   * Get available voices
   */
  public getAvailableVoices(): SpeechSynthesisVoice[] {
    return this.synthesisManager.getAvailableVoices();
  }

  /**
   * Set language for recognition and synthesis
   */
  public setLanguage(language: string): void {
    this.currentLanguage = language;
    this.recognitionManager.setLanguage(language);
    this.synthesisManager.setLanguage(language);
    this.dictationManager.updateOptions({ language });
  }

  /**
   * Update options
   */
  public updateOptions(newOptions: Partial<VoiceCommandHandlerOptions>): void {
    this.options = { ...this.options, ...newOptions };

    if (newOptions.recognition) {
      this.recognitionManager.updateOptions(newOptions.recognition);
    }

    if (newOptions.synthesis) {
      this.synthesisManager.updateOptions(newOptions.synthesis);
    }
  }

  /**
   * Check if voice recognition is supported
   */
  public static isRecognitionSupported(): boolean {
    return (
      typeof window !== "undefined" &&
      ("webkitSpeechRecognition" in window || "SpeechRecognition" in window)
    );
  }

  /**
   * Check if speech synthesis is supported
   */
  public static isSynthesisSupported(): boolean {
    return typeof window !== "undefined" && "speechSynthesis" in window;
  }

  /**
   * Add event listener
   */
  public addEventListener(type: VoiceEventType, listener: VoiceEventListener): void {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, new Set());
    }
    this.eventListeners.get(type)!.add(listener);
  }

  /**
   * Remove event listener
   */
  public removeEventListener(type: VoiceEventType, listener: VoiceEventListener): void {
    const listeners = this.eventListeners.get(type);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  /**
   * Emit event to listeners
   */
  private emitEvent(type: VoiceEventType, data?: any): void {
    const listeners = this.eventListeners.get(type);
    if (listeners) {
      const event: VoiceEvent = {
        type,
        data,
        timestamp: Date.now(),
      };

      listeners.forEach((listener) => {
        try {
          listener(event);
        } catch (error) {
          console.error("[VoiceCommandHandler] Event listener error:", error);
        }
      });
    }
  }

  /**
   * Get current status
   */
  public getStatus(): VoiceStatus {
    const recognitionStatus = this.recognitionManager.getStatus();
    const synthesisStatus = this.synthesisManager.getStatus();
    const commandStats = this.commandRegistry.getStatistics();

    return {
      isEnabled: this.isEnabled,
      isListening: recognitionStatus.isListening,
      isDictationMode: this.dictationManager.isDictating(),
      isSpeaking: synthesisStatus.isSpeaking,
      commandCount: commandStats.totalCommands,
      language: this.currentLanguage,
    };
  }

  /**
   * Get detailed system information
   */
  public getSystemInfo(): {
    status: VoiceStatus;
    support: VoiceSupportInfo;
    recognition: ReturnType<SpeechRecognitionManager["getStatus"]>;
    synthesis: ReturnType<SpeechSynthesisManager["getStatus"]>;
    commands: ReturnType<CommandRegistry["getStatistics"]>;
    dictation: ReturnType<DictationManager["getStatistics"]>;
  } {
    return {
      status: this.getStatus(),
      support: {
        recognition: VoiceCommandHandler.isRecognitionSupported(),
        synthesis: VoiceCommandHandler.isSynthesisSupported(),
        fullSupport:
          VoiceCommandHandler.isRecognitionSupported() &&
          VoiceCommandHandler.isSynthesisSupported(),
      },
      recognition: this.recognitionManager.getStatus(),
      synthesis: this.synthesisManager.getStatus(),
      commands: this.commandRegistry.getStatistics(),
      dictation: this.dictationManager.getStatistics(),
    };
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    this.stop();

    this.recognitionManager.destroy();
    this.synthesisManager.destroy();
    this.commandRegistry.destroy();
    this.dictationManager.destroy();

    this.eventListeners.clear();
  }
}

// Global instance for easy access
let globalVoiceCommandHandler: VoiceCommandHandler | null = null;

/**
 * Get or create global voice command handler instance
 */
export function getVoiceCommandHandler(
  options?: Partial<VoiceCommandHandlerOptions>
): VoiceCommandHandler {
  if (!globalVoiceCommandHandler) {
    globalVoiceCommandHandler = new VoiceCommandHandler(options);
  }
  return globalVoiceCommandHandler;
}

/**
 * Utility function to check browser support
 */
export function checkVoiceSupport(): VoiceSupportInfo {
  return {
    recognition: VoiceCommandHandler.isRecognitionSupported(),
    synthesis: VoiceCommandHandler.isSynthesisSupported(),
    fullSupport:
      VoiceCommandHandler.isRecognitionSupported() && VoiceCommandHandler.isSynthesisSupported(),
  };
}
