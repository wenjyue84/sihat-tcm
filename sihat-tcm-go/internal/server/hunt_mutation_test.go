package server

// Regression tests added after MUTATION TESTING (regress/suites/hunt_mutation.mjs documents the method): each test
// kills a mutant of internal/server that every earlier test left green.

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"sihattcm/internal/supabase"
)

// m05: writeMethod() must treat all four state-changing verbs as state-changing. DELETE (notification device /
// schedule removal) used to be unprotected by the JSON-content-type (anti-CSRF) gate without any test noticing.
func TestHMWriteMethodCoversEveryStateChangingVerb(t *testing.T) {
	for _, m := range []string{"POST", "PUT", "PATCH", "DELETE"} {
		if !writeMethod(m) {
			t.Errorf("writeMethod(%s) = false, want true", m)
		}
	}
	for _, m := range []string{"GET", "HEAD", "OPTIONS", "TRACE", "CONNECT"} {
		if writeMethod(m) {
			t.Errorf("writeMethod(%s) = true, want false", m)
		}
	}
}

func TestHMRequireAuthJSONGateAppliesToDeleteAndPatch(t *testing.T) {
	s := TAuthFakeSupabase(t, map[string]string{"tok": "patient"})
	h := s.RequireAuth(func(w http.ResponseWriter, r *http.Request, u *AuthUser) { w.WriteHeader(http.StatusNoContent) })
	do := func(method, ctype, body string) int {
		r := httptest.NewRequest(method, "/x", strings.NewReader(body))
		r.Header.Set("Authorization", "Bearer tok")
		if ctype != "" {
			r.Header.Set("Content-Type", ctype)
		}
		rec := httptest.NewRecorder()
		h(rec, r)
		return rec.Code
	}
	for _, m := range []string{"DELETE", "PATCH", "PUT"} {
		if c := do(m, "text/plain", "id=1"); c != http.StatusBadRequest {
			t.Errorf("%s text/plain = %d, want 400", m, c)
		}
		if c := do(m, "", "id=1"); c != http.StatusBadRequest {
			t.Errorf("%s without content-type = %d, want 400", m, c)
		}
		if c := do(m, "application/json", "{}"); c != http.StatusNoContent {
			t.Errorf("%s json = %d, want 204", m, c)
		}
		if c := do(m, "", ""); c != http.StatusNoContent {
			t.Errorf("bodiless %s = %d, want 204", m, c)
		}
	}
}

// m08/m80 family: the per-route rate-limit budgets are configuration baked into registerAuthRoutes /
// registerAdminRoutes; a changed constant (login 100/day -> 1000/day) used to pass every test because only the
// RateLimit() function itself was exercised with its own made-up numbers. This pins the real budgets.
func TestHMRouteRateLimitBudgets(t *testing.T) {
	s := &Server{DB: supabase.New("http://127.0.0.1:1", "anon", "")}
	s.Mux = http.NewServeMux()
	s.registerAuthRoutes()
	s.registerAdminRoutes()

	routes := []struct {
		path           string
		perMin, perDay int
	}{
		{"/api/auth/login", 10, 100},
		{"/api/auth/signup", 5, 20},
		{"/api/auth/forgot-password", 3, 10},
		{"/api/auth/reset-password", 5, 20},
		{"/api/logs", 60, 2000},
		{"/api/monitoring/metrics", 60, 2000},
	}
	// "{" is invalid JSON: every handler answers 400 before touching the (unreachable) database.
	send := func(ip, path string) int {
		r := httptest.NewRequest(http.MethodPost, path, strings.NewReader("{"))
		r.Header.Set("Content-Type", "application/json")
		r.RemoteAddr = "127.0.0.1:1"
		r.Header.Set("X-Forwarded-For", ip)
		rec := httptest.NewRecorder()
		s.Mux.ServeHTTP(rec, r)
		return rec.Code
	}
	for i, rt := range routes {
		minIP := "10.77.1." + string(rune('1'+i))
		for n := 1; n <= rt.perMin; n++ {
			if c := send(minIP, rt.path); c != http.StatusBadRequest {
				t.Fatalf("%s request %d/%d (per-minute budget) = %d, want 400 (handler reached)", rt.path, n, rt.perMin, c)
			}
		}
		if c := send(minIP, rt.path); c != http.StatusTooManyRequests {
			t.Errorf("%s request %d = %d, want 429 (per-minute budget is %d)", rt.path, rt.perMin+1, c, rt.perMin)
		}

		// daily budget: reset only the minute window between calls so the day counter is what trips
		dayIP := "10.77.2." + string(rune('1'+i))
		key := dayIP + "|" + rt.path
		resetMinute := func() {
			rateMu.Lock()
			if w := rateMap[key]; w != nil {
				w.minuteCount = 0
				w.minuteStart = time.Now()
			}
			rateMu.Unlock()
		}
		for n := 1; n <= rt.perDay; n++ {
			resetMinute()
			if c := send(dayIP, rt.path); c != http.StatusBadRequest {
				t.Fatalf("%s request %d/%d (per-day budget) = %d, want 400", rt.path, n, rt.perDay, c)
			}
		}
		resetMinute()
		if c := send(dayIP, rt.path); c != http.StatusTooManyRequests {
			t.Errorf("%s request %d = %d, want 429 (per-day budget is %d)", rt.path, rt.perDay+1, c, rt.perDay)
		}
	}
}

// m71: handleGuestSessionCreate carries its OWN 2 MB cap (defence in depth behind withBodyLimit). Called without the
// middleware, a 3 MB anonymous upload must still be refused with 413 before anything is stored.
func TestHMGuestSessionHandlerCapsItsOwnBody(t *testing.T) {
	s := &Server{DB: supabase.New("http://127.0.0.1:1", "anon", "")}
	big := `{"primary_diagnosis":"x","full_report":{"pad":"` + strings.Repeat("a", 3<<20) + `"}}`
	r := httptest.NewRequest(http.MethodPost, "/api/guest/sessions", strings.NewReader(big))
	r.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	s.handleGuestSessionCreate(rec, r)
	if rec.Code != http.StatusRequestEntityTooLarge {
		t.Fatalf("3 MB guest session = %d, want 413 (%s)", rec.Code, rec.Body.String())
	}
	small := `{"primary_diagnosis":"x","full_report":{"pad":"` + strings.Repeat("a", 1<<20) + `"}}`
	r2 := httptest.NewRequest(http.MethodPost, "/api/guest/sessions", strings.NewReader(small))
	r2.Header.Set("Content-Type", "application/json")
	rec2 := httptest.NewRecorder()
	s.handleGuestSessionCreate(rec2, r2)
	if rec2.Code == http.StatusRequestEntityTooLarge {
		t.Fatalf("1 MB guest session must not be refused as too large")
	}
}
