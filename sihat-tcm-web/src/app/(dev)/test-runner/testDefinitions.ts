/**
 * Test Definitions
 *
 * Static test case definitions for the test runner
 */

import { TestResult } from "./types";

/**
 * Initial test results with all test cases in pending state
 */
export const initialTestResults: TestResult[] = [
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
  // STEP 2: TCM INQUIRY
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
  // STEP 3: TONGUE ANALYSIS
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
  // STEP 4: FACE ANALYSIS
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
  // STEP 5: VOICE ANALYSIS
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
  // STEP 6: PULSE CHECK
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
    id: "health_endpoint_availability",
    number: 36,
    name: "Health Endpoint Availability",
    description: "Tests /api/health endpoint returns system status.",
    category: "System Health",
    status: "pending",
    critical: true,
  },
];
