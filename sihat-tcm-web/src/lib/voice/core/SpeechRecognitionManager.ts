/**
 * Speech Recognition Manager
 *
 * Handles voice-to-text functionality with continuous recognition,
 * interim results, and language switching for the Sihat TCM application.
 */

import {
  VoiceRecognitionOptions,
  VoiceRecognitionResult,
  VoiceEvent,
  VoiceEventListener,
  ExtendedSpeechRecognitionEvent,
  ExtendedSpeechRecognitionErrorEvent
} from '../interfaces/VoiceInterfaces';

// Browser speech recognition types
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  grammars?: SpeechGrammarList;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onend: ((this: SpeechRecognition, ev: Event) => void) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null;
  onspeechstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onspeechend: ((this: SpeechRecognition, ev: Event) => void) | null;
  onaudiostart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onaudioend: ((this: SpeechRecognition, ev: Event) => void) | null;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

export class SpeechRecognitionManager {
  private recognition: SpeechRecognition | null = null;
  private isListening: boolean = false;
  private eventListeners: Set<VoiceEventListener> = new Set();

  // Default recognition options
  private defaultOptions: VoiceRecognitionOptions = {
    language: "en-US",
    continuous: true,
    interimResults: true,
    maxAlternatives: 3,
  };

  private options: VoiceRecognitionOptions;

  constructor(options: Partial<VoiceRecognitionOptions> = {}) {
    this.options = { ...this.defaultOptions, ...options };
    this.initialize();
  }

  /**
   * Initialize speech recognition
   */
  private initialize(): void {
    if (typeof window === "undefined") return;

    if (!this.isRecognitionSupported()) {
      console.warn("Speech recognition not supported in this browser");
      return;
    }

    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognitionClass) {
      this.recognition = new SpeechRecognitionClass();
      this.configureRecognition();
    }
  }

  /**
   * Configure recognition instance with current options
   */
  private configureRecognition(): void {
    if (!this.recognition) return;

    this.recognition.continuous = this.options.continuous;
    this.recognition.interimResults = this.options.interimResults;
    this.recognition.lang = this.options.language;
    this.recognition.maxAlternatives = this.options.maxAlternatives;

    if (this.options.grammars) {
      this.recognition.grammars = this.options.grammars;
    }

    // Setup event handlers
    this.recognition.onstart = () => {
      this.isListening = true;
      this.emitEvent("start", { language: this.options.language });
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.emitEvent("stop", {});

      // Auto-restart if continuous mode
      if (this.options.continuous && this.isListening) {
        setTimeout(() => {
          if (this.isListening) {
            this.start();
          }
        }, 100);
      }
    };

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      const results: VoiceRecognitionResult[] = [];

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const alternatives: string[] = [];

        for (let j = 1; j < result.length && j < this.options.maxAlternatives; j++) {
          alternatives.push(result[j].transcript);
        }

        results.push({
          transcript: result[0].transcript,
          confidence: result[0].confidence,
          isFinal: result.isFinal,
          alternatives: alternatives.length > 0 ? alternatives : undefined,
        });
      }

      this.emitEvent("result", { results });
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("[SpeechRecognitionManager] Recognition error:", event.error);
      this.emitEvent("error", {
        error: event.error,
        message: event.message || "Speech recognition error",
      });

      // Don't restart on certain errors
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        this.isListening = false;
      }
    };

    this.recognition.onspeechstart = () => {
      this.emitEvent("speechstart", {});
    };

    this.recognition.onspeechend = () => {
      this.emitEvent("speechend", {});
    };

    this.recognition.onaudiostart = () => {
      this.emitEvent("audiostart", {});
    };

    this.recognition.onaudioend = () => {
      this.emitEvent("audioend", {});
    };
  }

  /**
   * Start listening
   */
  public start(): void {
    if (!this.recognition) {
      console.warn("Speech recognition not initialized");
      return;
    }

    if (this.isListening) {
      console.warn("Recognition already listening");
      return;
    }

    try {
      this.recognition.start();
    } catch (error) {
      console.error("[SpeechRecognitionManager] Failed to start recognition:", error);
      this.emitEvent("error", {
        error: "start_failed",
        message: "Failed to start speech recognition",
      });
    }
  }

  /**
   * Stop listening
   */
  public stop(): void {
    if (this.recognition && this.isListening) {
      this.isListening = false;
      this.recognition.stop();
    }
  }

  /**
   * Abort recognition immediately
   */
  public abort(): void {
    if (this.recognition) {
      this.isListening = false;
      this.recognition.abort();
    }
  }

  /**
   * Update recognition options
   */
  public updateOptions(newOptions: Partial<VoiceRecognitionOptions>): void {
    const wasListening = this.isListening;

    if (wasListening) {
      this.stop();
    }

    this.options = { ...this.options, ...newOptions };
    this.configureRecognition();

    if (wasListening) {
      this.start();
    }
  }

  /**
   * Set recognition language
   */
  public setLanguage(language: string): void {
    this.updateOptions({ language });
  }

  /**
   * Check if speech recognition is supported
   */
  public isRecognitionSupported(): boolean {
    return typeof window !== "undefined" &&
           ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);
  }

  /**
   * Check if currently listening
   */
  public getIsListening(): boolean {
    return this.isListening;
  }

  /**
   * Add event listener
   */
  public addEventListener(listener: VoiceEventListener): void {
    this.eventListeners.add(listener);
  }

  /**
   * Remove event listener
   */
  public removeEventListener(listener: VoiceEventListener): void {
    this.eventListeners.delete(listener);
  }

  /**
   * Emit event to listeners
   */
  private emitEvent(type: string, data?: unknown): void {
    const event: VoiceEvent = {
      type: type as VoiceEvent["type"],
      data,
      timestamp: Date.now(),
    };

    this.eventListeners.forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        console.error("[SpeechRecognitionManager] Event listener error:", error);
      }
    });
  }

  /**
   * Get current status
   */
  public getStatus(): {
    isListening: boolean;
    language: string;
    isSupported: boolean;
    continuous: boolean;
  } {
    return {
      isListening: this.isListening,
      language: this.options.language,
      isSupported: this.isRecognitionSupported(),
      continuous: this.options.continuous,
    };
  }

  /**
   * Get current options
   */
  public getOptions(): VoiceRecognitionOptions {
    return { ...this.options };
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    this.abort();
    this.eventListeners.clear();
    this.recognition = null;
  }
}
