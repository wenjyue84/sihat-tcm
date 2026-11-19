package server

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"sihattcm/internal/supabase"
)

// TAuthDecodeErr decodes {"error": "..."} from a recorder body.
func TAuthDecodeErr(t *testing.T, rec *httptest.ResponseRecorder) string {
	t.Helper()
	var m map[string]string
	if err := json.Unmarshal(rec.Body.Bytes(), &m); err != nil {
		t.Fatalf("body is not JSON error object: %q (%v)", rec.Body.String(), err)
	}
	return m["error"]
}

// TAuthFakeSupabase serves GoTrue /auth/v1/user and PostgREST profiles.
// tokens maps access token -> role ("" means no profile row). Unknown tokens 401.
func TAuthFakeSupabase(t *testing.T, tokens map[string]string) *Server {
	t.Helper()
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case r.URL.Path == "/auth/v1/user":
			tok := strings.TrimPrefix(r.Header.Get("Authorization"), "Bearer ")
			if _, ok := tokens[tok]; !ok {
				w.WriteHeader(http.StatusUnauthorized)
				_, _ = w.Write([]byte(`{"msg":"bad jwt"}`))
				return
			}
			_, _ = w.Write([]byte(`{"id":"uid-` + tok + `","email":"` + tok + `@x.test"}`))
		case strings.HasPrefix(r.URL.Path, "/rest/v1/profiles"):
			id := strings.TrimPrefix(r.URL.Query().Get("id"), "eq.")
			role := tokens[strings.TrimPrefix(id, "uid-")]
			if role == "" {
				_, _ = w.Write([]byte(`[]`))
				return
			}
			_, _ = w.Write([]byte(`[{"role":"` + role + `"}]`))
		default:
			w.WriteHeader(http.StatusNotFound)
		}
	}))
	t.Cleanup(ts.Close)
	return &Server{DB: supabase.New(ts.URL, "anon", "")}
}

func TestTAuthBearerToken(t *testing.T) {
	cases := []struct {
		name   string
		header string
		cookie string
		want   string
	}{
		{"none", "", "", ""},
		{"bearer header", "Bearer abc.def", "", "abc.def"},
		{"cookie only", "", "cookieTok", "cookieTok"},
		{"header wins over cookie", "Bearer hdr", "cookieTok", "hdr"},
		{"basic scheme falls back to cookie", "Basic xyz", "cookieTok", "cookieTok"},
		{"basic scheme no cookie", "Basic xyz", "", ""},
		{"lowercase bearer not accepted", "bearer abc", "", ""},
		{"bearer without space", "Bearerabc", "", ""},
		{"bare Bearer prefix with space yields empty", "Bearer ", "", ""},
		{"empty bearer falls through? (returns empty, no cookie fallback)", "Bearer ", "cookieTok", ""},
		{"token keeps inner spaces", "Bearer a b", "", "a b"},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			r := httptest.NewRequest(http.MethodGet, "/x", nil)
			if tc.header != "" {
				r.Header.Set("Authorization", tc.header)
			}
			if tc.cookie != "" {
				r.AddCookie(&http.Cookie{Name: "sb-access-token", Value: tc.cookie})
			}
			if got := BearerToken(r); got != tc.want {
				t.Errorf("BearerToken = %q, want %q", got, tc.want)
			}
		})
	}
}

func TestTAuthBearerTokenIgnoresOtherCookies(t *testing.T) {
	r := httptest.NewRequest(http.MethodGet, "/x", nil)
	r.AddCookie(&http.Cookie{Name: "sb-refresh-token", Value: "nope"})
	r.AddCookie(&http.Cookie{Name: "sb-access-token", Value: ""})
	if got := BearerToken(r); got != "" {
		t.Errorf("got %q, want empty", got)
	}
}

func TestTAuthClientIP(t *testing.T) {
	cases := []struct {
		name       string
		xff        string
		cf         string
		xrip       string
		remoteAddr string
		want       string
	}{
		{"remote addr host:port", "", "", "", "10.0.0.1:5555", "10.0.0.1"},
		{"remote addr ipv6", "", "", "", "[::1]:8080", "::1"},
		{"remote addr without port returned verbatim", "", "", "", "weird", "weird"},
		// trusted peer (loopback/private): last XFF entry = the one nginx appended
		{"xff single", "203.0.113.9", "", "", "127.0.0.1:1", "203.0.113.9"},
		{"xff list uses LAST entry", "203.0.113.9, 70.41.3.18, 150.172.238.178", "", "", "127.0.0.1:1", "150.172.238.178"},
		{"xff trims spaces", "1.1.1.1,  198.51.100.7  ", "", "", "10.0.0.1:1", "198.51.100.7"},
		{"xff spoofed prefix ignored", "6.6.6.6, 7.7.7.7, 198.51.100.7", "", "", "172.16.0.9:1", "198.51.100.7"},
		{"xff garbage last entry falls back to peer", "198.51.100.7, not-an-ip", "", "", "127.0.0.1:1", "127.0.0.1"},
		{"link-local peer trusted", "198.51.100.7", "", "", "169.254.1.1:1", "198.51.100.7"},
		{"ipv6 loopback peer trusted", "198.51.100.7", "", "", "[::1]:9", "198.51.100.7"},
		{"cf-connecting-ip beats xff", "6.6.6.6", "203.0.113.50", "", "127.0.0.1:1", "203.0.113.50"},
		{"invalid cf-connecting-ip ignored", "198.51.100.7", "evil", "", "127.0.0.1:1", "198.51.100.7"},
		{"x-real-ip never consulted", "", "", "192.0.2.5", "127.0.0.1:1", "127.0.0.1"},
		// public peer: it IS the client, every forwarding header is attacker-controlled
		{"public peer ignores xff", "6.6.6.6", "", "", "198.51.100.77:1", "198.51.100.77"},
		{"public peer ignores cf-connecting-ip", "6.6.6.6", "7.7.7.7", "8.8.8.8", "198.51.100.77:1", "198.51.100.77"},
		{"no headers on trusted peer", "", "", "", "127.0.0.1:1", "127.0.0.1"},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			r := httptest.NewRequest(http.MethodGet, "/x", nil)
			r.RemoteAddr = tc.remoteAddr
			if tc.xff != "" {
				r.Header.Set("X-Forwarded-For", tc.xff)
			}
			if tc.cf != "" {
				r.Header.Set("CF-Connecting-IP", tc.cf)
			}
			if tc.xrip != "" {
				r.Header.Set("X-Real-IP", tc.xrip)
			}
			if got := clientIP(r); got != tc.want {
				t.Errorf("clientIP = %q, want %q", got, tc.want)
			}
		})
	}
}

func TestTAuthJSON(t *testing.T) {
	s := &Server{}
	cases := []struct {
		name   string
		status int
		v      any
		body   string
	}{
		{"ok map", http.StatusOK, map[string]int{"a": 1}, `{"a":1}`},
		{"created struct", http.StatusCreated, struct {
			N string `json:"n"`
		}{"x"}, `{"n":"x"}`},
		{"nil value", http.StatusOK, nil, `null`},
		{"slice", http.StatusAccepted, []string{"a", "b"}, `["a","b"]`},
		{"html is escaped by default encoder", http.StatusOK, "<b>", "\"\\u003cb\\u003e\""},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			rec := httptest.NewRecorder()
			s.JSON(rec, tc.status, tc.v)
			if rec.Code != tc.status {
				t.Errorf("status = %d, want %d", rec.Code, tc.status)
			}
			if ct := rec.Header().Get("Content-Type"); ct != "application/json; charset=utf-8" {
				t.Errorf("content-type = %q", ct)
			}
			if got := strings.TrimSpace(rec.Body.String()); got != tc.body {
				t.Errorf("body = %q, want %q", got, tc.body)
			}
		})
	}
}

func TestTAuthJSONUnencodableDoesNotPanic(t *testing.T) {
	s := &Server{}
	rec := httptest.NewRecorder()
	s.JSON(rec, http.StatusOK, map[string]any{"c": make(chan int)})
	if rec.Code != http.StatusOK {
		t.Errorf("status = %d, want header already written as 200", rec.Code)
	}
}

func TestTAuthJSONError(t *testing.T) {
	s := &Server{}
	for _, tc := range []struct {
		status int
		msg    string
	}{
		{http.StatusBadRequest, "bad"},
		{http.StatusUnauthorized, "authentication required"},
		{http.StatusInternalServerError, ""},
		{http.StatusTooManyRequests, `quote " and 中文`},
	} {
		t.Run(http.StatusText(tc.status), func(t *testing.T) {
			rec := httptest.NewRecorder()
			s.JSONError(rec, tc.status, tc.msg)
			if rec.Code != tc.status {
				t.Errorf("status = %d, want %d", rec.Code, tc.status)
			}
			if got := TAuthDecodeErr(t, rec); got != tc.msg {
				t.Errorf("error = %q, want %q", got, tc.msg)
			}
		})
	}
}

func TestTAuthWithSecurityHeaders(t *testing.T) {
	called := false
	h := withSecurityHeaders(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		called = true
		w.WriteHeader(http.StatusTeapot)
	}))
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/", nil))
	if !called {
		t.Fatal("next not called")
	}
	if rec.Code != http.StatusTeapot {
		t.Errorf("status = %d", rec.Code)
	}
	want := map[string]string{
		"X-Content-Type-Options": "nosniff",
		"X-Frame-Options":        "DENY",
		"Referrer-Policy":        "strict-origin-when-cross-origin",
	}
	for k, v := range want {
		if got := rec.Header().Get(k); got != v {
			t.Errorf("header %s = %q, want %q", k, got, v)
		}
	}
}

func TestTAuthWithSecurityHeadersPresentOnErrorPaths(t *testing.T) {
	h := withSecurityHeaders(http.NotFoundHandler())
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, httptest.NewRequest(http.MethodPost, "/missing", nil))
	if rec.Code != http.StatusNotFound {
		t.Errorf("status = %d", rec.Code)
	}
	if rec.Header().Get("X-Frame-Options") != "DENY" {
		t.Error("security headers missing on 404")
	}
}

func TestTAuthWithLoggingPassthrough(t *testing.T) {
	h := withLogging(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-Seen", r.Method+" "+r.URL.Path)
		w.WriteHeader(http.StatusCreated)
		_, _ = w.Write([]byte("body"))
	}))
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, httptest.NewRequest(http.MethodPut, "/a/b", nil))
	if rec.Code != http.StatusCreated || rec.Body.String() != "body" {
		t.Errorf("got %d %q", rec.Code, rec.Body.String())
	}
	if rec.Header().Get("X-Seen") != "PUT /a/b" {
		t.Errorf("X-Seen = %q", rec.Header().Get("X-Seen"))
	}
}

func TestTAuthHandlerChainAppliesMiddleware(t *testing.T) {
	s := &Server{Mux: http.NewServeMux()}
	s.Mux.HandleFunc("/ping", func(w http.ResponseWriter, r *http.Request) {
		s.JSON(w, http.StatusOK, map[string]bool{"ok": true})
	})
	rec := httptest.NewRecorder()
	s.Handler().ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/ping", nil))
	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d", rec.Code)
	}
	if rec.Header().Get("X-Content-Type-Options") != "nosniff" {
		t.Error("Handler() lacks security headers")
	}
	rec = httptest.NewRecorder()
	s.Handler().ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/nope", nil))
	if rec.Code != http.StatusNotFound {
		t.Errorf("unknown route status = %d", rec.Code)
	}
}

func TestTAuthRequireAuthNoToken(t *testing.T) {
	s := &Server{DB: supabase.New("http://127.0.0.1:1", "anon", "")}
	called := false
	h := s.RequireAuth(func(w http.ResponseWriter, r *http.Request, u *AuthUser) { called = true })
	rec := httptest.NewRecorder()
	h(rec, httptest.NewRequest(http.MethodGet, "/x", nil))
	if rec.Code != http.StatusUnauthorized {
		t.Errorf("status = %d, want 401", rec.Code)
	}
	if got := TAuthDecodeErr(t, rec); got != "authentication required" {
		t.Errorf("error = %q", got)
	}
	if called {
		t.Error("handler must not run")
	}
}

func TestTAuthRequireAuthUnconfiguredDB(t *testing.T) {
	// Token present but Supabase not configured -> cannot authenticate -> 401.
	s := &Server{DB: supabase.New("", "", "")}
	h := s.RequireAuth(func(w http.ResponseWriter, r *http.Request, u *AuthUser) {
		t.Error("handler must not run")
	})
	rec := httptest.NewRecorder()
	r := httptest.NewRequest(http.MethodGet, "/x", nil)
	r.Header.Set("Authorization", "Bearer sometoken")
	h(rec, r)
	if rec.Code != http.StatusUnauthorized {
		t.Errorf("status = %d, want 401", rec.Code)
	}
}

func TestTAuthRequireAuthInvalidToken(t *testing.T) {
	s := TAuthFakeSupabase(t, map[string]string{"good": "patient"})
	h := s.RequireAuth(func(w http.ResponseWriter, r *http.Request, u *AuthUser) {
		t.Error("handler must not run")
	})
	for _, tc := range []struct {
		name string
		set  func(*http.Request)
	}{
		{"bad bearer", func(r *http.Request) { r.Header.Set("Authorization", "Bearer nope") }},
		{"bad cookie", func(r *http.Request) { r.AddCookie(&http.Cookie{Name: "sb-access-token", Value: "nope"}) }},
	} {
		t.Run(tc.name, func(t *testing.T) {
			rec := httptest.NewRecorder()
			r := httptest.NewRequest(http.MethodGet, "/x", nil)
			tc.set(r)
			h(rec, r)
			if rec.Code != http.StatusUnauthorized {
				t.Errorf("status = %d, want 401", rec.Code)
			}
		})
	}
}

func TestTAuthRequireAuthRoleGating(t *testing.T) {
	s := TAuthFakeSupabase(t, map[string]string{
		"pat":    "patient",
		"doc":    "doctor",
		"adm":    "admin",
		"noprof": "", // no profile row -> defaults to patient
	})
	cases := []struct {
		name  string
		token string
		roles []string
		want  int
	}{
		{"no roles any authed user", "pat", nil, http.StatusOK},
		{"patient allowed", "pat", []string{"patient"}, http.StatusOK},
		{"patient denied doctor-only", "pat", []string{"doctor"}, http.StatusForbidden},
		{"patient denied admin/doctor", "pat", []string{"admin", "doctor"}, http.StatusForbidden},
		{"doctor allowed in list", "doc", []string{"admin", "doctor"}, http.StatusOK},
		{"admin allowed", "adm", []string{"admin"}, http.StatusOK},
		{"admin not implicitly superuser", "adm", []string{"doctor"}, http.StatusForbidden},
		{"missing profile defaults to patient allowed", "noprof", []string{"patient"}, http.StatusOK},
		{"missing profile denied for doctor", "noprof", []string{"doctor"}, http.StatusForbidden},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			var got *AuthUser
			h := s.RequireAuth(func(w http.ResponseWriter, r *http.Request, u *AuthUser) {
				got = u
				s.JSON(w, http.StatusOK, map[string]string{"id": u.ID})
			}, tc.roles...)
			rec := httptest.NewRecorder()
			r := httptest.NewRequest(http.MethodGet, "/x", nil)
			r.Header.Set("Authorization", "Bearer "+tc.token)
			h(rec, r)
			if rec.Code != tc.want {
				t.Fatalf("status = %d, want %d (body %s)", rec.Code, tc.want, rec.Body.String())
			}
			if tc.want == http.StatusForbidden {
				if e := TAuthDecodeErr(t, rec); e != "insufficient permissions" {
					t.Errorf("error = %q", e)
				}
				if got != nil {
					t.Error("handler must not run on 403")
				}
				return
			}
			if got == nil || got.ID != "uid-"+tc.token || got.Token != tc.token {
				t.Errorf("user = %+v", got)
			}
		})
	}
}

func TestTAuthAuthenticateViaCookieAndEmail(t *testing.T) {
	s := TAuthFakeSupabase(t, map[string]string{"ck": "doctor"})
	r := httptest.NewRequest(http.MethodGet, "/x", nil)
	r.AddCookie(&http.Cookie{Name: "sb-access-token", Value: "ck"})
	u := s.Authenticate(r)
	if u == nil {
		t.Fatal("expected user")
	}
	if u.Email != "ck@x.test" || u.Role != "doctor" || u.Token != "ck" {
		t.Errorf("user = %+v", u)
	}
}

func TestTAuthAuthenticateNilWithoutToken(t *testing.T) {
	s := TAuthFakeSupabase(t, map[string]string{"a": "admin"})
	if u := s.Authenticate(httptest.NewRequest(http.MethodGet, "/x", nil)); u != nil {
		t.Errorf("expected nil, got %+v", u)
	}
}

func TestTAuthAuthUserTokenNotSerialised(t *testing.T) {
	b, err := json.Marshal(AuthUser{ID: "1", Email: "e", Role: "admin", Token: "secret"})
	if err != nil {
		t.Fatal(err)
	}
	if strings.Contains(string(b), "secret") {
		t.Errorf("token leaked in JSON: %s", b)
	}
}

// TAuthRL fires n requests and returns status codes.
func TAuthRL(h http.HandlerFunc, ip, path string, n int) []int {
	out := make([]int, 0, n)
	for i := 0; i < n; i++ {
		rec := httptest.NewRecorder()
		r := httptest.NewRequest(http.MethodPost, path, nil)
		r.RemoteAddr = "127.0.0.1:1"
		r.Header.Set("X-Forwarded-For", ip)
		h(rec, r)
		out = append(out, rec.Code)
	}
	return out
}

func TestTAuthRateLimitPerMinute(t *testing.T) {
	s := &Server{}
	h := s.RateLimit(3, 1000, func(w http.ResponseWriter, r *http.Request) { w.WriteHeader(http.StatusOK) })
	got := TAuthRL(h, "10.200.1.1", "/tauth/min", 5)
	want := []int{200, 200, 200, 429, 429}
	for i := range want {
		if got[i] != want[i] {
			t.Fatalf("codes = %v, want %v", got, want)
		}
	}
}

func TestTAuthRateLimit429Response(t *testing.T) {
	s := &Server{}
	h := s.RateLimit(1, 1000, func(w http.ResponseWriter, r *http.Request) {})
	TAuthRL(h, "10.200.0.29", "/tauth/429", 1)
	rec := httptest.NewRecorder()
	r := httptest.NewRequest(http.MethodPost, "/tauth/429", nil)
	r.RemoteAddr = "127.0.0.1:1"
	r.Header.Set("X-Forwarded-For", "10.200.0.29")
	h(rec, r)
	if rec.Code != http.StatusTooManyRequests {
		t.Fatalf("status = %d", rec.Code)
	}
	if rec.Header().Get("Retry-After") != "60" {
		t.Errorf("Retry-After = %q", rec.Header().Get("Retry-After"))
	}
	if e := TAuthDecodeErr(t, rec); e != "rate limit exceeded" {
		t.Errorf("error = %q", e)
	}
}

func TestTAuthRateLimitBlockedRequestsDoNotReachHandler(t *testing.T) {
	s := &Server{}
	calls := 0
	h := s.RateLimit(2, 1000, func(w http.ResponseWriter, r *http.Request) { calls++ })
	TAuthRL(h, "10.200.1.2", "/tauth/calls", 6)
	if calls != 2 {
		t.Errorf("handler called %d times, want 2", calls)
	}
}

func TestTAuthRateLimitPerIPIsolation(t *testing.T) {
	s := &Server{}
	h := s.RateLimit(1, 1000, func(w http.ResponseWriter, r *http.Request) {})
	a := TAuthRL(h, "10.200.1.3", "/tauth/iso-ip", 2)
	b := TAuthRL(h, "10.200.1.4", "/tauth/iso-ip", 2)
	if a[0] != 200 || a[1] != 429 {
		t.Errorf("A = %v", a)
	}
	if b[0] != 200 || b[1] != 429 {
		t.Errorf("B must have its own budget: %v", b)
	}
}

func TestTAuthRateLimitPerEndpointIsolation(t *testing.T) {
	s := &Server{}
	login := s.RateLimit(5, 1000, func(w http.ResponseWriter, r *http.Request) {})
	forgot := s.RateLimit(1, 1000, func(w http.ResponseWriter, r *http.Request) {})
	// Exhaust "login" for this IP, then forgot-password must still have budget.
	if got := TAuthRL(login, "10.200.1.5", "/tauth/login", 6); got[5] != 429 {
		t.Fatalf("login not limited: %v", got)
	}
	if got := TAuthRL(forgot, "10.200.1.5", "/tauth/forgot", 2); got[0] != 200 || got[1] != 429 {
		t.Errorf("forgot = %v, want [200 429]", got)
	}
}

func TestTAuthRateLimitSharedAcrossHandlersOnSamePath(t *testing.T) {
	// Key is IP+path, so two wrappers on one path share the counter.
	s := &Server{}
	h1 := s.RateLimit(2, 1000, func(w http.ResponseWriter, r *http.Request) {})
	h2 := s.RateLimit(2, 1000, func(w http.ResponseWriter, r *http.Request) {})
	TAuthRL(h1, "10.200.1.6", "/tauth/shared", 2)
	if got := TAuthRL(h2, "10.200.1.6", "/tauth/shared", 1); got[0] != 429 {
		t.Errorf("got %v, want 429", got)
	}
}

func TestTAuthRateLimitPerDay(t *testing.T) {
	s := &Server{}
	h := s.RateLimit(1000, 2, func(w http.ResponseWriter, r *http.Request) {})
	got := TAuthRL(h, "10.200.1.7", "/tauth/day", 4)
	want := []int{200, 200, 429, 429}
	for i := range want {
		if got[i] != want[i] {
			t.Fatalf("codes = %v, want %v", got, want)
		}
	}
}

func TestTAuthRateLimitMinuteWindowResets(t *testing.T) {
	s := &Server{}
	h := s.RateLimit(1, 1000, func(w http.ResponseWriter, r *http.Request) {})
	ip, path := "10.200.1.8", "/tauth/reset"
	if got := TAuthRL(h, ip, path, 2); got[1] != 429 {
		t.Fatalf("expected limit: %v", got)
	}
	key := ip + "|" + path
	rateMu.Lock()
	rateMap[key].minuteStart = time.Now().Add(-61 * time.Second)
	rateMu.Unlock()
	if got := TAuthRL(h, ip, path, 1); got[0] != 200 {
		t.Errorf("after minute rollover got %v, want 200", got)
	}
}

func TestTAuthRateLimitDayWindowResets(t *testing.T) {
	s := &Server{}
	h := s.RateLimit(1000, 1, func(w http.ResponseWriter, r *http.Request) {})
	ip, path := "10.200.1.9", "/tauth/dayreset"
	if got := TAuthRL(h, ip, path, 2); got[1] != 429 {
		t.Fatalf("expected limit: %v", got)
	}
	rateMu.Lock()
	w := rateMap[ip+"|"+path]
	w.dayStart = time.Now().Add(-25 * time.Hour)
	w.minuteStart = time.Now().Add(-2 * time.Minute)
	rateMu.Unlock()
	if got := TAuthRL(h, ip, path, 1); got[0] != 200 {
		t.Errorf("after day rollover got %v, want 200", got)
	}
}

func TestTAuthRateLimitFallsBackToRemoteAddr(t *testing.T) {
	s := &Server{}
	h := s.RateLimit(1, 1000, func(w http.ResponseWriter, r *http.Request) {})
	call := func(remote string) int {
		rec := httptest.NewRecorder()
		r := httptest.NewRequest(http.MethodGet, "/tauth/remote", nil)
		r.RemoteAddr = remote
		h(rec, r)
		return rec.Code
	}
	// Same host, different ports -> same bucket.
	if c := call("192.0.2.77:1111"); c != 200 {
		t.Fatalf("first = %d", c)
	}
	if c := call("192.0.2.77:2222"); c != 429 {
		t.Errorf("same host different port = %d, want 429", c)
	}
	if c := call("192.0.2.78:1111"); c != 200 {
		t.Errorf("different host = %d, want 200", c)
	}
}

// A client rotating the *prefix* of X-Forwarded-For through the proxy must not
// escape its bucket: the proxy-appended last entry is what counts.
func TestTAuthRateLimitIgnoresSpoofedXFFPrefix(t *testing.T) {
	s := &Server{}
	h := s.RateLimit(2, 1000, func(w http.ResponseWriter, r *http.Request) {})
	var codes []int
	for i := 0; i < 4; i++ {
		rec := httptest.NewRecorder()
		r := httptest.NewRequest(http.MethodPost, "/tauth/spoof", nil)
		r.RemoteAddr = "127.0.0.1:1"
		r.Header.Set("X-Forwarded-For", "6.6.6."+string(rune('1'+i))+", 198.51.100.200")
		h(rec, r)
		codes = append(codes, rec.Code)
	}
	if codes[2] != 429 || codes[3] != 429 {
		t.Fatalf("spoofed prefixes escaped the limit: %v", codes)
	}
}

// A direct (public) peer cannot pick its own bucket with forwarding headers.
func TestTAuthRateLimitPublicPeerIgnoresHeaders(t *testing.T) {
	s := &Server{}
	h := s.RateLimit(1, 1000, func(w http.ResponseWriter, r *http.Request) {})
	var codes []int
	for i := 0; i < 3; i++ {
		rec := httptest.NewRecorder()
		r := httptest.NewRequest(http.MethodPost, "/tauth/public", nil)
		r.RemoteAddr = "198.51.100.99:4444"
		r.Header.Set("X-Forwarded-For", "9.9.9."+string(rune('1'+i)))
		r.Header.Set("CF-Connecting-IP", "8.8.8."+string(rune('1'+i)))
		h(rec, r)
		codes = append(codes, rec.Code)
	}
	if codes[1] != 429 || codes[2] != 429 {
		t.Fatalf("public peer rotated headers to escape limit: %v", codes)
	}
}

func TestTAuthIsHTTPS(t *testing.T) {
	cases := []struct {
		proto string
		want  bool
	}{{"", false}, {"http", false}, {"https", true}, {"HTTPS", true}, {"https, http", true}, {"http, https", false}}
	for _, tc := range cases {
		r := httptest.NewRequest(http.MethodGet, "/", nil)
		if tc.proto != "" {
			r.Header.Set("X-Forwarded-Proto", tc.proto)
		}
		if got := isHTTPS(r); got != tc.want {
			t.Errorf("proto %q: got %v want %v", tc.proto, got, tc.want)
		}
	}
}
