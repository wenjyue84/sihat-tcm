package server

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"time"
)

// maxReplyChars caps a doctor/patient chat message.
const maxReplyChars = 8000

// Thread / report size bounds. The Supabase client refuses responses over 10 MB, so one oversized row would make the
// master doctor inbox (which returns many rows at once) fail for everybody. Every JSON document the app grows on a
// client's behalf is therefore bounded at WRITE time.
const (
	maxThreadMessages      = 200       // messages in one consultation thread
	maxThreadBytes         = 1 << 20   // serialized diagnosis_report of one inquiry
	maxRequestReportBytes  = 256 << 10 // reportData a patient attaches to a verification request
	maxRequestsPerPatient  = 100       // consultation requests one patient may hold
	sessionsPageDefault    = 50
	sessionsPageMax        = 100
	maxSessionJSONNesting  = 200
	maxDietaryQuestionRune = 2000
)

var validIDRe = regexp.MustCompile(`^[A-Za-z0-9_-]{1,64}$`)

// validID reports whether s is safe to concatenate into a PostgREST filter
// (UUIDs, numeric ids and slug-like ids pass; filter metacharacters do not).
func validID(s string) bool { return validIDRe.MatchString(s) }

var uuidRe = regexp.MustCompile(`^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$`)

// validUUID reports whether s is a canonical UUID (profile/user ids are uuid columns, so a
// merely "slug-safe" id would otherwise reach the database and surface as a 500).
func validUUID(s string) bool { return uuidRe.MatchString(s) }

// dtEnsureSessionRequired enforces the NOT NULL columns of the session tables
// (full_report, primary_diagnosis) with a clean 400 instead of a database 500.
// primary_diagnosis is derived from full_report.diagnosis.primary_pattern when omitted.
func dtEnsureSessionRequired(payload map[string]any) string {
	rep, ok := payload["full_report"]
	if !ok || rep == nil {
		return "full_report is required"
	}
	if pd, _ := payload["primary_diagnosis"].(string); strings.TrimSpace(pd) == "" {
		derived := ""
		if m, ok := rep.(map[string]any); ok {
			switch d := m["diagnosis"].(type) {
			case string:
				derived = d
			case map[string]any:
				derived, _ = d["primary_pattern"].(string)
			}
		}
		if strings.TrimSpace(derived) == "" {
			return "primary_diagnosis is required"
		}
		payload["primary_diagnosis"] = derived
	}
	return ""
}

// dtValidateSession checks the TYPES of an already column-filtered session payload so a malformed client value is a
// 400 instead of the database's constraint error surfacing as a 500 (score not an integer 0-100, impossible date,
// symptoms as an object, a report that is an array, a document nested deeper than SQLite's JSON functions allow ...).
// It normalises follow_up_date to YYYY-MM-DD. Returns "" when the payload is acceptable.
// stripBlobs removes file bytes (data: URLs and long base64 runs) from arbitrary JSON before it is stored.
// Rule: a database row never holds image/audio/file bytes; clients keep the files, rows keep text only.
// Returns the number of strings replaced.
func stripBlobs(v any) (any, int) {
	switch t := v.(type) {
	case string:
		if isBlobString(t) {
			return "", 1
		}
		return t, 0
	case map[string]any:
		n := 0
		for k, x := range t {
			nx, c := stripBlobs(x)
			t[k] = nx
			n += c
		}
		return t, n
	case []any:
		n := 0
		for i, x := range t {
			nx, c := stripBlobs(x)
			t[i] = nx
			n += c
		}
		return t, n
	default:
		return v, 0
	}
}

var base64RunRe = regexp.MustCompile(`^[A-Za-z0-9+/=
]+$`)

func isBlobString(s string) bool {
	if len(s) > 32 && strings.HasPrefix(strings.ToLower(s[:min(len(s), 12)]), "data:") && strings.Contains(s[:min(len(s), 128)], ";base64,") {
		return true
	}
	// raw base64 of a file: long, no spaces, only the base64 alphabet
	return len(s) > 4096 && base64RunRe.MatchString(s)
}

func dtValidateSession(p map[string]any) string {
	stripBlobs(p)
	if v, ok := p["overall_score"]; ok {
		if n, ok := asInt(v); !ok || n < 0 || n > 100 {
			return "overall_score must be a whole number between 0 and 100"
		}
	}
	if v, ok := p["follow_up_date"]; ok {
		s, isStr := v.(string)
		if !isStr {
			return "follow_up_date must be a date (YYYY-MM-DD)"
		}
		d, ok := normalizeDate(s)
		if !ok {
			return "follow_up_date must be a real date (YYYY-MM-DD)"
		}
		p["follow_up_date"] = d
	}
	for _, k := range []string{"symptoms", "medicines"} {
		if v, ok := p[k]; ok {
			arr, isArr := v.([]any)
			if !isArr {
				if _, isStrs := v.([]string); isStrs {
					continue
				}
				return k + " must be a list of strings"
			}
			for _, e := range arr {
				if _, isStr := e.(string); !isStr {
					return k + " must be a list of strings"
				}
			}
		}
	}
	for _, k := range []string{"primary_diagnosis", "constitution", "notes", "clinical_notes", "treatment_plan", "inquiry_summary", "guest_email", "guest_name"} {
		if v, ok := p[k]; ok {
			if _, isStr := v.(string); !isStr {
				return k + " must be a string"
			}
		}
	}
	if v, ok := p["is_hidden"]; ok {
		if _, isBool := v.(bool); !isBool {
			return "is_hidden must be true or false"
		}
	}
	if v, ok := p["full_report"]; ok {
		if _, isObj := v.(map[string]any); !isObj {
			return "full_report must be a JSON object"
		}
	}
	if jsonDepthExceeds(p, maxSessionJSONNesting) {
		return "report is nested too deeply"
	}
	return ""
}

// dtReadJSONLimit decodes a JSON body capped at max bytes. A body larger than
// max answers 413; malformed JSON or a literal `null` answers 400.
func dtReadJSONLimit(w http.ResponseWriter, r *http.Request, v any, max int64) bool {
	r.Body = http.MaxBytesReader(w, r.Body, max)
	if err := decodeJSONBody(r.Body, v); err != nil {
		var tooBig *http.MaxBytesError
		if errors.As(err, &tooBig) {
			http.Error(w, `{"error":"request body too large"}`, http.StatusRequestEntityTooLarge)
			return false
		}
		http.Error(w, `{"error":"invalid JSON body"}`, http.StatusBadRequest)
		return false
	}
	return true
}

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

// Client-writable columns of diagnosis_sessions / guest_diagnosis_sessions (db/schema.sql). PostgREST rejects unknown
// columns with a 400 (→ our 500), and explicit nulls violate NOT NULL instead of using the column default, so
// dtFilterColumns keeps only these keys and drops nil values.
var dtSessionColumns = map[string]bool{
	"primary_diagnosis": true, "constitution": true, "overall_score": true, "full_report": true, "notes": true,
	"symptoms": true, "medicines": true, "vital_signs": true, "clinical_notes": true, "treatment_plan": true,
	"follow_up_date": true, "inquiry_summary": true, "inquiry_chat_history": true, "inquiry_report_files": true,
	"inquiry_medicine_files": true, "tongue_analysis": true, "face_analysis": true, "body_analysis": true,
	"audio_analysis": true, "pulse_data": true,
}

// dtFilterColumns deletes from payload every key not in allowed (and every nil value), except keys listed in keep.
func dtFilterColumns(payload map[string]any, allowed map[string]bool, keep ...string) {
	for k, v := range payload {
		isKeep := false
		for _, kk := range keep {
			if k == kk {
				isKeep = true
			}
		}
		if isKeep {
			continue
		}
		if !allowed[k] || v == nil {
			delete(payload, k)
		}
	}
}

// registerDataRoutes mounts data/AI endpoints.
func (s *Server) registerDataRoutes() {
	// Doctor reply — requires an authenticated doctor
	s.Mux.HandleFunc("POST /api/doctor/reply", s.RequireAuth(s.handleDoctorReply, "doctor"))

	// Patient reply — two-way messaging; any authed user, scoped to their own request
	s.Mux.HandleFunc("POST /api/patient/reply", s.RequireAuth(s.handlePatientReply))

	// Doctor treatment plan — a structured plan the doctor authors on a request
	s.Mux.HandleFunc("POST /api/doctor/treatment-plan", s.RequireAuth(s.handleDoctorTreatmentPlan, "doctor"))

	// AI patient summary — clinical data: doctors/admins only
	s.Mux.HandleFunc("POST /api/ai/patient-summary", s.RequireAuth(s.handleAIPatientSummary, "doctor", "admin"))

	// Verification request — any logged-in user (userId is forced to the caller)
	s.Mux.HandleFunc("POST /api/verification-request", s.RequireAuth(s.handleVerificationRequest))

	// Migrate guest session — requires auth
	s.Mux.HandleFunc("POST /api/migrate-guest-session", s.RequireAuth(s.handleMigrateGuestSession))

	// Patient session list + create
	s.Mux.HandleFunc("GET /api/patient/sessions", s.RequireAuth(s.handlePatientSessionsList))
	s.Mux.HandleFunc("POST /api/patient/sessions", s.RequireAuth(s.handlePatientSessionsCreate))
}

// inquiryLock serialises every read-modify-write of one consultation thread (reply, patient reply, treatment plan,
// cancel). The report is a single JSON blob: two interleaved select+update cycles used to drop each other's messages
// while both answered 200.
func inquiryLock(table, id string) func() { return lockKey("thread:" + table + ":" + id) }

// dtThreadMessages returns the messages array of a report document.
func dtThreadMessages(report map[string]any) []any {
	if m, ok := report["messages"]; ok {
		if arr, ok := m.([]any); ok {
			return arr
		}
	}
	return nil
}

// dtLastRole is the role of the last message in the thread ("" if none).
func dtLastRole(report map[string]any) string {
	msgs := dtThreadMessages(report)
	if len(msgs) == 0 {
		return ""
	}
	if m, ok := msgs[len(msgs)-1].(map[string]any); ok {
		r, _ := m["role"].(string)
		return r
	}
	return ""
}

// dtReportTooBig reports whether the serialized thread document exceeds the per-row bound.
func dtReportTooBig(report map[string]any) bool {
	b, err := json.Marshal(report)
	return err != nil || len(b) > maxThreadBytes
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
	if body.RequestID == "" || strings.TrimSpace(body.Message) == "" {
		s.JSONError(w, http.StatusBadRequest, "requestId and message are required")
		return
	}
	if !validID(body.RequestID) {
		s.JSONError(w, http.StatusBadRequest, "invalid requestId")
		return
	}
	if len([]rune(body.Message)) > maxReplyChars {
		s.JSONError(w, http.StatusBadRequest, "message too long (max 8000 characters)")
		return
	}
	// The doctor UI only knows pending and reviewed: any other value would match neither filter yet still be
	// counted as pending.
	if body.Status != "" && body.Status != "pending" && body.Status != "reviewed" {
		s.JSONError(w, http.StatusBadRequest, "status must be pending or reviewed")
		return
	}

	table := "diagnosis_sessions"
	reportCol := "full_report"
	if body.TargetTable == "inquiries" {
		table = "inquiries"
		reportCol = "diagnosis_report"
	}

	defer inquiryLock(table, body.RequestID)()

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
	messages := dtThreadMessages(currentReport)
	if len(messages) >= maxThreadMessages {
		s.JSONError(w, http.StatusConflict, "this conversation has reached its message limit")
		return
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
	if table == "inquiries" && dtReportTooBig(currentReport) {
		s.JSONError(w, http.StatusRequestEntityTooLarge, "this conversation is too large to extend")
		return
	}

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

// handlePatientReply appends a patient message to their own consultation request,
// enabling two-way doctor↔patient messaging. Ownership is enforced by scoping the
// lookup to the caller's user_id, so a patient can only post into their own thread.
// A patient follow-up flips the request back to "pending" so it re-surfaces for the doctor.
func (s *Server) handlePatientReply(w http.ResponseWriter, r *http.Request, user *AuthUser) {
	var body struct {
		RequestID string `json:"requestId"`
		Message   string `json:"message"`
	}
	if !dtReadJSON(w, r, &body) {
		return
	}
	if body.RequestID == "" || strings.TrimSpace(body.Message) == "" {
		s.JSONError(w, http.StatusBadRequest, "requestId and message are required")
		return
	}
	if !validID(body.RequestID) {
		s.JSONError(w, http.StatusBadRequest, "invalid requestId")
		return
	}
	if len([]rune(body.Message)) > maxReplyChars {
		s.JSONError(w, http.StatusBadRequest, "message too long (max 8000 characters)")
		return
	}

	defer inquiryLock("inquiries", body.RequestID)()

	ctx, cancel := context.WithTimeout(r.Context(), 15*time.Second)
	defer cancel()

	// Fetch the request scoped to THIS patient — the ownership gate.
	var rows []map[string]json.RawMessage
	q := fmt.Sprintf("select=id,diagnosis_report&id=eq.%s&user_id=eq.%s", body.RequestID, user.ID)
	if err := s.DB.Select(ctx, "inquiries", q, "", &rows); err != nil || len(rows) == 0 {
		s.JSONError(w, http.StatusNotFound, "request not found")
		return
	}

	var report map[string]any
	if raw, ok := rows[0]["diagnosis_report"]; ok && len(raw) > 0 {
		_ = json.Unmarshal(raw, &report)
	}
	if report == nil {
		report = map[string]any{}
	}
	if c, _ := report["cancelled_by_patient"].(bool); c {
		s.JSONError(w, http.StatusConflict, "this request was cancelled")
		return
	}

	messages := dtThreadMessages(report)
	if len(messages) >= maxThreadMessages {
		s.JSONError(w, http.StatusConflict, "this conversation has reached its message limit")
		return
	}
	messages = append(messages, map[string]string{
		"role":      "patient",
		"content":   body.Message,
		"timestamp": dtNowISO(),
	})
	report["messages"] = messages
	report["status"] = "pending"
	if dtReportTooBig(report) {
		s.JSONError(w, http.StatusRequestEntityTooLarge, "this conversation is too large to extend")
		return
	}

	var updated []map[string]any
	if err := s.DB.Update(ctx, "inquiries", "id=eq."+body.RequestID,
		map[string]any{"diagnosis_report": report, "status": "pending"}, "", &updated); err != nil {
		log.Printf("patient/reply update: %v", err)
		s.JSONError(w, http.StatusInternalServerError, "failed to send reply")
		return
	}

	s.JSON(w, http.StatusOK, map[string]any{"success": true, "data": report})
}

// dtPlanHasContent reports whether a treatment plan carries at least one non-blank value.
func dtPlanHasContent(plan map[string]any) bool {
	for k, v := range plan {
		if k == "authored_at" || k == "doctor_id" {
			continue
		}
		switch x := v.(type) {
		case nil:
		case string:
			if strings.TrimSpace(x) != "" {
				return true
			}
		case []any:
			for _, e := range x {
				if str, ok := e.(string); !ok || strings.TrimSpace(str) != "" {
					return true
				}
			}
		case map[string]any:
			if len(x) > 0 {
				return true
			}
		default:
			return true // numbers / booleans are content
		}
	}
	return false
}

// handleDoctorTreatmentPlan stores a structured treatment plan authored by a
// doctor onto the request's report (diagnosis_report.treatment_plan) and marks
// the request reviewed. The plan shape mirrors the AI report's recommendation
// fields (pattern / treatment / lifestyle / follow_up / notes) so the patient UI
// can render it consistently. Doctor auth required.
func (s *Server) handleDoctorTreatmentPlan(w http.ResponseWriter, r *http.Request, user *AuthUser) {
	var body struct {
		RequestID string         `json:"requestId"`
		Plan      map[string]any `json:"plan"`
	}
	if !dtReadJSON(w, r, &body) {
		return
	}
	if body.RequestID == "" || len(body.Plan) == 0 {
		s.JSONError(w, http.StatusBadRequest, "requestId and plan are required")
		return
	}
	if !validID(body.RequestID) {
		s.JSONError(w, http.StatusBadRequest, "invalid requestId")
		return
	}
	if !dtPlanHasContent(body.Plan) {
		s.JSONError(w, http.StatusBadRequest, "the treatment plan is empty: fill in at least one field")
		return
	}
	if jsonDepthExceeds(body.Plan, 20) {
		s.JSONError(w, http.StatusBadRequest, "treatment plan is nested too deeply")
		return
	}

	defer inquiryLock("inquiries", body.RequestID)()

	ctx, cancel := context.WithTimeout(r.Context(), 15*time.Second)
	defer cancel()

	var rows []map[string]json.RawMessage
	if err := s.DB.Select(ctx, "inquiries", "select=id,diagnosis_report&id=eq."+body.RequestID, "", &rows); err != nil || len(rows) == 0 {
		s.JSONError(w, http.StatusNotFound, "record not found")
		return
	}

	var report map[string]any
	if raw, ok := rows[0]["diagnosis_report"]; ok && len(raw) > 0 {
		_ = json.Unmarshal(raw, &report)
	}
	if report == nil {
		report = map[string]any{}
	}

	body.Plan["authored_at"] = dtNowISO()
	body.Plan["doctor_id"] = user.ID
	report["treatment_plan"] = body.Plan
	// A plan answers the request unless the patient's follow-up is still waiting for an answer: then the request
	// must stay in the pending list, otherwise the unanswered question silently disappears from it.
	status := "reviewed"
	if dtLastRole(report) == "patient" {
		status = "pending"
	}
	report["status"] = status
	if dtReportTooBig(report) {
		s.JSONError(w, http.StatusRequestEntityTooLarge, "this conversation is too large to extend")
		return
	}

	var updated []map[string]any
	if err := s.DB.Update(ctx, "inquiries", "id=eq."+body.RequestID,
		map[string]any{"diagnosis_report": report, "status": status}, "", &updated); err != nil {
		log.Printf("doctor/treatment-plan: %v", err)
		s.JSONError(w, http.StatusInternalServerError, "failed to save treatment plan")
		return
	}

	s.JSON(w, http.StatusOK, map[string]any{"success": true, "data": report})
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
	if !validID(body.PatientID) {
		s.JSONError(w, http.StatusBadRequest, "invalid patientId")
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
	if !validID(userID) {
		userID = "" // never concatenate an unvalidated stored id into a filter
	}

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
		log.Printf("ai/patient-summary gemini: %s", anRedactKey(err.Error()))
		s.JSONError(w, http.StatusInternalServerError, "AI generation failed")
		return
	}

	// 5. Cache summary on patient record
	lastDiagID := ""
	if len(sessions) > 0 {
		lastDiagID = sessions[0].ID
	}
	summaryData := map[string]any{
		"summary":           summaryText,
		"generated_at":      dtNowISO(),
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
func (s *Server) handleVerificationRequest(w http.ResponseWriter, r *http.Request, user *AuthUser) {
	var body struct {
		UserID      string         `json:"userId"` // ignored: the caller's id is used
		DoctorID    string         `json:"doctorId"`
		DoctorName  string         `json:"doctorName"`
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
	if !validID(body.DoctorID) || !validUUID(body.DoctorID) {
		s.JSONError(w, http.StatusBadRequest, "invalid doctorId")
		return
	}
	if len(body.DoctorName) > 200 {
		s.JSONError(w, http.StatusBadRequest, "doctorName too long")
		return
	}
	// One oversized report poisons the master inbox for every doctor (responses over 10 MB fail to decode), and a
	// real report is ~35 KB: bound what a patient may attach.
	stripBlobs(body.ReportData)
	stripBlobs(body.PatientData)
	if rb, err := json.Marshal(body.ReportData); err != nil || len(rb) > maxRequestReportBytes {
		s.JSONError(w, http.StatusRequestEntityTooLarge, "reportData is too large (max 256 KB)")
		return
	}
	if jsonDepthExceeds(body.ReportData, maxSessionJSONNesting) || jsonDepthExceeds(body.PatientData, 20) {
		s.JSONError(w, http.StatusBadRequest, "reportData is nested too deeply")
		return
	}

	// The target must be an existing doctor profile.
	if s.DB.Configured() {
		vctx, vcancel := context.WithTimeout(r.Context(), 10*time.Second)
		defer vcancel()
		var docs []map[string]json.RawMessage
		if err := s.DB.Select(vctx, "profiles", "select=id&role=eq.doctor&is_approved=eq.true&id=eq."+body.DoctorID, "", &docs); err != nil {
			log.Printf("verification-request doctor lookup: %v", err)
			s.JSONError(w, http.StatusInternalServerError, "failed to verify doctor")
			return
		}
		if len(docs) == 0 {
			s.JSONError(w, http.StatusNotFound, "doctor not found")
			return
		}
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

	userID := user.ID

	// Same patient + same doctor + same report while the first request is still pending = a double click / retry:
	// answer with the existing request instead of creating a duplicate in the doctor's inbox. The fingerprint lives
	// in the (otherwise unused) inquiries.notes column so the lookup is a plain indexed filter.
	fp := sha256.New()
	fpBytes, _ := json.Marshal([]any{body.DoctorID, patientName, body.ReportData})
	fp.Write(fpBytes)
	dedupeKey := "req:" + hex.EncodeToString(fp.Sum(nil))[:32]

	record := map[string]any{
		"user_id":   userID,
		"doctor_id": body.DoctorID, // top-level column so the doctor inbox queries cleanly
		"status":    "pending",
		"symptoms":  "Request for Verification",
		"notes":     dedupeKey,
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

	defer lockKey("vr:" + userID)()

	ctx, cancel := context.WithTimeout(r.Context(), 15*time.Second)
	defer cancel()

	var existing []map[string]json.RawMessage
	dq := "select=id&user_id=eq." + userID + "&doctor_id=eq." + body.DoctorID + "&status=eq.pending&notes=eq." + dedupeKey + "&limit=1"
	if err := s.DB.Select(ctx, "inquiries", dq, "", &existing); err == nil && len(existing) > 0 {
		dupID := ""
		if raw, ok := existing[0]["id"]; ok {
			_ = json.Unmarshal(raw, &dupID)
		}
		s.JSON(w, http.StatusOK, map[string]any{
			"success": true,
			"data": map[string]any{
				"id":        dupID,
				"doctor":    body.DoctorName,
				"status":    "pending",
				"duplicate": true,
			},
		})
		return
	}

	// A patient may hold only so many requests: each carries a full report and all of them are served to the
	// doctors' shared inbox.
	var mine []map[string]json.RawMessage
	if err := s.DB.Select(ctx, "inquiries", "select=id&user_id=eq."+userID+"&limit="+strconv.Itoa(maxRequestsPerPatient), "", &mine); err == nil && len(mine) >= maxRequestsPerPatient {
		s.JSONError(w, http.StatusTooManyRequests, "you have reached the maximum number of consultation requests; cancel an old one first")
		return
	}

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
// The guest row is CLAIMED first with a conditional update (migrated_to_user_id IS NULL), so a double click or two
// accounts holding the token can never both succeed; the claim is released again if the copy fails.
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
	if !validID(body.SessionToken) {
		s.JSONError(w, http.StatusBadRequest, "invalid sessionToken")
		return
	}

	defer lockKey("guest:" + body.SessionToken)()

	ctx, cancel := context.WithTimeout(r.Context(), 20*time.Second)
	defer cancel()

	// 1. Atomically claim the unmigrated guest session (the response carries the full row).
	var guestRows []map[string]json.RawMessage
	claim := map[string]any{"migrated_to_user_id": user.ID, "migrated_at": dtNowISO()}
	q := "session_token=eq." + body.SessionToken + "&migrated_to_user_id=is.null"
	if err := s.DB.Update(ctx, "guest_diagnosis_sessions", q, claim, "", &guestRows); err != nil {
		log.Printf("migrate-guest-session claim: %v", err)
		s.JSONError(w, http.StatusInternalServerError, "failed to migrate session")
		return
	}
	if len(guestRows) == 0 {
		s.JSONError(w, http.StatusBadRequest, "guest session not found or already migrated")
		return
	}
	guest := guestRows[0]

	guestID := ""
	if raw, ok := guest["id"]; ok {
		_ = json.Unmarshal(raw, &guestID)
	}
	release := func() {
		if validID(guestID) {
			var ignore []map[string]any
			_ = s.DB.Update(ctx, "guest_diagnosis_sessions", "id=eq."+guestID,
				map[string]any{"migrated_to_user_id": nil, "migrated_at": nil}, "", &ignore)
		}
	}

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

	// 2. Insert into diagnosis_sessions. created_at is carried over: the assessment keeps its own date instead of
	// becoming the registration date (history order and the "journey" day count depend on it).
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
	if created := field("created_at"); created != nil {
		newSession["created_at"] = created
	}

	var inserted []map[string]json.RawMessage
	if err := s.DB.Insert(ctx, "diagnosis_sessions", newSession, user.Token, &inserted); err != nil {
		log.Printf("migrate-guest-session insert: %v", err)
		release() // the copy failed: give the token back so the guest can retry
		s.JSONError(w, http.StatusInternalServerError, "failed to migrate session")
		return
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

// dtCountRows counts the rows matching filter (skipping those for which hidden() is true), paging through the table
// 1000 rows at a time because PostgREST caps one response (Supabase: max-rows 1000). cols must include whatever
// hidden() reads. Stops at 50 pages (50 000 rows).
func (s *Server) dtCountRows(ctx context.Context, table, cols, filter, userToken string, hidden func(map[string]any) bool) int {
	total := 0
	for page := 0; page < 50; page++ {
		var rows []map[string]any
		q := "select=" + cols
		if filter != "" {
			q += "&" + filter
		}
		q += "&limit=1000&offset=" + strconv.Itoa(page*1000)
		if err := s.DB.Select(ctx, table, q, userToken, &rows); err != nil {
			break
		}
		for _, row := range rows {
			if hidden == nil || !hidden(row) {
				total++
			}
		}
		if len(rows) < 1000 {
			break
		}
	}
	return total
}

func dtIsHidden(row map[string]any) bool {
	h, _ := row["is_hidden"].(bool)
	return h
}

// handlePatientSessionsList returns the authenticated user's diagnosis sessions, newest first. The list is paged
// (limit default 50, max 100; offset) and declares its total so a long history is never silently cut off; a single
// report can be fetched by ?id=. Sessions the patient hid (is_hidden) are not listed.
func (s *Server) handlePatientSessionsList(w http.ResponseWriter, r *http.Request, user *AuthUser) {
	ctx, cancel := context.WithTimeout(r.Context(), 15*time.Second)
	defer cancel()

	qs := r.URL.Query()
	limit, offset := sessionsPageDefault, 0
	if v := qs.Get("limit"); v != "" {
		n, err := strconv.Atoi(v)
		if err != nil || n < 1 {
			s.JSONError(w, http.StatusBadRequest, "limit must be a positive integer")
			return
		}
		limit = n
		if limit > sessionsPageMax {
			limit = sessionsPageMax
		}
	}
	if v := qs.Get("offset"); v != "" {
		n, err := strconv.Atoi(v)
		if err != nil || n < 0 {
			s.JSONError(w, http.StatusBadRequest, "offset must be a non-negative integer")
			return
		}
		offset = n
	}

	const cols = "id,created_at,symptoms,constitution,full_report,is_hidden"
	filter := "user_id=eq." + user.ID
	if id := qs.Get("id"); id != "" {
		if !validUUID(id) {
			s.JSONError(w, http.StatusBadRequest, "invalid id")
			return
		}
		filter += "&id=eq." + id
	}
	q := "select=" + cols + "&" + filter + "&order=created_at.desc&limit=" + strconv.Itoa(limit) + "&offset=" + strconv.Itoa(offset)
	var rows []map[string]any
	if err := s.DB.Select(ctx, "diagnosis_sessions", q, user.Token, &rows); err != nil {
		log.Printf("patient/sessions list: %v", err)
		s.JSONError(w, http.StatusInternalServerError, "failed to fetch sessions")
		return
	}
	sessions := make([]map[string]any, 0, len(rows))
	for _, row := range rows {
		if dtIsHidden(row) {
			continue
		}
		delete(row, "is_hidden")
		sessions = append(sessions, row)
	}

	total := s.dtCountRows(ctx, "diagnosis_sessions", "id,is_hidden", filter, user.Token, dtIsHidden)
	hasMore := offset+len(rows) < total || (len(rows) == limit && offset+limit < total)
	s.JSON(w, http.StatusOK, map[string]any{
		"sessions":  sessions,
		"total":     total,
		"limit":     limit,
		"offset":    offset,
		"has_more":  hasMore,
		"truncated": hasMore,
	})
}

// handlePatientSessionsCreate inserts a new diagnosis session for the authenticated user.
func (s *Server) handlePatientSessionsCreate(w http.ResponseWriter, r *http.Request, user *AuthUser) {
	var payload map[string]any
	if !dtReadJSON(w, r, &payload) {
		return
	}
	// Enforce the authenticated user's ID
	dtFilterColumns(payload, dtSessionColumns, "is_hidden")
	payload["user_id"] = user.ID
	dtNormalizeSymptoms(payload)
	if msg := dtValidateSession(payload); msg != "" {
		s.JSONError(w, http.StatusBadRequest, msg)
		return
	}
	if msg := dtEnsureSessionRequired(payload); msg != "" {
		s.JSONError(w, http.StatusBadRequest, msg)
		return
	}

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
