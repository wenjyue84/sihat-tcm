package supabase

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

type tcfgReq struct {
	Method, Path, RawQuery string
	Header                 http.Header
	Body                   string
}

// tcfgServer starts a fake backend that records the last request and replies with status/body.
func tcfgServer(t *testing.T, status int, body string) (*httptest.Server, *tcfgReq) {
	t.Helper()
	rec := &tcfgReq{}
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		b, _ := io.ReadAll(r.Body)
		rec.Method, rec.Path, rec.RawQuery, rec.Header, rec.Body = r.Method, r.URL.Path, r.URL.RawQuery, r.Header.Clone(), string(b)
		w.WriteHeader(status)
		_, _ = w.Write([]byte(body))
	}))
	t.Cleanup(srv.Close)
	return srv, rec
}

func TestTCfgNewAndConfigured(t *testing.T) {
	c := New("https://x.supabase.co", "anon", "svc")
	if c.BaseURL != "https://x.supabase.co" || c.AnonKey != "anon" || c.ServiceKey != "svc" {
		t.Errorf("fields wrong: %+v", c)
	}
	if c.HTTP == nil || c.HTTP.Timeout.Seconds() != 30 {
		t.Errorf("HTTP client timeout not 30s: %+v", c.HTTP)
	}
	tests := []struct {
		name      string
		url, anon string
		want      bool
	}{
		{"both", "u", "a", true},
		{"no url", "", "a", false},
		{"no anon", "u", "", false},
		{"neither", "", "", false},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := New(tt.url, tt.anon, "").Configured(); got != tt.want {
				t.Errorf("Configured = %v", got)
			}
		})
	}
}

func TestTCfgNotConfiguredErrors(t *testing.T) {
	c := New("", "", "")
	ctx := context.Background()
	calls := map[string]func() error{
		"SignInPassword":       func() error { _, e := c.SignInPassword(ctx, "a", "b"); return e },
		"SignUp":               func() error { _, e := c.SignUp(ctx, "a", "b", nil); return e },
		"GetUser":              func() error { _, e := c.GetUser(ctx, "t"); return e },
		"RequestPasswordReset": func() error { return c.RequestPasswordReset(ctx, "a", "") },
		"VerifyRecovery":       func() error { _, e := c.VerifyRecovery(ctx, "h"); return e },
		"UpdatePassword":       func() error { return c.UpdatePassword(ctx, "t", "p") },
		"Select":               func() error { return c.Select(ctx, "t", "", "", nil) },
		"Insert":               func() error { return c.Insert(ctx, "t", map[string]int{}, "", nil) },
		"Upsert":               func() error { return c.Upsert(ctx, "t", map[string]int{}, "", nil) },
		"Update":               func() error { return c.Update(ctx, "t", "id=eq.1", map[string]int{}, "", nil) },
		"Delete":               func() error { return c.Delete(ctx, "t", "id=eq.1", "") },
	}
	for name, fn := range calls {
		t.Run(name, func(t *testing.T) {
			err := fn()
			if err == nil || !strings.Contains(err.Error(), "not configured") {
				t.Errorf("err = %v", err)
			}
		})
	}
}

func TestTCfgAPIKeyAndBearer(t *testing.T) {
	withSvc := New("u", "anon", "svc")
	noSvc := New("u", "anon", "")
	if withSvc.apiKey() != "svc" || noSvc.apiKey() != "anon" {
		t.Errorf("apiKey: %q %q", withSvc.apiKey(), noSvc.apiKey())
	}
	if withSvc.bearer("") != "svc" || noSvc.bearer("") != "anon" {
		t.Errorf("bearer fallback wrong")
	}
	if withSvc.bearer("user") != "user" {
		t.Errorf("user token should win")
	}
}

func TestTCfgSelectRequest(t *testing.T) {
	srv, rec := tcfgServer(t, 200, `[{"id":1},{"id":2}]`)
	c := New(srv.URL, "anon", "svc")
	var rows []map[string]int
	if err := c.Select(context.Background(), "diagnosis_drafts", "id=eq.1&select=*", "", &rows); err != nil {
		t.Fatal(err)
	}
	if len(rows) != 2 || rows[1]["id"] != 2 {
		t.Errorf("rows = %v", rows)
	}
	if rec.Method != "GET" || rec.Path != "/rest/v1/diagnosis_drafts" || rec.RawQuery != "id=eq.1&select=*" {
		t.Errorf("req = %+v", rec)
	}
	if rec.Header.Get("apikey") != "svc" || rec.Header.Get("Authorization") != "Bearer svc" {
		t.Errorf("headers = %v", rec.Header)
	}
	if rec.Header.Get("Content-Type") != "" {
		t.Errorf("GET without body should not set Content-Type")
	}
}

func TestTCfgSelectNoQueryAndUserToken(t *testing.T) {
	srv, rec := tcfgServer(t, 200, `[]`)
	c := New(srv.URL, "anon", "")
	var rows []any
	if err := c.Select(context.Background(), "profiles", "", "usertok", &rows); err != nil {
		t.Fatal(err)
	}
	if rec.RawQuery != "" || rec.Path != "/rest/v1/profiles" {
		t.Errorf("req = %+v", rec)
	}
	if rec.Header.Get("apikey") != "anon" || rec.Header.Get("Authorization") != "Bearer usertok" {
		t.Errorf("headers = %v", rec.Header)
	}
}

func TestTCfgTableNamePathEscaped(t *testing.T) {
	srv, rec := tcfgServer(t, 200, `[]`)
	c := New(srv.URL, "anon", "")
	_ = c.Select(context.Background(), "a/b c", "", "", nil)
	if rec.Path != "/rest/v1/a/b c" { // server decodes %2F; assert raw escaping via RawPath below
		// path decoded by net/http: "a%2Fb%20c" -> "a/b c"
		t.Errorf("decoded path = %q", rec.Path)
	}
}

func TestTCfgInsertAndUpsertPrefer(t *testing.T) {
	tests := []struct {
		name   string
		call   func(c *Client, out any) error
		prefer string
	}{
		{"Insert", func(c *Client, out any) error {
			return c.Insert(context.Background(), "t", map[string]string{"a": "b"}, "tok", out)
		}, "return=representation"},
		{"Upsert", func(c *Client, out any) error {
			return c.Upsert(context.Background(), "t", map[string]string{"a": "b"}, "tok", out)
		}, "resolution=merge-duplicates,return=representation"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			srv, rec := tcfgServer(t, 201, `[{"a":"b"}]`)
			c := New(srv.URL, "anon", "svc")
			var out []map[string]string
			if err := tt.call(c, &out); err != nil {
				t.Fatal(err)
			}
			if rec.Method != "POST" || rec.Path != "/rest/v1/t" {
				t.Errorf("req = %+v", rec)
			}
			if rec.Header.Get("Prefer") != tt.prefer {
				t.Errorf("Prefer = %q", rec.Header.Get("Prefer"))
			}
			if rec.Header.Get("Content-Type") != "application/json" {
				t.Errorf("Content-Type = %q", rec.Header.Get("Content-Type"))
			}
			if rec.Header.Get("Authorization") != "Bearer tok" || rec.Header.Get("apikey") != "svc" {
				t.Errorf("headers = %v", rec.Header)
			}
			if rec.Body != `{"a":"b"}` || len(out) != 1 || out[0]["a"] != "b" {
				t.Errorf("body=%q out=%v", rec.Body, out)
			}
		})
	}
}

func TestTCfgInsertArrayBody(t *testing.T) {
	srv, rec := tcfgServer(t, 201, `[]`)
	c := New(srv.URL, "anon", "")
	if err := c.Insert(context.Background(), "t", []map[string]int{{"x": 1}, {"x": 2}}, "", nil); err != nil {
		t.Fatal(err)
	}
	if rec.Body != `[{"x":1},{"x":2}]` {
		t.Errorf("body = %q", rec.Body)
	}
}

func TestTCfgUpdateRequest(t *testing.T) {
	srv, rec := tcfgServer(t, 200, `[{"id":7,"name":"n"}]`)
	c := New(srv.URL, "anon", "")
	var out []map[string]any
	if err := c.Update(context.Background(), "profiles", "id=eq.7", map[string]string{"name": "n"}, "u", &out); err != nil {
		t.Fatal(err)
	}
	if rec.Method != "PATCH" || rec.Path != "/rest/v1/profiles" || rec.RawQuery != "id=eq.7" {
		t.Errorf("req = %+v", rec)
	}
	if rec.Header.Get("Prefer") != "return=representation" {
		t.Errorf("Prefer = %q", rec.Header.Get("Prefer"))
	}
	if len(out) != 1 {
		t.Errorf("out = %v", out)
	}
}

func TestTCfgDeleteRequest(t *testing.T) {
	srv, rec := tcfgServer(t, 204, ``)
	c := New(srv.URL, "anon", "svc")
	if err := c.Delete(context.Background(), "drafts", "id=eq.3", ""); err != nil {
		t.Fatal(err)
	}
	if rec.Method != "DELETE" || rec.Path != "/rest/v1/drafts" || rec.RawQuery != "id=eq.3" {
		t.Errorf("req = %+v", rec)
	}
	if rec.Header.Get("Authorization") != "Bearer svc" {
		t.Errorf("auth = %q", rec.Header.Get("Authorization"))
	}
}

func TestTCfgHTTPErrorMapping(t *testing.T) {
	long := strings.Repeat("x", 500)
	tests := []struct {
		name   string
		status int
		body   string
		want   []string
	}{
		{"400", 400, `{"message":"bad"}`, []string{"400", `{"message":"bad"}`, "GET /rest/v1/t"}},
		{"401", 401, `jwt expired`, []string{"401", "jwt expired"}},
		{"404", 404, ``, []string{"404"}},
		{"500", 500, `boom`, []string{"500", "boom"}},
		{"long body truncated", 502, long, []string{"502", strings.Repeat("x", 300) + "…"}},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			srv, _ := tcfgServer(t, tt.status, tt.body)
			c := New(srv.URL, "anon", "")
			err := c.Select(context.Background(), "t", "", "", nil)
			if err == nil {
				t.Fatal("expected error")
			}
			for _, w := range tt.want {
				if !strings.Contains(err.Error(), w) {
					t.Errorf("error %q missing %q", err.Error(), w)
				}
			}
			if tt.name == "long body truncated" && strings.Contains(err.Error(), strings.Repeat("x", 301)) {
				t.Errorf("body not truncated")
			}
		})
	}
}

func TestTCfgDecodeError(t *testing.T) {
	srv, _ := tcfgServer(t, 200, `not json`)
	c := New(srv.URL, "anon", "")
	var out []any
	err := c.Select(context.Background(), "t", "", "", &out)
	if err == nil || !strings.Contains(err.Error(), "decode") {
		t.Errorf("err = %v", err)
	}
}

func TestTCfgEmptyBodyWithOutIsOK(t *testing.T) {
	srv, _ := tcfgServer(t, 200, ``)
	c := New(srv.URL, "anon", "")
	var out []any
	if err := c.Select(context.Background(), "t", "", "", &out); err != nil {
		t.Errorf("err = %v", err)
	}
}

func TestTCfgTransportError(t *testing.T) {
	srv := httptest.NewServer(http.NotFoundHandler())
	url := srv.URL
	srv.Close()
	c := New(url, "anon", "")
	err := c.Select(context.Background(), "t", "", "", nil)
	if err == nil || !strings.HasPrefix(err.Error(), "supabase: ") {
		t.Errorf("err = %v", err)
	}
}

func TestTCfgContextCancelled(t *testing.T) {
	srv, _ := tcfgServer(t, 200, `[]`)
	c := New(srv.URL, "anon", "")
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	if err := c.Select(ctx, "t", "", "", nil); err == nil {
		t.Error("expected error for cancelled context")
	}
}

func TestTCfgBadBaseURL(t *testing.T) {
	c := New("http://bad host\x7f", "anon", "")
	if err := c.Select(context.Background(), "t", "", "", nil); err == nil {
		t.Error("expected error")
	}
}

func TestTCfgUnmarshalableBody(t *testing.T) {
	srv, _ := tcfgServer(t, 200, `[]`)
	c := New(srv.URL, "anon", "")
	if err := c.Insert(context.Background(), "t", make(chan int), "", nil); err == nil {
		t.Error("expected marshal error")
	}
}

func TestTCfgSignInPassword(t *testing.T) {
	tests := []struct {
		name    string
		status  int
		body    string
		wantErr string
	}{
		{"ok", 200, `{"access_token":"AT","refresh_token":"RT","expires_in":3600,"user":{"id":"u1"}}`, ""},
		{"msg", 200, `{"msg":"Invalid login"}`, "supabase auth: Invalid login"},
		{"error_description", 200, `{"error_description":"nope"}`, "supabase auth: nope"},
		{"msg beats desc", 200, `{"msg":"m","error_description":"d"}`, "supabase auth: m"},
		{"default", 200, `{}`, "supabase auth: invalid credentials"},
		{"http 400", 400, `{"error":"x"}`, "400"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			srv, rec := tcfgServer(t, tt.status, tt.body)
			c := New(srv.URL, "anon", "svc")
			s, err := c.SignInPassword(context.Background(), "a@b.c", "pw")
			if rec.Method != "POST" || rec.Path != "/auth/v1/token" || rec.RawQuery != "grant_type=password" {
				t.Errorf("req = %+v", rec)
			}
			// auth calls use the anon key, never the service key
			if rec.Header.Get("apikey") != "anon" || rec.Header.Get("Authorization") != "" {
				t.Errorf("auth headers = %v", rec.Header)
			}
			var sent map[string]string
			_ = json.Unmarshal([]byte(rec.Body), &sent)
			if sent["email"] != "a@b.c" || sent["password"] != "pw" {
				t.Errorf("body = %q", rec.Body)
			}
			if tt.wantErr == "" {
				if err != nil || s.AccessToken != "AT" || s.RefreshToken != "RT" || s.ExpiresIn != 3600 || !strings.Contains(string(s.User), "u1") {
					t.Errorf("s=%+v err=%v", s, err)
				}
				return
			}
			if err == nil || !strings.Contains(err.Error(), tt.wantErr) {
				t.Errorf("err = %v, want %q", err, tt.wantErr)
			}
		})
	}
}

func TestTCfgSignUp(t *testing.T) {
	srv, rec := tcfgServer(t, 200, `{"access_token":"AT","user":{"id":"n"}}`)
	c := New(srv.URL, "anon", "svc")
	s, err := c.SignUp(context.Background(), "e@x.y", "pw", map[string]any{"full_name": "Li"})
	if err != nil || s.AccessToken != "AT" {
		t.Fatalf("s=%+v err=%v", s, err)
	}
	if rec.Method != "POST" || rec.Path != "/auth/v1/signup" || rec.Header.Get("apikey") != "anon" {
		t.Errorf("req = %+v", rec)
	}
	var sent map[string]any
	_ = json.Unmarshal([]byte(rec.Body), &sent)
	data, _ := sent["data"].(map[string]any)
	if data["full_name"] != "Li" {
		t.Errorf("meta missing: %q", rec.Body)
	}

	// nil meta omits "data"; empty access token (email confirmation pending) is not an error.
	srv2, rec2 := tcfgServer(t, 200, `{"user":{"id":"n"}}`)
	s2, err := New(srv2.URL, "anon", "").SignUp(context.Background(), "e@x.y", "pw", nil)
	if err != nil || s2.AccessToken != "" {
		t.Errorf("s2=%+v err=%v", s2, err)
	}
	if strings.Contains(rec2.Body, `"data"`) {
		t.Errorf("nil meta must omit data: %q", rec2.Body)
	}
}

func TestTCfgSignUpHTTPError(t *testing.T) {
	srv, _ := tcfgServer(t, 422, `{"msg":"exists"}`)
	if _, err := New(srv.URL, "anon", "").SignUp(context.Background(), "e", "p", nil); err == nil || !strings.Contains(err.Error(), "422") {
		t.Errorf("err = %v", err)
	}
}

func TestTCfgGetUser(t *testing.T) {
	srv, rec := tcfgServer(t, 200, `{"id":"u1","email":"a@b.c"}`)
	c := New(srv.URL, "anon", "svc")
	u, err := c.GetUser(context.Background(), "mytoken")
	if err != nil {
		t.Fatal(err)
	}
	if rec.Method != "GET" || rec.Path != "/auth/v1/user" {
		t.Errorf("req = %+v", rec)
	}
	if rec.Header.Get("apikey") != "anon" || rec.Header.Get("Authorization") != "Bearer mytoken" {
		t.Errorf("headers = %v", rec.Header)
	}
	if !strings.Contains(string(u), `"u1"`) {
		t.Errorf("user = %s", u)
	}

	srv2, _ := tcfgServer(t, 401, `{"msg":"bad jwt"}`)
	if _, err := New(srv2.URL, "anon", "").GetUser(context.Background(), "x"); err == nil || !strings.Contains(err.Error(), "401") {
		t.Errorf("err = %v", err)
	}
}

func TestTCfgRequestPasswordReset(t *testing.T) {
	srv, rec := tcfgServer(t, 200, `{}`)
	c := New(srv.URL, "anon", "")
	if err := c.RequestPasswordReset(context.Background(), "a@b.c", "https://app.example.com/reset?x=1&y=2"); err != nil {
		t.Fatal(err)
	}
	if rec.Method != "POST" || rec.Path != "/auth/v1/recover" {
		t.Errorf("req = %+v", rec)
	}
	if rec.RawQuery != "redirect_to=https%3A%2F%2Fapp.example.com%2Freset%3Fx%3D1%26y%3D2" {
		t.Errorf("RawQuery = %q", rec.RawQuery)
	}
	if !strings.Contains(rec.Body, `"email":"a@b.c"`) {
		t.Errorf("body = %q", rec.Body)
	}

	srv2, rec2 := tcfgServer(t, 200, ``)
	if err := New(srv2.URL, "anon", "").RequestPasswordReset(context.Background(), "a@b.c", ""); err != nil {
		t.Fatal(err)
	}
	if rec2.RawQuery != "" {
		t.Errorf("no redirect -> no query, got %q", rec2.RawQuery)
	}

	srv3, _ := tcfgServer(t, 429, `rate limited`)
	if err := New(srv3.URL, "anon", "").RequestPasswordReset(context.Background(), "a", ""); err == nil || !strings.Contains(err.Error(), "429") {
		t.Errorf("err = %v", err)
	}
}

func TestTCfgVerifyRecovery(t *testing.T) {
	tests := []struct {
		name    string
		status  int
		body    string
		wantErr string
	}{
		{"ok", 200, `{"access_token":"RAT"}`, ""},
		{"msg", 200, `{"msg":"expired"}`, "supabase verify: expired"},
		{"desc", 200, `{"error_description":"bad hash"}`, "supabase verify: bad hash"},
		{"default", 200, `{}`, "supabase verify: invalid or expired recovery token"},
		{"http", 403, `forbidden`, "403"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			srv, rec := tcfgServer(t, tt.status, tt.body)
			s, err := New(srv.URL, "anon", "svc").VerifyRecovery(context.Background(), "HASH")
			if rec.Method != "POST" || rec.Path != "/auth/v1/verify" || rec.Header.Get("apikey") != "anon" {
				t.Errorf("req = %+v", rec)
			}
			var sent map[string]string
			_ = json.Unmarshal([]byte(rec.Body), &sent)
			if sent["type"] != "recovery" || sent["token_hash"] != "HASH" {
				t.Errorf("body = %q", rec.Body)
			}
			if tt.wantErr == "" {
				if err != nil || s.AccessToken != "RAT" {
					t.Errorf("s=%+v err=%v", s, err)
				}
				return
			}
			if err == nil || !strings.Contains(err.Error(), tt.wantErr) {
				t.Errorf("err = %v, want %q", err, tt.wantErr)
			}
		})
	}
}

func TestTCfgUpdatePassword(t *testing.T) {
	srv, rec := tcfgServer(t, 200, `{"id":"u"}`)
	c := New(srv.URL, "anon", "svc")
	if err := c.UpdatePassword(context.Background(), "rtok", "newpw"); err != nil {
		t.Fatal(err)
	}
	if rec.Method != "PUT" || rec.Path != "/auth/v1/user" {
		t.Errorf("req = %+v", rec)
	}
	if rec.Header.Get("Authorization") != "Bearer rtok" || rec.Header.Get("apikey") != "anon" {
		t.Errorf("headers = %v", rec.Header)
	}
	if rec.Body != `{"password":"newpw"}` {
		t.Errorf("body = %q", rec.Body)
	}

	srv2, _ := tcfgServer(t, 422, `{"msg":"weak"}`)
	if err := New(srv2.URL, "anon", "").UpdatePassword(context.Background(), "t", "p"); err == nil || !strings.Contains(err.Error(), "422") {
		t.Errorf("err = %v", err)
	}
}

func TestTCfgTruncate(t *testing.T) {
	tests := []struct {
		name string
		s    string
		n    int
		want string
	}{
		{"short", "abc", 5, "abc"},
		{"exact", "abcde", 5, "abcde"},
		{"over", "abcdef", 5, "abcde…"},
		{"empty", "", 3, ""},
		{"zero n", "abc", 0, "…"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := truncate(tt.s, tt.n); got != tt.want {
				t.Errorf("got %q want %q", got, tt.want)
			}
		})
	}
}
