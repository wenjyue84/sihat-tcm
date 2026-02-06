/**
 * Diagnosis Wizard Utility Functions
 *
 * Helper functions for diagnosis wizard operations
 */

import { logger } from "@/lib/clientLogger";
import type { DiagnosisReport } from "@/types/database";
import type { DiagnosisWizardData } from "@/types/diagnosis";

/**
 * Helper for JSON repair
 * Attempts to fix common JSON formatting issues in API responses
 */
export function repairJSON(jsonString: string): string {
  try {
    let current = jsonString.trim();

    // Step 1: Find and extract valid JSON by matching balanced braces
    // This handles cases where there's trailing garbage after the JSON
    const firstBrace = current.indexOf("{");
    if (firstBrace !== -1) {
      let braceCount = 0;
      let inString = false;
      let escapeNext = false;
      let lastValidIndex = -1;

      for (let i = firstBrace; i < current.length; i++) {
        const char = current[i];

        if (escapeNext) {
          escapeNext = false;
          continue;
        }

        if (char === "\\" && inString) {
          escapeNext = true;
          continue;
        }

        if (char === '"' && !escapeNext) {
          inString = !inString;
          continue;
        }

        if (!inString) {
          if (char === "{") {
            braceCount++;
          } else if (char === "}") {
            braceCount--;
            if (braceCount === 0) {
              lastValidIndex = i;
              break; // Found the complete JSON object
            }
          }
        }
      }

      // Extract only the valid JSON portion
      if (lastValidIndex !== -1) {
        current = current.substring(firstBrace, lastValidIndex + 1);
      }
    }

    // Step 2: Apply existing regex-based repairs for internal issues
    const regexSummary = /("summary"\s*:\s*"(?:[^"\\]|\\.)*")\s*,\s*"(?:[^"\\]|\\.)*"\s*(?!:)/;
    const regexObjectOrphan = /(\})\s*,\s*"(?:[^"\\]|\\.)*"\s*(?!:)/;

    let iterations = 0;
    while (iterations < 20) {
      let changed = false;
      if (current.match(regexSummary)) {
        current = current.replace(regexSummary, "$1");
        changed = true;
      }
      if (current.match(regexObjectOrphan)) {
        current = current.replace(regexObjectOrphan, "$1");
        changed = true;
      }
      if (!changed) break;
      iterations++;
    }

    return current;
  } catch (e) {
    logger.error("repairJSON", "Error repairing JSON", e);
    return jsonString;
  }
}

/**
 * Generate a mock diagnosis report for testing/fallback purposes
 */
export const generateMockReport = (data: DiagnosisWizardData): DiagnosisReport => {
  const name = data.basic_info?.name || "";
  return {
    diagnosis: {
      primary_pattern: "Mock Pattern",
      secondary_patterns: [],
      affected_organs: ["Spleen"],
      pathomechanism: "Mock mechanism",
    },
    constitution: { type: "Mock Type", description: "Mock Description" },
    analysis: { summary: "Mock Analysis", key_findings: {} },
    recommendations: { food: [], avoid: [], lifestyle: [] },
    patient_summary: { name: name },
    timestamp: new Date().toISOString(),
  };
};

/**
 * Calculate an overall health score from the diagnosis report (0-100)
 */
export function calculateOverallScore(
  reportData: DiagnosisReport | Partial<DiagnosisReport>
): number {
  try {
    // Default to 70 (neutral/fair) if we can't calculate
    let score = 70;

    // Extract diagnosis text - can be string or object with primary_pattern
    let diagnosisText = "";
    if (typeof reportData.diagnosis === "string") {
      diagnosisText = reportData.diagnosis;
    } else if (
      reportData.diagnosis &&
      typeof reportData.diagnosis === "object" &&
      "primary_pattern" in reportData.diagnosis
    ) {
      diagnosisText = reportData.diagnosis.primary_pattern;
    } else if (
      reportData.diagnosis &&
      typeof reportData.diagnosis === "object" &&
      "pattern" in reportData.diagnosis
    ) {
      diagnosisText = String((reportData.diagnosis as any).pattern);
    }

    // Factor 1: Severity keywords in diagnosis (lower score for severe conditions)
    const diagnosisLower = diagnosisText.toLowerCase();
    if (diagnosisLower.includes("severe") || diagnosisLower.includes("deficiency")) {
      score -= 15;
    } else if (diagnosisLower.includes("mild") || diagnosisLower.includes("minor")) {
      score += 10;
    }

    // Factor 2: Number of affected organs/systems (more = lower score)
    const diagnosisObj =
      typeof reportData.diagnosis === "object" && reportData.diagnosis !== null
        ? reportData.diagnosis
        : null;
    const affectedOrgans =
      diagnosisObj &&
      "affected_organs" in diagnosisObj &&
      Array.isArray(diagnosisObj.affected_organs)
        ? diagnosisObj.affected_organs.length
        : 0;
    score -= Math.min(affectedOrgans * 5, 20);

    // Extract constitution text - can be string or object with type property
    let constitutionText = "";
    if (typeof reportData.constitution === "string") {
      constitutionText = reportData.constitution;
    } else if (
      reportData.constitution &&
      typeof reportData.constitution === "object" &&
      "type" in reportData.constitution
    ) {
      constitutionText = reportData.constitution.type;
    }

    // Factor 3: Constitution balance
    const constitutionLower = constitutionText.toLowerCase();
    if (constitutionLower.includes("balanced") || constitutionLower.includes("harmonious")) {
      score += 15;
    } else if (constitutionLower.includes("deficient") || constitutionLower.includes("stagnant")) {
      score -= 10;
    }

    // Ensure score is within 0-100 range
    return Math.max(0, Math.min(100, Math.round(score)));
  } catch (e) {
    logger.error("calculateOverallScore", "Error calculating overall score", e);
    return 70; // Default neutral score
  }
}
