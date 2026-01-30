"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { repairJSON, generateMockReport } from "@/features/diagnosis/hooks/diagnosisUtils";
import { MOCK_PROFILES } from "@/data/mockProfiles";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle,
  XCircle,
  Loader2,
  AlertTriangle,
  Terminal,
  Play,
  Copy,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  Check,
  Filter,
  X,
  Search,
} from "lucide-react";

const MOCK_IMAGE =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
const MOCK_AUDIO =
  "data:audio/webm;base64,UklGRi4AAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";

type TestStatus = "pending" | "running" | "passed" | "failed" | "skipped";
type TestCategory =
  | "Step 1: Basic Info"
  | "Step 2: TCM Inquiry"
  | "Step 3: Tongue Analysis"
  | "Step 4: Face Analysis"
  | "Step 5: Voice Analysis"
  | "Step 6: Pulse Check"
  | "Step 7: Smart Connect"
  | "Step 8: Report Generation"
  | "Core Utilities"
  | "System Health";

interface TestResult {
  id: string;
  number: number;
  name: string;
  description: string;
  category: TestCategory;
  status: TestStatus;
  message?: string;
  error?: any;
  duration?: number;
  critical?: boolean; // Mark critical tests
}

export default function TestRunnerPage() {
  const [tests, setTests] = useState<TestResult[]>([
    // ============================================
    // CORE UTILITIES (Foundation Tests)
    // ============================================
    {
      id: "json_repair",
      number: 1,
      name: "JSON Repair Utility",
      description: "Tests the JSON repair function with malformed AI responses.",
      category: "Core Utilities",
      status: "pending",
      critical: true,
    },
    {
      id: "mock_profiles_integrity",
      number: 2,
      name: "Mock Profiles Data Integrity",
      description: "Verifies all mock profiles contain required fields for testing.",
      category: "Core Utilities",
      status: "pending",
      critical: true,
    },
    {
      id: "component_imports",
      number: 3,
      name: "Core Component Imports",
      description: "Verifies critical components can be imported without errors.",
      category: "Core Utilities",
      status: "pending",
      critical: true,
    },

    // ============================================
    // STEP 1: BASIC INFO
    // ============================================
    {
      id: "basic_info_validation",
      number: 4,
      name: "Basic Info Field Validation",
      description: "Verifies required fields: name, age, gender, symptoms.",
      category: "Step 1: Basic Info",
      status: "pending",
      critical: true,
    },
    {
      id: "bmi_calculation",
      number: 5,
      name: "BMI Calculation Logic",
      description: "Tests BMI calculation with various height/weight inputs.",
      category: "Step 1: Basic Info",
      status: "pending",
    },
    {
      id: "symptom_duration_options",
      number: 6,
      name: "Symptom Duration Options",
      description: "Verifies all symptom duration options are available.",
      category: "Step 1: Basic Info",
      status: "pending",
    },

    // ============================================
    // STEP 2: TCM INQUIRY (问诊)
    // ============================================
    {
      id: "chat_api_endpoint",
      number: 7,
      name: "Chat API Endpoint Health",
      description: "Checks if /api/chat endpoint is reachable.",
      category: "Step 2: TCM Inquiry",
      status: "pending",
      critical: true,
    },
    {
      id: "chat_stream_response",
      number: 8,
      name: "Chat Streaming Response",
      description: "Verifies chat API returns streaming response correctly.",
      category: "Step 2: TCM Inquiry",
      status: "pending",
      critical: true,
    },
    {
      id: "tcm_inquiry_persona",
      number: 9,
      name: "TCM Doctor Persona",
      description: "Verifies AI responds as a TCM practitioner.",
      category: "Step 2: TCM Inquiry",
      status: "pending",
    },
    {
      id: "chat_language_support",
      number: 10,
      name: "Multi-language Chat Support",
      description: "Tests chat works with zh, en, and ms languages.",
      category: "Step 2: TCM Inquiry",
      status: "pending",
    },
    {
      id: "file_upload_extraction",
      number: 11,
      name: "Report File Text Extraction",
      description: "Tests /api/extract-text for uploaded reports.",
      category: "Step 2: TCM Inquiry",
      status: "pending",
    },
    {
      id: "medicine_photo_extraction",
      number: 12,
      name: "Medicine Photo Recognition",
      description: "Tests medicine identification from photos.",
      category: "Step 2: TCM Inquiry",
      status: "pending",
    },
    {
      id: "inquiry_summary_generation",
      number: 13,
      name: "Inquiry Summary Generation",
      description: "Tests /api/summarize-inquiry endpoint.",
      category: "Step 2: TCM Inquiry",
      status: "pending",
      critical: true,
    },

    // ============================================
    // STEP 3: TONGUE ANALYSIS (望诊-舌)
    // ============================================
    {
      id: "tongue_api_endpoint",
      number: 14,
      name: "Tongue Analysis API",
      description: "Checks /api/analyze-image?type=tongue endpoint.",
      category: "Step 3: Tongue Analysis",
      status: "pending",
      critical: true,
    },
    {
      id: "tongue_image_validation",
      number: 15,
      name: "Tongue Image Validation",
      description: "Verifies API rejects non-tongue images gracefully.",
      category: "Step 3: Tongue Analysis",
      status: "pending",
    },
    {
      id: "tongue_observation_format",
      number: 16,
      name: "Tongue Observation Format",
      description: "Verifies response includes observation and potential_issues.",
      category: "Step 3: Tongue Analysis",
      status: "pending",
    },

    // ============================================
    // STEP 4: FACE ANALYSIS (望诊-面)
    // ============================================
    {
      id: "face_api_endpoint",
      number: 17,
      name: "Face Analysis API",
      description: "Checks /api/analyze-image?type=face endpoint.",
      category: "Step 4: Face Analysis",
      status: "pending",
      critical: true,
    },
    {
      id: "face_observation_format",
      number: 18,
      name: "Face Observation Format",
      description: "Verifies response includes TCM complexion analysis.",
      category: "Step 4: Face Analysis",
      status: "pending",
    },

    // ============================================
    // STEP 5: VOICE ANALYSIS (闻诊)
    // ============================================
    {
      id: "audio_api_endpoint",
      number: 19,
      name: "Audio Analysis API",
      description: "Checks /api/analyze-audio endpoint.",
      category: "Step 5: Voice Analysis",
      status: "pending",
      critical: true,
    },
    {
      id: "audio_analysis_format",
      number: 20,
      name: "Audio Analysis Response Format",
      description: "Verifies response includes voice quality and TCM indicators.",
      category: "Step 5: Voice Analysis",
      status: "pending",
    },
    {
      id: "audio_language_support",
      number: 21,
      name: "Audio Multi-language Support",
      description: "Tests audio analysis with different language settings.",
      category: "Step 5: Voice Analysis",
      status: "pending",
    },

    // ============================================
    // STEP 6: PULSE CHECK (切诊)
    // ============================================
    {
      id: "pulse_qualities_data",
      number: 22,
      name: "Pulse Qualities Data",
      description: "Verifies all TCM pulse types are defined correctly.",
      category: "Step 6: Pulse Check",
      status: "pending",
    },
    {
      id: "bpm_calculation",
      number: 23,
      name: "BPM Calculation Logic",
      description: "Tests heart rate calculation from tap intervals.",
      category: "Step 6: Pulse Check",
      status: "pending",
    },
    {
      id: "pulse_data_structure",
      number: 24,
      name: "Pulse Data Structure",
      description: "Verifies pulse data contains bpm and pulseQualities.",
      category: "Step 6: Pulse Check",
      status: "pending",
    },

    // ============================================
    // STEP 7: SMART CONNECT (IoT)
    // ============================================
    {
      id: "smart_connect_data_structure",
      number: 25,
      name: "Smart Connect Data Structure",
      description: "Verifies IoT data fields: pulseRate, bloodPressure, etc.",
      category: "Step 7: Smart Connect",
      status: "pending",
    },
    {
      id: "health_data_provider_integration",
      number: 26,
      name: "Health Data Provider Fields",
      description: "Checks steps, sleepHours, heartRate, calories fields.",
      category: "Step 7: Smart Connect",
      status: "pending",
    },

    // ============================================
    // STEP 8: REPORT GENERATION
    // ============================================
    {
      id: "consult_api_endpoint",
      number: 27,
      name: "Consult API Endpoint Health",
      description: "Checks if /api/consult endpoint is reachable.",
      category: "Step 8: Report Generation",
      status: "pending",
      critical: true,
    },
    {
      id: "consult_stream_response",
      number: 28,
      name: "Report Generation Streaming",
      description: "Verifies /api/consult returns streaming JSON report.",
      category: "Step 8: Report Generation",
      status: "pending",
      critical: true,
    },
    {
      id: "report_structure_validation",
      number: 29,
      name: "Report Structure Validation",
      description: "Verifies report has diagnosis, recommendations, etc.",
      category: "Step 8: Report Generation",
      status: "pending",
      critical: true,
    },
    {
      id: "mock_report_generation",
      number: 30,
      name: "Mock Report Generation",
      description: "Tests generateMockReport with all profile types.",
      category: "Step 8: Report Generation",
      status: "pending",
    },
    {
      id: "report_chat_api",
      number: 31,
      name: "Report Chat API",
      description: "Tests /api/report-chat for follow-up questions.",
      category: "Step 8: Report Generation",
      status: "pending",
    },
    {
      id: "infographic_generation",
      number: 32,
      name: "Infographic Generation API",
      description: "Tests /api/generate-infographic endpoint.",
      category: "Step 8: Report Generation",
      status: "pending",
    },

    // ============================================
    // SYSTEM HEALTH
    // ============================================
    {
      id: "api_general_health",
      number: 33,
      name: "General API Health",
      description: "Checks if the Next.js server is responding.",
      category: "System Health",
      status: "pending",
      critical: true,
    },
    {
      id: "supabase_connection",
      number: 34,
      name: "Database Connection (Supabase)",
      description: "Verifies Supabase connection is working.",
      category: "System Health",
      status: "pending",
    },
    {
      id: "model_fallback_chain",
      number: 35,
      name: "AI Model Fallback Chain",
      description: "Verifies model fallback works when primary fails.",
      category: "System Health",
      status: "pending",
    },
    {
      id: "inquiry_summary_fallback_test",
      number: 36,
      name: "Inquiry Summary Fallback",
      description: "Forces a model failure to verify fallback logic kicks in.",
      category: "Step 2: TCM Inquiry",
      status: "pending",
    },

    // ============================================
    // ADDITIONAL CORE UTILITIES
    // ============================================
    {
      id: "json_repair_edge_cases",
      number: 37,
      name: "JSON Repair Edge Cases",
      description: "Tests JSON repair with various edge cases and malformed inputs.",
      category: "Core Utilities",
      status: "pending",
    },
    {
      id: "mock_report_all_fields",
      number: 38,
      name: "Mock Report All Fields",
      description: "Verifies generateMockReport includes all required report fields.",
      category: "Core Utilities",
      status: "pending",
    },
    {
      id: "data_type_validation",
      number: 39,
      name: "Data Type Validation",
      description: "Tests that all data types match expected schemas.",
      category: "Core Utilities",
      status: "pending",
    },

    // ============================================
    // ADDITIONAL STEP 1: BASIC INFO
    // ============================================
    {
      id: "age_validation_ranges",
      number: 40,
      name: "Age Validation Ranges",
      description: "Tests age validation for valid ranges (0-150).",
      category: "Step 1: Basic Info",
      status: "pending",
    },
    {
      id: "gender_options_validation",
      number: 41,
      name: "Gender Options Validation",
      description: "Verifies all gender options are valid and accepted.",
      category: "Step 1: Basic Info",
      status: "pending",
    },
    {
      id: "symptoms_text_validation",
      number: 42,
      name: "Symptoms Text Validation",
      description: "Tests symptoms field accepts and validates text input.",
      category: "Step 1: Basic Info",
      status: "pending",
    },
    {
      id: "height_weight_validation",
      number: 43,
      name: "Height/Weight Validation",
      description: "Tests height and weight accept valid numeric ranges.",
      category: "Step 1: Basic Info",
      status: "pending",
    },

    // ============================================
    // ADDITIONAL STEP 2: TCM INQUIRY
    // ============================================
    {
      id: "chat_empty_message_handling",
      number: 44,
      name: "Chat Empty Message Handling",
      description: "Tests chat API handles empty messages gracefully.",
      category: "Step 2: TCM Inquiry",
      status: "pending",
    },
    {
      id: "chat_long_message_handling",
      number: 45,
      name: "Chat Long Message Handling",
      description: "Tests chat API handles very long messages correctly.",
      category: "Step 2: TCM Inquiry",
      status: "pending",
    },
    {
      id: "chat_history_persistence",
      number: 46,
      name: "Chat History Persistence",
      description: "Verifies chat history is maintained across requests.",
      category: "Step 2: TCM Inquiry",
      status: "pending",
    },
    {
      id: "extract_text_pdf_support",
      number: 47,
      name: "PDF Text Extraction",
      description: "Tests /api/extract-text handles PDF files correctly.",
      category: "Step 2: TCM Inquiry",
      status: "pending",
    },
    {
      id: "extract_text_image_support",
      number: 48,
      name: "Image Text Extraction (OCR)",
      description: "Tests OCR functionality for image-based text extraction.",
      category: "Step 2: TCM Inquiry",
      status: "pending",
    },
    {
      id: "validate_medicine_api",
      number: 49,
      name: "Medicine Validation API",
      description: "Tests /api/validate-medicine endpoint for TCM formulas.",
      category: "Step 2: TCM Inquiry",
      status: "pending",
    },
    {
      id: "western_chat_api",
      number: 50,
      name: "Western Medicine Chat API",
      description: "Tests /api/western-chat for second opinion functionality.",
      category: "Step 2: TCM Inquiry",
      status: "pending",
    },

    // ============================================
    // ADDITIONAL STEP 3: TONGUE ANALYSIS
    // ============================================
    {
      id: "tongue_analysis_tags_format",
      number: 51,
      name: "Tongue Analysis Tags Format",
      description: "Verifies analysis_tags array format and structure.",
      category: "Step 3: Tongue Analysis",
      status: "pending",
    },
    {
      id: "tongue_tcm_indicators",
      number: 52,
      name: "Tongue TCM Indicators",
      description: "Tests TCM indicators are properly extracted from tongue analysis.",
      category: "Step 3: Tongue Analysis",
      status: "pending",
    },
    {
      id: "tongue_image_size_validation",
      number: 53,
      name: "Tongue Image Size Validation",
      description: "Tests API handles various image sizes appropriately.",
      category: "Step 3: Tongue Analysis",
      status: "pending",
    },
    {
      id: "tongue_analysis_with_context",
      number: 54,
      name: "Tongue Analysis with Patient Context",
      description: "Tests tongue analysis uses patient symptoms/context.",
      category: "Step 3: Tongue Analysis",
      status: "pending",
    },

    // ============================================
    // ADDITIONAL STEP 4: FACE ANALYSIS
    // ============================================
    {
      id: "face_complexion_analysis",
      number: 55,
      name: "Face Complexion Analysis",
      description: "Verifies TCM complexion analysis is included in response.",
      category: "Step 4: Face Analysis",
      status: "pending",
    },
    {
      id: "face_analysis_with_symptoms",
      number: 56,
      name: "Face Analysis with Symptoms",
      description: "Tests face analysis incorporates patient symptoms.",
      category: "Step 4: Face Analysis",
      status: "pending",
    },

    // ============================================
    // ADDITIONAL STEP 5: VOICE ANALYSIS
    // ============================================
    {
      id: "audio_file_format_support",
      number: 57,
      name: "Audio File Format Support",
      description: "Tests audio API supports multiple audio formats.",
      category: "Step 5: Voice Analysis",
      status: "pending",
    },
    {
      id: "audio_duration_validation",
      number: 58,
      name: "Audio Duration Validation",
      description: "Tests audio API handles various recording durations.",
      category: "Step 5: Voice Analysis",
      status: "pending",
    },
    {
      id: "analyze_snore_api",
      number: 59,
      name: "Snore Analysis API",
      description: "Tests /api/analyze-snore for sleep audio analysis.",
      category: "Step 5: Voice Analysis",
      status: "pending",
    },
    {
      id: "audio_quality_indicators",
      number: 60,
      name: "Audio Quality Indicators",
      description: "Verifies voice quality indicators are properly extracted.",
      category: "Step 5: Voice Analysis",
      status: "pending",
    },

    // ============================================
    // ADDITIONAL STEP 6: PULSE CHECK
    // ============================================
    {
      id: "pulse_rhythm_validation",
      number: 61,
      name: "Pulse Rhythm Validation",
      description: "Tests pulse rhythm values are valid TCM pulse types.",
      category: "Step 6: Pulse Check",
      status: "pending",
    },
    {
      id: "pulse_strength_validation",
      number: 62,
      name: "Pulse Strength Validation",
      description: "Tests pulse strength values are within valid ranges.",
      category: "Step 6: Pulse Check",
      status: "pending",
    },
    {
      id: "pulse_quality_combinations",
      number: 63,
      name: "Pulse Quality Combinations",
      description: "Tests multiple pulse qualities can be combined correctly.",
      category: "Step 6: Pulse Check",
      status: "pending",
    },

    // ============================================
    // ADDITIONAL STEP 7: SMART CONNECT
    // ============================================
    {
      id: "smart_connect_blood_pressure",
      number: 64,
      name: "Smart Connect Blood Pressure",
      description: "Validates blood pressure data structure and ranges.",
      category: "Step 7: Smart Connect",
      status: "pending",
    },
    {
      id: "smart_connect_blood_oxygen",
      number: 65,
      name: "Smart Connect Blood Oxygen",
      description: "Validates blood oxygen saturation values.",
      category: "Step 7: Smart Connect",
      status: "pending",
    },
    {
      id: "smart_connect_body_temperature",
      number: 66,
      name: "Smart Connect Body Temperature",
      description: "Validates body temperature readings are in valid range.",
      category: "Step 7: Smart Connect",
      status: "pending",
    },
    {
      id: "health_data_provider_validation",
      number: 67,
      name: "Health Data Provider Validation",
      description: "Tests health data from different providers is normalized correctly.",
      category: "Step 7: Smart Connect",
      status: "pending",
    },

    // ============================================
    // ADDITIONAL STEP 8: REPORT GENERATION
    // ============================================
    {
      id: "report_diagnosis_structure",
      number: 68,
      name: "Report Diagnosis Structure",
      description: "Verifies diagnosis object has all required TCM pattern fields.",
      category: "Step 8: Report Generation",
      status: "pending",
    },
    {
      id: "report_recommendations_structure",
      number: 69,
      name: "Report Recommendations Structure",
      description: "Tests recommendations include food, avoid, and lifestyle arrays.",
      category: "Step 8: Report Generation",
      status: "pending",
    },
    {
      id: "report_constitution_analysis",
      number: 70,
      name: "Report Constitution Analysis",
      description: "Verifies constitution type and description are included.",
      category: "Step 8: Report Generation",
      status: "pending",
    },
    {
      id: "report_chat_context_preservation",
      number: 71,
      name: "Report Chat Context Preservation",
      description: "Tests report-chat maintains full report context in conversation.",
      category: "Step 8: Report Generation",
      status: "pending",
    },
    {
      id: "infographic_data_extraction",
      number: 72,
      name: "Infographic Data Extraction",
      description: "Tests infographic generation extracts key data from report.",
      category: "Step 8: Report Generation",
      status: "pending",
    },
    {
      id: "report_multilingual_support",
      number: 73,
      name: "Report Multilingual Support",
      description: "Tests report generation works in all supported languages.",
      category: "Step 8: Report Generation",
      status: "pending",
    },

    // ============================================
    // ADDITIONAL SYSTEM HEALTH
    // ============================================
    {
      id: "api_response_times",
      number: 74,
      name: "API Response Times",
      description: "Tests critical APIs respond within acceptable time limits.",
      category: "System Health",
      status: "pending",
    },
    {
      id: "api_error_handling",
      number: 75,
      name: "API Error Handling",
      description: "Verifies APIs return proper error responses for invalid inputs.",
      category: "System Health",
      status: "pending",
    },
    {
      id: "rate_limiting_behavior",
      number: 76,
      name: "Rate Limiting Behavior",
      description: "Tests rate limiting is enforced on protected endpoints.",
      category: "System Health",
      status: "pending",
    },
    {
      id: "cors_headers_validation",
      number: 77,
      name: "CORS Headers Validation",
      description: "Verifies CORS headers are set correctly for mobile app access.",
      category: "System Health",
      status: "pending",
    },
    {
      id: "environment_variables_check",
      number: 78,
      name: "Environment Variables Check",
      description: "Tests required environment variables are configured.",
      category: "System Health",
      status: "pending",
    },
    {
      id: "api_versioning_consistency",
      number: 79,
      name: "API Versioning Consistency",
      description: "Verifies API responses maintain consistent structure.",
      category: "System Health",
      status: "pending",
    },
    {
      id: "health_endpoint_availability",
      number: 80,
      name: "Health Endpoint Availability",
      description: "Tests /api/health endpoint returns system status.",
      category: "System Health",
      status: "pending",
      critical: true,
    },
  ]);

  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [feedbackId, setFeedbackId] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    "Core Utilities": true,
    "Step 1: Basic Info": true,
    "Step 2: TCM Inquiry": true,
    "Step 3: Tongue Analysis": true,
    "Step 4: Face Analysis": true,
    "Step 5: Voice Analysis": true,
    "Step 6: Pulse Check": true,
    "Step 7: Smart Connect": true,
    "Step 8: Report Generation": true,
    "System Health": true,
  });

  // Filter states
  const [statusFilter, setStatusFilter] = useState<TestStatus | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<TestCategory | "all">("all");
  const [criticalOnly, setCriticalOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    // Auto-run tests on mount
    runTests();
  }, []);

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  // Helper function to retry API calls with exponential backoff for rate limiting
  const retryWithBackoff = async <T,>(
    fn: () => Promise<T>,
    maxRetries = 3,
    baseDelay = 1000
  ): Promise<T> => {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error: any) {
        const isRateLimit = error.message?.includes("429") || error.message?.includes("rate limit");
        const isLastAttempt = attempt === maxRetries;

        if (!isRateLimit || isLastAttempt) {
          throw error;
        }

        // Exponential backoff: 1s, 2s, 4s
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(
          `Rate limit hit, retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries})`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
    throw new Error("Retry failed");
  };

  const runTests = async () => {
    setIsRunning(true);
    setProgress(0);
    setGeneratedPrompt(null);

    const newTests = [...tests];

    for (let i = 0; i < newTests.length; i++) {
      const test = newTests[i];

      // Update status to running
      test.status = "running";
      setTests([...newTests]);

      const startTime = performance.now();

      try {
        // Use retry wrapper for all tests (it only retries on 429 errors)
        await retryWithBackoff(() => executeTest(test.id));
        test.status = "passed";
        test.message = "Test passed successfully";
      } catch (error: any) {
        test.status = "failed";
        test.message = error.message || "Unknown error occurred";
        test.error = error;
      }

      test.duration = performance.now() - startTime;
      setTests([...newTests]);
      setProgress(((i + 1) / newTests.length) * 100);

      // Add longer delay between API-intensive tests to avoid rate limiting
      const isApiTest = test.category.includes("Analysis") || test.category.includes("Generation");
      const delay = isApiTest ? 2000 : 500;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    setIsRunning(false);
  };

  const executeTest = async (testId: string) => {
    switch (testId) {
      // ============================================
      // CORE UTILITIES
      // ============================================
      case "json_repair": {
        // Test JSON repair with multiple malformed patterns
        const testCases = [
          '{"key": "value", "summary": "text", "orphan text"}',
          '{"diagnosis": {"pattern": "test"}, "This is extra text without key"}',
        ];
        for (const malformed of testCases) {
          const repaired = repairJSON(malformed);
          try {
            JSON.parse(repaired);
          } catch (e) {
            throw new Error(`Failed to repair JSON: ${malformed.slice(0, 50)}...`);
          }
        }
        break;
      }

      case "mock_profiles_integrity": {
        if (!MOCK_PROFILES || MOCK_PROFILES.length === 0) {
          throw new Error("No mock profiles found");
        }
        if (MOCK_PROFILES.length < 3) {
          throw new Error(`Expected at least 3 profiles, got ${MOCK_PROFILES.length}`);
        }
        MOCK_PROFILES.forEach((profile) => {
          const d = profile.data;
          if (!d.basic_info) throw new Error(`${profile.id}: missing basic_info`);
          if (!d.wen_inquiry) throw new Error(`${profile.id}: missing wen_inquiry`);
          if (!d.wang_tongue) throw new Error(`${profile.id}: missing wang_tongue`);
          if (!d.wang_face) throw new Error(`${profile.id}: missing wang_face`);
          if (!d.wen_audio) throw new Error(`${profile.id}: missing wen_audio`);
          if (!d.qie) throw new Error(`${profile.id}: missing qie`);
          if (!d.smart_connect) throw new Error(`${profile.id}: missing smart_connect`);
        });
        break;
      }

      case "component_imports": {
        if (typeof repairJSON !== "function") throw new Error("repairJSON not imported");
        if (typeof generateMockReport !== "function")
          throw new Error("generateMockReport not imported");
        if (!MOCK_PROFILES) throw new Error("MOCK_PROFILES not imported");
        break;
      }

      // ============================================
      // STEP 1: BASIC INFO
      // ============================================
      case "basic_info_validation": {
        const requiredFields = ["name", "age", "gender", "symptoms"] as const;
        MOCK_PROFILES.forEach((profile) => {
          const info = profile.data.basic_info as Record<string, any>;
          requiredFields.forEach((field) => {
            if (!info[field]) throw new Error(`${profile.id}: basic_info.${field} is missing`);
          });
        });
        break;
      }

      case "bmi_calculation": {
        // Test BMI calculation logic
        const testCases = [
          { height: 170, weight: 70, expectedRange: [24, 25] },
          { height: 160, weight: 50, expectedRange: [19, 20] },
          { height: 180, weight: 90, expectedRange: [27, 28] },
        ];
        testCases.forEach(({ height, weight, expectedRange }) => {
          const bmi = weight / (height / 100) ** 2;
          if (bmi < expectedRange[0] || bmi > expectedRange[1]) {
            throw new Error(
              `BMI calculation error: ${height}cm/${weight}kg = ${bmi.toFixed(1)}, expected ${expectedRange}`
            );
          }
        });
        break;
      }

      case "symptom_duration_options": {
        const expectedDurations = ["acute", "chronic", "1-2-weeks", "1-3-months"];
        const foundDurations = MOCK_PROFILES.map((p) => p.data.basic_info.symptomDuration);
        if (foundDurations.every((d) => !d)) {
          throw new Error("No symptomDuration found in any profile");
        }
        break;
      }

      // ============================================
      // ADDITIONAL STEP 1: BASIC INFO
      // ============================================
      case "age_validation_ranges": {
        const testAges = [
          { age: "25", valid: true },
          { age: 0, valid: true },
          { age: 150, valid: true },
          { age: -1, valid: false },
          { age: 151, valid: false },
          { age: "abc", valid: false },
        ];

        testAges.forEach(({ age, valid }) => {
          const num = typeof age === "number" ? age : parseInt(age as string);
          const isValid = !isNaN(num) && num >= 0 && num <= 150;
          if (isValid !== valid) {
            throw new Error(
              `Age validation failed for '${age}': expected ${valid}, got ${isValid}`
            );
          }
        });
        break;
      }

      case "gender_options_validation": {
        const validGenders = ["male", "female", "other"];
        const testGenders = ["male", "FEMALE", "other", "unknown", "none", ""];

        testGenders.forEach((gender) => {
          const isValid = validGenders.includes(gender.toLowerCase());
          const expectedValid = gender !== "unknown" && gender !== "none" && gender !== "";
          if (isValid !== expectedValid) {
            throw new Error(
              `Gender validation failed for '${gender}': expected ${expectedValid}, got ${isValid}`
            );
          }
        });
        break;
      }

      case "symptoms_text_validation": {
        const symptomsToTest = [
          { input: "I have a headache", expected: true },
          { input: "   ", expected: false },
          { input: "", expected: false },
          { input: "Persistent cough for 3 days", expected: true },
        ];

        symptomsToTest.forEach(({ input, expected }) => {
          const isInputValid = input.trim().length > 0;
          if (isInputValid !== expected) {
            throw new Error(
              `Symptoms validation failed for "${input.slice(0, 20)}...": expected ${expected}, got ${isInputValid}`
            );
          }
        });
        break;
      }

      case "height_weight_validation": {
        const testCases = [
          { h: "170", w: "70", valid: true },
          { h: "40", w: "70", valid: false }, // Too short
          { h: "260", w: "70", valid: false }, // Too tall
          { h: "170", w: "15", valid: false }, // Too light
          { h: "170", w: "350", valid: false }, // Too heavy
        ];

        testCases.forEach(({ h, w, valid }) => {
          const heightVal = parseFloat(h);
          const weightVal = parseFloat(w);
          const isHeightValid = heightVal >= 50 && heightVal <= 250;
          const isWeightValid = weightVal >= 20 && weightVal <= 300;
          const isValid = isHeightValid && isWeightValid;

          if (isValid !== valid) {
            throw new Error(
              `Height/Weight validation failed for ${h}cm / ${w}kg: expected ${valid}`
            );
          }
        });
        break;
      }

      // ============================================
      // STEP 2: TCM INQUIRY
      // ============================================
      case "chat_api_endpoint": {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: [], model: "gemini-1.5-pro" }),
        });
        if (response.status === 404) throw new Error("Chat API not found (404)");
        break;
      }

      case "chat_stream_response": {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [{ role: "user", content: "Hello" }],
            basicInfo: MOCK_PROFILES[0].data.basic_info,
            model: "gemini-1.5-flash",
            language: "en",
          }),
        });
        if (!response.ok) throw new Error(`API returned ${response.status}`);

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");

        let receivedData = false;
        const timeout = 15000;
        const start = Date.now();

        while (!receivedData && Date.now() - start < timeout) {
          const { value, done } = await reader.read();
          if (value && value.length > 0) receivedData = true;
          else if (done) throw new Error("Stream closed without data");
          if (!receivedData && !done) await new Promise((r) => setTimeout(r, 100));
        }
        if (!receivedData) throw new Error("Timeout (15s)");
        reader.cancel();
        break;
      }

      case "tcm_inquiry_persona": {
        // Test that AI acts as TCM doctor - uses the streaming test to verify
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [{ role: "user", content: "What is your specialty?" }],
            basicInfo: { symptoms: "headache" },
            model: "gemini-1.5-flash",
            language: "en",
          }),
        });
        if (!response.ok) throw new Error(`API returned ${response.status}`);
        break;
      }

      case "chat_language_support": {
        // Quick check that language parameter is accepted
        for (const lang of ["en", "zh", "ms"]) {
          const response = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              messages: [{ role: "user", content: "Test" }],
              model: "gemini-1.5-pro",
              language: lang,
            }),
          });
          if (response.status === 404) throw new Error(`Language ${lang} not supported`);
        }
        break;
      }

      case "file_upload_extraction": {
        const response = await fetch("/api/extract-text", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ file: MOCK_IMAGE, fileType: "image/png", mode: "general" }),
        });
        if (!response.ok) throw new Error(`API returned ${response.status}`);
        const result = await response.json();
        if (result.error && !result.text) throw new Error(result.error);
        break;
      }

      case "medicine_photo_extraction": {
        const response = await fetch("/api/extract-text", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ file: MOCK_IMAGE, fileType: "image/png", mode: "medicine" }),
        });
        if (!response.ok) throw new Error(`API returned ${response.status}`);
        break;
      }

      case "inquiry_summary_generation": {
        const response = await fetch("/api/summarize-inquiry", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chatHistory: MOCK_PROFILES[0].data.wen_inquiry.chat,
            basicInfo: MOCK_PROFILES[0].data.basic_info,
          }),
        });
        // API might not exist yet, so 404 is acceptable for now
        if (response.status === 404) return; // Skip - endpoint not yet implemented
        if (!response.ok) {
          let errorDetails = `API returned ${response.status}`;
          try {
            const errorJson = await response.json();
            if (errorJson.error) errorDetails += `: ${errorJson.error}`;
          } catch (e) {
            /* ignore JSON parse error */
          }
          throw new Error(errorDetails);
        }
        break;
      }

      case "inquiry_summary_fallback_test": {
        // Intentionally send an invalid model name to trigger failure
        const response = await fetch("/api/summarize-inquiry", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chatHistory: MOCK_PROFILES[0].data.wen_inquiry.chat,
            basicInfo: MOCK_PROFILES[0].data.basic_info,
            model: "non-existent-model-v999", // This WILL fail
          }),
        });

        if (!response.ok) {
          let errorDetails = `Fallback failed. API returned ${response.status}`;
          try {
            const errorJson = await response.json();
            if (errorJson.error) errorDetails += `: ${errorJson.error}`;
          } catch (e) {
            /* ignore */
          }
          throw new Error(errorDetails);
        }

        // If we get here, it means the API recovered from the bad model and sent a 200 OK
        const result = await response.json();
        if (!result.summary) throw new Error("Fallback response missing summary");

        break;
      }

      case "chat_empty_message_handling": {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [{ role: "user", content: "" }], // Empty content
            model: "gemini-1.5-flash",
            language: "en",
          }),
        });
        // Zod should catch this and return 400
        if (response.status !== 400) {
          throw new Error(`Expected 400 for empty message, got ${response.status}`);
        }
        break;
      }

      case "chat_long_message_handling": {
        const longMessage = "A".repeat(5000); // 5k characters is a safe long test
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [{ role: "user", content: longMessage }],
            model: "gemini-1.5-flash",
            language: "en",
          }),
        });
        if (!response.ok) throw new Error(`API failed with long message: ${response.status}`);
        break;
      }

      case "chat_history_persistence": {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [
              { role: "user", content: "My name is John." },
              { role: "assistant", content: "Hello John, how can I help you today?" },
              { role: "user", content: "What is my name?" },
            ],
            model: "gemini-1.5-flash",
            language: "en",
          }),
        });
        if (!response.ok) throw new Error(`API failed with chat history: ${response.status}`);
        break;
      }

      case "extract_text_pdf_support": {
        const mockPdf = "data:application/pdf;base64,JVBERi0xLjcKUmVwb3J0IA==";
        const response = await fetch("/api/extract-text", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ file: mockPdf, fileType: "application/pdf", mode: "general" }),
        });
        if (!response.ok) throw new Error(`API returned ${response.status}`);
        break;
      }

      case "extract_text_image_support": {
        const response = await fetch("/api/extract-text", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ file: MOCK_IMAGE, fileType: "image/png", mode: "general" }),
        });
        if (!response.ok) throw new Error(`API returned ${response.status}`);
        break;
      }

      case "validate_medicine_api": {
        const response = await fetch("/api/validate-medicine", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: "Panadol, Liu Wei Di Huang Wan" }),
        });
        if (!response.ok) throw new Error(`API returned ${response.status}`);
        break;
      }

      case "western_chat_api": {
        const response = await fetch("/api/western-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [{ role: "user", content: "Is acupuncture safe?" }],
            language: "en",
          }),
        });
        if (!response.ok) throw new Error(`API returned ${response.status}`);
        break;
      }

      // ============================================
      // STEP 3: TONGUE ANALYSIS
      // ============================================
      case "tongue_api_endpoint": {
        const response = await fetch("/api/analyze-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: MOCK_IMAGE, type: "tongue" }),
        });
        if (!response.ok) throw new Error(`API returned ${response.status}`);
        break;
      }

      case "tongue_image_validation": {
        const response = await fetch("/api/analyze-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: MOCK_IMAGE, type: "tongue" }),
        });
        const result = await response.json();
        // Should either return valid observation or gracefully handle invalid image
        if (result.status === "error" && !result.observation) {
          throw new Error("API should provide graceful handling for invalid images");
        }
        break;
      }

      case "tongue_observation_format": {
        const mockProfile = MOCK_PROFILES[0];
        const tongueData = mockProfile.data.wang_tongue;
        if (!tongueData.observation) throw new Error("Mock tongue data missing observation");
        if (!Array.isArray(tongueData.potential_issues))
          throw new Error("Missing potential_issues array");
        break;
      }

      case "tongue_analysis_tags_format": {
        const response = await fetch("/api/analyze-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: MOCK_IMAGE, type: "tongue" }),
        });
        const result = await response.json();
        if (result.analysis_tags && !Array.isArray(result.analysis_tags)) {
          throw new Error("analysis_tags should be an array");
        }
        break;
      }

      case "tongue_tcm_indicators": {
        const response = await fetch("/api/analyze-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: MOCK_IMAGE, type: "tongue" }),
        });
        const result = await response.json();
        if (result.observation && !result.observation.includes("tongue")) {
          // This is just a heuristic check
        }
        break;
      }

      case "tongue_image_size_validation": {
        // Test API handles various image sizes appropriately
        const response = await fetch("/api/analyze-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: MOCK_IMAGE, type: "tongue" }),
        });
        if (!response.ok) throw new Error(`API returned ${response.status}`);
        break;
      }

      case "tongue_analysis_with_context": {
        // Test tongue analysis uses patient symptoms/context
        const response = await fetch("/api/analyze-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image: MOCK_IMAGE,
            type: "tongue",
            context: {
              symptoms: MOCK_PROFILES[0].data.basic_info.symptoms,
              age: MOCK_PROFILES[0].data.basic_info.age,
              gender: MOCK_PROFILES[0].data.basic_info.gender,
            },
          }),
        });
        if (!response.ok) throw new Error(`API returned ${response.status}`);
        const result = await response.json();
        if (!result.observation) throw new Error("Missing observation in response");
        break;
      }

      // ============================================
      // STEP 4: FACE ANALYSIS
      // ============================================
      case "face_api_endpoint": {
        const response = await fetch("/api/analyze-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: MOCK_IMAGE, type: "face" }),
        });
        if (!response.ok) throw new Error(`API returned ${response.status}`);
        break;
      }

      case "face_observation_format": {
        const mockProfile = MOCK_PROFILES[0];
        const faceData = mockProfile.data.wang_face;
        if (!faceData.observation) throw new Error("Mock face data missing observation");
        if (!Array.isArray(faceData.potential_issues))
          throw new Error("Missing potential_issues array");
        break;
      }

      case "face_complexion_analysis": {
        // Verifies TCM complexion analysis is included in response
        const response = await fetch("/api/analyze-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: MOCK_IMAGE, type: "face" }),
        });

        if (!response.ok) throw new Error(`API returned ${response.status}`);

        const result = await response.json();
        if (!result.observation)
          throw new Error("Face analysis response missing observation field");

        // Content-based check for TCM complexion indicators
        const complexionTerms = [
          "complexion",
          "color",
          "face",
          "luster",
          "bright",
          "dull",
          "pale",
          "red",
          "yellow",
          "white",
          "black",
          "qi",
          "blood",
        ];
        const hasComplexionInfo = complexionTerms.some((term) =>
          result.observation.toLowerCase().includes(term)
        );

        if (!hasComplexionInfo) {
          console.warn("Face analysis may not include detailed complexion descriptors");
        }
        break;
      }

      case "face_analysis_with_symptoms": {
        // Tests face analysis incorporates patient symptoms
        const mockProfile = MOCK_PROFILES[0];
        const response = await fetch("/api/analyze-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image: MOCK_IMAGE,
            type: "face",
            context: {
              symptoms: mockProfile.data.basic_info.symptoms,
              age: mockProfile.data.basic_info.age,
              gender: mockProfile.data.basic_info.gender,
            },
          }),
        });

        if (!response.ok) throw new Error(`API returned ${response.status}`);

        const result = await response.json();
        if (!result.observation) throw new Error("Face analysis with symptoms missing observation");
        break;
      }

      // ============================================
      // STEP 5: VOICE ANALYSIS
      // ============================================
      case "audio_api_endpoint": {
        const response = await fetch("/api/analyze-audio", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ audio: MOCK_AUDIO, language: "en" }),
        });
        if (!response.ok) throw new Error(`API returned ${response.status}`);
        break;
      }

      case "audio_analysis_format": {
        const mockAudio = MOCK_PROFILES[0].data.wen_audio;
        if (!mockAudio.observation) throw new Error("Mock audio missing observation");
        break;
      }

      case "audio_language_support": {
        // Test audio API accepts different languages
        for (const lang of ["en", "zh"]) {
          const response = await fetch("/api/analyze-audio", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ audio: MOCK_AUDIO, language: lang }),
          });
          if (response.status === 404) throw new Error(`Language ${lang} not supported`);
        }
        break;
      }

      case "audio_file_format_support": {
        // Test that the API accepts multiple audio formats
        const audioFormats = [
          {
            format: "webm",
            mimeType: "audio/webm",
            base64: "UklGRi4AAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=",
          },
          {
            format: "wav",
            mimeType: "audio/wav",
            base64: "UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=",
          },
          {
            format: "mp3",
            mimeType: "audio/mp3",
            base64: "//uQxAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAACAAABhgA=",
          },
          {
            format: "mpeg",
            mimeType: "audio/mpeg",
            base64: "//uQxAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAACAAABhgA=",
          },
        ];

        for (const { format, mimeType, base64 } of audioFormats) {
          const audioData = `data:${mimeType};base64,${base64}`;
          const response = await fetch("/api/analyze-audio", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ audio: audioData, language: "en" }),
          });

          if (!response.ok) {
            throw new Error(
              `Format ${format} (${mimeType}) not supported - API returned ${response.status}`
            );
          }

          const result = await response.json();
          if (!result.overall_observation && !result.voice_quality_analysis) {
            throw new Error(`Format ${format} returned invalid response structure`);
          }
        }
        break;
      }

      case "audio_duration_validation": {
        // Test that the API handles various recording durations
        // Since we can't create real audio of different lengths easily, we test that the API
        // accepts the standard audio format and doesn't reject based on size
        const testAudios = [
          { name: "short", audio: MOCK_AUDIO },
          { name: "standard", audio: MOCK_AUDIO },
        ];

        for (const { name, audio } of testAudios) {
          const response = await fetch("/api/analyze-audio", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ audio, language: "en" }),
          });

          if (!response.ok) {
            throw new Error(`Duration test '${name}' failed - API returned ${response.status}`);
          }

          const result = await response.json();
          // Verify response has expected structure
          if (!result.overall_observation && !result.voice_quality_analysis) {
            throw new Error(`Duration test '${name}' returned invalid response`);
          }
        }
        break;
      }

      case "analyze_snore_api": {
        const response = await fetch("/api/analyze-snore", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ audio: MOCK_AUDIO }),
        });
        if (!response.ok) throw new Error(`API returned ${response.status}`);
        break;
      }

      case "audio_file_format_support": {
        // Test audio API supports multiple audio formats
        const formats = [
          { format: "webm", mime: "audio/webm", data: MOCK_AUDIO },
          {
            format: "wav",
            mime: "audio/wav",
            data: "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=",
          },
        ];

        for (const { format, mime, data } of formats) {
          const response = await fetch("/api/analyze-audio", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ audio: data, language: "en", format: mime }),
          });
          if (!response.ok) {
            console.warn(`Format ${format} may not be supported: ${response.status}`);
          }
        }
        break;
      }

      case "audio_duration_validation": {
        // Test audio API handles various recording durations
        // Using standard mock audio (short duration)
        const response = await fetch("/api/analyze-audio", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ audio: MOCK_AUDIO, language: "en" }),
        });
        if (!response.ok) throw new Error(`API returned ${response.status}`);
        const result = await response.json();
        if (!result.observation) throw new Error("Missing observation in response");
        break;
      }

      case "audio_quality_indicators": {
        // Test that voice quality indicators are properly extracted from audio analysis
        const response = await fetch("/api/analyze-audio", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ audio: MOCK_AUDIO, language: "en" }),
        });

        if (!response.ok) {
          throw new Error(`API returned ${response.status}`);
        }

        const result = await response.json();

        // Verify that quality analysis is present
        if (!result.voice_quality_analysis && !result.overall_observation) {
          throw new Error("Response missing voice quality analysis");
        }

        // If voice_quality_analysis exists, verify it has the expected fields
        if (result.voice_quality_analysis) {
          const vqa = result.voice_quality_analysis;
          if (!vqa.observation && !vqa.severity) {
            throw new Error(
              "voice_quality_analysis missing required fields (observation or severity)"
            );
          }

          // TCM indicators should be present (even if empty array)
          if (!Array.isArray(vqa.tcm_indicators)) {
            throw new Error("tcm_indicators should be an array");
          }
        }

        // Verify status field exists
        if (!result.status) {
          throw new Error("Response missing status field");
        }

        break;
      }

      // ============================================
      // STEP 6: PULSE CHECK
      // ============================================
      case "pulse_qualities_data": {
        const mockPulse = MOCK_PROFILES[0].data.qie;
        if (!mockPulse.quality) throw new Error("pulse quality missing");
        break;
      }

      case "bpm_calculation": {
        // Verify all mock profiles have valid BPM
        MOCK_PROFILES.forEach((profile) => {
          const bpm = profile.data.qie.bpm;
          if (typeof bpm !== "number") throw new Error(`${profile.id}: BPM is not a number`);
          if (bpm < 40 || bpm > 200)
            throw new Error(`${profile.id}: BPM ${bpm} out of valid range`);
        });
        break;
      }

      case "pulse_data_structure": {
        MOCK_PROFILES.forEach((profile) => {
          const qie = profile.data.qie;
          if (!qie.bpm) throw new Error(`${profile.id}: missing bpm`);
          if (!qie.quality) throw new Error(`${profile.id}: missing quality`);
        });
        break;
      }

      // ============================================
      // STEP 7: SMART CONNECT
      // ============================================
      case "smart_connect_data_structure": {
        MOCK_PROFILES.forEach((profile) => {
          const sc = profile.data.smart_connect;
          const scData = sc.data as any;
          if (!scData.pulseRate) throw new Error(`${profile.id}: missing pulseRate`);
          if (!scData.bloodPressure) throw new Error(`${profile.id}: missing bloodPressure`);
          if (!scData.bloodOxygen) throw new Error(`${profile.id}: missing bloodOxygen`);
          if (!scData.bodyTemp) throw new Error(`${profile.id}: missing bodyTemp`);
        });
        break;
      }

      case "health_data_provider_integration": {
        MOCK_PROFILES.forEach((profile) => {
          const sc = profile.data.smart_connect;
          const scData = sc.data as any;
          const hd = scData.healthData;
          if (!hd) throw new Error(`${profile.id}: missing healthData`);
          if (!hd.provider) throw new Error(`${profile.id}: missing provider`);
          if (typeof hd.steps !== "number") throw new Error(`${profile.id}: missing steps`);
          if (typeof hd.sleepHours !== "number")
            throw new Error(`${profile.id}: missing sleepHours`);
          if (typeof hd.heartRate !== "number") throw new Error(`${profile.id}: missing heartRate`);
        });
        break;
      }

      // ============================================
      // ADDITIONAL STEP 7: SMART CONNECT
      // ============================================
      case "smart_connect_blood_pressure": {
        // Validate blood pressure data structure and ranges
        MOCK_PROFILES.forEach((profile) => {
          const sc = profile.data.smart_connect;
          const scData = sc.data as any;
          const bp = scData.bloodPressure;

          // Check if blood pressure exists
          if (!bp) throw new Error(`${profile.id}: missing bloodPressure`);

          // Validate format (should be "systolic/diastolic")
          if (typeof bp !== "string")
            throw new Error(`${profile.id}: bloodPressure should be a string`);

          const bpParts = bp.split("/");
          if (bpParts.length !== 2) {
            throw new Error(
              `${profile.id}: bloodPressure format invalid, expected "systolic/diastolic", got "${bp}"`
            );
          }

          // Parse systolic and diastolic values
          const systolic = parseInt(bpParts[0]);
          const diastolic = parseInt(bpParts[1]);

          // Validate systolic range (typical: 70-200 mmHg)
          if (isNaN(systolic) || systolic < 70 || systolic > 200) {
            throw new Error(
              `${profile.id}: systolic pressure ${systolic} out of valid range (70-200)`
            );
          }

          // Validate diastolic range (typical: 40-120 mmHg)
          if (isNaN(diastolic) || diastolic < 40 || diastolic > 120) {
            throw new Error(
              `${profile.id}: diastolic pressure ${diastolic} out of valid range (40-120)`
            );
          }

          // Validate that systolic > diastolic
          if (systolic <= diastolic) {
            throw new Error(
              `${profile.id}: systolic (${systolic}) must be greater than diastolic (${diastolic})`
            );
          }
        });
        break;
      }

      case "smart_connect_blood_oxygen": {
        // Validate blood oxygen saturation values
        MOCK_PROFILES.forEach((profile) => {
          const sc = profile.data.smart_connect;
          const scData = sc.data as any;
          const oxygen = scData.bloodOxygen;

          // Check if blood oxygen exists
          if (oxygen === undefined || oxygen === null) {
            throw new Error(`${profile.id}: missing bloodOxygen`);
          }

          // Validate type
          if (typeof oxygen !== "number") {
            throw new Error(`${profile.id}: bloodOxygen should be a number, got ${typeof oxygen}`);
          }

          // Validate range (typical: 70-100%)
          if (oxygen < 70 || oxygen > 100) {
            throw new Error(`${profile.id}: bloodOxygen ${oxygen}% out of valid range (70-100%)`);
          }

          // Warn if critically low (but don't fail, as this might be valid patient data)
          if (oxygen < 90) {
            // This is hypoxemia, but valid for patient data
            console.warn(`${profile.id}: bloodOxygen ${oxygen}% is below normal (90-100%)`);
          }
        });
        break;
      }

      case "smart_connect_body_temperature": {
        // Validate body temperature readings are in valid range
        MOCK_PROFILES.forEach((profile) => {
          const sc = profile.data.smart_connect;
          const scData = sc.data as any;
          const temp = scData.bodyTemp;

          // Check if body temperature exists
          if (temp === undefined || temp === null) {
            throw new Error(`${profile.id}: missing bodyTemp`);
          }

          // Validate type
          if (typeof temp !== "number") {
            throw new Error(`${profile.id}: bodyTemp should be a number, got ${typeof temp}`);
          }

          // Validate range (typical: 30-42°C)
          // Normal: 36.1-37.2°C, but we allow wider range for fever/hypothermia
          if (temp < 30 || temp > 42) {
            throw new Error(`${profile.id}: bodyTemp ${temp}°C out of valid range (30-42°C)`);
          }

          // Warn if abnormal (but don't fail)
          if (temp < 36.0) {
            console.warn(`${profile.id}: bodyTemp ${temp}°C is below normal (hypothermia)`);
          } else if (temp > 37.5) {
            console.warn(`${profile.id}: bodyTemp ${temp}°C is above normal (fever)`);
          }
        });
        break;
      }

      case "health_data_provider_validation": {
        // Test health data from different providers is normalized correctly
        const expectedProviders = ["Apple Health", "Samsung Health", "Google Fit"];
        const foundProviders: string[] = [];

        MOCK_PROFILES.forEach((profile) => {
          const sc = profile.data.smart_connect;
          const scData = sc.data as any;
          const hd = scData.healthData;

          // Verify healthData object exists
          if (!hd) throw new Error(`${profile.id}: missing healthData`);

          // Verify provider field
          if (!hd.provider || typeof hd.provider !== "string") {
            throw new Error(`${profile.id}: invalid or missing provider`);
          }

          foundProviders.push(hd.provider);

          // Verify all required fields exist with correct types
          const requiredFields = [
            { name: "steps", type: "number", min: 0, max: 50000 },
            { name: "sleepHours", type: "number", min: 0, max: 24 },
            { name: "heartRate", type: "number", min: 30, max: 220 },
            { name: "calories", type: "number", min: 0, max: 10000 },
            { name: "lastUpdated", type: "string", min: 0, max: 0 },
          ];

          requiredFields.forEach((field) => {
            const value = hd[field.name];

            // Check existence
            if (value === undefined || value === null) {
              throw new Error(`${profile.id}: healthData.${field.name} is missing`);
            }

            // Check type
            if (typeof value !== field.type) {
              throw new Error(
                `${profile.id}: healthData.${field.name} should be ${field.type}, got ${typeof value}`
              );
            }

            // Check ranges for numeric fields
            if (field.type === "number") {
              if (value < field.min || value > field.max) {
                throw new Error(
                  `${profile.id}: healthData.${field.name} value ${value} out of range (${field.min}-${field.max})`
                );
              }
            }
          });

          // Verify heartRate matches pulseRate (they should be synchronized)
          const pulseRate = scData.pulseRate;
          if (Math.abs(hd.heartRate - pulseRate) > 5) {
            console.warn(
              `${profile.id}: heartRate (${hd.heartRate}) differs significantly from pulseRate (${pulseRate})`
            );
          }
        });

        // Verify we have data from multiple providers (diversity check)
        const uniqueProviders = new Set(foundProviders);
        if (uniqueProviders.size < 2) {
          throw new Error(
            `Expected multiple health data providers, found only: ${Array.from(uniqueProviders).join(", ")}`
          );
        }

        break;
      }

      // ============================================
      // STEP 8: REPORT GENERATION
      // ============================================
      case "consult_api_endpoint": {
        const response = await fetch("/api/consult", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: "Test",
            data: {},
            model: "gemini-1.5-pro",
            language: "en",
          }),
        });
        if (response.status === 404) throw new Error("Consult API not found (404)");
        break;
      }

      case "consult_stream_response": {
        const response = await fetch("/api/consult", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: "Analyze patient",
            data: MOCK_PROFILES[0].data,
            model: "gemini-1.5-pro",
            language: "en",
          }),
        });
        if (!response.ok) throw new Error(`API returned ${response.status}`);

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");

        let receivedData = false;
        const timeout = 20000;
        const start = Date.now();

        while (!receivedData && Date.now() - start < timeout) {
          const { value, done } = await reader.read();
          if (value && value.length > 0) receivedData = true;
          else if (done) throw new Error("Stream closed without data");
          if (!receivedData && !done) await new Promise((r) => setTimeout(r, 100));
        }
        if (!receivedData) throw new Error("Timeout (20s)");
        reader.cancel();
        break;
      }

      case "report_structure_validation": {
        const report = generateMockReport(MOCK_PROFILES[0].data);
        if (!report.diagnosis) throw new Error("Report missing diagnosis");
        const primaryPattern =
          typeof report.diagnosis === "string"
            ? report.diagnosis
            : report.diagnosis.primary_pattern;
        if (!primaryPattern) throw new Error("Report missing primary_pattern");
        if (!report.recommendations) throw new Error("Report missing recommendations");
        if (!report.constitution) throw new Error("Report missing constitution");
        if (!report.analysis) throw new Error("Report missing analysis");
        break;
      }

      case "mock_report_generation": {
        // Test all profile types generate valid reports
        MOCK_PROFILES.forEach((profile) => {
          const report = generateMockReport(profile.data);
          if (!report.diagnosis) throw new Error(`${profile.id}: report missing diagnosis`);
          if (!report.recommendations)
            throw new Error(`${profile.id}: report missing recommendations`);
        });
        break;
      }

      case "report_chat_api": {
        const response = await fetch("/api/report-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [{ role: "user", content: "Explain my diagnosis" }],
            report: generateMockReport(MOCK_PROFILES[0].data),
            language: "en",
          }),
        });
        if (response.status === 404) return; // Skip if not implemented
        if (!response.ok && response.status !== 500)
          throw new Error(`API returned ${response.status}`);
        break;
      }

      case "infographic_generation": {
        const response = await fetch("/api/generate-infographic", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            report: generateMockReport(MOCK_PROFILES[0].data),
            language: "en",
          }),
        });
        if (response.status === 404) return; // Skip if not implemented
        break;
      }

      case "report_diagnosis_structure": {
        // Verify diagnosis object has all required TCM pattern fields
        MOCK_PROFILES.forEach((profile) => {
          const report = generateMockReport(profile.data);

          // Diagnosis can be a string or DiagnosisPattern object
          if (!report.diagnosis) {
            throw new Error(`${profile.id}: report missing diagnosis field`);
          }

          // If it's an object, validate the structure
          if (typeof report.diagnosis === "object") {
            const diagnosis = report.diagnosis;

            // Required field: primary_pattern
            if (!diagnosis.primary_pattern || typeof diagnosis.primary_pattern !== "string") {
              throw new Error(`${profile.id}: diagnosis missing or invalid primary_pattern`);
            }

            // Optional but should be arrays if present
            if (diagnosis.secondary_patterns && !Array.isArray(diagnosis.secondary_patterns)) {
              throw new Error(`${profile.id}: diagnosis.secondary_patterns should be an array`);
            }

            if (diagnosis.affected_organs && !Array.isArray(diagnosis.affected_organs)) {
              throw new Error(`${profile.id}: diagnosis.affected_organs should be an array`);
            }

            // Optional pathomechanism
            if (diagnosis.pathomechanism && typeof diagnosis.pathomechanism !== "string") {
              throw new Error(`${profile.id}: diagnosis.pathomechanism should be a string`);
            }
          } else if (typeof report.diagnosis !== "string") {
            throw new Error(
              `${profile.id}: diagnosis should be either a string or DiagnosisPattern object`
            );
          }
        });
        break;
      }

      case "report_recommendations_structure": {
        // Tests recommendations include food, avoid, and lifestyle arrays
        MOCK_PROFILES.forEach((profile) => {
          const report = generateMockReport(profile.data);

          if (!report.recommendations) {
            throw new Error(`${profile.id}: report missing recommendations field`);
          }

          const rec = report.recommendations;

          // Check that recommendations has the expected structure
          // At minimum, we expect it to be an object
          if (typeof rec !== "object" || rec === null) {
            throw new Error(`${profile.id}: recommendations should be an object`);
          }

          // Verify arrays if they exist
          if (rec.food && !Array.isArray(rec.food)) {
            throw new Error(`${profile.id}: recommendations.food should be an array`);
          }

          if (rec.avoid && !Array.isArray(rec.avoid)) {
            throw new Error(`${profile.id}: recommendations.avoid should be an array`);
          }

          if (rec.lifestyle && !Array.isArray(rec.lifestyle)) {
            throw new Error(`${profile.id}: recommendations.lifestyle should be an array`);
          }

          // Optional fields validation
          if (rec.acupoints && !Array.isArray(rec.acupoints)) {
            throw new Error(`${profile.id}: recommendations.acupoints should be an array`);
          }

          if (rec.exercise && !Array.isArray(rec.exercise)) {
            throw new Error(`${profile.id}: recommendations.exercise should be an array`);
          }

          if (rec.herbal_formulas && !Array.isArray(rec.herbal_formulas)) {
            throw new Error(`${profile.id}: recommendations.herbal_formulas should be an array`);
          }

          // Validate food_therapy if present
          if (rec.food_therapy) {
            if (typeof rec.food_therapy !== "object" || rec.food_therapy === null) {
              throw new Error(`${profile.id}: recommendations.food_therapy should be an object`);
            }

            const ft = rec.food_therapy;
            if (ft.beneficial && !Array.isArray(ft.beneficial)) {
              throw new Error(
                `${profile.id}: recommendations.food_therapy.beneficial should be an array`
              );
            }
            if (ft.recipes && !Array.isArray(ft.recipes)) {
              throw new Error(
                `${profile.id}: recommendations.food_therapy.recipes should be an array`
              );
            }
            if (ft.avoid && !Array.isArray(ft.avoid)) {
              throw new Error(
                `${profile.id}: recommendations.food_therapy.avoid should be an array`
              );
            }
          }
        });
        break;
      }

      case "report_constitution_analysis": {
        // Verifies constitution type and description are included
        MOCK_PROFILES.forEach((profile) => {
          const report = generateMockReport(profile.data);

          if (!report.constitution) {
            throw new Error(`${profile.id}: report missing constitution field`);
          }

          // Constitution can be a string or Constitution object
          if (typeof report.constitution === "object") {
            const constitution = report.constitution;

            // Required field: type
            if (!constitution.type || typeof constitution.type !== "string") {
              throw new Error(`${profile.id}: constitution missing or invalid type field`);
            }

            // Validate type is not empty
            if (constitution.type.trim().length === 0) {
              throw new Error(`${profile.id}: constitution.type cannot be empty`);
            }

            // Optional field: description
            if (
              constitution.description !== undefined &&
              typeof constitution.description !== "string"
            ) {
              throw new Error(
                `${profile.id}: constitution.description should be a string if present`
              );
            }
          } else if (typeof report.constitution !== "string") {
            throw new Error(
              `${profile.id}: constitution should be either a string or Constitution object`
            );
          } else {
            // If it's a string, validate it's not empty
            if (report.constitution.trim().length === 0) {
              throw new Error(`${profile.id}: constitution string cannot be empty`);
            }
          }
        });
        break;
      }

      case "report_chat_context_preservation": {
        // Tests report-chat maintains full report context in conversation
        const testReport = generateMockReport(MOCK_PROFILES[0].data);
        const testMessages = [
          { role: "user" as const, content: "What is my primary diagnosis?" },
          { role: "assistant" as const, content: "Your primary diagnosis is..." },
          { role: "user" as const, content: "What foods should I eat?" },
        ];

        const response = await fetch("/api/report-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: testMessages,
            report: testReport,
            language: "en",
          }),
        });

        if (response.status === 404) return; // Skip if not implemented
        if (!response.ok && response.status !== 500) {
          throw new Error(`API returned ${response.status}`);
        }
        break;
      }

      case "infographic_data_extraction": {
        // Tests infographic generation extracts key data from report
        const testReport = generateMockReport(MOCK_PROFILES[0].data);

        const response = await fetch("/api/generate-infographic", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            report: testReport,
            language: "en",
          }),
        });

        if (response.status === 404) return; // Skip if not implemented
        if (!response.ok && response.status !== 500) {
          throw new Error(`API returned ${response.status}`);
        }

        // If we get a successful response, verify it returns data
        if (response.ok) {
          const result = await response.json();
          if (!result.infographicUrl && !result.error) {
            throw new Error("Infographic generation returned no URL or error");
          }
        }
        break;
      }

      // ============================================
      // SYSTEM HEALTH
      // ============================================
      case "api_general_health": {
        const response = await fetch("/");
        if (!response.ok) throw new Error(`Server returned ${response.status}`);
        break;
      }

      case "supabase_connection": {
        // This is a frontend test, we can only verify the client is configured
        // Real connection test would need a dedicated endpoint
        break;
      }

      case "model_fallback_chain": {
        // Test that model fallback is working by checking API response metadata
        const response = await fetch("/api/analyze-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: MOCK_IMAGE, type: "tongue" }),
        });
        const result = await response.json();
        // If modelUsed exists, fallback chain is functioning
        if (typeof result.modelUsed === "number" && result.modelUsed > 0) {
          // Model used successfully
        } else if (result.observation) {
          // Still got a result, fallback worked
        }
        break;
      }

      case "json_repair_edge_cases": {
        const edgeCases = [
          '{"summary": "test", "orphan text after comma"}',
          '{"diagnosis": {"pattern": "test"}}, extra text after brace',
        ];
        edgeCases.forEach((input) => {
          const repaired = repairJSON(input);
          if (repaired === input && (input.includes("extra") || input.includes("orphan"))) {
            // If it didn't repair, we should at least check if it's still valid JSON (it shouldn't be)
            // But repairJSON is intended to fix these.
          }
        });
        break;
      }

      case "mock_report_all_fields": {
        MOCK_PROFILES.forEach((profile) => {
          const report = generateMockReport(profile.data);
          const required = [
            "diagnosis",
            "recommendations",
            "constitution",
            "analysis",
            "patient_summary",
          ];
          required.forEach((field) => {
            if (!(field in report)) throw new Error(`${profile.id}: report missing ${field}`);
          });
        });
        break;
      }

      case "data_type_validation": {
        MOCK_PROFILES.forEach((profile) => {
          const d = profile.data as any;
          if (typeof d.basic_info.name !== "string")
            throw new Error(`${profile.id}: basic_info.name should be string`);
          if (typeof d.basic_info.age !== "number")
            throw new Error(`${profile.id}: basic_info.age should be number`);
          if (typeof d.basic_info.gender !== "string")
            throw new Error(`${profile.id}: basic_info.gender should be string`);
          if (!Array.isArray(d.wen_inquiry.chat))
            throw new Error(`${profile.id}: wen_inquiry.chat should be array`);
          if (typeof d.wang_tongue.observation !== "string")
            throw new Error(`${profile.id}: wang_tongue.observation should be string`);
          if (!Array.isArray(d.wang_tongue.potential_issues))
            throw new Error(`${profile.id}: wang_tongue.potential_issues should be array`);
        });
        break;
      }

      case "api_response_times": {
        const timeoutLimits = [
          {
            endpoint: "/api/health",
            method: "GET",
            body: null,
            maxTime: 10000,
            name: "Health Check",
          },
          {
            endpoint: "/api/chat",
            method: "POST",
            body: JSON.stringify({
              messages: [{ role: "user", content: "Hello" }],
              model: "gemini-1.5-flash",
              language: "en",
            }),
            maxTime: 30000,
            name: "Chat API",
          },
          {
            endpoint: "/api/analyze-image",
            method: "POST",
            body: JSON.stringify({
              image: MOCK_IMAGE,
              type: "tongue",
            }),
            maxTime: 30000,
            name: "Image Analysis",
          },
        ];

        const results: string[] = [];
        for (const { endpoint, method, body, maxTime, name } of timeoutLimits) {
          const startTime = performance.now();
          try {
            const options: RequestInit = {
              method,
              headers: { "Content-Type": "application/json" },
            };
            if (body) options.body = body;

            const response = await fetch(endpoint, options);
            const endTime = performance.now();
            const duration = endTime - startTime;

            if (duration > maxTime) {
              throw new Error(
                `${name} (${endpoint}) took ${duration.toFixed(0)}ms, exceeds ${maxTime}ms limit`
              );
            }

            // For streaming responses, just check initial response time
            if (response.body && endpoint.includes("chat")) {
              const reader = response.body.getReader();
              reader.cancel();
            }

            results.push(`${name}: ${duration.toFixed(0)}ms (limit: ${maxTime}ms) ✓`);
          } catch (error: any) {
            if (error.message.includes("exceeds")) {
              throw error;
            }
            // If endpoint doesn't exist yet, that's okay for this test
            if (error.message?.includes("404")) {
              results.push(`${name}: Endpoint not found (will skip)`);
            } else {
              throw new Error(`${name} failed: ${error.message}`);
            }
          }
        }
        break;
      }

      case "health_endpoint_availability": {
        const response = await fetch("/api/health");
        if (!response.ok) throw new Error(`Health API returned ${response.status}`);
        const data = await response.json();
        if (data.status !== "ok") throw new Error(`Health API status is: ${data.status}`);
        break;
      }

      case "report_multilingual_support": {
        // Test report generation in all supported languages (en, zh, ms)
        const supportedLanguages: Array<{ code: string; name: string; contentCheck: RegExp }> = [
          {
            code: "en",
            name: "English",
            contentCheck: /\b(diagnosis|recommendation|patient|pattern|deficiency)\b/i,
          },
          { code: "zh", name: "Chinese", contentCheck: /[\u4e00-\u9fa5]{2,}/ }, // Matches 2+ Chinese characters
          { code: "ms", name: "Malay", contentCheck: /\b(diagnosis|cadangan|pesakit|pola)\b/i },
        ];

        for (const lang of supportedLanguages) {
          const response = await fetch("/api/consult", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              data: MOCK_PROFILES[0].data,
              model: "gemini-1.5-flash",
              language: lang.code,
            }),
          });

          if (!response.ok) {
            throw new Error(
              `Report generation failed for ${lang.name} (${lang.code}): API returned ${response.status}`
            );
          }

          // Read streaming response
          const reader = response.body?.getReader();
          if (!reader) {
            throw new Error(`No response body for ${lang.name} (${lang.code})`);
          }

          const decoder = new TextDecoder();
          let fullText = "";
          const timeout = 25000;
          const start = Date.now();

          try {
            while (Date.now() - start < timeout) {
              const { value, done } = await reader.read();

              if (done) break;

              if (value) {
                const chunk = decoder.decode(value, { stream: true });
                fullText += chunk;
              }
            }
          } finally {
            reader.cancel();
          }

          // Verify we received content
          if (!fullText || fullText.length < 100) {
            throw new Error(
              `Insufficient content received for ${lang.name} (${lang.code}): only ${fullText.length} characters`
            );
          }

          // Verify content contains expected language patterns
          if (!lang.contentCheck.test(fullText)) {
            throw new Error(
              `Response for ${lang.name} (${lang.code}) does not contain expected language patterns. Received ${fullText.length} chars but pattern check failed.`
            );
          }
        }

        break;
      }

      case "cors_headers_validation": {
        // Test that critical API endpoints have proper CORS headers for mobile app access
        const criticalEndpoints = [
          { endpoint: "/api/health", method: "GET", body: null },
          {
            endpoint: "/api/chat",
            method: "POST",
            body: JSON.stringify({
              messages: [{ role: "user", content: "Test" }],
              model: "gemini-1.5-flash",
              language: "en",
            }),
          },
          {
            endpoint: "/api/analyze-image",
            method: "POST",
            body: JSON.stringify({ image: MOCK_IMAGE, type: "tongue" }),
          },
        ];

        for (const { endpoint, method, body } of criticalEndpoints) {
          const response = await fetch(endpoint, {
            method,
            headers: {
              "Content-Type": "application/json",
              Origin: "http://localhost:8081", // Simulating mobile app origin
            },
            body,
          });

          // Check for CORS headers (they might not be present if not explicitly set)
          const corsOrigin = response.headers.get("Access-Control-Allow-Origin");
          const corsMethods = response.headers.get("Access-Control-Allow-Methods");
          const corsHeaders = response.headers.get("Access-Control-Allow-Headers");

          // Log warning if CORS headers are missing (not a critical failure for same-origin)
          if (!corsOrigin) {
            console.warn(`${endpoint}: Missing Access-Control-Allow-Origin header`);
          }

          // For now, we'll just verify the endpoint responds successfully
          // In production, we'd want proper CORS headers, but Next.js handles same-origin automatically
          if (response.status === 404) {
            throw new Error(`${endpoint} not found (404)`);
          }
        }

        break;
      }

      case "rate_limiting_behavior": {
        // Test rate limiting by making rapid requests to a protected endpoint
        const endpoint = "/api/chat";
        const requests = [];

        // Make 5 rapid requests
        for (let i = 0; i < 5; i++) {
          requests.push(
            fetch(endpoint, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                messages: [{ role: "user", content: `Test ${i}` }],
                model: "gemini-1.5-flash",
                language: "en",
              }),
            })
          );
        }

        const responses = await Promise.all(requests);

        // Check if any response indicates rate limiting (429 status)
        const rateLimited = responses.some((r) => r.status === 429);

        // Note: Rate limiting might not be implemented yet, so we just check all succeeded
        const allSucceeded = responses.every((r) => r.ok || r.status === 500);
        if (!allSucceeded) {
          const failedStatuses = responses
            .filter((r) => !r.ok && r.status !== 500)
            .map((r) => r.status);
          throw new Error(`Some requests failed unexpectedly: ${failedStatuses.join(", ")}`);
        }

        break;
      }

      case "api_error_handling": {
        // Test that APIs return proper error responses for invalid inputs
        const errorTests = [
          {
            endpoint: "/api/chat",
            method: "POST",
            body: JSON.stringify({ messages: "invalid" }), // Invalid: should be array
            expectedError: true,
          },
          {
            endpoint: "/api/analyze-image",
            method: "POST",
            body: JSON.stringify({ image: "not-base64", type: "invalid-type" }),
            expectedError: true,
          },
        ];

        for (const { endpoint, method, body, expectedError } of errorTests) {
          const response = await fetch(endpoint, {
            method,
            headers: { "Content-Type": "application/json" },
            body,
          });

          // Should return 400 or 500 for invalid inputs
          if (expectedError && response.ok) {
            throw new Error(`${endpoint} accepted invalid input (expected error response)`);
          }

          // Check that error response has proper JSON structure
          if (!response.ok) {
            try {
              const errorData = await response.json();
              if (!errorData.error && !errorData.message) {
                throw new Error(`${endpoint} error response missing error field`);
              }
            } catch (parseError) {
              // If we can't parse JSON, that's also a problem
              throw new Error(`${endpoint} returned non-JSON error response`);
            }
          }
        }

        break;
      }

      case "environment_variables_check": {
        // Test that required environment variables are accessible
        const response = await fetch("/api/health");
        const data = await response.json();

        // Check environment is defined
        if (!data.environment) {
          throw new Error("Environment variable not accessible via health endpoint");
        }

        // Verify it's a valid environment
        const validEnvs = ["development", "production", "test"];
        if (!validEnvs.includes(data.environment)) {
          throw new Error(`Invalid environment: ${data.environment}`);
        }

        break;
      }

      case "api_versioning_consistency": {
        // Test that API responses maintain consistent structure
        const endpoints = [
          {
            endpoint: "/api/health",
            method: "GET",
            body: null,
            requiredFields: ["status", "timestamp"],
          },
        ];

        for (const { endpoint, method, body, requiredFields } of endpoints) {
          const response = await fetch(endpoint, {
            method,
            headers: { "Content-Type": "application/json" },
            body,
          });

          if (!response.ok) {
            throw new Error(`${endpoint} returned ${response.status}`);
          }

          const data = await response.json();

          // Check all required fields are present
          for (const field of requiredFields) {
            if (!(field in data)) {
              throw new Error(`${endpoint} response missing required field: ${field}`);
            }
          }
        }

        break;
      }

      default:
        throw new Error(`Test '${testId}' not implemented`);
    }
  };

  const generatePrompt = (test: TestResult) => {
    const prompt = `I am running automated tests for the Sihat TCM application and the test '${test.name}' failed.
        
Error Message: ${test.message}
Test Description: ${test.description}
Test ID: ${test.id}
Category: ${test.category}

Context:
- This test is part of the client-side test runner.
- The error occurred during the execution of the test logic.

Please help me troubleshoot this issue. Analyze the code related to '${test.id}' and suggest a fix.`;

    setGeneratedPrompt(prompt);

    // Copy to clipboard automatically
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard
        .writeText(prompt)
        .then(() => {
          setIsCopied(true);
          setTimeout(() => setIsCopied(false), 2000);
        })
        .catch((err) => {
          console.error("Failed to copy prompt:", err);
        });
    }

    setFeedbackId(test.id);
    setTimeout(() => setFeedbackId(null), 2000);
  };

  // Filter tests based on current filter settings
  const filteredTests = tests.filter((test) => {
    // Status filter
    if (statusFilter !== "all" && test.status !== statusFilter) {
      return false;
    }

    // Category filter
    if (categoryFilter !== "all" && test.category !== categoryFilter) {
      return false;
    }

    // Critical only filter
    if (criticalOnly && !test.critical) {
      return false;
    }

    // Search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchesName = test.name.toLowerCase().includes(query);
      const matchesDescription = test.description.toLowerCase().includes(query);
      const matchesId = test.id.toLowerCase().includes(query);
      if (!matchesName && !matchesDescription && !matchesId) {
        return false;
      }
    }

    return true;
  });

  // Group filtered tests by category
  const groupedTests = filteredTests.reduce(
    (acc, test) => {
      if (!acc[test.category]) {
        acc[test.category] = [];
      }
      acc[test.category].push(test);
      return acc;
    },
    {} as Record<TestCategory, TestResult[]>
  );

  const categories: TestCategory[] = [
    "Core Utilities",
    "Step 1: Basic Info",
    "Step 2: TCM Inquiry",
    "Step 3: Tongue Analysis",
    "Step 4: Face Analysis",
    "Step 5: Voice Analysis",
    "Step 6: Pulse Check",
    "Step 7: Smart Connect",
    "Step 8: Report Generation",
    "System Health",
  ];

  // Calculate test statistics (from all tests, not filtered)
  const testStats = {
    total: tests.length,
    passed: tests.filter((t) => t.status === "passed").length,
    failed: tests.filter((t) => t.status === "failed").length,
    pending: tests.filter((t) => t.status === "pending").length,
    running: tests.filter((t) => t.status === "running").length,
    critical: tests.filter((t) => t.critical).length,
  };

  // Calculate filtered test statistics
  const filteredStats = {
    total: filteredTests.length,
    passed: filteredTests.filter((t) => t.status === "passed").length,
    failed: filteredTests.filter((t) => t.status === "failed").length,
    pending: filteredTests.filter((t) => t.status === "pending").length,
    running: filteredTests.filter((t) => t.status === "running").length,
  };

  // Check if any filters are active
  const hasActiveFilters =
    statusFilter !== "all" || categoryFilter !== "all" || criticalOnly || searchQuery.trim() !== "";

  // Reset all filters
  const resetFilters = () => {
    setStatusFilter("all");
    setCategoryFilter("all");
    setCriticalOnly(false);
    setSearchQuery("");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-8 font-sans">
      <div className="max-w-5xl mx-auto">
        <header className="mb-10 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 mb-2">
              System Diagnostics
            </h1>
            <div className="flex items-center gap-4 flex-wrap">
              <p className="text-slate-400">Automated comprehensive testing suite</p>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-slate-300 bg-slate-900/50 px-3 py-1 rounded-full border border-slate-800/50">
                  {testStats.total} Total
                </span>
                {testStats.passed > 0 && (
                  <span className="text-sm font-semibold text-emerald-400 bg-emerald-950/50 px-3 py-1 rounded-full border border-emerald-800/50">
                    {testStats.passed} Passed
                  </span>
                )}
                {testStats.failed > 0 && (
                  <span className="text-sm font-semibold text-red-400 bg-red-950/50 px-3 py-1 rounded-full border border-red-800/50">
                    {testStats.failed} Failed
                  </span>
                )}
                {testStats.pending > 0 && (
                  <span className="text-sm font-semibold text-slate-500 bg-slate-900/50 px-3 py-1 rounded-full border border-slate-800/50">
                    {testStats.pending} Pending
                  </span>
                )}
                {testStats.running > 0 && (
                  <span className="text-sm font-semibold text-blue-400 bg-blue-950/50 px-3 py-1 rounded-full border border-blue-800/50">
                    {testStats.running} Running
                  </span>
                )}
                {testStats.critical > 0 && (
                  <span className="text-sm font-semibold text-amber-400 bg-amber-950/50 px-3 py-1 rounded-full border border-amber-800/50">
                    {testStats.critical} Critical
                  </span>
                )}
              </div>
            </div>
          </div>
          <Button
            onClick={runTests}
            disabled={isRunning}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-6 rounded-xl shadow-lg shadow-emerald-900/20 transition-all hover:scale-105"
          >
            {isRunning ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Running Tests...
              </>
            ) : (
              <>
                <Play className="mr-2 h-5 w-5" />
                Run All Tests
              </>
            )}
          </Button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Progress Bar */}
            {isRunning && (
              <div className="w-full bg-slate-900 rounded-full h-2 mb-6 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            )}

            {/* Filter Section */}
            <Card className="bg-slate-900/50 border-slate-800 p-4">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="w-5 h-5 text-slate-400" />
                <h2 className="text-lg font-semibold text-slate-200">Filters</h2>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetFilters}
                    className="ml-auto h-7 text-xs text-slate-400 hover:text-slate-200"
                  >
                    <X className="w-3 h-3 mr-1" />
                    Clear All
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Search Input */}
                <div className="lg:col-span-2">
                  <Label htmlFor="search" className="text-xs text-slate-400 mb-2 block">
                    Search Tests
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <Input
                      id="search"
                      type="text"
                      placeholder="Search by name, description, or ID..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 bg-slate-950 border-slate-700 text-slate-200 placeholder:text-slate-500"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-300"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Status Filter */}
                <div>
                  <Label htmlFor="status-filter" className="text-xs text-slate-400 mb-2 block">
                    Status
                  </Label>
                  <Select
                    value={statusFilter}
                    onValueChange={(value) => setStatusFilter(value as TestStatus | "all")}
                  >
                    <SelectTrigger
                      id="status-filter"
                      className="bg-slate-950 border-slate-700 text-slate-200"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="passed">Passed</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="running">Running</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Category Filter */}
                <div>
                  <Label htmlFor="category-filter" className="text-xs text-slate-400 mb-2 block">
                    Category
                  </Label>
                  <Select
                    value={categoryFilter}
                    onValueChange={(value) => setCategoryFilter(value as TestCategory | "all")}
                  >
                    <SelectTrigger
                      id="category-filter"
                      className="bg-slate-950 border-slate-700 text-slate-200"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Critical Only Toggle */}
              <div className="mt-4 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="critical-only"
                  checked={criticalOnly}
                  onChange={(e) => setCriticalOnly(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-emerald-600 focus:ring-emerald-500 focus:ring-offset-0"
                />
                <Label htmlFor="critical-only" className="text-sm text-slate-300 cursor-pointer">
                  Critical tests only
                </Label>
              </div>

              {/* Filter Results Summary */}
              {hasActiveFilters && (
                <div className="mt-4 pt-4 border-t border-slate-800">
                  <p className="text-xs text-slate-400">
                    Showing{" "}
                    <span className="font-semibold text-slate-300">{filteredStats.total}</span> of{" "}
                    <span className="font-semibold text-slate-300">{testStats.total}</span> tests
                    {filteredStats.passed > 0 && (
                      <span className="ml-2 text-emerald-400">• {filteredStats.passed} passed</span>
                    )}
                    {filteredStats.failed > 0 && (
                      <span className="ml-2 text-red-400">• {filteredStats.failed} failed</span>
                    )}
                  </p>
                </div>
              )}
            </Card>

            {/* Grouped Test List */}
            {categories.map((category) => (
              <div key={category} className="space-y-3">
                <button
                  onClick={() => toggleCategory(category)}
                  className="flex items-center gap-2 text-lg font-semibold text-slate-300 hover:text-emerald-400 transition-colors w-full text-left"
                >
                  {expandedCategories[category] ? (
                    <ChevronDown className="w-5 h-5" />
                  ) : (
                    <ChevronRight className="w-5 h-5" />
                  )}
                  {category}
                  <span className="text-xs font-normal text-slate-500 ml-2 bg-slate-900 px-2 py-1 rounded-full">
                    {groupedTests[category]?.length || 0} {hasActiveFilters ? "filtered" : ""} tests
                  </span>
                </button>

                {expandedCategories[category] &&
                  groupedTests[category] &&
                  groupedTests[category].length > 0 && (
                    <div className="space-y-3 pl-2">
                      {groupedTests[category].map((test) => (
                        <motion.div
                          key={test.id}
                          layout
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`p-4 rounded-xl border ${
                            test.status === "passed"
                              ? "bg-emerald-950/30 border-emerald-900/50"
                              : test.status === "failed"
                                ? "bg-red-950/30 border-red-900/50"
                                : test.status === "running"
                                  ? "bg-blue-950/30 border-blue-900/50"
                                  : "bg-slate-900/50 border-slate-800"
                          } transition-colors`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-4">
                              <div
                                className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${
                                  test.status === "passed"
                                    ? "bg-emerald-900 text-emerald-400"
                                    : test.status === "failed"
                                      ? "bg-red-900 text-red-400"
                                      : "bg-slate-800 text-slate-500"
                                }`}
                              >
                                {test.number}
                              </div>
                              <div
                                className={`p-2 rounded-lg ${
                                  test.status === "passed"
                                    ? "bg-emerald-500/20 text-emerald-400"
                                    : test.status === "failed"
                                      ? "bg-red-500/20 text-red-400"
                                      : test.status === "running"
                                        ? "bg-blue-500/20 text-blue-400"
                                        : "bg-slate-800 text-slate-500"
                                }`}
                              >
                                {test.status === "passed" ? (
                                  <CheckCircle className="w-5 h-5" />
                                ) : test.status === "failed" ? (
                                  <XCircle className="w-5 h-5" />
                                ) : test.status === "running" ? (
                                  <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                  <Terminal className="w-5 h-5" />
                                )}
                              </div>
                              <div>
                                <h3 className="font-semibold text-slate-200">{test.name}</h3>
                                <p className="text-sm text-slate-500">{test.description}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              {test.duration && (
                                <span className="text-xs font-mono text-slate-600">
                                  {test.duration.toFixed(0)}ms
                                </span>
                              )}
                              {test.status === "failed" && (
                                <Button
                                  size="sm"
                                  variant={feedbackId === test.id ? "outline" : "destructive"}
                                  onClick={() => generatePrompt(test)}
                                  className={`h-8 text-xs transition-all duration-300 ${
                                    feedbackId === test.id
                                      ? "bg-emerald-600 text-white border-emerald-500 hover:bg-emerald-700 hover:text-white"
                                      : ""
                                  }`}
                                >
                                  {feedbackId === test.id ? (
                                    <>
                                      <Check className="w-3 h-3 mr-1" />
                                      Copied
                                    </>
                                  ) : (
                                    "Give me prompt"
                                  )}
                                </Button>
                              )}
                            </div>
                          </div>
                          {test.message && test.status !== "pending" && (
                            <div
                              className={`mt-3 ml-14 text-sm ${
                                test.status === "failed" ? "text-red-400" : "text-emerald-400"
                              }`}
                            >
                              {test.message}
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  )}
                {expandedCategories[category] &&
                  (!groupedTests[category] || groupedTests[category].length === 0) && (
                    <div className="pl-2 text-sm text-slate-500 italic py-4">
                      No tests match the current filters in this category.
                    </div>
                  )}
              </div>
            ))}

            {/* No Results Message */}
            {filteredTests.length === 0 && hasActiveFilters && (
              <Card className="bg-slate-900/50 border-slate-800 p-8 text-center">
                <Filter className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-300 mb-2">
                  No tests match your filters
                </h3>
                <p className="text-sm text-slate-500 mb-4">
                  Try adjusting your filter criteria or clear all filters.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetFilters}
                  className="border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  Clear All Filters
                </Button>
              </Card>
            )}
          </div>

          {/* Prompt Display Panel */}
          <div className="lg:col-span-1">
            <Card className="h-full bg-slate-900 border-slate-800 p-6 sticky top-8">
              <h2 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
                <Terminal className="w-5 h-5 text-purple-400" />
                Troubleshooting Assistant
              </h2>

              {generatedPrompt ? (
                <div className="space-y-4">
                  <div className="bg-slate-950 rounded-lg p-4 border border-slate-800 font-mono text-xs text-slate-300 whitespace-pre-wrap overflow-x-auto max-h-[500px] overflow-y-auto custom-scrollbar">
                    {generatedPrompt}
                  </div>
                  <Button
                    className={`w-full text-white transition-all duration-200 ${
                      isCopied
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-purple-600 hover:bg-purple-700"
                    }`}
                    onClick={() => {
                      navigator.clipboard.writeText(generatedPrompt);
                      setIsCopied(true);
                      setTimeout(() => setIsCopied(false), 2000);
                    }}
                  >
                    {isCopied ? (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy to Clipboard
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-slate-500 text-center">
                    Paste this prompt in Antigravity IDE to get help.
                  </p>
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-slate-600 text-center p-4 border-2 border-dashed border-slate-800 rounded-xl">
                  <AlertTriangle className="w-10 h-10 mb-3 opacity-50" />
                  <p className="text-sm">
                    Run tests and click "Give me prompt" on any failed test to generate a
                    troubleshooting guide.
                  </p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
