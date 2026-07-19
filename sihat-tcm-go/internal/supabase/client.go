// Package supabase is a minimal REST client for Supabase (GoTrue auth + PostgREST).
package supabase

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"time"
)

// Client talks to a Supabase project over REST.
type Client struct {
	BaseURL    string // https://<ref>.supabase.co
	AnonKey    string
	ServiceKey string // optional
	HTTP       *http.Client
}

// New creates a Supabase client.
func New(baseURL, anonKey, serviceKey string) *Client {
	return &Client{
		BaseURL:    baseURL,
		AnonKey:    anonKey,
		ServiceKey: serviceKey,
		HTTP:       &http.Client{Timeout: 30 * time.Second},
	}
}

// Configured reports whether the client has enough config to operate.
func (c *Client) Configured() bool { return c.BaseURL != "" && c.AnonKey != "" }

// ---- Auth (GoTrue) ----

// Session is the GoTrue token response.
type Session struct {
	AccessToken  string          `json:"access_token"`
	RefreshToken string          `json:"refresh_token"`
	ExpiresIn    int             `json:"expires_in"`
	User         json.RawMessage `json:"user"`
	ErrorCode    string          `json:"error_code,omitempty"`
	Msg          string          `json:"msg,omitempty"`
	ErrorDesc    string          `json:"error_description,omitempty"`
}

// SignInPassword performs email+password sign-in.
func (c *Client) SignInPassword(ctx context.Context, email, password string) (*Session, error) {
	body := map[string]string{"email": email, "password": password}
	var out Session
	if err := c.doJSON(ctx, http.MethodPost, "/auth/v1/token?grant_type=password", c.AnonKey, "", body, &out); err != nil {
		return nil, err
	}
	if out.AccessToken == "" {
		msg := out.Msg
		if msg == "" {
			msg = out.ErrorDesc
		}
		if msg == "" {
			msg = "invalid credentials"
		}
		return nil, fmt.Errorf("supabase auth: %s", msg)
	}
	return &out, nil
}

// SignUp registers a new email+password user.
func (c *Client) SignUp(ctx context.Context, email, password string, meta map[string]any) (*Session, error) {
	body := map[string]any{"email": email, "password": password}
	if meta != nil {
		body["data"] = meta
	}
	var out Session
	if err := c.doJSON(ctx, http.MethodPost, "/auth/v1/signup", c.AnonKey, "", body, &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// GetUser fetches the user for an access token (session validation).
func (c *Client) GetUser(ctx context.Context, accessToken string) (json.RawMessage, error) {
	var out json.RawMessage
	if err := c.doJSON(ctx, http.MethodGet, "/auth/v1/user", c.AnonKey, accessToken, nil, &out); err != nil {
		return nil, err
	}
	return out, nil
}

// RequestPasswordReset triggers a password-recovery email via GoTrue /recover.
// redirectTo, if non-empty, is where the emailed link should land (must be in
// the project's redirect allowlist). GoTrue returns 200 even for unknown emails.
func (c *Client) RequestPasswordReset(ctx context.Context, email, redirectTo string) error {
	path := "/auth/v1/recover"
	if redirectTo != "" {
		path += "?redirect_to=" + url.QueryEscape(redirectTo)
	}
	body := map[string]string{"email": email}
	return c.doJSON(ctx, http.MethodPost, path, c.AnonKey, "", body, nil)
}

// VerifyRecovery exchanges a recovery token_hash (from the emailed link) for a
// short-lived session via GoTrue /verify.
func (c *Client) VerifyRecovery(ctx context.Context, tokenHash string) (*Session, error) {
	body := map[string]string{"type": "recovery", "token_hash": tokenHash}
	var out Session
	if err := c.doJSON(ctx, http.MethodPost, "/auth/v1/verify", c.AnonKey, "", body, &out); err != nil {
		return nil, err
	}
	if out.AccessToken == "" {
		msg := out.Msg
		if msg == "" {
			msg = out.ErrorDesc
		}
		if msg == "" {
			msg = "invalid or expired recovery token"
		}
		return nil, fmt.Errorf("supabase verify: %s", msg)
	}
	return &out, nil
}

// UpdatePassword sets a new password for the user identified by accessToken
// (typically the session returned by VerifyRecovery) via GoTrue PUT /user.
func (c *Client) UpdatePassword(ctx context.Context, accessToken, newPassword string) error {
	body := map[string]string{"password": newPassword}
	return c.doJSON(ctx, http.MethodPut, "/auth/v1/user", c.AnonKey, accessToken, body, nil)
}

// ---- PostgREST ----

// Select queries table rows. filters are raw PostgREST query params (e.g. "id=eq.123").
// If userToken is empty the service key (or anon key) is used.
func (c *Client) Select(ctx context.Context, table, query, userToken string, out any) error {
	path := "/rest/v1/" + url.PathEscape(table)
	if query != "" {
		path += "?" + query
	}
	return c.doJSON(ctx, http.MethodGet, path, c.apiKey(), c.bearer(userToken), nil, out)
}

// Insert inserts rows (body may be an object or array) and returns the created rows.
func (c *Client) Insert(ctx context.Context, table string, body any, userToken string, out any) error {
	path := "/rest/v1/" + url.PathEscape(table)
	return c.doJSONHeaders(ctx, http.MethodPost, path, c.apiKey(), c.bearer(userToken), body, out,
		map[string]string{"Prefer": "return=representation"})
}

// Upsert inserts or updates rows on primary-key conflict (merge-duplicates).
// Useful when a DB trigger may have already created the row (e.g. profiles).
func (c *Client) Upsert(ctx context.Context, table string, body any, userToken string, out any) error {
	path := "/rest/v1/" + url.PathEscape(table)
	return c.doJSONHeaders(ctx, http.MethodPost, path, c.apiKey(), c.bearer(userToken), body, out,
		map[string]string{"Prefer": "resolution=merge-duplicates,return=representation"})
}

// Update patches rows matching the PostgREST filter query.
func (c *Client) Update(ctx context.Context, table, query string, body any, userToken string, out any) error {
	path := "/rest/v1/" + url.PathEscape(table) + "?" + query
	return c.doJSONHeaders(ctx, http.MethodPatch, path, c.apiKey(), c.bearer(userToken), body, out,
		map[string]string{"Prefer": "return=representation"})
}

// Delete removes rows matching the PostgREST filter query.
func (c *Client) Delete(ctx context.Context, table, query, userToken string) error {
	path := "/rest/v1/" + url.PathEscape(table) + "?" + query
	return c.doJSON(ctx, http.MethodDelete, path, c.apiKey(), c.bearer(userToken), nil, nil)
}

func (c *Client) apiKey() string {
	if c.ServiceKey != "" {
		return c.ServiceKey
	}
	return c.AnonKey
}

func (c *Client) bearer(userToken string) string {
	if userToken != "" {
		return userToken
	}
	return c.apiKey()
}

// ---- HTTP plumbing ----

func (c *Client) doJSON(ctx context.Context, method, path, apiKey, bearer string, body, out any) error {
	return c.doJSONHeaders(ctx, method, path, apiKey, bearer, body, out, nil)
}

func (c *Client) doJSONHeaders(ctx context.Context, method, path, apiKey, bearer string, body, out any, extra map[string]string) error {
	if !c.Configured() {
		return fmt.Errorf("supabase: not configured")
	}
	var reader io.Reader
	if body != nil {
		b, err := json.Marshal(body)
		if err != nil {
			return err
		}
		reader = bytes.NewReader(b)
	}
	req, err := http.NewRequestWithContext(ctx, method, c.BaseURL+path, reader)
	if err != nil {
		return err
	}
	req.Header.Set("apikey", apiKey)
	if bearer != "" {
		req.Header.Set("Authorization", "Bearer "+bearer)
	}
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	for k, v := range extra {
		req.Header.Set(k, v)
	}
	resp, err := c.HTTP.Do(req)
	if err != nil {
		return fmt.Errorf("supabase: %w", err)
	}
	defer resp.Body.Close()
	raw, err := io.ReadAll(io.LimitReader(resp.Body, 10<<20))
	if err != nil {
		return err
	}
	if resp.StatusCode >= 400 {
		return fmt.Errorf("supabase: %s %s → %d: %s", method, path, resp.StatusCode, truncate(string(raw), 300))
	}
	if out != nil && len(raw) > 0 {
		if err := json.Unmarshal(raw, out); err != nil {
			return fmt.Errorf("supabase: decode: %w", err)
		}
	}
	return nil
}

func truncate(s string, n int) string {
	if len(s) <= n {
		return s
	}
	return s[:n] + "…"
}
