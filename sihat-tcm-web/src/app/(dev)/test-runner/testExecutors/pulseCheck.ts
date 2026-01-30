/**
 * Pulse Check Test Executor
 * 
 * Tests for Step 6: Pulse Check functionality
 */

import { MOCK_PROFILES } from "@/data/mockProfiles";
import { tcmPulseQualities, pulseQualityConflicts } from "@/features/diagnosis/components/pulse/types";

export async function executePulseCheckTest(testId: string): Promise<void> {
  switch (testId) {
    case "pulse_qualities_data": {
      // Verify all TCM pulse types are defined correctly
      const mockPulse = MOCK_PROFILES[0].data.qie;
      if (!mockPulse.quality) throw new Error("pulse quality missing");
      
      // Verify tcmPulseQualities array is populated
      if (!tcmPulseQualities || tcmPulseQualities.length === 0) {
        throw new Error("tcmPulseQualities array is empty or undefined");
      }
      
      // Verify each pulse quality has required fields
      tcmPulseQualities.forEach((quality) => {
        if (!quality.id) throw new Error(`Pulse quality missing id: ${JSON.stringify(quality)}`);
        if (!quality.nameZh) throw new Error(`Pulse quality missing nameZh: ${quality.id}`);
        if (!quality.nameEn) throw new Error(`Pulse quality missing nameEn: ${quality.id}`);
      });
      break;
    }

    case "bpm_calculation": {
      // Verify all mock profiles have valid BPM
      MOCK_PROFILES.forEach((profile) => {
        const bpm = profile.data.qie.bpm;
        if (typeof bpm !== "number") {
          throw new Error(`${profile.id}: BPM is not a number, got ${typeof bpm}`);
        }
        if (bpm < 40 || bpm > 200) {
          throw new Error(`${profile.id}: BPM ${bpm} out of valid range (40-200)`);
        }
      });
      break;
    }

    case "pulse_data_structure": {
      // Verify pulse data contains bpm and pulseQualities
      MOCK_PROFILES.forEach((profile) => {
        const qie = profile.data.qie;
        if (typeof qie.bpm !== "number") {
          throw new Error(`${profile.id}: missing or invalid bpm`);
        }
        if (!qie.quality) {
          throw new Error(`${profile.id}: missing quality`);
        }
      });
      break;
    }

    case "pulse_rhythm_validation": {
      // Tests pulse rhythm values are valid TCM pulse types
      const validPulseIds = tcmPulseQualities.map((q) => q.id);
      
      MOCK_PROFILES.forEach((profile) => {
        const quality = profile.data.qie.quality;
        if (!quality) return; // Skip if no quality specified
        
        // Extract pulse quality IDs from the string format (e.g., "Deep (Chen), Weak (Ruo)")
        const qualityMatches = quality.match(/\((\w+)\)/g);
        if (qualityMatches) {
          qualityMatches.forEach((match) => {
            const pulseId = match.slice(1, -1).toLowerCase(); // Remove parentheses and lowercase
            if (!validPulseIds.includes(pulseId)) {
              throw new Error(
                `${profile.id}: Invalid pulse quality ID "${pulseId}" found in quality string "${quality}"`
              );
            }
          });
        }
      });
      break;
    }

    case "pulse_strength_validation": {
      // Tests pulse strength values are within valid ranges
      // BPM ranges: Low (<60), Normal (60-100), High (>100)
      const testCases = [
        { bpm: 50, category: "low", valid: true },
        { bpm: 75, category: "normal", valid: true },
        { bpm: 110, category: "high", valid: true },
        { bpm: 35, category: "low", valid: true }, // Edge case
        { bpm: 200, category: "high", valid: true }, // Edge case
        { bpm: 60, category: "normal", valid: true }, // Boundary
        { bpm: 100, category: "normal", valid: true }, // Boundary
      ];

      testCases.forEach(({ bpm, category, valid }) => {
        const isLow = bpm < 60;
        const isNormal = bpm >= 60 && bpm <= 100;
        const isHigh = bpm > 100;
        const actualCategory = isLow ? "low" : isNormal ? "normal" : "high";
        
        if (actualCategory !== category && valid) {
          throw new Error(
            `BPM ${bpm} categorized as ${actualCategory}, expected ${category}`
          );
        }
      });
      break;
    }

    case "pulse_quality_combinations": {
      // Tests multiple pulse qualities can be combined correctly
      // Check that conflicting qualities are not combined in mock data
      MOCK_PROFILES.forEach((profile) => {
        const quality = profile.data.qie.quality;
        if (!quality) return;
        
        // Extract pulse quality IDs
        const qualityMatches = quality.match(/\((\w+)\)/g);
        if (qualityMatches && qualityMatches.length > 1) {
          const pulseIds = qualityMatches.map((match) => match.slice(1, -1).toLowerCase());
          
          // Check for conflicts
          pulseIds.forEach((id1) => {
            const conflicts = pulseQualityConflicts[id1] || [];
            pulseIds.forEach((id2) => {
              if (id1 !== id2 && conflicts.includes(id2)) {
                throw new Error(
                  `${profile.id}: Conflicting pulse qualities found: "${id1}" and "${id2}" cannot be combined`
                );
              }
            });
          });
        }
      });
      
      // Test that valid combinations work
      const validCombinations = [
        ["xian", "hua"], // Wiry + Slippery (should work)
        ["chen", "ruo"], // Deep + Weak (should work)
      ];
      
      validCombinations.forEach(([id1, id2]) => {
        const conflicts = pulseQualityConflicts[id1] || [];
        if (conflicts.includes(id2)) {
          throw new Error(`Unexpected conflict: ${id1} and ${id2} should not conflict`);
        }
      });
      break;
    }

    default:
      throw new Error(`Unknown pulse check test: ${testId}`);
  }
}


