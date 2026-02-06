/**
 * useDiagnosisSteps Hook
 *
 * Provides step definitions and configuration for the diagnosis wizard.
 * Includes time estimates, guidance, and step relationships.
 */

import { useMemo } from "react";
import type { StepDefinition } from "@/features/diagnosis/components/EnhancedProgressStepper";

export interface DiagnosisStepsConfig {
  includeOptionalSteps?: boolean;
  language?: "en" | "zh" | "ms";
  userLevel?: "beginner" | "intermediate" | "advanced";
}

export function useDiagnosisSteps(config: DiagnosisStepsConfig = {}) {
  const { includeOptionalSteps = true, language = "en", userLevel = "beginner" } = config;

  const stepDefinitions = useMemo((): StepDefinition[] => {
    const baseSteps: StepDefinition[] = [
      {
        id: "basic_info",
        label: "Basic Information",
        description: "Enter your personal and health information",
        estimatedDuration: 3,
        guidance: {
          title: "Getting Started",
          content:
            "Please provide accurate information about yourself to help us give you the best diagnosis.",
          tips: [
            "Be honest about your age, weight, and height",
            "Include all current symptoms, even minor ones",
            "Mention any ongoing medications or treatments",
            "Don't worry if you're unsure about something - you can always update it later",
          ],
        },
      },
      {
        id: "wen_inquiry",
        label: "Health Inquiry",
        description: "Answer detailed questions about your health and symptoms",
        estimatedDuration: 8,
        prerequisites: ["basic_info"],
        guidance: {
          title: "Health Questions",
          content:
            "This step involves answering questions about your symptoms, lifestyle, and health history.",
          tips: [
            "Take your time to think about each question",
            "Describe symptoms in detail (when they started, how they feel, what makes them better/worse)",
            "Include information about your sleep, diet, and stress levels",
            "Mention any family history of similar conditions",
          ],
        },
      },
      {
        id: "wang_tongue",
        label: "Tongue Analysis",
        description: "Take a clear photo of your tongue for TCM analysis",
        estimatedDuration: 3,
        prerequisites: ["basic_info"],
        isOptional: !includeOptionalSteps ? false : true,
        guidance: {
          title: "Tongue Photography",
          content: "Your tongue provides valuable information about your internal health in TCM.",
          tips: [
            "Use natural lighting or a bright white light",
            "Stick your tongue out fully and keep it relaxed",
            "Don't brush your tongue or eat/drink anything colored for 30 minutes before",
            "Take the photo straight on, not from an angle",
            "Make sure the entire tongue is visible and in focus",
          ],
        },
      },
      {
        id: "wang_face",
        label: "Facial Analysis",
        description: "Capture your facial complexion and features",
        estimatedDuration: 2,
        prerequisites: ["basic_info"],
        isOptional: true,
        guidance: {
          title: "Facial Analysis",
          content: "Your facial complexion and features can reveal important health information.",
          tips: [
            "Remove makeup and wash your face if possible",
            "Use natural lighting",
            "Look directly at the camera with a neutral expression",
            "Ensure your entire face is visible and well-lit",
          ],
        },
      },
      {
        id: "wang_part",
        label: "Body Part Analysis",
        description: "Photograph specific body areas if relevant to your symptoms",
        estimatedDuration: 3,
        prerequisites: ["basic_info"],
        isOptional: true,
        guidance: {
          title: "Body Part Photography",
          content: "Sometimes specific body areas need to be examined for accurate diagnosis.",
          tips: [
            "Only photograph areas relevant to your symptoms",
            "Ensure good lighting and clear focus",
            "Maintain appropriate privacy and comfort",
            "You can skip this step if not applicable",
          ],
        },
      },
      {
        id: "wen_audio",
        label: "Voice Analysis",
        description: "Record your voice for breath and speech pattern analysis",
        estimatedDuration: 2,
        prerequisites: ["basic_info"],
        isOptional: true,
        guidance: {
          title: "Voice Recording",
          content: "Your voice and breathing patterns can provide insights into your health.",
          tips: [
            "Find a quiet environment",
            "Speak clearly and at your normal pace",
            "Take a few deep breaths as instructed",
            "Don't worry about perfect pronunciation",
          ],
        },
      },
      {
        id: "qie",
        label: "Pulse Information",
        description: "Provide information about your pulse and heart rate",
        estimatedDuration: 2,
        prerequisites: ["basic_info"],
        guidance: {
          title: "Pulse Assessment",
          content:
            "Pulse information helps us understand your cardiovascular health and energy levels.",
          tips: [
            "Rest for a few minutes before taking your pulse",
            "Use your index and middle finger, not your thumb",
            "Count for a full minute for accuracy",
            "Note if your pulse feels strong, weak, fast, or irregular",
          ],
        },
      },
      {
        id: "smart_connect",
        label: "Device Connection",
        description: "Connect health devices and wearables for additional data",
        estimatedDuration: 5,
        prerequisites: ["basic_info"],
        isOptional: true,
        guidance: {
          title: "Health Device Integration",
          content: "Connect your health devices to provide more comprehensive health data.",
          tips: [
            "Ensure your devices are charged and nearby",
            "Enable Bluetooth on your phone",
            "Follow the pairing instructions for each device",
            "This step is optional but provides more accurate insights",
          ],
        },
      },
      {
        id: "analysis",
        label: "Analysis",
        description: "AI is analyzing your information to generate diagnosis",
        estimatedDuration: 2,
        prerequisites: ["basic_info", "wen_inquiry"],
        guidance: {
          title: "Analysis in Progress",
          content: "Our AI is processing your information using traditional TCM principles.",
          tips: [
            "This process usually takes 1-2 minutes",
            "The AI considers all the information you've provided",
            "Results are based on traditional TCM diagnostic methods",
            "You'll be able to ask questions about your results",
          ],
        },
      },
      {
        id: "results",
        label: "Results",
        description: "View your personalized TCM diagnosis and recommendations",
        estimatedDuration: 10,
        prerequisites: ["analysis"],
        guidance: {
          title: "Your TCM Diagnosis",
          content: "Review your personalized diagnosis and health recommendations.",
          tips: [
            "Take time to read through all sections",
            "Ask questions if anything is unclear",
            "Save or print your report for future reference",
            "Consider consulting with a TCM practitioner for complex cases",
          ],
        },
      },
    ];

    // Filter out optional steps if not included
    let filteredSteps = includeOptionalSteps
      ? baseSteps
      : baseSteps.filter((step) => !step.isOptional);

    // Adjust guidance based on user level
    if (userLevel === "advanced") {
      filteredSteps = filteredSteps.map((step) => ({
        ...step,
        guidance: step.guidance
          ? {
              ...step.guidance,
              tips: step.guidance.tips?.slice(0, 2), // Fewer tips for advanced users
            }
          : undefined,
      }));
    }

    return filteredSteps;
  }, [includeOptionalSteps, language, userLevel]);

  const getStepById = (stepId: string) => {
    return stepDefinitions.find((step) => step.id === stepId);
  };

  const getNextStep = (currentStepId: string) => {
    const currentIndex = stepDefinitions.findIndex((step) => step.id === currentStepId);
    return currentIndex >= 0 && currentIndex < stepDefinitions.length - 1
      ? stepDefinitions[currentIndex + 1]
      : null;
  };

  const getPreviousStep = (currentStepId: string) => {
    const currentIndex = stepDefinitions.findIndex((step) => step.id === currentStepId);
    return currentIndex > 0 ? stepDefinitions[currentIndex - 1] : null;
  };

  const getStepProgress = (currentStepId: string) => {
    const currentIndex = stepDefinitions.findIndex((step) => step.id === currentStepId);
    if (currentIndex === -1) return 0;

    return ((currentIndex + 1) / stepDefinitions.length) * 100;
  };

  const getTotalEstimatedTime = () => {
    return stepDefinitions.reduce((total, step) => total + step.estimatedDuration, 0);
  };

  const getRemainingTime = (currentStepId: string) => {
    const currentIndex = stepDefinitions.findIndex((step) => step.id === currentStepId);
    if (currentIndex === -1) return 0;

    return stepDefinitions
      .slice(currentIndex)
      .reduce((total, step) => total + step.estimatedDuration, 0);
  };

  const validateStepPrerequisites = (stepId: string, completedSteps: string[]) => {
    const step = getStepById(stepId);
    if (!step?.prerequisites) return true;

    return step.prerequisites.every((prereq: string) => completedSteps.includes(prereq));
  };

  const getAvailableSteps = (completedSteps: string[]) => {
    return stepDefinitions.filter((step) => validateStepPrerequisites(step.id, completedSteps));
  };

  return {
    steps: stepDefinitions,
    getStepById,
    getNextStep,
    getPreviousStep,
    getStepProgress,
    getTotalEstimatedTime,
    getRemainingTime,
    validateStepPrerequisites,
    getAvailableSteps,

    // Computed values
    totalSteps: stepDefinitions.length,
    requiredSteps: stepDefinitions.filter((step) => !step.isOptional).length,
    optionalSteps: stepDefinitions.filter((step) => step.isOptional).length,
    totalEstimatedTime: getTotalEstimatedTime(),
  };
}

export default useDiagnosisSteps;
