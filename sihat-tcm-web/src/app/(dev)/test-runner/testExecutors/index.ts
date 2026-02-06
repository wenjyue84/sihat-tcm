/**
 * Test Executor Router
 *
 * Routes test execution to the appropriate category-specific executor
 */

import { TestResult } from "../types";
import { executeCoreUtilitiesTest } from "./coreUtilities";
import { executeBasicInfoTest } from "./basicInfo";
import { executeTcmInquiryTest } from "./tcmInquiry";
import { executeTongueAnalysisTest } from "./tongueAnalysis";
import { executeFaceAnalysisTest } from "./faceAnalysis";
import { executeVoiceAnalysisTest } from "./voiceAnalysis";
import { executePulseCheckTest } from "./pulseCheck";
import { executeSmartConnectTest } from "./smartConnect";
import { executeReportGenerationTest } from "./reportGeneration";
import { executeSystemHealthTest } from "./systemHealth";

/**
 * Execute a test by routing to the appropriate executor based on test category
 */
export async function executeTest(test: TestResult): Promise<void> {
  const { id, category } = test;

  switch (category) {
    case "Core Utilities":
      return executeCoreUtilitiesTest(id);

    case "Step 1: Basic Info":
      return executeBasicInfoTest(id);

    case "Step 2: TCM Inquiry":
      return executeTcmInquiryTest(id);

    case "Step 3: Tongue Analysis":
      return executeTongueAnalysisTest(id);

    case "Step 4: Face Analysis":
      return executeFaceAnalysisTest(id);

    case "Step 5: Voice Analysis":
      return executeVoiceAnalysisTest(id);

    case "Step 6: Pulse Check":
      return executePulseCheckTest(id);

    case "Step 7: Smart Connect":
      return executeSmartConnectTest(id);

    case "Step 8: Report Generation":
      return executeReportGenerationTest(id);

    case "System Health":
      return executeSystemHealthTest(id);

    default:
      throw new Error(`Unknown test category: ${category}`);
  }
}
