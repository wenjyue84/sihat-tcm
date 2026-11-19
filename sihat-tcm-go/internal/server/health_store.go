package server

import (
	"context"
	"fmt"
	"net/url"
	"strings"
	"sync"
	"time"
)

// Database access for the wearable integrations. Three tables (db/schema.sql, internal/localdb/schema.go):
//
//	health_readings       owner-only RLS: user-context calls (manual / Bluetooth entry, listing, deleting) run with the
//	                      user's JWT, so the database itself enforces "own rows only"; token- and sync-driven writes
//	                      use the service key with user_id fixed server-side.
//	health_connections    service-role only (holds the AES-GCM sealed Google refresh token)
//	health_ingest_tokens  service-role only (holds SHA-256 of the ingest token)

const (
	tblReadings = "health_readings"
	tblConns    = "health_connections"
	tblTokens   = "health_ingest_tokens"

	providerGoogle = "google_health"
	insertChunk    = 500
)

// serviceReady reports whether the server can reach the service-role tables.
func (s *Server) healthServiceReady() bool {
	return s.DB != nil && s.DB.Configured() && s.DB.ServiceKey != ""
}

// readingOut is a stored reading as the API returns it.
type readingOut struct {
	ID         string  `json:"id"`
	Metric     string  `json:"metric"`
	Value      float64 `json:"value"`
	Unit       string  `json:"unit"`
	MeasuredAt string  `json:"measured_at"`
	Source     string  `json:"source"`
	Device     string  `json:"device,omitempty"`
}

type readingRow struct {
	ID         string  `json:"id"`
	Metric     string  `json:"metric"`
	Value      float64 `json:"value"`
	Unit       string  `json:"unit"`
	MeasuredAt string  `json:"measured_at"`
	Source     string  `json:"source"`
	Device     *string `json:"device"`
}

func (r readingRow) out() readingOut {
	o := readingOut{ID: r.ID, Metric: r.Metric, Value: r.Value, Unit: r.Unit, MeasuredAt: normalizeStoredTime(r.MeasuredAt), Source: r.Source}
	if r.Device != nil {
		o.Device = *r.Device
	}
	return o
}

// normalizeStoredTime renders whatever timestamp format the database returned as RFC 3339 UTC (Z).
func normalizeStoredTime(s string) string {
	if t, err := time.Parse(time.RFC3339Nano, strings.Replace(s, " ", "T", 1)); err == nil {
		return t.UTC().Format(time.RFC3339)
	}
	return s
}

const readingCols = "id,metric,value,unit,measured_at,source,device"

// insertReadings stores readings for userID, skipping rows that already exist (same user, metric, instant and
// channel). userToken "" = service key. It returns how many rows were really inserted and how many were duplicates.
func (s *Server) insertReadings(ctx context.Context, userToken, userID string, readings []healthReading) (inserted, duplicates int, err error) {
	seen := make(map[string]bool, len(readings))
	rows := make([]map[string]any, 0, len(readings))
	for _, r := range readings {
		k := r.key()
		if seen[k] {
			continue
		}
		seen[k] = true
		rows = append(rows, r.row(userID))
	}
	for i := 0; i < len(rows); i += insertChunk {
		end := i + insertChunk
		if end > len(rows) {
			end = len(rows)
		}
		var out []map[string]any
		if err := s.DB.InsertIgnoreDuplicates(ctx, tblReadings, healthOnConflictKey, rows[i:end], userToken, &out); err != nil {
			return inserted, len(seen) - inserted, err
		}
		inserted += len(out)
	}
	return inserted, len(seen) - inserted, nil
}

// listReadings returns the caller's readings, newest first.
func (s *Server) listReadings(ctx context.Context, userToken, userID, metric, source string, since time.Time, limit int) ([]readingOut, error) {
	q := url.Values{}
	q.Set("select", readingCols)
	q.Set("user_id", "eq."+userID)
	if metric != "" {
		q.Set("metric", "eq."+metric)
	}
	if source != "" {
		q.Set("source", "eq."+source)
	}
	if !since.IsZero() {
		q.Set("measured_at", "gte."+since.UTC().Format(healthTimeLayout))
	}
	q.Set("order", "measured_at.desc")
	q.Set("limit", fmt.Sprint(limit))
	var rows []readingRow
	if err := s.DB.Select(ctx, tblReadings, q.Encode(), userToken, &rows); err != nil {
		return nil, err
	}
	out := make([]readingOut, 0, len(rows))
	for _, r := range rows {
		out = append(out, r.out())
	}
	return out, nil
}

// latestReadings returns the newest reading of every metric the user has.
func (s *Server) latestReadings(ctx context.Context, userToken, userID string) (map[string]readingOut, error) {
	var mu sync.Mutex
	var wg sync.WaitGroup
	out := map[string]readingOut{}
	var firstErr error
	for _, m := range healthMetricOrder {
		wg.Add(1)
		go func(m string) {
			defer wg.Done()
			rs, err := s.listReadings(ctx, userToken, userID, m, "", time.Time{}, 1)
			mu.Lock()
			defer mu.Unlock()
			if err != nil {
				if firstErr == nil {
					firstErr = err
				}
				return
			}
			if len(rs) > 0 {
				out[m] = rs[0]
			}
		}(m)
	}
	wg.Wait()
	return out, firstErr
}

// deleteReadings removes the caller's readings: by ids, by source, or everything (all=true).
func (s *Server) deleteReadings(ctx context.Context, userToken, userID string, ids []string, source string, all bool) error {
	q := url.Values{}
	q.Set("user_id", "eq."+userID)
	switch {
	case len(ids) > 0:
		q.Set("id", "in.("+strings.Join(ids, ",")+")")
	case source != "":
		q.Set("source", "eq."+source)
	case all:
	default:
		return fmt.Errorf("nothing to delete")
	}
	return s.DB.Delete(ctx, tblReadings, q.Encode(), userToken)
}

// ---- ingest tokens ----

type ingestTokenRow struct {
	ID         string  `json:"id"`
	UserID     string  `json:"user_id"`
	TokenHint  string  `json:"token_hint"`
	CreatedAt  string  `json:"created_at"`
	LastUsedAt *string `json:"last_used_at"`
}

func (s *Server) ingestTokenByHash(ctx context.Context, hash string) (*ingestTokenRow, error) {
	var rows []ingestTokenRow
	q := "select=id,user_id,token_hint,created_at,last_used_at&token_hash=eq." + url.QueryEscape(hash) + "&limit=1"
	if err := s.DB.Select(ctx, tblTokens, q, "", &rows); err != nil {
		return nil, err
	}
	if len(rows) == 0 {
		return nil, nil
	}
	return &rows[0], nil
}

func (s *Server) ingestTokenForUser(ctx context.Context, userID string) (*ingestTokenRow, error) {
	var rows []ingestTokenRow
	q := "select=id,user_id,token_hint,created_at,last_used_at&user_id=eq." + userID + "&limit=1"
	if err := s.DB.Select(ctx, tblTokens, q, "", &rows); err != nil {
		return nil, err
	}
	if len(rows) == 0 {
		return nil, nil
	}
	return &rows[0], nil
}

// rotateIngestToken replaces the user's ingest token (creating it the first time) and returns the new secret, which
// is shown once and never stored in clear.
func (s *Server) rotateIngestToken(ctx context.Context, userID string) (string, error) {
	defer lockKey("health-token:" + userID)()
	tok, err := newIngestToken()
	if err != nil {
		return "", err
	}
	if err := s.DB.Delete(ctx, tblTokens, "user_id=eq."+userID, ""); err != nil {
		return "", err
	}
	row := map[string]any{"user_id": userID, "token_hash": hashIngestToken(tok), "token_hint": tokenHint(tok)}
	if err := s.DB.Insert(ctx, tblTokens, row, "", nil); err != nil {
		return "", err
	}
	return tok, nil
}

func (s *Server) revokeIngestToken(ctx context.Context, userID string) error {
	return s.DB.Delete(ctx, tblTokens, "user_id=eq."+userID, "")
}

func (s *Server) touchIngestToken(ctx context.Context, row *ingestTokenRow) {
	if row.LastUsedAt != nil {
		if t, err := time.Parse(time.RFC3339Nano, strings.Replace(*row.LastUsedAt, " ", "T", 1)); err == nil && time.Since(t) < time.Minute {
			return // at most one write a minute per token
		}
	}
	_ = s.DB.Update(ctx, tblTokens, "id=eq."+row.ID, map[string]any{"last_used_at": time.Now().UTC().Format(healthTimeLayout)}, "", nil)
}

// ---- provider connections ----

type connRow struct {
	ID              string  `json:"id"`
	UserID          string  `json:"user_id"`
	Provider        string  `json:"provider"`
	Status          string  `json:"status"`
	Scopes          *string `json:"scopes"`
	RefreshTokenEnc *string `json:"refresh_token_enc"`
	ConnectedAt     string  `json:"connected_at"`
	LastSyncAt      *string `json:"last_sync_at"`
	LastSyncStatus  *string `json:"last_sync_status"`
	LastError       *string `json:"last_error"`
}

func (s *Server) getConnection(ctx context.Context, userID, provider string) (*connRow, error) {
	var rows []connRow
	q := "select=*&user_id=eq." + userID + "&provider=eq." + provider + "&limit=1"
	if err := s.DB.Select(ctx, tblConns, q, "", &rows); err != nil {
		return nil, err
	}
	if len(rows) == 0 {
		return nil, nil
	}
	return &rows[0], nil
}

// saveConnection creates or replaces the (user, provider) connection with a freshly sealed refresh token.
func (s *Server) saveConnection(ctx context.Context, userID, provider, scopes, sealedRefresh string) error {
	defer lockKey("health-conn:" + userID + ":" + provider)()
	now := time.Now().UTC().Format(healthTimeLayout)
	body := map[string]any{"status": "connected", "scopes": scopes, "refresh_token_enc": sealedRefresh, "connected_at": now, "last_error": nil}
	existing, err := s.getConnection(ctx, userID, provider)
	if err != nil {
		return err
	}
	if existing != nil {
		return s.DB.Update(ctx, tblConns, "id=eq."+existing.ID, body, "", nil)
	}
	body["user_id"] = userID
	body["provider"] = provider
	delete(body, "last_error")
	return s.DB.Insert(ctx, tblConns, body, "", nil)
}

func (s *Server) markConnection(ctx context.Context, id string, fields map[string]any) {
	_ = s.DB.Update(ctx, tblConns, "id=eq."+id, fields, "", nil)
}

func (s *Server) deleteConnection(ctx context.Context, userID, provider string) error {
	return s.DB.Delete(ctx, tblConns, "user_id=eq."+userID+"&provider=eq."+provider, "")
}

// publicConn is a connection without any secret, for the UI.
func publicConn(c *connRow) map[string]any {
	if c == nil {
		return nil
	}
	m := map[string]any{"status": c.Status, "connected_at": normalizeStoredTime(c.ConnectedAt)}
	if c.LastSyncAt != nil {
		m["last_sync_at"] = normalizeStoredTime(*c.LastSyncAt)
	}
	if c.LastSyncStatus != nil {
		m["last_sync_status"] = *c.LastSyncStatus
	}
	if c.LastError != nil {
		m["last_error"] = *c.LastError
	}
	return m
}

// ---- tiny fixed-window limiter keyed by an arbitrary string (per ingest token / per user) ----

type keyLimiter struct {
	mu sync.Mutex
	m  map[string]*keyWin
}

type keyWin struct {
	start time.Time
	n     int
}

var healthKeyLimit = &keyLimiter{m: map[string]*keyWin{}}

// allow reports whether key may make another request in the current window of the given length (max per window).
func (l *keyLimiter) allow(key string, max int, window time.Duration) bool {
	now := time.Now()
	l.mu.Lock()
	defer l.mu.Unlock()
	if len(l.m) > 20000 {
		for k, w := range l.m {
			if now.Sub(w.start) > window {
				delete(l.m, k)
			}
		}
	}
	w := l.m[key]
	if w == nil || now.Sub(w.start) >= window {
		l.m[key] = &keyWin{start: now, n: 1}
		return true
	}
	w.n++
	return w.n <= max
}
