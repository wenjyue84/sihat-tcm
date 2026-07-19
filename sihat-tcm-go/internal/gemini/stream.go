package gemini

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
)

// GenerateStream calls streamGenerateContent (SSE) and invokes onText for each
// text chunk. Returns the full concatenated text.
func (c *Client) GenerateStream(ctx context.Context, model string, req GenerateRequest, onText func(string)) (string, error) {
	model = normalizeModel(model)
	if c.APIKey == "" {
		return "", fmt.Errorf("gemini: API key not configured")
	}
	body, err := json.Marshal(req)
	if err != nil {
		return "", err
	}
	url := fmt.Sprintf("%s/%s:streamGenerateContent?alt=sse&key=%s", baseURL, model, c.APIKey)
	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(body))
	if err != nil {
		return "", err
	}
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := c.HTTP.Do(httpReq)
	if err != nil {
		return "", fmt.Errorf("gemini: stream request failed: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		var buf bytes.Buffer
		_, _ = buf.ReadFrom(resp.Body)
		return "", fmt.Errorf("gemini: stream status %d: %s", resp.StatusCode, truncateStr(buf.String(), 300))
	}

	var full strings.Builder
	scanner := bufio.NewScanner(resp.Body)
	scanner.Buffer(make([]byte, 0, 64*1024), 4*1024*1024)
	for scanner.Scan() {
		line := scanner.Text()
		if !strings.HasPrefix(line, "data: ") {
			continue
		}
		payload := strings.TrimPrefix(line, "data: ")
		if payload == "[DONE]" {
			break
		}
		var chunk generateResponse
		if err := json.Unmarshal([]byte(payload), &chunk); err != nil {
			continue
		}
		for _, cand := range chunk.Candidates {
			for _, p := range cand.Content.Parts {
				if p.Text != "" {
					full.WriteString(p.Text)
					if onText != nil {
						onText(p.Text)
					}
				}
			}
		}
	}
	if err := scanner.Err(); err != nil {
		return full.String(), fmt.Errorf("gemini: stream read: %w", err)
	}
	return full.String(), nil
}

// GenerateWithFallback tries each model in order until one succeeds.
// Returns the text and the model that was used.
func (c *Client) GenerateWithFallback(ctx context.Context, models []string, req GenerateRequest) (string, string, error) {
	var lastErr error
	for _, m := range models {
		text, err := c.Generate(ctx, m, req)
		if err == nil && strings.TrimSpace(text) != "" {
			return text, m, nil
		}
		lastErr = err
	}
	if lastErr == nil {
		lastErr = fmt.Errorf("gemini: all models returned empty output")
	}
	return "", "", lastErr
}

// StreamWithFallback tries each model in order for streaming until one succeeds.
func (c *Client) StreamWithFallback(ctx context.Context, models []string, req GenerateRequest, onText func(string)) (string, string, error) {
	var lastErr error
	for _, m := range models {
		text, err := c.GenerateStream(ctx, m, req, onText)
		if err == nil {
			return text, m, nil
		}
		lastErr = err
	}
	return "", "", lastErr
}

func truncateStr(s string, n int) string {
	if len(s) <= n {
		return s
	}
	return s[:n] + "…"
}
