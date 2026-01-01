/**
 * Voice Command Handler - Legacy Wrapper
 * 
 * @deprecated This file is maintained for backward compatibility.
 * Use the new modular system: import { VoiceCommandHandler } from './voice'
 * 
 * The new system provides:
 * - Modular architecture with focused components
 * - Better separation of concerns
 * - Enhanced testing capabilities
 * - Improved maintainability
 */

import {
  VoiceCommandHandler as ModularVoiceCommandHandler,
  getVoiceCommandHandler as getModularVoiceCommandHandler,
  checkVoiceSupport as checkModularVoiceSupport,
  type VoiceCommand,
  type VoiceRecognitionOptions,
  type VoiceSynthesisOptions,
  type VoiceCommandHandlerOptions,
  type VoiceRecognitionResult,
  type VoiceCommandMatch,
  type VoiceEventType,
  type VoiceEvent,
  type VoiceStatus,
  type VoiceSupportInfo,
  type VoiceEventListener
} from './voice';

// Re-export types for backward compatibility
export type {
  VoiceCommand,
  VoiceRecognitionOptions,
  VoiceSynthesisOptions,
  VoiceCommandHandlerOptions,
  VoiceRecognitionResult,
  VoiceCommandMatch,
  VoiceEventType,
  VoiceEvent,
  VoiceEventListener
};

/**
 * @deprecated Use the new modular VoiceCommandHandler from './voice'
 */
export class VoiceCommandHandler {
  private handler: ModularVoiceCommandHandler;

  constructor(options: Partial<VoiceCommandHandlerOptions> = {}) {
    console.warn('[VoiceCommandHandler] Using deprecated API. Please migrate to the new modular system.');
    this.handler = new ModularVoiceCommandHandler(options);
  }

  /**
   * @deprecated Use handler.start() from the new modular system
   */
  public start(): void {
    console.warn('[VoiceCommandHandler] Using deprecated API. Please migrate to the new modular system.');
    this.handler.start();
  }

  /**
   * @deprecated Use handler.stop() from the new modular system
   */
  public stop(): void {
    console.warn('[VoiceCommandHandler] Using deprecated API. Please migrate to the new modular system.');
    this.handler.stop();
  }

  /**
   * @deprecated Use handler.speak() from the new modular system
   */
  public async speak(text: string, options?: Partial<VoiceSynthesisOptions>): Promise<void> {
    console.warn('[VoiceCommandHandler] Using deprecated API. Please migrate to the new modular system.');
    return await this.handler.speak(text, options);
  }

  /**
   * @deprecated Use handler.startDictation() from the new modular system
   */
  public startDictation(): void {
    console.warn('[VoiceCommandHandler] Using deprecated API. Please migrate to the new modular system.');
    this.handler.startDictation();
  }

  /**
   * @deprecated Use handler.stopDictation() from the new modular system
   */
  public stopDictation(): void {
    console.warn('[VoiceCommandHandler] Using deprecated API. Please migrate to the new modular system.');
    this.handler.stopDictation();
  }

  /**
   * @deprecated Use handler.registerCommand() from the new modular system
   */
  public registerCommand(command: VoiceCommand): void {
    console.warn('[VoiceCommandHandler] Using deprecated API. Please migrate to the new modular system.');
    this.handler.registerCommand(command);
  }

  /**
   * @deprecated Use handler.unregisterCommand() from the new modular system
   */
  public unregisterCommand(commandId: string): void {
    console.warn('[VoiceCommandHandler] Using deprecated API. Please migrate to the new modular system.');
    this.handler.unregisterCommand(commandId);
  }

  /**
   * @deprecated Use handler.toggleCommand() from the new modular system
   */
  public toggleCommand(commandId: string, enabled: boolean): void {
    console.warn('[VoiceCommandHandler] Using deprecated API. Please migrate to the new modular system.');
    this.handler.toggleCommand(commandId, enabled);
  }

  /**
   * @deprecated Use handler.getAvailableVoices() from the new modular system
   */
  public getAvailableVoices(): SpeechSynthesisVoice[] {
    console.warn('[VoiceCommandHandler] Using deprecated API. Please migrate to the new modular system.');
    return this.handler.getAvailableVoices();
  }

  /**
   * @deprecated Use handler.setLanguage() from the new modular system
   */
  public setLanguage(language: string): void {
    console.warn('[VoiceCommandHandler] Using deprecated API. Please migrate to the new modular system.');
    this.handler.setLanguage(language);
  }

  /**
   * @deprecated Use VoiceCommandHandler.isRecognitionSupported() from the new modular system
   */
  public static isRecognitionSupported(): boolean {
    console.warn('[VoiceCommandHandler] Using deprecated API. Please migrate to the new modular system.');
    return ModularVoiceCommandHandler.isRecognitionSupported();
  }

  /**
   * @deprecated Use VoiceCommandHandler.isSynthesisSupported() from the new modular system
   */
  public static isSynthesisSupported(): boolean {
    console.warn('[VoiceCommandHandler] Using deprecated API. Please migrate to the new modular system.');
    return ModularVoiceCommandHandler.isSynthesisSupported();
  }

  /**
   * @deprecated Use handler.addEventListener() from the new modular system
   */
  public addEventListener(type: VoiceEventType, listener: VoiceEventListener): void {
    console.warn('[VoiceCommandHandler] Using deprecated API. Please migrate to the new modular system.');
    this.handler.addEventListener(type, listener);
  }

  /**
   * @deprecated Use handler.removeEventListener() from the new modular system
   */
  public removeEventListener(type: VoiceEventType, listener: VoiceEventListener): void {
    console.warn('[VoiceCommandHandler] Using deprecated API. Please migrate to the new modular system.');
    this.handler.removeEventListener(type, listener);
  }

  /**
   * @deprecated Use handler.getStatus() from the new modular system
   */
  public getStatus(): VoiceStatus {
    console.warn('[VoiceCommandHandler] Using deprecated API. Please migrate to the new modular system.');
    return this.handler.getStatus();
  }

  /**
   * @deprecated Use handler.destroy() from the new modular system
   */
  public destroy(): void {
    console.warn('[VoiceCommandHandler] Using deprecated API. Please migrate to the new modular system.');
    this.handler.destroy();
  }
}

// Global instance for easy access
let globalVoiceCommandHandler: VoiceCommandHandler | null = null;

/**
 * Get or create global voice command handler instance
 * @deprecated Use getVoiceCommandHandler from './voice'
 */
export function getVoiceCommandHandler(
  options?: Partial<VoiceCommandHandlerOptions>
): VoiceCommandHandler {
  console.warn('[getVoiceCommandHandler] Using deprecated API. Please migrate to the new modular system.');
  if (!globalVoiceCommandHandler) {
    globalVoiceCommandHandler = new VoiceCommandHandler(options);
  }
  return globalVoiceCommandHandler;
}

/**
 * Utility function to check browser support
 * @deprecated Use checkVoiceSupport from './voice'
 */
export function checkVoiceSupport(): VoiceSupportInfo {
  console.warn('[checkVoiceSupport] Using deprecated API. Please migrate to the new modular system.');
  return checkModularVoiceSupport();
}
