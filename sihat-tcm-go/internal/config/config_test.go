package config

import "testing"

var tcfgAllKeys = []string{
	"PORT", "PUBLIC_BASE_URL", "SUPABASE_URL", "SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY",
	"GEMINI_API_KEY", "GOOGLE_GENERATIVE_AI_API_KEY", "AI_BASE_URL",
	"TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID", "APP_ENV",
	"DB_BACKEND", "SQLITE_PATH", "SEED_DEMO", "LOCAL_JWT_SECRET", "LOCAL_ANON_KEY", "LOCAL_SERVICE_KEY", "LOCAL_PBKDF2_ITER",
	"LOCALDB_ADDR", "LOCALDB_TEST_HOOKS",
	"GOOGLE_HEALTH_CLIENT_ID", "GOOGLE_HEALTH_CLIENT_SECRET", "GOOGLE_HEALTH_REDIRECT_URL", "HEALTH_TOKEN_KEY",
	"GOOGLE_HEALTH_AUTH_URL", "GOOGLE_HEALTH_TOKEN_URL", "GOOGLE_HEALTH_REVOKE_URL", "GOOGLE_HEALTH_API_BASE",
}

// tcfgClear blanks every env var Load reads (restored automatically by t.Setenv).
func tcfgClear(t *testing.T) {
	t.Helper()
	for _, k := range tcfgAllKeys {
		t.Setenv(k, "")
	}
}

func TestTCfgLoadDefaults(t *testing.T) {
	tcfgClear(t)
	c := Load()
	if c.Port != "3200" {
		t.Errorf("Port = %q", c.Port)
	}
	if c.PublicBaseURL != "http://localhost:3200" {
		t.Errorf("PublicBaseURL = %q", c.PublicBaseURL)
	}
	if c.Env != "development" {
		t.Errorf("Env = %q", c.Env)
	}
	for name, v := range map[string]string{
		"SupabaseURL": c.SupabaseURL, "SupabaseAnonKey": c.SupabaseAnonKey,
		"SupabaseServiceKey": c.SupabaseServiceKey, "GeminiAPIKey": c.GeminiAPIKey,
		"AIBaseURL": c.AIBaseURL, "TelegramBotToken": c.TelegramBotToken, "TelegramChatID": c.TelegramChatID,
	} {
		if v != "" {
			t.Errorf("%s should default empty, got %q", name, v)
		}
	}
}

func TestTCfgLoadEnvOverrides(t *testing.T) {
	tcfgClear(t)
	t.Setenv("PORT", "9999")
	t.Setenv("PUBLIC_BASE_URL", "https://tcm.example.com")
	t.Setenv("SUPABASE_URL", "https://abc.supabase.co")
	t.Setenv("SUPABASE_ANON_KEY", "anon")
	t.Setenv("SUPABASE_SERVICE_ROLE_KEY", "svc")
	t.Setenv("GEMINI_API_KEY", "gem")
	t.Setenv("AI_BASE_URL", "http://127.0.0.1:1234")
	t.Setenv("TELEGRAM_BOT_TOKEN", "tok")
	t.Setenv("TELEGRAM_CHAT_ID", "42")
	t.Setenv("APP_ENV", "production")
	c := Load()
	want := Config{
		Port: "9999", PublicBaseURL: "https://tcm.example.com", SupabaseURL: "https://abc.supabase.co",
		SupabaseAnonKey: "anon", SupabaseServiceKey: "svc", GeminiAPIKey: "gem",
		AIBaseURL: "http://127.0.0.1:1234", TelegramBotToken: "tok", TelegramChatID: "42", Env: "production",
		DBBackend: "supabase", SQLitePath: "./data/sihat.db", SeedDemo: false, LocalDBAddr: "127.0.0.1:0",
		GoogleHealthRedirectURL: "https://tcm.example.com/api/health/google/callback",
	}
	if *c != want {
		t.Errorf("got %+v\nwant %+v", *c, want)
	}
}

func TestTCfgGeminiKeyResolution(t *testing.T) {
	tests := []struct {
		name    string
		gemini  string
		google  string
		aiBase  string
		wantKey string
	}{
		{"none", "", "", "", ""},
		{"gemini only", "g", "", "", "g"},
		{"google fallback", "", "gg", "", "gg"},
		{"gemini wins over google", "g", "gg", "", "g"},
		{"placeholder when AI_BASE_URL and no key", "", "", "http://x", "sihat-listener"},
		{"real key kept with AI_BASE_URL", "g", "", "http://x", "g"},
		{"google key kept with AI_BASE_URL", "", "gg", "http://x", "gg"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			tcfgClear(t)
			t.Setenv("GEMINI_API_KEY", tt.gemini)
			t.Setenv("GOOGLE_GENERATIVE_AI_API_KEY", tt.google)
			t.Setenv("AI_BASE_URL", tt.aiBase)
			if got := Load().GeminiAPIKey; got != tt.wantKey {
				t.Errorf("GeminiAPIKey = %q, want %q", got, tt.wantKey)
			}
		})
	}
}

func TestTCfgEmptyEnvTreatedAsUnset(t *testing.T) {
	tcfgClear(t)
	t.Setenv("PORT", "")
	t.Setenv("APP_ENV", "")
	t.Setenv("PUBLIC_BASE_URL", "")
	c := Load()
	if c.Port != "3200" || c.Env != "development" || c.PublicBaseURL != "http://localhost:3200" {
		t.Errorf("empty values must fall back to defaults: %+v", *c)
	}
}

func TestTCfgGetenv(t *testing.T) {
	t.Setenv("TCFG_TEST_KEY", "")
	if got := getenv("TCFG_TEST_KEY", "fb"); got != "fb" {
		t.Errorf("empty -> %q", got)
	}
	t.Setenv("TCFG_TEST_KEY", "val")
	if got := getenv("TCFG_TEST_KEY", "fb"); got != "val" {
		t.Errorf("set -> %q", got)
	}
}

func TestTCfgFirstenv(t *testing.T) {
	t.Setenv("TCFG_A", "")
	t.Setenv("TCFG_B", "")
	t.Setenv("TCFG_C", "")
	tests := []struct {
		name    string
		a, b, c string
		keys    []string
		want    string
	}{
		{"no keys", "", "", "", nil, ""},
		{"all empty", "", "", "", []string{"TCFG_A", "TCFG_B"}, ""},
		{"first wins", "a", "b", "", []string{"TCFG_A", "TCFG_B"}, "a"},
		{"skip empty first", "", "b", "", []string{"TCFG_A", "TCFG_B"}, "b"},
		{"third", "", "", "c", []string{"TCFG_A", "TCFG_B", "TCFG_C"}, "c"},
		{"order respected", "a", "b", "", []string{"TCFG_B", "TCFG_A"}, "b"},
		{"unset key skipped", "", "", "c", []string{"TCFG_NOPE_UNSET", "TCFG_C"}, "c"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Setenv("TCFG_A", tt.a)
			t.Setenv("TCFG_B", tt.b)
			t.Setenv("TCFG_C", tt.c)
			if got := firstenv(tt.keys...); got != tt.want {
				t.Errorf("got %q want %q", got, tt.want)
			}
		})
	}
}

func TestTCfgDBBackendDefaults(t *testing.T) {
	tcfgClear(t)
	c := Load()
	if c.DBBackend != "supabase" || c.SQLitePath != "./data/sihat.db" || c.LocalDBAddr != "127.0.0.1:0" || c.LocalDBHooks {
		t.Errorf("defaults: %+v", *c)
	}
	if !c.SeedDemo {
		t.Error("SeedDemo defaults on outside production")
	}
}

func TestTCfgSQLiteEnv(t *testing.T) {
	tcfgClear(t)
	t.Setenv("DB_BACKEND", " SQLite ")
	t.Setenv("SQLITE_PATH", "/data/s.db")
	t.Setenv("LOCAL_JWT_SECRET", "js")
	t.Setenv("LOCAL_ANON_KEY", "ak")
	t.Setenv("LOCAL_SERVICE_KEY", "sk")
	t.Setenv("LOCAL_PBKDF2_ITER", "250000")
	t.Setenv("LOCALDB_ADDR", "127.0.0.1:5555")
	t.Setenv("LOCALDB_TEST_HOOKS", "1")
	c := Load()
	if c.DBBackend != "sqlite" || c.SQLitePath != "/data/s.db" || c.LocalJWTSecret != "js" || c.LocalAnonKey != "ak" ||
		c.LocalServiceKey != "sk" || c.LocalPBKDF2Iter != 250000 || c.LocalDBAddr != "127.0.0.1:5555" || !c.LocalDBHooks {
		t.Errorf("got %+v", *c)
	}
}

func TestTCfgSeedDemo(t *testing.T) {
	for _, tc := range []struct {
		env, seed string
		want      bool
	}{
		{"", "", true}, {"development", "", true}, {"production", "", false},
		{"production", "1", true}, {"development", "0", false}, {"development", "false", false}, {"", "true", true},
	} {
		tcfgClear(t)
		t.Setenv("APP_ENV", tc.env)
		t.Setenv("SEED_DEMO", tc.seed)
		if got := Load().SeedDemo; got != tc.want {
			t.Errorf("APP_ENV=%q SEED_DEMO=%q: SeedDemo=%v want %v", tc.env, tc.seed, got, tc.want)
		}
	}
}

func TestTCfgHealthIntegration(t *testing.T) {
	tcfgClear(t)
	c := Load()
	if c.GoogleHealthClientID != "" || c.HealthTokenKey != "" {
		t.Errorf("health settings must default empty: %+v", c)
	}
	if c.GoogleHealthRedirectURL != "http://localhost:3200/api/health/google/callback" {
		t.Errorf("default redirect = %q", c.GoogleHealthRedirectURL)
	}
	t.Setenv("GOOGLE_HEALTH_CLIENT_ID", " cid ")
	t.Setenv("GOOGLE_HEALTH_CLIENT_SECRET", "sec")
	t.Setenv("GOOGLE_HEALTH_REDIRECT_URL", "https://x.test/cb")
	t.Setenv("HEALTH_TOKEN_KEY", "0123456789abcdef")
	t.Setenv("GOOGLE_HEALTH_TOKEN_URL", "http://127.0.0.1:1/token")
	c = Load()
	if c.GoogleHealthClientID != "cid" || c.GoogleHealthClientSecret != "sec" || c.GoogleHealthRedirectURL != "https://x.test/cb" || c.HealthTokenKey != "0123456789abcdef" {
		t.Errorf("health env not loaded: %+v", c)
	}
	if c.GoogleHealthTokenURL != "http://127.0.0.1:1/token" {
		t.Errorf("token URL override ignored outside production: %q", c.GoogleHealthTokenURL)
	}
	t.Setenv("APP_ENV", "production")
	if c = Load(); c.GoogleHealthTokenURL != "" {
		t.Errorf("endpoint overrides must be ignored in production, got %q", c.GoogleHealthTokenURL)
	}
}
