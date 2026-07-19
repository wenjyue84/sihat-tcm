// Package config loads runtime configuration from environment variables.
package config

import (
	"log"
	"os"
)

// Config holds all runtime settings for the Sihat TCM Go server.
type Config struct {
	Port               string
	PublicBaseURL      string // e.g. https://tcm.wenjyue.com
	SupabaseURL        string // e.g. https://<ref>.supabase.co
	SupabaseAnonKey    string
	SupabaseServiceKey string // optional; admin operations degrade gracefully without it
	GeminiAPIKey       string
	TelegramBotToken   string // optional
	TelegramChatID     string // optional
	Env                string // development | production
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
		TelegramBotToken:   os.Getenv("TELEGRAM_BOT_TOKEN"),
		TelegramChatID:     os.Getenv("TELEGRAM_CHAT_ID"),
		Env:                getenv("APP_ENV", "development"),
	}
	if cfg.GeminiAPIKey == "" {
		log.Println("WARN: GEMINI_API_KEY not set — AI endpoints will return 503")
	}
	if cfg.SupabaseURL == "" || cfg.SupabaseAnonKey == "" {
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
