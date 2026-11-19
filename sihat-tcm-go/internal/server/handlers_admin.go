package server

import (
	"context"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"os"
	"regexp"
	"runtime"
	"strconv"
	"strings"
	"time"

	"sihattcm/internal/gemini"
)

// dtStartTime records when the server process started.
var dtStartTime = time.Now()

// dtRequiredPromptRoles lists the system prompt roles the app really reads (prompts.go) and db-status checks. A
// missing row for one of them silently falls back to the built-in default, which the admin should be able to see.
var dtRequiredPromptRoles = []string{
	PromptDoctorChat,
	PromptDoctorFinal,
	PromptDoctorImage,
	PromptDoctorListening,
	PromptDoctorInquirySummary,
	PromptDoctorReportChat,
	PromptDoctorWesternChat,
	PromptHeartCompanion,
}

// registerAdminRoutes mounts admin, logs, config, and monitoring endpoints.
func (s *Server) registerAdminRoutes() {
	// Admin settings
	s.Mux.HandleFunc("GET /api/admin/settings", s.RequireAuth(s.handleAdminSettingsGet, "admin", "developer"))
	s.Mux.HandleFunc("PUT /api/admin/settings", s.RequireAuth(s.handleAdminSettingsPut, "admin"))

	// DB status — exposes user counts and prompt coverage, so admin/developer only.
	s.Mux.HandleFunc("GET /api/admin/db-status", s.RequireAuth(s.handleAdminDBStatus, "admin", "developer"))

	// System health — GET requires auth; POST is open (error ingestion)
	s.Mux.HandleFunc("GET /api/admin/system-health", s.RequireAuth(s.handleAdminSystemHealthGet, "admin", "developer"))
	// The ingest is open (the browser reports its own errors) so it is rate-limited like /api/logs: a handful of
	// anonymous "critical" posts flips the admin console to unhealthy.
	s.Mux.HandleFunc("POST /api/admin/system-health", s.RateLimit(30, 1000, s.handleAdminSystemHealthPost))

	// Doctor approval: a self-registered doctor can use the doctor APIs only after an admin approves the account.
	s.Mux.HandleFunc("GET /api/admin/doctors", s.RequireAuth(s.handleAdminDoctorsList, "admin"))
	s.Mux.HandleFunc("POST /api/admin/doctors/approve", s.RequireAuth(s.handleAdminDoctorApprove, "admin"))

	// Test API key
	s.Mux.HandleFunc("POST /api/admin/test-api-key", s.RequireAuth(s.handleAdminTestAPIKey, "admin"))

	// Logs
	s.Mux.HandleFunc("GET /api/logs", s.RequireAuth(s.handleLogsGet, "developer", "admin"))
	s.Mux.HandleFunc("POST /api/logs", s.RateLimit(60, 2000, s.handleLogsPost))

	// Gemini key for mobile (unauthenticated by design, token-gated): rate-limited so the token cannot be ground down
	s.Mux.HandleFunc("GET /api/config/gemini-key", s.RateLimit(10, 100, s.handleConfigGeminiKey))

	// Monitoring health + metrics
	s.Mux.HandleFunc("GET /api/monitoring/health", s.handleMonitoringHealth)
	s.Mux.HandleFunc("GET /api/monitoring/metrics", s.RequireAuth(s.handleMonitoringMetricsGet, "admin", "developer"))
	s.Mux.HandleFunc("POST /api/monitoring/metrics", s.RateLimit(60, 2000, s.handleMonitoringMetricsPost))
}

// ---- Admin Settings ----

// handleAdminSettingsGet reads all rows from admin_settings and returns the first (or empty object).
// geminiApiKey is masked to the last 6 characters.
func (s *Server) handleAdminSettingsGet(w http.ResponseWriter, r *http.Request, _ *AuthUser) {
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	var rows []map[string]any
	if err := s.DB.Select(ctx, "admin_settings", "select=*", "", &rows); err != nil {
		log.Printf("admin/settings get: %v", err)
		s.JSONError(w, http.StatusInternalServerError, "failed to retrieve settings")
		return
	}

	settings := map[string]any{}
	if len(rows) > 0 {
		settings = rows[0]
	}

	s.JSON(w, http.StatusOK, maskSecrets(settings))
}

// isSecretName reports whether a settings key names a secret (gemini_api_key, openai_api_key, smtp_password, tokens ...).
func isSecretName(k string) bool {
	lk := strings.ToLower(k)
	return strings.Contains(lk, "key") || strings.Contains(lk, "secret") || strings.Contains(lk, "token") || strings.Contains(lk, "password")
}

// maskSecretString shows only the last 6 characters of a secret ("***" when it is that short).
func maskSecretString(raw string) string {
	if len(raw) > 6 {
		return "..." + raw[len(raw)-6:]
	}
	return "***"
}

// isMaskedSecret reports whether s is a value maskSecretString produced (a form that loaded the masked setting and
// saves it back sends exactly that, and it must never overwrite the real secret).
func isMaskedSecret(s string) bool {
	return s == "***" || (len(s) == 9 && strings.HasPrefix(s, "..."))
}

// maskSecrets masks every secret-looking string at ANY depth (the admin_settings.settings JSON can carry
// smtp_password, nested *_api_key ...), in place, and returns v.
func maskSecrets(v any) any {
	switch x := v.(type) {
	case map[string]any:
		for k, e := range x {
			if str, ok := e.(string); ok && str != "" && isSecretName(k) {
				x[k] = maskSecretString(str)
				continue
			}
			x[k] = maskSecrets(e)
		}
	case []any:
		for i := range x {
			x[i] = maskSecrets(x[i])
		}
	}
	return v
}

// restoreMasked walks the incoming settings document and, wherever a secret-named string is a masked placeholder,
// puts the previously stored real value back (or drops the key when there is none), so a mask never overwrites a secret.
func restoreMasked(in, old any) any {
	switch x := in.(type) {
	case map[string]any:
		om, _ := old.(map[string]any)
		for k, e := range x {
			if str, ok := e.(string); ok && isSecretName(k) && isMaskedSecret(str) {
				if prev, ok := om[k].(string); ok {
					x[k] = prev
				} else {
					delete(x, k)
				}
				continue
			}
			x[k] = restoreMasked(e, om[k])
		}
	case []any:
		oa, _ := old.([]any)
		for i := range x {
			var o any
			if i < len(oa) {
				o = oa[i]
			}
			x[i] = restoreMasked(x[i], o)
		}
	}
	return in
}

// validMusicURL accepts an absolute http(s) URL or a site-relative path; javascript:, data: and friends are refused.
func validMusicURL(u string) bool {
	if len(u) > 2000 || hasUnsafeRunes(u, false) {
		return false
	}
	if strings.HasPrefix(u, "/") && !strings.HasPrefix(u, "//") {
		return true
	}
	p, err := url.Parse(u)
	return err == nil && (p.Scheme == "http" || p.Scheme == "https") && p.Host != ""
}

// cleanAdminSettings validates the types of an admin_settings update (whitelisted columns only).
func cleanAdminSettings(body map[string]any) string {
	for k, v := range body {
		switch k {
		case "music_enabled":
			if _, ok := v.(bool); !ok && v != nil {
				return "music_enabled must be true or false"
			}
		case "music_url":
			if v == nil {
				continue
			}
			str, ok := v.(string)
			if !ok || (str != "" && !validMusicURL(str)) {
				return "music_url must be an http(s) URL or a site-relative path"
			}
		case "acknowledged_alerts":
			if v == nil {
				continue
			}
			arr, ok := v.([]any)
			if !ok || len(arr) > 500 {
				return "acknowledged_alerts must be a list of strings"
			}
			for _, e := range arr {
				if str, ok := e.(string); !ok || len(str) > 500 {
					return "acknowledged_alerts must be a list of strings"
				}
			}
		case "gemini_api_key", "openai_api_key":
			if v == nil {
				continue
			}
			if str, ok := v.(string); !ok || len(str) > 512 || hasUnsafeRunes(str, false) {
				return k + " must be a string of at most 512 characters"
			}
		case "settings":
			if v == nil {
				continue // stored as {}
			}
			m, ok := v.(map[string]any)
			if !ok || jsonDepthExceeds(m, 20) {
				return "settings must be a JSON object"
			}
			if b, err := json.Marshal(m); err != nil || len(b) > 64<<10 {
				return "settings is too large (max 64 KB)"
			}
		}
	}
	return ""
}

// adminSettingsColumns are the writable columns of public.admin_settings (db/schema.sql).
var adminSettingsColumns = map[string]bool{
	"acknowledged_alerts": true, "music_url": true, "music_enabled": true,
	"gemini_api_key": true, "openai_api_key": true, "settings": true,
}

// adminSettingsAllowed returns only the whitelisted columns of in.
func adminSettingsAllowed(in map[string]any) map[string]any {
	out := make(map[string]any, len(in))
	for k, v := range in {
		if adminSettingsColumns[k] {
			out[k] = v
		}
	}
	return out
}

// handleAdminSettingsPut merges and upserts admin settings (admin role required).
func (s *Server) handleAdminSettingsPut(w http.ResponseWriter, r *http.Request, _ *AuthUser) {
	var in map[string]any
	if !dtReadJSON(w, r, &in) {
		return
	}
	// Only real admin_settings columns are forwarded: PostgREST answers 400/500 for unknown columns,
	// and an admin must not be able to write arbitrary columns (id, updated_at …) either.
	body := adminSettingsAllowed(in)
	if len(body) == 0 {
		s.JSONError(w, http.StatusBadRequest, "no recognised settings in request")
		return
	}
	if msg := cleanAdminSettings(body); msg != "" {
		s.JSONError(w, http.StatusBadRequest, msg)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	// The GET masks secrets, so a form that loads the settings and saves them back sends the MASK. Never let a mask
	// overwrite the stored secret: restore the real value (nested ones too) or drop the key.
	var current []map[string]any
	_ = s.DB.Select(ctx, "admin_settings", "select=*&limit=1", "", &current)
	var stored map[string]any
	if len(current) > 0 {
		stored = current[0]
	}
	for _, k := range []string{"gemini_api_key", "openai_api_key"} {
		if str, ok := body[k].(string); ok && isMaskedSecret(str) {
			delete(body, k)
		}
	}
	if st, ok := body["settings"]; ok {
		if st == nil {
			body["settings"] = map[string]any{}
		} else {
			body["settings"] = restoreMasked(st, stored["settings"])
		}
	}
	if len(body) == 0 { // only masked placeholders were sent: nothing to change
		s.JSON(w, http.StatusOK, map[string]any{"success": true, "settings": maskSecrets(stored)})
		return
	}

	// Try update; insert if nothing exists.
	var updated []map[string]any
	err := s.DB.Update(ctx, "admin_settings", "id=gt.0", body, "", &updated)
	if err != nil || len(updated) == 0 {
		var inserted []map[string]any
		if err2 := s.DB.Insert(ctx, "admin_settings", body, "", &inserted); err2 != nil {
			log.Printf("admin/settings put: %v", err2)
			s.JSONError(w, http.StatusInternalServerError, "failed to save settings")
			return
		}
		if len(inserted) > 0 {
			updated = inserted
		}
	}

	var result any
	if len(updated) > 0 {
		result = updated[0]
	} else {
		result = body
	}
	// the response is masked exactly like the GET: the full key must not travel back into proxy / browser logs
	s.JSON(w, http.StatusOK, map[string]any{"success": true, "settings": maskSecrets(result)})
}

// ---- DB Status ----

// handleAdminDBStatus checks connectivity and system_prompts coverage.
func (s *Server) handleAdminDBStatus(w http.ResponseWriter, r *http.Request, _ *AuthUser) {
	if !s.DB.Configured() {
		s.JSON(w, http.StatusOK, map[string]any{
			"connected":     false,
			"error":         "Supabase configuration missing",
			"promptsStatus": []any{},
		})
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 15*time.Second)
	defer cancel()

	// Connection test
	var testRows []map[string]any
	if err := s.DB.Select(ctx, "profiles", "select=id&limit=1", "", &testRows); err != nil {
		log.Printf("admin/db-status connection test: %v", err)
		s.JSON(w, http.StatusOK, map[string]any{
			"connected":     false,
			"error":         "database connection failed",
			"promptsStatus": []any{},
		})
		return
	}

	// Check system prompts
	rolesParam := ""
	for i, role := range dtRequiredPromptRoles {
		if i > 0 {
			rolesParam += ","
		}
		rolesParam += role
	}
	var promptRows []struct {
		Role       string `json:"role"`
		PromptText string `json:"prompt_text"`
	}
	_ = s.DB.Select(ctx, "system_prompts",
		"select=role,prompt_text&role=in.("+rolesParam+")", "", &promptRows)

	existingRoles := map[string]string{}
	for _, p := range promptRows {
		existingRoles[p.Role] = p.PromptText
	}

	promptsStatus := make([]map[string]any, 0, len(dtRequiredPromptRoles))
	for _, role := range dtRequiredPromptRoles {
		text, exists := existingRoles[role]
		promptsStatus = append(promptsStatus, map[string]any{
			"role":       role,
			"exists":     exists,
			"hasContent": exists && len(text) > 0,
		})
	}

	// Counts — paged id listings counted client-side (no Prefer:count header needed). One response is capped at
	// 1000 rows by PostgREST, so a single request froze the console numbers at 1000.
	totalUsers := s.dtCountRows(ctx, "profiles", "id", "", "", nil)
	adminUsers := s.dtCountRows(ctx, "profiles", "id", "role=eq.admin", "", nil)
	totalDiagnoses := s.dtCountRows(ctx, "diagnosis_sessions", "id", "", "", nil)

	s.JSON(w, http.StatusOK, map[string]any{
		"connected":     true,
		"promptsStatus": promptsStatus,
		"stats": map[string]int{
			"totalUsers":     totalUsers,
			"adminUsers":     adminUsers,
			"totalDiagnoses": totalDiagnoses,
		},
	})
}

// ---- System Health ----

// handleAdminSystemHealthGet returns error statistics and recent errors from system_errors.
func (s *Server) handleAdminSystemHealthGet(w http.ResponseWriter, r *http.Request, _ *AuthUser) {
	ctx, cancel := context.WithTimeout(r.Context(), 20*time.Second)
	defer cancel()

	since24h := time.Now().UTC().Add(-24 * time.Hour).Format(time.RFC3339)

	// Fetch errors from last 24h
	var errRows []map[string]any
	_ = s.DB.Select(ctx, "system_errors",
		"select=severity,resolved&created_at=gte."+since24h, "", &errRows)

	// The severity counters and the overall status describe what is OPEN: a critical error an operator already
	// resolved must not keep the console at "degraded". The *_total fields keep the 24 h totals incl. resolved.
	total := len(errRows)
	var critical, high, medium, low, resolved, criticalAll, highAll int
	for _, e := range errRows {
		sev, _ := e["severity"].(string)
		res, _ := e["resolved"].(bool)
		switch sev {
		case "critical":
			criticalAll++
		case "high":
			highAll++
		}
		if res {
			resolved++
			continue
		}
		switch sev {
		case "critical":
			critical++
		case "high":
			high++
		case "medium":
			medium++
		case "low":
			low++
		}
	}

	// Recent 20 errors
	var recentErrors []map[string]any
	_ = s.DB.Select(ctx, "system_errors",
		"select=*&order=created_at.desc&limit=20", "", &recentErrors)
	if recentErrors == nil {
		recentErrors = []map[string]any{}
	}

	// DB ping
	dbOK := "healthy"
	var pingRows []map[string]any
	if err := s.DB.Select(ctx, "profiles", "select=id&limit=1", "", &pingRows); err != nil {
		dbOK = "unhealthy"
	}

	uptime := time.Since(dtStartTime).Seconds()

	s.JSON(w, http.StatusOK, map[string]any{
		"timestamp":      dtNowISO(),
		"overall_status": dtOverallStatus(critical, high, dbOK),
		"error_statistics": map[string]any{
			"total_errors":      total,
			"critical_errors":   critical,
			"high_errors":       high,
			"medium_errors":     medium,
			"low_errors":        low,
			"critical_total":    criticalAll,
			"high_total":        highAll,
			"resolved_errors":   resolved,
			"unresolved_errors": total - resolved,
			"error_rate_24h":    total,
		},
		"recent_errors": recentErrors,
		"system_info": map[string]any{
			"go_version": runtime.Version(),
			"uptime":     uptime,
		},
	})
}

// handleAdminSystemHealthPost inserts a system error; falls back to system_logs on table-missing.
func (s *Server) handleAdminSystemHealthPost(w http.ResponseWriter, r *http.Request) {
	var in map[string]any
	if !dtReadJSON(w, r, &in) {
		return
	}
	body, bad := cleanSystemError(in)
	if bad != "" {
		s.JSONError(w, http.StatusBadRequest, bad)
		return
	}
	// The reporter is whoever the session says they are: a client-supplied user_id would let anyone pin an error
	// on any user (POST /api/logs derives it the same way).
	body["user_id"] = nil
	if BearerToken(r) != "" {
		if u := s.Authenticate(r); u != nil {
			body["user_id"] = u.ID
		}
	}

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	var inserted []map[string]any
	err := s.DB.Insert(ctx, "system_errors", body, "", &inserted)
	if err != nil {
		log.Printf("admin/system-health post (falling back to system_logs): %v", err)
		// Fallback to system_logs
		sev, _ := body["severity"].(string)
		level := "warn"
		if sev == "critical" || sev == "high" {
			level = "error"
		}
		logRow := map[string]any{
			"level":    level,
			"category": body["error_type"],
			"message":  body["message"],
			"metadata": body["metadata"],
			"user_id":  body["user_id"],
		}
		var logInserted []map[string]any
		if err2 := s.DB.Insert(ctx, "system_logs", logRow, "", &logInserted); err2 != nil {
			log.Printf("admin/system-health post fallback: %v", err2)
		}
		s.JSON(w, http.StatusOK, map[string]any{
			"success":  true,
			"error_id": "fallback-log",
			"fallback": true,
		})
		return
	}

	errorID := ""
	if len(inserted) > 0 {
		if raw, ok := inserted[0]["id"]; ok {
			b, _ := json.Marshal(raw)
			json.Unmarshal(b, &errorID)
		}
	}
	s.JSON(w, http.StatusOK, map[string]any{"success": true, "error_id": errorID})
}

var systemErrorSeverities = map[string]bool{"low": true, "medium": true, "high": true, "critical": true}

// cleanSystemError validates an error report and returns the columns to store (server-controlled ones such as id,
// resolved, created_at, user_id are ignored if sent; anything else unknown is refused instead of being swallowed
// into the log fallback with a fake "success").
func cleanSystemError(in map[string]any) (map[string]any, string) {
	out := map[string]any{"severity": "medium", "metadata": map[string]any{}}
	for _, f := range []struct {
		key      string
		max      int
		required bool
	}{{"error_type", 100, true}, {"message", 10000, true}, {"stack_trace", 20000, false}, {"component", 200, false},
		{"session_id", 255, false}, {"url", 2000, false}, {"user_agent", 500, false}} {
		v, present := in[f.key]
		if !present || v == nil {
			if f.required {
				return nil, "error_type and message are required"
			}
			continue
		}
		str, ok := v.(string)
		if !ok {
			return nil, f.key + " must be a string"
		}
		if f.required && strings.TrimSpace(str) == "" {
			return nil, "error_type and message are required"
		}
		if len([]rune(str)) > f.max {
			return nil, f.key + " is too long"
		}
		out[f.key] = str
	}
	if v, ok := in["severity"]; ok && v != nil {
		sev, isStr := v.(string)
		if !isStr || !systemErrorSeverities[sev] {
			return nil, "severity must be low, medium, high or critical"
		}
		out["severity"] = sev
	}
	if v, ok := in["metadata"]; ok && v != nil {
		m, isObj := v.(map[string]any)
		if !isObj || jsonDepthExceeds(m, 20) {
			return nil, "metadata must be an object"
		}
		out["metadata"] = m
	}
	for k := range in {
		switch k {
		case "error_type", "message", "stack_trace", "component", "session_id", "url", "user_agent", "severity", "metadata":
		case "id", "user_id", "resolved", "resolved_at", "resolved_by", "created_at", "updated_at", "timestamp":
			// server-controlled: silently ignored
		default:
			return nil, "unknown field: " + k
		}
	}
	return out, ""
}

// ---- Doctor approval ----

// handleAdminDoctorsList lists doctor accounts with their approval state (admin only).
func (s *Server) handleAdminDoctorsList(w http.ResponseWriter, r *http.Request, _ *AuthUser) {
	ctx, cancel := context.WithTimeout(r.Context(), 15*time.Second)
	defer cancel()
	var rows []map[string]any
	q := "select=id,email,full_name,specialty,years_experience,is_approved,created_at&role=eq.doctor&order=created_at.desc&limit=500"
	if err := s.DB.Select(ctx, "profiles", q, "", &rows); err != nil {
		log.Printf("admin/doctors list: %v", err)
		s.JSONError(w, http.StatusInternalServerError, "failed to load doctors")
		return
	}
	if rows == nil {
		rows = []map[string]any{}
	}
	s.JSON(w, http.StatusOK, map[string]any{"doctors": rows})
}

// handleAdminDoctorApprove approves (default) or suspends a doctor account (admin only).
func (s *Server) handleAdminDoctorApprove(w http.ResponseWriter, r *http.Request, _ *AuthUser) {
	var body struct {
		ID       string `json:"id"`
		Approved *bool  `json:"approved"`
	}
	if !dtReadJSON(w, r, &body) {
		return
	}
	if !validUUID(body.ID) {
		s.JSONError(w, http.StatusBadRequest, "a valid doctor id is required")
		return
	}
	approved := body.Approved == nil || *body.Approved
	ctx, cancel := context.WithTimeout(r.Context(), 15*time.Second)
	defer cancel()
	var updated []map[string]any
	if err := s.DB.Update(ctx, "profiles", "id=eq."+body.ID+"&role=eq.doctor", map[string]any{"is_approved": approved}, "", &updated); err != nil {
		log.Printf("admin/doctors approve: %v", err)
		s.JSONError(w, http.StatusInternalServerError, "failed to update doctor")
		return
	}
	if len(updated) == 0 {
		s.JSONError(w, http.StatusNotFound, "doctor not found")
		return
	}
	s.JSON(w, http.StatusOK, map[string]any{"success": true, "id": body.ID, "is_approved": approved})
}

// dtOverallStatus derives a simple overall health string.
func dtOverallStatus(critical, high int, dbStatus string) string {
	if dbStatus == "unhealthy" || critical > 5 {
		return "unhealthy"
	}
	if critical > 0 || high > 10 {
		return "degraded"
	}
	return "healthy"
}

// ---- Test API Key ----

// handleAdminTestAPIKey tests a Gemini API key with a tiny generation call.
func (s *Server) handleAdminTestAPIKey(w http.ResponseWriter, r *http.Request, _ *AuthUser) {
	var body struct {
		APIKey      string `json:"apiKey"`
		UseSavedKey bool   `json:"useSavedKey"`
	}
	if !dtReadJSON(w, r, &body) {
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 30*time.Second)
	defer cancel()

	keyToTest := ""
	if body.UseSavedKey {
		// the key the admin saved in the console wins over the environment's
		var saved []map[string]any
		if err := s.DB.Select(ctx, "admin_settings", "select=gemini_api_key&limit=1", "", &saved); err == nil && len(saved) > 0 {
			keyToTest, _ = saved[0]["gemini_api_key"].(string)
		}
		if keyToTest == "" {
			keyToTest = s.Cfg.GeminiAPIKey
		}
		if keyToTest == "" {
			s.JSONError(w, http.StatusBadRequest, "no saved API key found")
			return
		}
	} else if body.APIKey != "" {
		keyToTest = body.APIKey
	} else {
		s.JSONError(w, http.StatusBadRequest, "apiKey is required")
		return
	}

	// Temporary client with the test key, aimed at the SAME backend as every real call: without the BaseURL the
	// probe went to generativelanguage.googleapis.com with the placeholder key even when all AI traffic is routed
	// through the local listener ("Invalid key" on a healthy install, and a hermetic stack leaking to the internet).
	testClient := &gemini.Client{
		APIKey:  keyToTest,
		HTTP:    s.AI.HTTP,
		BaseURL: s.AI.BaseURL,
	}
	resp, err := testClient.GenerateText(ctx, "gemini-2.0-flash", "",
		`Say "API key is valid" in exactly those words.`)
	if err != nil {
		log.Printf("admin/test-api-key: %s", anRedactKey(err.Error()))
		status, msg := classifyKeyTestError(err.Error())
		s.JSONError(w, status, msg)
		return
	}

	preview := resp
	if len(preview) > 50 {
		preview = preview[:50]
	}
	s.JSON(w, http.StatusOK, map[string]any{
		"success":  true,
		"message":  "API key is valid and working",
		"response": preview,
	})
}

// classifyKeyTestError maps an upstream Gemini error message to a client-safe
// status and message. Matching is case-insensitive; the raw text is never
// returned to the client.
func classifyKeyTestError(raw string) (int, string) {
	m := strings.ToLower(raw)
	switch {
	case containsAny(m, "api key not valid", "api_key_invalid", "invalid", "expired", "permission_denied", "unauthenticated", "api error 400", "api error 401", "api error 403"):
		return http.StatusBadRequest, "Invalid or expired API key. Please check and try again."
	case containsAny(m, "quota", "rate_limit", "rate limit", "resource_exhausted", "429"):
		return http.StatusTooManyRequests, "API key is valid but has quota/rate limit issues."
	default:
		return http.StatusBadGateway, "Failed to validate API key: the AI service is unavailable."
	}
}

// ---- Logs ----

var (
	logLevels   = map[string]bool{"info": true, "warn": true, "error": true, "debug": true}
	safeTokenRe = regexp.MustCompile(`^[A-Za-z0-9_.:-]{1,64}$`)
)

// parseLimit parses an optional ?limit=: a positive integer is clamped to max; empty or anything else (0, -3, "1e2",
// "abc") falls back to the default. It used to be clamped UP to 1 (and "1e2" parsed as 1), silently returning a single
// row for a malformed limit.
func parseLimit(v string, def, max int) int {
	n, err := strconv.Atoi(strings.TrimSpace(v))
	if err != nil || n < 1 {
		return def
	}
	if n > max {
		return max
	}
	return n
}

// validLogCategory is what POST /api/logs accepts and GET /api/logs?category= can filter by: free text of up to 100
// characters without control characters (a category like "http request" or "api/chat" is legitimate).
func validLogCategory(c string) bool {
	return c != "" && len([]rune(c)) <= 100 && !hasUnsafeRunes(c, false)
}

// filterValue encodes a free-text value for use after "eq." in a PostgREST filter.
func filterValue(v string) string { return strings.ReplaceAll(url.QueryEscape(v), "+", "%20") }

// dtReadJSONLimited decodes at most 1 MB of JSON from the request body.
func dtReadJSONLimited(w http.ResponseWriter, r *http.Request, v any) bool {
	r.Body = http.MaxBytesReader(w, r.Body, 1<<20)
	if err := json.NewDecoder(r.Body).Decode(v); err != nil {
		http.Error(w, `{"error":"invalid JSON body"}`, http.StatusBadRequest)
		return false
	}
	return true
}

// dtSafeTime parses an RFC3339 timestamp and re-formats it in UTC ("Z" form) so
// it is safe to place in a PostgREST filter value.
func dtSafeTime(v string) (string, bool) {
	t, err := time.Parse(time.RFC3339, v)
	if err != nil {
		return "", false
	}
	return t.UTC().Format(time.RFC3339), true
}

// handleLogsGet queries system_logs with optional filters.
func (s *Server) handleLogsGet(w http.ResponseWriter, r *http.Request, _ *AuthUser) {
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	q := r.URL.Query()
	limit := parseLimit(q.Get("limit"), 50, 200)

	filter := fmt.Sprintf("select=*&order=timestamp.desc&limit=%d", limit)
	if level := q.Get("level"); level != "" {
		if !logLevels[level] {
			s.JSONError(w, http.StatusBadRequest, "invalid level. Must be: info, warn, error, or debug")
			return
		}
		filter += "&level=eq." + level
	}
	if category := q.Get("category"); category != "" {
		if !validLogCategory(category) {
			s.JSONError(w, http.StatusBadRequest, "invalid category")
			return
		}
		filter += "&category=eq." + filterValue(category)
	}
	if since := q.Get("since"); since != "" {
		ts, ok := dtSafeTime(since)
		if !ok {
			s.JSONError(w, http.StatusBadRequest, "invalid since timestamp (RFC3339 expected)")
			return
		}
		filter += "&timestamp=gt." + ts
	}

	var logs []map[string]any
	if err := s.DB.Select(ctx, "system_logs", filter, "", &logs); err != nil {
		log.Printf("logs get: %v", err)
		s.JSONError(w, http.StatusInternalServerError, "failed to fetch logs")
		return
	}
	if logs == nil {
		logs = []map[string]any{}
	}
	s.JSON(w, http.StatusOK, map[string]any{
		"logs":      logs,
		"count":     len(logs),
		"fetchedAt": dtNowISO(),
	})
}

// handleLogsPost inserts a log entry. Open for client-side logging, but the
// user id is never taken from the body: it is the session user's id when a
// valid token is present, otherwise null.
func (s *Server) handleLogsPost(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Level    string         `json:"level"`
		Category string         `json:"category"`
		Message  string         `json:"message"`
		Metadata map[string]any `json:"metadata"`
	}
	if !dtReadJSONLimited(w, r, &body) {
		return
	}
	if body.Level == "" || body.Category == "" || body.Message == "" {
		s.JSONError(w, http.StatusBadRequest, "missing required fields: level, category, message")
		return
	}
	if !logLevels[body.Level] {
		s.JSONError(w, http.StatusBadRequest, "invalid level. Must be: info, warn, error, or debug")
		return
	}
	if !validLogCategory(body.Category) {
		s.JSONError(w, http.StatusBadRequest, "invalid category (at most 100 characters, no control characters)")
		return
	}

	row := map[string]any{
		"level":    body.Level,
		"category": body.Category,
		"message":  body.Message,
		"metadata": body.Metadata,
		"user_id":  nil,
	}
	if BearerToken(r) != "" {
		if u := s.Authenticate(r); u != nil {
			row["user_id"] = u.ID
		}
	}
	if row["metadata"] == nil {
		row["metadata"] = map[string]any{}
	}

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	var ignore []map[string]any
	if err := s.DB.Insert(ctx, "system_logs", row, "", &ignore); err != nil {
		log.Printf("logs post: %v", err)
		s.JSONError(w, http.StatusInternalServerError, "failed to insert log")
		return
	}
	s.JSON(w, http.StatusOK, map[string]bool{"success": true})
}

// ---- Gemini Key (mobile) ----

// handleConfigGeminiKey returns the Gemini API key if the X-App-Token header matches.
func (s *Server) handleConfigGeminiKey(w http.ResponseWriter, r *http.Request) {
	mobileToken := os.Getenv("MOBILE_APP_TOKEN")
	if mobileToken == "" {
		s.JSON(w, http.StatusServiceUnavailable, map[string]any{
			"success": false,
			"error":   "API key endpoint not configured. Set MOBILE_APP_TOKEN in environment.",
		})
		return
	}

	appToken := r.Header.Get("X-App-Token")
	// constant-time comparison (of fixed-length digests, so neither the value nor its length leaks through timing)
	gotSum, wantSum := sha256.Sum256([]byte(appToken)), sha256.Sum256([]byte(mobileToken))
	if appToken == "" || subtle.ConstantTimeCompare(gotSum[:], wantSum[:]) != 1 {
		s.JSON(w, http.StatusUnauthorized, map[string]any{
			"success": false,
			"error":   "Unauthorized. Valid app token required.",
		})
		return
	}

	apiKey := s.Cfg.GeminiAPIKey
	if apiKey == "" {
		s.JSON(w, http.StatusNotFound, map[string]any{
			"success": false,
			"error":   "No API key configured. Please set one in the admin dashboard.",
		})
		return
	}

	s.JSON(w, http.StatusOK, map[string]any{
		"success": true,
		"apiKey":  apiKey,
		"source":  "environment_variable",
	})
}

// ---- Monitoring Health ----

// handleMonitoringHealth returns a simplified health check for all key components.
func (s *Server) handleMonitoringHealth(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 15*time.Second)
	defer cancel()

	now := dtNowISO()
	uptime := time.Since(dtStartTime).Seconds()

	// DB ping
	dbStatus := "healthy"
	var pingRows []map[string]any
	if err := s.DB.Select(ctx, "profiles", "select=id&limit=1", "", &pingRows); err != nil {
		dbStatus = "unhealthy"
	}

	// AI service configured?
	aiStatus := "healthy"
	if s.Cfg.GeminiAPIKey == "" {
		aiStatus = "degraded"
	}

	overall := "healthy"
	if dbStatus == "unhealthy" {
		overall = "unhealthy"
	} else if aiStatus == "degraded" {
		overall = "degraded"
	}

	httpStatus := http.StatusOK
	if overall == "unhealthy" {
		httpStatus = http.StatusServiceUnavailable
	}

	s.JSON(w, httpStatus, map[string]any{
		"status":      overall,
		"timestamp":   now,
		"uptime":      uptime,
		"version":     "go-1.0.0",
		"environment": s.Cfg.Env,
		"components": map[string]any{
			"database": map[string]any{
				"status":    dbStatus,
				"lastCheck": now,
			},
			"ai_service": map[string]any{
				"status":    aiStatus,
				"lastCheck": now,
			},
		},
		"metrics": map[string]any{},
	})
}

// ---- Monitoring Metrics ----

// handleMonitoringMetricsGet reads system_metrics with optional type/limit filters.
func (s *Server) handleMonitoringMetricsGet(w http.ResponseWriter, r *http.Request, _ *AuthUser) {
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	q := r.URL.Query()
	limit := parseLimit(q.Get("limit"), 1000, 1000)

	filter := fmt.Sprintf("select=*&order=timestamp.desc&limit=%d", limit)
	if t := q.Get("type"); t != "" {
		if !safeTokenRe.MatchString(t) {
			s.JSONError(w, http.StatusBadRequest, "invalid type")
			return
		}
		filter += "&type=eq." + t
	}
	if sd := q.Get("startDate"); sd != "" {
		ts, ok := dtSafeTime(sd)
		if !ok {
			s.JSONError(w, http.StatusBadRequest, "invalid startDate (RFC3339 expected)")
			return
		}
		filter += "&timestamp=gte." + ts
	}
	if ed := q.Get("endDate"); ed != "" {
		ts, ok := dtSafeTime(ed)
		if !ok {
			s.JSONError(w, http.StatusBadRequest, "invalid endDate (RFC3339 expected)")
			return
		}
		filter += "&timestamp=lte." + ts
	}

	var metrics []map[string]any
	if err := s.DB.Select(ctx, "system_metrics", filter, "", &metrics); err != nil {
		log.Printf("monitoring/metrics get: %v", err)
		s.JSONError(w, http.StatusInternalServerError, "failed to retrieve metrics")
		return
	}
	if metrics == nil {
		metrics = []map[string]any{}
	}
	s.JSON(w, http.StatusOK, map[string]any{
		"success": true,
		"metrics": metrics,
		"count":   len(metrics),
	})
}

// handleMonitoringMetricsPost bulk-inserts metrics into system_metrics.
func (s *Server) handleMonitoringMetricsPost(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Type      string           `json:"type"`
		Metrics   []map[string]any `json:"metrics"`
		Timestamp string           `json:"timestamp"`
	}
	if !dtReadJSONLimited(w, r, &body) {
		return
	}
	if !safeTokenRe.MatchString(body.Type) || len(body.Metrics) == 0 || len(body.Metrics) > 500 {
		s.JSONError(w, http.StatusBadRequest, "invalid request body. Expected type, metrics array, and timestamp")
		return
	}

	ts := body.Timestamp
	if ts == "" {
		ts = dtNowISO()
	} else if t, ok := parseTimestamp(ts); ok {
		ts = t.Format(time.RFC3339Nano)
	} else {
		s.JSONError(w, http.StatusBadRequest, "timestamp must be an RFC3339 timestamp")
		return
	}

	rows := make([]map[string]any, 0, len(body.Metrics))
	for i, m := range body.Metrics {
		mts := ts
		if v, present := m["timestamp"]; present && v != nil {
			str, isStr := v.(string)
			t, ok := parseTimestamp(str)
			if !isStr || !ok {
				s.JSONError(w, http.StatusBadRequest, fmt.Sprintf("metrics[%d].timestamp must be an RFC3339 timestamp", i))
				return
			}
			mts = t.Format(time.RFC3339Nano)
		}
		name, isStr := m["name"].(string)
		if !isStr || strings.TrimSpace(name) == "" || len([]rune(name)) > 200 {
			s.JSONError(w, http.StatusBadRequest, fmt.Sprintf("metrics[%d].name is required (at most 200 characters)", i))
			return
		}
		// the column stores the number as text, but only a real finite number may go in
		if _, ok := asFloat(m["value"]); !ok {
			s.JSONError(w, http.StatusBadRequest, fmt.Sprintf("metrics[%d].value must be a number", i))
			return
		}
		if u, present := m["unit"]; present && u != nil {
			if us, isStr := u.(string); !isStr || len(us) > 50 {
				s.JSONError(w, http.StatusBadRequest, fmt.Sprintf("metrics[%d].unit must be a short string", i))
				return
			}
		}
		for _, k := range []string{"tags", "metadata"} {
			if v, present := m[k]; present && v != nil {
				if obj, isObj := v.(map[string]any); !isObj || jsonDepthExceeds(obj, 20) {
					s.JSONError(w, http.StatusBadRequest, fmt.Sprintf("metrics[%d].%s must be an object", i, k))
					return
				}
			}
		}
		rows = append(rows, map[string]any{
			"type":      body.Type,
			"name":      name,
			"value":     m["value"],
			"unit":      dtStrOr(m, "unit", "count"),
			"tags":      dtMapOr(m, "tags"),
			"timestamp": mts,
			"metadata":  dtMapOr(m, "metadata"),
		})
	}

	ctx, cancel := context.WithTimeout(r.Context(), 15*time.Second)
	defer cancel()

	var ignore []map[string]any
	if err := s.DB.Insert(ctx, "system_metrics", rows, "", &ignore); err != nil {
		log.Printf("monitoring/metrics post: %v", err)
		s.JSONError(w, http.StatusInternalServerError, "failed to store metrics")
		return
	}
	s.JSON(w, http.StatusOK, map[string]any{
		"success": true,
		"stored":  len(rows),
		"type":    body.Type,
	})
}

// ---- utility ----

// containsAny returns true if s contains any of the substrings.
func containsAny(s string, subs ...string) bool {
	for _, sub := range subs {
		for i := 0; i <= len(s)-len(sub); i++ {
			if s[i:i+len(sub)] == sub {
				return true
			}
		}
	}
	return false
}
