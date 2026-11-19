package server

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"

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
	if err := decodeJSONBody(r.Body, dst); err != nil {
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		http.Error(w, `{"error":"invalid JSON"}`, http.StatusBadRequest)
		return false
	}
	return true
}

// decodeJSONBody decodes exactly one JSON value into dst and rejects a literal JSON null
// (which json.Decoder silently accepts as "no change", letting an empty request through as valid).
func decodeJSONBody(body io.Reader, dst any) error {
	dec := json.NewDecoder(body)
	var raw json.RawMessage
	if err := dec.Decode(&raw); err != nil {
		return err
	}
	if strings.TrimSpace(string(raw)) == "null" {
		return fmt.Errorf("JSON null body")
	}
	return json.Unmarshal(raw, dst)
}

// aiMessagesToContents converts the web-app message array to gemini.Content slices, mapping role "assistant" →
// "model". Only the roles user / assistant / model are forwarded (case-insensitively): "system" entries and unknown
// roles are dropped, because the model API rejects invalid roles (the whole chat would 502) and a client must not
// inject instructions as a system turn. Messages with blank content are dropped too (an empty part is rejected
// upstream, which surfaced a client error as a 502).
func aiMessagesToContents(msgs []aiMessage) []gemini.Content {
	out := make([]gemini.Content, 0, len(msgs))
	for _, m := range msgs {
		var role string
		switch strings.ToLower(strings.TrimSpace(m.Role)) {
		case "user":
			role = "user"
		case "assistant", "model":
			role = "model"
		default:
			continue
		}
		if strings.TrimSpace(m.Content) == "" {
			continue
		}
		out = append(out, gemini.Content{
			Role:  role,
			Parts: []gemini.Part{{Text: m.Content}},
		})
	}
	return out
}

// ---- model allow-list ----

// aiCanonModel maps a known model id (including the legacy ones the web app used to send) to the model that is
// really called. Unknown ids map to "".
func aiCanonModel(m string) string {
	switch strings.TrimSpace(m) {
	case gemini.ModelFlash, "gemini-2.0-flash", "gemini-2.0-flash-exp", "gemini-2.5-flash":
		return gemini.ModelFlash
	case gemini.ModelLite, "gemini-1.5-flash", "gemini-2.5-flash-lite":
		return gemini.ModelLite
	case gemini.ModelPro, "gemini-1.5-pro", "gemini-2.5-pro", "gemini-2.0-flash-thinking-exp-01-21":
		return gemini.ModelPro
	}
	return ""
}

// aiModelChain builds the ordered model list for a request: the caller's choice FIRST only if it is one of the cheap
// tiers (an anonymous client must not steer cost: it could force the most expensive model, inject a query string
// into the upstream URL, or select a listener tier), then the server's own defaults. Entries keep the name they were
// given (it is what X-Model-Used reports and what the client library normalises), but two names that normalise to
// the SAME model are one entry: a failing model is never retried under another alias.
func aiModelChain(client string, defaults ...string) []string {
	out := make([]string, 0, len(defaults)+1)
	seen := map[string]bool{}
	add := func(alias string) {
		key := aiCanonModel(alias)
		if key == "" {
			key = alias
		}
		if alias != "" && !seen[key] {
			seen[key] = true
			out = append(out, alias)
		}
	}
	if c := aiCanonModel(client); c == gemini.ModelFlash || c == gemini.ModelLite {
		add(strings.TrimSpace(client))
	}
	for _, d := range defaults {
		add(d)
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
	switch aiLang(lang) {
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
	switch aiLang(lang) {
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
	switch aiLang(lang) {
	case "zh":
		return "你必须完全使用简体中文回复。语言要清晰、友好、有教育性。"
	case "ms":
		return "Anda MESTI menjawab sepenuhnya dalam Bahasa Malaysia. Jelas, mesra, dan bersifat mendidik."
	default:
		return "You MUST respond entirely in English. Be clear, friendly, and educational."
	}
}

// aiSymptomsText renders a symptoms value that clients send either as a string or as an
// array of strings (the web wizard sends an array) as one readable line.
func aiSymptomsText(v any) string {
	switch t := v.(type) {
	case nil:
		return ""
	case string:
		return t
	case []any:
		parts := make([]string, 0, len(t))
		for _, x := range t {
			if str := strings.TrimSpace(fmt.Sprint(x)); str != "" {
				parts = append(parts, str)
			}
		}
		return strings.Join(parts, ", ")
	default:
		return fmt.Sprint(t)
	}
}

// aiStream writes the streaming response from StreamWithFallback.
// It sets Content-Type and X-Model-Used before the first byte, then flushes
// each chunk so clients consuming text/plain streams see incremental output.
// If every model fails before any byte is written the client gets a JSON error (502/429/503). If the stream dies
// AFTER bytes went out (upstream connection drop, in-stream error event) the response is ABORTED, not ended: a
// clean 200 would make the client store half an answer as a complete one.
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
		text, _, err := s.AI.StreamWithFallback(r.Context(), []string{m}, req, onText)
		if err == nil && !headersSent && strings.TrimSpace(text) == "" {
			// A 200 with no content would render as a blank answer; treat it as a failure and try the next model.
			err = fmt.Errorf("empty response from model %s", m)
		}
		if err == nil {
			return
		}
		lastErr = err
		if headersSent {
			// Already started streaming; the status cannot change any more, so cut the connection: the client sees
			// a failed transfer instead of a truncated answer that looks complete.
			log.Printf("ai stream aborted mid-way (model %s): %s", m, anRedactKey(err.Error()))
			panic(http.ErrAbortHandler)
		}
	}

	// All models failed and no bytes were written.
	if !headersSent {
		if lastErr == nil {
			lastErr = fmt.Errorf("no model configured")
		}
		log.Printf("ai stream failed: %s", anRedactKey(lastErr.Error()))
		status, msg := aiUpstreamError(lastErr)
		for k, v := range extraHeaders { // e.g. CORS for the public heart-companion endpoint
			w.Header().Set(k, v)
		}
		if status == http.StatusTooManyRequests {
			w.Header().Set("Retry-After", "30") // tell the client when to come back (our own 429s do)
		}
		s.JSONError(w, status, msg)
	}
}

// aiUpstreamError maps an upstream AI failure to a client-safe status and
// message. The raw error (which may carry upstream bodies) is never returned.
func aiUpstreamError(err error) (int, string) {
	if err != nil {
		m := strings.ToLower(err.Error())
		if strings.Contains(m, "quota") || strings.Contains(m, "resource_exhausted") ||
			strings.Contains(m, "rate limit") || strings.Contains(m, "rate_limit") ||
			strings.Contains(m, "status 429") || strings.Contains(m, "error 429") {
			return http.StatusTooManyRequests, "The AI service is busy right now. Please try again in a minute."
		}
		if strings.Contains(m, "api key not configured") {
			return http.StatusServiceUnavailable, "The AI service is not configured."
		}
	}
	return http.StatusBadGateway, "The AI service is temporarily unavailable. Please try again."
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

	lang := aiLang(body.Language)

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

	// Filter system messages; seed an initial user turn if the client sent no messages at all.
	msgs := aiMessagesToContents(body.Messages)
	if len(msgs) == 0 && len(body.Messages) > 0 {
		s.JSONError(w, http.StatusBadRequest, "messages must contain at least one non-empty user message")
		return
	}
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
	s.aiStream(w, r, aiModelChain(body.Model, "gemini-2.0-flash", "gemini-1.5-flash"), req, nil)
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
	// The examination data must be a non-empty JSON OBJECT: null, {}, "", [], 0, false, a number or a string would only
	// make the model invent a diagnosis for nobody (and cost a paid call).
	var dataObj map[string]json.RawMessage
	if err := json.Unmarshal(body.Data, &dataObj); err != nil || len(dataObj) == 0 {
		s.JSONError(w, http.StatusBadRequest, "data is required and must be a non-empty object")
		return
	}

	lang := aiLang(body.Language)

	// System prompt with strict language enforcement.
	systemPrompt := aiAdaptReportPrompt(s.SystemPrompt(r.Context(), PromptDoctorFinal), lang)
	systemPrompt = aiStrictLanguageInstruction(lang) + "\n\n" + systemPrompt

	// Marshal the entire data blob as the user prompt so the model sees all
	// examination fields exactly as the TS route does.
	dataJSON, err := json.MarshalIndent(json.RawMessage(body.Data), "", "  ")
	if err != nil {
		s.JSONError(w, http.StatusBadRequest, "invalid data payload")
		return
	}
	userPrompt := string(dataJSON)
	if note := aiDeviceVitalsNote(dataObj); note != "" {
		userPrompt = note + "\n\n" + userPrompt
	}

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
	s.aiStream(w, r, aiModelChain(body.Model, "gemini-1.5-flash", "gemini-2.0-flash"), req, nil)
}

// aiDeviceVitalsNote explains qie.device_vitals to the model. The wizard attaches that list when the readings came from a
// linked device (Web Bluetooth strap / cuff / oximeter / thermometer, or synced Google Health / Apple Health / Shortcut
// data) instead of being typed in: they are measured values with a named source and time, but still single readings.
func aiDeviceVitalsNote(data map[string]json.RawMessage) string {
	raw, ok := data["qie"]
	if !ok {
		return ""
	}
	var qie struct {
		DeviceVitals []json.RawMessage `json:"device_vitals"`
	}
	if json.Unmarshal(raw, &qie) != nil || len(qie.DeviceVitals) == 0 {
		return ""
	}
	return "NOTE: qie.device_vitals lists readings captured by a wearable or medical device (each entry names its device and measured_at). " +
		"Treat them as measured values rather than patient-reported ones and mention the device when you use them in the palpation (qie) findings, " +
		"but a single reading is not a diagnosis: weigh it together with the other examinations and with how recent it is."
}

// aiAdaptReportPrompt removes the one instruction of the stored/default report prompt that contradicts the strict
// language rule for en and ms: its JSON schema asked for the therapeutic principle/method "in Chinese with English
// explanation" while the same system prompt forbids Chinese characters (a real-model run produced CJK in 23 report
// fields). Older database copies of the prompt still carry the phrase, so it is rewritten at request time.
func aiAdaptReportPrompt(prompt, lang string) string {
	if lang == "zh" {
		return prompt
	}
	prompt = strings.ReplaceAll(prompt, "治则 in Chinese with English explanation", "the therapeutic principle, written in the required response language only")
	prompt = strings.ReplaceAll(prompt, "治法 in Chinese with English explanation", "the treatment method, written in the required response language only")
	return strings.ReplaceAll(prompt, "in Chinese with English explanation", "in the required response language")
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
			Symptoms any    `json:"symptoms"`
		} `json:"patientInfo"`
		Language string `json:"language"`
		Model    string `json:"model"`
	}
	if !aiReadJSON(w, r, &body) {
		return
	}

	lang := aiLang(body.Language)

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
	s.aiStream(w, r, aiModelChain(body.Model, "gemini-2.0-flash", "gemini-1.5-flash"), req, nil)
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
			Symptoms any    `json:"symptoms"`
		}
		if json.Unmarshal(b, &pi) == nil {
			ctx += fmt.Sprintf("PATIENT INFORMATION:\n- Name: %v\n- Age: %v\n- Gender: %v\n- Chief Complaint: %v\n",
				pi.Name, pi.Age, pi.Gender, aiSymptomsText(pi.Symptoms))
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
			Symptoms any    `json:"symptoms"`
		} `json:"patientInfo"`
		Model    string `json:"model"`
		Language string `json:"language"`
	}
	if !aiReadJSON(w, r, &body) {
		return
	}

	lang := aiLang(body.Language)

	// The persona, safety rules and language contract come from the stored western-chat prompt ONLY. A
	// client-supplied systemPrompt used to replace all of it (a free general-purpose LLM and a prompt-injection
	// primitive on an anonymous endpoint), so that field is ignored.
	basePrompt := s.SystemPrompt(r.Context(), PromptDoctorWesternChat)

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
	// The TS FALLBACK_MODELS cascade (2.5-flash, 2.0-flash-exp, 2.0-flash) normalised to ONE model, so the same call was
	// made up to four times; it is now flash, then the lite tier. The caller's cheap-tier choice goes first.
	s.aiStream(w, r, aiModelChain(body.Model, "gemini-2.0-flash", "gemini-1.5-flash"), req, nil)
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
			Symptoms any    `json:"symptoms"`
		}
		if json.Unmarshal(b, &pi) == nil {
			ctx += fmt.Sprintf("PATIENT INFORMATION:\n- Name: %v\n- Age: %v\n- Gender: %v\n- Chief Complaint: %v\n",
				pi.Name, pi.Age, pi.Gender, aiSymptomsText(pi.Symptoms))
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
	// public CORS endpoint: EVERY response (400/429/502 too) must carry the header, or a cross-origin / mobile client
	// cannot even read the error
	w.Header().Set("Access-Control-Allow-Origin", "*")
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

	lang := aiLang(body.Language)

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
	s.aiStream(w, r, aiModelChain(body.Model, "gemini-2.0-flash", "gemini-1.5-flash"), req, corsHeaders)
}

func (s *Server) handleHeartCompanionOPTIONS(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
	w.WriteHeader(http.StatusNoContent)
}

// ---- assistant system prompts (they must describe THIS codebase: a Go app, not the old Next.js one) ----

const adminAssistantPrompt = `You are the 'Admin Assistant' for the Sihat TCM platform, an AI-assisted Traditional Chinese Medicine (TCM) diagnosis web app written in Go (server-rendered pages, a SQLite or Supabase database, AI answers from Gemini models or a local listener). You help administrators operate it.

What the admin console (/admin) gives an administrator:
  1. Settings (GET/PUT /api/admin/settings): background-music URL and switch, a saved Gemini API key (always shown masked, last 6 characters), and a free-form settings JSON whose secret-looking values are masked too.
  2. DB status (GET /api/admin/db-status): whether the database answers, user / admin / diagnosis counts, and whether each system-prompt role has a row in system_prompts: doctor_chat, doctor_final, doctor_image, doctor_listening, doctor_inquiry_summary, doctor_report_chat, doctor_western_chat, heart_companion. A role without a row silently falls back to the built-in default prompt.
  3. System health (GET /api/admin/system-health): errors of the last 24 hours by severity (low, medium, high, critical). Only UNRESOLVED errors count toward the overall status (healthy, degraded, unhealthy).
  4. Logs and metrics (GET /api/logs, GET /api/monitoring/metrics): filter logs by level and category.
  5. Doctor approval (GET /api/admin/doctors, POST /api/admin/doctors/approve): a doctor who registers is NOT approved. Until an admin approves the account the doctor cannot open the doctor inbox, reply, flag requests or appear in the public doctor directory.
  6. Test API key (POST /api/admin/test-api-key): sends one tiny request through the configured AI backend.

Roles are patient, doctor, admin and developer. Admins can change settings and approve doctors; developers can read settings (masked), logs, metrics, health and DB status but not change settings.

Your role: explain how to use these screens, help troubleshoot ("why is the tongue analysis failing?" usually means the AI backend, the API key or the rate limit), and suggest improvements to system prompts. Be concise, professional and helpful. You have no live access to the database in this chat: for specific user data, tell the admin to check the console or the API directly.`

const developerAssistantPrompt = `You are the 'Developer Assistant' for the Sihat TCM platform. You help developers debug, troubleshoot and understand this codebase.

Tech stack:
  * Backend: Go (module sihattcm), net/http ServeMux with Go 1.22 method+path patterns, html/template server-side rendering, embedded static assets (templates/*.html, static/js, static/css).
  * Database: either Supabase (PostgREST + GoTrue, internal/supabase client) or the built-in SQLite fallback (DB_BACKEND=sqlite, internal/localdb: a PostgREST/GoTrue subset with owner row-level security). The handlers talk to both through the same REST client. Schema: db/schema.sql and internal/localdb/schema.go (keep in sync).
  * AI: Gemini REST API through internal/gemini, optionally routed to a local listener (sihat-listener, AI_BASE_URL) that runs Claude models.
  * Tests: go test ./... -count=1, and the ACI regression system (node aci.mjs describe | test --suite=quick | gates), which boots its own hermetic stack.

Code layout: main.go (flags, server timeouts), internal/server/*.go (handlers_*.go per area, auth.go for sessions and rate limiting, prompts*.go for system prompts), internal/config, internal/gemini, internal/supabase, internal/localdb, regress/ (suites), scripts/.

Roles: patient, doctor (must be approved by an admin), admin, developer. A session is the Supabase/GoTrue access token, sent as a Bearer header or the sb-access-token cookie; logout revokes the token server-side.

Main API routes:
  - AI (public, rate limited): POST /api/chat, /api/consult, /api/report-chat, /api/western-chat, /api/heart-companion, /api/analyze-image, /api/analyze-audio, /api/analyze-snore, /api/extract-text, /api/validate-medicine, /api/summarize-inquiry, /api/summarize-reports, /api/summarize-medical-history, /api/ask-dietary-advice, /api/generate-infographic.
  - Auth: POST /api/auth/login, /signup, /logout, /forgot-password, /reset-password; GET /api/auth/me.
  - Patient: GET/POST /api/patient/sessions, GET/PUT /api/patient/profile, GET /api/patient/requests, POST /api/patient/requests/cancel, POST /api/patient/reply, POST /api/verification-request, POST /api/guest/sessions, POST /api/migrate-guest-session, /api/notifications/*.
  - Doctor: GET /api/doctors (directory), GET /api/doctor/requests (master inbox), POST /api/doctor/flag, /api/doctor/reply, /api/doctor/treatment-plan, /api/doctor/generate-inquiry, /api/ai/patient-summary.
  - Admin / developer: /api/admin/settings, /api/admin/db-status, /api/admin/system-health, /api/admin/doctors, /api/admin/test-api-key, /api/logs, /api/monitoring/metrics, /api/admin/assistant, /api/developer/assistant.

Database tables: profiles, patients, inquiries (consultation requests; the thread lives in diagnosis_report.messages), diagnosis_sessions, guest_diagnosis_sessions, admin_settings, system_prompts, system_logs, system_errors, system_metrics, user_notification_preferences, user_devices, scheduled_notifications, notification_history.

Gotchas: the app is one process, so read-modify-write sections use in-process keyed locks (inquiryLock, lockKey); user-supplied model ids are never trusted (aiModelChain allow-list); PostgREST responses over 10 MB fail in the client, so documents the app grows are bounded when written; localdb supports only a PostgREST subset (no or=, no not.).

Your role: help debug code and explain errors, explain the architecture and data flow, suggest solutions, and provide Go snippets (or JavaScript for the static front end) when helpful. Be concise and technical; assume developer expertise.`

// ---- handler: POST /api/admin/assistant ----

func (s *Server) handleAdminAssistant(w http.ResponseWriter, r *http.Request, _ *AuthUser) {
	var body struct {
		Messages []aiMessage `json:"messages"`
	}
	if !aiReadJSON(w, r, &body) {
		return
	}

	systemPrompt := adminAssistantPrompt

	contents := aiMessagesToContents(body.Messages)
	if len(contents) == 0 {
		s.JSONError(w, http.StatusBadRequest, "messages required")
		return
	}

	req := gemini.GenerateRequest{
		Contents:          contents,
		SystemInstruction: aiSystemContent(systemPrompt),
	}
	s.aiStream(w, r, aiModelChain("", "gemini-2.0-flash"), req, nil)
}

// ---- handler: POST /api/developer/assistant ----

func (s *Server) handleDeveloperAssistant(w http.ResponseWriter, r *http.Request, _ *AuthUser) {
	var body struct {
		Messages []aiMessage `json:"messages"`
	}
	if !aiReadJSON(w, r, &body) {
		return
	}

	systemPrompt := developerAssistantPrompt

	contents := aiMessagesToContents(body.Messages)
	if len(contents) == 0 {
		s.JSONError(w, http.StatusBadRequest, "messages required")
		return
	}

	req := gemini.GenerateRequest{
		Contents:          contents,
		SystemInstruction: aiSystemContent(systemPrompt),
	}
	s.aiStream(w, r, aiModelChain("", "gemini-2.0-flash"), req, nil)
}

// withCORS sets Access-Control-Allow-Origin on every response of a public endpoint, including the 429 the rate
// limiter answers before the handler runs.
func withCORS(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		next(w, r)
	}
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
		withCORS(s.RateLimit(20, 500, s.handleHeartCompanion)))
	s.Mux.HandleFunc("OPTIONS /api/heart-companion",
		s.handleHeartCompanionOPTIONS)

	// Admin & developer assistants — staff only, and rate-limited (each call is a paid AI request).
	s.Mux.HandleFunc("POST /api/admin/assistant",
		s.RateLimit(20, 500, s.RequireAuth(s.handleAdminAssistant, "admin", "developer")))
	s.Mux.HandleFunc("POST /api/developer/assistant",
		s.RateLimit(20, 500, s.RequireAuth(s.handleDeveloperAssistant, "developer", "admin")))
}
