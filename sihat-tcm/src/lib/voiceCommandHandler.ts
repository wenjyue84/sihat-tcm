/**
 * VoiceCommandHandler - Comprehensive voice command and speech recognition system
 * 
 * This handler provides:
 * - Voice recognition for hands-free operation
 * - Voice feedback for accessibility
 * - Voice-to-text for symptom input
 * - Multi-language support
 * - Command pattern recognition
 * - Accessibility integration
 */

export interface VoiceCommand {
  command: string
  patterns: string[]
  action: (params?: any) => void | Promise<void>
  description: string
  category: 'navigation' | 'input' | 'control' | 'accessibility'
  enabled: boolean
}

export interface VoiceRecognitionOptions {
  language: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  grammars?: SpeechGrammarList
}

export interface VoiceSynthesisOptions {
  voice?: SpeechSynthesisVoice
  volume: number
  rate: number
  pitch: number
  language: string
}

export interface VoiceCommandHandlerOptions {
  recognition?: Partial<VoiceRecognitionOptions>
  synthesis?: Partial<VoiceSynthesisOptions>
  enableFeedback: boolean
  enableCommands: boolean
  enableDictation: boolean
  autoStart: boolean
  debugMode: boolean
}

export interface VoiceRecognitionResult {
  transcript: string
  confidence: number
  isFinal: boolean
  alternatives?: string[]
}

export interface VoiceCommandMatch {
  command: VoiceCommand
  confidence: number
  parameters?: Record<string, any>
}

export type VoiceEventType = 
  | 'start' 
  | 'stop' 
  | 'result' 
  | 'command' 
  | 'error' 
  | 'speechstart' 
  | 'speechend'
  | 'dictation'

export interface VoiceEvent {
  type: VoiceEventType
  data?: any
  timestamp: number
}

export class VoiceCommandHandler {
  private recognition: SpeechRecognition | null = null
  private synthesis: SpeechSynthesis | null = null
  private commands: Map<string, VoiceCommand> = new Map()
  private isListening: boolean = false
  private isEnabled: boolean = false
  private isDictationMode: boolean = false
  private currentLanguage: string = 'en-US'
  private eventListeners: Map<VoiceEventType, Set<(event: VoiceEvent) => void>> = new Map()
  private options: VoiceCommandHandlerOptions
  private lastRecognitionTime: number = 0
  private recognitionTimeout: NodeJS.Timeout | null = null
  private feedbackQueue: string[] = []
  private isSpeaking: boolean = false

  // Default recognition options
  private defaultRecognitionOptions: VoiceRecognitionOptions = {
    language: 'en-US',
    continuous: true,
    interimResults: true,
    maxAlternatives: 3
  }

  // Default synthesis options
  private defaultSynthesisOptions: VoiceSynthesisOptions = {
    volume: 0.8,
    rate: 1.0,
    pitch: 1.0,
    language: 'en-US'
  }

  constructor(options: Partial<VoiceCommandHandlerOptions> = {}) {
    this.options = {
      recognition: {},
      synthesis: {},
      enableFeedback: true,
      enableCommands: true,
      enableDictation: true,
      autoStart: false,
      debugMode: false,
      ...options
    }

    this.initialize()
  }

  /**
   * Initialize the voice command handler
   */
  private initialize(): void {
    if (typeof window === 'undefined') return

    this.initializeSpeechRecognition()
    this.initializeSpeechSynthesis()
    this.setupDefaultCommands()

    if (this.options.autoStart) {
      this.start()
    }
  }

  /**
   * Initialize speech recognition
   */
  private initializeSpeechRecognition(): void {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('Speech recognition not supported in this browser')
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    this.recognition = new SpeechRecognition()

    const recognitionOptions = {
      ...this.defaultRecognitionOptions,
      ...this.options.recognition
    }

    this.recognition.continuous = recognitionOptions.continuous
    this.recognition.interimResults = recognitionOptions.interimResults
    this.recognition.maxAlternatives = recognitionOptions.maxAlternatives
    this.recognition.lang = recognitionOptions.language

    this.setupRecognitionEventHandlers()
  }

  /**
   * Initialize speech synthesis
   */
  private initializeSpeechSynthesis(): void {
    if (!('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported in this browser')
      return
    }

    this.synthesis = window.speechSynthesis
  }

  /**
   * Setup speech recognition event handlers
   */
  private setupRecognitionEventHandlers(): void {
    if (!this.recognition) return

    this.recognition.onstart = () => {
      this.isListening = true
      this.lastRecognitionTime = Date.now()
      this.emitEvent('start', { listening: true })
      
      if (this.options.debugMode) {
        console.log('[VoiceCommandHandler] Recognition started')
      }
    }

    this.recognition.onend = () => {
      this.isListening = false
      this.emitEvent('stop', { listening: false })
      
      if (this.options.debugMode) {
        console.log('[VoiceCommandHandler] Recognition ended')
      }

      // Auto-restart if enabled and not manually stopped
      if (this.isEnabled && this.options.recognition?.continuous) {
        setTimeout(() => {
          if (this.isEnabled && !this.isListening) {
            this.startRecognition()
          }
        }, 100)
      }
    }

    this.recognition.onresult = (event) => {
      this.handleRecognitionResult(event)
    }

    this.recognition.onerror = (event) => {
      console.error('[VoiceCommandHandler] Recognition error:', event.error)
      this.emitEvent('error', { 
        error: event.error, 
        message: event.message || 'Speech recognition error' 
      })

      // Handle specific errors
      if (event.error === 'not-allowed') {
        this.speak('Microphone access denied. Please allow microphone permissions.')
      } else if (event.error === 'no-speech') {
        // Ignore no-speech errors in continuous mode
        if (!this.options.recognition?.continuous) {
          this.speak('No speech detected. Please try again.')
        }
      }
    }

    this.recognition.onspeechstart = () => {
      this.emitEvent('speechstart', {})
    }

    this.recognition.onspeechend = () => {
      this.emitEvent('speechend', {})
    }
  }

  /**
   * Handle speech recognition results
   */
  private handleRecognitionResult(event: SpeechRecognitionEvent): void {
    const results: VoiceRecognitionResult[] = []

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i]
      const transcript = result[0].transcript.trim()
      const confidence = result[0].confidence || 0

      const recognitionResult: VoiceRecognitionResult = {
        transcript,
        confidence,
        isFinal: result.isFinal,
        alternatives: Array.from(result).slice(1).map(alt => alt.transcript)
      }

      results.push(recognitionResult)

      if (this.options.debugMode) {
        console.log('[VoiceCommandHandler] Recognition result:', recognitionResult)
      }

      // Emit result event
      this.emitEvent('result', recognitionResult)

      // Process commands only for final results
      if (result.isFinal) {
        if (this.isDictationMode) {
          this.emitEvent('dictation', recognitionResult)
        } else if (this.options.enableCommands) {
          this.processVoiceCommand(transcript, confidence)
        }
      }
    }
  }

  /**
   * Process voice command
   */
  private processVoiceCommand(transcript: string, confidence: number): void {
    const matches = this.findCommandMatches(transcript)
    
    if (matches.length > 0) {
      const bestMatch = matches[0]
      
      if (bestMatch.confidence > 0.7) { // Confidence threshold
        this.executeCommand(bestMatch)
      } else if (this.options.debugMode) {
        console.log('[VoiceCommandHandler] Low confidence command match:', bestMatch)
      }
    } else if (this.options.debugMode) {
      console.log('[VoiceCommandHandler] No command matches for:', transcript)
    }
  }

  /**
   * Find command matches for transcript
   */
  private findCommandMatches(transcript: string): VoiceCommandMatch[] {
    const matches: VoiceCommandMatch[] = []
    const normalizedTranscript = transcript.toLowerCase().trim()

    for (const command of this.commands.values()) {
      if (!command.enabled) continue

      for (const pattern of command.patterns) {
        const normalizedPattern = pattern.toLowerCase()
        
        // Simple pattern matching - can be enhanced with fuzzy matching
        let confidence = 0
        
        if (normalizedTranscript === normalizedPattern) {
          confidence = 1.0
        } else if (normalizedTranscript.includes(normalizedPattern)) {
          confidence = 0.8
        } else if (this.calculateSimilarity(normalizedTranscript, normalizedPattern) > 0.7) {
          confidence = 0.7
        }

        if (confidence > 0) {
          matches.push({
            command,
            confidence,
            parameters: this.extractParameters(normalizedTranscript, normalizedPattern)
          })
        }
      }
    }

    // Sort by confidence
    return matches.sort((a, b) => b.confidence - a.confidence)
  }

  /**
   * Calculate similarity between two strings (simple Levenshtein-based)
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2
    const shorter = str1.length > str2.length ? str2 : str1
    
    if (longer.length === 0) return 1.0
    
    const distance = this.levenshteinDistance(longer, shorter)
    return (longer.length - distance) / longer.length
  }

  /**
   * Calculate Levenshtein distance
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null))

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        )
      }
    }

    return matrix[str2.length][str1.length]
  }

  /**
   * Extract parameters from transcript (basic implementation)
   */
  private extractParameters(transcript: string, pattern: string): Record<string, any> {
    // This is a basic implementation - can be enhanced with regex patterns
    const parameters: Record<string, any> = {}
    
    // Extract numbers
    const numbers = transcript.match(/\d+/g)
    if (numbers) {
      parameters.numbers = numbers.map(n => parseInt(n))
    }

    return parameters
  }

  /**
   * Execute a voice command
   */
  private async executeCommand(match: VoiceCommandMatch): Promise<void> {
    try {
      this.emitEvent('command', match)
      
      if (this.options.enableFeedback) {
        this.speak(`Executing ${match.command.description}`)
      }

      await match.command.action(match.parameters)
      
      if (this.options.debugMode) {
        console.log('[VoiceCommandHandler] Command executed:', match.command.command)
      }
    } catch (error) {
      console.error('[VoiceCommandHandler] Command execution error:', error)
      this.speak('Sorry, there was an error executing that command.')
    }
  }

  /**
   * Setup default voice commands
   */
  private setupDefaultCommands(): void {
    // Navigation commands
    this.registerCommand({
      command: 'navigate_next',
      patterns: ['next', 'continue', 'go forward', 'proceed'],
      action: () => this.triggerNavigationAction('next'),
      description: 'Navigate to next step',
      category: 'navigation',
      enabled: true
    })

    this.registerCommand({
      command: 'navigate_back',
      patterns: ['back', 'previous', 'go back', 'return'],
      action: () => this.triggerNavigationAction('back'),
      description: 'Navigate to previous step',
      category: 'navigation',
      enabled: true
    })

    this.registerCommand({
      command: 'navigate_skip',
      patterns: ['skip', 'skip this', 'skip step'],
      action: () => this.triggerNavigationAction('skip'),
      description: 'Skip current step',
      category: 'navigation',
      enabled: true
    })

    // Input commands
    this.registerCommand({
      command: 'start_dictation',
      patterns: ['start dictation', 'begin input', 'voice input', 'dictate'],
      action: () => this.startDictation(),
      description: 'Start voice dictation',
      category: 'input',
      enabled: true
    })

    this.registerCommand({
      command: 'stop_dictation',
      patterns: ['stop dictation', 'end input', 'finish dictation'],
      action: () => this.stopDictation(),
      description: 'Stop voice dictation',
      category: 'input',
      enabled: true
    })

    // Control commands
    this.registerCommand({
      command: 'start_recording',
      patterns: ['start recording', 'begin recording', 'record audio'],
      action: () => this.triggerAction('start_recording'),
      description: 'Start audio recording',
      category: 'control',
      enabled: true
    })

    this.registerCommand({
      command: 'stop_recording',
      patterns: ['stop recording', 'end recording', 'finish recording'],
      action: () => this.triggerAction('stop_recording'),
      description: 'Stop audio recording',
      category: 'control',
      enabled: true
    })

    // Accessibility commands
    this.registerCommand({
      command: 'repeat_instructions',
      patterns: ['repeat', 'say again', 'repeat instructions'],
      action: () => this.repeatLastInstruction(),
      description: 'Repeat last instruction',
      category: 'accessibility',
      enabled: true
    })

    this.registerCommand({
      command: 'help',
      patterns: ['help', 'what can I say', 'voice commands', 'assistance'],
      action: () => this.provideHelp(),
      description: 'Get voice command help',
      category: 'accessibility',
      enabled: true
    })
  }

  /**
   * Trigger navigation actions
   */
  private triggerNavigationAction(action: string): void {
    const event = new CustomEvent('voice-navigation', {
      detail: { action }
    })
    window.dispatchEvent(event)
  }

  /**
   * Trigger general actions
   */
  private triggerAction(action: string): void {
    const event = new CustomEvent('voice-action', {
      detail: { action }
    })
    window.dispatchEvent(event)
  }

  /**
   * Start dictation mode
   */
  public startDictation(): void {
    this.isDictationMode = true
    this.speak('Dictation mode started. Speak your input.')
    
    if (this.options.debugMode) {
      console.log('[VoiceCommandHandler] Dictation mode started')
    }
  }

  /**
   * Stop dictation mode
   */
  public stopDictation(): void {
    this.isDictationMode = false
    this.speak('Dictation mode stopped.')
    
    if (this.options.debugMode) {
      console.log('[VoiceCommandHandler] Dictation mode stopped')
    }
  }

  /**
   * Repeat last instruction
   */
  private repeatLastInstruction(): void {
    // This would integrate with the application's instruction system
    this.speak('Please refer to the on-screen instructions or ask for specific help.')
  }

  /**
   * Provide voice command help
   */
  private provideHelp(): void {
    const enabledCommands = Array.from(this.commands.values())
      .filter(cmd => cmd.enabled)
      .slice(0, 5) // Limit to first 5 commands

    const helpText = `Available voice commands: ${enabledCommands
      .map(cmd => cmd.patterns[0])
      .join(', ')}. Say "help" for more information.`

    this.speak(helpText)
  }

  /**
   * Register a new voice command
   */
  public registerCommand(command: VoiceCommand): void {
    this.commands.set(command.command, command)
    
    if (this.options.debugMode) {
      console.log('[VoiceCommandHandler] Command registered:', command.command)
    }
  }

  /**
   * Unregister a voice command
   */
  public unregisterCommand(commandId: string): void {
    this.commands.delete(commandId)
    
    if (this.options.debugMode) {
      console.log('[VoiceCommandHandler] Command unregistered:', commandId)
    }
  }

  /**
   * Enable/disable a command
   */
  public toggleCommand(commandId: string, enabled: boolean): void {
    const command = this.commands.get(commandId)
    if (command) {
      command.enabled = enabled
    }
  }

  /**
   * Start voice recognition
   */
  public start(): void {
    if (!this.recognition) {
      console.warn('[VoiceCommandHandler] Speech recognition not available')
      return
    }

    this.isEnabled = true
    this.startRecognition()
  }

  /**
   * Stop voice recognition
   */
  public stop(): void {
    this.isEnabled = false
    
    if (this.recognition && this.isListening) {
      this.recognition.stop()
    }

    if (this.recognitionTimeout) {
      clearTimeout(this.recognitionTimeout)
      this.recognitionTimeout = null
    }
  }

  /**
   * Start recognition session
   */
  private startRecognition(): void {
    if (!this.recognition || this.isListening) return

    try {
      this.recognition.start()
    } catch (error) {
      console.error('[VoiceCommandHandler] Failed to start recognition:', error)
    }
  }

  /**
   * Speak text using speech synthesis
   */
  public speak(text: string, options?: Partial<VoiceSynthesisOptions>): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synthesis || !this.options.enableFeedback) {
        resolve()
        return
      }

      // Queue feedback if already speaking
      if (this.isSpeaking) {
        this.feedbackQueue.push(text)
        resolve()
        return
      }

      const utterance = new SpeechSynthesisUtterance(text)
      const synthOptions = {
        ...this.defaultSynthesisOptions,
        ...this.options.synthesis,
        ...options
      }

      utterance.volume = synthOptions.volume
      utterance.rate = synthOptions.rate
      utterance.pitch = synthOptions.pitch
      utterance.lang = synthOptions.language

      // Set voice if specified
      if (synthOptions.voice) {
        utterance.voice = synthOptions.voice
      }

      utterance.onstart = () => {
        this.isSpeaking = true
      }

      utterance.onend = () => {
        this.isSpeaking = false
        resolve()
        
        // Process queued feedback
        if (this.feedbackQueue.length > 0) {
          const nextText = this.feedbackQueue.shift()!
          this.speak(nextText)
        }
      }

      utterance.onerror = (event) => {
        this.isSpeaking = false
        console.error('[VoiceCommandHandler] Speech synthesis error:', event)
        reject(event)
      }

      this.synthesis.speak(utterance)
    })
  }

  /**
   * Get available voices
   */
  public getAvailableVoices(): SpeechSynthesisVoice[] {
    if (!this.synthesis) return []
    return this.synthesis.getVoices()
  }

  /**
   * Set language for recognition and synthesis
   */
  public setLanguage(language: string): void {
    this.currentLanguage = language
    
    if (this.recognition) {
      this.recognition.lang = language
    }

    this.defaultSynthesisOptions.language = language
  }

  /**
   * Check if voice recognition is supported
   */
  public static isRecognitionSupported(): boolean {
    return typeof window !== 'undefined' && 
           ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)
  }

  /**
   * Check if speech synthesis is supported
   */
  public static isSynthesisSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window
  }

  /**
   * Add event listener
   */
  public addEventListener(type: VoiceEventType, listener: (event: VoiceEvent) => void): void {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, new Set())
    }
    this.eventListeners.get(type)!.add(listener)
  }

  /**
   * Remove event listener
   */
  public removeEventListener(type: VoiceEventType, listener: (event: VoiceEvent) => void): void {
    const listeners = this.eventListeners.get(type)
    if (listeners) {
      listeners.delete(listener)
    }
  }

  /**
   * Emit event to listeners
   */
  private emitEvent(type: VoiceEventType, data?: any): void {
    const listeners = this.eventListeners.get(type)
    if (listeners) {
      const event: VoiceEvent = {
        type,
        data,
        timestamp: Date.now()
      }

      listeners.forEach(listener => {
        try {
          listener(event)
        } catch (error) {
          console.error('[VoiceCommandHandler] Event listener error:', error)
        }
      })
    }
  }

  /**
   * Get current status
   */
  public getStatus(): {
    isEnabled: boolean
    isListening: boolean
    isDictationMode: boolean
    isSpeaking: boolean
    commandCount: number
    language: string
  } {
    return {
      isEnabled: this.isEnabled,
      isListening: this.isListening,
      isDictationMode: this.isDictationMode,
      isSpeaking: this.isSpeaking,
      commandCount: this.commands.size,
      language: this.currentLanguage
    }
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    this.stop()
    
    if (this.synthesis) {
      this.synthesis.cancel()
    }

    this.commands.clear()
    this.eventListeners.clear()
    this.feedbackQueue.length = 0
  }
}

// Global instance for easy access
let globalVoiceCommandHandler: VoiceCommandHandler | null = null

/**
 * Get or create global voice command handler instance
 */
export function getVoiceCommandHandler(options?: Partial<VoiceCommandHandlerOptions>): VoiceCommandHandler {
  if (!globalVoiceCommandHandler) {
    globalVoiceCommandHandler = new VoiceCommandHandler(options)
  }
  return globalVoiceCommandHandler
}

/**
 * Utility function to check browser support
 */
export function checkVoiceSupport(): {
  recognition: boolean
  synthesis: boolean
  fullSupport: boolean
} {
  return {
    recognition: VoiceCommandHandler.isRecognitionSupported(),
    synthesis: VoiceCommandHandler.isSynthesisSupported(),
    fullSupport: VoiceCommandHandler.isRecognitionSupported() && VoiceCommandHandler.isSynthesisSupported()
  }
}