package main

import (
	"bufio"
	"io"
	"io/fs"
	"net"
	"net/http"
	"net/http/httptest"
	"net/url"
	"regexp"
	"strings"
	"testing"

	"sihattcm/internal/config"
	"sihattcm/internal/server"
)

// TPageStart builds the full server against a fake AI endpoint with Supabase
// unconfigured, and returns the httptest server.
func TPageStart(t *testing.T) *httptest.Server {
	t.Helper()
	fakeAI := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		http.Error(w, "fake ai", http.StatusServiceUnavailable)
	}))
	t.Cleanup(fakeAI.Close)
	cfg := &config.Config{
		Port:          "0",
		PublicBaseURL: "https://tcm.example.test/",
		GeminiAPIKey:  "test-key",
		AIBaseURL:     fakeAI.URL,
		Env:           "test",
	}
	srv, err := server.New(cfg, templatesFS, staticFS)
	if err != nil {
		t.Fatalf("server.New: %v", err)
	}
	ts := httptest.NewServer(srv.Handler())
	t.Cleanup(ts.Close)
	return ts
}

// TPageClient does not follow redirects so we can assert them.
func TPageClient() *http.Client {
	return &http.Client{CheckRedirect: func(*http.Request, []*http.Request) error {
		return http.ErrUseLastResponse
	}}
}

func TPageGet(t *testing.T, base, path string) (*http.Response, string) {
	t.Helper()
	resp, err := TPageClient().Get(base + path)
	if err != nil {
		t.Fatalf("GET %s: %v", path, err)
	}
	defer resp.Body.Close()
	b, _ := io.ReadAll(resp.Body)
	return resp, string(b)
}

func TPageAssertSecHeaders(t *testing.T, resp *http.Response, what string) {
	t.Helper()
	want := map[string]string{
		"X-Content-Type-Options": "nosniff",
		"X-Frame-Options":        "DENY",
		"Referrer-Policy":        "strict-origin-when-cross-origin",
	}
	for k, v := range want {
		if got := resp.Header.Get(k); got != v {
			t.Errorf("%s: header %s = %q, want %q", what, k, got, v)
		}
	}
}

func TestTPageTemplatesParse(t *testing.T) {
	entries, err := fs.Glob(templatesFS, "templates/*.html")
	if err != nil || len(entries) == 0 {
		t.Fatalf("no embedded templates: %v", err)
	}
	// server.New parses them all with html/template; failure here = a bad template.
	TPageStart(t)
	for _, want := range []string{"home", "login", "patient", "doctor", "admin", "report", "reset-password"} {
		found := false
		for _, e := range entries {
			if e == "templates/"+want+".html" {
				found = true
			}
		}
		if !found {
			t.Errorf("template %s.html not embedded", want)
		}
	}
}

func TestTPagePublicPages(t *testing.T) {
	ts := TPageStart(t)
	for _, p := range []string{"/", "/login", "/reset-password"} {
		t.Run(p, func(t *testing.T) {
			resp, body := TPageGet(t, ts.URL, p)
			if resp.StatusCode != 200 {
				t.Fatalf("status %d", resp.StatusCode)
			}
			if ct := resp.Header.Get("Content-Type"); !strings.HasPrefix(ct, "text/html") {
				t.Errorf("content-type %q", ct)
			}
			if !strings.Contains(body, "?v=") {
				t.Errorf("no ?v= asset version in HTML")
			}
			if strings.Contains(body, "{{") {
				t.Errorf("unrendered template action in output")
			}
			TPageAssertSecHeaders(t, resp, p)
		})
	}
}

func TestTPageProtectedRedirectToLogin(t *testing.T) {
	ts := TPageStart(t)
	for _, p := range []string{"/patient", "/patient/report/abc123", "/doctor", "/admin"} {
		t.Run(p, func(t *testing.T) {
			resp, _ := TPageGet(t, ts.URL, p)
			if resp.StatusCode != http.StatusFound {
				t.Fatalf("status %d, want 302", resp.StatusCode)
			}
			if loc := resp.Header.Get("Location"); loc != "/login" {
				t.Errorf("Location %q, want /login", loc)
			}
			TPageAssertSecHeaders(t, resp, p)
		})
	}
	t.Run("bogus bearer still redirects", func(t *testing.T) {
		req, _ := http.NewRequest("GET", ts.URL+"/patient", nil)
		req.Header.Set("Authorization", "Bearer nope")
		resp, err := TPageClient().Do(req)
		if err != nil {
			t.Fatal(err)
		}
		resp.Body.Close()
		if resp.StatusCode != 302 {
			t.Errorf("status %d", resp.StatusCode)
		}
	})
}

func TestTPageUtilityRoutes(t *testing.T) {
	ts := TPageStart(t)
	t.Run("healthz", func(t *testing.T) {
		for _, p := range []string{"/healthz", "/api/health"} {
			resp, body := TPageGet(t, ts.URL, p)
			if resp.StatusCode != 200 || !strings.Contains(body, `"status":"ok"`) {
				t.Errorf("%s: %d %s", p, resp.StatusCode, body)
			}
			if !strings.Contains(body, `"db":false`) || !strings.Contains(body, `"ai":true`) {
				t.Errorf("%s: unexpected flags %s", p, body)
			}
			TPageAssertSecHeaders(t, resp, p)
		}
	})
	t.Run("robots", func(t *testing.T) {
		resp, body := TPageGet(t, ts.URL, "/robots.txt")
		if resp.StatusCode != 200 || !strings.Contains(body, "Sitemap: https://tcm.example.test/sitemap.xml") {
			t.Errorf("%d %q", resp.StatusCode, body)
		}
		TPageAssertSecHeaders(t, resp, "robots")
	})
	t.Run("sitemap", func(t *testing.T) {
		resp, body := TPageGet(t, ts.URL, "/sitemap.xml")
		if resp.StatusCode != 200 || !strings.Contains(body, "<loc>https://tcm.example.test/login</loc>") {
			t.Errorf("%d %q", resp.StatusCode, body)
		}
		if !strings.Contains(resp.Header.Get("Content-Type"), "xml") {
			t.Errorf("content-type %q", resp.Header.Get("Content-Type"))
		}
	})
}

func TestTPageStaticRefsExist(t *testing.T) {
	ts := TPageStart(t)
	re := regexp.MustCompile(`/static/[^"'\s)?]+`)
	tpls, _ := fs.Glob(templatesFS, "templates/*.html")
	refs := map[string]bool{}
	for _, f := range tpls {
		b, err := fs.ReadFile(templatesFS, f)
		if err != nil {
			t.Fatal(err)
		}
		for _, m := range re.FindAllString(string(b), -1) {
			refs[m] = true
		}
	}
	if len(refs) == 0 {
		t.Fatal("no /static/ references found in templates")
	}
	for ref := range refs {
		t.Run(ref, func(t *testing.T) {
			resp, body := TPageGet(t, ts.URL, ref+"?v=1")
			if resp.StatusCode != 200 {
				t.Fatalf("status %d", resp.StatusCode)
			}
			if len(body) == 0 {
				t.Error("empty asset")
			}
			TPageAssertSecHeaders(t, resp, ref)
		})
	}
}

// TPageRenderedStaticRefs: the refs actually present in rendered HTML resolve.
func TestTPageRenderedAssetsResolve(t *testing.T) {
	ts := TPageStart(t)
	re := regexp.MustCompile(`(?:src|href)="(/static/[^"]+)"`)
	for _, p := range []string{"/", "/login", "/reset-password"} {
		_, body := TPageGet(t, ts.URL, p)
		ms := re.FindAllStringSubmatch(body, -1)
		if len(ms) == 0 {
			t.Errorf("%s: no static refs rendered", p)
		}
		for _, m := range ms {
			if !strings.Contains(m[1], "?v=") {
				t.Errorf("%s: %s lacks ?v=", p, m[1])
			}
			resp, _ := TPageGet(t, ts.URL, m[1])
			if resp.StatusCode != 200 {
				t.Errorf("%s: %s -> %d", p, m[1], resp.StatusCode)
			}
		}
	}
}

// TPageRaw sends a raw request line so escapes like %2e%2e are not normalised.
func TPageRaw(t *testing.T, addr, target string) (int, string) {
	t.Helper()
	conn, err := net.Dial("tcp", addr)
	if err != nil {
		t.Fatal(err)
	}
	defer conn.Close()
	_, err = io.WriteString(conn, "GET "+target+" HTTP/1.1\r\nHost: x\r\nConnection: close\r\n\r\n")
	if err != nil {
		t.Fatal(err)
	}
	resp, err := http.ReadResponse(bufio.NewReader(conn), nil)
	if err != nil {
		t.Fatalf("read response for %q: %v", target, err)
	}
	defer resp.Body.Close()
	b, _ := io.ReadAll(resp.Body)
	return resp.StatusCode, string(b)
}

func TestTPageStaticTraversalRejected(t *testing.T) {
	ts := TPageStart(t)
	u, _ := url.Parse(ts.URL)
	targets := []string{
		"/static/../templates/home.html",
		"/static/%2e%2e/templates/home.html",
		"/static/%2e%2e%2ftemplates%2fhome.html",
		"/static/..%2ftemplates%2fhome.html",
		"/static/%2E%2E/main.go",
		"/static/css/../../main.go",
		"/static/css/%2e%2e/%2e%2e/main.go",
		"/static/..%5ctemplates%5chome.html",
		"/static//etc/passwd",
		"/static/%00",
	}
	for _, tg := range targets {
		t.Run(tg, func(t *testing.T) {
			code, body := TPageRaw(t, u.Host, tg)
			if code == 200 {
				t.Fatalf("traversal served 200: %q", body)
			}
			for _, leak := range []string{"package main", "<!DOCTYPE", "<html", "root:"} {
				if strings.Contains(body, leak) {
					t.Errorf("response leaks %q", leak)
				}
			}
		})
	}
	t.Run("Opaque request", func(t *testing.T) {
		req, _ := http.NewRequest("GET", ts.URL, nil)
		req.URL = &url.URL{Scheme: "http", Host: u.Host, Opaque: "//" + u.Host + "/static/%2e%2e/main.go"}
		resp, err := TPageClient().Do(req)
		if err != nil {
			t.Fatal(err)
		}
		defer resp.Body.Close()
		if resp.StatusCode == 200 {
			t.Errorf("served 200")
		}
	})
}

func TestTPageUnknownAndMethods(t *testing.T) {
	ts := TPageStart(t)
	c := TPageClient()
	for _, p := range []string{"/nope", "/static/nope.js", "/static/css/missing.css", "/patient/report/", "/login/x"} {
		t.Run("404 "+p, func(t *testing.T) {
			resp, _ := TPageGet(t, ts.URL, p)
			if resp.StatusCode != 404 {
				t.Errorf("status %d", resp.StatusCode)
			}
			TPageAssertSecHeaders(t, resp, p)
		})
	}
	for _, p := range []string{"/", "/login", "/patient", "/doctor", "/admin", "/reset-password", "/healthz", "/robots.txt"} {
		for _, m := range []string{"POST", "DELETE", "PUT"} {
			t.Run("405 "+m+" "+p, func(t *testing.T) {
				req, _ := http.NewRequest(m, ts.URL+p, strings.NewReader("x"))
				resp, err := c.Do(req)
				if err != nil {
					t.Fatal(err)
				}
				resp.Body.Close()
				if resp.StatusCode != 405 {
					t.Errorf("status %d, want 405", resp.StatusCode)
				}
				if allow := resp.Header.Get("Allow"); !strings.Contains(allow, "GET") {
					t.Errorf("Allow %q lacks GET", allow)
				}
				TPageAssertSecHeaders(t, resp, p)
			})
		}
	}
}

func TestTPageHEAD(t *testing.T) {
	ts := TPageStart(t)
	cases := map[string]int{
		"/":                   200,
		"/login":              200,
		"/reset-password":     200,
		"/healthz":            200,
		"/static/css/app.css": 200,
		"/patient":            302,
		"/nope":               404,
	}
	for p, want := range cases {
		t.Run(p, func(t *testing.T) {
			resp, err := TPageClient().Head(ts.URL + p)
			if err != nil {
				t.Fatal(err)
			}
			defer resp.Body.Close()
			b, _ := io.ReadAll(resp.Body)
			if resp.StatusCode != want {
				t.Errorf("status %d, want %d", resp.StatusCode, want)
			}
			if len(b) != 0 {
				t.Errorf("HEAD returned %d body bytes", len(b))
			}
			TPageAssertSecHeaders(t, resp, p)
		})
	}
}
