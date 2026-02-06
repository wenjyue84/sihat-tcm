/**
 * Dictation Manager
 *
 * Handles voice dictation mode for text input in the Sihat TCM application.
 * Provides seamless switching between command mode and dictation mode.
 */

import {
  VoiceRecognitionResult,
  VoiceEvent,
  VoiceEventListener,
} from "../interfaces/VoiceInterfaces";

export interface DictationOptions {
  autoCapitalize: boolean;
  autoPunctuation: boolean;
  language: string;
  maxLength?: number;
  stopWords?: string[];
}

export interface DictationResult {
  text: string;
  confidence: number;
  isFinal: boolean;
  wordCount: number;
  timestamp: number;
}

export class DictationManager {
  private isDictationMode: boolean = false;
  private currentText: string = "";
  private eventListeners: Set<VoiceEventListener> = new Set();
  private options: DictationOptions;
  private dictationStartTime: number = 0;
  private lastUpdateTime: number = 0;

  // Default options
  private defaultOptions: DictationOptions = {
    autoCapitalize: true,
    autoPunctuation: true,
    language: "en-US",
    maxLength: 1000,
    stopWords: ["stop dictation", "end dictation", "finish dictation"],
  };

  constructor(options: Partial<DictationOptions> = {}) {
    this.options = { ...this.defaultOptions, ...options };
  }

  /**
   * Start dictation mode
   */
  public startDictation(): void {
    if (this.isDictationMode) {
      console.warn("[DictationManager] Dictation already active");
      return;
    }

    this.isDictationMode = true;
    this.currentText = "";
    this.dictationStartTime = Date.now();
    this.lastUpdateTime = this.dictationStartTime;

    this.emitEvent("dictation", {
      action: "start",
      text: this.currentText,
      timestamp: this.dictationStartTime,
    });

    console.log("[DictationManager] Dictation mode started");
  }

  /**
   * Stop dictation mode
   */
  public stopDictation(): DictationResult {
    if (!this.isDictationMode) {
      console.warn("[DictationManager] Dictation not active");
      return this.createEmptyResult();
    }

    const result = this.createDictationResult(this.currentText, 1.0, true);

    this.isDictationMode = false;

    this.emitEvent("dictation", {
      action: "stop",
      result,
      duration: Date.now() - this.dictationStartTime,
    });

    console.log("[DictationManager] Dictation mode stopped");
    return result;
  }

  /**
   * Process recognition result for dictation
   */
  public processRecognitionResult(result: VoiceRecognitionResult): DictationResult | null {
    if (!this.isDictationMode) {
      return null;
    }

    // Check for stop words
    if (this.containsStopWords(result.transcript)) {
      return this.stopDictation();
    }

    // Process the transcript
    const processedText = this.processTranscript(result.transcript);

    if (result.isFinal) {
      // Add to current text
      this.currentText = this.appendText(this.currentText, processedText);
      this.lastUpdateTime = Date.now();
    }

    const dictationResult = this.createDictationResult(
      result.isFinal ? this.currentText : this.currentText + " " + processedText,
      result.confidence,
      result.isFinal
    );

    // Check length limits
    if (this.options.maxLength && dictationResult.text.length > this.options.maxLength) {
      console.warn("[DictationManager] Maximum length reached, stopping dictation");
      return this.stopDictation();
    }

    this.emitEvent("dictation", {
      action: "update",
      result: dictationResult,
      isInterim: !result.isFinal,
    });

    return dictationResult;
  }

  /**
   * Process transcript text
   */
  private processTranscript(transcript: string): string {
    let processed = transcript.trim();

    if (this.options.autoCapitalize) {
      processed = this.applyCapitalization(processed);
    }

    if (this.options.autoPunctuation) {
      processed = this.applyPunctuation(processed);
    }

    return processed;
  }

  /**
   * Apply automatic capitalization
   */
  private applyCapitalization(text: string): string {
    if (!text) return text;

    // Capitalize first letter
    let result = text.charAt(0).toUpperCase() + text.slice(1);

    // Capitalize after sentence endings
    result = result.replace(/([.!?]\s+)([a-z])/g, (match, punctuation, letter) => {
      return punctuation + letter.toUpperCase();
    });

    return result;
  }

  /**
   * Apply automatic punctuation
   */
  private applyPunctuation(text: string): string {
    let result = text;

    // Common punctuation replacements
    const punctuationMap: Record<string, string> = {
      period: ".",
      comma: ",",
      "question mark": "?",
      "exclamation mark": "!",
      "exclamation point": "!",
      semicolon: ";",
      colon: ":",
      "new line": "\n",
      "new paragraph": "\n\n",
    };

    // Replace spoken punctuation
    Object.entries(punctuationMap).forEach(([spoken, symbol]) => {
      const regex = new RegExp(`\\b${spoken}\\b`, "gi");
      result = result.replace(regex, symbol);
    });

    return result;
  }

  /**
   * Append text with proper spacing
   */
  private appendText(currentText: string, newText: string): string {
    if (!currentText) return newText;
    if (!newText) return currentText;

    // Check if we need a space
    const needsSpace =
      !currentText.endsWith(" ") &&
      !currentText.endsWith("\n") &&
      !newText.startsWith(" ") &&
      !/^[.!?,:;]/.test(newText);

    return currentText + (needsSpace ? " " : "") + newText;
  }

  /**
   * Check if transcript contains stop words
   */
  private containsStopWords(transcript: string): boolean {
    if (!this.options.stopWords) return false;

    const lowerTranscript = transcript.toLowerCase();
    return this.options.stopWords.some((stopWord) =>
      lowerTranscript.includes(stopWord.toLowerCase())
    );
  }

  /**
   * Create dictation result object
   */
  private createDictationResult(
    text: string,
    confidence: number,
    isFinal: boolean
  ): DictationResult {
    return {
      text,
      confidence,
      isFinal,
      wordCount: text
        .trim()
        .split(/\s+/)
        .filter((word) => word.length > 0).length,
      timestamp: Date.now(),
    };
  }

  /**
   * Create empty result
   */
  private createEmptyResult(): DictationResult {
    return {
      text: "",
      confidence: 0,
      isFinal: true,
      wordCount: 0,
      timestamp: Date.now(),
    };
  }

  /**
   * Clear current dictation text
   */
  public clearText(): void {
    this.currentText = "";
    this.emitEvent("dictation", {
      action: "clear",
      text: this.currentText,
    });
  }

  /**
   * Set dictation text (for editing)
   */
  public setText(text: string): void {
    this.currentText = text;
    this.emitEvent("dictation", {
      action: "set",
      text: this.currentText,
    });
  }

  /**
   * Get current dictation text
   */
  public getCurrentText(): string {
    return this.currentText;
  }

  /**
   * Check if in dictation mode
   */
  public isDictating(): boolean {
    return this.isDictationMode;
  }

  /**
   * Update dictation options
   */
  public updateOptions(newOptions: Partial<DictationOptions>): void {
    this.options = { ...this.options, ...newOptions };
  }

  /**
   * Get dictation statistics
   */
  public getStatistics(): {
    isActive: boolean;
    currentLength: number;
    wordCount: number;
    duration: number;
    lastUpdate: number;
  } {
    return {
      isActive: this.isDictationMode,
      currentLength: this.currentText.length,
      wordCount: this.currentText
        .trim()
        .split(/\s+/)
        .filter((word) => word.length > 0).length,
      duration: this.isDictationMode ? Date.now() - this.dictationStartTime : 0,
      lastUpdate: this.lastUpdateTime,
    };
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
  private emitEvent(type: string, data?: any): void {
    const event: VoiceEvent = {
      type: type as any,
      data,
      timestamp: Date.now(),
    };

    this.eventListeners.forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        console.error("[DictationManager] Event listener error:", error);
      }
    });
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    if (this.isDictationMode) {
      this.stopDictation();
    }
    this.eventListeners.clear();
  }
}
