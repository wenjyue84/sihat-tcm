package server

import (
	"context"
	"sync"
	"time"
)

// System prompt roles (mirror of src/lib/promptLoader.ts).
const (
	PromptDoctorChat           = "doctor_chat"
	PromptDoctorFinal          = "doctor_final"
	PromptDoctorImage          = "doctor_image"
	PromptDoctorListening      = "doctor_listening"
	PromptDoctorInquirySummary = "doctor_inquiry_summary"
	PromptDoctorReportChat     = "doctor_report_chat"
	PromptDoctorWesternChat    = "doctor_western_chat"
	PromptHeartCompanion       = "heart_companion"
)

type cachedPrompt struct {
	text    string
	fetched time.Time
}

var (
	promptMu    sync.Mutex
	promptCache = map[string]cachedPrompt{}
)

const promptTTL = 5 * time.Minute

// SystemPrompt returns the system prompt for a role: system_prompts table first
// (5-minute cache), falling back to the built-in default (defaultPrompts is
// populated in prompts_default.go).
func (s *Server) SystemPrompt(ctx context.Context, role string) string {
	promptMu.Lock()
	if c, ok := promptCache[role]; ok && time.Since(c.fetched) < promptTTL {
		promptMu.Unlock()
		return c.text
	}
	promptMu.Unlock()

	text := ""
	if s.DB.Configured() {
		var rows []struct {
			Prompt string `json:"prompt_text"`
		}
		cctx, cancel := context.WithTimeout(ctx, 8*time.Second)
		defer cancel()
		if err := s.DB.Select(cctx, "system_prompts", "select=prompt_text&role=eq."+role, "", &rows); err == nil && len(rows) > 0 {
			text = rows[0].Prompt
		}
	}
	if text == "" {
		text = defaultPrompts[role]
	}
	promptMu.Lock()
	promptCache[role] = cachedPrompt{text: text, fetched: time.Now()}
	promptMu.Unlock()
	return text
}
