package localdb

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"strings"
	"sync"
	"testing"
	"time"
)

const testIter = 1000 // PBKDF2 iterations in tests (production default is DefaultPBKDF2Iterations)

type logSink struct {
	mu    sync.Mutex
	lines []string
}

func (l *logSink) Logf(f string, a ...any) {
	l.mu.Lock()
	l.lines = append(l.lines, fmt.Sprintf(f, a...))
	l.mu.Unlock()
}

func (l *logSink) joined() string {
	l.mu.Lock()
	defer l.mu.Unlock()
	return strings.Join(l.lines, "\n")
}

type env struct {
	t    *testing.T
	db   *DB
	srv  *httptest.Server
	logs *logSink
	path string
	opt  Options
}

type resp struct {
	status int
	raw    string
	json   any
}

func (r resp) arr() []map[string]any {
	a, _ := r.json.([]any)
	out := make([]map[string]any, len(a))
	for i, x := range a {
		out[i], _ = x.(map[string]any)
	}
	return out
}

func (r resp) obj() map[string]any { m, _ := r.json.(map[string]any); return m }

func (r resp) str(k string) string { s, _ := r.obj()[k].(string); return s }

func newEnv(t *testing.T, mut func(*Options)) *env {
	t.Helper()
	e := &env{t: t, logs: &logSink{}}
	e.path = filepath.Join(t.TempDir(), "t.db")
	e.opt = Options{Path: e.path, PBKDF2Iter: testIter, SeedDemo: true, NoRichDemo: true, Logf: e.logs.Logf}
	if mut != nil {
		mut(&e.opt)
	}
	e.open()
	t.Cleanup(func() { e.srv.Close(); e.db.Close() })
	return e
}

func (e *env) open() {
	db, err := Open(e.opt)
	if err != nil {
		e.t.Fatalf("Open: %v", err)
	}
	e.db = db
	e.srv = httptest.NewServer(db.Handler())
}

// reopen closes and reopens the same file (persistence tests).
func (e *env) reopen() {
	e.srv.Close()
	if err := e.db.Close(); err != nil {
		e.t.Fatalf("Close: %v", err)
	}
	e.open()
}

func (e *env) anon() string    { a, _ := e.db.Keys(); return a }
func (e *env) service() string { _, s := e.db.Keys(); return s }

type req struct {
	method, path string
	body         any
	raw          string
	apikey       string
	bearer       string
	headers      map[string]string
}

func (e *env) do(q req) resp {
	e.t.Helper()
	var rd io.Reader
	switch {
	case q.raw != "":
		rd = strings.NewReader(q.raw)
	case q.body != nil:
		b, _ := json.Marshal(q.body)
		rd = bytes.NewReader(b)
	}
	if q.method == "" {
		q.method = "GET"
	}
	hr, err := http.NewRequest(q.method, e.srv.URL+q.path, rd)
	if err != nil {
		e.t.Fatal(err)
	}
	if q.body != nil || q.raw != "" {
		hr.Header.Set("Content-Type", "application/json")
	}
	if q.apikey != "" {
		hr.Header.Set("apikey", q.apikey)
	}
	if q.bearer != "" {
		hr.Header.Set("Authorization", "Bearer "+q.bearer)
	}
	for k, v := range q.headers {
		hr.Header.Set(k, v)
	}
	res, err := http.DefaultClient.Do(hr)
	if err != nil {
		e.t.Fatalf("%s %s: %v", q.method, q.path, err)
	}
	defer res.Body.Close()
	b, _ := io.ReadAll(res.Body)
	out := resp{status: res.StatusCode, raw: string(b)}
	_ = json.Unmarshal(b, &out.json)
	return out
}

// svc: service-role request.
func (e *env) svc(method, path string, body any, prefer string) resp {
	h := map[string]string{}
	if prefer != "" {
		h["Prefer"] = prefer
	}
	return e.do(req{method: method, path: path, body: body, apikey: e.service(), bearer: e.service(), headers: h})
}

// as: authenticated-user request (apikey = service key like the Go app, bearer = user token).
func (e *env) as(token, method, path string, body any, prefer string) resp {
	h := map[string]string{}
	if prefer != "" {
		h["Prefer"] = prefer
	}
	return e.do(req{method: method, path: path, body: body, apikey: e.service(), bearer: token, headers: h})
}

func (e *env) signup(email, pw string, data map[string]any) resp {
	b := map[string]any{"email": email, "password": pw}
	if data != nil {
		b["data"] = data
	}
	return e.do(req{method: "POST", path: "/auth/v1/signup", body: b, apikey: e.anon()})
}

func (e *env) login(email, pw string) resp {
	return e.do(req{method: "POST", path: "/auth/v1/token?grant_type=password", body: map[string]any{"email": email, "password": pw}, apikey: e.anon()})
}

// user signs up a fresh patient and returns (id, access token).
func (e *env) user(email string) (string, string) {
	e.t.Helper()
	r := e.signup(email, "secret123", nil)
	if r.status != 200 {
		e.t.Fatalf("signup %s: %d %s", email, r.status, r.raw)
	}
	u, _ := r.obj()["user"].(map[string]any)
	return u["id"].(string), r.str("access_token")
}

func ids(rows []map[string]any, col string) []any {
	out := make([]any, len(rows))
	for i, r := range rows {
		out[i] = r[col]
	}
	return out
}

func eq(t *testing.T, label string, got, want any) {
	t.Helper()
	g, _ := json.Marshal(got)
	w, _ := json.Marshal(want)
	if string(g) != string(w) {
		t.Errorf("%s: got %s want %s", label, g, w)
	}
}

func okStatus(t *testing.T, label string, r resp, want int) {
	t.Helper()
	if r.status != want {
		t.Fatalf("%s: status %d want %d (%s)", label, r.status, want, r.raw)
	}
}

var _ = time.Second

// httptestServerFor wraps an already running server URL so env.do can talk to it.
func httptestServerFor(u string) *httptest.Server { return &httptest.Server{URL: u} }
