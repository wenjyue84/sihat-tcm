/**
 * Medical history parser - converts text into structured condition tags
 */

export interface MedicalCondition {
  name: string;
  category: string;
  color: string;
  severity?: "mild" | "moderate" | "severe";
}

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  cardiovascular: ["heart", "cardiac", "hypertension", "blood pressure", "cardiovascular", "coronary", "arrhythmia"],
  metabolic: ["diabetes", "prediabetes", "metabolic", "insulin", "glucose", "cholesterol", "triglyceride"],
  renal: ["kidney", "renal", "nephritis", "nephropathy", "egfr", "creatinine"],
  gastrointestinal: ["gastritis", "gastro", "hiatal hernia", "gastroparesis", "liver", "fatty liver", "hepatitis"],
  musculoskeletal: ["arthritis", "bone", "osteoporosis", "sciatica", "avascular necrosis", "knee", "hip", "joint"],
  neurological: ["anxiety", "insomnia", "depression", "migraine", "headache", "seizure"],
  respiratory: ["asthma", "copd", "bronchitis", "pneumonia"],
  other: [],
};

const CATEGORY_COLORS: Record<string, string> = {
  cardiovascular: "#ef4444", // red
  metabolic: "#f59e0b", // amber
  renal: "#3b82f6", // blue
  gastrointestinal: "#8b5cf6", // purple
  musculoskeletal: "#06b6d4", // cyan
  neurological: "#ec4899", // pink
  respiratory: "#10b981", // emerald
  other: "#6b7280", // gray
};

/**
 * Parse medical history text into structured conditions
 */
export function parseMedicalHistory(text: string | null | undefined): MedicalCondition[] {
  if (!text || !text.trim()) {
    return [];
  }

  // Split by common delimiters
  const conditions = text
    .split(/[,;，；\n\r]+/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

  return conditions.map((conditionText) => {
    const lowerText = conditionText.toLowerCase();
    
    // Find category by keyword matching
    let category = "other";
    for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      if (keywords.some((keyword) => lowerText.includes(keyword))) {
        category = cat;
        break;
      }
    }

    // Extract severity if mentioned
    let severity: "mild" | "moderate" | "severe" | undefined;
    if (lowerText.includes("mild")) severity = "mild";
    else if (lowerText.includes("moderate")) severity = "moderate";
    else if (lowerText.includes("severe") || lowerText.includes("stage 4") || lowerText.includes("stage 3")) {
      severity = "severe";
    }

    // Clean up condition name (remove stage numbers, severity words)
    let cleanName = conditionText
      .replace(/\s*\([^)]*\)/g, "") // Remove parentheses content
      .replace(/\s*stage\s*\d+/gi, "")
      .replace(/\s*(mild|moderate|severe)\s*/gi, "")
      .trim();

    // If name is too short after cleaning, use original
    if (cleanName.length < 3) {
      cleanName = conditionText.trim();
    }

    return {
      name: cleanName,
      category,
      color: CATEGORY_COLORS[category],
      severity,
    };
  });
}

/**
 * Group conditions by category
 */
export function groupConditionsByCategory(
  conditions: MedicalCondition[]
): Record<string, MedicalCondition[]> {
  return conditions.reduce((acc, condition) => {
    if (!acc[condition.category]) {
      acc[condition.category] = [];
    }
    acc[condition.category].push(condition);
    return acc;
  }, {} as Record<string, MedicalCondition[]>);
}

