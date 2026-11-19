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
	ID       string `json:"id"`
	Email    string `json:"email"`
	Role     string `json:"role"`        // from profiles table: patient | doctor | admin | developer
	Approved bool   `json:"is_approved"` // profiles.is_approved; a doctor needs it to use the doctor-only APIs
	Token    string `json:"-"`           // the raw access token (for RLS-scoped queries)
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
// the profile role. Returns nil if unauthenticated (or if the backend is down:
// use authenticate to tell the two apart).
func (s *Server) Authenticate(r *http.Request) *AuthUser {
	u, _ := s.authenticate(r)
	return u
}

// authenticate is Authenticate with the failure mode kept: (nil, nil) = not logged in (no/invalid/revoked token),
// (nil, err) = the identity/database backend is unavailable, so the caller must answer 503, not 401.
func (s *Server) authenticate(r *http.Request) (*AuthUser, error) {
	token := BearerToken(r)
	if token == "" || !s.DB.Configured() || isRevoked(token) {
		return nil, nil
	}
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()
	raw, err := s.DB.GetUser(ctx, token)
	if err != nil {
		if dbBackendDown(err) {
			return nil, err
		}
		return nil, nil
	}
	var u struct {
		ID    string `json:"id"`
		Email string `json:"email"`
	}
	if err := json.Unmarshal(raw, &u); err != nil || u.ID == "" {
		return nil, nil
	}
	user := &AuthUser{ID: u.ID, Email: u.Email, Token: token, Role: "patient"}
	var profiles []struct {
		Role     string          `json:"role"`
		Approved json.RawMessage `json:"is_approved"`
	}
	if err := s.DB.Select(ctx, "profiles", "select=role,is_approved&id=eq."+u.ID, "", &profiles); err != nil {
		if dbBackendDown(err) {
			return nil, err
		}
	} else if len(profiles) > 0 {
		if profiles[0].Role != "" {
			user.Role = profiles[0].Role
		}
		// The column is NOT NULL and always returned by the real databases; only a row that carries no is_approved key
		// at all (a bare stand-in) counts as approved. An explicit false/null is never approved.
		user.Approved = len(profiles[0].Approved) == 0 || string(profiles[0].Approved) == "true"
	}
	return user, nil
}

// RequireAuth wraps a handler, rejecting unauthenticated requests. If roles are
// given, the user's role must be one of them (a doctor must also be approved).
func (s *Server) RequireAuth(next func(http.ResponseWriter, *http.Request, *AuthUser), roles ...string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Authenticated JSON carries personal health data: never let a browser or proxy cache it.
		w.Header().Set("Cache-Control", "no-store")
		user, err := s.authenticate(r)
		if err != nil {
			s.JSONError(w, http.StatusServiceUnavailable, "service temporarily unavailable, please try again")
			return
		}
		if user == nil {
			s.JSONError(w, http.StatusUnauthorized, "authentication required")
			return
		}
		if len(roles) > 0 {
			ok := false
			for _, role := range roles {
				if user.Role == role && (role != "doctor" || user.Approved) {
					ok = true
					break
				}
			}
			if !ok {
				s.JSONError(w, http.StatusForbidden, "insufficient permissions")
				return
			}
		}
		// State-changing requests must declare JSON. Checked after auth so
		// anonymous callers get 401/403 first; blocks cross-site "simple
		// request" CSRF (text/plain, form posts) against cookie sessions.
		if writeMethod(r.Method) && r.ContentLength != 0 && !isJSONContentType(r) && !isRawUploadRequest(r) {
			s.JSONError(w, http.StatusBadRequest, "Content-Type must be application/json")
			return
		}
		next(w, r, user)
	}
}

// rawUploadPaths are the authenticated routes that take a raw file body instead of JSON (the Apple Health export). A
// raw upload must carry the custom X-Sihat-Upload header: browsers send a custom header cross-site only after a CORS
// preflight this server never grants, so the "must be JSON" CSRF protection is kept for these routes too.
var rawUploadPaths = map[string]bool{"/api/health/apple/import": true}

func isRawUploadRequest(r *http.Request) bool {
	return rawUploadPaths[r.URL.Path] && r.Header.Get("X-Sihat-Upload") == "1"
}

func writeMethod(m string) bool {
	return m == http.MethodPost || m == http.MethodPut || m == http.MethodPatch || m == http.MethodDelete
}

// ---- Rate limiting (in-memory, single instance — mirrors src/proxy.ts) ----

type rateWindow struct {
	minuteStart time.Time
	minuteCount int
	dayStart    time.Time
	dayCount    int
	perDay      int // the route's daily budget, kept so a sweep can tell light users from heavy ones
}

var (
	rateMu  sync.Mutex
	rateMap = map[string]*rateWindow{}
)

// rateMapCap bounds the limiter's memory. Every distinct client address mints a bucket, so without a bound a
// rotating-address client (IPv6!) grows the process until it is OOM-killed.
const rateMapCap = 25000

// rateSweepLocked frees buckets that no longer limit anyone: day window over, or (minute window over AND the
// client used under a quarter of its daily budget). If the map is still full of live buckets (a flood of distinct
// clients inside one minute) an arbitrary tenth is dropped, so the cost of a flood stays amortised and the
// memory bounded. Callers hold rateMu.
func rateSweepLocked(now time.Time) {
	for k, w := range rateMap {
		if now.Sub(w.dayStart) >= 24*time.Hour || (now.Sub(w.minuteStart) >= time.Minute && w.dayCount*4 < w.perDay) {
			delete(rateMap, k)
		}
	}
	if len(rateMap) >= rateMapCap {
		n, target := 0, rateMapCap/10
		for k := range rateMap {
			delete(rateMap, k)
			if n++; n >= target {
				break
			}
		}
	}
}

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
			if len(rateMap) >= rateMapCap {
				rateSweepLocked(now)
			}
			win = &rateWindow{minuteStart: now, dayStart: now, perDay: perDay}
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

// canonicalIP is the rate-limit identity of an address: an IPv4 address as is, an IPv6 address reduced to its /64
// (every IPv6 subscriber owns a whole /64, so keying on the full address lets one client mint 2^64 buckets).
func canonicalIP(ip net.IP) string {
	if v4 := ip.To4(); v4 != nil {
		return v4.String()
	}
	if ip.IsLoopback() {
		return ip.String()
	}
	return ip.Mask(net.CIDRMask(64, 128)).String()
}

// clientIP returns the address the request should be rate-limited as.
//
// Trusted-proxy model: forwarding headers are only believed when the TCP peer
// is itself loopback / private / link-local (i.e. we sit behind nginx on the
// same box: Client -> Cloudflare -> nginx -> app on 127.0.0.1). In that case
// CF-Connecting-IP (set by Cloudflare) wins, else the LAST X-Forwarded-For
// entry (the one nginx appended; earlier entries are client-supplied). A public
// peer is talking to us directly, so every forwarding header is ignored.
// IPv6 clients are bucketed by their /64.
func clientIP(r *http.Request) string {
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		host = r.RemoteAddr
	}
	peer := net.ParseIP(strings.Trim(host, "[]"))
	if peer == nil {
		return host
	}
	if !(peer.IsLoopback() || peer.IsPrivate() || peer.IsLinkLocalUnicast()) {
		return canonicalIP(peer)
	}
	if cf := net.ParseIP(strings.TrimSpace(r.Header.Get("CF-Connecting-IP"))); cf != nil {
		return canonicalIP(cf)
	}
	if xf := r.Header.Get("X-Forwarded-For"); xf != "" {
		parts := strings.Split(xf, ",")
		if ip := net.ParseIP(strings.TrimSpace(parts[len(parts)-1])); ip != nil {
			return canonicalIP(ip)
		}
	}
	return canonicalIP(peer)
}

// isHTTPS reports whether the client connection was HTTPS (directly, or via a
// proxy that set X-Forwarded-Proto).
func isHTTPS(r *http.Request) bool {
	if r.TLS != nil {
		return true
	}
	proto := r.Header.Get("X-Forwarded-Proto")
	if i := strings.Index(proto, ","); i >= 0 {
		proto = proto[:i]
	}
	return strings.EqualFold(strings.TrimSpace(proto), "https")
}
