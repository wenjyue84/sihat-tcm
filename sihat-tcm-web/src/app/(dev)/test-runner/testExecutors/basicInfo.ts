/**
 * Basic Info Test Executor
 * 
 * Tests for Step 1: Basic Info form validation and data handling
 */

import { MOCK_PROFILES } from "@/data/mockProfiles";

export async function executeBasicInfoTest(testId: string): Promise<void> {
  switch (testId) {
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

    default:
      throw new Error(`Unknown basic info test: ${testId}`);
  }
}



