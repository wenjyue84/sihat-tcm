/**
 * Test Suites Configuration
 * Extracted from developer/page.tsx for better organization
 */

import type { TestSuite } from "@/hooks/useDiagnostics";

export const TEST_SUITES: TestSuite[] = [
  {
    id: "accessibility",
    name: "Accessibility Manager",
    description: "WCAG 2.1 AA compliance and accessibility features",
    testCommand: "npm test -- accessibilityManager.test.ts --run",
    category: "Core Features",
  },
  {
    id: "imageQuality",
    name: "Image Quality Validator",
    description: "Real-time image quality assessment",
    testCommand: "npm test -- imageQualityValidator.test.ts --run",
    category: "AI Features",
  },
  {
    id: "medicalSafety",
    name: "Medical Safety Validator",
    description: "Treatment recommendation safety validation",
    testCommand: "npm test -- medicalSafetyValidator.test.ts --run",
    category: "Safety Systems",
  },
  {
    id: "aiModelRouter",
    name: "AI Model Router",
    description: "Intelligent AI model selection and fallback",
    testCommand: "npm test -- aiModelRouter.test.ts --run",
    category: "AI Features",
  },
  {
    id: "platformOptimizer",
    name: "Platform Optimizer",
    description: "Cross-platform performance optimization",
    testCommand: "npm test -- platformOptimizer.test.ts --run",
    category: "Performance",
  },
  {
    id: "voiceCommandHandler",
    name: "Voice Command Handler",
    description: "Voice recognition and command processing",
    testCommand: "npm test -- voiceCommandHandler.test.ts --run",
    category: "Accessibility",
  },
  {
    id: "propertyTestFramework",
    name: "Property Test Framework",
    description: "Property-based testing framework validation",
    testCommand: "npm test -- propertyTestFramework.test.ts --run",
    category: "Testing Infrastructure",
  },
  {
    id: "correctnessProperties",
    name: "Correctness Properties",
    description: "System correctness properties validation",
    testCommand: "npm test -- correctnessProperties.test.ts --run",
    category: "Correctness Validation",
  },
  {
    id: "propertyTests",
    name: "All Property-Based Tests",
    description: "Complete property-based testing suite",
    testCommand: "npm run test:pbt",
    category: "Property-Based Testing",
  },
  {
    id: "unitTests",
    name: "Unit Test Suite",
    description: "All unit tests for core functionality",
    testCommand: "npm test -- --run",
    category: "Unit Testing",
  },
  {
    id: "integrationTests",
    name: "Integration Tests",
    description: "End-to-end integration testing",
    testCommand: "npm test -- --run --testPathPattern=integration",
    category: "Integration Testing",
  },
  {
    id: "performanceTests",
    name: "Performance Tests",
    description: "Performance benchmarking and optimization tests",
    testCommand: "npm test -- --run --testPathPattern=performance",
    category: "Performance Testing",
  },
];



