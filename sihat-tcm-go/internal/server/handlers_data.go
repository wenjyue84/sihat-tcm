package server

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"
)

// dtNormalizeSymptoms coerces a "symptoms" string (e.g. "headache, fatigue")
// into a []string, because the diagnosis_sessions/guest_diagnosis_sessions
// symptoms column is a Postgres text[] array. The web wizard sends a joined
// string, so without this the save fails with "malformed array literal".
func dtNormalizeSymptoms(payload map[string]any) {
	v, ok := payload["symptoms"]
	if !ok {
		return
	}
	s, isStr := v.(string)
	if !isStr {
		return // already an array (or absent) — leave as-is
	}
	parts := []string{}
	for _, p := range strings.Split(s, ",") {
		if p = strings.TrimSpace(p); p != "" {
			parts = append(parts, p)
		}
	}
	payload["symptoms"] = parts
}

// registerDataRoutes mounts data/AI endpoints.
func (s *Server) registerDataRoutes() {
	// Doctor reply — requires an authenticated doctor
	s.Mux.HandleFunc("POST /api/doctor/reply", s.RequireAuth(s.handleDoctorReply, "doctor"))

	// AI patient summary — requires auth
	s.Mux.HandleFunc("POST /api/ai/patient-summary", s.RequireAuth(s.handleAIPatientSummary))

	// Verification request — no auth (guests can submit)
	s.Mux.HandleFunc("POST /api/verification-request", s.handleVerificationRequest)

	// Migrate guest session — requires auth
	s.Mux.HandleFunc("POST /api/migrate-guest-session", s.RequireAuth(s.handleMigrateGuestSession))

	// Patient session list + create
	s.Mux.HandleFunc("GET /api/patient/sessions", s.RequireAuth(s.handlePatientSessionsList))
	s.Mux.HandleFunc("POST /api/patient/sessions", s.RequireAuth(s.handlePatientSessionsCreate))
}

// handleDoctorReply appends a doctor message to the JSONB report column of the
// target row and marks the request reviewed. Only authenticated doctors may call it.
func (s *Server) handleDoctorReply(w http.ResponseWriter, r *http.Request, user *AuthUser) {
	var body struct {
		RequestID   string `json:"requestId"`
		Message     string `json:"message"`
		Status      string `json:"status"`
		TargetTable string `json:"targetTable"` // "inquiries" | "diagnosis_sessions"
	}
	if !dtReadJSON(w, r, &body) {
		return
	}
	if body.RequestID == "" || body.Message == "" {
		s.JSONError(w, http.StatusBadRequest, "requestId and message are required")
		return
	}

	table := "diagnosis_sessions"
	reportCol := "full_report"
	if body.TargetTable == "inquiries" {
		table = "inquiries"
		reportCol = "diagnosis_report"
	}

	ctx, cancel := context.WithTimeout(r.Context(), 15*time.Second)
	defer cancel()

	// 1. Fetch current record (service key — empty userToken)
	var rows []map[string]json.RawMessage
	q := fmt.Sprintf("select=id,%s&id=eq.%s", reportCol, body.RequestID)
	if err := s.DB.Select(ctx, table, q, "", &rows); err != nil || len(rows) == 0 {
		s.JSONError(w, http.StatusNotFound, "record not found")
		return
	}
	row := rows[0]

	// 2. Unmarshal existing report
	var currentReport map[string]any
	if raw, ok := row[reportCol]; ok && len(raw) > 0 {
		_ = json.Unmarshal(raw, &currentReport)
	}
	if currentReport == nil {
		currentReport = map[string]any{}
	}

	// 3. Append new message
	var messages []any
	if m, ok := currentReport["messages"]; ok {
		if arr, ok := m.([]any); ok {
			messages = arr
		}
	}
	newMsg := map[string]string{
		"role":      "doctor",
		"content":   body.Message,
		"doctor_id": user.ID,
		"timestamp": dtNowISO(),
	}
	messages = append(messages, newMsg)

	status := body.Status
	if status == "" {
		status = "reviewed" // a doctor reply moves the request out of "pending"
	}
	currentReport["messages"] = messages
	currentReport["status"] = status

	// 4. Update row (also mirror status to the top-level column for inquiries)
	updateBody := map[string]any{reportCol: currentReport}
	if table == "inquiries" {
		updateBody["status"] = status
	}
	var updated []map[string]any
	if err := s.DB.Update(ctx, table, "id=eq."+body.RequestID, updateBody, "", &updated); err != nil {
		log.Printf("doctor/reply update %s: %v", table, err)
		s.JSONError(w, http.StatusInternalServerError, "failed to update record")
		return
	}

	s.JSON(w, http.StatusOK, map[string]any{
		"success": true,
		"data":    currentReport,
	})
}

// handleAIPatientSummary generates a clinical summary for a patient using Gemini.
func (s *Server) handleAIPatientSummary(w http.ResponseWriter, r *http.Request, _ *AuthUser) {
	var body struct {
		PatientID string `json:"patientId"`
	}
	if !dtReadJSON(w, r, &body) {
		return
	}
	if body.PatientID == "" {
		s.JSONError(w, http.StatusBadRequest, "patientId is required")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 60*time.Second)
	defer cancel()

	// 1. Fetch patient
	var patients []map[string]json.RawMessage
	if err := s.DB.Select(ctx, "patients", "select=*&id=eq."+body.PatientID, "", &patients); err != nil || len(patients) == 0 {
		s.JSONError(w, http.StatusNotFound, "patient not found")
		return
	}
	patient := patients[0]

	// Helper: extract string field from raw map
	strField := func(m map[string]json.RawMessage, key string) string {
		if v, ok := m[key]; ok {
			var s string
			if json.Unmarshal(v, &s) == nil {
				return s
			}
		}
		return ""
	}

	firstName := strField(patient, "first_name")
	lastName := strField(patient, "last_name")
	gender := strField(patient, "gender")
	patType := strField(patient, "type")
	birthDate := strField(patient, "birth_date")
	userID := strField(patient, "user_id")

	age := "Unknown"
	if birthDate != "" {
		if t, err := time.Parse("2006-01-02", birthDate); err == nil {
			age = fmt.Sprintf("%d", time.Now().Year()-t.Year())
		}
	}

	// 2. Fetch last 5 diagnosis sessions
	type sessionRow struct {
		ID               string          `json:"id"`
		CreatedAt        string          `json:"created_at"`
		PrimaryDiagnosis json.RawMessage `json:"primary_diagnosis"`
		FullReport       json.RawMessage `json:"full_report"`
	}
	var sessions []sessionRow
	if userID != "" {
		q := "select=id,created_at,primary_diagnosis,full_report&user_id=eq." + userID + "&order=created_at.desc&limit=5"
		_ = s.DB.Select(ctx, "diagnosis_sessions", q, "", &sessions)
	}

	// 3. Build prompt
	sessionSummary := "No recent diagnosis history found."
	if len(sessions) > 0 {
		sessionSummary = ""
		for _, sess := range sessions {
			var diagText string
			_ = json.Unmarshal(sess.PrimaryDiagnosis, &diagText)
			sessionSummary += fmt.Sprintf("- Date: %s\n  Diagnosis: %s\n", sess.CreatedAt, diagText)
		}
	}

	prompt := fmt.Sprintf(`You are an expert Medical AI Assistant for a TCM (Traditional Chinese Medicine) Doctor.
Generate a "One Page Clinical Summary" for the following patient.

## Patient Demographics
Name: %s %s
Age: %s
Gender: %s
Type: %s

## Recent Medical History (Last %d visits)
%s

## Task
Create a concise, professional clinical summary in Markdown format.
The summary should include:
1. **Patient Profile**: Brief demographic and constitutional overview.
2. **Clinical Snapshot**: Summary of recent conditions and patterns (e.g., "History of Liver Qi Stagnation").
3. **Trend Analysis**: If multiple visits, note any improvements or recurring issues.
4. **Key Alerts**: Highlight any critical warnings or contraindications if found in the history.

Format with clear H2 headers (##) and bullet points. Keep it under 400 words.
Do not include any conversational filler. Start directly with the summary.`,
		firstName, lastName, age, gender, patType, len(sessions), sessionSummary)

	// 4. Generate summary
	summaryText, err := s.AI.GenerateText(ctx, "gemini-2.0-flash", "", prompt)
	if err != nil {
		log.Printf("ai/patient-summary gemini: %v", err)
		s.JSONError(w, http.StatusInternalServerError, "AI generation failed")
		return
	}

	// 5. Cache summary on patient record
	lastDiagID := ""
	if len(sessions) > 0 {
		lastDiagID = sessions[0].ID
	}
	summaryData := map[string]any{
		"summary":          summaryText,
		"generated_at":     dtNowISO(),
		"last_diagnosis_id": lastDiagID,
	}
	var ignore []map[string]any
	if err := s.DB.Update(ctx, "patients", "id=eq."+body.PatientID,
		map[string]any{"clinical_summary": summaryData}, "", &ignore); err != nil {
		log.Printf("ai/patient-summary cache: %v", err)
	}

	s.JSON(w, http.StatusOK, map[string]any{"summary": summaryText})
}

// handleVerificationRequest inserts a verification request row into the inquiries table.
func (s *Server) handleVerificationRequest(w http.ResponseWriter, r *http.Request) {
	var body struct {
		UserID     string         `json:"userId"`
		DoctorID   string         `json:"doctorId"`
		DoctorName string         `json:"doctorName"`
		PatientData map[string]any `json:"patientData"`
		ReportData  map[string]any `json:"reportData"`
	}
	if !dtReadJSON(w, r, &body) {
		return
	}
	if body.DoctorID == "" || body.DoctorName == "" {
		s.JSONError(w, http.StatusBadRequest, "doctor information is required")
		return
	}

	patientName := "Anonymous"
	var patientEmail any
	if body.PatientData != nil {
		if n, ok := body.PatientData["name"].(string); ok && n != "" {
			patientName = n
		}
		patientEmail = body.PatientData["email"]
	}

	var aiDiagnosis any
	if body.ReportData != nil {
		aiDiagnosis = body.ReportData["diagnosis"]
	}

	var userID any
	if body.UserID != "" {
		userID = body.UserID
	}

	record := map[string]any{
		"user_id":   userID,
		"doctor_id": body.DoctorID, // top-level column so the doctor inbox queries cleanly
		"status":    "pending",
		"symptoms":  "Request for Verification",
		"diagnosis_report": map[string]any{
			"type":     "verification_request",
			"status":   "pending",
			"messages": []any{},
			"patient_profile": map[string]any{
				"name":  patientName,
				"email": patientEmail,
			},
			"ai_diagnosis": aiDiagnosis,
			"full_report":  body.ReportData,
			"selected_doctor": map[string]string{
				"id":   body.DoctorID,
				"name": body.DoctorName,
			},
			"requested_at": dtNowISO(),
		},
	}

	ctx, cancel := context.WithTimeout(r.Context(), 15*time.Second)
	defer cancel()

	var inserted []map[string]json.RawMessage
	if err := s.DB.Insert(ctx, "inquiries", record, "", &inserted); err != nil {
		log.Printf("verification-request insert: %v", err)
		s.JSONError(w, http.StatusInternalServerError, "failed to create verification request")
		return
	}

	insertedID := ""
	if len(inserted) > 0 {
		if raw, ok := inserted[0]["id"]; ok {
			_ = json.Unmarshal(raw, &insertedID)
		}
	}

	s.JSON(w, http.StatusOK, map[string]any{
		"success": true,
		"data": map[string]any{
			"id":     insertedID,
			"doctor": body.DoctorName,
			"status": "pending",
		},
	})
}

// handleMigrateGuestSession copies a guest_diagnosis_sessions row to diagnosis_sessions for the auth user.
func (s *Server) handleMigrateGuestSession(w http.ResponseWriter, r *http.Request, user *AuthUser) {
	var body struct {
		SessionToken string `json:"sessionToken"`
	}
	if !dtReadJSON(w, r, &body) {
		return
	}
	if body.SessionToken == "" {
		s.JSONError(w, http.StatusBadRequest, "sessionToken is required")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 20*time.Second)
	defer cancel()

	// 1. Find unmigrated guest session
	var guestRows []map[string]json.RawMessage
	q := "select=*&session_token=eq." + body.SessionToken + "&migrated_to_user_id=is.null"
	if err := s.DB.Select(ctx, "guest_diagnosis_sessions", q, "", &guestRows); err != nil || len(guestRows) == 0 {
		s.JSONError(w, http.StatusBadRequest, "guest session not found or already migrated")
		return
	}
	guest := guestRows[0]

	// Helper: copy raw field from guest row, return nil if missing
	field := func(key string) any {
		if raw, ok := guest[key]; ok && string(raw) != "null" {
			var v any
			if json.Unmarshal(raw, &v) == nil {
				return v
			}
		}
		return nil
	}

	// 2. Insert into diagnosis_sessions
	newSession := map[string]any{
		"user_id":                user.ID,
		"primary_diagnosis":      field("primary_diagnosis"),
		"constitution":           field("constitution"),
		"overall_score":          field("overall_score"),
		"full_report":            field("full_report"),
		"notes":                  field("notes"),
		"symptoms":               field("symptoms"),
		"medicines":              field("medicines"),
		"vital_signs":            field("vital_signs"),
		"clinical_notes":         field("clinical_notes"),
		"treatment_plan":         field("treatment_plan"),
		"follow_up_date":         field("follow_up_date"),
		"inquiry_summary":        field("inquiry_summary"),
		"inquiry_chat_history":   field("inquiry_chat_history"),
		"inquiry_report_files":   field("inquiry_report_files"),
		"inquiry_medicine_files": field("inquiry_medicine_files"),
		"tongue_analysis":        field("tongue_analysis"),
		"face_analysis":          field("face_analysis"),
		"body_analysis":          field("body_analysis"),
		"audio_analysis":         field("audio_analysis"),
		"pulse_data":             field("pulse_data"),
		"is_guest_session":       false,
	}

	var inserted []map[string]json.RawMessage
	if err := s.DB.Insert(ctx, "diagnosis_sessions", newSession, user.Token, &inserted); err != nil {
		log.Printf("migrate-guest-session insert: %v", err)
		s.JSONError(w, http.StatusInternalServerError, "failed to migrate session")
		return
	}

	// 3. Mark guest record as migrated
	guestID := ""
	if raw, ok := guest["id"]; ok {
		_ = json.Unmarshal(raw, &guestID)
	}
	if guestID != "" {
		var ignore []map[string]any
		_ = s.DB.Update(ctx, "guest_diagnosis_sessions", "id=eq."+guestID,
			map[string]any{
				"migrated_to_user_id": user.ID,
				"migrated_at":         dtNowISO(),
			}, "", &ignore)
	}

	var sessionData any
	if len(inserted) > 0 {
		sessionData = inserted[0]
	}
	s.JSON(w, http.StatusOK, map[string]any{
		"success": true,
		"data":    sessionData,
	})
}

// handlePatientSessionsList returns the authenticated user's diagnosis sessions.
func (s *Server) handlePatientSessionsList(w http.ResponseWriter, r *http.Request, user *AuthUser) {
	ctx, cancel := context.WithTimeout(r.Context(), 15*time.Second)
	defer cancel()

	q := "select=id,created_at,symptoms,constitution,full_report&user_id=eq." + user.ID + "&order=created_at.desc&limit=50"
	var sessions []map[string]any
	if err := s.DB.Select(ctx, "diagnosis_sessions", q, user.Token, &sessions); err != nil {
		log.Printf("patient/sessions list: %v", err)
		s.JSONError(w, http.StatusInternalServerError, "failed to fetch sessions")
		return
	}
	if sessions == nil {
		sessions = []map[string]any{}
	}
	s.JSON(w, http.StatusOK, map[string]any{"sessions": sessions})
}

// handlePatientSessionsCreate inserts a new diagnosis session for the authenticated user.
func (s *Server) handlePatientSessionsCreate(w http.ResponseWriter, r *http.Request, user *AuthUser) {
	var payload map[string]any
	if !dtReadJSON(w, r, &payload) {
		return
	}
	// Enforce the authenticated user's ID
	payload["user_id"] = user.ID
	dtNormalizeSymptoms(payload)

	ctx, cancel := context.WithTimeout(r.Context(), 15*time.Second)
	defer cancel()

	var inserted []map[string]any
	if err := s.DB.Insert(ctx, "diagnosis_sessions", payload, user.Token, &inserted); err != nil {
		log.Printf("patient/sessions create: %v", err)
		s.JSONError(w, http.StatusInternalServerError, "failed to create session")
		return
	}

	var session any
	if len(inserted) > 0 {
		session = inserted[0]
	}
	s.JSON(w, http.StatusCreated, map[string]any{
		"success": true,
		"session": session,
	})
}
