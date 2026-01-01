/**
 * Core Utilities Test Executor
 * 
 * Tests for foundational utilities and data integrity
 */

import { repairJSON, generateMockReport } from "@/hooks/useDiagnosisWizard";
import { MOCK_PROFILES } from "@/data/mockProfiles";

export async function executeCoreUtilitiesTest(testId: string): Promise<void> {
  switch (testId) {
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

    default:
      throw new Error(`Unknown core utilities test: ${testId}`);
  }
}


