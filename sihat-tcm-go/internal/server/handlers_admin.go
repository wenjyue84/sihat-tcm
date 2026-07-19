package server

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"runtime"
	"time"

	"sihattcm/internal/gemini"
)

// dtStartTime records when the server process started.
var dtStartTime = time.Now()

// dtRequiredPromptRoles lists the 8 system prompt roles checked in db-status.
var dtRequiredPromptRoles = []string{
	"doctor_chat",
	"doctor_tongue",
	"doctor_face",
	"doctor_body",
	"doctor_listening",
	"doctor_inquiry_summary",
	"doctor_final",
	"doctor_pulse",
}

// registerAdminRoutes mounts admin, logs, config, and monitoring endpoints.
func (s *Server) registerAdminRoutes() {
	// Admin settings
	s.Mux.HandleFunc("GET /api/admin/settings", s.handleAdminSettingsGet)
	s.Mux.HandleFunc("PUT /api/admin/settings", s.RequireAuth(s.handleAdminSettingsPut, "admin"))

	// DB status — open (no auth) mirrors TS original
	s.Mux.HandleFunc("GET /api/admin/db-status", s.handleAdminDBStatus)

	// System health — GET requires auth; POST is open (error ingestion)
	s.Mux.HandleFunc("GET /api/admin/system-health", s.RequireAuth(s.handleAdminSystemHealthGet, "admin", "developer"))
	s.Mux.HandleFunc("POST /api/admin/system-health", s.handleAdminSystemHealthPost)

	// Test API key
	s.Mux.HandleFunc("POST /api/admin/test-api-key", s.handleAdminTestAPIKey)

	// Logs
	s.Mux.HandleFunc("GET /api/logs", s.RequireAuth(s.handleLogsGet, "developer", "admin"))
	s.Mux.HandleFunc("POST /api/logs", s.handleLogsPost)

	// Gemini key for mobile
	s.Mux.HandleFunc("GET /api/config/gemini-key", s.handleConfigGeminiKey)

	// Monitoring health + metrics
	s.Mux.HandleFunc("GET /api/monitoring/health", s.handleMonitoringHealth)
	s.Mux.HandleFunc("GET /api/monitoring/metrics", s.handleMonitoringMetricsGet)
	s.Mux.HandleFunc("POST /api/monitoring/metrics", s.handleMonitoringMetricsPost)
}

// ---- Admin Settings ----

// handleAdminSettingsGet reads all rows from admin_settings and returns the first (or empty object).
// geminiApiKey is masked to the last 6 characters.
func (s *Server) handleAdminSettingsGet(w http.ResponseWriter, r *http.Request) {
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

	// Mask Gemini API key
	if raw, ok := settings["gemini_api_key"].(string); ok && len(raw) > 6 {
		settings["gemini_api_key"] = "..." + raw[len(raw)-6:]
	}

	s.JSON(w, http.StatusOK, settings)
}

// handleAdminSettingsPut merges and upserts admin settings (admin role required).
func (s *Server) handleAdminSettingsPut(w http.ResponseWriter, r *http.Request, _ *AuthUser) {
	var body map[string]any
	if !dtReadJSON(w, r, &body) {
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

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
	s.JSON(w, http.StatusOK, map[string]any{"success": true, "settings": result})
}

// ---- DB Status ----

// handleAdminDBStatus checks connectivity and system_prompts coverage.
func (s *Server) handleAdminDBStatus(w http.ResponseWriter, r *http.Request) {
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
		s.JSON(w, http.StatusOK, map[string]any{
			"connected":     false,
			"error":         err.Error(),
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

	// Counts — fetch ids with limit 1000, count client-side (simple, no Prefer:count header needed)
	var allProfiles []map[string]json.RawMessage
	_ = s.DB.Select(ctx, "profiles", "select=id,role&limit=1000", "", &allProfiles)

	totalUsers := len(allProfiles)
	adminUsers := 0
	for _, p := range allProfiles {
		if raw, ok := p["role"]; ok {
			var role string
			if json.Unmarshal(raw, &role) == nil && role == "admin" {
				adminUsers++
			}
		}
	}

	var diagRows []map[string]json.RawMessage
	_ = s.DB.Select(ctx, "diagnosis_sessions", "select=id&limit=1000", "", &diagRows)

	s.JSON(w, http.StatusOK, map[string]any{
		"connected":     true,
		"promptsStatus": promptsStatus,
		"stats": map[string]int{
			"totalUsers":     totalUsers,
			"adminUsers":     adminUsers,
			"totalDiagnoses": len(diagRows),
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

	total := len(errRows)
	var critical, high, medium, low, resolved int
	for _, e := range errRows {
		sev, _ := e["severity"].(string)
		res, _ := e["resolved"].(bool)
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
		if res {
			resolved++
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
			"total_errors":    total,
			"critical_errors": critical,
			"high_errors":     high,
			"medium_errors":   medium,
			"low_errors":      low,
			"resolved_errors": resolved,
			"unresolved_errors": total - resolved,
			"error_rate_24h":  total,
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
	var body map[string]any
	if !dtReadJSON(w, r, &body) {
		return
	}
	if body["error_type"] == nil || body["message"] == nil {
		s.JSONError(w, http.StatusBadRequest, "error_type and message are required")
		return
	}
	if body["severity"] == nil {
		body["severity"] = "medium"
	}
	if body["metadata"] == nil {
		body["metadata"] = map[string]any{}
	}

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	var inserted []map[string]any
	err := s.DB.Insert(ctx, "system_errors", body, "", &inserted)
	if err != nil {
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
func (s *Server) handleAdminTestAPIKey(w http.ResponseWriter, r *http.Request) {
	var body struct {
		APIKey      string `json:"apiKey"`
		UseSavedKey bool   `json:"useSavedKey"`
	}
	if !dtReadJSON(w, r, &body) {
		return
	}

	keyToTest := ""
	if body.UseSavedKey {
		keyToTest = s.Cfg.GeminiAPIKey
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

	ctx, cancel := context.WithTimeout(r.Context(), 30*time.Second)
	defer cancel()

	// Temporary client with the test key
	testClient := &gemini.Client{
		APIKey: keyToTest,
		HTTP:   s.AI.HTTP,
	}
	resp, err := testClient.GenerateText(ctx, "gemini-2.0-flash", "",
		`Say "API key is valid" in exactly those words.`)
	if err != nil {
		msg := err.Error()
		status := http.StatusInternalServerError
		if containsAny(msg, "API_KEY_INVALID", "invalid") {
			status = http.StatusUnauthorized
			msg = "Invalid API key. Please check and try again."
		} else if containsAny(msg, "quota", "RATE_LIMIT") {
			status = http.StatusTooManyRequests
			msg = "API key is valid but has quota/rate limit issues."
		} else {
			msg = "Failed to validate API key: " + msg
		}
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

// ---- Logs ----

// handleLogsGet queries system_logs with optional filters.
func (s *Server) handleLogsGet(w http.ResponseWriter, r *http.Request, _ *AuthUser) {
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	q := r.URL.Query()
	limitStr := q.Get("limit")
	limit := 50
	if limitStr != "" {
		fmt.Sscanf(limitStr, "%d", &limit)
	}
	if limit > 200 {
		limit = 200
	}
	if limit < 1 {
		limit = 1
	}

	filter := fmt.Sprintf("select=*&order=timestamp.desc&limit=%d", limit)
	if level := q.Get("level"); level != "" {
		filter += "&level=eq." + level
	}
	if category := q.Get("category"); category != "" {
		filter += "&category=eq." + category
	}
	if since := q.Get("since"); since != "" {
		filter += "&timestamp=gt." + since
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

// handleLogsPost inserts a log entry (no auth — client-side logging).
func (s *Server) handleLogsPost(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Level    string         `json:"level"`
		Category string         `json:"category"`
		Message  string         `json:"message"`
		Metadata map[string]any `json:"metadata"`
		UserID   string         `json:"userId"`
	}
	if !dtReadJSON(w, r, &body) {
		return
	}
	if body.Level == "" || body.Category == "" || body.Message == "" {
		s.JSONError(w, http.StatusBadRequest, "missing required fields: level, category, message")
		return
	}
	validLevels := map[string]bool{"info": true, "warn": true, "error": true, "debug": true}
	if !validLevels[body.Level] {
		s.JSONError(w, http.StatusBadRequest, "invalid level. Must be: info, warn, error, or debug")
		return
	}

	row := map[string]any{
		"level":    body.Level,
		"category": body.Category,
		"message":  body.Message,
		"metadata": body.Metadata,
		"user_id":  nil,
	}
	if body.UserID != "" {
		row["user_id"] = body.UserID
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
	if appToken == "" || appToken != mobileToken {
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
func (s *Server) handleMonitoringMetricsGet(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	q := r.URL.Query()
	limit := 1000
	if l := q.Get("limit"); l != "" {
		fmt.Sscanf(l, "%d", &limit)
	}

	filter := fmt.Sprintf("select=*&order=timestamp.desc&limit=%d", limit)
	if t := q.Get("type"); t != "" {
		filter += "&type=eq." + t
	}
	if sd := q.Get("startDate"); sd != "" {
		filter += "&timestamp=gte." + sd
	}
	if ed := q.Get("endDate"); ed != "" {
		filter += "&timestamp=lte." + ed
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
	if !dtReadJSON(w, r, &body) {
		return
	}
	if body.Type == "" || len(body.Metrics) == 0 {
		s.JSONError(w, http.StatusBadRequest, "invalid request body. Expected type, metrics array, and timestamp")
		return
	}

	ts := body.Timestamp
	if ts == "" {
		ts = dtNowISO()
	}

	rows := make([]map[string]any, 0, len(body.Metrics))
	for _, m := range body.Metrics {
		mts := ts
		if v, ok := m["timestamp"].(string); ok && v != "" {
			mts = v
		}
		rows = append(rows, map[string]any{
			"type":      body.Type,
			"name":      dtStrOr(m, "name", "unknown"),
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
