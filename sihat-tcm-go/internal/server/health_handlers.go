package server

import (
	"context"
	"io"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"
)

// Routes of the wearable / phone health-data integrations. Overview of the channels:
//
//	Web Bluetooth (browser, static/js/health-connect.js)  -> POST /api/health/readings   (source "bluetooth")
//	manual entry                                           -> POST /api/health/readings   (source "manual")
//	Google Health online portal (OAuth + PKCE)             -> /api/health/google/*        (source "google_health")
//	Apple Health export.zip / export.xml upload            -> POST /api/health/apple/import (source "apple_export")
//	iOS Shortcut / Android automation, Health Auto Export  -> POST /api/health/ingest     (source "ingest", bearer token)
func (s *Server) registerHealthRoutes() {
	// session-authenticated (any signed-in role: it is the caller's own data)
	s.Mux.HandleFunc("GET /api/health/summary", s.RequireAuth(s.handleHealthSummary))
	s.Mux.HandleFunc("GET /api/health/readings", s.RequireAuth(s.handleHealthReadingsList))
	s.Mux.HandleFunc("POST /api/health/readings", s.RateLimit(60, 2000, s.RequireAuth(s.handleHealthReadingsAdd)))
	s.Mux.HandleFunc("DELETE /api/health/readings", s.RequireAuth(s.handleHealthReadingsDelete))
	s.Mux.HandleFunc("POST /api/health/ingest-token", s.RateLimit(10, 100, s.RequireAuth(s.handleIngestTokenCreate)))
	s.Mux.HandleFunc("DELETE /api/health/ingest-token", s.RequireAuth(s.handleIngestTokenRevoke))
	s.Mux.HandleFunc("POST /api/health/apple/import", s.RateLimit(6, 40, s.RequireAuth(s.handleAppleImport)))
	s.Mux.HandleFunc("GET /api/health/google/connect", s.RateLimit(20, 200, s.RequireAuth(s.handleGoogleConnect)))
	s.Mux.HandleFunc("POST /api/health/google/sync", s.RateLimit(10, 200, s.RequireAuth(s.handleGoogleSync)))
	s.Mux.HandleFunc("DELETE /api/health/google", s.RequireAuth(s.handleGoogleDisconnect))
	// open by design: the browser arrives from google.com carrying only the sealed state cookie
	s.Mux.HandleFunc("GET /api/health/google/callback", s.RateLimit(30, 300, s.handleGoogleCallback))
	// open by design: authenticated by the per-user bearer ingest token inside the handler
	s.Mux.HandleFunc("POST /api/health/ingest", s.RateLimit(120, 5000, s.handleHealthIngest))
}

// optionalJSONBody rejects a malformed body on endpoints that take none (an empty body or {} is fine), so a stray or
// garbage request can never trigger a state change such as rotating or revoking a token.
func (s *Server) optionalJSONBody(w http.ResponseWriter, r *http.Request) bool {
	if r.ContentLength == 0 {
		return true
	}
	var v map[string]any
	r.Body = http.MaxBytesReader(w, r.Body, 4<<10)
	if err := decodeJSONBody(r.Body, &v); err != nil && err != io.EOF {
		dtWriteError(w, http.StatusBadRequest, "invalid JSON body")
		return false
	}
	return true
}

func (s *Server) healthStoreDown(w http.ResponseWriter, err error) {
	if dbBackendDown(err) {
		s.JSONError(w, http.StatusServiceUnavailable, "service temporarily unavailable, please try again")
		return
	}
	log.Printf("health: %v", err)
	s.JSONError(w, http.StatusInternalServerError, "could not complete the request")
}

// publicBase is the externally visible origin (no trailing slash).
func (s *Server) publicBase() string {
	if s.Cfg != nil && s.Cfg.PublicBaseURL != "" {
		return strings.TrimRight(s.Cfg.PublicBaseURL, "/")
	}
	return ""
}

// GET /api/health/summary - everything the "Devices & health data" card needs in one call.
func (s *Server) handleHealthSummary(w http.ResponseWriter, r *http.Request, user *AuthUser) {
	ctx, cancel := context.WithTimeout(r.Context(), 20*time.Second)
	defer cancel()
	g := s.googleCfg()
	resp := map[string]any{
		"server": map[string]any{
			"service_ready": s.healthServiceReady(),
			"google":        map[string]any{"configured": g.configured(), "redirect_uri": g.redirect},
		},
		"metrics": healthMetricCatalogue(),
	}
	latest, err := s.latestReadings(ctx, user.Token, user.ID)
	if err != nil {
		s.healthStoreDown(w, err)
		return
	}
	resp["latest"] = latest
	conns := map[string]any{}
	ing := map[string]any{"has_token": false, "url": s.publicBase() + "/api/health/ingest"}
	if s.healthServiceReady() {
		if c, err := s.getConnection(ctx, user.ID, providerGoogle); err == nil && c != nil {
			conns[providerGoogle] = publicConn(c)
		} else if err != nil && dbBackendDown(err) {
			s.healthStoreDown(w, err)
			return
		}
		if t, err := s.ingestTokenForUser(ctx, user.ID); err == nil && t != nil {
			ing["has_token"] = true
			ing["hint"] = t.TokenHint
			ing["created_at"] = normalizeStoredTime(t.CreatedAt)
			if t.LastUsedAt != nil {
				ing["last_used_at"] = normalizeStoredTime(*t.LastUsedAt)
			}
		}
	}
	resp["connections"] = conns
	resp["ingest"] = ing
	s.JSON(w, http.StatusOK, resp)
}

func healthMetricCatalogue() map[string]any {
	m := map[string]any{}
	for _, k := range healthMetricOrder {
		spec := healthMetrics[k]
		m[k] = map[string]any{"unit": spec.Unit, "min": spec.Min, "max": spec.Max}
	}
	return m
}

// GET /api/health/readings?metric=&source=&days=&limit=
func (s *Server) handleHealthReadingsList(w http.ResponseWriter, r *http.Request, user *AuthUser) {
	q := r.URL.Query()
	metric := ""
	if v := q.Get("metric"); v != "" {
		m, ok := metricFor(v)
		if !ok {
			s.JSONError(w, http.StatusBadRequest, "unknown metric")
			return
		}
		metric = m
	}
	source := q.Get("source")
	if source != "" && !healthSources[source] {
		s.JSONError(w, http.StatusBadRequest, "unknown source")
		return
	}
	limit := 100
	if v := q.Get("limit"); v != "" {
		n, err := strconv.Atoi(v)
		if err != nil || n < 1 || n > 1000 {
			s.JSONError(w, http.StatusBadRequest, "limit must be 1-1000")
			return
		}
		limit = n
	}
	var since time.Time
	if v := q.Get("days"); v != "" {
		n, err := strconv.Atoi(v)
		if err != nil || n < 1 || n > 3650 {
			s.JSONError(w, http.StatusBadRequest, "days must be 1-3650")
			return
		}
		since = time.Now().UTC().AddDate(0, 0, -n)
	}
	ctx, cancel := context.WithTimeout(r.Context(), 15*time.Second)
	defer cancel()
	rs, err := s.listReadings(ctx, user.Token, user.ID, metric, source, since, limit)
	if err != nil {
		s.healthStoreDown(w, err)
		return
	}
	s.JSON(w, http.StatusOK, map[string]any{"readings": rs, "count": len(rs)})
}

// POST /api/health/readings {readings:[{metric,value,unit?,measured_at?,device?}], source:"manual"|"bluetooth"}
func (s *Server) handleHealthReadingsAdd(w http.ResponseWriter, r *http.Request, user *AuthUser) {
	var body struct {
		Source   string       `json:"source"`
		Readings []rawReading `json:"readings"`
	}
	if !dtReadJSONLimit(w, r, &body, 256<<10) {
		return
	}
	channel := body.Source
	if channel == "" {
		channel = srcManual
	}
	if channel != srcManual && channel != srcBluetooth {
		s.JSONError(w, http.StatusBadRequest, "source must be manual or bluetooth")
		return
	}
	if len(body.Readings) == 0 || len(body.Readings) > maxManualBatch {
		s.JSONError(w, http.StatusBadRequest, "send 1-"+strconv.Itoa(maxManualBatch)+" readings")
		return
	}
	now := time.Now().UTC()
	var ok []healthReading
	var errs []ingestError
	for i, rr := range body.Readings {
		if len(rr.MeasuredAt) == 0 { // a typed-in value is "now"
			rr.MeasuredAt = jsonRaw(now.Format(time.RFC3339))
		}
		hr, err := normalizeReading(rr, channel, now)
		if err != nil {
			errs = append(errs, ingestError{i, err.Error()})
			continue
		}
		ok = append(ok, hr)
	}
	resp := map[string]any{"accepted": len(ok), "rejected": errs}
	if len(ok) > 0 {
		ctx, cancel := context.WithTimeout(r.Context(), 20*time.Second)
		defer cancel()
		ins, dup, err := s.insertReadings(ctx, user.Token, user.ID, ok)
		if err != nil {
			s.healthStoreDown(w, err)
			return
		}
		resp["inserted"], resp["duplicates"] = ins, dup
	} else {
		resp["inserted"], resp["duplicates"] = 0, 0
	}
	status := http.StatusOK
	if len(ok) == 0 {
		status = http.StatusBadRequest
	}
	s.JSON(w, status, resp)
}

// DELETE /api/health/readings {ids:[...]} | {source:"..."} | {all:true}
func (s *Server) handleHealthReadingsDelete(w http.ResponseWriter, r *http.Request, user *AuthUser) {
	var body struct {
		IDs    []string `json:"ids"`
		Source string   `json:"source"`
		All    bool     `json:"all"`
	}
	if !dtReadJSONLimit(w, r, &body, 64<<10) {
		return
	}
	for _, id := range body.IDs {
		if !validUUID(id) {
			s.JSONError(w, http.StatusBadRequest, "invalid id")
			return
		}
	}
	if len(body.IDs) > 200 {
		s.JSONError(w, http.StatusBadRequest, "at most 200 ids per call")
		return
	}
	if body.Source != "" && !healthSources[body.Source] {
		s.JSONError(w, http.StatusBadRequest, "unknown source")
		return
	}
	if len(body.IDs) == 0 && body.Source == "" && !body.All {
		s.JSONError(w, http.StatusBadRequest, "send ids, a source, or all:true")
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 20*time.Second)
	defer cancel()
	if err := s.deleteReadings(ctx, user.Token, user.ID, body.IDs, body.Source, body.All); err != nil {
		s.healthStoreDown(w, err)
		return
	}
	s.JSON(w, http.StatusOK, map[string]any{"success": true})
}

// POST /api/health/ingest-token - create or ROTATE the caller's ingest token. The secret is returned once.
func (s *Server) handleIngestTokenCreate(w http.ResponseWriter, r *http.Request, user *AuthUser) {
	if !s.optionalJSONBody(w, r) {
		return
	}
	if !s.healthServiceReady() {
		s.JSONError(w, http.StatusServiceUnavailable, "health integrations need the database service key")
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 15*time.Second)
	defer cancel()
	tok, err := s.rotateIngestToken(ctx, user.ID)
	if err != nil {
		s.healthStoreDown(w, err)
		return
	}
	s.JSON(w, http.StatusCreated, map[string]any{
		"token": tok, "hint": tokenHint(tok), "url": s.publicBase() + "/api/health/ingest",
		"note": "Copy this token now - it cannot be shown again. Creating a new token invalidates the old one.",
	})
}

// DELETE /api/health/ingest-token
func (s *Server) handleIngestTokenRevoke(w http.ResponseWriter, r *http.Request, user *AuthUser) {
	if !s.optionalJSONBody(w, r) {
		return
	}
	if !s.healthServiceReady() {
		s.JSONError(w, http.StatusServiceUnavailable, "health integrations need the database service key")
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 15*time.Second)
	defer cancel()
	if err := s.revokeIngestToken(ctx, user.ID); err != nil {
		s.healthStoreDown(w, err)
		return
	}
	s.JSON(w, http.StatusOK, map[string]any{"success": true})
}

// POST /api/health/ingest - Authorization: Bearer shi_... ; body = JSON array of {metric,value,unit,measured_at,source,device},
// {"readings":[...]} or a Health Auto Export payload. Serves iOS Shortcuts and Android automations alike.
func (s *Server) handleHealthIngest(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Cache-Control", "no-store")
	if !s.healthServiceReady() {
		s.JSONError(w, http.StatusServiceUnavailable, "ingest is not available on this server")
		return
	}
	h := r.Header.Get("Authorization")
	tok := strings.TrimSpace(strings.TrimPrefix(h, "Bearer "))
	if !strings.HasPrefix(h, "Bearer ") || !strings.HasPrefix(tok, ingestTokenPrefix) || len(tok) > 200 {
		w.Header().Set("WWW-Authenticate", `Bearer realm="sihat-health-ingest"`)
		s.JSONError(w, http.StatusUnauthorized, "a valid ingest token is required")
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 30*time.Second)
	defer cancel()
	hash := hashIngestToken(tok)
	row, err := s.ingestTokenByHash(ctx, hash)
	if err != nil {
		s.healthStoreDown(w, err)
		return
	}
	if row == nil {
		w.Header().Set("WWW-Authenticate", `Bearer realm="sihat-health-ingest"`)
		s.JSONError(w, http.StatusUnauthorized, "a valid ingest token is required")
		return
	}
	if !healthKeyLimit.allow("ingest:"+row.ID, 60, time.Minute) {
		w.Header().Set("Retry-After", "60")
		s.JSONError(w, http.StatusTooManyRequests, "too many requests for this token")
		return
	}
	if ct := r.Header.Get("Content-Type"); ct != "" && !isJSONContentType(r) {
		s.JSONError(w, http.StatusUnsupportedMediaType, "Content-Type must be application/json")
		return
	}
	r.Body = http.MaxBytesReader(w, r.Body, maxIngestBodyBytes)
	body, err := io.ReadAll(r.Body)
	if err != nil {
		s.JSONError(w, http.StatusRequestEntityTooLarge, "request body too large (max 512 KB)")
		return
	}
	readings, errs, unknown, perr := parseIngestPayload(body, srcIngest, time.Now().UTC())
	if perr != nil {
		s.JSONError(w, http.StatusBadRequest, userMsg(perr, "invalid request body"))
		return
	}
	if len(errs) > 20 {
		errs = errs[:20]
	}
	resp := map[string]any{"accepted": len(readings), "rejected": errs, "skipped_unknown_metrics": unknown}
	if len(readings) > 0 {
		ins, dup, err := s.insertReadings(ctx, "", row.UserID, readings)
		if err != nil {
			s.healthStoreDown(w, err)
			return
		}
		resp["inserted"], resp["duplicates"] = ins, dup
		s.touchIngestToken(ctx, row)
	} else {
		resp["inserted"], resp["duplicates"] = 0, 0
	}
	status := http.StatusOK
	if len(readings) == 0 && (len(errs) > 0 || unknown == 0) {
		status = http.StatusBadRequest // nothing usable: tell the automation it failed
	}
	s.JSON(w, status, resp)
}
