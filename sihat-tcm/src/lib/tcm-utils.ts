/**
 * Utility functions for parsing and cleaning TCM data strings.
 * Helps prevent raw JSON or malformed text from displaying in the UI.
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
 */
export const extractDiagnosisTitle = (value: string | undefined | null): string => {
    if (!value) return 'TCM Health Assessment';

    // If it looks like JSON, try to parse and extract
    if (typeof value === 'string' && value.trim().startsWith('{') && value.trim().endsWith('}')) {
        try {
            const parsed = JSON.parse(value);
            return parsed.primary_pattern
                || parsed.pattern
                || parsed.diagnosis
                || 'TCM Health Assessment';
        } catch {
            // Regex fallback
            const match = value.match(/"(?:primary_pattern|pattern|diagnosis)"\s*:\s*"([^"]+)"/);
            if (match) return match[1];
        }
    }

    // Return as-is but truncate if suspiciously long
    return value.length > 100 ? value.substring(0, 97) + '...' : value;
};

/**
 * Safely parses constitution data which might be a JSON string or a plain string.
 */
export const parseConstitution = (value: string | undefined | null): ParsedConstitution => {
    if (!value) return { type: 'General' };

    if (typeof value === 'string' && value.trim().startsWith('{') && value.trim().endsWith('}')) {
        try {
            const parsed = JSON.parse(value);
            return {
                type: parsed.type || parsed.constitution_type || 'General',
                tendencies: parsed.tendencies,
                characteristics: parsed.characteristics,
                percentage_match: parsed.percentage_match
            };
        } catch {
            // Regex fallbacks for common fields
            const typeMatch = value.match(/"type"\s*:\s*"([^"]+)"/);
            const tendenciesMatch = value.match(/"tendencies"\s*:\s*"([^"]+)"/);
            return {
                type: typeMatch ? typeMatch[1] : 'General',
                tendencies: tendenciesMatch ? tendenciesMatch[1] : undefined
            };
        }
    }

    return { type: value };
};

/**
 * Returns just the type name of the constitution.
 */
export const extractConstitutionType = (value: string | undefined | null): string => {
    return parseConstitution(value).type;
};
