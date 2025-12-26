/**
 * VoiceCommandHandler Tests
 * 
 * Tests for the voice command and speech recognition functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest'
import { VoiceCommandHandler, VoiceCommand, checkVoiceSupport } from './voiceCommandHandler'

// Mock the Web Speech API
const mockSpeechRecognition = {
  continuous: false,
  interimResults: false,
  maxAlternatives: 1,
  lang: 'en-US',
  start: vi.fn(),
  stop: vi.fn(),
  abort: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  onstart: null,
  onend: null,
  onresult: null,
  onerror: null,
  onspeechstart: null,
  onspeechend: null
}

const mockSpeechSynthesis = {
  speak: vi.fn(),
  cancel: vi.fn(),
  pause: vi.fn(),
  resume: vi.fn(),
  getVoices: vi.fn(() => []),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn()
}

const mockSpeechSynthesisUtterance = function(text: string) {
  return {
    text,
    lang: 'en-US',
    voice: null,
    volume: 1,
    rate: 1,
    pitch: 1,
    onstart: null,
    onend: null,
    onerror: null,
    onpause: null,
    onresume: null,
    onmark: null,
    onboundary: null
  }
}

// Setup global mocks
Object.defineProperty(global, 'window', {
  value: {
    SpeechRecognition: function() { return mockSpeechRecognition },
    webkitSpeechRecognition: function() { return mockSpeechRecognition },
    speechSynthesis: mockSpeechSynthesis,
    SpeechSynthesisUtterance: mockSpeechSynthesisUtterance,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  },
  writable: true
})

// Also set global SpeechSynthesisUtterance
Object.defineProperty(global, 'SpeechSynthesisUtterance', {
  value: mockSpeechSynthesisUtterance,
  writable: true
})

describe('VoiceCommandHandler', () => {
  let voiceHandler: VoiceCommandHandler
  let mockCommand: VoiceCommand

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks()
    
    // Create a mock command
    mockCommand = {
      command: 'test_command',
      patterns: ['test', 'testing'],
      action: vi.fn(),
      description: 'Test command',
      category: 'control',
      enabled: true
    }

    // Create voice handler instance
    voiceHandler = new VoiceCommandHandler({
      enableFeedback: false, // Disable feedback for testing
      enableCommands: true,
      enableDictation: true,
      autoStart: false,
      debugMode: true
    })
  })

  afterEach(() => {
    if (voiceHandler) {
      voiceHandler.destroy()
    }
  })

  describe('Initialization', () => {
    it('should initialize with default options', () => {
      const handler = new VoiceCommandHandler()
      const status = handler.getStatus()
      
      expect(status.isEnabled).toBe(false)
      expect(status.isListening).toBe(false)
      expect(status.isDictationMode).toBe(false)
      expect(status.language).toBe('en-US')
      
      handler.destroy()
    })

    it('should initialize with custom options', () => {
      const handler = new VoiceCommandHandler({
        autoStart: true,
        debugMode: true
      })
      
      const status = handler.getStatus()
      expect(status.commandCount).toBeGreaterThan(0) // Should have default commands
      
      handler.destroy()
    })
  })

  describe('Command Management', () => {
    it('should register a command', () => {
      const initialCount = voiceHandler.getStatus().commandCount
      
      voiceHandler.registerCommand(mockCommand)
      
      const newCount = voiceHandler.getStatus().commandCount
      expect(newCount).toBe(initialCount + 1)
    })

    it('should unregister a command', () => {
      voiceHandler.registerCommand(mockCommand)
      const countWithCommand = voiceHandler.getStatus().commandCount
      
      voiceHandler.unregisterCommand(mockCommand.command)
      
      const countWithoutCommand = voiceHandler.getStatus().commandCount
      expect(countWithoutCommand).toBe(countWithCommand - 1)
    })

    it('should toggle command enabled state', () => {
      voiceHandler.registerCommand(mockCommand)
      
      // Command should be enabled by default
      expect(mockCommand.enabled).toBe(true)
      
      voiceHandler.toggleCommand(mockCommand.command, false)
      expect(mockCommand.enabled).toBe(false)
      
      voiceHandler.toggleCommand(mockCommand.command, true)
      expect(mockCommand.enabled).toBe(true)
    })
  })

  describe('Speech Recognition', () => {
    it('should start recognition when enabled', () => {
      voiceHandler.start()
      
      expect(mockSpeechRecognition.start).toHaveBeenCalled()
      expect(voiceHandler.getStatus().isEnabled).toBe(true)
    })

    it('should stop recognition when disabled', () => {
      voiceHandler.start()
      voiceHandler.stop()
      
      expect(voiceHandler.getStatus().isEnabled).toBe(false)
    })

    it('should handle recognition results', () => {
      voiceHandler.registerCommand(mockCommand)
      voiceHandler.start()

      // Simulate recognition result
      const mockResult = {
        results: [{
          0: { transcript: 'test', confidence: 0.9 },
          isFinal: true,
          length: 1
        }],
        resultIndex: 0
      }

      // Trigger the result handler
      if (mockSpeechRecognition.onresult) {
        mockSpeechRecognition.onresult(mockResult as any)
      }

      expect(mockCommand.action).toHaveBeenCalled()
    })
  })

  describe('Speech Synthesis', () => {
    it('should speak text when feedback is enabled', async () => {
      const handler = new VoiceCommandHandler({
        enableFeedback: true
      })

      // Mock the utterance to trigger onend callback
      const mockUtterance = {
        text: 'Hello world',
        lang: 'en-US',
        voice: null,
        volume: 0.8,
        rate: 1.0,
        pitch: 1.0,
        onstart: null,
        onend: null,
        onerror: null,
        onpause: null,
        onresume: null,
        onmark: null,
        onboundary: null
      }

      // Override the mock to return our controlled utterance
      const originalMock = mockSpeechSynthesisUtterance
      Object.defineProperty(global, 'SpeechSynthesisUtterance', {
        value: function(text: string) {
          const utterance = { ...mockUtterance, text }
          // Simulate async completion
          setTimeout(() => {
            if (utterance.onend) {
              utterance.onend({} as any)
            }
          }, 10)
          return utterance
        },
        writable: true
      })

      await handler.speak('Hello world')

      expect(mockSpeechSynthesis.speak).toHaveBeenCalled()
      
      // Restore original mock
      Object.defineProperty(global, 'SpeechSynthesisUtterance', {
        value: originalMock,
        writable: true
      })
      
      handler.destroy()
    })

    it('should not speak when feedback is disabled', async () => {
      await voiceHandler.speak('Hello world')

      expect(mockSpeechSynthesis.speak).not.toHaveBeenCalled()
    })

    it('should queue multiple speech requests', async () => {
      const handler = new VoiceCommandHandler({
        enableFeedback: true
      })

      // Simulate speaking state
      handler['isSpeaking'] = true

      await handler.speak('First message')
      await handler.speak('Second message')

      // Should queue the second message
      expect(handler['feedbackQueue']).toContain('Second message')
      
      handler.destroy()
    })
  })

  describe('Dictation Mode', () => {
    it('should start dictation mode', () => {
      voiceHandler.startDictation()
      
      expect(voiceHandler.getStatus().isDictationMode).toBe(true)
    })

    it('should stop dictation mode', () => {
      voiceHandler.startDictation()
      voiceHandler.stopDictation()
      
      expect(voiceHandler.getStatus().isDictationMode).toBe(false)
    })
  })

  describe('Language Support', () => {
    it('should set language for recognition and synthesis', () => {
      voiceHandler.setLanguage('zh-CN')
      
      expect(mockSpeechRecognition.lang).toBe('zh-CN')
    })
  })

  describe('Event Handling', () => {
    it('should emit events to listeners', () => {
      const mockListener = vi.fn()
      
      voiceHandler.addEventListener('start', mockListener)
      voiceHandler.start()

      // Simulate recognition start
      if (mockSpeechRecognition.onstart) {
        mockSpeechRecognition.onstart({} as any)
      }

      expect(mockListener).toHaveBeenCalled()
    })

    it('should remove event listeners', () => {
      const mockListener = vi.fn()
      
      voiceHandler.addEventListener('start', mockListener)
      voiceHandler.removeEventListener('start', mockListener)
      voiceHandler.start()

      // Simulate recognition start
      if (mockSpeechRecognition.onstart) {
        mockSpeechRecognition.onstart({} as any)
      }

      expect(mockListener).not.toHaveBeenCalled()
    })
  })

  describe('Command Pattern Matching', () => {
    it('should match exact command patterns', () => {
      voiceHandler.registerCommand(mockCommand)
      
      // Test the private method through public interface
      const matches = voiceHandler['findCommandMatches']('test')
      
      expect(matches).toHaveLength(1)
      expect(matches[0].command.command).toBe('test_command')
      expect(matches[0].confidence).toBe(1.0)
    })

    it('should match partial command patterns', () => {
      voiceHandler.registerCommand(mockCommand)
      
      const matches = voiceHandler['findCommandMatches']('this is a test command')
      
      expect(matches).toHaveLength(1)
      expect(matches[0].confidence).toBe(0.8)
    })

    it('should not match disabled commands', () => {
      mockCommand.enabled = false
      voiceHandler.registerCommand(mockCommand)
      
      const matches = voiceHandler['findCommandMatches']('test')
      
      expect(matches).toHaveLength(0)
    })
  })

  describe('Error Handling', () => {
    it('should handle recognition errors gracefully', () => {
      const mockListener = vi.fn()
      voiceHandler.addEventListener('error', mockListener)
      
      voiceHandler.start()

      // Simulate recognition error
      if (mockSpeechRecognition.onerror) {
        mockSpeechRecognition.onerror({
          error: 'not-allowed',
          message: 'Permission denied'
        } as any)
      }

      expect(mockListener).toHaveBeenCalled()
    })

    it('should handle command execution errors', async () => {
      const errorCommand: VoiceCommand = {
        command: 'error_command',
        patterns: ['error'],
        action: () => { throw new Error('Test error') },
        description: 'Error command',
        category: 'control',
        enabled: true
      }

      voiceHandler.registerCommand(errorCommand)
      
      // Should not throw when command execution fails
      expect(() => {
        voiceHandler['executeCommand']({
          command: errorCommand,
          confidence: 1.0
        })
      }).not.toThrow()
    })
  })

  describe('Browser Support Detection', () => {
    it('should detect speech recognition support', () => {
      expect(VoiceCommandHandler.isRecognitionSupported()).toBe(true)
    })

    it('should detect speech synthesis support', () => {
      expect(VoiceCommandHandler.isSynthesisSupported()).toBe(true)
    })

    it('should check full voice support', () => {
      const support = checkVoiceSupport()
      
      expect(support.recognition).toBe(true)
      expect(support.synthesis).toBe(true)
      expect(support.fullSupport).toBe(true)
    })
  })

  describe('Cleanup', () => {
    it('should cleanup resources on destroy', () => {
      voiceHandler.start()
      voiceHandler.destroy()
      
      const status = voiceHandler.getStatus()
      expect(status.isEnabled).toBe(false)
      expect(status.commandCount).toBe(0)
    })
  })
})

describe('Utility Functions', () => {
  describe('checkVoiceSupport', () => {
    it('should return correct support status', () => {
      const support = checkVoiceSupport()
      
      expect(support).toHaveProperty('recognition')
      expect(support).toHaveProperty('synthesis')
      expect(support).toHaveProperty('fullSupport')
      expect(typeof support.recognition).toBe('boolean')
      expect(typeof support.synthesis).toBe('boolean')
      expect(typeof support.fullSupport).toBe('boolean')
    })
  })
})