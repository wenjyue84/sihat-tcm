package server

import (
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"
	"testing/fstest"

	"sihattcm/internal/config"
	"sihattcm/internal/supabase"
)

// ---- helpers ----

func thPost(h http.HandlerFunc, ctype, body string) *httptest.ResponseRecorder {
	r := httptest.NewRequest(http.MethodPost, "/x", strings.NewReader(body))
	if ctype != "" {
		r.Header.Set("Content-Type", ctype)
	}
	rec := httptest.NewRecorder()
	h(rec, r)
	return rec
}

func thErrJSON(t *testing.T, rec *httptest.ResponseRecorder, status int) string {
	t.Helper()
	if rec.Code != status {
		t.Fatalf("status = %d, want %d (body %s)", rec.Code, status, rec.Body.String())
	}
	if ct := rec.Header().Get("Content-Type"); !strings.HasPrefix(ct, "application/json") {
		t.Fatalf("error Content-Type = %q, want application/json (body %s)", ct, rec.Body.String())
	}
	var m map[string]string
	if err := json.Unmarshal(rec.Body.Bytes(), &m); err != nil {
		t.Fatalf("error body not JSON: %q", rec.Body.String())
	}
	return m["error"]
}

// thSignupServer returns a Server whose GoTrue/PostgREST is a fake that records
// the signup body and profile upserts.
type thRecorder struct {
	mu       sync.Mutex
	signups  []map[string]any
	profiles []map[string]any
}

func thFakeServer(t *testing.T) (*Server, *thRecorder) {
	t.Helper()
	rec := &thRecorder{}
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		b, _ := io.ReadAll(r.Body)
		var m map[string]any
		_ = json.Unmarshal(b, &m)
		rec.mu.Lock()
		defer rec.mu.Unlock()
		w.Header().Set("Content-Type", "application/json")
		switch {
		case r.URL.Path == "/auth/v1/signup":
			rec.signups = append(rec.signups, m)
			_, _ = w.Write([]byte(`{"access_token":"tok","expires_in":3600,"user":{"id":"u1","email":"x@y.z"}}`))
		case strings.HasPrefix(r.URL.Path, "/rest/v1/profiles"):
			rec.profiles = append(rec.profiles, m)
			_, _ = w.Write([]byte(`[]`))
		default:
			w.WriteHeader(404)
		}
	}))
	t.Cleanup(ts.Close)
	s := &Server{Cfg: &config.Config{}, DB: supabase.New(ts.URL, "anon", "service")}
	return s, rec
}

// ---- content type / JSON errors ----

func TestTHAuthEndpointsRequireJSONContentType(t *testing.T) {
	s := &Server{Cfg: &config.Config{}}
	handlers := map[string]http.HandlerFunc{
		"login": s.handleAuthLogin, "signup": s.handleAuthSignup,
		"forgot": s.handleForgotPassword, "reset": s.handleResetPassword,
	}
	for name, h := range handlers {
		for _, ct := range []string{"", "text/plain", "application/x-www-form-urlencoded", "multipart/form-data"} {
			rec := thPost(h, ct, `{"email":"a@b.c","password":"password123"}`)
			thErrJSON(t, rec, http.StatusUnsupportedMediaType)
			_ = name
		}
	}
	// charset parameter is fine; bad JSON is a JSON 400
	rec := thPost(s.handleAuthLogin, "application/json; charset=utf-8", `{not json`)
	if msg := thErrJSON(t, rec, http.StatusBadRequest); msg == "" {
		t.Error("empty error message")
	}
}

func TestTHReadJSONErrorsAreJSON(t *testing.T) {
	for _, body := range []string{"{not json", "", "[]garbage"} {
		r := httptest.NewRequest(http.MethodPost, "/x", strings.NewReader(body))
		rec := httptest.NewRecorder()
		var v struct{ A string }
		if dtReadJSON(rec, r, &v) {
			t.Fatalf("body %q should fail", body)
		}
		thErrJSON(t, rec, http.StatusBadRequest)
	}
}

func TestTHReadJSONTooLargeIs413(t *testing.T) {
	rec := httptest.NewRecorder()
	r := httptest.NewRequest(http.MethodPost, "/x", strings.NewReader(`{"a":"`+strings.Repeat("x", 100)+`"}`))
	r.Body = http.MaxBytesReader(rec, r.Body, 10)
	var v struct{ A string }
	if dtReadJSON(rec, r, &v) {
		t.Fatal("expected failure")
	}
	thErrJSON(t, rec, http.StatusRequestEntityTooLarge)
}

// ---- signup / login / reset validation ----

func TestTHSignupValidation(t *testing.T) {
	s, rec := thFakeServer(t)
	long := func(n int) string { return strings.Repeat("a", n) }
	cases := []struct {
		name string
		body map[string]any
	}{
		{"email too long", map[string]any{"email": long(250) + "@b.co", "password": "password123"}},
		{"email no @", map[string]any{"email": "nope", "password": "password123"}},
		{"password too short", map[string]any{"email": "a@b.co", "password": "short12"}},
		{"password too long", map[string]any{"email": "a@b.co", "password": long(129)}},
		{"password whitespace only", map[string]any{"email": "a@b.co", "password": "          "}},
		{"name too long", map[string]any{"email": "a@b.co", "password": "password123", "name": long(101)}},
		{"name huge", map[string]any{"email": "a@b.co", "password": "password123", "name": long(100000)}},
		{"specialty too long", map[string]any{"email": "a@b.co", "password": "password123", "role": "doctor", "specialty": long(101)}},
		{"bio too long", map[string]any{"email": "a@b.co", "password": "password123", "role": "doctor", "bio": long(2001)}},
		{"years object", map[string]any{"email": "a@b.co", "password": "password123", "yearsExperience": map[string]any{"$gt": 0}}},
		{"years negative", map[string]any{"email": "a@b.co", "password": "password123", "yearsExperience": -1}},
		{"years absurd", map[string]any{"email": "a@b.co", "password": "password123", "yearsExperience": 999}},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			b, _ := json.Marshal(tc.body)
			thErrJSON(t, thPost(s.handleAuthSignup, "application/json", string(b)), http.StatusBadRequest)
		})
	}
	if len(rec.signups) != 0 {
		t.Fatalf("invalid signups reached the auth backend: %v", rec.signups)
	}
}

func TestTHSignupBoundaryAndNormalisation(t *testing.T) {
	s, rec := thFakeServer(t)
	body := `{"email":"  Mixed.Case@Example.COM ","password":"` + strings.Repeat("p", 128) + `","name":"` + strings.Repeat("名", 100) + `"}`
	out := thPost(s.handleAuthSignup, "application/json", body)
	if out.Code != 200 {
		t.Fatalf("boundary signup = %d %s", out.Code, out.Body.String())
	}
	if got := rec.signups[0]["email"]; got != "mixed.case@example.com" {
		t.Errorf("email not trimmed+lowercased: %v", got)
	}
}

func TestTHSignupRoleEscalation(t *testing.T) {
	for role, want := range map[string]string{
		"": "patient", "patient": "patient", "doctor": "doctor", "Doctor": "doctor", " doctor ": "doctor",
		"admin": "patient", "ADMIN": "patient", " admin": "patient", "developer": "patient", "superuser": "patient",
	} {
		s, rec := thFakeServer(t)
		b, _ := json.Marshal(map[string]any{"email": "r@example.com", "password": "password123", "role": role, "name": "R"})
		out := thPost(s.handleAuthSignup, "application/json", string(b))
		if out.Code != 200 {
			t.Fatalf("role %q: status %d %s", role, out.Code, out.Body.String())
		}
		meta := rec.signups[0]["data"].(map[string]any)
		if meta["role"] != want {
			t.Errorf("role %q: signup metadata role = %v, want %s", role, meta["role"], want)
		}
		if len(rec.profiles) != 1 || rec.profiles[0]["role"] != want {
			t.Errorf("role %q: profile row role = %v, want %s", role, rec.profiles, want)
		}
		var resp map[string]any
		_ = json.Unmarshal(out.Body.Bytes(), &resp)
		if resp["role"] != want {
			t.Errorf("role %q: response role = %v, want %s", role, resp["role"], want)
		}
	}
}

func TestTHSignupYearsStoredAsNumber(t *testing.T) {
	s, rec := thFakeServer(t)
	out := thPost(s.handleAuthSignup, "application/json", `{"email":"d@example.com","password":"password123","role":"doctor","yearsExperience":"12"}`)
	if out.Code != 200 {
		t.Fatalf("status %d %s", out.Code, out.Body.String())
	}
	if y, ok := rec.profiles[0]["years_experience"].(float64); !ok || y != 12 {
		t.Errorf("years_experience = %#v, want 12", rec.profiles[0]["years_experience"])
	}
}

func TestTHLoginAndResetValidation(t *testing.T) {
	s := &Server{Cfg: &config.Config{}}
	long := strings.Repeat("a", 300)
	thErrJSON(t, thPost(s.handleAuthLogin, "application/json", `{"email":"`+long+`@b.co","password":"password123"}`), http.StatusBadRequest)
	thErrJSON(t, thPost(s.handleAuthLogin, "application/json", `{"email":"a@b.co","password":"`+long+`"}`), http.StatusBadRequest)
	thErrJSON(t, thPost(s.handleAuthLogin, "application/json", `{"email":"   ","password":"password123"}`), http.StatusBadRequest)
	thErrJSON(t, thPost(s.handleResetPassword, "application/json", `{"token_hash":"t","password":"short"}`), http.StatusBadRequest)
	thErrJSON(t, thPost(s.handleResetPassword, "application/json", `{"token_hash":"t","password":"        "}`), http.StatusBadRequest)
	thErrJSON(t, thPost(s.handleResetPassword, "application/json", `{"token_hash":"t","password":"`+strings.Repeat("p", 129)+`"}`), http.StatusBadRequest)
}

// ---- cookie ----

func TestTHLogoutCookieAttributes(t *testing.T) {
	s := &Server{Cfg: &config.Config{}}
	r := httptest.NewRequest(http.MethodPost, "/api/auth/logout", nil)
	r.Header.Set("X-Forwarded-Proto", "https")
	rec := httptest.NewRecorder()
	s.handleAuthLogout(rec, r)
	c := rec.Result().Cookies()[0]
	if !c.Secure || !c.HttpOnly || c.SameSite != http.SameSiteLaxMode || c.MaxAge >= 0 {
		t.Fatalf("logout cookie %+v", c)
	}
}

// ---- body limit middleware ----

func TestTHBodyLimit(t *testing.T) {
	var read int64
	h := withBodyLimit(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		n, err := io.Copy(io.Discard, r.Body)
		read = n
		if err != nil {
			dtWriteError(w, http.StatusRequestEntityTooLarge, "too big")
			return
		}
		w.WriteHeader(http.StatusNoContent)
	}))
	do := func(method, path, ctype string, size int, chunked bool) *httptest.ResponseRecorder {
		var body io.Reader = strings.NewReader(strings.Repeat("a", size))
		r := httptest.NewRequest(method, path, body)
		if chunked {
			r.ContentLength = -1
		}
		if ctype != "" {
			r.Header.Set("Content-Type", ctype)
		}
		rec := httptest.NewRecorder()
		h.ServeHTTP(rec, r)
		return rec
	}
	const mb = 1 << 20
	if c := do("POST", "/api/chat", "application/json", 3*mb, false).Code; c != 413 {
		t.Errorf("3MB to default endpoint = %d, want 413", c)
	}
	if c := do("PUT", "/api/patient/profile", "application/json", 2*mb+1, false).Code; c != 413 {
		t.Errorf("2MB+1 = %d, want 413", c)
	}
	if c := do("POST", "/api/chat", "application/json", 2*mb, false).Code; c != 204 {
		t.Errorf("exactly 2MB = %d, want 204", c)
	}
	// chunked / unknown length is still capped by MaxBytesReader
	if c := do("POST", "/api/chat", "application/json", 3*mb, true).Code; c != 413 || read > 2*mb {
		t.Errorf("chunked 3MB = %d (read %d), want 413 with <=2MB read", c, read)
	}
	for _, p := range []string{"/api/analyze-image", "/api/analyze-audio", "/api/analyze-snore", "/api/extract-text", "/api/validate-medicine"} {
		if c := do("POST", p, "application/json", 20*mb, false).Code; c != 204 {
			t.Errorf("20MB to %s = %d, want 204", p, c)
		}
		if c := do("POST", p, "application/json", 31*mb, false).Code; c != 413 {
			t.Errorf("31MB to %s = %d, want 413", p, c)
		}
	}
	if c := do("POST", "/api/auth/logout", "", 0, false).Code; c != 204 {
		t.Errorf("bodiless POST = %d, want 204", c)
	}
	if c := do("GET", "/api/doctors", "", 0, false).Code; c != 204 {
		t.Errorf("GET = %d, want 204", c)
	}
}

// ---- static handler ----

func TestTHStaticHandler(t *testing.T) {
	fsys := fstest.MapFS{
		"static/css/app.css": {Data: []byte("body{}")},
		"static/js/a.js":     {Data: []byte("var a=1;")},
	}
	h := staticHandler(fsys)
	get := func(method, target string) *httptest.ResponseRecorder {
		rec := httptest.NewRecorder()
		h.ServeHTTP(rec, httptest.NewRequest(method, target, nil))
		return rec
	}
	for _, d := range []string{"/static/", "/static/js/", "/static/css/", "/static/js", "/static/css", "/static"} {
		if c := get("GET", d).Code; c != 404 {
			t.Errorf("%s = %d, want 404 (no listing)", d, c)
		}
	}
	if c := get("GET", "/static/missing.js").Code; c != 404 {
		t.Errorf("missing = %d", c)
	}
	for _, m := range []string{"POST", "PUT", "DELETE", "PATCH"} {
		rec := get(m, "/static/css/app.css")
		if rec.Code != 405 || rec.Header().Get("Allow") == "" {
			t.Errorf("%s = %d allow=%q, want 405+Allow", m, rec.Code, rec.Header().Get("Allow"))
		}
	}
	v := get("GET", "/static/css/app.css?v=123456789")
	if v.Code != 200 || !strings.Contains(v.Header().Get("Cache-Control"), "immutable") {
		t.Errorf("versioned = %d cc=%q", v.Code, v.Header().Get("Cache-Control"))
	}
	u := get("GET", "/static/css/app.css")
	if u.Code != 200 || u.Header().Get("Cache-Control") != "no-cache" {
		t.Errorf("unversioned = %d cc=%q", u.Code, u.Header().Get("Cache-Control"))
	}
	if h := get("HEAD", "/static/js/a.js"); h.Code != 200 || h.Body.Len() != 0 {
		t.Errorf("HEAD = %d bodylen=%d", h.Code, h.Body.Len())
	}
	// ETag revalidation
	etag := u.Header().Get("ETag")
	if etag == "" {
		t.Fatal("no ETag")
	}
	rec := httptest.NewRecorder()
	r := httptest.NewRequest("GET", "/static/css/app.css", nil)
	r.Header.Set("If-None-Match", etag)
	h.ServeHTTP(rec, r)
	if rec.Code != http.StatusNotModified {
		t.Errorf("conditional GET = %d, want 304", rec.Code)
	}
}

// ---- pages ----

func TestTHRobotsDisallowsPrivatePages(t *testing.T) {
	s := &Server{Cfg: &config.Config{PublicBaseURL: "https://tcm.example"}}
	rec := httptest.NewRecorder()
	s.handleRobots(rec, httptest.NewRequest("GET", "/robots.txt", nil))
	for _, p := range []string{"/api/", "/patient", "/doctor", "/admin"} {
		if !strings.Contains(rec.Body.String(), "Disallow: "+p+"\n") {
			t.Errorf("robots.txt missing Disallow: %s\n%s", p, rec.Body.String())
		}
	}
}

func TestTHRequireAuthRequiresJSONContentType(t *testing.T) {
	s := TAuthFakeSupabase(t, map[string]string{"tok": "patient"})
	h := s.RequireAuth(func(w http.ResponseWriter, r *http.Request, u *AuthUser) { w.WriteHeader(http.StatusNoContent) })
	do := func(method, token, ctype, body string) int {
		r := httptest.NewRequest(method, "/x", strings.NewReader(body))
		if token != "" {
			r.Header.Set("Authorization", "Bearer "+token)
		}
		if ctype != "" {
			r.Header.Set("Content-Type", ctype)
		}
		rec := httptest.NewRecorder()
		h(rec, r)
		return rec.Code
	}
	if c := do("POST", "", "text/plain", "{}"); c != 401 {
		t.Errorf("anon text/plain = %d, want 401 (auth before content-type)", c)
	}
	if c := do("POST", "tok", "text/plain", "{}"); c != 400 {
		t.Errorf("authed text/plain = %d, want 400", c)
	}
	if c := do("PUT", "tok", "", "{}"); c != 400 {
		t.Errorf("authed no content-type = %d, want 400", c)
	}
	if c := do("POST", "tok", "application/json; charset=utf-8", "{}"); c != 204 {
		t.Errorf("authed json = %d, want 204", c)
	}
	if c := do("POST", "tok", "", ""); c != 204 {
		t.Errorf("authed bodiless POST = %d, want 204", c)
	}
	if c := do("GET", "tok", "", ""); c != 204 {
		t.Errorf("authed GET = %d, want 204", c)
	}
}
