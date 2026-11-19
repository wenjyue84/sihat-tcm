package server

import (
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"sync"
	"testing"

	"sihattcm/internal/supabase"
)

func TestValidID(t *testing.T) {
	good := []string{"abc", "123", "3f2b8c1e-aaaa-4bbb-8ccc-0123456789ab", "pat_1-x", strings.Repeat("a", 64)}
	bad := []string{"", "x&user_id=neq.zzz", "x%26y", "neq.zzz", "in.(a,b)", "x,y", "x)", "*", "x#", "x\nid=neq.0", "a b", strings.Repeat("a", 65)}
	for _, g := range good {
		if !validID(g) {
			t.Errorf("validID(%q) = false, want true", g)
		}
	}
	for _, b := range bad {
		if validID(b) {
			t.Errorf("validID(%q) = true, want false", b)
		}
	}
}

// ddFake is a minimal GoTrue + PostgREST stand-in recording every REST call.
type ddFake struct {
	mu        sync.Mutex
	calls     []string // "METHOD request-uri"
	bodies    []string
	roles     map[string]string // token -> role
	doctors   map[string]bool   // doctor profile ids
	inquiry   bool              // whether inquiries lookups find a row
	directory string            // canned JSON for the public doctor-directory query
}

func newDDServer(t *testing.T, f *ddFake) *Server {
	t.Helper()
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		b, _ := io.ReadAll(r.Body)
		f.mu.Lock()
		f.calls = append(f.calls, r.Method+" "+r.URL.RequestURI())
		f.bodies = append(f.bodies, string(b))
		f.mu.Unlock()
		q := r.URL.Query()
		switch {
		case r.URL.Path == "/auth/v1/user":
			tok := strings.TrimPrefix(r.Header.Get("Authorization"), "Bearer ")
			if _, ok := f.roles[tok]; !ok {
				w.WriteHeader(http.StatusUnauthorized)
				return
			}
			_, _ = w.Write([]byte(`{"id":"uid-` + tok + `","email":"` + tok + `@x.test"}`))
		case strings.HasPrefix(r.URL.Path, "/rest/v1/profiles"):
			id := strings.TrimPrefix(q.Get("id"), "eq.")
			if strings.HasPrefix(id, "uid-") {
				_, _ = w.Write([]byte(`[{"role":"` + f.roles[strings.TrimPrefix(id, "uid-")] + `"}]`))
				return
			}
			if q.Get("role") == "eq.doctor" && id == "" && f.directory != "" {
				_, _ = w.Write([]byte(f.directory))
				return
			}
			if q.Get("role") == "eq.doctor" && f.doctors[id] {
				_, _ = w.Write([]byte(`[{"id":"` + id + `"}]`))
				return
			}
			_, _ = w.Write([]byte(`[]`))
		case strings.HasPrefix(r.URL.Path, "/rest/v1/inquiries") && r.Method == http.MethodPost:
			_, _ = w.Write([]byte(`[{"id":"new-req"}]`))
		case strings.HasPrefix(r.URL.Path, "/rest/v1/inquiries"):
			if f.inquiry {
				_, _ = w.Write([]byte(`[{"id":"r1","diagnosis_report":{}}]`))
			} else {
				_, _ = w.Write([]byte(`[]`))
			}
		case strings.HasPrefix(r.URL.Path, "/rest/v1/guest_diagnosis_sessions"):
			_, _ = w.Write([]byte(`[{"id":"g1"}]`))
		default:
			_, _ = w.Write([]byte(`[]`))
		}
	}))
	t.Cleanup(ts.Close)
	s := &Server{DB: supabase.New(ts.URL, "anon", "")}
	s.Mux = http.NewServeMux()
	s.registerDataRoutes()
	s.registerDoctorRoutes()
	s.registerNotificationRoutes()
	return s
}

func ddDo(s *Server, method, path, token, body string) *httptest.ResponseRecorder {
	r := httptest.NewRequest(method, path, strings.NewReader(body))
	r.Header.Set("Content-Type", "application/json")
	if token != "" {
		r.Header.Set("Authorization", "Bearer "+token)
	}
	rec := httptest.NewRecorder()
	s.Mux.ServeHTTP(rec, r)
	return rec
}

// posted returns the body of the first recorded call whose line starts with prefix.
func (f *ddFake) posted(prefix string) string {
	f.mu.Lock()
	defer f.mu.Unlock()
	for i, c := range f.calls {
		if strings.HasPrefix(c, prefix) {
			return f.bodies[i]
		}
	}
	return ""
}

func TestDDPatientSummaryRoleGate(t *testing.T) {
	f := &ddFake{roles: map[string]string{"pat": "patient", "doc": "doctor"}}
	s := newDDServer(t, f)
	if rec := ddDo(s, "POST", "/api/ai/patient-summary", "", `{"patientId":"p1"}`); rec.Code != 401 {
		t.Errorf("anon = %d, want 401", rec.Code)
	}
	if rec := ddDo(s, "POST", "/api/ai/patient-summary", "pat", `{"patientId":"p1"}`); rec.Code != 403 {
		t.Errorf("patient = %d, want 403", rec.Code)
	}
	if rec := ddDo(s, "POST", "/api/ai/patient-summary", "doc", `{"patientId":"x&id=neq.0"}`); rec.Code != 400 {
		t.Errorf("doctor bad id = %d, want 400", rec.Code)
	}
	if rec := ddDo(s, "POST", "/api/ai/patient-summary", "doc", `{"patientId":"nope"}`); rec.Code != 404 {
		t.Errorf("doctor unknown id = %d, want 404", rec.Code)
	}
}

func TestDDVerificationRequest(t *testing.T) {
	f := &ddFake{roles: map[string]string{"pat": "patient"}, doctors: map[string]bool{"11111111-1111-4111-8111-111111111111": true}}
	s := newDDServer(t, f)

	if rec := ddDo(s, "POST", "/api/verification-request", "", `{"userId":"victim","doctorId":"11111111-1111-4111-8111-111111111111","doctorName":"Dr"}`); rec.Code != 401 {
		t.Fatalf("anon = %d, want 401", rec.Code)
	}
	for _, bad := range []string{"a&b", "d1", "ghost", "not-a-uuid"} { // slug-safe but not a uuid -> would be a DB 500
		if rec := ddDo(s, "POST", "/api/verification-request", "pat", `{"doctorId":"`+bad+`","doctorName":"Dr"}`); rec.Code != 400 {
			t.Errorf("bad doctorId %q = %d, want 400", bad, rec.Code)
		}
	}
	if rec := ddDo(s, "POST", "/api/verification-request", "pat", `{"doctorId":"22222222-2222-4222-8222-222222222222","doctorName":"Dr"}`); rec.Code != 404 {
		t.Errorf("unknown doctor = %d, want 404", rec.Code)
	}
	rec := ddDo(s, "POST", "/api/verification-request", "pat", `{"userId":"victim","doctorId":"11111111-1111-4111-8111-111111111111","doctorName":"Dr"}`)
	if rec.Code != 200 {
		t.Fatalf("valid = %d body=%s", rec.Code, rec.Body)
	}
	posted := f.posted("POST /rest/v1/inquiries")
	if !strings.Contains(posted, `"user_id":"uid-pat"`) || strings.Contains(posted, "victim") {
		t.Errorf("user_id must be forced to the caller; inserted %s", posted)
	}
}

func TestDDDoctorEndpointsBadAndMissingIDs(t *testing.T) {
	f := &ddFake{roles: map[string]string{"doc": "doctor", "pat": "patient"}}
	s := newDDServer(t, f)
	for _, v := range []string{"x&user_id=neq.zzz", "x,y", "*", "in.(a,b)"} {
		for _, c := range []struct{ path, body string }{
			{"/api/doctor/reply", `{"requestId":"` + v + `","message":"m","targetTable":"inquiries"}`},
			{"/api/doctor/flag", `{"requestId":"` + v + `","flag":"watch"}`},
			{"/api/doctor/treatment-plan", `{"requestId":"` + v + `","plan":{"a":1}}`},
		} {
			if rec := ddDo(s, "POST", c.path, "doc", c.body); rec.Code != 400 {
				t.Errorf("%s id %q = %d, want 400", c.path, v, rec.Code)
			}
		}
		if rec := ddDo(s, "POST", "/api/patient/reply", "pat", `{"requestId":"`+v+`","message":"m"}`); rec.Code != 400 {
			t.Errorf("patient/reply id %q = %d, want 400", v, rec.Code)
		}
		if rec := ddDo(s, "POST", "/api/patient/requests/cancel", "pat", `{"id":"`+v+`"}`); rec.Code != 400 {
			t.Errorf("cancel id %q = %d, want 400", v, rec.Code)
		}
	}
	// well-formed but nonexistent id -> 404, not 200
	for _, c := range []struct{ path, body string }{
		{"/api/doctor/reply", `{"requestId":"nope","message":"m","targetTable":"inquiries"}`},
		{"/api/doctor/flag", `{"requestId":"nope","flag":"watch"}`},
		{"/api/doctor/treatment-plan", `{"requestId":"nope","plan":{"a":1}}`},
	} {
		if rec := ddDo(s, "POST", c.path, "doc", c.body); rec.Code != 404 {
			t.Errorf("%s missing id = %d, want 404", c.path, rec.Code)
		}
	}
}

func TestDDReplyAndProfileCaps(t *testing.T) {
	f := &ddFake{roles: map[string]string{"doc": "doctor", "pat": "patient"}, inquiry: true}
	s := newDDServer(t, f)
	long := strings.Repeat("a", maxReplyChars+1)
	if rec := ddDo(s, "POST", "/api/doctor/reply", "doc", `{"requestId":"r1","message":"`+long+`","targetTable":"inquiries"}`); rec.Code != 400 {
		t.Errorf("long doctor reply = %d, want 400", rec.Code)
	}
	if rec := ddDo(s, "POST", "/api/patient/reply", "pat", `{"requestId":"r1","message":"`+long+`"}`); rec.Code != 400 {
		t.Errorf("long patient reply = %d, want 400", rec.Code)
	}
	for _, body := range []string{`{"age":"old"}`, `{"height":{"a":1}}`, `{"weight":[1]}`, `{"full_name":{"x":1}}`, `{"age":true}`} {
		if rec := ddDo(s, "PUT", "/api/patient/profile", "pat", body); rec.Code != 400 {
			t.Errorf("profile %s = %d, want 400", body, rec.Code)
		}
	}
	if rec := ddDo(s, "PUT", "/api/patient/profile", "pat", `{"age":30,"height":170.5,"weight":60,"full_name":"A"}`); rec.Code != 200 {
		t.Errorf("valid profile = %d body=%s", rec.Code, rec.Body)
	}
}

func TestDDDoctorsDirectoryOnlyDemoDoctorsExposeEmail(t *testing.T) {
	f := &ddFake{roles: map[string]string{}, directory: `[
		{"id":"d1","email":"real.doctor@clinic.example","full_name":"Dr Real"},
		{"id":"d2","email":"Doctor@Sihat.com","full_name":"Dr Demo"},
		{"id":"d3","full_name":"Dr NoMail"}]`}
	s := newDDServer(t, f)
	rec := ddDo(s, "GET", "/api/doctors", "", "")
	if rec.Code != 200 {
		t.Fatalf("status %d", rec.Code)
	}
	var out struct {
		Doctors []map[string]any `json:"doctors"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &out); err != nil {
		t.Fatal(err)
	}
	byID := map[string]map[string]any{}
	for _, d := range out.Doctors {
		byID[d["id"].(string)] = d
	}
	if _, has := byID["d1"]["email"]; has {
		t.Errorf("real doctor's email leaked: %v", byID["d1"])
	}
	if byID["d2"]["email"] != "Doctor@Sihat.com" {
		t.Errorf("demo doctor email must stay for the login quick-access dropdown: %v", byID["d2"])
	}
	if _, has := byID["d3"]["email"]; has {
		t.Errorf("unexpected email on d3: %v", byID["d3"])
	}
}

func TestDDGuestSessionCreate(t *testing.T) {
	f := &ddFake{roles: map[string]string{}}
	s := newDDServer(t, f)
	if rec := ddDo(s, "POST", "/api/guest/sessions", "", `null`); rec.Code != 400 {
		t.Errorf("null body = %d, want 400", rec.Code)
	}
	if rec := ddDo(s, "POST", "/api/guest/sessions", "", `{`); rec.Code != 400 {
		t.Errorf("bad json = %d, want 400", rec.Code)
	}
	big := `{"full_report":"` + strings.Repeat("a", guestBodyMax+10) + `"}`
	if rec := ddDo(s, "POST", "/api/guest/sessions", "", big); rec.Code != 413 {
		t.Errorf("oversize = %d, want 413", rec.Code)
	}
	rec := ddDo(s, "POST", "/api/guest/sessions", "",
		`{"id":"x","user_id":"u","migrated_to_user_id":"victim","created_at":"2000-01-01","session_token":"known","primary_diagnosis":"Qi","full_report":{"a":1}}`)
	if rec.Code != 201 {
		t.Fatalf("create = %d body=%s", rec.Code, rec.Body)
	}
	posted := f.posted("POST /rest/v1/guest_diagnosis_sessions")
	for _, k := range []string{`"id"`, `"user_id"`, "migrated_to_user_id", "created_at", `"known"`} {
		if strings.Contains(posted, k) {
			t.Errorf("server-controlled field %s reached the DB: %s", k, posted)
		}
	}
}

func TestDDNotificationIDsAndDeviceTokens(t *testing.T) {
	f := &ddFake{roles: map[string]string{"pat": "patient"}}
	s := newDDServer(t, f)
	if rec := ddDo(s, "DELETE", "/api/notifications/schedule?id="+url.QueryEscape("x&user_id=neq.zzz"), "pat", ""); rec.Code != 400 {
		t.Errorf("bad notification id = %d, want 400", rec.Code)
	}
	if rec := ddDo(s, "DELETE", "/api/notifications/register-device?deviceToken="+url.QueryEscape("ExponentPushToken[a]&user_id=neq.z"), "pat", ""); rec.Code != 200 {
		t.Fatalf("deregister = %d", rec.Code)
	}
	f.mu.Lock()
	defer f.mu.Unlock()
	for _, c := range f.calls {
		if strings.HasPrefix(c, "PATCH /rest/v1/user_devices") && strings.Contains(c, "&user_id=neq") {
			t.Errorf("device token injected a filter: %s", c)
		}
	}
}

func TestDDRedactURLErrHidesToken(t *testing.T) {
	_, err := http.NewRequest(http.MethodPost, "https://api.telegram.org/bot123:SECRET\x7f/sendMessage", nil)
	if err == nil {
		t.Skip("URL unexpectedly parsed")
	}
	if got := dtRedactURLErr(err).Error(); strings.Contains(got, "SECRET") {
		t.Errorf("redacted error leaks token: %q", got)
	}
	if got := dtRedactURLErr(errors.New("boom SECRET")).Error(); strings.Contains(got, "SECRET") {
		t.Errorf("non-url error leaked: %q", got)
	}
}

func TestDDSessionRequiredFields(t *testing.T) {
	cases := []struct {
		name string
		in   map[string]any
		want string
		pd   string
	}{
		{"missing report", map[string]any{"primary_diagnosis": "x"}, "full_report is required", ""},
		{"nil report", map[string]any{"full_report": nil}, "full_report is required", ""},
		{"no diagnosis anywhere", map[string]any{"full_report": map[string]any{"a": 1}}, "primary_diagnosis is required", ""},
		{"derived from pattern", map[string]any{"full_report": map[string]any{"diagnosis": map[string]any{"primary_pattern": "Qi deficiency"}}}, "", "Qi deficiency"},
		{"derived from string diagnosis", map[string]any{"full_report": map[string]any{"diagnosis": "Yin deficiency"}}, "", "Yin deficiency"},
		{"explicit wins", map[string]any{"full_report": map[string]any{}, "primary_diagnosis": "Given"}, "", "Given"},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			if got := dtEnsureSessionRequired(c.in); got != c.want {
				t.Fatalf("msg %q, want %q", got, c.want)
			}
			if c.want == "" && c.in["primary_diagnosis"] != c.pd {
				t.Fatalf("primary_diagnosis %v, want %q", c.in["primary_diagnosis"], c.pd)
			}
		})
	}
}
