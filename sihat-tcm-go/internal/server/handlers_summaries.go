package server

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"sihattcm/internal/gemini"
)

// ---- POST /api/summarize-inquiry ----

func (s *Server) handleSummarizeInquiry(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		s.JSONError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	start := time.Now()

	var body struct {
		ChatHistory   []map[string]any   `json:"chatHistory"`
		ReportFiles   []map[string]any   `json:"reportFiles"`
		MedicineFiles []map[string]any   `json:"medicineFiles"`
		BasicInfo     map[string]any     `json:"basicInfo"`
		Language      string             `json:"language"`
		Model         string             `json:"model"`
	}
	if !anReadJSON(w, r, &body) {
		return
	}
	if body.Language == "" {
		body.Language = "en"
	}
	if body.Model == "" {
		body.Model = "gemini-2.0-flash"
	}

	sysPrompt := s.SystemPrompt(r.Context(), PromptDoctorInquirySummary)

	// Build patient context block.
	bi := body.BasicInfo
	langLabel := sumLangLabel(body.Language)

	reportBlock := "None uploaded"
	if len(body.ReportFiles) > 0 {
		var sb strings.Builder
		for _, f := range body.ReportFiles {
			name := sumStr(f["name"])
			text := sumStr(f["extractedText"])
			if text == "" {
				text = "No text extracted"
			}
			sb.WriteString(fmt.Sprintf("- %s:\n%s\n\n", name, text))
		}
		reportBlock = sb.String()
	}

	medBlock := "None uploaded"
	if len(body.MedicineFiles) > 0 {
		var sb strings.Builder
		for _, f := range body.MedicineFiles {
			name := sumStr(f["name"])
			text := sumStr(f["extractedText"])
			if text == "" {
				text = "No medication info extracted"
			}
			sb.WriteString(fmt.Sprintf("- %s: %s\n", name, text))
		}
		medBlock = sb.String()
	}

	chatBlock := ""
	for _, m := range body.ChatHistory {
		role := strings.ToUpper(sumStr(m["role"]))
		content := sumStr(m["content"])
		chatBlock += fmt.Sprintf("[%s]: %s\n\n", role, content)
	}

	userPrompt := fmt.Sprintf(`
═══════════════════════════════════════════════════════════════════════════════
                           PATIENT DATA FOR SUMMARY
═══════════════════════════════════════════════════════════════════════════════

## Patient Basic Info:
- Name: %s
- Age: %s
- Gender: %s
- Chief Complaint: %s
- Symptom Duration: %s

## Uploaded Medical Reports:
%s

## Current Medications (from uploaded images):
%s

## Complete Chat History (问诊记录):
%s

═══════════════════════════════════════════════════════════════════════════════
                          INSTRUCTIONS
═══════════════════════════════════════════════════════════════════════════════

Please generate a comprehensive yet concise medical summary based on the above data.
Respond in %s.
Follow the structured format specified in your system prompt.
`,
		sumMapStr(bi, "name", "Not provided"),
		sumMapStr(bi, "age", "Not provided"),
		sumMapStr(bi, "gender", "Not provided"),
		sumMapStr(bi, "symptoms", "Not provided"),
		sumMapStr(bi, "symptomDuration", "Not provided"),
		reportBlock,
		medBlock,
		chatBlock,
		langLabel,
	)

	models := []string{body.Model, "gemini-2.0-flash", "gemini-1.5-flash"}
	// Deduplicate while preserving order.
	seen := map[string]bool{}
	deduped := make([]string, 0, len(models))
	for _, m := range models {
		if !seen[m] {
			seen[m] = true
			deduped = append(deduped, m)
		}
	}

	req := gemini.GenerateRequest{
		Contents: []gemini.Content{
			{Role: "user", Parts: []gemini.Part{{Text: userPrompt}}},
		},
	}
	if sysPrompt != "" {
		req.SystemInstruction = &gemini.Content{Parts: []gemini.Part{{Text: sysPrompt}}}
	}

	text, modelUsed, err := s.AI.GenerateWithFallback(r.Context(), deduped, req)
	if err != nil {
		s.JSONError(w, http.StatusInternalServerError, "summarization failed: "+err.Error())
		return
	}

	s.JSON(w, http.StatusOK, map[string]any{
		"summary":   text,
		"modelUsed": modelUsed,
		"timing":    map[string]any{"total": int(time.Since(start).Milliseconds())},
	})
}

// ---- POST /api/summarize-reports ----

func (s *Server) handleSummarizeReports(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		s.JSONError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	start := time.Now()

	var body struct {
		Reports          []map[string]any `json:"reports"`
		DiagnosisHistory []map[string]any `json:"diagnosisHistory"`
		Language         string           `json:"language"`
	}
	if !anReadJSON(w, r, &body) {
		return
	}
	if body.Language == "" {
		body.Language = "en"
	}

	if len(body.Reports) == 0 && len(body.DiagnosisHistory) == 0 {
		s.JSON(w, http.StatusBadRequest, map[string]any{"error": "No data provided", "code": "NO_DATA"})
		return
	}

	var ctxText strings.Builder

	if len(body.Reports) > 0 {
		ctxText.WriteString("MEDICAL REPORTS:\n\n")
		for i, rpt := range body.Reports {
			ctxText.WriteString(fmt.Sprintf("Report %d: %s\nDate: %s\nContent:\n%s\n\n",
				i+1,
				sumStr(rpt["name"]),
				sumStr(rpt["date"]),
				sumStrOr(rpt["extractedText"], "No extracted text available"),
			))
		}
	}

	if len(body.DiagnosisHistory) > 0 {
		ctxText.WriteString("\nPAST DIAGNOSIS HISTORY:\n\n")
		for i, d := range body.DiagnosisHistory {
			dateStr := sumStr(d["created_at"])
			// Minimal formatting — just use the raw string.
			ctxText.WriteString(fmt.Sprintf("Consultation %d (%s):\n", i+1, dateStr))
			if sym := sumStr(d["symptoms"]); sym != "" {
				ctxText.WriteString("Symptoms: " + sym + "\n")
			}
			if dr, ok := d["diagnosis_report"].(map[string]any); ok {
				if mc := sumStr(dr["mainComplaint"]); mc != "" {
					ctxText.WriteString("Main Complaint: " + mc + "\n")
				}
				if td := sumStr(dr["tcmDiagnosis"]); td != "" {
					ctxText.WriteString("TCM Diagnosis: " + td + "\n")
				}
				if sp := sumStr(dr["syndromePattern"]); sp != "" {
					ctxText.WriteString("Syndrome Pattern: " + sp + "\n")
				}
			}
			ctxText.WriteString("\n")
		}
	}

	langLabel := sumLangLabel(body.Language)
	sysPrompt := fmt.Sprintf(`You are a medical assistant helping to summarise a patient's medical history for Traditional Chinese Medicine (TCM) practitioners.

Your task is to create a concise medical history summary that will be helpful for TCM diagnosis.

Guidelines:
1. Keep the summary concise (under 300 words)
2. Focus on information relevant to TCM practice
3. Highlight any patterns or recurring issues
4. Note any medications mentioned
5. Use professional medical terminology
6. Format as clear paragraphs

%s`, langLabel)

	userPrompt := fmt.Sprintf(`Based on the following information, create a concise medical history summary:

%s

Please provide:
1. A brief overview of the patient's health conditions
2. Key diagnoses and TCM patterns identified
3. Any notable medications or treatments mentioned
4. Important health indicators or test results

Format the response as a clear, paragraph-based summary suitable for medical records.`, ctxText.String())

	req := gemini.GenerateRequest{
		Contents:          []gemini.Content{{Role: "user", Parts: []gemini.Part{{Text: userPrompt}}}},
		SystemInstruction: &gemini.Content{Parts: []gemini.Part{{Text: sysPrompt}}},
	}

	genStart := time.Now()
	text, _, err := s.AI.GenerateWithFallback(r.Context(),
		[]string{"gemini-2.0-flash", "gemini-1.5-flash"}, req)
	genDur := int(time.Since(genStart).Milliseconds())

	if err != nil {
		s.JSONError(w, http.StatusInternalServerError, "generation failed: "+err.Error())
		return
	}

	s.JSON(w, http.StatusOK, map[string]any{
		"summary": text,
		"timing": map[string]any{
			"total":      int(time.Since(start).Milliseconds()),
			"generation": genDur,
		},
	})
}

// ---- POST /api/summarize-medical-history ----

const sumMedHistoryDefaultPrompt = `You are a medical assistant helping patients summarise their medical history for doctor consultations.

Based on the patient's previous TCM diagnosis reports and uploaded medical documents, create a clear, concise medical history summary that:

1. Lists main health complaints and patterns
2. Mentions relevant TCM diagnoses and syndrome patterns
3. Notes important findings from medical reports
4. Highlights chronic conditions or ongoing treatments
5. Uses simple, patient-friendly language

The summary should be 3-5 sentences that the patient can easily share with their doctor.

Previous Diagnosis History:
{inquiries}

Medical Reports:
{reports}

Generate a concise medical history summary:`

func (s *Server) handleSummarizeMedicalHistory(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		s.JSONError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	var body struct {
		Inquiries    []map[string]any `json:"inquiries"`
		Reports      []map[string]any `json:"reports"`
		CustomPrompt string           `json:"customPrompt"`
	}
	if !anReadJSON(w, r, &body) {
		return
	}

	// Build inquiry summary.
	inquirySummary := "No previous diagnosis history available."
	if len(body.Inquiries) > 0 {
		var sb strings.Builder
		for i, inq := range body.Inquiries {
			date := sumStr(inq["created_at"])
			symptoms := sumStr(inq["symptoms"])
			if symptoms == "" {
				if dr, ok := inq["diagnosis_report"].(map[string]any); ok {
					symptoms = sumStr(dr["mainComplaint"])
				}
			}
			if symptoms == "" {
				symptoms = "General consultation"
			}
			diagnosis := ""
			if dr, ok := inq["diagnosis_report"].(map[string]any); ok {
				diagnosis = sumStr(dr["tcmDiagnosis"])
				if diagnosis == "" {
					diagnosis = sumStr(dr["syndromePattern"])
				}
			}
			if diagnosis == "" {
				diagnosis = "Pending review"
			}
			sb.WriteString(fmt.Sprintf("%d. Date: %s\n   Symptoms: %s\n   TCM Diagnosis: %s\n\n",
				i+1, date, symptoms, diagnosis))
		}
		inquirySummary = sb.String()
	}

	// Build reports summary.
	reportsSummary := "No medical reports available."
	if len(body.Reports) > 0 {
		var sb strings.Builder
		for i, rpt := range body.Reports {
			name := sumStr(rpt["name"])
			date := sumStr(rpt["date"])
			extracted := sumStr(rpt["extractedText"])
			if extracted != "" {
				sb.WriteString(fmt.Sprintf("%d. %s (%s)\n   Summary: %s\n\n", i+1, name, date, extracted))
			} else {
				sb.WriteString(fmt.Sprintf("%d. %s (%s)\n   Medical report document\n\n", i+1, name, date))
			}
		}
		reportsSummary = sb.String()
	}

	promptTmpl := body.CustomPrompt
	if promptTmpl == "" {
		promptTmpl = sumMedHistoryDefaultPrompt
	}
	finalPrompt := strings.ReplaceAll(promptTmpl, "{inquiries}", inquirySummary)
	finalPrompt = strings.ReplaceAll(finalPrompt, "{reports}", reportsSummary)

	text, err := s.AI.GenerateText(r.Context(), "gemini-2.0-flash", "", finalPrompt)
	if err != nil {
		s.JSONError(w, http.StatusInternalServerError, err.Error())
		return
	}

	s.JSON(w, http.StatusOK, map[string]any{
		"summary": strings.TrimSpace(text),
		"success": true,
	})
}

// ---- POST /api/ask-dietary-advice ----

const sumDietaryDefaultPrompt = `You are a TCM dietary expert capable of advising patients on what foods to eat or avoid based on their diagnosis.

Context:
Patient Profile: {profile}
Latest Diagnosis: {diagnosis}
Latest Dietary Advice: {advice}

User Question: {question}

Please answer the user's question based on the above context.
If the food is beneficial, explain why in TCM terms (e.g., tonifies Qi, clears heat).
If the food should be avoided, explain why (e.g., adds dampness, too cold).
If it depends, explain the conditions.
Keep the answer concise and helpful.`

func (s *Server) handleAskDietaryAdvice(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		s.JSONError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	var body struct {
		Question  string `json:"question"`
		Profile   any    `json:"profile"`
		Diagnosis any    `json:"diagnosis"`
		Advice    any    `json:"advice"`
	}
	if !anReadJSON(w, r, &body) {
		return
	}
	if body.Question == "" {
		s.JSONError(w, http.StatusBadRequest, "question is required")
		return
	}

	marshalOrStr := func(v any) string {
		if v == nil {
			return "Not provided"
		}
		b, err := json.Marshal(v)
		if err != nil {
			return "Not provided"
		}
		return string(b)
	}

	prompt := strings.NewReplacer(
		"{profile}", marshalOrStr(body.Profile),
		"{diagnosis}", marshalOrStr(body.Diagnosis),
		"{advice}", marshalOrStr(body.Advice),
		"{question}", body.Question,
	).Replace(sumDietaryDefaultPrompt)

	text, err := s.AI.GenerateText(r.Context(), "gemini-2.0-flash", "", prompt)
	if err != nil {
		s.JSONError(w, http.StatusInternalServerError, err.Error())
		return
	}

	s.JSON(w, http.StatusOK, map[string]any{
		"answer": text,
		"prompt": prompt,
	})
}

// ---- POST /api/generate-infographic ----

// handleGenerateInfographic builds a styled HTML infographic and a placeholder SVG
// data URL from report data — no AI call, pure server-side generation.
func (s *Server) handleGenerateInfographic(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		s.JSONError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	var body struct {
		Prompt      string         `json:"prompt"`
		Style       string         `json:"style"`
		ReportData  map[string]any `json:"reportData"`
		PatientInfo map[string]any `json:"patientInfo"`
	}
	if !anReadJSON(w, r, &body) {
		return
	}
	if body.Style == "" {
		body.Style = "modern"
	}
	if body.ReportData == nil {
		body.ReportData = map[string]any{}
	}

	html := sumInfographicHTML(body.ReportData, body.PatientInfo, body.Style)
	imageURL := sumPlaceholderSVG(body.ReportData, body.PatientInfo, body.Style)

	s.JSON(w, http.StatusOK, map[string]any{
		"success":  true,
		"type":     "html",
		"html":     html,
		"imageUrl": imageURL,
	})
}

// sumInfographicHTML generates the styled HTML infographic string.
func sumInfographicHTML(reportData, patientInfo map[string]any, style string) string {
	diagnosis := sumDiagnosisStr(reportData)
	constitution := sumConstitutionStr(reportData)
	foods := sumStringSlice(reportData, "recommendations", "food_therapy", "beneficial", 6)
	avoid := sumStringSlice(reportData, "recommendations", "food_therapy", "avoid", 4)
	lifestyle := sumStringSliceTop(reportData, "recommendations", "lifestyle", 4)

	type styleConf struct{ bg, accent, text, gradient string }
	styles := map[string]styleConf{
		"modern":      {"#f8fafc", "#10b981", "#1e293b", "linear-gradient(135deg, #10b981 0%, #3b82f6 100%)"},
		"traditional": {"#fef3c7", "#dc2626", "#1c1917", "linear-gradient(135deg, #dc2626 0%, #9333ea 100%)"},
		"minimal":     {"#ffffff", "#374151", "#1f2937", "linear-gradient(135deg, #374151 0%, #6b7280 100%)"},
		"colorful":    {"#fdf4ff", "#8b5cf6", "#18181b", "linear-gradient(135deg, #f43f5e 0%, #8b5cf6 50%, #06b6d4 100%)"},
	}
	cfg, ok := styles[style]
	if !ok {
		cfg = styles["modern"]
	}

	today := time.Now().Format("2006-01-02")

	// Build food items HTML.
	foodItems := ""
	for _, f := range foods {
		foodItems += fmt.Sprintf(`<div class="food-item"><span class="food-icon">✅</span><span>%s</span></div>`, xmlEscape(f))
	}
	avoidItems := ""
	for _, f := range avoid {
		avoidItems += fmt.Sprintf(`<div class="food-item avoid-item"><span class="food-icon">❌</span><span>%s</span></div>`, xmlEscape(f))
	}
	lifestyleItems := ""
	for i, tip := range lifestyle {
		lifestyleItems += fmt.Sprintf(`<div class="lifestyle-item"><strong>%d.</strong> %s</div>`, i+1, xmlEscape(tip))
	}

	foodsSection := ""
	if len(foods) > 0 {
		foodsSection = fmt.Sprintf(`<div class="section"><div class="section-title">🥗 Recommended Foods</div><div class="grid">%s</div></div>`, foodItems)
	}
	avoidSection := ""
	if len(avoid) > 0 {
		avoidSection = fmt.Sprintf(`<div class="section"><div class="section-title">🚫 Foods to Avoid</div><div class="grid">%s</div></div>`, avoidItems)
	}
	lifestyleSection := ""
	if len(lifestyle) > 0 {
		lifestyleSection = fmt.Sprintf(`<div class="section"><div class="section-title">🌿 Lifestyle Tips</div>%s</div>`, lifestyleItems)
	}
	constitutionLine := ""
	if constitution != "" {
		constitutionLine = fmt.Sprintf(`<p style="color: #64748b;">Constitution: %s</p>`, xmlEscape(constitution))
	}

	return fmt.Sprintf(`<!DOCTYPE html>
<html>
<head>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Segoe UI', sans-serif; }
        .infographic { width: 800px; background: %s; padding: 40px; }
        .header { background: %s; padding: 30px; border-radius: 20px; color: white; text-align: center; margin-bottom: 30px; }
        .header h1 { font-size: 28px; margin-bottom: 10px; }
        .header p { opacity: 0.9; }
        .section { margin-bottom: 25px; }
        .section-title { color: %s; font-size: 18px; font-weight: 600; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
        .diagnosis-card { background: white; padding: 20px; border-radius: 15px; border-left: 4px solid %s; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
        .food-item { background: white; padding: 12px 16px; border-radius: 10px; display: flex; align-items: center; gap: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
        .food-icon { font-size: 20px; }
        .avoid-item { background: #fef2f2; color: #dc2626; }
        .lifestyle-item { background: linear-gradient(135deg, #ecfdf5 0%%, #f0fdfa 100%%); padding: 15px; border-radius: 12px; margin-bottom: 10px; }
        .footer { text-align: center; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 12px; }
    </style>
</head>
<body>
    <div class="infographic">
        <div class="header">
            <h1>🏥 Your TCM Health Summary</h1>
            <p>Traditional Chinese Medicine Diagnosis Report</p>
        </div>
        <div class="section">
            <div class="section-title">📋 Diagnosis</div>
            <div class="diagnosis-card">
                <h3 style="font-size: 20px; margin-bottom: 8px; color: %s;">%s</h3>
                %s
            </div>
        </div>
        %s
        %s
        %s
        <div class="footer">
            <p>Generated by Sihat TCM AI Assistant | %s</p>
            <p style="margin-top: 5px;">Consult a licensed TCM practitioner for personalized advice.</p>
        </div>
    </div>
</body>
</html>`,
		cfg.bg, cfg.gradient,
		cfg.accent, cfg.accent,
		cfg.text, xmlEscape(diagnosis),
		constitutionLine,
		foodsSection, avoidSection, lifestyleSection,
		today,
	)
}

// sumPlaceholderSVG generates a base64 data URL SVG infographic.
func sumPlaceholderSVG(reportData, _ map[string]any, style string) string {
	diagnosis := sumDiagnosisStr(reportData)
	constitution := sumConstitutionStr(reportData)
	foods := sumStringSlice(reportData, "recommendations", "food_therapy", "beneficial", 3)
	if len(foods) == 0 {
		foods = []string{"Balanced diet recommended"}
	}

	type colConf struct{ primary, secondary, bg, text string }
	colors := map[string]colConf{
		"modern":      {"#10b981", "#3b82f6", "#f8fafc", "#1e293b"},
		"traditional": {"#dc2626", "#9333ea", "#fef3c7", "#1c1917"},
		"minimal":     {"#374151", "#6b7280", "#ffffff", "#1f2937"},
		"colorful":    {"#8b5cf6", "#f43f5e", "#fdf4ff", "#18181b"},
	}
	c, ok := colors[style]
	if !ok {
		c = colors["modern"]
	}

	today := time.Now().Format("2006-01-02")

	foodRows := ""
	for i, f := range foods {
		y1 := 410 + i*60
		y2 := 443 + i*60
		label := f
		if len(label) > 35 {
			label = label[:35]
		}
		foodRows += fmt.Sprintf(
			`<rect x="40" y="%d" width="340" height="50" rx="10" fill="white"/>
        <text x="60" y="%d" fill="#22c55e" font-size="18" font-family="system-ui">✅</text>
        <text x="90" y="%d" fill="%s" font-size="14" font-family="system-ui">%s</text>`,
			y1, y2, y2, c.text, xmlEscape(label),
		)
	}

	diagLabel := diagnosis
	if len(diagLabel) > 50 {
		diagLabel = diagLabel[:50] + "..."
	}

	svg := fmt.Sprintf(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000" viewBox="0 0 800 1000">
    <defs>
        <linearGradient id="headerGrad" x1="0%%" y1="0%%" x2="100%%" y2="100%%">
            <stop offset="0%%" style="stop-color:%s;stop-opacity:1" />
            <stop offset="100%%" style="stop-color:%s;stop-opacity:1" />
        </linearGradient>
        <filter id="shadow" x="-20%%" y="-20%%" width="140%%" height="140%%">
            <feDropShadow dx="0" dy="4" stdDeviation="8" flood-opacity="0.1"/>
        </filter>
    </defs>
    <rect width="800" height="1000" fill="%s"/>
    <rect x="40" y="40" width="720" height="140" rx="20" fill="url(#headerGrad)"/>
    <text x="400" y="100" text-anchor="middle" fill="white" font-size="32" font-weight="bold" font-family="system-ui">Your TCM Health Summary</text>
    <text x="400" y="135" text-anchor="middle" fill="white" font-size="16" opacity="0.9" font-family="system-ui">Traditional Chinese Medicine Diagnosis</text>
    <rect x="40" y="210" width="720" height="130" rx="15" fill="white" filter="url(#shadow)"/>
    <rect x="40" y="210" width="6" height="130" fill="%s"/>
    <text x="70" y="250" fill="%s" font-size="14" font-weight="600" font-family="system-ui">DIAGNOSIS</text>
    <text x="70" y="285" fill="%s" font-size="22" font-weight="bold" font-family="system-ui">%s</text>
    <text x="70" y="315" fill="#64748b" font-size="14" font-family="system-ui">Constitution: %s</text>
    <text x="60" y="390" fill="%s" font-size="16" font-weight="600" font-family="system-ui">Recommended Foods</text>
    %s
    <circle cx="600" cy="500" r="80" fill="white" filter="url(#shadow)"/>
    <path d="M600 420 A80 80 0 0 1 600 580 A40 40 0 0 1 600 500 A40 40 0 0 0 600 420" fill="%s"/>
    <path d="M600 420 A80 80 0 0 0 600 580 A40 40 0 0 0 600 500 A40 40 0 0 1 600 420" fill="%s"/>
    <circle cx="600" cy="460" r="12" fill="%s"/>
    <circle cx="600" cy="540" r="12" fill="%s"/>
    <line x1="40" y1="920" x2="760" y2="920" stroke="#e2e8f0" stroke-width="1"/>
    <text x="400" y="950" text-anchor="middle" fill="#64748b" font-size="12" font-family="system-ui">Generated by Sihat TCM AI Assistant | %s</text>
    <text x="400" y="970" text-anchor="middle" fill="#94a3b8" font-size="11" font-family="system-ui">Consult a licensed TCM practitioner for personalised advice</text>
</svg>`,
		c.primary, c.secondary,
		c.bg,
		c.primary,
		c.primary,
		c.text, xmlEscape(diagLabel),
		xmlEscape(constitution),
		c.primary,
		foodRows,
		c.primary, c.text, c.text, c.primary,
		today,
	)

	encoded := base64.StdEncoding.EncodeToString([]byte(svg))
	return "data:image/svg+xml;base64," + encoded
}

// ---- infographic helpers ----

func sumDiagnosisStr(rd map[string]any) string {
	if rd == nil {
		return "TCM Health Summary"
	}
	if v, ok := rd["diagnosis"]; ok {
		if s, ok := v.(string); ok && s != "" {
			return s
		}
		if m, ok := v.(map[string]any); ok {
			if s := sumStr(m["primary_pattern"]); s != "" {
				return s
			}
		}
	}
	return "TCM Health Summary"
}

func sumConstitutionStr(rd map[string]any) string {
	if rd == nil {
		return ""
	}
	if v, ok := rd["constitution"]; ok {
		if s, ok := v.(string); ok {
			return s
		}
		if m, ok := v.(map[string]any); ok {
			return sumStr(m["type"])
		}
	}
	return ""
}

// sumStringSlice extracts up to max items from reportData[topKey][subKey][leafKey].
func sumStringSlice(rd map[string]any, topKey, subKey, leafKey string, max int) []string {
	if rd == nil {
		return nil
	}
	top, ok := rd[topKey].(map[string]any)
	if !ok {
		return nil
	}
	sub, ok := top[subKey].(map[string]any)
	if !ok {
		return nil
	}
	raw, ok := sub[leafKey].([]any)
	if !ok {
		return nil
	}
	result := make([]string, 0, max)
	for _, item := range raw {
		if s, ok := item.(string); ok {
			result = append(result, s)
			if len(result) >= max {
				break
			}
		}
	}
	return result
}

// sumStringSliceTop extracts up to max items from reportData[topKey][subKey] (direct slice).
func sumStringSliceTop(rd map[string]any, topKey, subKey string, max int) []string {
	if rd == nil {
		return nil
	}
	top, ok := rd[topKey].(map[string]any)
	if !ok {
		return nil
	}
	raw, ok := top[subKey].([]any)
	if !ok {
		return nil
	}
	result := make([]string, 0, max)
	for _, item := range raw {
		if s, ok := item.(string); ok {
			result = append(result, s)
			if len(result) >= max {
				break
			}
		}
	}
	return result
}

// ---- small helpers ----

func sumStr(v any) string {
	if v == nil {
		return ""
	}
	s, _ := v.(string)
	return s
}

func sumStrOr(v any, def string) string {
	s := sumStr(v)
	if s == "" {
		return def
	}
	return s
}

func sumMapStr(m map[string]any, key, def string) string {
	if m == nil {
		return def
	}
	if v, ok := m[key]; ok {
		if s, ok := v.(string); ok && s != "" {
			return s
		}
	}
	return def
}

func sumLangLabel(lang string) string {
	switch lang {
	case "zh":
		return "Respond in Simplified Chinese (中文)."
	case "ms":
		return "Respond in Bahasa Malaysia."
	default:
		return "Respond in English."
	}
}

// xmlEscape escapes special XML/HTML characters for safe embedding in SVG/HTML.
func xmlEscape(s string) string {
	s = strings.ReplaceAll(s, "&", "&amp;")
	s = strings.ReplaceAll(s, "<", "&lt;")
	s = strings.ReplaceAll(s, ">", "&gt;")
	s = strings.ReplaceAll(s, `"`, "&quot;")
	s = strings.ReplaceAll(s, "'", "&apos;")
	return s
}

// Ensure gemini import used beyond type references.
var _ = (*gemini.Client)(nil)

// ---- route registration ----

// registerSummaryRoutes wires up all summary-related API routes.
func (s *Server) registerSummaryRoutes() {
	s.Mux.HandleFunc("POST /api/summarize-inquiry", s.handleSummarizeInquiry)
	s.Mux.HandleFunc("POST /api/summarize-reports", s.handleSummarizeReports)
	s.Mux.HandleFunc("POST /api/summarize-medical-history", s.handleSummarizeMedicalHistory)
	s.Mux.HandleFunc("POST /api/ask-dietary-advice", s.handleAskDietaryAdvice)
	s.Mux.HandleFunc("POST /api/generate-infographic", s.handleGenerateInfographic)
}
