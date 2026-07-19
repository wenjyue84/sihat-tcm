// Package gemini is a minimal REST client for the Google Generative Language API.
package gemini

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

const baseURL = "https://generativelanguage.googleapis.com/v1beta/models"

// Model tiers mirroring the web app's AI model router.
const (
	ModelFlash = "gemini-flash-latest" // standard tier
	ModelPro   = "gemini-3.5-flash"    // complex cases
	ModelLite  = "gemini-3.1-flash-lite" // simple cases
)

// legacyModels maps deprecated model IDs (ported from the Next.js codebase)
// to currently-available equivalents. Free tier no longer serves 1.x/2.x models.
var legacyModels = map[string]string{
	"gemini-1.5-flash":     ModelLite,
	"gemini-1.5-pro":       ModelPro,
	"gemini-2.0-flash":     ModelFlash,
	"gemini-2.0-flash-exp": ModelFlash,
	"gemini-2.0-flash-thinking-exp-01-21": ModelPro,
	"gemini-2.5-flash":      ModelFlash,
	"gemini-2.5-flash-lite": ModelLite,
	"gemini-2.5-pro":        ModelPro,
}

// normalizeModel translates legacy model IDs to supported ones.
func normalizeModel(model string) string {
	if model == "" {
		return ModelFlash
	}
	if m, ok := legacyModels[model]; ok {
		return m
	}
	return model
}

// Client calls the Gemini REST API.
type Client struct {
	APIKey string
	HTTP   *http.Client
}

// New creates a Gemini client.
func New(apiKey string) *Client {
	return &Client{
		APIKey: apiKey,
		HTTP:   &http.Client{Timeout: 120 * time.Second},
	}
}

// Part is one piece of multimodal content.
type Part struct {
	Text       string      `json:"text,omitempty"`
	InlineData *InlineData `json:"inlineData,omitempty"`
}

// InlineData carries base64-encoded media.
type InlineData struct {
	MimeType string `json:"mimeType"`
	Data     string `json:"data"` // base64
}

// Content is a single conversation turn.
type Content struct {
	Role  string `json:"role,omitempty"` // "user" | "model"
	Parts []Part `json:"parts"`
}

// GenerateRequest is the generateContent request body.
type GenerateRequest struct {
	Contents          []Content         `json:"contents"`
	SystemInstruction *Content          `json:"systemInstruction,omitempty"`
	GenerationConfig  *GenerationConfig `json:"generationConfig,omitempty"`
}

// GenerationConfig tunes the model output.
type GenerationConfig struct {
	Temperature      *float64        `json:"temperature,omitempty"`
	MaxOutputTokens  int             `json:"maxOutputTokens,omitempty"`
	ResponseMimeType string          `json:"responseMimeType,omitempty"` // "application/json" for structured output
	ThinkingConfig   *ThinkingConfig `json:"thinkingConfig,omitempty"`
}

// ThinkingConfig controls the "thinking" budget of Gemini 2.5+/3.x models.
// Setting ThinkingBudget to 0 disables thinking entirely — this makes
// structured (JSON) extraction faster, cheaper, and markedly more reliable,
// because thinking tokens otherwise compete with the output for the token
// budget and destabilise large JSON responses.
type ThinkingConfig struct {
	// ThinkingBudget is the max thinking tokens. 0 disables thinking.
	// No omitempty: budget 0 MUST be serialised to actually disable it.
	ThinkingBudget int `json:"thinkingBudget"`
}

// NoThinking is a reusable config value that disables model thinking.
var NoThinking = &ThinkingConfig{ThinkingBudget: 0}

type generateResponse struct {
	Candidates []struct {
		Content struct {
			Parts []struct {
				Text string `json:"text"`
			} `json:"parts"`
		} `json:"content"`
	} `json:"candidates"`
	Error *struct {
		Code    int    `json:"code"`
		Message string `json:"message"`
	} `json:"error"`
}

// Generate calls generateContent on the given model and returns the first candidate text.
func (c *Client) Generate(ctx context.Context, model string, req GenerateRequest) (string, error) {
	model = normalizeModel(model)
	if c.APIKey == "" {
		return "", fmt.Errorf("gemini: API key not configured")
	}
	body, err := json.Marshal(req)
	if err != nil {
		return "", fmt.Errorf("gemini: marshal request: %w", err)
	}
	url := fmt.Sprintf("%s/%s:generateContent?key=%s", baseURL, model, c.APIKey)
	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(body))
	if err != nil {
		return "", err
	}
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := c.HTTP.Do(httpReq)
	if err != nil {
		return "", fmt.Errorf("gemini: request failed: %w", err)
	}
	defer resp.Body.Close()

	raw, err := io.ReadAll(io.LimitReader(resp.Body, 10<<20))
	if err != nil {
		return "", err
	}
	var out generateResponse
	if err := json.Unmarshal(raw, &out); err != nil {
		return "", fmt.Errorf("gemini: decode response (status %d): %w", resp.StatusCode, err)
	}
	if out.Error != nil {
		return "", fmt.Errorf("gemini: API error %d: %s", out.Error.Code, out.Error.Message)
	}
	if len(out.Candidates) == 0 || len(out.Candidates[0].Content.Parts) == 0 {
		return "", fmt.Errorf("gemini: empty response (status %d)", resp.StatusCode)
	}
	var text string
	for _, p := range out.Candidates[0].Content.Parts {
		text += p.Text
	}
	return text, nil
}

// GenerateText is a convenience wrapper for a single-prompt text generation.
func (c *Client) GenerateText(ctx context.Context, model, system, prompt string) (string, error) {
	req := GenerateRequest{
		Contents: []Content{{Role: "user", Parts: []Part{{Text: prompt}}}},
	}
	if system != "" {
		req.SystemInstruction = &Content{Parts: []Part{{Text: system}}}
	}
	return c.Generate(ctx, model, req)
}
