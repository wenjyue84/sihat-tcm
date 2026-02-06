/**
 * Utility functions for parsing and cleaning TCM data strings.
 * Helps prevent raw JSON or malformed text from displaying in the UI.
 *
 * Moved from tcm-utils.ts for better organization
 */

export interface ParsedConstitution {
  type: string;
  tendencies?: string;
  characteristics?: string;
  percentage_match?: string;
}

export interface ParsedDiagnosis {
  primary_pattern: string;
  secondary_patterns?: string[];
  affected_organs?: string[];
  pathomechanism?: string;
}

/**
 * Safely extracts a clean title from diagnosis data.
 * Handles strings, objects, and null/undefined values.
 */
export const extractDiagnosisTitle = (value: string | object | undefined | null): string => {
  if (!value) return "TCM Health Assessment";

  // If it's already an object, extract the primary_pattern directly
  if (typeof value === "object" && value !== null) {
    const obj = value as any;
    return obj.primary_pattern || obj.pattern || obj.diagnosis || "TCM Health Assessment";
  }

  // If it's a string that looks like JSON, try to parse and extract
  if (typeof value === "string" && value.trim().startsWith("{") && value.trim().endsWith("}")) {
    try {
      const parsed = JSON.parse(value);
      return (
        parsed.primary_pattern || parsed.pattern || parsed.diagnosis || "TCM Health Assessment"
      );
    } catch {
      // Regex fallback
      const match = value.match(/"(?:primary_pattern|pattern|diagnosis)"\s*:\s*"([^"]+)"/);
      if (match) return match[1];
    }
  }

  // Return as-is but truncate if suspiciously long
  if (typeof value === "string") {
    return value.length > 100 ? value.substring(0, 97) + "..." : value;
  }

  // Fallback for any other type
  return "TCM Health Assessment";
};

/**
 * Safely parses constitution data which might be a JSON string, a plain string, or an object.
 */
export const parseConstitution = (
  value: string | object | undefined | null
): ParsedConstitution => {
  if (!value) return { type: "General" };

  // If it's already an object, extract the fields directly
  if (typeof value === "object" && value !== null) {
    const obj = value as any;
    return {
      type: obj.type || obj.constitution_type || "General",
      tendencies: obj.tendencies,
      characteristics: obj.characteristics,
      percentage_match: obj.percentage_match,
    };
  }

  // If it's a string that looks like JSON, try to parse and extract
  if (typeof value === "string" && value.trim().startsWith("{") && value.trim().endsWith("}")) {
    try {
      const parsed = JSON.parse(value);
      return {
        type: parsed.type || parsed.constitution_type || "General",
        tendencies: parsed.tendencies,
        characteristics: parsed.characteristics,
        percentage_match: parsed.percentage_match,
      };
    } catch {
      // Regex fallbacks for common fields
      const typeMatch = value.match(/"type"\s*:\s*"([^"]+)"/);
      const tendenciesMatch = value.match(/"tendencies"\s*:\s*"([^"]+)"/);
      return {
        type: typeMatch ? typeMatch[1] : "General",
        tendencies: tendenciesMatch ? tendenciesMatch[1] : undefined,
      };
    }
  }

  // If it's a plain string, return it as the type
  if (typeof value === "string") {
    return { type: value };
  }

  // Fallback
  return { type: "General" };
};

/**
 * Returns just the type name of the constitution.
 * Handles strings, objects, and null/undefined values.
 */
export const extractConstitutionType = (value: string | object | undefined | null): string => {
  return parseConstitution(value).type;
};
