// Package config loads runtime configuration from environment variables.
package config

import (
	"log"
	"os"
	"strconv"
	"strings"
)

// Config holds all runtime settings for the Sihat TCM Go server.
type Config struct {
	Port               string
	PublicBaseURL      string // e.g. https://tcm.wenjyue.com
	SupabaseURL        string // e.g. https://<ref>.supabase.co
	SupabaseAnonKey    string
	SupabaseServiceKey string // optional; admin operations degrade gracefully without it
	GeminiAPIKey       string
	AIBaseURL          string // optional: route AI calls to a Gemini-compatible endpoint (sihat-listener)
	TelegramBotToken   string // optional
	TelegramChatID     string // optional
	Env                string // development | production

	// Database backend. "supabase" (default) talks to SUPABASE_URL; "sqlite" runs the in-process SQLite
	// fallback (internal/localdb) and points the Supabase client at it — handlers are unchanged.
	DBBackend       string // DB_BACKEND: supabase | sqlite
	SQLitePath      string // SQLITE_PATH (default ./data/sihat.db)
	SeedDemo        bool   // SEED_DEMO=1|0 — demo accounts on first start (default: on unless APP_ENV=production)
	LocalJWTSecret  string // LOCAL_JWT_SECRET (empty: generated once and persisted in the db)
	LocalAnonKey    string // LOCAL_ANON_KEY (empty: generated + persisted)
	LocalServiceKey string // LOCAL_SERVICE_KEY (empty: generated + persisted)
	LocalPBKDF2Iter int    // LOCAL_PBKDF2_ITER (0 = 120000)
	LocalDBAddr     string // LOCALDB_ADDR internal listener (default 127.0.0.1:0 = random port)
	LocalDBHooks    bool   // LOCALDB_TEST_HOOKS=1 exposes /__fake/* on the internal listener (tests only; refused in production)

	// Wearable / health-data integrations (internal/server/health_*.go). All optional: with nothing set, the Google
	// channel reports "not configured on this server" and everything else (Bluetooth, Apple export, ingest token,
	// manual entry) still works.
	GoogleHealthClientID     string // GOOGLE_HEALTH_CLIENT_ID     OAuth 2.0 web client of the Google Cloud project
	GoogleHealthClientSecret string // GOOGLE_HEALTH_CLIENT_SECRET
	GoogleHealthRedirectURL  string // GOOGLE_HEALTH_REDIRECT_URL  default PUBLIC_BASE_URL + /api/health/google/callback
	HealthTokenKey           string // HEALTH_TOKEN_KEY (>=16 chars) AES-GCM key for stored refresh tokens + the OAuth state cookie
	// Endpoint overrides, honoured outside production only (tests point them at a fake Google server).
	GoogleHealthAuthURL   string // GOOGLE_HEALTH_AUTH_URL   default https://accounts.google.com/o/oauth2/v2/auth
	GoogleHealthTokenURL  string // GOOGLE_HEALTH_TOKEN_URL  default https://oauth2.googleapis.com/token
	GoogleHealthRevokeURL string // GOOGLE_HEALTH_REVOKE_URL default https://oauth2.googleapis.com/revoke
	GoogleHealthAPIBase   string // GOOGLE_HEALTH_API_BASE   default https://health.googleapis.com/v4
}

// Load reads configuration from the environment, applying defaults.
func Load() *Config {
	cfg := &Config{
		Port:               getenv("PORT", "3200"),
		PublicBaseURL:      getenv("PUBLIC_BASE_URL", "http://localhost:3200"),
		SupabaseURL:        os.Getenv("SUPABASE_URL"),
		SupabaseAnonKey:    os.Getenv("SUPABASE_ANON_KEY"),
		SupabaseServiceKey: os.Getenv("SUPABASE_SERVICE_ROLE_KEY"),
		GeminiAPIKey:       firstenv("GEMINI_API_KEY", "GOOGLE_GENERATIVE_AI_API_KEY"),
		AIBaseURL:          os.Getenv("AI_BASE_URL"),
		TelegramBotToken:   os.Getenv("TELEGRAM_BOT_TOKEN"),
		TelegramChatID:     os.Getenv("TELEGRAM_CHAT_ID"),
		Env:                getenv("APP_ENV", "development"),

		DBBackend:       strings.ToLower(strings.TrimSpace(getenv("DB_BACKEND", "supabase"))),
		SQLitePath:      getenv("SQLITE_PATH", "./data/sihat.db"),
		LocalJWTSecret:  os.Getenv("LOCAL_JWT_SECRET"),
		LocalAnonKey:    os.Getenv("LOCAL_ANON_KEY"),
		LocalServiceKey: os.Getenv("LOCAL_SERVICE_KEY"),
		LocalDBAddr:     getenv("LOCALDB_ADDR", "127.0.0.1:0"),
		LocalDBHooks:    truthy(os.Getenv("LOCALDB_TEST_HOOKS")),
	}
	cfg.GoogleHealthClientID = strings.TrimSpace(os.Getenv("GOOGLE_HEALTH_CLIENT_ID"))
	cfg.GoogleHealthClientSecret = strings.TrimSpace(os.Getenv("GOOGLE_HEALTH_CLIENT_SECRET"))
	cfg.HealthTokenKey = os.Getenv("HEALTH_TOKEN_KEY")
	cfg.GoogleHealthRedirectURL = strings.TrimSpace(getenv("GOOGLE_HEALTH_REDIRECT_URL", strings.TrimRight(cfg.PublicBaseURL, "/")+"/api/health/google/callback"))
	if cfg.Env != "production" {
		cfg.GoogleHealthAuthURL = strings.TrimSpace(os.Getenv("GOOGLE_HEALTH_AUTH_URL"))
		cfg.GoogleHealthTokenURL = strings.TrimSpace(os.Getenv("GOOGLE_HEALTH_TOKEN_URL"))
		cfg.GoogleHealthRevokeURL = strings.TrimSpace(os.Getenv("GOOGLE_HEALTH_REVOKE_URL"))
		cfg.GoogleHealthAPIBase = strings.TrimSpace(os.Getenv("GOOGLE_HEALTH_API_BASE"))
	}
	cfg.LocalPBKDF2Iter, _ = strconv.Atoi(os.Getenv("LOCAL_PBKDF2_ITER"))
	cfg.SeedDemo = cfg.Env != "production"
	if v := os.Getenv("SEED_DEMO"); v != "" {
		cfg.SeedDemo = truthy(v)
	}
	if cfg.AIBaseURL != "" && cfg.GeminiAPIKey == "" {
		cfg.GeminiAPIKey = "sihat-listener" // placeholder so key-presence checks pass; the listener ignores it
	}
	if cfg.GeminiAPIKey == "" {
		log.Println("WARN: GEMINI_API_KEY not set — AI endpoints will return 503")
	}
	if cfg.DBBackend == "sqlite" {
		log.Printf("DB backend: SQLite fallback at %s (set DB_BACKEND unset + SUPABASE_* to go back to Supabase)", cfg.SQLitePath)
	} else if cfg.SupabaseURL == "" || cfg.SupabaseAnonKey == "" {
		log.Println("WARN: Supabase not configured — auth/persistence endpoints will return 503")
	}
	return cfg
}

func getenv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func firstenv(keys ...string) string {
	for _, k := range keys {
		if v := os.Getenv(k); v != "" {
			return v
		}
	}
	return ""
}

func truthy(v string) bool {
	switch strings.ToLower(strings.TrimSpace(v)) {
	case "1", "true", "yes", "on":
		return true
	}
	return false
}
