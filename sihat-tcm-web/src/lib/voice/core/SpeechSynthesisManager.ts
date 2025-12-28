/**
 * Speech Synthesis Manager
 * 
 * Handles text-to-speech functionality with queue management,
 * voice selection, and feedback control for the Sihat TCM application.
 */

import {
  VoiceSynthesisOptions,
  SpeechQueueItem,
  VoiceEvent,
  VoiceEventListener
} from '../interfaces/VoiceInterfaces';

export class SpeechSynthesisManager {
  private synthesis: SpeechSynthesis | null = null;
  private feedbackQueue: SpeechQueueItem[] = [];
  private isSpeaking: boolean = false;
  private eventListeners: Set<VoiceEventListener> = new Set();

  // Default synthesis options
  private defaultOptions: VoiceSynthesisOptions = {
    volume: 0.8,
    rate: 1.0,
    pitch: 1.0,
    language: "en-US",
  };

  private options: VoiceSynthesisOptions;

  constructor(options: Partial<VoiceSynthesisOptions> = {}) {
    this.options = { ...this.defaultOptions, ...options };
    this.initialize();
  }

  /**
   * Initialize speech synthesis
   */
  private initialize(): void {
    if (typeof window === "undefined") return;

    if (!this.isSynthesisSupported()) {
      console.warn("Speech synthesis not supported in this browser");
      return;
    }

    this.synthesis = window.speechSynthesis;
  }

  /**
   * Speak text using speech synthesis
   */
  public speak(text: string, options?: Partial<VoiceSynthesisOptions>): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synthesis) {
        resolve();
        return;
      }

      // Queue feedback if already speaking
      if (this.isSpeaking) {
        this.feedbackQueue.push({
          text,
          options,
          resolve,
          reject
        });
        return;
      }

      this.speakImmediate(text, options, resolve, reject);
    });
  }

  /**
   * Speak text immediately (internal method)
   */
  private speakImmediate(
    text: string,
    options?: Partial<VoiceSynthesisOptions>,
    resolve?: () => void,
    reject?: (error: any) => void
  ): void {
    if (!this.synthesis) {
      resolve?.();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    const synthOptions = {
      ...this.options,
      ...options,
    };

    // Configure utterance
    utterance.volume = synthOptions.volume;
    utterance.rate = synthOptions.rate;
    utterance.pitch = synthOptions.pitch;
    utterance.lang = synthOptions.language;

    // Set voice if specified
    if (synthOptions.voice) {
      utterance.voice = synthOptions.voice;
    } else {
      // Try to find a voice for the specified language
      const voices = this.getAvailableVoices();
      const matchingVoice = voices.find(voice => 
        voice.lang.startsWith(synthOptions.language.split('-')[0])
      );
      if (matchingVoice) {
        utterance.voice = matchingVoice;
      }
    }

    // Setup event handlers
    utterance.onstart = () => {
      this.isSpeaking = true;
      this.emitEvent("speechstart", { text, options: synthOptions });
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      this.emitEvent("speechend", { text, options: synthOptions });
      resolve?.();

      // Process queued feedback
      this.processQueue();
    };

    utterance.onerror = (event) => {
      this.isSpeaking = false;
      console.error("[SpeechSynthesisManager] Speech synthesis error:", event);
      this.emitEvent("error", {
        error: "synthesis_error",
        message: "Speech synthesis failed",
        originalEvent: event
      });
      reject?.(event);

      // Process queued feedback even on error
      this.processQueue();
    };

    utterance.onpause = () => {
      this.emitEvent("speechpause", { text, options: synthOptions });
    };

    utterance.onresume = () => {
      this.emitEvent("speechresume", { text, options: synthOptions });
    };

    // Speak the utterance
    this.synthesis.speak(utterance);
  }

  /**
   * Process the speech queue
   */
  private processQueue(): void {
    if (this.feedbackQueue.length > 0 && !this.isSpeaking) {
      const nextItem = this.feedbackQueue.shift()!;
      this.speakImmediate(
        nextItem.text,
        nextItem.options,
        nextItem.resolve,
        nextItem.reject
      );
    }
  }

  /**
   * Stop current speech and clear queue
   */
  public stop(): void {
    if (this.synthesis) {
      this.synthesis.cancel();
    }
    
    this.isSpeaking = false;
    
    // Reject all queued items
    this.feedbackQueue.forEach(item => {
      item.reject(new Error("Speech cancelled"));
    });
    this.feedbackQueue.length = 0;

    this.emitEvent("speechstop", {});
  }

  /**
   * Pause current speech
   */
  public pause(): void {
    if (this.synthesis && this.isSpeaking) {
      this.synthesis.pause();
    }
  }

  /**
   * Resume paused speech
   */
  public resume(): void {
    if (this.synthesis) {
      this.synthesis.resume();
    }
  }

  /**
   * Get available voices
   */
  public getAvailableVoices(): SpeechSynthesisVoice[] {
    if (!this.synthesis) return [];
    return this.synthesis.getVoices();
  }

  /**
   * Get voices for a specific language
   */
  public getVoicesForLanguage(language: string): SpeechSynthesisVoice[] {
    const voices = this.getAvailableVoices();
    const langCode = language.split('-')[0]; // Get base language code
    
    return voices.filter(voice => 
      voice.lang.startsWith(langCode) || voice.lang.startsWith(language)
    );
  }

  /**
   * Set default voice for a language
   */
  public setVoiceForLanguage(language: string, voiceName?: string): boolean {
    const voices = this.getVoicesForLanguage(language);
    
    if (voices.length === 0) {
      console.warn(`No voices available for language: ${language}`);
      return false;
    }

    let selectedVoice: SpeechSynthesisVoice;

    if (voiceName) {
      selectedVoice = voices.find(voice => voice.name === voiceName) || voices[0];
    } else {
      // Prefer local voices over remote ones
      selectedVoice = voices.find(voice => voice.localService) || voices[0];
    }

    this.options.voice = selectedVoice;
    return true;
  }

  /**
   * Update synthesis options
   */
  public updateOptions(newOptions: Partial<VoiceSynthesisOptions>): void {
    this.options = { ...this.options, ...newOptions };
  }

  /**
   * Set language for synthesis
   */
  public setLanguage(language: string): void {
    this.options.language = language;
    
    // Try to set an appropriate voice for the language
    this.setVoiceForLanguage(language);
  }

  /**
   * Check if speech synthesis is supported
   */
  public isSynthesisSupported(): boolean {
    return typeof window !== "undefined" && "speechSynthesis" in window;
  }

  /**
   * Check if currently speaking
   */
  public getIsSpeaking(): boolean {
    return this.isSpeaking;
  }

  /**
   * Get queue length
   */
  public getQueueLength(): number {
    return this.feedbackQueue.length;
  }

  /**
   * Clear speech queue without stopping current speech
   */
  public clearQueue(): void {
    this.feedbackQueue.forEach(item => {
      item.reject(new Error("Speech queue cleared"));
    });
    this.feedbackQueue.length = 0;
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
        console.error("[SpeechSynthesisManager] Event listener error:", error);
      }
    });
  }

  /**
   * Get current status
   */
  public getStatus(): {
    isSpeaking: boolean;
    queueLength: number;
    language: string;
    isSupported: boolean;
    availableVoices: number;
  } {
    return {
      isSpeaking: this.isSpeaking,
      queueLength: this.feedbackQueue.length,
      language: this.options.language,
      isSupported: this.isSynthesisSupported(),
      availableVoices: this.getAvailableVoices().length,
    };
  }

  /**
   * Get current options
   */
  public getOptions(): VoiceSynthesisOptions {
    return { ...this.options };
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    this.stop();
    this.eventListeners.clear();
    this.synthesis = null;
  }
}