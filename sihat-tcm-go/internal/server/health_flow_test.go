package server

// End-to-end tests of the wearable integrations against the REAL SQLite fallback database (internal/localdb: signed
// JWTs, owner RLS, CHECK/UNIQUE constraints) with a fake Google OAuth + Health API server. Nothing here touches the
// network or a live Supabase project.

import (
	"archive/zip"
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"net/url"
	"path/filepath"
	"strings"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"sihattcm/internal/config"
	"sihattcm/internal/localdb"
	"sihattcm/internal/supabase"
)

// fakeGoogle is a minimal Google OAuth 2.0 + Health API v4 stand-in.
type fakeGoogle struct {
	t         *testing.T
	srv       *httptest.Server
	mu        sync.Mutex
	challenge string // PKCE challenge captured from the authorization request
	codes     map[string]bool
	revoked   []string
	hits      []string
	failGrant bool // refresh_token grant answers invalid_grant
	failType  string
}

func newFakeGoogle(t *testing.T) *fakeGoogle {
	f := &fakeGoogle{t: t, codes: map[string]bool{}}
	mux := http.NewServeMux()
	mux.HandleFunc("/token", f.token)
	mux.HandleFunc("/revoke", func(w http.ResponseWriter, r *http.Request) {
		_ = r.ParseForm()
		f.mu.Lock()
		f.revoked = append(f.revoked, r.Form.Get("token"))
		f.mu.Unlock()
		w.WriteHeader(200)
	})
	mux.HandleFunc("/v4/users/me/dataTypes/", f.data)
	f.srv = httptest.NewServer(mux)
	t.Cleanup(f.srv.Close)
	return f
}

func (f *fakeGoogle) token(w http.ResponseWriter, r *http.Request) {
	_ = r.ParseForm()
	w.Header().Set("Content-Type", "application/json")
	switch r.Form.Get("grant_type") {
	case "authorization_code":
		verifier := r.Form.Get("code_verifier")
		sum := sha256.Sum256([]byte(verifier))
		f.mu.Lock()
		ok := f.codes[r.Form.Get("code")] && base64.RawURLEncoding.EncodeToString(sum[:]) == f.challenge
		delete(f.codes, r.Form.Get("code"))
		f.mu.Unlock()
		if r.Form.Get("client_id") != "test-client" || r.Form.Get("client_secret") != "test-secret" || !ok {
			w.WriteHeader(400)
			_, _ = w.Write([]byte(`{"error":"invalid_grant"}`))
			return
		}
		_, _ = w.Write([]byte(`{"access_token":"ya29.fake-access","refresh_token":"1//fake-refresh-secret","expires_in":3600,"scope":"https://www.googleapis.com/auth/googlehealth.health_metrics_and_measurements.readonly https://www.googleapis.com/auth/googlehealth.activity_and_fitness.readonly","token_type":"Bearer"}`))
	case "refresh_token":
		f.mu.Lock()
		fail := f.failGrant
		f.mu.Unlock()
		if fail || r.Form.Get("refresh_token") != "1//fake-refresh-secret" {
			w.WriteHeader(400)
			_, _ = w.Write([]byte(`{"error":"invalid_grant","error_description":"Token has been expired or revoked."}`))
			return
		}
		_, _ = w.Write([]byte(`{"access_token":"ya29.fake-access","expires_in":3600,"token_type":"Bearer"}`))
	default:
		w.WriteHeader(400)
		_, _ = w.Write([]byte(`{"error":"unsupported_grant_type"}`))
	}
}

func (f *fakeGoogle) data(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	if r.Header.Get("Authorization") != "Bearer ya29.fake-access" {
		w.WriteHeader(401)
		return
	}
	typ := strings.TrimSuffix(strings.TrimPrefix(r.URL.Path, "/v4/users/me/dataTypes/"), "/dataPoints")
	f.mu.Lock()
	f.hits = append(f.hits, typ+"?"+r.URL.Query().Get("filter"))
	fail := f.failType == typ
	f.mu.Unlock()
	if fail {
		w.WriteHeader(400)
		return
	}
	today := time.Now().UTC()
	day := today.AddDate(0, 0, -1)
	date := fmt.Sprintf(`{"year":%d,"month":%d,"day":%d}`, day.Year(), int(day.Month()), day.Day())
	sample := day.Add(10 * time.Hour).Format(time.RFC3339)
	switch typ {
	case "daily-resting-heart-rate":
		fmt.Fprintf(w, `{"dataPoints":[{"dailyRestingHeartRate":{"date":%s,"beatsPerMinute":"61"}}]}`, date)
	case "daily-heart-rate-variability":
		fmt.Fprintf(w, `{"dataPoints":[{"dailyHeartRateVariability":{"date":%s,"averageHeartRateVariabilityMilliseconds":33.4}}]}`, date)
	case "daily-oxygen-saturation":
		fmt.Fprintf(w, `{"dataPoints":[{"dailyOxygenSaturation":{"date":%s,"averagePercentage":95.5,"lowerBoundPercentage":90.1}}]}`, date)
	case "daily-respiratory-rate":
		fmt.Fprintf(w, `{"dataPoints":[{"dailyRespiratoryRate":{"date":%s,"breathsPerMinute":13.2}}]}`, date)
	case "weight":
		fmt.Fprintf(w, `{"dataPoints":[{"weight":{"sampleTime":{"physicalTime":"%s"},"weightGrams":71200}}]}`, sample)
	case "heart-rate":
		// two pages: the newest sample is on page 2
		if r.URL.Query().Get("pageToken") == "" {
			fmt.Fprintf(w, `{"dataPoints":[{"heartRate":{"sampleTime":{"physicalTime":"%s"},"beatsPerMinute":"70"}}],"nextPageToken":"p2"}`, day.Add(time.Hour).Format(time.RFC3339))
		} else {
			fmt.Fprintf(w, `{"dataPoints":[{"heartRate":{"sampleTime":{"physicalTime":"%s"},"beatsPerMinute":"77"}},{"heartRate":{"sampleTime":{"physicalTime":"%s"},"beatsPerMinute":"0"}}]}`, day.Add(5*time.Hour).Format(time.RFC3339), day.Add(6*time.Hour).Format(time.RFC3339))
		}
	case "steps":
		st := day.Add(2 * time.Hour).Format(time.RFC3339)
		fmt.Fprintf(w, `{"dataPoints":[
		 {"dataSource":{"platform":"FITBIT"},"steps":{"interval":{"startTime":"%s"},"count":"4000"}},
		 {"dataSource":{"platform":"FITBIT"},"steps":{"interval":{"startTime":"%s"},"count":"1500"}},
		 {"dataSource":{"platform":"HEALTH_KIT"},"steps":{"interval":{"startTime":"%s"},"count":"9000"}}]}`, st, st, st)
	default:
		w.WriteHeader(404)
	}
}

// hEnv is one app instance on a fresh SQLite database.
type hEnv struct {
	t      *testing.T
	db     *localdb.DB
	dbSrv  *httptest.Server
	s      *Server
	h      http.Handler
	google *fakeGoogle
	anon   string
}

type hUser struct {
	ID, Token, Email string
}

func newHEnv(t *testing.T, mut func(*config.Config)) *hEnv {
	t.Helper()
	db, err := localdb.Open(localdb.Options{Path: filepath.Join(t.TempDir(), "h.db"), PBKDF2Iter: 1000, Logf: func(string, ...any) {}})
	if err != nil {
		t.Fatal(err)
	}
	srv := httptest.NewServer(db.Handler())
	t.Cleanup(func() { srv.Close(); db.Close() })
	anon, service := db.Keys()
	g := newFakeGoogle(t)
	cfg := &config.Config{
		Env: "development", PublicBaseURL: "https://tcm.test",
		GoogleHealthClientID: "test-client", GoogleHealthClientSecret: "test-secret", GoogleHealthRedirectURL: "https://tcm.test/api/health/google/callback",
		HealthTokenKey:      "unit-test-health-token-key-0123456789",
		GoogleHealthAuthURL: g.srv.URL + "/auth", GoogleHealthTokenURL: g.srv.URL + "/token", GoogleHealthRevokeURL: g.srv.URL + "/revoke", GoogleHealthAPIBase: g.srv.URL + "/v4",
	}
	if mut != nil {
		mut(cfg)
	}
	s := &Server{Cfg: cfg, DB: supabase.New(srv.URL, anon, service), Mux: http.NewServeMux()}
	s.routes()
	return &hEnv{t: t, db: db, dbSrv: srv, s: s, h: s.Handler(), google: g, anon: anon}
}

func (e *hEnv) user(email string) hUser {
	e.t.Helper()
	b, _ := json.Marshal(map[string]string{"email": email, "password": "secret123"})
	req, _ := http.NewRequest("POST", e.dbSrv.URL+"/auth/v1/signup", bytes.NewReader(b))
	req.Header.Set("apikey", e.anon)
	req.Header.Set("Content-Type", "application/json")
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		e.t.Fatal(err)
	}
	defer resp.Body.Close()
	var out struct {
		AccessToken string `json:"access_token"`
		User        struct {
			ID string `json:"id"`
		} `json:"user"`
	}
	_ = json.NewDecoder(resp.Body).Decode(&out)
	if out.AccessToken == "" {
		e.t.Fatalf("signup %s failed: %d", email, resp.StatusCode)
	}
	return hUser{ID: out.User.ID, Token: out.AccessToken, Email: email}
}

type hResp struct {
	*httptest.ResponseRecorder
}

func (r hResp) json() map[string]any {
	m := map[string]any{}
	_ = json.Unmarshal(r.Body.Bytes(), &m)
	return m
}

func (e *hEnv) do(method, path, token string, body any, hdr ...string) hResp {
	e.t.Helper()
	var rd io.Reader
	ct := ""
	switch b := body.(type) {
	case nil:
	case string:
		rd = strings.NewReader(b)
		ct = "application/json"
	case []byte:
		rd = bytes.NewReader(b)
	default:
		raw, _ := json.Marshal(b)
		rd = bytes.NewReader(raw)
		ct = "application/json"
	}
	req := httptest.NewRequest(method, path, rd)
	n := hIPSeq.Add(1) // a fresh client address per call: the per-IP route limiters never get in the way of these tests
	req.RemoteAddr = fmt.Sprintf("10.%d.%d.%d:5555", (n>>16)&255, (n>>8)&255, n&255)
	if ct != "" {
		req.Header.Set("Content-Type", ct)
	}
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}
	for i := 0; i+1 < len(hdr); i += 2 {
		req.Header.Set(hdr[i], hdr[i+1])
	}
	rec := httptest.NewRecorder()
	e.h.ServeHTTP(rec, req)
	return hResp{rec}
}

// table dumps a table through the service key.
func (e *hEnv) table(name string) []map[string]any {
	e.t.Helper()
	var rows []map[string]any
	if err := e.s.DB.Select(contextBG(), name, "select=*", "", &rows); err != nil {
		e.t.Fatal(err)
	}
	return rows
}

func contextBG() context.Context { return context.Background() }

var hIPSeq atomic.Int64

func nowISO(d time.Duration) string { return time.Now().UTC().Add(d).Format(time.RFC3339) }

func TestHealthIngestTokenLifecycle(t *testing.T) {
	e := newHEnv(t, nil)
	u := e.user("tok@example.com")

	// no token yet
	sum := e.do("GET", "/api/health/summary", u.Token, nil)
	if sum.Code != 200 {
		t.Fatalf("summary = %d %s", sum.Code, sum.Body)
	}
	ing := sum.json()["ingest"].(map[string]any)
	if ing["has_token"] != false || ing["url"] != "https://tcm.test/api/health/ingest" {
		t.Errorf("ingest before = %v", ing)
	}

	// create: the secret is returned exactly once
	c := e.do("POST", "/api/health/ingest-token", u.Token, nil)
	if c.Code != 201 {
		t.Fatalf("create = %d %s", c.Code, c.Body)
	}
	tok := c.json()["token"].(string)
	if !strings.HasPrefix(tok, "shi_") {
		t.Fatalf("token = %q", tok)
	}
	rows := e.table("health_ingest_tokens")
	if len(rows) != 1 || rows[0]["token_hash"] != hashIngestToken(tok) || rows[0]["token_hint"] != tok[len(tok)-4:] {
		t.Errorf("stored row = %v", rows)
	}
	for _, r := range rows {
		for k, v := range r {
			if s, _ := v.(string); strings.Contains(s, tok) {
				t.Errorf("column %s stores the clear token", k)
			}
		}
	}
	sum2 := e.do("GET", "/api/health/summary", u.Token, nil).json()["ingest"].(map[string]any)
	if sum2["has_token"] != true || sum2["hint"] != tok[len(tok)-4:] || sum2["token"] != nil {
		t.Errorf("summary after create = %v (must expose only the hint)", sum2)
	}

	post := func(token string) hResp {
		return e.do("POST", "/api/health/ingest", token, `[{"metric":"heart_rate","value":70,"unit":"bpm","measured_at":"`+nowISO(-time.Minute)+`"}]`)
	}
	if r := post(tok); r.Code != 200 {
		t.Fatalf("ingest with fresh token = %d %s", r.Code, r.Body)
	}
	if rows := e.table("health_ingest_tokens"); rows[0]["last_used_at"] == nil {
		t.Error("last_used_at not recorded")
	}

	// rotate: old token dies, new one works, still exactly one row
	c2 := e.do("POST", "/api/health/ingest-token", u.Token, nil)
	tok2 := c2.json()["token"].(string)
	if tok2 == tok {
		t.Fatal("rotation returned the same token")
	}
	if r := post(tok); r.Code != 401 {
		t.Errorf("rotated-out token = %d, want 401", r.Code)
	}
	if r := post(tok2); r.Code != 200 {
		t.Errorf("new token = %d %s", r.Code, r.Body)
	}
	if n := len(e.table("health_ingest_tokens")); n != 1 {
		t.Errorf("token rows = %d, want 1", n)
	}

	// revoke
	if r := e.do("DELETE", "/api/health/ingest-token", u.Token, nil); r.Code != 200 {
		t.Fatalf("revoke = %d %s", r.Code, r.Body)
	}
	if r := post(tok2); r.Code != 401 {
		t.Errorf("revoked token = %d, want 401", r.Code)
	}
	if n := len(e.table("health_ingest_tokens")); n != 0 {
		t.Errorf("token rows after revoke = %d", n)
	}
	// anonymous callers cannot manage tokens
	if r := e.do("POST", "/api/health/ingest-token", "", nil); r.Code != 401 {
		t.Errorf("anonymous create = %d", r.Code)
	}
}

func TestHealthIngestValidationAuthAndDedupe(t *testing.T) {
	e := newHEnv(t, nil)
	u := e.user("ing@example.com")
	other := e.user("other@example.com")
	tok := e.do("POST", "/api/health/ingest-token", u.Token, nil).json()["token"].(string)
	otherTok := e.do("POST", "/api/health/ingest-token", other.Token, nil).json()["token"].(string)

	ts1, ts2 := nowISO(-2*time.Hour), nowISO(-time.Hour)
	body := `[
	 {"metric":"heart_rate","value":72,"unit":"bpm","measured_at":"` + ts1 + `","source":"Shortcut","device":"Apple Watch"},
	 {"metric":"spo2","value":0.96,"unit":"%","measured_at":"` + ts2 + `"},
	 {"metric":"heart_rate","value":400,"measured_at":"` + ts2 + `"},
	 {"metric":"blood_sugar","value":5,"measured_at":"` + ts2 + `"}]`
	r := e.do("POST", "/api/health/ingest", tok, body)
	j := r.json()
	if r.Code != 200 || j["accepted"] != 2.0 || j["inserted"] != 2.0 || j["duplicates"] != 0.0 {
		t.Fatalf("first ingest = %d %s", r.Code, r.Body)
	}
	rej := j["rejected"].([]any)
	if len(rej) != 2 || rej[0].(map[string]any)["index"] != 2.0 {
		t.Errorf("rejected = %v", rej)
	}
	// replay: nothing new
	r = e.do("POST", "/api/health/ingest", tok, body)
	j = r.json()
	if r.Code != 200 || j["inserted"] != 0.0 || j["duplicates"] != 2.0 {
		t.Errorf("replay = %d %s", r.Code, r.Body)
	}
	rows := e.table("health_readings")
	if len(rows) != 2 {
		t.Fatalf("stored readings = %d, want 2", len(rows))
	}
	for _, row := range rows {
		if row["user_id"] != u.ID || row["source"] != "ingest" {
			t.Errorf("row owner/source = %v", row)
		}
		if row["metric"] == "spo2" && row["value"] != 96.0 {
			t.Errorf("spo2 stored as %v, want 96 (fraction converted)", row["value"])
		}
		if row["metric"] == "heart_rate" && row["device"] != "Apple Watch / Shortcut" {
			t.Errorf("device = %v", row["device"])
		}
	}
	// the other user's token writes to the OTHER user, even when the payload tries to name a user
	e.do("POST", "/api/health/ingest", otherTok, `[{"user_id":"`+u.ID+`","metric":"heart_rate","value":65,"measured_at":"`+nowISO(-3*time.Hour)+`"}]`)
	for _, row := range e.table("health_readings") {
		if row["value"] == 65.0 && row["user_id"] != other.ID {
			t.Errorf("a payload user_id redirected a reading to %v", row["user_id"])
		}
	}

	// auth failures
	for name, c := range map[string]struct {
		token string
		hdr   []string
		code  int
	}{
		"no header":                          {"", nil, 401},
		"garbage token":                      {"nope", nil, 401},
		"well-formed unknown":                {"shi_" + strings.Repeat("a", 43), nil, 401},
		"session JWT is not an ingest token": {u.Token, nil, 401},
	} {
		if got := e.do("POST", "/api/health/ingest", c.token, body, c.hdr...); got.Code != c.code {
			t.Errorf("%s: %d, want %d", name, got.Code, c.code)
		}
	}
	// payload hygiene
	if got := e.do("POST", "/api/health/ingest", tok, `{}`); got.Code != 400 {
		t.Errorf("empty object = %d", got.Code)
	}
	if got := e.do("POST", "/api/health/ingest", tok, `[{"metric":"heart_rate","value":999,"measured_at":"`+ts1+`"}]`); got.Code != 400 {
		t.Errorf("nothing valid = %d, want 400 so the automation notices", got.Code)
	}
	big := `[{"metric":"heart_rate","value":70,"measured_at":"` + ts1 + `","device":"` + strings.Repeat("x", 600<<10) + `"}]`
	if got := e.do("POST", "/api/health/ingest", tok, big); got.Code != 413 {
		t.Errorf("oversize body = %d, want 413", got.Code)
	}
	if got := e.do("POST", "/api/health/ingest", tok, []byte(body), "Content-Type", "text/plain"); got.Code != 415 {
		t.Errorf("text/plain = %d, want 415", got.Code)
	}
	// per-token limit
	limited := 0
	for i := 0; i < 70; i++ {
		if e.do("POST", "/api/health/ingest", otherTok, `[{"metric":"heart_rate","value":66,"measured_at":"`+nowISO(-time.Duration(i+10)*time.Minute)+`"}]`).Code == 429 {
			limited++
		}
	}
	if limited == 0 {
		t.Error("no per-token rate limit applied within a minute (60/min expected)")
	}
}

func TestHealthReadingsOwnRowsOnly(t *testing.T) {
	e := newHEnv(t, nil)
	a, b := e.user("a@example.com"), e.user("b@example.com")
	post := e.do("POST", "/api/health/readings", a.Token, map[string]any{"source": "bluetooth", "readings": []map[string]any{
		{"metric": "heart_rate", "value": 64, "unit": "bpm", "device": "Polar H10"},
		{"metric": "systolic_bp", "value": 121, "unit": "mmHg", "measured_at": nowISO(-time.Hour)},
		{"metric": "heart_rate", "value": 700},
	}})
	if post.Code != 200 || post.json()["inserted"] != 2.0 || len(post.json()["rejected"].([]any)) != 1 {
		t.Fatalf("add = %d %s", post.Code, post.Body)
	}
	// B sees nothing of A's
	lb := e.do("GET", "/api/health/readings", b.Token, nil).json()
	if lb["count"] != 0.0 {
		t.Errorf("B lists %v readings of A", lb["count"])
	}
	la := e.do("GET", "/api/health/readings?metric=heart_rate", a.Token, nil).json()
	if la["count"] != 1.0 {
		t.Fatalf("A lists %v", la)
	}
	id := la["readings"].([]any)[0].(map[string]any)["id"].(string)
	// B cannot delete A's row (RLS + user filter): nothing changes
	e.do("DELETE", "/api/health/readings", b.Token, map[string]any{"ids": []string{id}})
	e.do("DELETE", "/api/health/readings", b.Token, map[string]any{"all": true})
	if got := len(e.table("health_readings")); got != 2 {
		t.Errorf("rows after B's deletes = %d, want 2", got)
	}
	// a client cannot forge an owner: the body user_id is ignored (the API takes no such field) and manual adds are the caller's
	e.do("POST", "/api/health/readings", b.Token, `{"readings":[{"metric":"weight","value":70,"unit":"kg","user_id":"`+a.ID+`"}]}`)
	for _, row := range e.table("health_readings") {
		if row["metric"] == "weight_kg" && row["user_id"] != b.ID {
			t.Errorf("weight row belongs to %v", row["user_id"])
		}
	}
	// the database itself (RLS) hides A's rows from B even bypassing the app filter
	var leak []map[string]any
	if err := e.s.DB.Select(contextBG(), "health_readings", "select=id", b.Token, &leak); err != nil || len(leak) != 1 {
		t.Errorf("B's direct RLS select saw %d rows (err %v), want only B's own 1", len(leak), err)
	}
	// A deletes by id, then by source
	if r := e.do("DELETE", "/api/health/readings", a.Token, map[string]any{"ids": []string{id}}); r.Code != 200 {
		t.Fatalf("A delete = %d %s", r.Code, r.Body)
	}
	if r := e.do("DELETE", "/api/health/readings", a.Token, map[string]any{"source": "bluetooth"}); r.Code != 200 {
		t.Fatalf("A delete by source = %d", r.Code)
	}
	if e.do("GET", "/api/health/readings", a.Token, nil).json()["count"] != 0.0 {
		t.Error("A still has readings")
	}
	// validation
	for name, body := range map[string]any{"bad id": map[string]any{"ids": []string{"x' or 1=1"}}, "nothing": map[string]any{}, "bad source": map[string]any{"source": "evil"}} {
		if r := e.do("DELETE", "/api/health/readings", a.Token, body); r.Code != 400 {
			t.Errorf("%s = %d, want 400", name, r.Code)
		}
	}
	if r := e.do("GET", "/api/health/readings?metric=nope", a.Token, nil); r.Code != 400 {
		t.Errorf("unknown metric filter = %d", r.Code)
	}
	if r := e.do("POST", "/api/health/readings", a.Token, map[string]any{"source": "google_health", "readings": []map[string]any{{"metric": "heart_rate", "value": 70}}}); r.Code != 400 {
		t.Errorf("a client may not claim the google_health channel: %d", r.Code)
	}
	if r := e.do("GET", "/api/health/readings", "", nil); r.Code != 401 {
		t.Errorf("anonymous list = %d", r.Code)
	}
}

func zipBytes(t *testing.T, name, content string) []byte {
	t.Helper()
	var buf bytes.Buffer
	zw := zip.NewWriter(&buf)
	w, _ := zw.Create(name)
	_, _ = w.Write([]byte(content))
	_ = zw.Close()
	return buf.Bytes()
}

func TestHealthAppleImportEndpoint(t *testing.T) {
	e := newHEnv(t, nil)
	u, other := e.user("apple@example.com"), e.user("apple2@example.com")
	xmlText := loadAppleFixture(t, time.Now().UTC())
	up := func(token string, body []byte, ct string, withHeader bool) hResp {
		h := []string{"Content-Type", ct}
		if withHeader {
			h = append(h, "X-Sihat-Upload", "1")
		}
		return e.do("POST", "/api/health/apple/import", token, body, h...)
	}
	// header gate (CSRF protection for the raw-body route)
	if r := up(u.Token, zipBytes(t, "apple_health_export/export.xml", xmlText), "application/zip", false); r.Code != 400 {
		t.Errorf("no X-Sihat-Upload = %d, want 400", r.Code)
	}
	if r := up("", []byte(xmlText), "application/xml", true); r.Code != 401 {
		t.Errorf("anonymous = %d", r.Code)
	}
	for name, body := range map[string][]byte{
		"zip":     zipBytes(t, "apple_health_export/export.xml", xmlText),
		"raw xml": []byte(xmlText),
	} {
		e.do("DELETE", "/api/health/readings", u.Token, map[string]any{"all": true})
		ct := "application/zip"
		if name == "raw xml" {
			ct = "application/xml"
		}
		r := up(u.Token, body, ct, true)
		j := r.json()
		if r.Code != 200 || j["inserted"] != 12.0 || j["duplicates"] != 0.0 || j["file_stored"] != false {
			t.Fatalf("%s import = %d %s", name, r.Code, r.Body)
		}
		// importing the same file again is a no-op
		j = up(u.Token, body, ct, true).json()
		if j["inserted"] != 0.0 || j["duplicates"] != 12.0 {
			t.Errorf("%s re-import = %v", name, j)
		}
	}
	rows := e.table("health_readings")
	if len(rows) != 12 {
		t.Fatalf("stored = %d, want 12", len(rows))
	}
	for _, r := range rows {
		if r["source"] != "apple_export" || r["user_id"] != u.ID {
			t.Errorf("row = %v", r)
		}
	}
	// nothing from the export is kept except those rows: no table has a column holding the XML
	for _, tbl := range []string{"health_readings", "health_connections", "health_ingest_tokens"} {
		for _, r := range e.table(tbl) {
			for k, v := range r {
				if s, _ := v.(string); strings.Contains(s, "<Record") || strings.Contains(s, "HealthData") {
					t.Errorf("%s.%s stores export content", tbl, k)
				}
			}
		}
	}
	// not an export
	if r := up(u.Token, []byte("hello"), "application/octet-stream", true); r.Code != 400 {
		t.Errorf("garbage = %d", r.Code)
	}
	if r := up(u.Token, zipBytes(t, "notes.txt", "x"), "application/zip", true); r.Code != 400 {
		t.Errorf("zip without export.xml = %d", r.Code)
	}
	if r := up(u.Token, []byte("<HealthData><Record type="), "application/xml", true); r.Code != 400 {
		t.Errorf("truncated xml = %d", r.Code)
	}
	// owner scoping
	if e.do("GET", "/api/health/readings", other.Token, nil).json()["count"] != 0.0 {
		t.Error("other user sees imported rows")
	}
	// an empty-but-valid export
	r := up(u.Token, []byte("<HealthData></HealthData>"), "application/xml", true)
	if r.Code != 200 || r.json()["inserted"] != 0.0 || r.json()["message"] == nil {
		t.Errorf("empty export = %d %s", r.Code, r.Body)
	}
}

// cookieOf returns the Set-Cookie value for name.
func cookieOf(r hResp, name string) string {
	for _, c := range r.Result().Cookies() {
		if c.Name == name {
			return c.Value
		}
	}
	return ""
}

func TestHealthGoogleOAuthFlow(t *testing.T) {
	e := newHEnv(t, nil)
	g := e.google
	u := e.user("g@example.com")
	other := e.user("g2@example.com")

	summary := e.do("GET", "/api/health/summary", u.Token, nil).json()
	if srv := summary["server"].(map[string]any); srv["google"].(map[string]any)["configured"] != true {
		t.Fatalf("summary.server = %v", srv)
	}

	// 1. connect -> authorization URL with PKCE S256, state, offline access, read-only Health scopes
	cr := e.do("GET", "/api/health/google/connect?format=json", u.Token, nil)
	if cr.Code != 200 {
		t.Fatalf("connect = %d %s", cr.Code, cr.Body)
	}
	au, _ := url.Parse(cr.json()["url"].(string))
	q := au.Query()
	if !strings.HasPrefix(au.String(), g.srv.URL+"/auth?") || q.Get("response_type") != "code" || q.Get("client_id") != "test-client" ||
		q.Get("redirect_uri") != "https://tcm.test/api/health/google/callback" || q.Get("code_challenge_method") != "S256" ||
		q.Get("access_type") != "offline" || q.Get("state") == "" || q.Get("code_challenge") == "" {
		t.Fatalf("auth url = %s", au)
	}
	for _, sc := range strings.Fields(q.Get("scope")) {
		if !strings.HasPrefix(sc, "https://www.googleapis.com/auth/googlehealth.") || !strings.HasSuffix(sc, ".readonly") {
			t.Errorf("non read-only / non-health scope requested: %s", sc)
		}
	}
	g.mu.Lock()
	g.challenge = q.Get("code_challenge")
	g.codes["good-code"] = true
	g.mu.Unlock()
	state := q.Get("state")
	ck := cookieOf(cr, oauthCookie)
	if ck == "" {
		t.Fatal("no state cookie")
	}
	if strings.Contains(ck, state) || strings.Contains(ck, g.challenge) {
		t.Error("state cookie is not sealed")
	}
	if sc := cr.Result().Header.Get("Set-Cookie"); !strings.Contains(sc, "HttpOnly") || !strings.Contains(sc, "SameSite=Lax") {
		t.Errorf("state cookie flags: %s", sc)
	}
	cb := func(state, code, cookie string, token string) hResp {
		h := []string{}
		if cookie != "" {
			h = append(h, "Cookie", oauthCookie+"="+cookie)
		}
		if token != "" {
			h = append(h, "Authorization", "Bearer "+token)
		}
		return e.do("GET", "/api/health/google/callback?state="+url.QueryEscape(state)+"&code="+url.QueryEscape(code), "", nil, h...)
	}
	// 2. hostile callbacks do nothing
	for name, r := range map[string]hResp{
		"wrong state":            cb("forged", "good-code", ck, ""),
		"no cookie":              cb(state, "good-code", "", ""),
		"garbage cookie":         cb(state, "good-code", "AAAA", ""),
		"another user's session": cb(state, "good-code", ck, other.Token),
	} {
		if r.Code != 302 || !strings.Contains(r.Header().Get("Location"), "health=google_state") {
			t.Errorf("%s: %d -> %s", name, r.Code, r.Header().Get("Location"))
		}
	}
	if n := len(e.table("health_connections")); n != 0 {
		t.Fatalf("a rejected callback created %d connections", n)
	}
	// provider-side denial
	den := e.do("GET", "/api/health/google/callback?error=access_denied", "", nil)
	if !strings.Contains(den.Header().Get("Location"), "health=google_denied") {
		t.Errorf("denied -> %s", den.Header().Get("Location"))
	}
	// 3. good callback: code + verifier exchanged, refresh token stored sealed
	ok := cb(state, "good-code", ck, "")
	if ok.Code != 302 || !strings.Contains(ok.Header().Get("Location"), "health=google_connected") {
		t.Fatalf("callback = %d -> %s", ok.Code, ok.Header().Get("Location"))
	}
	conns := e.table("health_connections")
	if len(conns) != 1 || conns[0]["user_id"] != u.ID || conns[0]["status"] != "connected" {
		t.Fatalf("connections = %v", conns)
	}
	enc, _ := conns[0]["refresh_token_enc"].(string)
	if enc == "" || strings.Contains(enc, "fake-refresh-secret") {
		t.Errorf("refresh token not sealed: %q", enc)
	}
	if pt, err := openString(e.s.Cfg.HealthTokenKey, "refresh:"+u.ID, enc); err != nil || pt != "1//fake-refresh-secret" {
		t.Errorf("stored token does not decrypt for its owner: %q %v", pt, err)
	}
	// the code is single-use
	if r := cb(state, "good-code", ck, ""); !strings.Contains(r.Header().Get("Location"), "google_error") && !strings.Contains(r.Header().Get("Location"), "google_state") {
		t.Errorf("replayed callback -> %s", r.Header().Get("Location"))
	}
	// no secret anywhere in any API response
	sm := e.do("GET", "/api/health/summary", u.Token, nil)
	if strings.Contains(sm.Body.String(), "fake-refresh") || strings.Contains(sm.Body.String(), enc) || strings.Contains(sm.Body.String(), "refresh_token") {
		t.Errorf("summary leaks token material: %s", sm.Body)
	}
	if c := sm.json()["connections"].(map[string]any)["google_health"].(map[string]any); c["status"] != "connected" {
		t.Errorf("summary connection = %v", c)
	}

	// 4. sync
	sy := e.do("POST", "/api/health/google/sync", u.Token, `{"days":3}`)
	sj := sy.json()
	if sy.Code != 200 || sj["inserted"] != 7.0 || sj["duplicates"] != 0.0 {
		t.Fatalf("sync = %d %s", sy.Code, sy.Body)
	}
	got := map[string]float64{}
	for _, r := range e.table("health_readings") {
		if r["source"] != "google_health" || r["user_id"] != u.ID {
			t.Errorf("row = %v", r)
		}
		got[r["metric"].(string)] = r["value"].(float64)
	}
	want := map[string]float64{"resting_heart_rate": 61, "hrv_rmssd": 33.4, "spo2": 95.5, "respiratory_rate": 13.2, "weight_kg": 71.2, "heart_rate": 77, "steps": 5500}
	for k, v := range want {
		if got[k] != v {
			t.Errorf("%s = %v, want %v (all %v)", k, got[k], v, got)
		}
	}
	// the steps total comes from ONE platform (FITBIT 4000+1500), not 14500
	if got["steps"] == 14500 {
		t.Error("steps double counted across platforms")
	}
	conn := publicConn(mustConn(t, e, u.ID))
	if conn["last_sync_at"] == nil || !strings.HasPrefix(conn["last_sync_status"].(string), "ok:") {
		t.Errorf("sync bookkeeping = %v", conn)
	}
	// too soon: 429
	if r := e.do("POST", "/api/health/google/sync", u.Token, nil); r.Code != 429 {
		t.Errorf("immediate re-sync = %d, want 429", r.Code)
	}
	// age the last sync, then a re-sync stores nothing new (dedupe on the unique key)
	e.s.markConnection(contextBG(), mustConn(t, e, u.ID).ID, map[string]any{"last_sync_at": nowISO(-time.Hour)})
	sj = e.do("POST", "/api/health/google/sync", u.Token, nil).json()
	if sj["inserted"] != 0.0 || sj["duplicates"] != 7.0 {
		t.Errorf("re-sync = %v", sj)
	}
	// one failing data type does not sink the rest
	g.mu.Lock()
	g.failType = "weight"
	g.mu.Unlock()
	e.s.markConnection(contextBG(), mustConn(t, e, u.ID).ID, map[string]any{"last_sync_at": nowISO(-time.Hour)})
	sj = e.do("POST", "/api/health/google/sync", u.Token, nil).json()
	if errs, _ := sj["errors"].(map[string]any); errs["weight"] == nil || sj["duplicates"] != 6.0 {
		t.Errorf("partial failure = %v", sj)
	}
	// someone else has no connection
	if r := e.do("POST", "/api/health/google/sync", other.Token, nil); r.Code != 409 {
		t.Errorf("sync without a connection = %d, want 409", r.Code)
	}

	// 5. revoked at Google -> marked revoked, user told to reconnect
	g.mu.Lock()
	g.failGrant = true
	g.mu.Unlock()
	e.s.markConnection(contextBG(), mustConn(t, e, u.ID).ID, map[string]any{"last_sync_at": nowISO(-time.Hour)})
	if r := e.do("POST", "/api/health/google/sync", u.Token, nil); r.Code != 409 {
		t.Errorf("sync after revocation = %d, want 409", r.Code)
	}
	if mustConn(t, e, u.ID).Status != "revoked" {
		t.Errorf("status = %s, want revoked", mustConn(t, e, u.ID).Status)
	}
	g.mu.Lock()
	g.failGrant = false
	g.mu.Unlock()

	// 6. disconnect: token revoked at Google, row gone, optionally the synced readings too
	d := e.do("DELETE", "/api/health/google?delete_data=1", u.Token, nil)
	if d.Code != 200 || d.json()["revoked_at_google"] != true || d.json()["readings_deleted"] != true {
		t.Fatalf("disconnect = %d %s", d.Code, d.Body)
	}
	if len(g.revoked) != 1 || g.revoked[0] != "1//fake-refresh-secret" {
		t.Errorf("google revoke calls = %v", g.revoked)
	}
	if len(e.table("health_connections")) != 0 {
		t.Error("connection row still present")
	}
	for _, r := range e.table("health_readings") {
		if r["source"] == "google_health" {
			t.Errorf("google reading survived delete_data: %v", r)
		}
	}
}

func mustConn(t *testing.T, e *hEnv, uid string) *connRow {
	t.Helper()
	c, err := e.s.getConnection(contextBG(), uid, providerGoogle)
	if err != nil || c == nil {
		t.Fatalf("connection missing: %v", err)
	}
	return c
}

func TestHealthGoogleNotConfigured(t *testing.T) {
	for name, mut := range map[string]func(*config.Config){
		"no client":  func(c *config.Config) { c.GoogleHealthClientID = "" },
		"no secret":  func(c *config.Config) { c.GoogleHealthClientSecret = "" },
		"no enc key": func(c *config.Config) { c.HealthTokenKey = "" },
		"short key":  func(c *config.Config) { c.HealthTokenKey = "short" },
	} {
		e := newHEnv(t, mut)
		u := e.user(strings.ReplaceAll(name, " ", "") + "@example.com")
		sm := e.do("GET", "/api/health/summary", u.Token, nil).json()
		if sm["server"].(map[string]any)["google"].(map[string]any)["configured"] != false {
			t.Errorf("%s: summary claims configured", name)
		}
		if r := e.do("GET", "/api/health/google/connect?format=json", u.Token, nil); r.Code != 503 || r.json()["code"] != "google_not_configured" {
			t.Errorf("%s: connect json = %d %s", name, r.Code, r.Body)
		}
		if r := e.do("GET", "/api/health/google/connect", u.Token, nil); r.Code != 302 || !strings.Contains(r.Header().Get("Location"), "health=google_not_configured") {
			t.Errorf("%s: connect redirect = %d %s", name, r.Code, r.Header().Get("Location"))
		}
		if r := e.do("POST", "/api/health/google/sync", u.Token, nil); r.Code != 503 {
			t.Errorf("%s: sync = %d", name, r.Code)
		}
		if r := e.do("GET", "/api/health/google/callback?state=a&code=b", "", nil); !strings.Contains(r.Header().Get("Location"), "google_not_configured") {
			t.Errorf("%s: callback -> %s", name, r.Header().Get("Location"))
		}
		// the other channels keep working
		if r := e.do("POST", "/api/health/readings", u.Token, `{"readings":[{"metric":"heart_rate","value":70}]}`); r.Code != 200 {
			t.Errorf("%s: manual entry = %d", name, r.Code)
		}
	}
}

func TestHealthConnectRequiresLogin(t *testing.T) {
	e := newHEnv(t, nil)
	for _, p := range []struct{ m, path string }{
		{"GET", "/api/health/summary"}, {"GET", "/api/health/readings"}, {"POST", "/api/health/readings"}, {"DELETE", "/api/health/readings"},
		{"POST", "/api/health/ingest-token"}, {"DELETE", "/api/health/ingest-token"}, {"POST", "/api/health/apple/import"},
		{"GET", "/api/health/google/connect"}, {"POST", "/api/health/google/sync"}, {"DELETE", "/api/health/google"},
	} {
		if r := e.do(p.m, p.path, "", nil); r.Code != 401 {
			t.Errorf("%s %s anonymous = %d, want 401", p.m, p.path, r.Code)
		}
	}
}

func TestHealthPermissionsPolicyAllowsBluetooth(t *testing.T) {
	e := newHEnv(t, nil)
	r := e.do("GET", "/api/health/summary", "", nil) // any response carries the security headers
	pp := r.Header().Get("Permissions-Policy")
	if !strings.Contains(pp, "bluetooth=(self)") || !strings.Contains(pp, "camera=(self)") {
		t.Errorf("Permissions-Policy = %q", pp)
	}
	if csp := r.Header().Get("Content-Security-Policy"); strings.Contains(csp, "bluetooth") || strings.Contains(csp, "connect-src") {
		t.Errorf("CSP must not restrict Web Bluetooth: %q", csp)
	}
}
