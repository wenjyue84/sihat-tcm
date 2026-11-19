package main

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"strings"
	"testing"

	"sihattcm/internal/config"
	"sihattcm/internal/server"
)

func sqliteCfg(t *testing.T) *config.Config {
	t.Helper()
	return &config.Config{
		Port: "0", PublicBaseURL: "http://app.test", Env: "test", GeminiAPIKey: "k",
		DBBackend: "sqlite", SQLitePath: filepath.Join(t.TempDir(), "sub", "app.db"), SeedDemo: true,
		LocalPBKDF2Iter: 1000, LocalDBAddr: "127.0.0.1:0",
		// the Supabase values kept in .env for the future switch back must be ignored, not used
		SupabaseURL: "https://dead.supabase.co", SupabaseAnonKey: "old-anon", SupabaseServiceKey: "old-service",
	}
}

func TestSQLiteBackendWiring(t *testing.T) {
	cfg := sqliteCfg(t)
	run, err := startLocalDB(cfg, false)
	if err != nil {
		t.Fatalf("startLocalDB: %v", err)
	}
	t.Cleanup(func() { run.Close() })
	if cfg.SupabaseURL != run.URL || !strings.HasPrefix(run.URL, "http://127.0.0.1:") {
		t.Fatalf("SupabaseURL %q must point at the internal listener %q", cfg.SupabaseURL, run.URL)
	}
	if cfg.SupabaseAnonKey == "old-anon" || cfg.SupabaseServiceKey == "old-service" || cfg.SupabaseServiceKey == "" {
		t.Fatalf("keys must come from the local backend: %q %q", cfg.SupabaseAnonKey, cfg.SupabaseServiceKey)
	}
	// hooks are off in normal operation: the internal API must not expose the test endpoints
	if r, err := http.Get(run.URL + "/__fake/health"); err != nil || r.StatusCode != 404 {
		t.Fatalf("test hooks reachable without LOCALDB_TEST_HOOKS: %v %v", r, err)
	}

	srv, err := server.New(cfg, templatesFS, staticFS)
	if err != nil {
		t.Fatal(err)
	}
	ts := httptest.NewServer(srv.Handler())
	defer ts.Close()

	var health map[string]any
	getJSON(t, ts.URL+"/healthz", &health)
	if health["db"] != true {
		t.Fatalf("healthz %v", health)
	}
	// seeded demo account logs in through the real handler -> signed JWT in the cookie
	body, _ := json.Marshal(map[string]string{"email": "patient@sihat.com", "password": "password123"})
	resp, err := http.Post(ts.URL+"/api/auth/login", "application/json", bytes.NewReader(body))
	if err != nil {
		t.Fatal(err)
	}
	b, _ := io.ReadAll(resp.Body)
	resp.Body.Close()
	if resp.StatusCode != 200 {
		t.Fatalf("login %d %s", resp.StatusCode, b)
	}
	// wrong password
	body, _ = json.Marshal(map[string]string{"email": "patient@sihat.com", "password": "nope-nope"})
	resp, _ = http.Post(ts.URL+"/api/auth/login", "application/json", bytes.NewReader(body))
	resp.Body.Close()
	if resp.StatusCode == 200 {
		t.Fatal("wrong password accepted")
	}
	// the seeded doctor directory is served
	var docs struct {
		Doctors []map[string]any `json:"doctors"`
	}
	getJSON(t, ts.URL+"/api/doctors", &docs)
	if len(docs.Doctors) != 9 {
		t.Fatalf("doctors %d want 9 (doctor@ + the 8 named demo doctors)", len(docs.Doctors))
	}
}

func TestSQLiteHooksRefusedInProduction(t *testing.T) {
	cfg := sqliteCfg(t)
	cfg.Env = "production"
	cfg.LocalDBHooks = true
	if run, err := startLocalDB(cfg, false); err == nil {
		run.Close()
		t.Fatal("LOCALDB_TEST_HOOKS must be refused when APP_ENV=production")
	}
	cfg = sqliteCfg(t)
	cfg.Env = "production"
	if run, err := startLocalDB(cfg, true); err == nil {
		run.Close()
		t.Fatal("--localdb-only (hooks + scratch tables) must be refused when APP_ENV=production")
	}
	// production without hooks is fine, and honours SeedDemo=false (no demo accounts)
	cfg = sqliteCfg(t)
	cfg.Env, cfg.SeedDemo = "production", false
	run, err := startLocalDB(cfg, false)
	if err != nil {
		t.Fatalf("production start: %v", err)
	}
	defer run.Close()
	srv, _ := server.New(cfg, templatesFS, staticFS)
	ts := httptest.NewServer(srv.Handler())
	defer ts.Close()
	body, _ := json.Marshal(map[string]string{"email": "admin@sihat.com", "password": "password123"})
	resp, _ := http.Post(ts.URL+"/api/auth/login", "application/json", bytes.NewReader(body))
	resp.Body.Close()
	if resp.StatusCode == 200 {
		t.Fatal("demo admin exists although SEED_DEMO=0")
	}
}

func getJSON(t *testing.T, url string, out any) {
	t.Helper()
	r, err := http.Get(url)
	if err != nil {
		t.Fatal(err)
	}
	defer r.Body.Close()
	if err := json.NewDecoder(r.Body).Decode(out); err != nil {
		t.Fatalf("GET %s: %v", url, err)
	}
}
