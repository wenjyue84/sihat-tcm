package server

import (
	"encoding/json"
	"fmt"
	"net/http"
	"regexp"
	"strconv"
	"strings"

	"sihattcm/internal/gemini"
)

// ---- shared helpers (an* prefix to avoid collisions with sibling handler files) ----

// anReadJSON decodes the request body into dst; writes 400 and returns false on error.
func anReadJSON(w http.ResponseWriter, r *http.Request, dst any) bool {
	if err := json.NewDecoder(r.Body).Decode(dst); err != nil {
		http.Error(w, `{"error":"invalid JSON body"}`, http.StatusBadRequest)
		return false
	}
	return true
}

// anStripDataURL separates a data URL "data:<mime>;base64,<data>" into (mime, base64data).
// If the string has no data URL prefix, the original string is returned as base64data
// with the fallback mime type.
func anStripDataURL(s, fallbackMime string) (mime, b64 string) {
	if strings.HasPrefix(s, "data:") {
		semi := strings.Index(s, ";base64,")
		if semi > 0 {
			mime = s[5:semi]
			b64 = s[semi+8:]
			return
		}
	}
	return fallbackMime, s
}

// anDetectMime guesses the MIME type from file name or existing mime string.
func anDetectMime(existing, fileName string) string {
	if existing != "" && existing != "application/octet-stream" {
		return existing
	}
	lower := strings.ToLower(fileName)
	switch {
	case strings.HasSuffix(lower, ".pdf"):
		return "application/pdf"
	case strings.HasSuffix(lower, ".jpg") || strings.HasSuffix(lower, ".jpeg"):
		return "image/jpeg"
	case strings.HasSuffix(lower, ".png"):
		return "image/png"
	case strings.HasSuffix(lower, ".gif"):
		return "image/gif"
	case strings.HasSuffix(lower, ".webp"):
		return "image/webp"
	}
	return "image/png"
}

// anCleanJSON strips Markdown code fences that some model responses include.
func anCleanJSON(s string) string {
	s = strings.TrimSpace(s)
	s = strings.TrimPrefix(s, "```json")
	s = strings.TrimPrefix(s, "```")
	s = strings.TrimSuffix(s, "```")
	return strings.TrimSpace(s)
}

// anValidObs returns true if the text looks like a real clinical observation
// (not a refusal or empty stub).
func anValidObs(text string) bool {
	if len(strings.TrimSpace(text)) < 50 {
		return false
	}
	lower := strings.ToLower(text)
	for _, pat := range []string{
		"cannot analyze", "unable to analyze", "no observation",
		"unclear image", "cannot see", "not visible",
		"i cannot", "i'm unable", "sorry",
	} {
		if strings.Contains(lower, pat) {
			return false
		}
	}
	return true
}

// anModelStatus returns a user-friendly status string for a model ID.
func anModelStatus(modelID string) string {
	switch modelID {
	case "gemini-2.0-flash":
		return "Using rapid analysis..."
	case "gemini-1.5-flash":
		return "Using standard analysis..."
	case "gemini-2.5-pro":
		return "Using expert-level analysis..."
	case "gemini-2.5-flash":
		return "Using advanced analysis..."
	}
	return "Analysis complete"
}

// ---- POST /api/analyze-image ----

// Enhanced tongue system prompt (ported from src/lib/enhancedTonguePrompt.ts).
const anEnhancedTongueSysPrompt = `You are an expert Traditional Chinese Medicine (TCM) practitioner performing Shé Zhěn (舌诊) - the diagnostic method of tongue inspection.

The tongue is the "sprout of the Heart" and connected to the Spleen/Stomach, reflecting the state of internal organs, Qi, Blood, and body fluids.

# YOUR TASK
Analyze the provided tongue image and return a detailed JSON response with EXACTLY 3 analysis_tags.

# CRITICAL RULES
1. You MUST return valid JSON only - no markdown, no code blocks, no explanations outside JSON
2. You MUST include EXACTLY 3 analysis_tags in your response
3. Each analysis_tag MUST have: title, title_cn, category, confidence (decimal 60.0-99.9), description, recommendations (array of 2)
4. The "category" format MUST be: "[TCM Pattern] · [Treatment Focus]"
5. Recommendations must be specific and actionable (not generic advice)
6. CLINICAL CONSISTENCY: Your analysis MUST NOT totally contradict the patient's main symptoms if provided. If a contradiction exists, you must address it in "notes" or "observation".

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
}`

const anEnhancedTongueUserPrompt = `Analyze this TONGUE image according to TCM tongue diagnosis (舌诊).

CRITICAL INSTRUCTIONS - You MUST follow these exactly:

1. RETURN EXACTLY 3 ANALYSIS_TAGS - Each representing a distinct TCM finding from the tongue image

2. EACH ANALYSIS_TAG MUST INCLUDE:
   - title: English name (e.g., "Swollen Tongue", "Cracked Tongue", "Red Tongue", "Pale Tongue")
   - title_cn: Chinese name (e.g., "胖大舌", "裂纹舌", "红舌", "淡白舌")
   - category: Format as "[TCM Pattern] · [Treatment Focus]" (e.g., "Qi Deficiency · Spleen Support")
   - confidence: A DECIMAL number between 60.0 and 99.9 (e.g., 94.6, 91.3, 87.2)
   - description: 1-2 sentences explaining what this finding indicates in TCM terms
   - recommendations: Array of EXACTLY 2 specific, actionable lifestyle or dietary suggestions

3. OBSERVE AND ANALYZE:
   - Tongue body color (舌色): pale, light red, red, deep red, purple, bluish
   - Tongue shape (舌形): swollen, teeth marks, thin, cracked, prickly, stiff, deviated
   - Tongue coating (舌苔): color, thickness, distribution, moisture, rootedness
   - Tongue moisture (舌津): moist, wet/slippery, dry
   - Any special features: spots, vessels, ulcers, trembling

4. RESPONSE FORMAT - Return ONLY this JSON structure (no markdown):
{
  "is_valid_image": true,
  "image_description": "Clear tongue photo showing...",
  "observation": "Brief 1-2 sentence overall summary of tongue condition",
  "confidence": 85,
  "analysis_tags": [...],
  "tcm_indicators": ["Indicator: Chinese term - English meaning"],
  "pattern_suggestions": ["Overall pattern suggestion"],
  "notes": "Any additional observations"
}`

// anTypeLabel returns a human-readable label for an image analysis type.
func anTypeLabel(kind string) string {
	switch kind {
	case "tongue":
		return "tongue"
	case "face":
		return "face"
	case "part", "body":
		return "body area"
	}
	if kind == "" {
		return "image"
	}
	return kind
}

// anVisualPromptFor returns a (system, user) prompt pair for NON-tongue visual
// analysis (face 面诊, body/part 望诊). Kept separate from the tongue prompt so
// a valid face/body photo is not rejected as "not a tongue".
func anVisualPromptFor(kind string) (sys, user string) {
	label := anTypeLabel(kind)
	sys = fmt.Sprintf(`You are an expert Traditional Chinese Medicine (TCM) practitioner performing visual inspection (望诊) of a %s.
Analyse the provided %s image and report clinically relevant TCM signs (complexion, colour, lustre, features, regions).
Return ONLY a valid JSON object — NO markdown, NO code fences.
Set "is_valid_image" to false ONLY if the image clearly does not show a %s at all.`, label, label, label)
	user = fmt.Sprintf(`Analyse this %s image for TCM diagnostic purposes.
Return a JSON object with these fields:
{
  "is_valid_image": boolean,
  "image_description": "what is visible in the image",
  "observation": "1-3 sentence comprehensive clinical summary",
  "confidence": number (0-100),
  "analysis_tags": [ up to 3 objects: {"title","title_cn","category","confidence","description","recommendations":["","",]} ],
  "tcm_indicators": ["..."],
  "pattern_suggestions": ["..."],
  "notes": "additional observations"
}`, label)
	return
}

// anJSONStrFieldRE matches a top-level "field": "string value" pair, tolerating
// escaped quotes inside the value.
var anJSONStrFieldRE = map[string]*regexp.Regexp{}

// anExtractJSONString pulls the value of a "field": "..." string out of a
// possibly-malformed / truncated JSON blob. Returns "" if not found. This
// salvages the observation when the model emits invalid JSON (common with large
// structured Chinese responses) so the user still sees a real analysis instead
// of an empty box or a raw JSON dump.
func anExtractJSONString(raw, field string) string {
	re, ok := anJSONStrFieldRE[field]
	if !ok {
		re = regexp.MustCompile(`"` + regexp.QuoteMeta(field) + `"\s*:\s*"((?:[^"\\]|\\.)*)"`)
		anJSONStrFieldRE[field] = re
	}
	m := re.FindStringSubmatch(raw)
	if len(m) < 2 {
		return ""
	}
	// Re-parse as a JSON string literal to unescape \n, \", \uXXXX, etc.
	var out string
	if err := json.Unmarshal([]byte(`"`+m[1]+`"`), &out); err == nil {
		return out
	}
	return m[1]
}

// anExtractJSONBool pulls a "field": true|false out of malformed JSON.
func anExtractJSONBool(raw, field string) (val, ok bool) {
	re := regexp.MustCompile(`"` + regexp.QuoteMeta(field) + `"\s*:\s*(true|false)`)
	m := re.FindStringSubmatch(raw)
	if len(m) < 2 {
		return false, false
	}
	return m[1] == "true", true
}

func (s *Server) handleAnalyzeImage(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		s.JSONError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	var body struct {
		Image         string `json:"image"`
		Type          string `json:"type"`
		Symptoms      string `json:"symptoms"`
		MainComplaint string `json:"mainComplaint"`
	}
	if !anReadJSON(w, r, &body) {
		return
	}
	if body.Image == "" {
		s.JSONError(w, http.StatusBadRequest, "image is required")
		return
	}

	// Resolve prompts. Tongue uses the enhanced 舌诊 prompt (or DB override);
	// face/body use their OWN visual prompt — never the tongue prompt, or a
	// valid face/body photo gets wrongly rejected as "not a tongue".
	isTongue := body.Type == "tongue"
	var sysPrompt, userPrompt string
	if isTongue {
		sysPrompt = s.SystemPrompt(r.Context(), PromptDoctorImage)
		if sysPrompt == "" {
			sysPrompt = anEnhancedTongueSysPrompt
		}
		userPrompt = anEnhancedTongueUserPrompt
	} else {
		sysPrompt, userPrompt = anVisualPromptFor(body.Type)
	}

	// Append patient context.
	if body.Symptoms != "" || body.MainComplaint != "" {
		userPrompt += fmt.Sprintf(
			"\n\nPATIENT CONTEXT:\nMain Complaint: %s\nSymptoms: %s",
			strOrDefault(body.MainComplaint, "Not provided"),
			strOrDefault(body.Symptoms, "Not provided"),
		)
	}

	// Strip data URL prefix; detect MIME.
	mime, b64 := anStripDataURL(body.Image, "image/jpeg")
	if mime == "" {
		mime = "image/jpeg"
	}

	models := []string{"gemini-2.0-flash", "gemini-1.5-flash"}

	for idx, model := range models {
		req := gemini.GenerateRequest{
			Contents: []gemini.Content{
				{
					Role: "user",
					Parts: []gemini.Part{
						{Text: userPrompt},
						{InlineData: &gemini.InlineData{MimeType: mime, Data: b64}},
					},
				},
			},
			GenerationConfig: &gemini.GenerationConfig{
				ResponseMimeType: "application/json",
				MaxOutputTokens:  4096,
				// Disable thinking: the mapped models are thinking models, and
				// thinking tokens destabilise large JSON output (truncated /
				// invalid JSON). Disabling makes structured extraction reliable,
				// faster, and cheaper on the free tier.
				ThinkingConfig: gemini.NoThinking,
			},
		}
		if sysPrompt != "" {
			req.SystemInstruction = &gemini.Content{Parts: []gemini.Part{{Text: sysPrompt}}}
		}

		text, err := s.AI.Generate(r.Context(), model, req)
		if err != nil || strings.TrimSpace(text) == "" {
			continue
		}

		clean := anCleanJSON(text)

		// Parse strictly; on failure, SALVAGE fields from the (often slightly
		// malformed or truncated) JSON rather than leaking raw braces to the user.
		var data map[string]any
		parsed := json.Unmarshal([]byte(clean), &data) == nil

		var observation, imageDesc string
		confidence := 100.0
		isValidImage := true
		if parsed {
			confidence = floatVal(data, "confidence", 100)
			isValidImage = boolVal(data, "is_valid_image", true)
			imageDesc = stringVal(data, "image_description", "")
			observation = firstStringVal(data, "observation", "analysis", "description")
		} else {
			observation = anExtractJSONString(clean, "observation")
			imageDesc = anExtractJSONString(clean, "image_description")
			if v, ok := anExtractJSONBool(clean, "is_valid_image"); ok {
				isValidImage = v
			}
			if c := anExtractJSONString(clean, "confidence"); c != "" {
				if f, e := strconv.ParseFloat(strings.TrimSpace(c), 64); e == nil {
					confidence = f
				}
			}
			// Nothing usable recovered → try the next model.
			if strings.TrimSpace(observation) == "" && strings.TrimSpace(imageDesc) == "" {
				continue
			}
		}

		// Invalid / unclear image → return a clear message AS the observation so
		// the UI shows real feedback instead of the empty "AI observation will
		// appear here" placeholder.
		if !isValidImage || confidence < 60 {
			msg := strings.TrimSpace(fmt.Sprintf(
				"This image does not appear to be a clear %s photo. %s Please retake it in good lighting and try again.",
				anTypeLabel(body.Type), imageDesc,
			))
			s.JSON(w, http.StatusOK, map[string]any{
				"observation":       msg,
				"message":           msg,
				"potential_issues":  []any{},
				"modelUsed":         idx + 1,
				"status":            "invalid_image",
				"confidence":        confidence,
				"image_description": imageDesc,
			})
			return
		}

		if strings.TrimSpace(observation) == "" {
			observation = imageDesc
		}

		if anValidObs(observation) {
			resp := map[string]any{
				"observation":       observation,
				"potential_issues":  []any{},
				"modelUsed":         idx + 1,
				"status":            anModelStatus(model),
				"confidence":        confidence,
				"image_description": imageDesc,
			}
			if parsed {
				resp["potential_issues"] = anySliceVal(data, "potential_issues", "issues", "indications", "pattern_suggestions")
				resp["analysis_tags"] = sliceVal(data, "analysis_tags")
				resp["tcm_indicators"] = sliceVal(data, "tcm_indicators")
				resp["pattern_suggestions"] = sliceVal(data, "pattern_suggestions")
				resp["notes"] = stringVal(data, "notes", "")
			}
			s.JSON(w, http.StatusOK, resp)
			return
		}
	}

	// All models failed.
	s.JSON(w, http.StatusOK, map[string]any{
		"observation":      "Unable to analyze the image at this time. The visual inspection results will be reviewed manually.",
		"potential_issues": []any{},
		"modelUsed":        0,
		"status":           "Analysis pending",
	})
}

// ---- POST /api/analyze-audio ----

const anAudioUserPrompt = `Please analyze this audio recording for TCM diagnostic purposes.
Listen carefully for:
1. Voice quality - strength, clarity, pitch, resonance
2. Breathing patterns - rhythm, depth, any unusual sounds
3. Speech patterns - flow, pace, coherence, emotional undertones
4. Cough sounds - if present, describe the quality and frequency

CRITICAL: If the audio is silent, contains only background noise, or no clear human voice/breathing sounds are detectable, return a JSON with "status": "silence" and "overall_observation": "No clear voice or breathing sounds detected. Please record again.". Do NOT hallucinate findings or return "normal" results for silence.

Provide your analysis in JSON format with fields: overall_observation, voice_quality_analysis, breathing_patterns, speech_patterns, cough_sounds, pattern_suggestions, status.`

func (s *Server) handleAnalyzeAudio(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		s.JSONError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	var body struct {
		Audio string `json:"audio"`
	}
	if !anReadJSON(w, r, &body) {
		return
	}
	if body.Audio == "" {
		s.JSONError(w, http.StatusBadRequest, "audio is required")
		return
	}

	mime, b64 := anStripDataURL(body.Audio, "audio/webm")
	if mime == "" {
		mime = "audio/webm"
	}

	sysPrompt := s.SystemPrompt(r.Context(), PromptDoctorListening)

	models := []string{"gemini-2.5-pro", "gemini-2.0-flash"}

	for idx, model := range models {
		req := gemini.GenerateRequest{
			Contents: []gemini.Content{
				{
					Role: "user",
					Parts: []gemini.Part{
						{Text: anAudioUserPrompt},
						{InlineData: &gemini.InlineData{MimeType: mime, Data: b64}},
					},
				},
			},
		}
		if sysPrompt != "" {
			req.SystemInstruction = &gemini.Content{Parts: []gemini.Part{{Text: sysPrompt}}}
		}

		text, err := s.AI.Generate(r.Context(), model, req)
		if err != nil || strings.TrimSpace(text) == "" {
			continue
		}

		clean := anCleanJSON(text)
		var data map[string]any
		if err := json.Unmarshal([]byte(clean), &data); err != nil {
			// Raw text fallback: if long enough return a partial response.
			if len(text) > 50 {
				s.JSON(w, http.StatusOK, map[string]any{
					"overall_observation": text,
					"voice_quality_analysis": map[string]any{
						"observation":          "Analysis available in overall observation",
						"severity":             "normal",
						"tcm_indicators":       []any{},
						"clinical_significance": "See overall observation for details",
					},
					"breathing_patterns": nil,
					"speech_patterns":    nil,
					"cough_sounds":       nil,
					"modelUsed":          idx + 1,
					"status":             "partial",
					"notes":              "Full structured analysis unavailable",
				})
				return
			}
			continue
		}

		// Valid structure check.
		if _, hasObs := data["overall_observation"]; hasObs {
			data["modelUsed"] = idx + 1
			if _, hasSt := data["status"]; !hasSt {
				data["status"] = "success"
			}
			s.JSON(w, http.StatusOK, data)
			return
		}
		if _, hasVQ := data["voice_quality_analysis"]; hasVQ {
			data["modelUsed"] = idx + 1
			if _, hasSt := data["status"]; !hasSt {
				data["status"] = "success"
			}
			s.JSON(w, http.StatusOK, data)
			return
		}
	}

	// All models failed — return placeholder.
	s.JSON(w, http.StatusOK, map[string]any{
		"overall_observation": "Audio analysis will be processed with your final diagnosis report.",
		"voice_quality_analysis": map[string]any{
			"observation":          "Voice recording received",
			"severity":             "pending",
			"tcm_indicators":       []string{"Audio recorded successfully"},
			"clinical_significance": "Will be integrated with other diagnostic data",
		},
		"breathing_patterns": map[string]any{
			"observation":          "Pending analysis",
			"severity":             "pending",
			"tcm_indicators":       []any{},
			"clinical_significance": "Pending comprehensive analysis",
		},
		"speech_patterns": map[string]any{
			"observation":          "Pending analysis",
			"severity":             "pending",
			"tcm_indicators":       []any{},
			"clinical_significance": "Will be evaluated alongside other findings",
		},
		"cough_sounds": map[string]any{
			"observation":          "Pending analysis",
			"severity":             "pending",
			"tcm_indicators":       []any{},
			"clinical_significance": "Pending",
		},
		"pattern_suggestions": []string{"Analysis pending"},
		"recommendations":     []string{"Continue with remaining diagnostic steps"},
		"confidence":          "low",
		"notes":               "Real-time audio analysis temporarily unavailable. Your recording has been saved.",
		"modelUsed":           0,
		"status":              "pending",
	})
}

// ---- POST /api/analyze-snore ----

const anSnoreSysPrompt = `You are an expert sleep sound analyst specialising in both clinical sleep science and Traditional Chinese Medicine (TCM).
Your task is to analyse audio recordings of sleep sounds and provide a multi-dimensional analysis bridging Western sleep science with TCM principles.

In TCM, snoring (Hān Mián) is often linked to:
1. Phlegm-Dampness (痰湿): heavy, gurgling or "wet" sounds.
2. Qi Deficiency (气虚): weak or inconsistent sounds indicating lack of "lifting" Qi.
3. Blood Stasis (血瘀): irregular, harsh or "choppy" sounds.

Provide specific TCM recommendations:
- Acupressure points: e.g. Lianquan (CV 23), Fengchi (GB 20), Zusanli (ST 36)
- Dietary: e.g. avoiding damp-producing foods for Phlegm-Dampness
- Lifestyle: sleeping position, breathing exercises

Return ONLY valid JSON matching the schema exactly — no markdown, no code fences.`

func (s *Server) handleAnalyzeSnore(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		s.JSONError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	var body struct {
		Audio      string `json:"audio"`
		Duration   any    `json:"duration"`
		TCMContext any    `json:"tcmContext"`
	}
	if !anReadJSON(w, r, &body) {
		return
	}
	if body.Audio == "" {
		s.JSONError(w, http.StatusBadRequest, "audio is required")
		return
	}

	// TCM context serialisation for prompt.
	tcmCtxStr := "No previous diagnosis data available."
	if body.TCMContext != nil {
		if b, err := json.Marshal(body.TCMContext); err == nil {
			tcmCtxStr = string(b)
		}
	}

	durStr := "unknown"
	if body.Duration != nil {
		durStr = fmt.Sprintf("%v", body.Duration)
	}

	userPrompt := fmt.Sprintf(`Please analyse this sleep sound recording.
The recording is %s seconds long.
Consider the patient's existing TCM context if provided.
Provide a comprehensive analysis including western severity and a deep TCM pattern analysis.

Patient TCM context:
%s

Return JSON with fields: snoring_detected (bool), severity (none/mild/moderate/severe), frequency (number), average_duration_ms (number), characteristics ([]string), apnea_risk_indicators ([]string), tcm_analysis {pattern, explanation, meridians_affected ([]string), fatigue_correlation}, tcm_recommendations (array of {type, suggestion, benefit}), confidence (0.0-1.0), raw_observations (string).`,
		durStr, tcmCtxStr)

	// audio/webm regardless of content (TS source hardcodes this).
	_, b64 := anStripDataURL(body.Audio, "audio/webm")

	req := gemini.GenerateRequest{
		Contents: []gemini.Content{
			{
				Role: "user",
				Parts: []gemini.Part{
					{Text: userPrompt},
					{InlineData: &gemini.InlineData{MimeType: "audio/webm", Data: b64}},
				},
			},
		},
		SystemInstruction: &gemini.Content{Parts: []gemini.Part{{Text: anSnoreSysPrompt}}},
		GenerationConfig: &gemini.GenerationConfig{
			ResponseMimeType: "application/json",
			MaxOutputTokens:  2048,
			ThinkingConfig:   gemini.NoThinking,
		},
	}

	text, err := s.AI.Generate(r.Context(), "gemini-2.0-flash", req)
	if err != nil {
		s.JSONError(w, http.StatusInternalServerError, "failed to analyse audio: "+err.Error())
		return
	}

	clean := anCleanJSON(text)
	var result map[string]any
	if err := json.Unmarshal([]byte(clean), &result); err != nil {
		s.JSONError(w, http.StatusInternalServerError, "failed to parse AI response")
		return
	}
	s.JSON(w, http.StatusOK, result)
}

// ---- POST /api/extract-text ----

func (s *Server) handleExtractText(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		s.JSONError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	var body struct {
		File     string `json:"file"`
		FileName string `json:"fileName"`
		FileType string `json:"fileType"`
		Mode     string `json:"mode"`
		Language string `json:"language"`
	}
	if !anReadJSON(w, r, &body) {
		return
	}
	if body.File == "" {
		s.JSONError(w, http.StatusBadRequest, "file is required")
		return
	}
	if body.Language == "" {
		body.Language = "en"
	}

	mimeFromURL, b64 := anStripDataURL(body.File, "")
	mime := anDetectMime(mimeFromURL, body.FileType+body.FileName)
	if b64 == "" {
		b64 = body.File
	}

	langLabel := map[string]string{
		"zh": "Chinese (简体中文)",
		"ms": "Malay (Bahasa Malaysia)",
		"en": "English",
	}
	lang := langLabel[body.Language]
	if lang == "" {
		lang = "English"
	}

	var prompt string
	if body.Mode == "medicine" {
		prompt = fmt.Sprintf(`You are an expert at analysing images and documents to extract medicine information.

TASK: Analyse this image/document and extract ONLY medicine-related information.

IMPORTANT RULES:
1. First, determine if this image contains ANY medicine information (medicine bottles, pills, prescriptions, packaging, pharmacy receipts, etc.)
2. If this is a food photo, random object, selfie, landscape, or anything NOT related to medicine, respond with:
   - is_medicine_image: false
   - text: A message explaining that no medicine was found
3. If this IS a medicine-related image, extract: Medicine names, Dosage, Quantity, Instructions.

RESPOND IN STRICT JSON FORMAT:
{
  "is_medicine_image": boolean,
  "text": "The formatted text (use \\n for newlines)",
  "warning": "Optional warning message"
}

Language for response: %s`, lang)
	} else {
		prompt = fmt.Sprintf(`You are an expert at analysing medical documents and images.

TASK: Extract all relevant medical information from this image/document.

Extract: Patient information (if visible), Clinical findings, Test results, Diagnoses, Any medically relevant information.

Format the output clearly and structurally.

Language for response: %s

RESPOND IN STRICT JSON FORMAT:
{
  "text": "The formatted extracted text (use \\n for newlines)"
}`, lang)
	}

	// Build inline data part — PDFs vs images use the same InlineData mechanism in the Go client.
	req := gemini.GenerateRequest{
		Contents: []gemini.Content{
			{
				Role: "user",
				Parts: []gemini.Part{
					{Text: prompt},
					{InlineData: &gemini.InlineData{MimeType: mime, Data: b64}},
				},
			},
		},
		GenerationConfig: &gemini.GenerationConfig{
			ResponseMimeType: "application/json",
			MaxOutputTokens:  4096,
			ThinkingConfig:   gemini.NoThinking,
		},
	}

	text, err := s.AI.Generate(r.Context(), "gemini-2.0-flash", req)
	if err != nil {
		s.JSONError(w, http.StatusInternalServerError, err.Error())
		return
	}

	clean := anCleanJSON(text)
	var result map[string]any
	if jsonErr := json.Unmarshal([]byte(clean), &result); jsonErr != nil {
		// Fallback: return raw text.
		s.JSON(w, http.StatusOK, map[string]any{"text": text, "warning": nil})
		return
	}

	if body.Mode == "medicine" {
		isMed, _ := result["is_medicine_image"].(bool)
		if !isMed {
			noMedMsg := map[string]string{
				"en": fmt.Sprintf("=== NO MEDICINE DETECTED ===\nFile: %s\n\nThis image does not appear to contain any medicine information.\n\nPlease upload a photo of medicine bottles, a prescription, or a pharmacy receipt.\n\nOr use the manual input field.", body.FileName),
				"zh": fmt.Sprintf("=== 未检测到药物 ===\n文件：%s\n\n此图片似乎不包含任何药物信息。\n\n请上传药瓶照片、处方文件或药房收据。\n\n或使用手动输入框输入药物名称。", body.FileName),
				"ms": fmt.Sprintf("=== TIADA UBAT DIKESAN ===\nFail: %s\n\nImej ini nampaknya tidak mengandungi sebarang maklumat ubat.\n\nSila muat naik foto botol ubat, dokumen preskripsi, atau resit farmasi.", body.FileName),
			}
			msg := noMedMsg[body.Language]
			if msg == "" {
				msg = noMedMsg["en"]
			}
			s.JSON(w, http.StatusOK, map[string]any{"text": msg, "warning": nil, "is_valid": false})
			return
		}
		s.JSON(w, http.StatusOK, map[string]any{
			"text":    anEnsureString(result["text"]),
			"warning": result["warning"],
			"is_valid": true,
		})
		return
	}

	// General mode.
	raw := result["text"]
	if raw == nil {
		raw = text
	}
	s.JSON(w, http.StatusOK, map[string]any{"text": anEnsureString(raw), "warning": nil})
}

// anEnsureString converts any value to a string, marshalling objects to JSON.
func anEnsureString(v any) string {
	if v == nil {
		return ""
	}
	if s, ok := v.(string); ok {
		return s
	}
	b, err := json.Marshal(v)
	if err != nil {
		return fmt.Sprintf("%v", v)
	}
	return string(b)
}

// ---- POST /api/validate-medicine ----

func (s *Server) handleValidateMedicine(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		s.JSONError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	var body struct {
		Text     string `json:"text"`
		Language string `json:"language"`
	}
	if !anReadJSON(w, r, &body) {
		return
	}
	if body.Text == "" {
		s.JSONError(w, http.StatusBadRequest, "text is required")
		return
	}
	if body.Language == "" {
		body.Language = "en"
	}

	prompt := fmt.Sprintf(`You are a medical assistant. Evaluate the following text: "%s"

Determine if this text represents:
1. A valid medicine name (Western, TCM, or common brand names like 'Panadol', 'Tylenol', etc).
2. A list of valid medicines.
3. A description of medicines.

Respond with a JSON object strictly in the following format:
{
    "isValid": boolean,
    "message": "string"
}

Rules:
1. Set "isValid" to true if the text IS LIKELY a medicine name, brand name, or describes medication. Be slightly more lenient.
2. Set "isValid" to false ONLY if the text is clearly NOT related to medicine (e.g. "grocery list", "random gibberish", "furniture", "hello").
3. The "message" should be in the user's language (%s).
4. If invalid, politely ask the user to input valid medicine information.
5. Do not include markdown formatting. Just the raw JSON string.`,
		body.Text, body.Language)

	text, err := s.AI.GenerateText(r.Context(), "gemini-2.0-flash", "", prompt)
	if err != nil {
		s.JSONError(w, http.StatusInternalServerError, err.Error())
		return
	}

	clean := anCleanJSON(text)
	var result map[string]any
	if err := json.Unmarshal([]byte(clean), &result); err != nil {
		s.JSONError(w, http.StatusInternalServerError, "failed to parse AI response")
		return
	}
	s.JSON(w, http.StatusOK, result)
}

// ---- POST /api/doctor/generate-inquiry ----

// anFallbackQuestions is the hardcoded fallback returned when the AI call fails.
var anFallbackQuestions = map[string]any{
	"questions": []map[string]any{
		{
			"id":       "q1",
			"question": "How is your appetite recently?",
			"choices": []map[string]string{
				{"id": "good", "label": "Good"},
				{"id": "poor", "label": "Poor"},
				{"id": "excessive", "label": "Excessive"},
				{"id": "variable", "label": "Variable"},
			},
			"multiSelect": false,
		},
		{
			"id":       "q2",
			"question": "How is your sleep quality?",
			"choices": []map[string]string{
				{"id": "good", "label": "Good"},
				{"id": "difficulty_falling", "label": "Difficulty falling asleep"},
				{"id": "waking_up", "label": "Waking up frequently"},
				{"id": "dreams", "label": "Many dreams"},
			},
			"multiSelect": true,
		},
		{
			"id":       "q3",
			"question": "How is your energy level throughout the day?",
			"choices": []map[string]string{
				{"id": "good", "label": "Good"},
				{"id": "low", "label": "Low"},
				{"id": "fluctuating", "label": "Fluctuating"},
				{"id": "exhausted", "label": "Exhausted"},
			},
			"multiSelect": false,
		},
		{
			"id":       "q4",
			"question": "Any emotional concerns?",
			"choices": []map[string]string{
				{"id": "none", "label": "None"},
				{"id": "stress", "label": "Stress"},
				{"id": "anxiety", "label": "Anxiety"},
				{"id": "irritability", "label": "Irritability"},
			},
			"multiSelect": true,
		},
		{
			"id":       "q5",
			"question": "How is your digestion?",
			"choices": []map[string]string{
				{"id": "normal", "label": "Normal"},
				{"id": "bloating", "label": "Bloating"},
				{"id": "constipation", "label": "Constipation"},
				{"id": "diarrhea", "label": "Diarrhea"},
			},
			"multiSelect": true,
		},
		{
			"id":       "q6",
			"question": "Do you tend to feel hot or cold?",
			"choices": []map[string]string{
				{"id": "normal", "label": "Normal"},
				{"id": "cold", "label": "Always feel cold"},
				{"id": "hot", "label": "Always feel hot"},
				{"id": "mixed", "label": "Cold hands/feet, hot upper body"},
			},
			"multiSelect": false,
		},
	},
}

type anPatientInfo struct {
	Age    any    `json:"age"`
	Gender string `json:"gender"`
	Height any    `json:"height"`
	Weight any    `json:"weight"`
}

func (s *Server) handleGenerateInquiry(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		s.JSONError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	var body struct {
		PatientInfo anPatientInfo `json:"patientInfo"`
		Symptoms    string        `json:"symptoms"`
	}
	if !anReadJSON(w, r, &body) {
		return
	}

	pi := body.PatientInfo
	prompt := fmt.Sprintf(`You are a Traditional Chinese Medicine (TCM) practitioner conducting a diagnostic inquiry (问诊).

Based on the following patient information:
- Age: %v
- Gender: %s
- Height: %v cm
- Weight: %v kg
- Chief Complaints/Symptoms: %s

Generate 6-8 relevant TCM diagnostic questions with multiple choice answers. The questions should help identify:
1. Pattern differentiation (寒热虚实)
2. Organ system involvement
3. Constitutional factors
4. Lifestyle and emotional factors

For each question:
- Make it clear and concise
- Provide 3-5 relevant answer choices
- Set multiSelect to true if multiple answers can apply
- Use simple, patient-friendly language

Focus on questions that would help differentiate TCM patterns based on the presenting symptoms.

Return ONLY a JSON object with a "questions" array. Each question must have: id (string), question (string), choices (array of {id, label}), multiSelect (boolean).`,
		strOrDefault(fmt.Sprintf("%v", pi.Age), "Unknown"),
		strOrDefault(pi.Gender, "Unknown"),
		strOrDefault(fmt.Sprintf("%v", pi.Height), "Unknown"),
		strOrDefault(fmt.Sprintf("%v", pi.Weight), "Unknown"),
		strOrDefault(body.Symptoms, "None provided"),
	)

	req := gemini.GenerateRequest{
		Contents: []gemini.Content{
			{Role: "user", Parts: []gemini.Part{{Text: prompt}}},
		},
		GenerationConfig: &gemini.GenerationConfig{
			ResponseMimeType: "application/json",
			MaxOutputTokens:  2048,
			ThinkingConfig:   gemini.NoThinking,
		},
	}

	text, err := s.AI.Generate(r.Context(), "gemini-2.0-flash", req)
	if err != nil || strings.TrimSpace(text) == "" {
		s.JSON(w, http.StatusOK, anFallbackQuestions)
		return
	}

	clean := anCleanJSON(text)
	var result map[string]any
	if err := json.Unmarshal([]byte(clean), &result); err != nil {
		s.JSON(w, http.StatusOK, anFallbackQuestions)
		return
	}
	s.JSON(w, http.StatusOK, result)
}

// ---- map accessor helpers (unexported, an* prefix) ----

func stringVal(m map[string]any, key, def string) string {
	if v, ok := m[key]; ok {
		if s, ok := v.(string); ok {
			return s
		}
	}
	return def
}

func firstStringVal(m map[string]any, keys ...string) string {
	for _, k := range keys {
		if v := stringVal(m, k, ""); v != "" {
			return v
		}
	}
	return ""
}

func floatVal(m map[string]any, key string, def float64) float64 {
	if v, ok := m[key]; ok {
		switch n := v.(type) {
		case float64:
			return n
		case float32:
			return float64(n)
		case int:
			return float64(n)
		case json.Number:
			if f, err := n.Float64(); err == nil {
				return f
			}
		}
	}
	return def
}

func boolVal(m map[string]any, key string, def bool) bool {
	if v, ok := m[key]; ok {
		if b, ok := v.(bool); ok {
			return b
		}
	}
	return def
}

func sliceVal(m map[string]any, key string) any {
	if v, ok := m[key]; ok {
		return v
	}
	return []any{}
}

// anySliceVal returns the first non-nil slice found across the given keys.
func anySliceVal(m map[string]any, keys ...string) any {
	for _, k := range keys {
		if v, ok := m[k]; ok && v != nil {
			return v
		}
	}
	return []any{}
}

func strOrDefault(s, def string) string {
	if s == "" || s == "<nil>" || s == "0" {
		return def
	}
	return s
}

// ---- route registration ----

// registerAnalysisRoutes wires up all analysis-related API routes.
func (s *Server) registerAnalysisRoutes() {
	s.Mux.HandleFunc("POST /api/analyze-image", s.handleAnalyzeImage)
	s.Mux.HandleFunc("POST /api/analyze-audio", s.handleAnalyzeAudio)
	s.Mux.HandleFunc("POST /api/analyze-snore", s.handleAnalyzeSnore)
	s.Mux.HandleFunc("POST /api/extract-text", s.handleExtractText)
	s.Mux.HandleFunc("POST /api/validate-medicine", s.handleValidateMedicine)
	s.Mux.HandleFunc("POST /api/doctor/generate-inquiry", s.handleGenerateInquiry)
}
