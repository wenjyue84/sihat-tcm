/**
 * Voice Command System Example
 * 
 * Demonstrates how to use the refactored modular voice command system
 * in the Sihat TCM application.
 */

import {
  VoiceCommandHandler,
  getVoiceCommandHandler,
  checkVoiceSupport,
  type VoiceCommand,
  type VoiceCommandHandlerOptions,
  type VoiceEvent
} from '../lib/voice';

/**
 * Example: Basic Voice Command Setup
 */
export function basicVoiceSetup() {
  // Check browser support first
  const support = checkVoiceSupport();
  
  if (!support.fullSupport) {
    console.warn('Voice features not fully supported in this browser');
    return null;
  }

  // Create voice handler with options
  const options: Partial<VoiceCommandHandlerOptions> = {
    recognition: {
      language: 'en-US',
      continuous: true,
      interimResults: true
    },
    synthesis: {
      volume: 0.8,
      rate: 1.0,
      pitch: 1.0,
      language: 'en-US'
    },
    enableFeedback: true,
    enableCommands: true,
    enableDictation: true,
    debugMode: true
  };

  const voiceHandler = new VoiceCommandHandler(options);

  // Setup event listeners
  voiceHandler.addEventListener('start', (event: VoiceEvent) => {
    console.log('Voice recognition started');
  });

  voiceHandler.addEventListener('result', (event: VoiceEvent) => {
    console.log('Recognition result:', event.data);
  });

  voiceHandler.addEventListener('command', (event: VoiceEvent) => {
    console.log('Command executed:', event.data);
  });

  voiceHandler.addEventListener('dictation', (event: VoiceEvent) => {
    console.log('Dictation update:', event.data);
  });

  voiceHandler.addEventListener('error', (event: VoiceEvent) => {
    console.error('Voice error:', event.data);
  });

  return voiceHandler;
}

/**
 * Example: Custom TCM-Specific Commands
 */
export function setupTCMCommands(voiceHandler: VoiceCommandHandler) {
  // TCM Diagnosis Commands
  const startDiagnosisCommand: VoiceCommand = {
    command: 'start_tcm_diagnosis',
    patterns: [
      'start diagnosis',
      'begin TCM diagnosis',
      'start health assessment',
      'check my health'
    ],
    action: async () => {
      // Navigate to diagnosis page
      window.location.href = '/diagnosis';
      await voiceHandler.speak('Starting TCM diagnosis. Please follow the instructions on screen.');
    },
    description: 'Start TCM diagnosis process',
    category: 'navigation',
    enabled: true
  };

  const tongueAnalysisCommand: VoiceCommand = {
    command: 'tongue_analysis',
    patterns: [
      'analyze my tongue',
      'tongue diagnosis',
      'check tongue',
      'tongue examination'
    ],
    action: async () => {
      // Navigate to tongue analysis
      const event = new CustomEvent('voice-action', {
        detail: { action: 'start_tongue_analysis' }
      });
      window.dispatchEvent(event);
      await voiceHandler.speak('Please position your tongue in front of the camera for analysis.');
    },
    description: 'Start tongue analysis',
    category: 'control',
    enabled: true
  };

  const voiceAnalysisCommand: VoiceCommand = {
    command: 'voice_analysis',
    patterns: [
      'analyze my voice',
      'voice diagnosis',
      'check my voice',
      'voice examination'
    ],
    action: async () => {
      const event = new CustomEvent('voice-action', {
        detail: { action: 'start_voice_analysis' }
      });
      window.dispatchEvent(event);
      await voiceHandler.speak('Please speak clearly for voice analysis. Say "ah" for 3 seconds.');
    },
    description: 'Start voice analysis',
    category: 'control',
    enabled: true
  };

  const symptomInputCommand: VoiceCommand = {
    command: 'describe_symptoms',
    patterns: [
      'describe symptoms',
      'tell symptoms',
      'input symptoms',
      'voice symptoms'
    ],
    action: async () => {
      voiceHandler.startDictation();
      await voiceHandler.speak('Please describe your symptoms. I will record what you say.');
    },
    description: 'Start symptom description via voice',
    category: 'input',
    enabled: true
  };

  const mealPlannerCommand: VoiceCommand = {
    command: 'meal_planner',
    patterns: [
      'meal planner',
      'food recommendations',
      'dietary advice',
      'nutrition plan'
    ],
    action: async () => {
      window.location.href = '/meal-planner';
      await voiceHandler.speak('Opening meal planner. I will help you create a personalized nutrition plan.');
    },
    description: 'Open TCM meal planner',
    category: 'navigation',
    enabled: true
  };

  // Register all commands
  voiceHandler.registerCommand(startDiagnosisCommand);
  voiceHandler.registerCommand(tongueAnalysisCommand);
  voiceHandler.registerCommand(voiceAnalysisCommand);
  voiceHandler.registerCommand(symptomInputCommand);
  voiceHandler.registerCommand(mealPlannerCommand);

  console.log('TCM-specific voice commands registered');
}

/**
 * Example: Multi-language Support
 */
export function setupMultiLanguageSupport(voiceHandler: VoiceCommandHandler) {
  const languages = {
    'en-US': 'English',
    'zh-CN': 'Chinese (Simplified)',
    'ms-MY': 'Malay'
  };

  // Language switching commands
  Object.entries(languages).forEach(([code, name]) => {
    const command: VoiceCommand = {
      command: `switch_to_${code.replace('-', '_')}`,
      patterns: [
        `switch to ${name}`,
        `change language to ${name}`,
        `use ${name}`,
        name.toLowerCase()
      ],
      action: async () => {
        voiceHandler.setLanguage(code);
        await voiceHandler.speak(`Language changed to ${name}`, { language: code });
        
        // Update app language
        const event = new CustomEvent('language-change', {
          detail: { language: code }
        });
        window.dispatchEvent(event);
      },
      description: `Switch to ${name}`,
      category: 'control',
      enabled: true
    };

    voiceHandler.registerCommand(command);
  });

  console.log('Multi-language voice commands registered');
}

/**
 * Example: Accessibility Features
 */
export function setupAccessibilityFeatures(voiceHandler: VoiceCommandHandler) {
  const readPageCommand: VoiceCommand = {
    command: 'read_page',
    patterns: [
      'read page',
      'read content',
      'what is on screen',
      'describe page'
    ],
    action: async () => {
      // Get page content for reading
      const headings = Array.from(document.querySelectorAll('h1, h2, h3'))
        .map(h => h.textContent)
        .filter(text => text)
        .slice(0, 3);

      const content = headings.length > 0 
        ? `Page contains: ${headings.join(', ')}`
        : 'Unable to read page content';

      await voiceHandler.speak(content);
    },
    description: 'Read page content aloud',
    category: 'accessibility',
    enabled: true
  };

  const navigationHelpCommand: VoiceCommand = {
    command: 'navigation_help',
    patterns: [
      'how to navigate',
      'navigation help',
      'how to use',
      'voice help'
    ],
    action: async () => {
      const helpText = `
        You can use voice commands to navigate. 
        Say "start diagnosis" to begin health assessment,
        "meal planner" for nutrition advice,
        "describe symptoms" to input symptoms by voice,
        or "help" for more commands.
      `;
      await voiceHandler.speak(helpText);
    },
    description: 'Provide navigation help',
    category: 'accessibility',
    enabled: true
  };

  const slowDownCommand: VoiceCommand = {
    command: 'slow_down',
    patterns: [
      'slow down',
      'speak slower',
      'too fast'
    ],
    action: async () => {
      // Reduce speech rate
      voiceHandler.updateOptions({
        synthesis: { rate: 0.7 }
      });
      await voiceHandler.speak('I will speak more slowly now.');
    },
    description: 'Reduce speech rate',
    category: 'accessibility',
    enabled: true
  };

  const speedUpCommand: VoiceCommand = {
    command: 'speed_up',
    patterns: [
      'speed up',
      'speak faster',
      'too slow'
    ],
    action: async () => {
      // Increase speech rate
      voiceHandler.updateOptions({
        synthesis: { rate: 1.3 }
      });
      await voiceHandler.speak('I will speak faster now.');
    },
    description: 'Increase speech rate',
    category: 'accessibility',
    enabled: true
  };

  // Register accessibility commands
  voiceHandler.registerCommand(readPageCommand);
  voiceHandler.registerCommand(navigationHelpCommand);
  voiceHandler.registerCommand(slowDownCommand);
  voiceHandler.registerCommand(speedUpCommand);

  console.log('Accessibility voice commands registered');
}

/**
 * Example: Dictation for Symptom Input
 */
export function setupSymptomDictation(voiceHandler: VoiceCommandHandler) {
  let currentSymptomText = '';

  // Listen for dictation events
  voiceHandler.addEventListener('dictation', (event: VoiceEvent) => {
    const { action, result, text } = event.data;

    switch (action) {
      case 'start':
        currentSymptomText = '';
        console.log('Symptom dictation started');
        break;

      case 'update':
        if (result?.isFinal) {
          currentSymptomText = result.text;
          console.log('Symptom text updated:', currentSymptomText);
          
          // Update symptom input field
          const symptomInput = document.querySelector('#symptom-input') as HTMLTextAreaElement;
          if (symptomInput) {
            symptomInput.value = currentSymptomText;
            symptomInput.dispatchEvent(new Event('input', { bubbles: true }));
          }
        }
        break;

      case 'stop':
        console.log('Symptom dictation completed:', currentSymptomText);
        voiceHandler.speak('Symptom description recorded. You can continue or make changes.');
        break;
    }
  });

  console.log('Symptom dictation handler setup complete');
}

/**
 * Example: Complete Setup Function
 */
export function setupCompleteVoiceSystem(): VoiceCommandHandler | null {
  // Check support
  const support = checkVoiceSupport();
  if (!support.fullSupport) {
    console.warn('Voice features not fully supported');
    return null;
  }

  // Initialize voice handler
  const voiceHandler = basicVoiceSetup();
  if (!voiceHandler) return null;

  // Setup all features
  setupTCMCommands(voiceHandler);
  setupMultiLanguageSupport(voiceHandler);
  setupAccessibilityFeatures(voiceHandler);
  setupSymptomDictation(voiceHandler);

  // Start voice recognition
  voiceHandler.start();

  // Provide initial feedback
  voiceHandler.speak('Voice command system ready. Say "help" for available commands.');

  console.log('Complete voice system setup finished');
  return voiceHandler;
}

/**
 * Example: Using Global Instance (Backward Compatibility)
 */
export function useGlobalVoiceHandler() {
  // Get global instance (maintains backward compatibility)
  const globalHandler = getVoiceCommandHandler({
    enableFeedback: true,
    debugMode: false
  });

  // Use the same setup functions
  setupTCMCommands(globalHandler);
  
  return globalHandler;
}

/**
 * Example: Error Handling and Recovery
 */
export function setupErrorHandling(voiceHandler: VoiceCommandHandler) {
  voiceHandler.addEventListener('error', async (event: VoiceEvent) => {
    const { error, message, userMessage } = event.data;

    console.error('Voice system error:', { error, message });

    // Handle specific error types
    switch (error) {
      case 'not-allowed':
        await voiceHandler.speak('Microphone access is required for voice commands. Please allow microphone permissions and try again.');
        break;

      case 'network':
        await voiceHandler.speak('Network error occurred. Please check your internet connection.');
        break;

      case 'no-speech':
        // Don't announce no-speech errors as they're common
        break;

      default:
        if (userMessage) {
          await voiceHandler.speak(userMessage);
        } else {
          await voiceHandler.speak('Voice system error occurred. Please try again.');
        }
    }
  });

  console.log('Voice error handling setup complete');
}

// Export for use in React components or other modules
export {
  VoiceCommandHandler,
  getVoiceCommandHandler,
  checkVoiceSupport
};