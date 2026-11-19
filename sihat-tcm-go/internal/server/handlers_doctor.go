package server

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"log"
	"net/http"
	"net/url"
	"sort"
	"strconv"
	"strings"
	"time"
)

// registerDoctorRoutes wires the patient↔doctor flow: a public doctor directory
// the patient chooses from, the doctor's inbox of routed records, the patient's
// own consultations (with doctor feedback), and guest report persistence.
func (s *Server) registerDoctorRoutes() {
	// Public directory — patients browse registered doctors and pick one.
	s.Mux.HandleFunc("GET /api/doctors", s.handleDoctorsDirectory)
	// Doctor inbox — consultation requests routed to the authenticated doctor.
	s.Mux.HandleFunc("GET /api/doctor/requests", s.RequireAuth(s.handleDoctorRequests, "doctor"))
	// Doctor sets a triage flag (normal/watch/critical) on a request.
	s.Mux.HandleFunc("POST /api/doctor/flag", s.RequireAuth(s.handleDoctorFlag, "doctor"))
	// Patient consultations — the patient's own requests + any doctor replies.
	s.Mux.HandleFunc("GET /api/patient/requests", s.RequireAuth(s.handlePatientRequests))
	// Patient cancels/removes one of their own consultation requests.
	s.Mux.HandleFunc("POST /api/patient/requests/cancel", s.RequireAuth(s.handlePatientRequestCancel))
	// Patient profile — view + save basic profile fields.
	s.Mux.HandleFunc("GET /api/patient/profile", s.RequireAuth(s.handlePatientProfileGet))
	s.Mux.HandleFunc("PUT /api/patient/profile", s.RequireAuth(s.handlePatientProfilePut))
	// Guest report save (no auth) — returns a session_token for later migration. Anonymous and each call may store
	// up to 2 MB, so it is throttled per client.
	s.Mux.HandleFunc("POST /api/guest/sessions", s.RateLimit(10, 200, s.handleGuestSessionCreate))
}

// handleDoctorsDirectory returns approved doctors for the patient to choose from.
func (s *Server) handleDoctorsDirectory(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 15*time.Second)
	defer cancel()
	var docs []map[string]any
	q := "select=id,email,full_name,specialty,bio,years_experience,qualification,languages,clinic,avg_response_time&role=eq.doctor&is_approved=eq.true&order=full_name.asc"
	if err := s.DB.Select(ctx, "profiles", q, "", &docs); err != nil {
		log.Printf("doctors directory: %v", err)
		s.JSONError(w, http.StatusInternalServerError, "failed to load doctors")
		return
	}
	if docs == nil {
		docs = []map[string]any{}
	}
	// Public endpoint: a doctor's email is private. Only the seeded @sihat.com demo doctors keep theirs,
	// because the login page's "log in as a specific doctor" quick-access dropdown is built from it.
	for _, d := range docs {
		if em, _ := d["email"].(string); !strings.HasSuffix(strings.ToLower(em), "@sihat.com") {
			delete(d, "email")
		}
	}
	s.JSON(w, http.StatusOK, map[string]any{"doctors": docs})
}

const (
	inboxCols  = "select=id,user_id,doctor_id,symptoms,status,flag,diagnosis_report,created_at"
	inboxLimit = 300
)

// selectRowsResilient reads up to limit rows of table with the PostgREST query base (select/filter/order, no
// limit/offset). The common case is ONE request; if that fails (typically a response over the 10 MB client cap
// because of a few huge reports) it falls back to small pages, and to single rows inside a failing page, so one
// poisonous row costs only itself and never the whole listing.
func (s *Server) selectRowsResilient(ctx context.Context, table, base, userToken string, limit int) ([]map[string]any, error) {
	var rows []map[string]any
	err := s.DB.Select(ctx, table, base+"&limit="+strconv.Itoa(limit), userToken, &rows)
	if err == nil {
		return rows, nil
	}
	// A response that did not decode (typically cut at the client's 10 MB read cap) is not an outage: retry smaller.
	if dbBackendDown(err) && !strings.Contains(err.Error(), "decode") {
		return nil, err
	}
	log.Printf("%s listing failed (%v); retrying in small pages", table, err)
	out := make([]map[string]any, 0, limit)
	for off := 0; off < limit; {
		page := 8
		if off+page > limit {
			page = limit - off
		}
		var got []map[string]any
		perr := s.DB.Select(ctx, table, base+"&limit="+strconv.Itoa(page)+"&offset="+strconv.Itoa(off), userToken, &got)
		if perr != nil {
			if dbBackendDown(perr) && !strings.Contains(perr.Error(), "decode") {
				return nil, perr
			}
			for i := 0; i < page; i++ { // find and skip the unreadable row(s)
				var one []map[string]any
				if e := s.DB.Select(ctx, table, base+"&limit=1&offset="+strconv.Itoa(off+i), userToken, &one); e != nil {
					log.Printf("%s listing: skipping unreadable row at offset %d: %v", table, off+i, e)
					continue
				}
				if len(one) == 0 {
					return out, nil
				}
				out = append(out, one...)
			}
			off += page
			continue
		}
		out = append(out, got...)
		if len(got) < page {
			break
		}
		off += page
	}
	return out, nil
}

func rowCreatedAt(row map[string]any) time.Time {
	s, _ := row["created_at"].(string)
	if t, ok := parseTimestamp(s); ok {
		return t
	}
	return time.Time{}
}

// handleDoctorRequests lists consultation requests. /doctor is a MASTER inbox:
// any authenticated doctor sees ALL patient requests (each still shows which
// doctor the patient selected), so a single doctor can triage everything.
// The newest 300 are returned; if more exist the response says so (total / truncated / next) AND still includes
// every older request that is unresolved (pending, or flagged watch/critical), so triage never loses an open case.
// ?before=<RFC3339> continues the listing after a truncated page.
func (s *Server) handleDoctorRequests(w http.ResponseWriter, r *http.Request, user *AuthUser) {
	ctx, cancel := context.WithTimeout(r.Context(), 30*time.Second)
	defer cancel()

	base := inboxCols + "&order=created_at.desc"
	before := r.URL.Query().Get("before")
	if before != "" {
		t, ok := parseTimestamp(before)
		if !ok {
			s.JSONError(w, http.StatusBadRequest, "before must be an RFC3339 timestamp")
			return
		}
		base += "&created_at=lt." + url.QueryEscape(t.Format(time.RFC3339Nano))
	}
	rows, err := s.selectRowsResilient(ctx, "inquiries", base, "", inboxLimit)
	if err != nil {
		log.Printf("doctor/requests: %v", err)
		s.JSONError(w, http.StatusInternalServerError, "failed to load requests")
		return
	}
	if rows == nil {
		rows = []map[string]any{}
	}

	total := len(rows)
	truncated := false
	next := ""
	if len(rows) >= inboxLimit {
		counted := s.dtCountRows(ctx, "inquiries", "id", "", "", nil)
		oldest := rowCreatedAt(rows[len(rows)-1])
		if before == "" && counted > total {
			total = counted
		}
		if counted > len(rows) && before == "" && !oldest.IsZero() {
			truncated = true
			next = oldest.Format(time.RFC3339Nano)
			seen := make(map[string]bool, len(rows))
			for _, row := range rows {
				id, _ := row["id"].(string)
				seen[id] = true
			}
			for _, f := range []string{"status=eq.pending", "flag=eq.critical", "flag=eq.watch"} {
				q := inboxCols + "&" + f + "&created_at=lt." + url.QueryEscape(oldest.Format(time.RFC3339Nano)) + "&order=created_at.desc"
				more, merr := s.selectRowsResilient(ctx, "inquiries", q, "", 200)
				if merr != nil {
					log.Printf("doctor/requests unresolved older rows (%s): %v", f, merr)
					continue
				}
				for _, row := range more {
					id, _ := row["id"].(string)
					if id != "" && !seen[id] {
						seen[id] = true
						rows = append(rows, row)
					}
				}
			}
			sort.SliceStable(rows, func(i, j int) bool { return rowCreatedAt(rows[i]).After(rowCreatedAt(rows[j])) })
		} else if before != "" && !oldest.IsZero() {
			truncated = true // a continuation page that is itself full: more may follow
			next = oldest.Format(time.RFC3339Nano)
		}
	}
	resp := map[string]any{"requests": rows, "total": total, "truncated": truncated}
	if truncated {
		resp["next"] = next
	}
	s.JSON(w, http.StatusOK, resp)
}

// handleDoctorFlag sets an EXPLICIT triage flag on a request (normal/watch/
// critical). Explicit — never keyword-inferred — to avoid false positives.
func (s *Server) handleDoctorFlag(w http.ResponseWriter, r *http.Request, user *AuthUser) {
	var body struct {
		RequestID string `json:"requestId"`
		Flag      string `json:"flag"`
	}
	if !dtReadJSON(w, r, &body) {
		return
	}
	if body.RequestID == "" || !validID(body.RequestID) {
		s.JSONError(w, http.StatusBadRequest, "valid requestId is required")
		return
	}
	// An unknown, empty or null flag used to be coerced to "normal": a malformed call silently downgraded a
	// critical triage flag. Reject it instead.
	flag := body.Flag
	switch flag {
	case "normal", "watch", "critical":
	default:
		s.JSONError(w, http.StatusBadRequest, "flag must be normal, watch or critical")
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 15*time.Second)
	defer cancel()
	var ignore []map[string]any
	if err := s.DB.Update(ctx, "inquiries", "id=eq."+body.RequestID, map[string]any{"flag": flag}, "", &ignore); err != nil {
		log.Printf("doctor/flag: %v", err)
		s.JSONError(w, http.StatusInternalServerError, "failed to set flag")
		return
	}
	if len(ignore) == 0 {
		s.JSONError(w, http.StatusNotFound, "request not found")
		return
	}
	s.JSON(w, http.StatusOK, map[string]any{"success": true, "flag": flag})
}

// handlePatientRequests lists the patient's own consultation requests + replies.
func (s *Server) handlePatientRequests(w http.ResponseWriter, r *http.Request, user *AuthUser) {
	ctx, cancel := context.WithTimeout(r.Context(), 15*time.Second)
	defer cancel()
	q := "select=id,doctor_id,symptoms,status,diagnosis_report,created_at&user_id=eq." + user.ID + "&order=created_at.desc"
	all, err := s.selectRowsResilient(ctx, "inquiries", q, "", 100)
	if err != nil {
		log.Printf("patient/requests: %v", err)
		s.JSONError(w, http.StatusInternalServerError, "failed to load consultations")
		return
	}
	rows := make([]map[string]any, 0, len(all))
	for _, row := range all {
		// a request the patient cancelled after the doctor had already worked on it is kept for the doctor only
		if rep, ok := row["diagnosis_report"].(map[string]any); ok {
			if c, _ := rep["cancelled_by_patient"].(bool); c {
				continue
			}
		}
		rows = append(rows, row)
	}
	s.JSON(w, http.StatusOK, map[string]any{"requests": rows})
}

// handlePatientRequestCancel cancels one of the patient's OWN consultation requests (ownership enforced by user_id).
// A request nobody has touched is deleted. Once a doctor has replied, written a plan or reviewed it, the row is KEPT
// (flagged cancelled_by_patient, hidden from the patient's list): hard-deleting it destroyed the doctor's clinical
// reply and plan with no trace.
func (s *Server) handlePatientRequestCancel(w http.ResponseWriter, r *http.Request, user *AuthUser) {
	var body struct {
		ID string `json:"id"`
	}
	if !dtReadJSON(w, r, &body) {
		return
	}
	if body.ID == "" || !validID(body.ID) {
		s.JSONError(w, http.StatusBadRequest, "valid id is required")
		return
	}

	defer inquiryLock("inquiries", body.ID)()

	ctx, cancel := context.WithTimeout(r.Context(), 15*time.Second)
	defer cancel()

	var rows []struct {
		UserID          string          `json:"user_id"`
		Status          string          `json:"status"`
		DiagnosisReport json.RawMessage `json:"diagnosis_report"`
	}
	if err := s.DB.Select(ctx, "inquiries", "select=user_id,status,diagnosis_report&id=eq."+body.ID, "", &rows); err != nil || len(rows) == 0 {
		s.JSONError(w, http.StatusNotFound, "request not found")
		return
	}
	if rows[0].UserID != user.ID {
		s.JSONError(w, http.StatusForbidden, "you can only cancel your own request")
		return
	}

	var report map[string]any
	if len(rows[0].DiagnosisReport) > 0 {
		_ = json.Unmarshal(rows[0].DiagnosisReport, &report)
	}
	touched := rows[0].Status == "reviewed" || report["treatment_plan"] != nil
	for _, m := range dtThreadMessages(report) {
		if mm, ok := m.(map[string]any); ok && mm["role"] == "doctor" {
			touched = true
		}
	}
	if touched {
		if report == nil {
			report = map[string]any{}
		}
		report["cancelled_by_patient"] = true
		report["cancelled_at"] = dtNowISO()
		var ignore []map[string]any
		if err := s.DB.Update(ctx, "inquiries", "id=eq."+body.ID, map[string]any{"diagnosis_report": report}, "", &ignore); err != nil {
			log.Printf("patient/requests/cancel archive: %v", err)
			s.JSONError(w, http.StatusInternalServerError, "failed to cancel request")
			return
		}
		s.JSON(w, http.StatusOK, map[string]any{"success": true, "archived": true})
		return
	}
	if err := s.DB.Delete(ctx, "inquiries", "id=eq."+body.ID, ""); err != nil {
		log.Printf("patient/requests/cancel: %v", err)
		s.JSONError(w, http.StatusInternalServerError, "failed to cancel request")
		return
	}
	s.JSON(w, http.StatusOK, map[string]any{"success": true})
}

// handlePatientProfileGet returns the patient's basic profile.
func (s *Server) handlePatientProfileGet(w http.ResponseWriter, r *http.Request, user *AuthUser) {
	ctx, cancel := context.WithTimeout(r.Context(), 15*time.Second)
	defer cancel()
	var rows []map[string]any
	q := "select=full_name,age,gender,height,weight,bmi,medical_history,preferred_language&id=eq." + user.ID
	if err := s.DB.Select(ctx, "profiles", q, "", &rows); err != nil {
		log.Printf("patient/profile get: %v", err)
		s.JSONError(w, http.StatusInternalServerError, "failed to load profile")
		return
	}
	profile := map[string]any{}
	if len(rows) > 0 {
		profile = rows[0]
	}
	profile["email"] = user.Email
	profile["role"] = user.Role
	s.JSON(w, http.StatusOK, map[string]any{"profile": profile})
}

// profileNumber validates one optional numeric profile field. A JSON null clears it (nil, ok); anything else must
// be a finite number inside [min, max] (and a whole number when whole is set).
func profileNumber(v any, min, max float64, whole bool) (any, bool) {
	if v == nil {
		return nil, true
	}
	f, ok := asFloat(v)
	if !ok || f < min || f > max {
		return nil, false
	}
	if whole {
		n, ok := asInt(v)
		if !ok {
			return nil, false
		}
		return n, true
	}
	return f, true
}

// handlePatientProfilePut saves the patient's basic profile fields. A field that is present is saved; an empty
// string / null CLEARS the free-text and numeric fields (they could never be emptied again before), and a blank
// full name is refused. Numbers must be plausible: age 1-120, height 30-300 cm, weight 2-500 kg, BMI 5-100.
func (s *Server) handlePatientProfilePut(w http.ResponseWriter, r *http.Request, user *AuthUser) {
	var body map[string]any
	if !dtReadJSON(w, r, &body) {
		return
	}
	upd := map[string]any{"id": user.ID}

	if v, ok := body["full_name"]; ok && v != nil {
		name, isStr := v.(string)
		if !isStr {
			s.JSONError(w, http.StatusBadRequest, "full_name must be a string")
			return
		}
		if len([]rune(name)) > 200 {
			s.JSONError(w, http.StatusBadRequest, "profile field too long")
			return
		}
		trimmed := strings.TrimSpace(name)
		switch {
		case trimmed == "" && name != "":
			s.JSONError(w, http.StatusBadRequest, "full_name must not be blank")
			return
		case hasUnsafeRunes(trimmed, false):
			s.JSONError(w, http.StatusBadRequest, "full_name must not contain control or invisible formatting characters")
			return
		case trimmed != "":
			upd["full_name"] = trimmed
		}
	}
	for _, f := range []struct {
		key      string
		min, max float64
		whole    bool
	}{{"age", 1, 120, true}, {"height", 30, 300, false}, {"weight", 2, 500, false}, {"bmi", 5, 100, false}} {
		v, present := body[f.key]
		if !present {
			continue
		}
		val, ok := profileNumber(v, f.min, f.max, f.whole)
		if !ok {
			lo, hi := strconv.FormatFloat(f.min, 'f', -1, 64), strconv.FormatFloat(f.max, 'f', -1, 64)
			switch {
			case func() bool { _, isNum := v.(float64); return !isNum }():
				s.JSONError(w, http.StatusBadRequest, f.key+" must be a number")
			case f.whole:
				s.JSONError(w, http.StatusBadRequest, f.key+" must be a whole number between "+lo+" and "+hi)
			default:
				s.JSONError(w, http.StatusBadRequest, f.key+" must be between "+lo+" and "+hi)
			}
			return
		}
		upd[f.key] = val
	}
	for _, f := range []struct {
		key string
		max int
	}{{"gender", 50}, {"medical_history", maxReplyChars}} {
		v, present := body[f.key]
		if !present {
			continue
		}
		if v == nil {
			upd[f.key] = nil
			continue
		}
		str, isStr := v.(string)
		if !isStr {
			s.JSONError(w, http.StatusBadRequest, f.key+" must be a string")
			return
		}
		if len([]rune(str)) > f.max {
			s.JSONError(w, http.StatusBadRequest, "profile field too long")
			return
		}
		if hasUnsafeRunes(str, f.key == "medical_history") {
			s.JSONError(w, http.StatusBadRequest, f.key+" must not contain control characters")
			return
		}
		if strings.TrimSpace(str) == "" {
			upd[f.key] = nil // cleared
		} else {
			upd[f.key] = str
		}
	}
	if v, ok := body["preferred_language"]; ok && v != nil {
		l, isStr := v.(string)
		if !isStr || (l != "" && l != "en" && l != "zh" && l != "ms") {
			s.JSONError(w, http.StatusBadRequest, "preferred_language must be en, zh or ms")
			return
		}
		if l != "" {
			upd["preferred_language"] = l
		}
	}

	ctx, cancel := context.WithTimeout(r.Context(), 15*time.Second)
	defer cancel()
	var ignore []map[string]any
	if err := s.DB.Upsert(ctx, "profiles", upd, "", &ignore); err != nil {
		log.Printf("patient/profile put: %v", err)
		s.JSONError(w, http.StatusInternalServerError, "failed to save profile")
		return
	}
	s.JSON(w, http.StatusOK, map[string]any{"success": true})
}

// handleGuestSessionCreate persists a guest diagnosis report and returns a
// session_token the client stores to migrate the report after registering.
func (s *Server) handleGuestSessionCreate(w http.ResponseWriter, r *http.Request) {
	var payload map[string]any
	if !dtReadJSONLimit(w, r, &payload, guestBodyMax) {
		return
	}
	if payload == nil { // literal JSON null
		s.JSONError(w, http.StatusBadRequest, "invalid JSON body")
		return
	}
	dtNormalizeSymptoms(payload)
	token, err := randToken(16)
	if err != nil {
		s.JSONError(w, http.StatusInternalServerError, "failed to create token")
		return
	}
	dtFilterColumns(payload, dtSessionColumns, "guest_email", "guest_name")
	payload["session_token"] = token
	// Never let the client set server-controlled columns.
	for _, k := range []string{"id", "user_id", "migrated_to_user_id", "migrated_at", "created_at", "updated_at"} {
		delete(payload, k)
	}
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
	if err := s.DB.Insert(ctx, "guest_diagnosis_sessions", payload, "", &inserted); err != nil {
		log.Printf("guest/sessions create: %v", err)
		s.JSONError(w, http.StatusInternalServerError, "failed to save guest session")
		return
	}
	s.JSON(w, http.StatusCreated, map[string]any{"success": true, "session_token": token})
}

// guestBodyMax caps an anonymous guest-session upload (2MB).
const guestBodyMax = 2 << 20

// randToken returns a hex-encoded cryptographically-random token of n bytes.
func randToken(n int) (string, error) {
	b := make([]byte, n)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}
