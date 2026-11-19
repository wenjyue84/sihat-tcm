package server

import (
	"encoding/json"
	"fmt"
	"html/template"
	"io"
	"net/http"
	"net/http/httptest"
	"net/url"
	"reflect"
	"strings"
	"sync"
	"sync/atomic"
	"testing"

	"sihattcm/internal/config"
	"sihattcm/internal/gemini"
	"sihattcm/internal/supabase"
)

var tmiscIPCounter atomic.Int64

// tmiscServer builds a Server whose DB is the given client (nil = unconfigured).
func tmiscServer(t *testing.T, db *supabase.Client) *Server {
	t.Helper()
	if db == nil {
		db = supabase.New("", "", "")
	}
	s := &Server{
		Cfg:  &config.Config{PublicBaseURL: "https://tcm.example.com/", Env: "development"},
		AI:   gemini.New(""),
		DB:   db,
		Tmpl: template.New(""),
		Mux:  http.NewServeMux(),
	}
	s.routes()
	return s
}

// tmiscDo performs a request with a unique client IP so rate limits never trip.
func tmiscDo(s *Server, method, path, body string, hdr map[string]string) *httptest.ResponseRecorder {
	var rd *strings.Reader
	if body != "" {
		rd = strings.NewReader(body)
	} else {
		rd = strings.NewReader("")
	}
	req := httptest.NewRequest(method, path, rd)
	req.RemoteAddr = "127.0.0.1:4000" // behind the proxy: X-Forwarded-For is trusted
	if body != "" {
		req.Header.Set("Content-Type", "application/json")
	}
	req.Header.Set("X-Forwarded-For", fmt.Sprintf("10.9.%d.%d", tmiscIPCounter.Add(1)/250, tmiscIPCounter.Load()%250))
	for k, v := range hdr {
		req.Header.Set(k, v)
	}
	rec := httptest.NewRecorder()
	s.Handler().ServeHTTP(rec, req)
	return rec
}

func tmiscJSON(t *testing.T, rec *httptest.ResponseRecorder) map[string]any {
	t.Helper()
	var m map[string]any
	if err := json.Unmarshal(rec.Body.Bytes(), &m); err != nil {
		t.Fatalf("body not JSON: %q (%v)", rec.Body.String(), err)
	}
	return m
}

// ---- pure helpers ----

func TestTMiscNormalizeSymptoms(t *testing.T) {
	cases := []struct {
		name string
		in   map[string]any
		want any
		has  bool
	}{
		{"absent", map[string]any{}, nil, false},
		{"joined", map[string]any{"symptoms": "headache, fatigue"}, []string{"headache", "fatigue"}, true},
		{"extra commas and spaces", map[string]any{"symptoms": " a ,, b ,"}, []string{"a", "b"}, true},
		{"empty string", map[string]any{"symptoms": ""}, []string{}, true},
		{"only separators", map[string]any{"symptoms": " , ,"}, []string{}, true},
		{"already array", map[string]any{"symptoms": []any{"x"}}, []any{"x"}, true},
		{"non string number", map[string]any{"symptoms": 5}, 5, true},
		{"nil value", map[string]any{"symptoms": nil}, nil, true},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			dtNormalizeSymptoms(c.in)
			got, ok := c.in["symptoms"]
			if ok != c.has {
				t.Fatalf("key presence = %v, want %v", ok, c.has)
			}
			if c.has && !reflect.DeepEqual(got, c.want) {
				t.Fatalf("got %#v want %#v", got, c.want)
			}
		})
	}
}

func TestTMiscOverallStatus(t *testing.T) {
	cases := []struct {
		crit, high int
		db, want   string
	}{
		{0, 0, "healthy", "healthy"},
		{0, 10, "healthy", "healthy"},
		{0, 11, "healthy", "degraded"},
		{1, 0, "healthy", "degraded"},
		{5, 0, "healthy", "degraded"},
		{6, 0, "healthy", "unhealthy"},
		{0, 0, "unhealthy", "unhealthy"},
		{0, 100, "unhealthy", "unhealthy"},
	}
	for _, c := range cases {
		t.Run(fmt.Sprintf("c%d_h%d_%s", c.crit, c.high, c.db), func(t *testing.T) {
			if got := dtOverallStatus(c.crit, c.high, c.db); got != c.want {
				t.Fatalf("got %s want %s", got, c.want)
			}
		})
	}
}

func TestTMiscContainsAny(t *testing.T) {
	cases := []struct {
		s    string
		subs []string
		want bool
	}{
		{"API_KEY_INVALID here", []string{"API_KEY_INVALID"}, true},
		{"quota exceeded", []string{"nope", "quota"}, true},
		{"nothing", []string{"x", "y"}, false},
		{"", []string{"x"}, false},
		{"abc", nil, false},
		{"ab", []string{"abc"}, false},
		{"abc", []string{"abc"}, true},
		{"abc", []string{"c"}, true},
	}
	for i, c := range cases {
		t.Run(fmt.Sprint(i), func(t *testing.T) {
			if got := containsAny(c.s, c.subs...); got != c.want {
				t.Fatalf("containsAny(%q,%v)=%v", c.s, c.subs, got)
			}
		})
	}
}

func TestTMiscRandToken(t *testing.T) {
	a, err := randToken(16)
	if err != nil || len(a) != 32 {
		t.Fatalf("len=%d err=%v", len(a), err)
	}
	b, _ := randToken(16)
	if a == b {
		t.Fatal("tokens should differ")
	}
	for _, r := range a {
		if !strings.ContainsRune("0123456789abcdef", r) {
			t.Fatalf("non-hex rune %q", r)
		}
	}
	z, err := randToken(0)
	if err != nil || z != "" {
		t.Fatalf("zero token = %q err=%v", z, err)
	}
}

func TestTMiscDefaultPreferences(t *testing.T) {
	p := dtDefaultPreferences()
	if p["enabled"] != true || p["frequency_monthly"] != false {
		t.Fatalf("unexpected defaults: %v", p)
	}
	if p["quiet_hours_start"] != "22:00:00" || p["quiet_hours_end"] != "07:00:00" {
		t.Fatal("quiet hours wrong")
	}
	cats, ok := p["categories"].(map[string]bool)
	if !ok || len(cats) != 6 {
		t.Fatalf("categories = %#v", p["categories"])
	}
	for k, v := range cats {
		if !v {
			t.Errorf("category %s should default true", k)
		}
	}
	// must return a fresh map each call
	p["enabled"] = false
	if dtDefaultPreferences()["enabled"] != true {
		t.Fatal("defaults share state")
	}
}

func TestTMiscMapHelpers(t *testing.T) {
	m := map[string]any{"s": "v", "empty": "", "n": 3, "b": true, "bf": "true", "nilv": nil, "obj": map[string]any{"k": 1}}
	if dtStrOr(m, "s", "d") != "v" || dtStrOr(m, "empty", "d") != "d" || dtStrOr(m, "n", "d") != "d" || dtStrOr(m, "missing", "d") != "d" {
		t.Error("dtStrOr")
	}
	if !dtBoolOr(m, "b") || dtBoolOr(m, "bf") || dtBoolOr(m, "missing") {
		t.Error("dtBoolOr")
	}
	if !reflect.DeepEqual(dtMapOr(m, "obj"), map[string]any{"k": 1}) {
		t.Error("dtMapOr present")
	}
	if !reflect.DeepEqual(dtMapOr(m, "nilv"), map[string]any{}) || !reflect.DeepEqual(dtMapOr(m, "missing"), map[string]any{}) {
		t.Error("dtMapOr default")
	}
	if got := dtNilToSlice(nil); got == nil || len(got) != 0 {
		t.Error("dtNilToSlice nil")
	}
	in := []map[string]any{{"a": 1}}
	if got := dtNilToSlice(in); len(got) != 1 {
		t.Error("dtNilToSlice passthrough")
	}
}

func TestTMiscNowISO(t *testing.T) {
	v := dtNowISO()
	if !strings.HasSuffix(v, "Z") || len(v) != len("2006-01-02T15:04:05Z") {
		t.Fatalf("not UTC RFC3339: %s", v)
	}
}

func TestTMiscRedirectByRole(t *testing.T) {
	cases := map[string]string{"doctor": "/doctor", "patient": "/patient", "admin": "/admin", "developer": "/admin", "": "/patient"}
	for role, want := range cases {
		t.Run("role_"+role, func(t *testing.T) {
			rec := httptest.NewRecorder()
			pgRedirectByRole(rec, httptest.NewRequest("GET", "/login", nil), role)
			if rec.Code != http.StatusFound || rec.Header().Get("Location") != want {
				t.Fatalf("code=%d loc=%s", rec.Code, rec.Header().Get("Location"))
			}
		})
	}
}

func TestTMiscBearerToken(t *testing.T) {
	r := httptest.NewRequest("GET", "/", nil)
	if BearerToken(r) != "" {
		t.Error("empty expected")
	}
	r.AddCookie(&http.Cookie{Name: "sb-access-token", Value: "cook"})
	if BearerToken(r) != "cook" {
		t.Error("cookie")
	}
	r.Header.Set("Authorization", "Bearer hdr")
	if BearerToken(r) != "hdr" {
		t.Error("header should win")
	}
	r2 := httptest.NewRequest("GET", "/", nil)
	r2.Header.Set("Authorization", "Basic xyz")
	if BearerToken(r2) != "" {
		t.Error("non-bearer ignored")
	}
}

func TestTMiscClientIP(t *testing.T) {
	r := httptest.NewRequest("GET", "/", nil)
	r.RemoteAddr = "1.2.3.4:5555"
	if clientIP(r) != "1.2.3.4" {
		t.Error("remote addr")
	}
	r.RemoteAddr = "weird"
	if clientIP(r) != "weird" {
		t.Error("unsplittable")
	}
	// trusted (loopback) peer: the LAST X-Forwarded-For entry is the proxy-appended one
	r.RemoteAddr = "127.0.0.1:5555"
	r.Header.Set("X-Forwarded-For", " 9.9.9.9 , 8.8.8.8")
	if clientIP(r) != "8.8.8.8" {
		t.Error("xff last")
	}
}

func TestTMiscRateLimit(t *testing.T) {
	s := tmiscServer(t, nil)
	h := s.RateLimit(2, 100, func(w http.ResponseWriter, r *http.Request) { w.WriteHeader(204) })
	ip := fmt.Sprintf("172.16.%d.1", tmiscIPCounter.Add(1))
	codes := []int{}
	for i := 0; i < 3; i++ {
		req := httptest.NewRequest("GET", "/tmisc-rl", nil)
		req.RemoteAddr = "127.0.0.1:1"
		req.Header.Set("X-Forwarded-For", ip)
		rec := httptest.NewRecorder()
		h(rec, req)
		codes = append(codes, rec.Code)
		if i == 2 && rec.Header().Get("Retry-After") != "60" {
			t.Error("Retry-After missing")
		}
	}
	if !reflect.DeepEqual(codes, []int{204, 204, 429}) {
		t.Fatalf("codes=%v", codes)
	}
	// daily limit
	h2 := s.RateLimit(100, 1, func(w http.ResponseWriter, r *http.Request) { w.WriteHeader(204) })
	ip2 := fmt.Sprintf("172.17.%d.1", tmiscIPCounter.Add(1))
	for i, want := range []int{204, 429} {
		req := httptest.NewRequest("GET", "/tmisc-rl2", nil)
		req.RemoteAddr = "127.0.0.1:1"
		req.Header.Set("X-Forwarded-For", ip2)
		rec := httptest.NewRecorder()
		h2(rec, req)
		if rec.Code != want {
			t.Fatalf("daily req %d = %d", i, rec.Code)
		}
	}
}

// ---- HTTP paths with an unconfigured Supabase ----

func TestTMiscHealthz(t *testing.T) {
	s := tmiscServer(t, nil)
	for _, p := range []string{"/healthz", "/api/health"} {
		t.Run(p, func(t *testing.T) {
			rec := tmiscDo(s, "GET", p, "", nil)
			if rec.Code != 200 {
				t.Fatalf("code %d", rec.Code)
			}
			m := tmiscJSON(t, rec)
			if m["status"] != "ok" || m["service"] != "sihat-tcm-go" || m["env"] != "development" || m["ai"] != false || m["db"] != false {
				t.Fatalf("shape: %v", m)
			}
			if !strings.HasPrefix(rec.Header().Get("Content-Type"), "application/json") {
				t.Error("content type")
			}
		})
	}
}

func TestTMiscSecurityHeaders(t *testing.T) {
	rec := tmiscDo(tmiscServer(t, nil), "GET", "/healthz", "", nil)
	if rec.Header().Get("X-Content-Type-Options") != "nosniff" || rec.Header().Get("X-Frame-Options") != "DENY" ||
		rec.Header().Get("Referrer-Policy") == "" {
		t.Fatalf("headers: %v", rec.Header())
	}
}

func TestTMiscRobotsAndSitemap(t *testing.T) {
	s := tmiscServer(t, nil)
	rec := tmiscDo(s, "GET", "/robots.txt", "", nil)
	body := rec.Body.String()
	if rec.Code != 200 || !strings.HasPrefix(rec.Header().Get("Content-Type"), "text/plain") {
		t.Fatalf("robots %d %s", rec.Code, rec.Header().Get("Content-Type"))
	}
	for _, want := range []string{"User-agent: *", "Disallow: /api/", "Disallow: /patient", "Disallow: /doctor",
		"Sitemap: https://tcm.example.com/sitemap.xml"} {
		if !strings.Contains(body, want) {
			t.Errorf("robots missing %q in %q", want, body)
		}
	}
	rec = tmiscDo(s, "GET", "/sitemap.xml", "", nil)
	body = rec.Body.String()
	if rec.Code != 200 || !strings.HasPrefix(rec.Header().Get("Content-Type"), "application/xml") {
		t.Fatalf("sitemap %d", rec.Code)
	}
	for _, want := range []string{`<?xml version="1.0"`, "<urlset", "<loc>https://tcm.example.com/</loc>", "<loc>https://tcm.example.com/login</loc>", "</urlset>"} {
		if !strings.Contains(body, want) {
			t.Errorf("sitemap missing %q", want)
		}
	}
	if strings.Contains(body, "//login") {
		t.Error("double slash in sitemap")
	}
}

func TestTMiscPagesRedirectWhenAnonymous(t *testing.T) {
	s := tmiscServer(t, nil)
	for _, p := range []string{"/patient", "/doctor", "/admin", "/patient/report/abc"} {
		t.Run(p, func(t *testing.T) {
			rec := tmiscDo(s, "GET", p, "", nil)
			if rec.Code != http.StatusFound || rec.Header().Get("Location") != "/login" {
				t.Fatalf("code=%d loc=%s", rec.Code, rec.Header().Get("Location"))
			}
		})
	}
}

func TestTMiscRenderMissingTemplateIs500(t *testing.T) {
	rec := tmiscDo(tmiscServer(t, nil), "GET", "/reset-password", "", nil)
	if rec.Code != 500 {
		t.Fatalf("code %d", rec.Code)
	}
}

func TestTMiscProtectedRoutesRequireAuth(t *testing.T) {
	s := tmiscServer(t, nil)
	routes := []struct{ m, p string }{
		{"GET", "/api/auth/me"},
		{"POST", "/api/doctor/reply"},
		{"POST", "/api/patient/reply"},
		{"POST", "/api/doctor/treatment-plan"},
		{"POST", "/api/ai/patient-summary"},
		{"POST", "/api/migrate-guest-session"},
		{"GET", "/api/patient/sessions"},
		{"POST", "/api/patient/sessions"},
		{"GET", "/api/doctor/requests"},
		{"POST", "/api/doctor/flag"},
		{"GET", "/api/patient/requests"},
		{"POST", "/api/patient/requests/cancel"},
		{"GET", "/api/patient/profile"},
		{"PUT", "/api/patient/profile"},
		{"GET", "/api/notifications/preferences"},
		{"POST", "/api/notifications/preferences"},
		{"POST", "/api/notifications/register-device"},
		{"DELETE", "/api/notifications/register-device"},
		{"GET", "/api/notifications/schedule"},
		{"POST", "/api/notifications/schedule"},
		{"DELETE", "/api/notifications/schedule"},
		{"GET", "/api/notifications/sync"},
		{"POST", "/api/notifications/sync"},
		{"PUT", "/api/admin/settings"},
		{"GET", "/api/admin/system-health"},
		{"GET", "/api/logs"},
		{"GET", "/api/admin/settings"},
		{"GET", "/api/admin/db-status"},
		{"GET", "/api/monitoring/metrics"},
		{"POST", "/api/admin/test-api-key"},
		{"POST", "/api/admin/assistant"},
		{"POST", "/api/developer/assistant"},
		{"POST", "/api/doctor/generate-inquiry"},
	}
	for _, r := range routes {
		t.Run(r.m+" "+r.p, func(t *testing.T) {
			rec := tmiscDo(s, r.m, r.p, `{}`, map[string]string{"Authorization": "Bearer whatever"})
			if rec.Code != 401 {
				t.Fatalf("code %d body %s", rec.Code, rec.Body.String())
			}
			if tmiscJSON(t, rec)["error"] != "authentication required" {
				t.Errorf("body %s", rec.Body.String())
			}
		})
	}
}

func TestTMiscBadJSONIs400(t *testing.T) {
	s := tmiscServer(t, nil)
	paths := []string{
		"/api/auth/login", "/api/auth/signup", "/api/auth/forgot-password", "/api/auth/reset-password",
		"/api/logs", "/api/admin/system-health",
		"/api/monitoring/metrics", "/api/guest/sessions",
	}
	for _, p := range paths {
		t.Run(p, func(t *testing.T) {
			rec := tmiscDo(s, "POST", p, `{not json`, nil)
			if rec.Code != 400 || !strings.Contains(rec.Body.String(), "invalid JSON body") {
				t.Fatalf("code %d body %s", rec.Code, rec.Body.String())
			}
		})
	}
}

func TestTMiscAuthValidation(t *testing.T) {
	s := tmiscServer(t, nil)
	cases := []struct {
		name, path, body string
		code             int
		contains         string
	}{
		{"login empty", "/api/auth/login", `{}`, 400, "email and password are required"},
		{"login no password", "/api/auth/login", `{"email":"a@b.c"}`, 400, "email and password"},
		{"login no email", "/api/auth/login", `{"password":"pw"}`, 400, "email and password"},
		// an unreachable / unconfigured identity backend is OUR outage (503), never "wrong password" (hunt robust-06)
		{"login unconfigured db", "/api/auth/login", `{"email":"a@b.c","password":"pw"}`, 503, "temporarily unavailable"},
		{"signup empty", "/api/auth/signup", `{}`, 400, "email and password are required"},
		{"signup no password", "/api/auth/signup", `{"email":"a@b.c"}`, 400, "email and password"},
		{"signup unconfigured db", "/api/auth/signup", `{"email":"a@b.c","password":"longenough","role":"doctor"}`, 503, "temporarily unavailable"},
		{"signup invisible char in email", "/api/auth/signup", "{\"email\":\"a\\u200bb@example.com\",\"password\":\"longenough\"}", 400, "valid email"},
		{"signup html in email", "/api/auth/signup", `{"email":"<b>x@example.com","password":"longenough"}`, 400, "valid email"},
		{"signup blank name", "/api/auth/signup", `{"email":"a@example.com","password":"longenough","name":"   "}`, 400, "name must not be blank"},
		{"signup bidi override in name", "/api/auth/signup", "{\"email\":\"a@example.com\",\"password\":\"longenough\",\"name\":\"Dr \\u202eweL\"}", 400, "control or invisible"},
		{"reset no password", "/api/auth/reset-password", `{"token_hash":"x"}`, 400, "password is required"},
		{"reset short password", "/api/auth/reset-password", `{"token_hash":"x","password":"short"}`, 400, "at least 8"},
		{"reset 7 chars", "/api/auth/reset-password", `{"token_hash":"x","password":"1234567"}`, 400, "at least 8"},
		{"reset no token", "/api/auth/reset-password", `{"password":"longenough"}`, 400, "token_hash or access_token"},
		{"reset token_hash with unreachable backend", "/api/auth/reset-password", `{"token_hash":"x","password":"longenough"}`, 503, "temporarily unavailable"},
		// an ordinary session token (no recovery amr claim) is never a recovery proof (hunt sec-02)
		{"reset access token is not a recovery proof", "/api/auth/reset-password", `{"access_token":"x","password":"longenough"}`, 400, "invalid or expired reset link"},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			rec := tmiscDo(s, "POST", c.path, c.body, nil)
			if rec.Code != c.code || !strings.Contains(rec.Body.String(), c.contains) {
				t.Fatalf("code %d body %s", rec.Code, rec.Body.String())
			}
			if rec.Result().Header.Get("Set-Cookie") != "" {
				t.Error("must not set cookie on failure")
			}
		})
	}
}

func TestTMiscForgotPasswordAlways200(t *testing.T) {
	s := tmiscServer(t, nil)
	for i, body := range []string{`{}`, `{"email":""}`, `{"email":"  "}`, `{"email":"nobody@example.com"}`} {
		t.Run(fmt.Sprint(i), func(t *testing.T) {
			rec := tmiscDo(s, "POST", "/api/auth/forgot-password", body, nil)
			m := tmiscJSON(t, rec)
			if rec.Code != 200 || m["success"] != true || !strings.Contains(m["message"].(string), "If an account exists") {
				t.Fatalf("code %d body %s", rec.Code, rec.Body.String())
			}
		})
	}
}

func TestTMiscLogout(t *testing.T) {
	rec := tmiscDo(tmiscServer(t, nil), "POST", "/api/auth/logout", "", nil)
	if rec.Code != 200 || tmiscJSON(t, rec)["success"] != true {
		t.Fatalf("code %d", rec.Code)
	}
	c := rec.Result().Cookies()
	if len(c) != 1 || c[0].Name != "sb-access-token" || c[0].Value != "" || c[0].MaxAge >= 0 || !c[0].HttpOnly {
		t.Fatalf("cookie %+v", c)
	}
}

func TestTMiscSetAuthCookieSecureInProduction(t *testing.T) {
	s := tmiscServer(t, nil)
	rec := httptest.NewRecorder()
	s.dtSetAuthCookie(rec, httptest.NewRequest("GET", "/", nil), "tok", 100)
	c := rec.Result().Cookies()[0]
	if c.Secure || !c.HttpOnly || c.MaxAge != 100 || c.SameSite != http.SameSiteLaxMode {
		t.Fatalf("dev cookie %+v", c)
	}
	// dev, but the request came in over HTTPS via the proxy -> Secure
	rec = httptest.NewRecorder()
	hr := httptest.NewRequest("GET", "/", nil)
	hr.Header.Set("X-Forwarded-Proto", "https")
	s.dtSetAuthCookie(rec, hr, "tok", 100)
	if !rec.Result().Cookies()[0].Secure {
		t.Fatal("https request cookie must be Secure")
	}
	s.Cfg.Env = "production"
	rec = httptest.NewRecorder()
	s.dtSetAuthCookie(rec, httptest.NewRequest("GET", "/", nil), "tok", 100)
	if !rec.Result().Cookies()[0].Secure {
		t.Fatal("prod cookie must be Secure")
	}
}

func TestTMiscOpenRoutesValidation(t *testing.T) {
	s := tmiscServer(t, nil)
	cases := []struct {
		name, method, path, body string
		code                     int
		contains                 string
	}{
		{"logs missing fields", "POST", "/api/logs", `{"level":"info"}`, 400, "missing required fields"},
		{"logs bad level", "POST", "/api/logs", `{"level":"fatal","category":"c","message":"m"}`, 400, "invalid level"},
		{"logs db down", "POST", "/api/logs", `{"level":"info","category":"c","message":"m"}`, 500, "failed to insert log"},
		{"syshealth missing", "POST", "/api/admin/system-health", `{"error_type":"x"}`, 400, "error_type and message are required"},
		{"metrics empty", "POST", "/api/monitoring/metrics", `{"type":"t"}`, 400, "invalid request body"},
		{"metrics no type", "POST", "/api/monitoring/metrics", `{"metrics":[{"name":"a"}]}`, 400, "invalid request body"},
		{"metrics db down", "POST", "/api/monitoring/metrics", `{"type":"t","metrics":[{"name":"a","value":1}]}`, 500, "failed to store metrics"},
		{"guest session db down", "POST", "/api/guest/sessions", `{"symptoms":"a,b","id":"evil","primary_diagnosis":"x","full_report":{"a":1}}`, 500, "failed to save guest session"},
		{"doctors db down", "GET", "/api/doctors", "", 500, "failed to load doctors"},
		{"metrics bad type", "POST", "/api/monitoring/metrics", `{"type":"a&b=c","metrics":[{"name":"a"}]}`, 400, "invalid request body"},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			rec := tmiscDo(s, c.method, c.path, c.body, nil)
			if rec.Code != c.code || !strings.Contains(rec.Body.String(), c.contains) {
				t.Fatalf("code %d body %s", rec.Code, rec.Body.String())
			}
		})
	}
}

func TestTMiscSystemHealthPostFallback(t *testing.T) {
	rec := tmiscDo(tmiscServer(t, nil), "POST", "/api/admin/system-health", `{"error_type":"x","message":"boom","severity":"critical"}`, nil)
	m := tmiscJSON(t, rec)
	if rec.Code != 200 || m["success"] != true || m["fallback"] != true || m["error_id"] != "fallback-log" {
		t.Fatalf("code %d %v", rec.Code, m)
	}
}

func TestTMiscDBStatusUnconfigured(t *testing.T) {
	// Anonymous callers are rejected before the handler runs.
	if rec := tmiscDo(tmiscServer(t, nil), "GET", "/api/admin/db-status", "", nil); rec.Code != 401 {
		t.Fatalf("anonymous db-status -> %d want 401", rec.Code)
	}
	// Called directly (as an admin) with no Supabase configured.
	rec := httptest.NewRecorder()
	tmiscServer(t, nil).handleAdminDBStatus(rec, httptest.NewRequest("GET", "/api/admin/db-status", nil), &AuthUser{Role: "admin"})
	m := tmiscJSON(t, rec)
	if rec.Code != 200 || m["connected"] != false || m["error"] != "Supabase configuration missing" {
		t.Fatalf("%d %v", rec.Code, m)
	}
	if ps, ok := m["promptsStatus"].([]any); !ok || len(ps) != 0 {
		t.Fatalf("promptsStatus %v", m["promptsStatus"])
	}
}

func TestTMiscAdminRoutesRoleGates(t *testing.T) {
	s, _ := tmiscFakeDB(t)
	cases := []struct {
		role, m, p string
		want       int
	}{
		{"doctor", "GET", "/api/admin/settings", 403},
		{"patient", "GET", "/api/admin/db-status", 403},
		{"patient", "GET", "/api/monitoring/metrics", 403},
		{"doctor", "GET", "/api/monitoring/metrics", 403},
		{"developer", "POST", "/api/admin/test-api-key", 403},
		{"doctor", "POST", "/api/admin/assistant", 403},
		{"patient", "POST", "/api/developer/assistant", 403},
		{"patient", "POST", "/api/doctor/generate-inquiry", 403},
		{"admin", "GET", "/api/admin/settings", 200},
		{"developer", "GET", "/api/admin/db-status", 200},
		{"admin", "GET", "/api/monitoring/metrics", 200},
		{"developer", "GET", "/api/monitoring/metrics", 200},
	}
	for _, c := range cases {
		t.Run(c.role+" "+c.m+" "+c.p, func(t *testing.T) {
			rec := tmiscDo(s, c.m, c.p, `{}`, tmiscBearer(c.role))
			if rec.Code != c.want {
				t.Fatalf("%d %s", rec.Code, rec.Body.String())
			}
		})
	}
}

func TestTMiscAdminTestAPIKeyValidation(t *testing.T) {
	s, _ := tmiscFakeDB(t)
	for _, c := range []struct{ body, contains string }{
		{`{}`, "apiKey is required"},
		{`{"useSavedKey":true}`, "no saved API key"},
	} {
		rec := tmiscDo(s, "POST", "/api/admin/test-api-key", c.body, tmiscBearer("admin"))
		if rec.Code != 400 || !strings.Contains(rec.Body.String(), c.contains) {
			t.Fatalf("%s -> %d %s", c.body, rec.Code, rec.Body.String())
		}
	}
}

func TestClassifyKeyTestError(t *testing.T) {
	cases := []struct {
		raw  string
		want int
	}{
		{"gemini: API error 400: API key not valid. Please pass a valid API key.", 400},
		{"gemini: API error 400: API_KEY_INVALID", 400},
		{"gemini: API error 400: The API Key has EXPIRED", 400},
		{"gemini: API error 403: Permission denied", 400},
		{"gemini: API error 429: Quota exceeded for metric", 429},
		{"gemini: API error 429: RESOURCE_EXHAUSTED", 429},
		{"gemini: request failed: dial tcp: connection refused", 502},
	}
	for _, c := range cases {
		got, msg := classifyKeyTestError(c.raw)
		if got != c.want {
			t.Errorf("%q -> %d want %d", c.raw, got, c.want)
		}
		if strings.Contains(msg, "gemini:") || strings.Contains(msg, "dial tcp") {
			t.Errorf("message leaks upstream detail: %q", msg)
		}
	}
}

func TestTMiscLogsPostUserIDNotTrusted(t *testing.T) {
	s, f := tmiscFakeDB(t)
	body := `{"level":"info","category":"c","message":"m","userId":"victim-id"}`
	if rec := tmiscDo(s, "POST", "/api/logs", body, nil); rec.Code != 200 {
		t.Fatalf("anon log -> %d %s", rec.Code, rec.Body.String())
	}
	f.mu.Lock()
	got := f.body["POST /rest/v1/system_logs"]
	f.mu.Unlock()
	if strings.Contains(got, "victim-id") || !strings.Contains(got, `"user_id":null`) {
		t.Fatalf("anonymous log row must have null user_id: %s", got)
	}
	if rec := tmiscDo(s, "POST", "/api/logs", body, tmiscBearer("patient")); rec.Code != 200 {
		t.Fatalf("authed log -> %d", rec.Code)
	}
	f.mu.Lock()
	got = f.body["POST /rest/v1/system_logs"]
	f.mu.Unlock()
	if strings.Contains(got, "victim-id") || !strings.Contains(got, `"user_id":"u-patient"`) {
		t.Fatalf("authed log row must use the session user: %s", got)
	}
}

func TestTMiscLogsAndMetricsInputValidation(t *testing.T) {
	s, f := tmiscFakeDB(t)
	bad := []string{
		"/api/logs?level=" + url.QueryEscape("info&or=(id.neq.0)"),
		"/api/logs?level=fatal",
		"/api/logs?category=" + url.QueryEscape("bad\x00control"),
		"/api/logs?since=" + url.QueryEscape("1&or=(a.eq.b)"),
		"/api/monitoring/metrics?type=" + url.QueryEscape("x&or=(a.eq.b)"),
		"/api/monitoring/metrics?startDate=nope",
		"/api/monitoring/metrics?endDate=" + url.QueryEscape("1&x=y"),
	}
	for _, p := range bad {
		role := "admin"
		if rec := tmiscDo(s, "GET", p, "", tmiscBearer(role)); rec.Code != 400 {
			t.Errorf("%s -> %d want 400", p, rec.Code)
		}
	}
	good := []string{
		"/api/logs?level=error&category=ai.stream&since=" + url.QueryEscape("2026-01-02T03:04:05+08:00"),
		"/api/monitoring/metrics?type=page_load&startDate=2026-01-02T03:04:05Z&limit=5",
	}
	for _, p := range good {
		if rec := tmiscDo(s, "GET", p, "", tmiscBearer("admin")); rec.Code != 200 {
			t.Errorf("%s -> %d want 200", p, rec.Code)
		}
	}
	_ = f
}

func TestTMiscBodySizeCaps(t *testing.T) {
	// Called directly (bypassing the global body-limit middleware) so the
	// handlers' own 1 MB cap is what rejects the request.
	s := tmiscServer(t, nil)
	huge := `{"level":"info","category":"c","message":"` + strings.Repeat("a", 2<<20) + `"}`
	rec := httptest.NewRecorder()
	s.handleLogsPost(rec, httptest.NewRequest("POST", "/api/logs", strings.NewReader(huge)))
	if rec.Code != 400 {
		t.Errorf("oversize /api/logs -> %d want 400", rec.Code)
	}
	hugeM := `{"type":"t","metrics":[{"name":"` + strings.Repeat("a", 2<<20) + `"}]}`
	rec = httptest.NewRecorder()
	s.handleMonitoringMetricsPost(rec, httptest.NewRequest("POST", "/api/monitoring/metrics", strings.NewReader(hugeM)))
	if rec.Code != 400 {
		t.Errorf("oversize metrics -> %d want 400", rec.Code)
	}
}

func TestTMiscMonitoringHealth(t *testing.T) {
	rec := tmiscDo(tmiscServer(t, nil), "GET", "/api/monitoring/health", "", nil)
	m := tmiscJSON(t, rec)
	if rec.Code != 503 || m["status"] != "unhealthy" || m["version"] != "go-1.0.0" {
		t.Fatalf("%d %v", rec.Code, m)
	}
	comps := m["components"].(map[string]any)
	if comps["database"].(map[string]any)["status"] != "unhealthy" || comps["ai_service"].(map[string]any)["status"] != "degraded" {
		t.Fatalf("components %v", comps)
	}
}

func TestTMiscConfigGeminiKey(t *testing.T) {
	t.Setenv("MOBILE_APP_TOKEN", "")
	s := tmiscServer(t, nil)
	if rec := tmiscDo(s, "GET", "/api/config/gemini-key", "", nil); rec.Code != 503 {
		t.Fatalf("unconfigured: %d", rec.Code)
	}
	t.Setenv("MOBILE_APP_TOKEN", "secret")
	for name, hdr := range map[string]map[string]string{"missing": nil, "wrong": {"X-App-Token": "nope"}} {
		if rec := tmiscDo(s, "GET", "/api/config/gemini-key", "", hdr); rec.Code != 401 || strings.Contains(rec.Body.String(), "apiKey") {
			t.Fatalf("%s: %d %s", name, rec.Code, rec.Body.String())
		}
	}
	ok := map[string]string{"X-App-Token": "secret"}
	if rec := tmiscDo(s, "GET", "/api/config/gemini-key", "", ok); rec.Code != 404 {
		t.Fatalf("no key: %d", rec.Code)
	}
	s.Cfg.GeminiAPIKey = "AIza-test"
	rec := tmiscDo(s, "GET", "/api/config/gemini-key", "", ok)
	m := tmiscJSON(t, rec)
	if rec.Code != 200 || m["apiKey"] != "AIza-test" || m["source"] != "environment_variable" {
		t.Fatalf("%d %v", rec.Code, m)
	}
}

func TestTMiscReportViewedNoTelegram(t *testing.T) {
	s := tmiscServer(t, nil)
	for i, body := range []string{``, `garbage`, `{"isGuest":true}`} {
		rec := tmiscDo(s, "POST", "/api/notifications/report-viewed", body, nil)
		m := tmiscJSON(t, rec)
		if rec.Code != 200 || m["ok"] != false || m["sent"] != false {
			t.Fatalf("%d: %d %v", i, rec.Code, m)
		}
	}
}

func TestTMiscMethodAndNotFound(t *testing.T) {
	s := tmiscServer(t, nil)
	if rec := tmiscDo(s, "GET", "/api/auth/login", "", nil); rec.Code != 405 {
		t.Fatalf("GET login = %d", rec.Code)
	}
	if rec := tmiscDo(s, "GET", "/no/such/page", "", nil); rec.Code != 404 {
		t.Fatalf("404 expected")
	}
}

// ---- authenticated paths against a fake Supabase ----

type tmiscFake struct {
	mu   sync.Mutex
	reqs []string
	body map[string]string // "METHOD path" -> last body
}

// tmiscFakeDB starts a fake GoTrue+PostgREST. Tokens tok-patient/tok-doctor/tok-admin map to roles.
func tmiscFakeDB(t *testing.T) (*Server, *tmiscFake) {
	t.Helper()
	f := &tmiscFake{body: map[string]string{}}
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		b, _ := io.ReadAll(r.Body)
		f.mu.Lock()
		key := r.Method + " " + r.URL.Path
		f.reqs = append(f.reqs, key)
		f.body[key] = string(b)
		f.mu.Unlock()
		w.Header().Set("Content-Type", "application/json")
		switch {
		case r.URL.Path == "/auth/v1/user" && r.Method == "GET":
			tok := strings.TrimPrefix(r.Header.Get("Authorization"), "Bearer ")
			if !strings.HasPrefix(tok, "tok-") {
				w.WriteHeader(401)
				w.Write([]byte(`{"msg":"bad"}`))
				return
			}
			fmt.Fprintf(w, `{"id":"u-%s","email":"%s@x.io"}`, tok[4:], tok[4:])
		case r.URL.Path == "/auth/v1/token":
			w.Write([]byte(`{"access_token":"tok-doctor","expires_in":777,"user":{"id":"u-doctor","email":"doctor@x.io"}}`))
		case r.URL.Path == "/auth/v1/signup":
			w.Write([]byte(`{"access_token":"tok-patient","user":{"id":"u-patient","email":"patient@x.io"}}`))
		case r.URL.Path == "/rest/v1/profiles" && r.Method == "GET":
			id := r.URL.Query().Get("id")
			w.Write([]byte(fmt.Sprintf(`[{"role":"%s"}]`, strings.TrimPrefix(id, "eq.u-"))))
		case r.Method == "GET":
			w.Write([]byte(`[]`))
		case r.Method == "PATCH" && r.URL.Path == "/rest/v1/guest_diagnosis_sessions":
			w.Write([]byte(`[]`)) // the conditional claim (migrated_to_user_id IS NULL) matches nothing: already migrated / unknown
		case r.Method == "POST" || r.Method == "PATCH":
			w.Write([]byte(`[{"id":"row1"}]`))
		default:
			w.Write([]byte(`{}`))
		}
	}))
	t.Cleanup(ts.Close)
	return tmiscServer(t, supabase.New(ts.URL, "anon", "svc")), f
}

func tmiscBearer(role string) map[string]string {
	return map[string]string{"Authorization": "Bearer tok-" + role}
}

func TestTMiscFakeDBAuthMeAndRoles(t *testing.T) {
	s, _ := tmiscFakeDB(t)
	rec := tmiscDo(s, "GET", "/api/auth/me", "", tmiscBearer("doctor"))
	m := tmiscJSON(t, rec)
	u, _ := m["user"].(map[string]any)
	if rec.Code != 200 || u["role"] != "doctor" || u["id"] != "u-doctor" || u["email"] != "doctor@x.io" {
		t.Fatalf("%d %v", rec.Code, m)
	}
	// cookie auth works as well
	rec = tmiscDo(s, "GET", "/api/auth/me", "", map[string]string{"Cookie": "sb-access-token=tok-admin"})
	if rec.Code != 200 {
		t.Fatalf("cookie auth %d", rec.Code)
	}
	// invalid token -> 401
	if rec = tmiscDo(s, "GET", "/api/auth/me", "", map[string]string{"Authorization": "Bearer nope"}); rec.Code != 401 {
		t.Fatalf("bad token %d", rec.Code)
	}
	// role gates -> 403
	gates := []struct{ role, m, p string }{
		{"patient", "POST", "/api/doctor/reply"},
		{"patient", "GET", "/api/doctor/requests"},
		{"patient", "POST", "/api/doctor/flag"},
		{"patient", "POST", "/api/doctor/treatment-plan"},
		{"doctor", "PUT", "/api/admin/settings"},
		{"patient", "GET", "/api/admin/system-health"},
		{"doctor", "GET", "/api/logs"},
	}
	for _, g := range gates {
		t.Run(g.role+" "+g.m+" "+g.p, func(t *testing.T) {
			rec := tmiscDo(s, g.m, g.p, `{}`, tmiscBearer(g.role))
			if rec.Code != 403 || tmiscJSON(t, rec)["error"] != "insufficient permissions" {
				t.Fatalf("%d %s", rec.Code, rec.Body.String())
			}
		})
	}
}

func TestTMiscFakeDBPagesByRole(t *testing.T) {
	s, _ := tmiscFakeDB(t)
	cases := []struct{ role, path, loc string }{
		{"patient", "/admin", "/patient"},
		{"doctor", "/admin", "/doctor"},
		{"doctor", "/login", "/doctor"},
		{"patient", "/login", "/patient"},
		{"admin", "/login", "/admin"},
		{"developer", "/login", "/admin"},
		{"patient", "/doctor", "/patient"},
	}
	for _, c := range cases {
		t.Run(c.role+c.path, func(t *testing.T) {
			rec := tmiscDo(s, "GET", c.path, "", tmiscBearer(c.role))
			if rec.Code != 302 || rec.Header().Get("Location") != c.loc {
				t.Fatalf("%d %s", rec.Code, rec.Header().Get("Location"))
			}
		})
	}
}

func TestTMiscFakeDBValidationWhenAuthed(t *testing.T) {
	s, _ := tmiscFakeDB(t)
	cases := []struct {
		name, role, method, path, body string
		code                           int
		contains                       string
	}{
		{"doctor reply missing", "doctor", "POST", "/api/doctor/reply", `{"requestId":"r"}`, 400, "requestId and message"},
		{"doctor reply bad json", "doctor", "POST", "/api/doctor/reply", `{`, 400, "invalid JSON"},
		{"doctor reply not found", "doctor", "POST", "/api/doctor/reply", `{"requestId":"r","message":"hi"}`, 404, "record not found"},
		{"patient reply blank", "patient", "POST", "/api/patient/reply", `{"requestId":"r","message":"   "}`, 400, "requestId and message"},
		{"patient reply not found", "patient", "POST", "/api/patient/reply", `{"requestId":"r","message":"hi"}`, 404, "request not found"},
		{"treatment plan empty", "doctor", "POST", "/api/doctor/treatment-plan", `{"requestId":"r","plan":{}}`, 400, "requestId and plan"},
		{"treatment plan not found", "doctor", "POST", "/api/doctor/treatment-plan", `{"requestId":"r","plan":{"a":1}}`, 404, "record not found"},
		{"flag missing id", "doctor", "POST", "/api/doctor/flag", `{"flag":"watch"}`, 400, "requestId is required"},
		{"verification no doctor", "patient", "POST", "/api/verification-request", `{}`, 400, "doctor information is required"},
		{"verification only id", "patient", "POST", "/api/verification-request", `{"doctorId":"d"}`, 400, "doctor information"},
		{"verification bad doctor id", "patient", "POST", "/api/verification-request", `{"doctorId":"a&b","doctorName":"Dr"}`, 400, "invalid doctorId"},
		{"patient summary missing", "doctor", "POST", "/api/ai/patient-summary", `{}`, 400, "patientId is required"},
		{"patient summary not found", "doctor", "POST", "/api/ai/patient-summary", `{"patientId":"p"}`, 404, "patient not found"},
		{"migrate missing", "patient", "POST", "/api/migrate-guest-session", `{}`, 400, "sessionToken is required"},
		{"migrate none", "patient", "POST", "/api/migrate-guest-session", `{"sessionToken":"t"}`, 400, "not found or already migrated"},
		{"cancel missing", "patient", "POST", "/api/patient/requests/cancel", `{}`, 400, "id is required"},
		{"cancel not found", "patient", "POST", "/api/patient/requests/cancel", `{"id":"1"}`, 404, "request not found"},
		{"device missing", "patient", "POST", "/api/notifications/register-device", `{"deviceToken":"x"}`, 400, "deviceToken and deviceType"},
		{"deregister missing", "patient", "DELETE", "/api/notifications/register-device", ``, 400, "deviceToken query param"},
		{"schedule delete missing", "patient", "DELETE", "/api/notifications/schedule", ``, 400, "id or type"},
		{"schedule post missing title", "patient", "POST", "/api/notifications/schedule", `{"notification_type":"a","body":"b","scheduled_for":"x","category":"c"}`, 400, "missing required field: title"},
		{"schedule post empty field", "patient", "POST", "/api/notifications/schedule", `{"notification_type":"a","title":"","body":"b","scheduled_for":"x","category":"c"}`, 400, "missing required field: title"},
		{"sync post no token", "patient", "POST", "/api/notifications/sync", `{}`, 400, "deviceToken is required"},
		{"logs get ok", "admin", "GET", "/api/logs?limit=9999&level=error", ``, 200, `"count":0`},
		{"sessions list empty", "patient", "GET", "/api/patient/sessions", ``, 200, `"sessions":[]`},
		{"prefs defaults", "patient", "GET", "/api/notifications/preferences", ``, 200, `"quiet_hours_start":"22:00:00"`},
		{"profile get", "patient", "GET", "/api/patient/profile", ``, 200, `"email":"patient@x.io"`},
		{"profile put", "patient", "PUT", "/api/patient/profile", `{"full_name":"A"}`, 200, `"success":true`},
		{"schedule get empty", "patient", "GET", "/api/notifications/schedule?pending=true", ``, 200, `"notifications":[]`},
		{"sync get", "patient", "GET", "/api/notifications/sync", ``, 200, `"pendingNotifications":[]`},
		{"doctor requests", "doctor", "GET", "/api/doctor/requests", ``, 200, `"requests":[]`},
		{"directory ok", "", "GET", "/api/doctors", ``, 200, `"doctors":[`},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			var h map[string]string
			if c.role != "" {
				h = tmiscBearer(c.role)
			}
			rec := tmiscDo(s, c.method, c.path, c.body, h)
			if rec.Code != c.code || !strings.Contains(rec.Body.String(), c.contains) {
				t.Fatalf("%d %s", rec.Code, rec.Body.String())
			}
		})
	}
}

func TestTMiscFakeDBLoginSignup(t *testing.T) {
	s, f := tmiscFakeDB(t)
	rec := tmiscDo(s, "POST", "/api/auth/login", `{"email":"d@x.io","password":"pw"}`, nil)
	m := tmiscJSON(t, rec)
	if rec.Code != 200 || m["role"] != "doctor" || m["success"] != true {
		t.Fatalf("login %d %v", rec.Code, m)
	}
	c := rec.Result().Cookies()
	if len(c) != 1 || c[0].Value != "tok-doctor" || c[0].MaxAge != 777 {
		t.Fatalf("cookie %+v", c)
	}
	// signup: an "admin" role request must be downgraded to patient
	rec = tmiscDo(s, "POST", "/api/auth/signup", `{"email":"p@x.io","password":"longenough","role":"admin","name":"Pat"}`, nil)
	m = tmiscJSON(t, rec)
	if rec.Code != 200 || m["role"] != "patient" {
		t.Fatalf("signup %d %v", rec.Code, m)
	}
	c = rec.Result().Cookies()
	if len(c) != 1 || c[0].MaxAge != 3600 {
		t.Fatalf("default maxAge expected 3600: %+v", c)
	}
	f.mu.Lock()
	signup := f.body["POST /auth/v1/signup"]
	profile := f.body["POST /rest/v1/profiles"]
	f.mu.Unlock()
	if !strings.Contains(signup, `"role":"patient"`) || strings.Contains(profile, "is_approved") {
		t.Fatalf("signup=%s profile=%s", signup, profile)
	}
	// a self-registered doctor is NOT approved (an admin grants that, hunt staff-09); the extra fields are stored
	tmiscDo(s, "POST", "/api/auth/signup", `{"email":"d@x.io","password":"longenough","role":"doctor","specialty":"Acu","bio":"b","yearsExperience":5}`, nil)
	f.mu.Lock()
	profile = f.body["POST /rest/v1/profiles"]
	f.mu.Unlock()
	if strings.Contains(profile, `"is_approved":true`) {
		t.Errorf("a self-registered doctor must not be auto-approved: %s", profile)
	}
	for _, want := range []string{`"is_approved":false`, `"specialty":"Acu"`, `"years_experience":5`, `"role":"doctor"`} {
		if !strings.Contains(profile, want) {
			t.Errorf("profile missing %s: %s", want, profile)
		}
	}
}

func TestTMiscFakeDBSessionsCreateNormalizesSymptoms(t *testing.T) {
	s, f := tmiscFakeDB(t)
	rec := tmiscDo(s, "POST", "/api/patient/sessions", `{"symptoms":"a, b","user_id":"hacker","primary_diagnosis":"x","full_report":{"a":1}}`, tmiscBearer("patient"))
	if rec.Code != 201 {
		t.Fatalf("%d %s", rec.Code, rec.Body.String())
	}
	f.mu.Lock()
	b := f.body["POST /rest/v1/diagnosis_sessions"]
	f.mu.Unlock()
	if !strings.Contains(b, `"symptoms":["a","b"]`) || !strings.Contains(b, `"user_id":"u-patient"`) || strings.Contains(b, "hacker") {
		t.Fatalf("insert body %s", b)
	}
}

func TestTMiscFakeDBGuestSessionToken(t *testing.T) {
	s, f := tmiscFakeDB(t)
	rec := tmiscDo(s, "POST", "/api/guest/sessions", `{"id":"evil","symptoms":"x","primary_diagnosis":"x","full_report":{"a":1}}`, nil)
	m := tmiscJSON(t, rec)
	tok, _ := m["session_token"].(string)
	if rec.Code != 201 || len(tok) != 32 {
		t.Fatalf("%d %v", rec.Code, m)
	}
	f.mu.Lock()
	b := f.body["POST /rest/v1/guest_diagnosis_sessions"]
	f.mu.Unlock()
	if strings.Contains(b, "evil") || !strings.Contains(b, tok) || !strings.Contains(b, `"symptoms":["x"]`) {
		t.Fatalf("body %s", b)
	}
}

func TestTMiscFakeDBFlagNormalisation(t *testing.T) {
	s, f := tmiscFakeDB(t)
	for _, in := range []string{"watch", "critical", "normal"} {
		body := fmt.Sprintf(`{"requestId":"r1","flag":%q}`, in)
		rec := tmiscDo(s, "POST", "/api/doctor/flag", body, tmiscBearer("doctor"))
		if rec.Code != 200 || tmiscJSON(t, rec)["flag"] != in {
			t.Fatalf("%q -> %d %s", in, rec.Code, rec.Body.String())
		}
	}
	// an unknown / empty / null / wrongly-cased flag is a 400, never a silent downgrade to "normal" (hunt staff-01)
	for _, body := range []string{`{"requestId":"r1","flag":"bogus"}`, `{"requestId":"r1","flag":""}`, `{"requestId":"r1","flag":null}`, `{"requestId":"r1","flag":"CRITICAL"}`, `{"requestId":"r1"}`} {
		rec := tmiscDo(s, "POST", "/api/doctor/flag", body, tmiscBearer("doctor"))
		if rec.Code != 400 {
			t.Fatalf("%s -> %d %s, want 400", body, rec.Code, rec.Body.String())
		}
	}
	f.mu.Lock()
	defer f.mu.Unlock()
	if !strings.Contains(f.body["PATCH /rest/v1/inquiries"], `{"flag":"`) {
		t.Fatalf("last patch %s", f.body["PATCH /rest/v1/inquiries"])
	}
}

func TestTMiscFakeDBAdminSettingsMasksKey(t *testing.T) {
	// settings GET masks gemini_api_key to last 6 chars
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte(`[{"id":1,"gemini_api_key":"AIzaSyABCDEFGHIJ"}]`))
	}))
	defer ts.Close()
	s := tmiscServer(t, supabase.New(ts.URL, "anon", "svc"))
	rec := httptest.NewRecorder()
	s.handleAdminSettingsGet(rec, httptest.NewRequest("GET", "/api/admin/settings", nil), &AuthUser{Role: "admin"})
	m := tmiscJSON(t, rec)
	if rec.Code != 200 || m["gemini_api_key"] != "...EFGHIJ" {
		t.Fatalf("%d %v", rec.Code, m)
	}
}

func TestTMiscFakeDBAdminSettingsWhitelist(t *testing.T) {
	s, f := tmiscFakeDB(t)
	rec := tmiscDo(s, "PUT", "/api/admin/settings", `{"music_url":"http://x/y.mp3","service_role_key":"svc-leak","id":9,"bogus":1}`, tmiscBearer("admin"))
	if rec.Code != 200 {
		t.Fatalf("%d %s", rec.Code, rec.Body.String())
	}
	f.mu.Lock()
	b := f.body["PATCH /rest/v1/admin_settings"]
	f.mu.Unlock()
	if !strings.Contains(b, `"music_url"`) || strings.Contains(b, "service_role_key") || strings.Contains(b, "bogus") || strings.Contains(b, `"id"`) {
		t.Fatalf("forwarded body not whitelisted: %s", b)
	}
	// nothing recognised -> 400, no DB write
	rec = tmiscDo(s, "PUT", "/api/admin/settings", `{"bogus":1}`, tmiscBearer("admin"))
	if rec.Code != 400 {
		t.Fatalf("unknown-only body -> %d", rec.Code)
	}
}

func TestTMiscFakeDBSessionPayloadsAreColumnFiltered(t *testing.T) {
	s, f := tmiscFakeDB(t)
	// guest save: unknown columns and null values never reach PostgREST
	rec := tmiscDo(s, "POST", "/api/guest/sessions", `{"primary_diagnosis":"d","full_report":{"a":1},"bogus_col":1,"constitution":null,"guest_email":"g@example.com"}`, nil)
	if rec.Code != 201 {
		t.Fatalf("guest %d %s", rec.Code, rec.Body.String())
	}
	f.mu.Lock()
	b := f.body["POST /rest/v1/guest_diagnosis_sessions"]
	f.mu.Unlock()
	if strings.Contains(b, "bogus_col") || strings.Contains(b, "constitution") || !strings.Contains(b, "guest_email") {
		t.Fatalf("guest body %s", b)
	}
	// registered save: same, and user_id is forced
	rec = tmiscDo(s, "POST", "/api/patient/sessions", `{"primary_diagnosis":"d","full_report":{},"bogus_col":1,"user_id":"someone-else"}`, tmiscBearer("patient"))
	if rec.Code >= 300 {
		t.Fatalf("patient %d %s", rec.Code, rec.Body.String())
	}
	f.mu.Lock()
	b = f.body["POST /rest/v1/diagnosis_sessions"]
	f.mu.Unlock()
	if strings.Contains(b, "bogus_col") || strings.Contains(b, "someone-else") || !strings.Contains(b, `"user_id":"u-patient"`) {
		t.Fatalf("patient body %s", b)
	}
}

func TestTMiscFakeDBProfileRejectsUnknownLanguage(t *testing.T) {
	s, _ := tmiscFakeDB(t)
	if rec := tmiscDo(s, "PUT", "/api/patient/profile", `{"preferred_language":"klingon"}`, tmiscBearer("patient")); rec.Code != 400 {
		t.Fatalf("got %d", rec.Code)
	}
	if rec := tmiscDo(s, "PUT", "/api/patient/profile", `{"preferred_language":"zh"}`, tmiscBearer("patient")); rec.Code != 200 {
		t.Fatalf("zh got %d", rec.Code)
	}
}
