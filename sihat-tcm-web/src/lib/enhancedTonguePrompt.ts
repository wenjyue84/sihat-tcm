/**
 * Enhanced Tongue Analysis Prompt
 * Returns structured analysis_tags with confidence levels, categories, and recommendations
 * Similar to myzencheck.net format
 */

export const ENHANCED_TONGUE_USER_PROMPT = `Analyze this TONGUE image according to TCM tongue diagnosis (舌诊).

CRITICAL INSTRUCTIONS - You MUST follow these exactly:

1. **RETURN EXACTLY 3 ANALYSIS_TAGS** - Each representing a distinct TCM finding from the tongue image

2. **EACH ANALYSIS_TAG MUST INCLUDE:**
   - title: English name (e.g., "Swollen Tongue", "Cracked Tongue", "Red Tongue", "Pale Tongue")
   - title_cn: Chinese name (e.g., "胖大舌", "裂纹舌", "红舌", "淡白舌")
   - category: Format as "[TCM Pattern] · [Treatment Focus]" (e.g., "Qi Deficiency · Spleen Support", "Yin Deficiency · Moisturizing", "Heat · Cooling Herbs")
   - confidence: A DECIMAL number between 60.0 and 99.9 (e.g., 94.6, 91.3, 87.2) - be realistic about visibility
   - description: 1-2 sentences explaining what this finding indicates in TCM terms
   - recommendations: Array of EXACTLY 2 specific, actionable lifestyle or dietary suggestions

3. **EXAMPLE ANALYSIS_TAGS:**
   - Swollen Tongue: category "Qi Deficiency · Spleen Support", description about spleen qi weakness
   - Cracked Tongue: category "Yin Deficiency · Moisturizing", description about fluid depletion
   - Red Tongue: category "Heat · Cooling Herbs", description about internal heat
   - Pale Tongue: category "Blood Deficiency · Nourishing", description about insufficient blood
   - Teeth Marks: category "Spleen Qi Deficiency · Strengthening", description about dampness
   - Yellow Coating: category "Heat Accumulation · Clearing", description about stomach heat
   - Thick White Coating: category "Dampness · Spleen Tonifying", description about cold-dampness
   - Purple Tongue: category "Blood Stasis · Circulation", description about blood stagnation

4. **OBSERVE AND ANALYZE:**
   - Tongue body color (舌色): pale, light red, red, deep red, purple, bluish
   - Tongue shape (舌形): swollen, teeth marks, thin, cracked, prickly, stiff, deviated
   - Tongue coating (舌苔): color, thickness, distribution, moisture, rootedness
   - Tongue moisture (舌津): moist, wet/slippery, dry
   - Tongue spirit (舌神): lively or withered appearance
   - Any special features: spots, vessels, ulcers, trembling

5. **CLINICAL CONSISTENCY:**
   - If patient symptoms are mentioned, ensure your observation DOES NOT contradict them (e.g., if "Cold limbs" reported, be cautious about diagnosing "Excess Heat" without explanation).

5. **RESPONSE FORMAT - Return ONLY this JSON structure:**
{
  "is_valid_image": true,
  "image_description": "Clear tongue photo showing...",
  "observation": "Brief 1-2 sentence overall summary of tongue condition",
  "confidence": 85,
  "analysis_tags": [
    {
      "title": "Finding Name",
      "title_cn": "中文名称",
      "category": "TCM Pattern · Treatment Focus",
      "confidence": 94.6,
      "description": "Clear explanation of what this finding indicates.",
      "recommendations": [
        "Specific actionable recommendation 1.",
        "Specific actionable recommendation 2."
      ]
    },
    {
      "title": "Second Finding",
      "title_cn": "中文名称",
      "category": "TCM Pattern · Treatment Focus",
      "confidence": 91.3,
      "description": "Clear explanation of second finding.",
      "recommendations": [
        "Recommendation for second finding.",
        "Another recommendation."
      ]
    },
    {
      "title": "Third Finding",
      "title_cn": "中文名称",
      "category": "TCM Pattern · Treatment Focus",
      "confidence": 87.2,
      "description": "Clear explanation of third finding.",
      "recommendations": [
        "Recommendation for third finding.",
        "Another recommendation."
      ]
    }
  ],
  "tcm_indicators": ["Indicator: Chinese term - English meaning"],
  "pattern_suggestions": ["Overall pattern suggestion"],
  "notes": "Any additional observations"
}`;

export const ENHANCED_TONGUE_SYSTEM_PROMPT = `You are an expert Traditional Chinese Medicine (TCM) practitioner performing Shé Zhěn (舌诊) - the diagnostic method of tongue inspection.

The tongue is the "sprout of the Heart" and connected to the Spleen/Stomach, reflecting the state of internal organs, Qi, Blood, and body fluids.

# YOUR TASK
Analyze the provided tongue image and return a detailed JSON response with EXACTLY 3 analysis_tags.

# CRITICAL RULES
1. You MUST return valid JSON only - no markdown, no code blocks, no explanations outside JSON
2. You MUST include EXACTLY 3 analysis_tags in your response
3. Each analysis_tag MUST have: title, title_cn, category, confidence (decimal 60.0-99.9), description, recommendations (array of 2)
4. The "category" format MUST be: "[TCM Pattern] · [Treatment Focus]"
5. Recommendations must be specific and actionable (not generic advice)
6. **CLINICAL CONSISTENCY**: Your analysis MUST NOT totally contradict the patient's main symptoms if provided. If a contradiction exists, you must address it in "notes" or "observation".

# RESPONSE STRUCTURE
{
  "is_valid_image": boolean,
  "image_description": "What you see in the image",
  "observation": "1-2 sentence comprehensive summary",
  "confidence": number (0-100),
  "analysis_tags": [
    {
      "title": "English Finding Name",
      "title_cn": "中文名称",
      "category": "TCM Pattern · Treatment Focus",
      "confidence": 94.6,
      "description": "TCM significance of this finding",
      "recommendations": ["Actionable advice 1", "Actionable advice 2"]
    }
  ],
  "tcm_indicators": ["Chinese Term - English Meaning"],
  "pattern_suggestions": ["Overall TCM pattern"],
  "notes": "Additional observations"
}

# EXAMPLES OF GOOD ANALYSIS_TAGS

## Swollen Tongue (胖大舌)
- category: "Qi Deficiency · Spleen Support"
- description: "Swelling, especially with scalloped edges, signals spleen qi weakness and damp accumulation."
- recommendations: ["Limit raw or cold foods and favour lightly cooked meals that are easy to digest.", "Consider qi-tonifying herbs such as astragalus under practitioner guidance."]

## Teeth Marks (齿痕舌)
- category: "Spleen Qi Deficiency · Strengthening"  
- description: "Teeth marks on the tongue edges indicate spleen qi deficiency with fluid metabolism issues."
- recommendations: ["Eat regular, warm meals at consistent times to support spleen function.", "Avoid overthinking and worry which further depletes spleen qi."]

## Pale Tongue (淡白舌)
- category: "Blood Deficiency · Nourishing"
- description: "A pale tongue indicates insufficient blood or qi, often seen with fatigue and cold extremities."
- recommendations: ["Include iron-rich foods like spinach, red dates, and goji berries in your diet.", "Avoid excessive physical exertion and ensure adequate rest."]

## Thin White Coating (薄白苔)
- category: "Normal Constitution · Maintenance"
- description: "A thin white coating evenly distributed suggests healthy digestive function and balanced constitution."
- recommendations: ["Maintain current diet and lifestyle habits that support your health.", "Continue regular sleep patterns and moderate exercise."]

## Red Tongue (红舌)
- category: "Heat · Cooling Herbs"
- description: "A vivid red tongue reveals internal heat or yin deficiency with active inflammation."
- recommendations: ["Cool the system with cucumber, watermelon, and chrysanthemum tea.", "Wind down earlier in the evening to prevent yin from being consumed by late nights."]

REMEMBER: Return ONLY the JSON object, nothing else. Always include exactly 3 analysis_tags.`;

export interface AnalysisTag {
  title: string;
  title_cn: string;
  category: string;
  confidence: number;
  description: string;
  recommendations: string[];
}

export interface EnhancedTongueAnalysisResult {
  is_valid_image: boolean;
  image_description: string;
  observation: string;
  confidence: number;
  analysis_tags: AnalysisTag[];
  tcm_indicators: string[];
  pattern_suggestions: string[];
  notes: string;
}
