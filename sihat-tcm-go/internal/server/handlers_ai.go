package server

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"sihattcm/internal/gemini"
)

// ---- shared request/response types ----

// aiMessage mirrors the {role, content} shape used by the web app.
type aiMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// ---- private helpers ----

// aiReadJSON decodes at most 8 MB from r.Body into dst.
func aiReadJSON(w http.ResponseWriter, r *http.Request, dst any) bool {
	r.Body = http.MaxBytesReader(w, r.Body, 8<<20)
	dec := json.NewDecoder(r.Body)
	if err := dec.Decode(dst); err != nil {
		http.Error(w, `{"error":"invalid JSON"}`, http.StatusBadRequest)
		return false
	}
	return true
}

// aiMessagesToContents converts the web-app message array to gemini.Content
// slices, mapping role "assistant" → "model" and skipping "system" entries.
func aiMessagesToContents(msgs []aiMessage) []gemini.Content {
	out := make([]gemini.Content, 0, len(msgs))
	for _, m := range msgs {
		if m.Role == "system" {
			continue
		}
		role := m.Role
		if role == "assistant" {
			role = "model"
		}
		out = append(out, gemini.Content{
			Role:  role,
			Parts: []gemini.Part{{Text: m.Content}},
		})
	}
	return out
}

// aiSystemContent wraps a prompt string as a systemInstruction Content.
func aiSystemContent(prompt string) *gemini.Content {
	return &gemini.Content{Parts: []gemini.Part{{Text: prompt}}}
}

// aiLanguageInstruction returns a one-line language enforcement directive.
// Mirrors getSimpleLanguageInstruction from languageInstructions.ts.
func aiLanguageInstruction(lang string) string {
	switch lang {
	case "zh":
		return "语言要求：你必须完全使用中文回复。所有问诊对话必须使用简体中文。\n请使用简单易懂的中文，确保老年患者能够理解。不要使用英文或马来文。"
	case "ms":
		return "KEPERLUAN BAHASA: Anda MESTI menjawab sepenuhnya dalam Bahasa Malaysia. Tanya soalan dan berikan semua respons dalam Bahasa Malaysia yang jelas dan mudah."
	default: // "en"
		return "LANGUAGE REQUIREMENT: You MUST respond entirely in English. Ask questions and provide all responses in clear, simple English."
	}
}

// aiStrictLanguageInstruction returns the strict (report-level) variant.
func aiStrictLanguageInstruction(lang string) string {
	switch lang {
	case "zh":
		return "重要提示：你必须完全使用中文回复。所有文字，包括标题、诊断术语、食物名称和建议都必须使用中文。\n- 不要使用英文。\n- 不要使用拼音。\n请确保所有内容对不懂英文的老年华人用户友好。使用简体中文。"
	case "ms":
		return "PENTING: Anda MESTI menjawab sepenuhnya dalam Bahasa Malaysia. Semua teks, termasuk tajuk seksyen, terma diagnosis, nama makanan, dan cadangan mesti dalam Bahasa Malaysia. Jangan gunakan huruf Cina atau perkataan Inggeris."
	default:
		return "IMPORTANT: You MUST respond entirely in English. All text, including section headers, diagnosis terms, food names, and recommendations must be in English.\n- DO NOT use any Chinese characters.\n- DO NOT use Pinyin.\n- Translate all TCM terms into standard English medical/TCM terminology."
	}
}

// aiFriendlyLanguageInstruction returns the short friendly variant for report-chat.
func aiFriendlyLanguageInstruction(lang string) string {
	switch lang {
	case "zh":
		return "你必须完全使用简体中文回复。语言要清晰、友好、有教育性。"
	case "ms":
		return "Anda MESTI menjawab sepenuhnya dalam Bahasa Malaysia. Jelas, mesra, dan bersifat mendidik."
	default:
		return "You MUST respond entirely in English. Be clear, friendly, and educational."
	}
}

// aiStream writes the streaming response from StreamWithFallback.
// It sets Content-Type and X-Model-Used before the first byte, then flushes
// each chunk so clients consuming text/plain streams see incremental output.
// Returns false if the stream fails before any bytes are written (caller should 500).
func (s *Server) aiStream(
	w http.ResponseWriter,
	r *http.Request,
	models []string,
	req gemini.GenerateRequest,
	extraHeaders map[string]string,
) {
	flusher, canFlush := w.(http.Flusher)

	// We need to capture whether headers have been sent yet; we send them on
	// the first onText callback so we can still 500 on immediate failure.
	headersSent := false
	var usedModel string

	onText := func(chunk string) {
		if !headersSent {
			w.Header().Set("Content-Type", "text/plain; charset=utf-8")
			w.Header().Set("X-Content-Type-Options", "nosniff")
			if usedModel != "" {
				w.Header().Set("X-Model-Used", usedModel)
			}
			for k, v := range extraHeaders {
				w.Header().Set(k, v)
			}
			w.WriteHeader(http.StatusOK)
			headersSent = true
		}
		_, _ = io.WriteString(w, chunk)
		if canFlush {
			flusher.Flush()
		}
	}

	// StreamWithFallback calls onText for each chunk; usedModel is set after
	// the first successful model begins streaming (we approximate by setting it
	// just before the call — the header goes out on first chunk).
	// We must iterate manually so we can tag the model before chunks arrive.
	var lastErr error
	for _, m := range models {
		usedModel = m
		_, _, err := s.AI.StreamWithFallback(r.Context(), []string{m}, req, onText)
		if err == nil {
			return
		}
		lastErr = err
		if headersSent {
			// Already started streaming; can't change status.
			return
		}
	}

	// All models failed and no bytes were written.
	if !headersSent {
		s.JSONError(w, http.StatusInternalServerError,
			fmt.Sprintf("AI stream failed: %v", lastErr))
	}
}

// ---- handler: POST /api/chat ----

func (s *Server) handleChat(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Messages  []aiMessage `json:"messages"`
		BasicInfo *struct {
			Name   string `json:"name"`
			Age    any    `json:"age"`
			Gender string `json:"gender"`
			Height any    `json:"height"`
			Weight any    `json:"weight"`
			// Symptoms is `any` because the web wizard sends an array
			// (e.g. ["headache","fatigue"]) while other callers send a string.
			// It is only ever interpolated with %v, so both shapes are safe.
			Symptoms        any    `json:"symptoms"`
			SymptomDuration string `json:"symptomDuration"`
		} `json:"basicInfo"`
		Model    string `json:"model"`
		Language string `json:"language"`
	}
	if !aiReadJSON(w, r, &body) {
		return
	}

	lang := body.Language
	if lang == "" {
		lang = "en"
	}
	model := body.Model
	if model == "" {
		model = "gemini-2.0-flash"
	}

	// Build system prompt.
	systemPrompt := s.SystemPrompt(r.Context(), PromptDoctorChat)
	systemPrompt = aiLanguageInstruction(lang) + "\n\n" + systemPrompt

	// Append patient context if provided.
	if bi := body.BasicInfo; bi != nil {
		systemPrompt += fmt.Sprintf(`

═══════════════════════════════════════════════════════════════════════════════
                          患者信息 PATIENT INFORMATION
═══════════════════════════════════════════════════════════════════════════════

Name: %v
Age: %v
Gender: %v
Height: %v
Weight: %v
Chief Complaint: %v
Symptom Duration: %v

**INSTRUCTION:** Use this information as context. Build upon their chief complaint with your first question. Do NOT repeat this information back to the patient.`,
			bi.Name, bi.Age, bi.Gender, bi.Height, bi.Weight, bi.Symptoms, bi.SymptomDuration)
	}

	// Filter system messages; seed an initial user turn if empty.
	msgs := aiMessagesToContents(body.Messages)
	if len(msgs) == 0 {
		seed := map[string]string{
			"en": "Please start the consultation by asking me relevant questions about my symptoms.",
			"zh": "请开始问诊，询问我有关症状的相关问题。",
			"ms": "Sila mulakan perundingan dengan bertanya soalan berkaitan gejala saya.",
		}
		text, ok := seed[lang]
		if !ok {
			text = seed["en"]
		}
		msgs = []gemini.Content{{Role: "user", Parts: []gemini.Part{{Text: text}}}}
	}

	req := gemini.GenerateRequest{
		Contents:          msgs,
		SystemInstruction: aiSystemContent(systemPrompt),
	}
	s.aiStream(w, r, []string{model, "gemini-1.5-flash"}, req, nil)
}

// ---- handler: POST /api/consult ----

func (s *Server) handleConsult(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Data     json.RawMessage `json:"data"`
		Model    string          `json:"model"`
		Language string          `json:"language"`
	}
	if !aiReadJSON(w, r, &body) {
		return
	}

	lang := body.Language
	if lang == "" {
		lang = "en"
	}
	model := body.Model
	if model == "" {
		model = "gemini-1.5-flash"
	}

	// System prompt with strict language enforcement.
	systemPrompt := s.SystemPrompt(r.Context(), PromptDoctorFinal)
	systemPrompt = aiStrictLanguageInstruction(lang) + "\n\n" + systemPrompt

	// Marshal the entire data blob as the user prompt so the model sees all
	// examination fields exactly as the TS route does.
	dataJSON, err := json.MarshalIndent(json.RawMessage(body.Data), "", "  ")
	if err != nil {
		s.JSONError(w, http.StatusBadRequest, "invalid data payload")
		return
	}
	userPrompt := string(dataJSON)

	req := gemini.GenerateRequest{
		Contents:          []gemini.Content{{Role: "user", Parts: []gemini.Part{{Text: userPrompt}}}},
		SystemInstruction: aiSystemContent(systemPrompt),
		// Ask for JSON output and disable thinking so the streamed report is
		// reliably parseable (thinking tokens otherwise destabilise the large
		// JSON). The client (parseAndRenderReport) JSON.parses the full body.
		GenerationConfig: &gemini.GenerationConfig{
			ResponseMimeType: "application/json",
			MaxOutputTokens:  8192,
			ThinkingConfig:   gemini.NoThinking,
		},
	}
	// STREAM a single generation (not buffer+retry): streaming keeps the
	// connection alive and returns as soon as the model finishes (~8s), whereas
	// buffering with multiple retries can exceed proxy timeouts and looks like a
	// hang. On the rare malformed-JSON response the client retries once.
	models := []string{model, "gemini-1.5-flash", "gemini-2.0-flash"}
	s.aiStream(w, r, models, req, nil)
}

// ---- handler: POST /api/report-chat ----

func (s *Server) handleReportChat(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Messages    []aiMessage     `json:"messages"`
		ReportData  json.RawMessage `json:"reportData"`
		PatientInfo *struct {
			Name     string `json:"name"`
			Age      any    `json:"age"`
			Gender   string `json:"gender"`
			Symptoms string `json:"symptoms"`
		} `json:"patientInfo"`
		Language string `json:"language"`
		Model    string `json:"model"`
	}
	if !aiReadJSON(w, r, &body) {
		return
	}

	lang := body.Language
	if lang == "" {
		lang = "en"
	}
	model := body.Model
	if model == "" {
		model = "gemini-2.0-flash"
	}

	// Build report context summary (mirrors buildReportContext in TS).
	reportCtx := aiFormatReportContext(body.ReportData, body.PatientInfo)

	basePrompt := s.SystemPrompt(r.Context(), PromptDoctorReportChat)
	systemPrompt := fmt.Sprintf(`%s

%s

═══════════════════════════════════════════════════════════════════════════════
                          PATIENT'S TCM DIAGNOSIS REPORT
═══════════════════════════════════════════════════════════════════════════════

%s

═══════════════════════════════════════════════════════════════════════════════`,
		aiFriendlyLanguageInstruction(lang),
		basePrompt,
		reportCtx)

	contents := aiMessagesToContents(body.Messages)
	if len(contents) == 0 {
		s.JSONError(w, http.StatusBadRequest, "messages required")
		return
	}

	req := gemini.GenerateRequest{
		Contents:          contents,
		SystemInstruction: aiSystemContent(systemPrompt),
	}
	s.aiStream(w, r, []string{model, "gemini-1.5-flash", "gemini-2.0-flash"}, req, nil)
}

// aiFormatReportContext converts raw JSON report data + patient info into a
// plain-text context block, mirroring buildReportContext from report-chat/route.ts.
func aiFormatReportContext(reportRaw json.RawMessage, patientInfo any) string {
	var ctx string

	// Decode patientInfo if available.
	if patientInfo != nil {
		b, _ := json.Marshal(patientInfo)
		var pi struct {
			Name     string `json:"name"`
			Age      any    `json:"age"`
			Gender   string `json:"gender"`
			Symptoms string `json:"symptoms"`
		}
		if json.Unmarshal(b, &pi) == nil {
			ctx += fmt.Sprintf("PATIENT INFORMATION:\n- Name: %v\n- Age: %v\n- Gender: %v\n- Chief Complaint: %v\n",
				pi.Name, pi.Age, pi.Gender, pi.Symptoms)
		}
	}

	// Decode report fields.
	var report map[string]json.RawMessage
	if json.Unmarshal(reportRaw, &report) != nil {
		return ctx
	}

	// Diagnosis.
	if raw, ok := report["diagnosis"]; ok {
		var diag struct {
			PrimaryPattern    string   `json:"primary_pattern"`
			SecondaryPatterns []string `json:"secondary_patterns"`
			AffectedOrgans    []string `json:"affected_organs"`
		}
		if json.Unmarshal(raw, &diag) == nil && diag.PrimaryPattern != "" {
			ctx += "\nMAIN DIAGNOSIS (辨证): " + diag.PrimaryPattern + "\n"
			if len(diag.SecondaryPatterns) > 0 {
				ctx += fmt.Sprintf("Secondary Patterns: %v\n", diag.SecondaryPatterns)
			}
			if len(diag.AffectedOrgans) > 0 {
				ctx += fmt.Sprintf("Affected Organs: %v\n", diag.AffectedOrgans)
			}
		} else {
			// Fallback: emit raw string.
			ctx += "\nMAIN DIAGNOSIS (辨证): " + string(raw) + "\n"
		}
	}

	// Constitution.
	if raw, ok := report["constitution"]; ok {
		var con struct {
			Type        string `json:"type"`
			Description string `json:"description"`
		}
		if json.Unmarshal(raw, &con) == nil && con.Type != "" {
			ctx += "\nCONSTITUTION TYPE: " + con.Type + "\n"
			if con.Description != "" {
				ctx += "Description: " + con.Description + "\n"
			}
		}
	}

	// Analysis.
	if raw, ok := report["analysis"]; ok {
		var an struct {
			Summary          string `json:"summary"`
			PatternRationale string `json:"pattern_rationale"`
		}
		if json.Unmarshal(raw, &an) == nil && an.Summary != "" {
			ctx += "\nFINAL ANALYSIS (综合诊断): " + an.Summary + "\n"
			if an.PatternRationale != "" {
				ctx += "Rationale: " + an.PatternRationale + "\n"
			}
		}
	}

	// Recommendations (abbreviated).
	if raw, ok := report["recommendations"]; ok {
		var recs struct {
			FoodTherapy *struct {
				Beneficial []string `json:"beneficial"`
				Avoid      []string `json:"avoid"`
			} `json:"food_therapy"`
			Lifestyle      []string `json:"lifestyle"`
			Acupoints      []string `json:"acupoints"`
			Exercise       []string `json:"exercise"`
			HerbalFormulas []struct {
				Name string `json:"name"`
			} `json:"herbal_formulas"`
			SleepGuidance string `json:"sleep_guidance"`
			EmotionalCare string `json:"emotional_care"`
		}
		if json.Unmarshal(raw, &recs) == nil {
			ctx += "\nRECOMMENDATIONS:\n"
			if recs.FoodTherapy != nil {
				if len(recs.FoodTherapy.Beneficial) > 0 {
					ctx += fmt.Sprintf("- Beneficial Foods: %v\n", recs.FoodTherapy.Beneficial)
				}
				if len(recs.FoodTherapy.Avoid) > 0 {
					ctx += fmt.Sprintf("- Foods to Avoid: %v\n", recs.FoodTherapy.Avoid)
				}
			}
			if len(recs.Lifestyle) > 0 {
				ctx += fmt.Sprintf("- Lifestyle Advice: %v\n", recs.Lifestyle)
			}
			if len(recs.Acupoints) > 0 {
				ctx += fmt.Sprintf("- Acupressure Points: %v\n", recs.Acupoints)
			}
			if len(recs.Exercise) > 0 {
				ctx += fmt.Sprintf("- Exercise: %v\n", recs.Exercise)
			}
			if recs.SleepGuidance != "" {
				ctx += "- Sleep Guidance: " + recs.SleepGuidance + "\n"
			}
			if recs.EmotionalCare != "" {
				ctx += "- Emotional Wellness: " + recs.EmotionalCare + "\n"
			}
			if len(recs.HerbalFormulas) > 0 {
				names := make([]string, len(recs.HerbalFormulas))
				for i, f := range recs.HerbalFormulas {
					names[i] = f.Name
				}
				ctx += fmt.Sprintf("- Herbal Formulas: %v\n", names)
			}
		}
	}

	// Precautions.
	if raw, ok := report["precautions"]; ok {
		var prec struct {
			WarningSigns      []string `json:"warning_signs"`
			Contraindications []string `json:"contraindications"`
		}
		if json.Unmarshal(raw, &prec) == nil {
			ctx += "\nPRECAUTIONS:\n"
			if len(prec.WarningSigns) > 0 {
				ctx += fmt.Sprintf("- Warning Signs: %v\n", prec.WarningSigns)
			}
			if len(prec.Contraindications) > 0 {
				ctx += fmt.Sprintf("- Contraindications: %v\n", prec.Contraindications)
			}
		}
	}

	// Follow-up.
	if raw, ok := report["follow_up"]; ok {
		var fu struct {
			Timeline            string `json:"timeline"`
			ExpectedImprovement string `json:"expected_improvement"`
		}
		if json.Unmarshal(raw, &fu) == nil {
			ctx += "\nFOLLOW-UP:\n"
			if fu.Timeline != "" {
				ctx += "- Timeline: " + fu.Timeline + "\n"
			}
			if fu.ExpectedImprovement != "" {
				ctx += "- Expected Improvement: " + fu.ExpectedImprovement + "\n"
			}
		}
	}

	return ctx
}

// ---- handler: POST /api/western-chat ----

func (s *Server) handleWesternChat(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Messages      []aiMessage     `json:"messages"`
		SystemPrompt  string          `json:"systemPrompt"`
		TCMReportData json.RawMessage `json:"tcmReportData"`
		PatientInfo   *struct {
			Name     string `json:"name"`
			Age      any    `json:"age"`
			Gender   string `json:"gender"`
			Symptoms string `json:"symptoms"`
		} `json:"patientInfo"`
		Model    string `json:"model"`
		Language string `json:"language"`
	}
	if !aiReadJSON(w, r, &body) {
		return
	}

	lang := body.Language
	if lang == "" {
		lang = "en"
	}
	model := body.Model
	if model == "" {
		model = "gemini-2.0-flash"
	}

	// Use provided systemPrompt or fall back to stored western-chat prompt.
	basePrompt := body.SystemPrompt
	if basePrompt == "" {
		basePrompt = s.SystemPrompt(r.Context(), PromptDoctorWesternChat)
	}

	// Language instruction for western chat (friendly variant).
	langInstr := map[string]string{
		"en": "You MUST respond entirely in English. Be clear, friendly, and professional.",
		"zh": "你必须完全使用简体中文回复。语言要清晰、友好、专业。",
		"ms": "Anda MESTI menjawab sepenuhnya dalam Bahasa Malaysia. Jelas, mesra, dan profesional.",
	}
	li, ok := langInstr[lang]
	if !ok {
		li = langInstr["en"]
	}

	// Build TCM context from report data.
	tcmCtx := aiFormatTCMContext(body.TCMReportData, body.PatientInfo)

	systemPrompt := fmt.Sprintf(`%s

%s

═══════════════════════════════════════════════════════════════════════════════
                          PATIENT'S TCM DIAGNOSIS REPORT
═══════════════════════════════════════════════════════════════════════════════

%s

═══════════════════════════════════════════════════════════════════════════════`,
		li, basePrompt, tcmCtx)

	contents := aiMessagesToContents(body.Messages)
	if len(contents) == 0 {
		s.JSONError(w, http.StatusBadRequest, "messages required")
		return
	}

	req := gemini.GenerateRequest{
		Contents:          contents,
		SystemInstruction: aiSystemContent(systemPrompt),
	}
	// Cascade mirrors the TS FALLBACK_MODELS list.
	models := []string{"gemini-2.5-flash", "gemini-2.0-flash-exp", "gemini-2.0-flash"}
	// If the caller specified a model, try it first.
	if model != "" && model != models[0] {
		models = append([]string{model}, models...)
	}
	s.aiStream(w, r, models, req, nil)
}

// aiFormatTCMContext mirrors buildTCMContext from western-chat/route.ts.
func aiFormatTCMContext(reportRaw json.RawMessage, patientInfo any) string {
	var ctx string

	if patientInfo != nil {
		b, _ := json.Marshal(patientInfo)
		var pi struct {
			Name     string `json:"name"`
			Age      any    `json:"age"`
			Gender   string `json:"gender"`
			Symptoms string `json:"symptoms"`
		}
		if json.Unmarshal(b, &pi) == nil {
			ctx += fmt.Sprintf("PATIENT INFORMATION:\n- Name: %v\n- Age: %v\n- Gender: %v\n- Chief Complaint: %v\n",
				pi.Name, pi.Age, pi.Gender, pi.Symptoms)
		}
	}

	if len(reportRaw) == 0 {
		return ctx + "\n(No TCM diagnosis report data available)"
	}

	var report map[string]json.RawMessage
	if json.Unmarshal(reportRaw, &report) != nil {
		return ctx
	}

	if raw, ok := report["diagnosis"]; ok {
		var diag struct {
			PrimaryPattern    string   `json:"primary_pattern"`
			SecondaryPatterns []string `json:"secondary_patterns"`
			AffectedOrgans    []string `json:"affected_organs"`
		}
		if json.Unmarshal(raw, &diag) == nil && diag.PrimaryPattern != "" {
			ctx += "\nTCM DIAGNOSIS (辨证): " + diag.PrimaryPattern + "\n"
			if len(diag.SecondaryPatterns) > 0 {
				ctx += fmt.Sprintf("Secondary Patterns: %v\n", diag.SecondaryPatterns)
			}
			if len(diag.AffectedOrgans) > 0 {
				ctx += fmt.Sprintf("Affected Organs: %v\n", diag.AffectedOrgans)
			}
		}
	}

	if raw, ok := report["constitution"]; ok {
		var con struct {
			Type        string `json:"type"`
			Description string `json:"description"`
		}
		if json.Unmarshal(raw, &con) == nil && con.Type != "" {
			ctx += "\nCONSTITUTION TYPE: " + con.Type + "\n"
			if con.Description != "" {
				ctx += "Description: " + con.Description + "\n"
			}
		}
	}

	if raw, ok := report["analysis"]; ok {
		var an struct {
			Summary          string `json:"summary"`
			PatternRationale string `json:"pattern_rationale"`
		}
		if json.Unmarshal(raw, &an) == nil && an.Summary != "" {
			ctx += "\nFINAL ANALYSIS (综合诊断): " + an.Summary + "\n"
			if an.PatternRationale != "" {
				ctx += "Rationale: " + an.PatternRationale + "\n"
			}
		}
	}

	// Summarised recommendations (first 5 beneficial foods, first 3 lifestyle items).
	if raw, ok := report["recommendations"]; ok {
		var recs struct {
			FoodTherapy *struct {
				Beneficial []string `json:"beneficial"`
			} `json:"food_therapy"`
			Lifestyle []string `json:"lifestyle"`
		}
		if json.Unmarshal(raw, &recs) == nil {
			ctx += "\nTCM RECOMMENDATIONS (Summary):\n"
			if recs.FoodTherapy != nil && len(recs.FoodTherapy.Beneficial) > 0 {
				top := recs.FoodTherapy.Beneficial
				if len(top) > 5 {
					top = top[:5]
				}
				ctx += fmt.Sprintf("- Beneficial Foods: %v\n", top)
			}
			if len(recs.Lifestyle) > 0 {
				top := recs.Lifestyle
				if len(top) > 3 {
					top = top[:3]
				}
				ctx += fmt.Sprintf("- Lifestyle Advice: %v\n", top)
			}
		}
	}

	return ctx
}

// ---- handler: POST /api/heart-companion (+ OPTIONS) ----

func (s *Server) handleHeartCompanion(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Messages []aiMessage `json:"messages"`
		Language string      `json:"language"`
		Model    string      `json:"model"`
		Profile  *struct {
			Name   string `json:"name"`
			Age    any    `json:"age"`
			Gender string `json:"gender"`
		} `json:"profile"`
	}
	if !aiReadJSON(w, r, &body) {
		return
	}

	lang := body.Language
	if lang == "" {
		lang = "en"
	}
	model := body.Model
	if model == "" {
		model = "gemini-2.0-flash"
	}

	systemPrompt := s.SystemPrompt(r.Context(), PromptHeartCompanion)
	systemPrompt = aiLanguageInstruction(lang) + "\n\n" + systemPrompt

	if p := body.Profile; p != nil {
		name := p.Name
		if name == "" {
			name = "Friend"
		}
		systemPrompt += fmt.Sprintf(`

═══════════════════════════════════════════════════════════════════════════════
                           USER CONTEXT
═══════════════════════════════════════════════════════════════════════════════

Name: %v
`, name)
		if p.Age != nil {
			systemPrompt += fmt.Sprintf("Age: %v\n", p.Age)
		}
		if p.Gender != "" {
			systemPrompt += "Gender: " + p.Gender + "\n"
		}
		systemPrompt += "\n**INSTRUCTION:** Use this information to personalize your responses naturally. Address them by name when appropriate, but keep it friendly and casual."
	}

	msgs := aiMessagesToContents(body.Messages)
	if len(msgs) == 0 {
		s.JSONError(w, http.StatusBadRequest, "messages required")
		return
	}

	temp := 0.8
	req := gemini.GenerateRequest{
		Contents:          msgs,
		SystemInstruction: aiSystemContent(systemPrompt),
		GenerationConfig:  &gemini.GenerationConfig{Temperature: &temp},
	}

	corsHeaders := map[string]string{
		"Access-Control-Allow-Origin": "*",
	}
	s.aiStream(w, r, []string{model, "gemini-1.5-flash"}, req, corsHeaders)
}

func (s *Server) handleHeartCompanionOPTIONS(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
	w.WriteHeader(http.StatusNoContent)
}

// ---- handler: POST /api/admin/assistant ----

func (s *Server) handleAdminAssistant(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Messages []aiMessage `json:"messages"`
	}
	if !aiReadJSON(w, r, &body) {
		return
	}

	systemPrompt := `You are the 'Admin Assistant' for the Sihat TCM platform. You help administrators manage the application.

Current System Context:
- Platform: Sihat TCM (AI-powered Traditional Chinese Medicine diagnosis)
- Admin Capabilities:
  1. User Management (Roles: admin, doctor, user, developer)
  2. Practitioner Directory (Manage doctor profiles)
  3. System Prompts (Configure AI personas for diagnosis steps: Inquiry, Tongue, Face, Listen, Final)
  4. Security Settings (Audit logs, password policies)
  5. CMS (Manage blog content in English/Malay/Chinese)
- AI Models Used: Gemini 2.0 Flash (Physician), Gemini 2.5 Pro (Expert), Gemini 3.0 Preview (Master)

Your Role:
- Explain how to use the admin dashboard features.
- Troubleshoot configuration issues (e.g., "Why is the tongue analysis failing?").
- Suggest improvements for system prompts.
- Be concise, professional, and helpful.

If asked about specific user data, remind the admin to check the "User Management" tab directly as you don't have real-time DB access in this chat.`

	contents := aiMessagesToContents(body.Messages)
	if len(contents) == 0 {
		s.JSONError(w, http.StatusBadRequest, "messages required")
		return
	}

	req := gemini.GenerateRequest{
		Contents:          contents,
		SystemInstruction: aiSystemContent(systemPrompt),
	}
	s.aiStream(w, r, []string{"gemini-2.0-flash"}, req, nil)
}

// ---- handler: POST /api/developer/assistant ----

func (s *Server) handleDeveloperAssistant(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Messages []aiMessage `json:"messages"`
	}
	if !aiReadJSON(w, r, &body) {
		return
	}

	systemPrompt := `You are the 'Developer Assistant' for the Sihat TCM platform. You help developers debug, troubleshoot, and understand the codebase.

Current System Context:
- Platform: Sihat TCM (AI-powered Traditional Chinese Medicine diagnosis)
- Tech Stack:
  * Frontend: Next.js 16 (App Router), TypeScript, Tailwind CSS v4, Radix UI, Framer Motion
  * Backend: Supabase (PostgreSQL, Auth, Storage), Edge Functions
  * AI: Gemini 2.0 Flash, Gemini 2.5 Pro, @ai-sdk/google
  * Mobile: Expo SDK 54, React Native 0.81 (JavaScript)

Architecture Overview:
- Web app: src/app/* (Next.js App Router structure)
- Components: src/components/* (diagnosis/, admin/, patient/, blog/, ui/)
- API Routes: src/app/api/* (analyze-image, chat, report-chat, admin/, developer/)
- Contexts: AuthContext (user/roles), DeveloperContext (dev mode), LanguageContext
- Lib: src/lib/* (supabase/, translations/, systemPrompts.ts, actions.ts)

Key Features:
1. TCM Diagnosis Flow: Inquiry chat -> Tongue analysis -> Face analysis -> Pulse -> Listening -> Final Report
2. AI Analysis: Image analysis for tongue/face/body, audio analysis for voice/cough
3. Multi-language: English, Malay (ms), Chinese (zh)
4. Roles: admin, doctor, patient, developer

Known Issues & Gotchas:
- Circular imports: Mobile colors MUST come from constants/Colors.js, not App.js
- Tailwind v4 uses CSS-based config, not tailwind.config.js
- CORS headers needed for mobile requests on different origins
- Image analysis accepts base64 in request body
- Mobile app is JavaScript-only (no TypeScript)

API Endpoints:
- POST /api/analyze-image - Tongue/Face/Body image analysis
- POST /api/analyze-audio - Voice/Cough audio analysis
- POST /api/chat - Inquiry conversation
- POST /api/report-chat - Follow-up questions on diagnosis report
- POST /api/generate-infographic - Create shareable diagnosis infographic
- GET /api/config - Public app configuration
- Admin APIs: /api/admin/settings, /api/admin/assistant, /api/admin/db-status

Database Tables (Supabase):
- profiles: user profiles with role, preferences
- diagnosis_history: saved diagnosis reports
- medical_reports: uploaded medical documents
- practitioners: doctor directory
- admin_settings: system configuration
- articles_en/ms/zh: blog content by language

Your Role:
- Help debug code issues and explain error messages
- Explain the codebase architecture and data flow
- Suggest solutions for common development problems
- Provide code snippets and examples when helpful
- Explain API usage and integration patterns
- Be concise and technical, assume developer expertise

When providing code, use TypeScript for web and JavaScript for mobile.`

	contents := aiMessagesToContents(body.Messages)
	if len(contents) == 0 {
		s.JSONError(w, http.StatusBadRequest, "messages required")
		return
	}

	req := gemini.GenerateRequest{
		Contents:          contents,
		SystemInstruction: aiSystemContent(systemPrompt),
	}
	s.aiStream(w, r, []string{"gemini-2.0-flash"}, req, nil)
}

// ---- route registration ----

// registerAIRoutes registers all AI streaming routes on s.Mux.
func (s *Server) registerAIRoutes() {
	// Public chat endpoints — rate-limited.
	s.Mux.HandleFunc("POST /api/chat",
		s.RateLimit(20, 500, s.handleChat))

	s.Mux.HandleFunc("POST /api/consult",
		s.RateLimit(20, 500, s.handleConsult))

	s.Mux.HandleFunc("POST /api/report-chat",
		s.RateLimit(20, 500, s.handleReportChat))

	s.Mux.HandleFunc("POST /api/western-chat",
		s.RateLimit(20, 500, s.handleWesternChat))

	// Heart Companion — CORS required for mobile/cross-origin clients.
	s.Mux.HandleFunc("POST /api/heart-companion",
		s.RateLimit(20, 500, s.handleHeartCompanion))
	s.Mux.HandleFunc("OPTIONS /api/heart-companion",
		s.handleHeartCompanionOPTIONS)

	// Admin & developer assistants — no additional rate limit beyond server-level.
	s.Mux.HandleFunc("POST /api/admin/assistant", s.handleAdminAssistant)
	s.Mux.HandleFunc("POST /api/developer/assistant", s.handleDeveloperAssistant)
}
