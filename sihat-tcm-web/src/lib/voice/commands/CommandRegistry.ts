/**
 * Command Registry
 * 
 * Manages voice command registration, matching, and execution
 * for the Sihat TCM voice command system.
 */

import {
  VoiceCommand,
  VoiceCommandMatch,
  CommandProcessingContext,
  CommandExecutionContext,
  VoiceEvent,
  VoiceEventListener
} from '../interfaces/VoiceInterfaces';

export class CommandRegistry {
  private commands: Map<string, VoiceCommand> = new Map();
  private eventListeners: Set<VoiceEventListener> = new Set();

  constructor() {
    this.setupDefaultCommands();
  }

  /**
   * Register a new voice command
   */
  public registerCommand(command: VoiceCommand): void {
    this.commands.set(command.command, command);
    console.log("[CommandRegistry] Command registered:", command.command);
  }

  /**
   * Unregister a voice command
   */
  public unregisterCommand(commandId: string): void {
    this.commands.delete(commandId);
    console.log("[CommandRegistry] Command unregistered:", commandId);
  }

  /**
   * Enable/disable a command
   */
  public toggleCommand(commandId: string, enabled: boolean): void {
    const command = this.commands.get(commandId);
    if (command) {
      command.enabled = enabled;
      console.log("[CommandRegistry] Command toggled:", commandId, enabled);
    }
  }

  /**
   * Get all registered commands
   */
  public getAllCommands(): VoiceCommand[] {
    return Array.from(this.commands.values());
  }

  /**
   * Get enabled commands
   */
  public getEnabledCommands(): VoiceCommand[] {
    return Array.from(this.commands.values()).filter(cmd => cmd.enabled);
  }

  /**
   * Get commands by category
   */
  public getCommandsByCategory(category: VoiceCommand['category']): VoiceCommand[] {
    return Array.from(this.commands.values()).filter(cmd => 
      cmd.category === category && cmd.enabled
    );
  }

  /**
   * Process voice command from transcript
   */
  public processVoiceCommand(context: CommandProcessingContext): VoiceCommandMatch[] {
    const matches = this.findCommandMatches(context.transcript);

    if (matches.length > 0) {
      const bestMatch = matches[0];

      if (bestMatch.confidence > 0.7) {
        // High confidence match
        this.emitEvent("command", bestMatch);
        return [bestMatch];
      } else {
        // Low confidence - return all matches for potential disambiguation
        console.log("[CommandRegistry] Low confidence matches:", matches);
        return matches;
      }
    }

    console.log("[CommandRegistry] No command matches for:", context.transcript);
    return [];
  }

  /**
   * Execute a voice command
   */
  public async executeCommand(context: CommandExecutionContext): Promise<void> {
    try {
      const { match, enableFeedback, debugMode } = context;

      if (debugMode) {
        console.log("[CommandRegistry] Executing command:", match.command.command);
      }

      await match.command.action(match.parameters);

      if (debugMode) {
        console.log("[CommandRegistry] Command executed successfully:", match.command.command);
      }
    } catch (error) {
      console.error("[CommandRegistry] Command execution error:", error);
      throw new Error(`Failed to execute command: ${context.match.command.command}`);
    }
  }

  /**
   * Find command matches for transcript
   */
  private findCommandMatches(transcript: string): VoiceCommandMatch[] {
    const matches: VoiceCommandMatch[] = [];
    const normalizedTranscript = transcript.toLowerCase().trim();

    for (const command of this.commands.values()) {
      if (!command.enabled) continue;

      for (const pattern of command.patterns) {
        const normalizedPattern = pattern.toLowerCase();
        const confidence = this.calculatePatternMatch(normalizedTranscript, normalizedPattern);

        if (confidence > 0) {
          matches.push({
            command,
            confidence,
            parameters: this.extractParameters(normalizedTranscript, normalizedPattern),
          });
        }
      }
    }

    // Sort by confidence (highest first)
    return matches.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Calculate pattern match confidence
   */
  private calculatePatternMatch(transcript: string, pattern: string): number {
    // Exact match
    if (transcript === pattern) {
      return 1.0;
    }

    // Contains pattern
    if (transcript.includes(pattern)) {
      return 0.8;
    }

    // Fuzzy match using similarity
    const similarity = this.calculateSimilarity(transcript, pattern);
    if (similarity > 0.7) {
      return similarity * 0.7; // Scale down fuzzy matches
    }

    // Word-based matching
    const transcriptWords = transcript.split(/\s+/);
    const patternWords = pattern.split(/\s+/);
    
    const matchingWords = patternWords.filter(word => 
      transcriptWords.some(tWord => 
        tWord.includes(word) || word.includes(tWord) || 
        this.calculateSimilarity(tWord, word) > 0.8
      )
    );

    if (matchingWords.length > 0) {
      return (matchingWords.length / patternWords.length) * 0.6;
    }

    return 0;
  }

  /**
   * Calculate similarity between two strings (Levenshtein-based)
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1)
      .fill(null)
      .map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Extract parameters from transcript (basic implementation)
   */
  private extractParameters(transcript: string, pattern: string): Record<string, any> {
    const parameters: Record<string, any> = {};

    // Extract numbers
    const numbers = transcript.match(/\d+/g);
    if (numbers) {
      parameters.numbers = numbers.map((n) => parseInt(n));
    }

    // Extract quoted strings
    const quotes = transcript.match(/"([^"]+)"/g);
    if (quotes) {
      parameters.quotes = quotes.map(q => q.slice(1, -1));
    }

    // Extract words that differ from pattern
    const transcriptWords = transcript.split(/\s+/);
    const patternWords = pattern.split(/\s+/);
    
    const extraWords = transcriptWords.filter(word => 
      !patternWords.some(pWord => 
        word.toLowerCase().includes(pWord.toLowerCase()) ||
        pWord.toLowerCase().includes(word.toLowerCase())
      )
    );

    if (extraWords.length > 0) {
      parameters.extraWords = extraWords;
    }

    return parameters;
  }

  /**
   * Setup default voice commands
   */
  private setupDefaultCommands(): void {
    // Navigation commands
    this.registerCommand({
      command: "navigate_next",
      patterns: ["next", "continue", "go forward", "proceed"],
      action: () => this.triggerNavigationAction("next"),
      description: "Navigate to next step",
      category: "navigation",
      enabled: true,
    });

    this.registerCommand({
      command: "navigate_back",
      patterns: ["back", "previous", "go back", "return"],
      action: () => this.triggerNavigationAction("back"),
      description: "Navigate to previous step",
      category: "navigation",
      enabled: true,
    });

    this.registerCommand({
      command: "navigate_skip",
      patterns: ["skip", "skip this", "skip step"],
      action: () => this.triggerNavigationAction("skip"),
      description: "Skip current step",
      category: "navigation",
      enabled: true,
    });

    // Input commands
    this.registerCommand({
      command: "start_dictation",
      patterns: ["start dictation", "begin input", "voice input", "dictate"],
      action: () => this.triggerAction("start_dictation"),
      description: "Start voice dictation",
      category: "input",
      enabled: true,
    });

    this.registerCommand({
      command: "stop_dictation",
      patterns: ["stop dictation", "end input", "finish dictation"],
      action: () => this.triggerAction("stop_dictation"),
      description: "Stop voice dictation",
      category: "input",
      enabled: true,
    });

    // Control commands
    this.registerCommand({
      command: "start_recording",
      patterns: ["start recording", "begin recording", "record audio"],
      action: () => this.triggerAction("start_recording"),
      description: "Start audio recording",
      category: "control",
      enabled: true,
    });

    this.registerCommand({
      command: "stop_recording",
      patterns: ["stop recording", "end recording", "finish recording"],
      action: () => this.triggerAction("stop_recording"),
      description: "Stop audio recording",
      category: "control",
      enabled: true,
    });

    // Accessibility commands
    this.registerCommand({
      command: "repeat_instructions",
      patterns: ["repeat", "say again", "repeat instructions"],
      action: () => this.triggerAction("repeat_instructions"),
      description: "Repeat last instruction",
      category: "accessibility",
      enabled: true,
    });

    this.registerCommand({
      command: "help",
      patterns: ["help", "what can I say", "voice commands", "assistance"],
      action: () => this.triggerAction("help"),
      description: "Get voice command help",
      category: "accessibility",
      enabled: true,
    });
  }

  /**
   * Trigger navigation actions
   */
  private triggerNavigationAction(action: string): void {
    const event = new CustomEvent("voice-navigation", {
      detail: { action },
    });
    window.dispatchEvent(event);
  }

  /**
   * Trigger general actions
   */
  private triggerAction(action: string): void {
    const event = new CustomEvent("voice-action", {
      detail: { action },
    });
    window.dispatchEvent(event);
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
        console.error("[CommandRegistry] Event listener error:", error);
      }
    });
  }

  /**
   * Get command statistics
   */
  public getStatistics(): {
    totalCommands: number;
    enabledCommands: number;
    commandsByCategory: Record<string, number>;
  } {
    const commands = Array.from(this.commands.values());
    const enabled = commands.filter(cmd => cmd.enabled);
    
    const byCategory = commands.reduce((acc, cmd) => {
      acc[cmd.category] = (acc[cmd.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalCommands: commands.length,
      enabledCommands: enabled.length,
      commandsByCategory: byCategory,
    };
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    this.commands.clear();
    this.eventListeners.clear();
  }
}