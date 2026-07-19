package server

import (
	"context"
	"encoding/json"
	"net"
	"net/http"
	"strings"
	"sync"
	"time"
)

// AuthUser is the authenticated Supabase user plus their profile role.
type AuthUser struct {
	ID    string `json:"id"`
	Email string `json:"email"`
	Role  string `json:"role"` // from profiles table: patient | doctor | admin | developer
	Token string `json:"-"`    // the raw access token (for RLS-scoped queries)
}

// BearerToken extracts the Supabase access token from the Authorization header
// or the sb-access-token cookie.
func BearerToken(r *http.Request) string {
	if h := r.Header.Get("Authorization"); strings.HasPrefix(h, "Bearer ") {
		return strings.TrimPrefix(h, "Bearer ")
	}
	if c, err := r.Cookie("sb-access-token"); err == nil && c.Value != "" {
		return c.Value
	}
	return ""
}

// Authenticate validates the request's token against Supabase GoTrue and loads
// the profile role. Returns nil if unauthenticated.
func (s *Server) Authenticate(r *http.Request) *AuthUser {
	token := BearerToken(r)
	if token == "" || !s.DB.Configured() {
		return nil
	}
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()
	raw, err := s.DB.GetUser(ctx, token)
	if err != nil {
		return nil
	}
	var u struct {
		ID    string `json:"id"`
		Email string `json:"email"`
	}
	if err := json.Unmarshal(raw, &u); err != nil || u.ID == "" {
		return nil
	}
	user := &AuthUser{ID: u.ID, Email: u.Email, Token: token, Role: "patient"}
	var profiles []struct {
		Role string `json:"role"`
	}
	if err := s.DB.Select(ctx, "profiles", "select=role&id=eq."+u.ID, "", &profiles); err == nil && len(profiles) > 0 && profiles[0].Role != "" {
		user.Role = profiles[0].Role
	}
	return user
}

// RequireAuth wraps a handler, rejecting unauthenticated requests. If roles are
// given, the user's role must be one of them.
func (s *Server) RequireAuth(next func(http.ResponseWriter, *http.Request, *AuthUser), roles ...string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		user := s.Authenticate(r)
		if user == nil {
			s.JSONError(w, http.StatusUnauthorized, "authentication required")
			return
		}
		if len(roles) > 0 {
			ok := false
			for _, role := range roles {
				if user.Role == role {
					ok = true
					break
				}
			}
			if !ok {
				s.JSONError(w, http.StatusForbidden, "insufficient permissions")
				return
			}
		}
		next(w, r, user)
	}
}

// ---- Rate limiting (in-memory, single instance — mirrors src/proxy.ts) ----

type rateWindow struct {
	minuteStart time.Time
	minuteCount int
	dayStart    time.Time
	dayCount    int
}

var (
	rateMu  sync.Mutex
	rateMap = map[string]*rateWindow{}
)

// RateLimit wraps a handler with per-IP, per-endpoint limits (perMinute, perDay).
// The window is keyed by IP + request path so each endpoint has its OWN counter —
// otherwise a burst on one endpoint (e.g. several logins) would exhaust the much
// smaller budget of another (e.g. forgot-password at 3/min) and 429 it.
func (s *Server) RateLimit(perMinute, perDay int, next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		key := clientIP(r) + "|" + r.URL.Path
		now := time.Now()
		rateMu.Lock()
		win, ok := rateMap[key]
		if !ok {
			win = &rateWindow{minuteStart: now, dayStart: now}
			rateMap[key] = win
		}
		if now.Sub(win.minuteStart) >= time.Minute {
			win.minuteStart, win.minuteCount = now, 0
		}
		if now.Sub(win.dayStart) >= 24*time.Hour {
			win.dayStart, win.dayCount = now, 0
		}
		win.minuteCount++
		win.dayCount++
		exceeded := win.minuteCount > perMinute || win.dayCount > perDay
		rateMu.Unlock()
		if exceeded {
			w.Header().Set("Retry-After", "60")
			s.JSONError(w, http.StatusTooManyRequests, "rate limit exceeded")
			return
		}
		next(w, r)
	}
}

func clientIP(r *http.Request) string {
	if xf := r.Header.Get("X-Forwarded-For"); xf != "" {
		return strings.TrimSpace(strings.Split(xf, ",")[0])
	}
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return host
}
