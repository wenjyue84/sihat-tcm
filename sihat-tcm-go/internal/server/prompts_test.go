package server

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"sihattcm/internal/supabase"
)

var taiAllPromptRoles = []string{
	PromptDoctorChat,
	PromptDoctorFinal,
	PromptDoctorImage,
	PromptDoctorListening,
	PromptDoctorInquirySummary,
	PromptDoctorReportChat,
	PromptDoctorWesternChat,
	PromptHeartCompanion,
}

// taiResetPromptCache clears the process-wide cache now and again on cleanup so
// tests neither depend on nor leak cached prompts.
func taiResetPromptCache(t *testing.T) {
	t.Helper()
	clear := func() {
		promptMu.Lock()
		for k := range promptCache {
			delete(promptCache, k)
		}
		promptMu.Unlock()
	}
	clear()
	t.Cleanup(clear)
}

func TestTAI_PromptConstantsValues(t *testing.T) {
	want := map[string]string{
		PromptDoctorChat:           "doctor_chat",
		PromptDoctorFinal:          "doctor_final",
		PromptDoctorImage:          "doctor_image",
		PromptDoctorListening:      "doctor_listening",
		PromptDoctorInquirySummary: "doctor_inquiry_summary",
		PromptDoctorReportChat:     "doctor_report_chat",
		PromptDoctorWesternChat:    "doctor_western_chat",
		PromptHeartCompanion:       "heart_companion",
	}
	seen := map[string]bool{}
	for got, w := range want {
		if got != w {
			t.Errorf("constant value %q want %q (matches system_prompts.role column)", got, w)
		}
		if seen[got] {
			t.Errorf("duplicate role %q", got)
		}
		seen[got] = true
	}
}

func TestTAI_DefaultPromptsRegistry(t *testing.T) {
	for _, role := range taiAllPromptRoles {
		t.Run(role, func(t *testing.T) {
			p, ok := defaultPrompts[role]
			if !ok {
				t.Fatalf("no default prompt registered for %q", role)
			}
			if strings.TrimSpace(p) == "" {
				t.Fatalf("default prompt for %q is blank", role)
			}
			if len(strings.TrimSpace(p)) < 200 {
				t.Errorf("default prompt for %q suspiciously short (%d bytes)", role, len(p))
			}
		})
	}
	t.Run("no unexpected extra roles", func(t *testing.T) {
		known := map[string]bool{}
		for _, r := range taiAllPromptRoles {
			known[r] = true
		}
		for k := range defaultPrompts {
			if !known[k] {
				t.Errorf("defaultPrompts has role %q with no Prompt* constant", k)
			}
		}
	})
	t.Run("no leftover template placeholders", func(t *testing.T) {
		for role, p := range defaultPrompts {
			if strings.Contains(p, "${") {
				t.Errorf("role %q still contains a TS template placeholder ${...}", role)
			}
		}
	})
}

func TestTAI_SystemPrompt_FallbackWhenDBUnavailable(t *testing.T) {
	taiResetPromptCache(t)
	s := &Server{DB: supabase.New("", "", "")}
	for _, role := range taiAllPromptRoles {
		t.Run(role, func(t *testing.T) {
			got := s.SystemPrompt(context.Background(), role)
			if got == "" {
				t.Fatal("empty prompt")
			}
			if got != defaultPrompts[role] {
				t.Error("fallback must equal built-in default")
			}
		})
	}
}

func TestTAI_SystemPrompt_UnknownRoleIsEmpty(t *testing.T) {
	taiResetPromptCache(t)
	s := &Server{DB: supabase.New("", "", "")}
	if got := s.SystemPrompt(context.Background(), "no_such_role"); got != "" {
		t.Errorf("unknown role should yield empty string, got %q", got)
	}
}

func TestTAI_SystemPrompt_CacheHit(t *testing.T) {
	taiResetPromptCache(t)
	promptMu.Lock()
	promptCache[PromptHeartCompanion] = cachedPrompt{text: "CACHED-VALUE", fetched: time.Now()}
	promptMu.Unlock()
	s := &Server{DB: supabase.New("", "", "")}
	if got := s.SystemPrompt(context.Background(), PromptHeartCompanion); got != "CACHED-VALUE" {
		t.Errorf("fresh cache entry must win, got %q", taiTrunc(got, 40))
	}
}

func TestTAI_SystemPrompt_CacheExpiry(t *testing.T) {
	taiResetPromptCache(t)
	promptMu.Lock()
	promptCache[PromptHeartCompanion] = cachedPrompt{text: "STALE", fetched: time.Now().Add(-promptTTL - time.Second)}
	promptMu.Unlock()
	s := &Server{DB: supabase.New("", "", "")}
	got := s.SystemPrompt(context.Background(), PromptHeartCompanion)
	if got == "STALE" || got != defaultPrompts[PromptHeartCompanion] {
		t.Errorf("expired entry must be refreshed from default, got %q", taiTrunc(got, 40))
	}
	// And the refreshed value is re-cached with a new timestamp.
	promptMu.Lock()
	c := promptCache[PromptHeartCompanion]
	promptMu.Unlock()
	if time.Since(c.fetched) > time.Minute || c.text != defaultPrompts[PromptHeartCompanion] {
		t.Errorf("cache not refreshed: %+v", c.fetched)
	}
}

func TestTAI_SystemPrompt_CachesFallback(t *testing.T) {
	taiResetPromptCache(t)
	s := &Server{DB: supabase.New("", "", "")}
	_ = s.SystemPrompt(context.Background(), PromptDoctorChat)
	promptMu.Lock()
	_, ok := promptCache[PromptDoctorChat]
	promptMu.Unlock()
	if !ok {
		t.Error("fallback result should be cached")
	}
}

func TestTAI_SystemPrompt_TTLConstant(t *testing.T) {
	if promptTTL != 5*time.Minute {
		t.Errorf("promptTTL=%v want 5m", promptTTL)
	}
}

func taiFakeSupabase(t *testing.T, h http.HandlerFunc) *Server {
	t.Helper()
	srv := httptest.NewServer(h)
	t.Cleanup(srv.Close)
	return &Server{DB: supabase.New(srv.URL, "anon-key", "")}
}

func TestTAI_SystemPrompt_DBOverride(t *testing.T) {
	taiResetPromptCache(t)
	var gotPath, gotQuery string
	s := taiFakeSupabase(t, func(w http.ResponseWriter, r *http.Request) {
		gotPath, gotQuery = r.URL.Path, r.URL.RawQuery
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode([]map[string]string{{"prompt_text": "DB-PROMPT"}})
	})
	got := s.SystemPrompt(context.Background(), PromptDoctorChat)
	if got != "DB-PROMPT" {
		t.Fatalf("got %q", taiTrunc(got, 40))
	}
	if gotPath != "/rest/v1/system_prompts" {
		t.Errorf("path %q", gotPath)
	}
	taiMustContain(t, gotQuery, "select=prompt_text", "role=eq.doctor_chat")
}

func TestTAI_SystemPrompt_DBFallbacks(t *testing.T) {
	tests := []struct {
		name string
		h    http.HandlerFunc
	}{
		{"http 500", func(w http.ResponseWriter, r *http.Request) { http.Error(w, "x", 500) }},
		{"no rows", func(w http.ResponseWriter, r *http.Request) { _, _ = w.Write([]byte(`[]`)) }},
		{"blank prompt_text column", func(w http.ResponseWriter, r *http.Request) { _, _ = w.Write([]byte(`[{"prompt_text":""}]`)) }},
		{"garbage body", func(w http.ResponseWriter, r *http.Request) { _, _ = w.Write([]byte(`<html>`)) }},
	}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			taiResetPromptCache(t)
			s := taiFakeSupabase(t, tc.h)
			got := s.SystemPrompt(context.Background(), PromptHeartCompanion)
			if got != defaultPrompts[PromptHeartCompanion] {
				t.Errorf("expected built-in default, got %q", taiTrunc(got, 40))
			}
		})
	}
}

func TestTAI_SystemPrompt_CanceledContextFallsBack(t *testing.T) {
	taiResetPromptCache(t)
	s := taiFakeSupabase(t, func(w http.ResponseWriter, r *http.Request) {
		_, _ = w.Write([]byte(`[{"prompt_text":"DB"}]`))
	})
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	if got := s.SystemPrompt(ctx, PromptDoctorFinal); got != defaultPrompts[PromptDoctorFinal] {
		t.Errorf("canceled ctx should fall back to default, got %q", taiTrunc(got, 40))
	}
}
