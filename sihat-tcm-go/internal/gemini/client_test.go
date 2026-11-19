package gemini

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"
)

// TGemCapture records requests received by a test server.
type TGemCapture struct {
	mu     sync.Mutex
	paths  []string
	query  []string
	meths  []string
	bodies []string
}

func (c *TGemCapture) add(r *http.Request) {
	b, _ := io.ReadAll(r.Body)
	c.mu.Lock()
	defer c.mu.Unlock()
	c.paths = append(c.paths, r.URL.Path)
	c.query = append(c.query, r.URL.RawQuery)
	c.meths = append(c.meths, r.Method)
	c.bodies = append(c.bodies, string(b))
}

func tgemClient(srvURL string) *Client {
	return &Client{APIKey: "k-test", HTTP: &http.Client{}, BaseURL: srvURL}
}

func tgemOKBody(parts ...string) string {
	var ps []map[string]string
	for _, p := range parts {
		ps = append(ps, map[string]string{"text": p})
	}
	b, _ := json.Marshal(map[string]any{
		"candidates": []any{map[string]any{"content": map[string]any{"parts": ps}}},
	})
	return string(b)
}

func TestTGemNormalizeModel(t *testing.T) {
	cases := []struct{ in, want string }{
		{"", ModelFlash},
		{"gemini-1.5-flash", ModelLite},
		{"gemini-1.5-pro", ModelPro},
		{"gemini-2.0-flash", ModelFlash},
		{"gemini-2.0-flash-exp", ModelFlash},
		{"gemini-2.0-flash-thinking-exp-01-21", ModelPro},
		{"gemini-2.5-flash", ModelFlash},
		{"gemini-2.5-flash-lite", ModelLite},
		{"gemini-2.5-pro", ModelPro},
		{ModelFlash, ModelFlash},
		{ModelPro, ModelPro},
		{ModelLite, ModelLite},
		{"some-custom-model", "some-custom-model"},
	}
	for _, tc := range cases {
		t.Run("in="+tc.in, func(t *testing.T) {
			if got := normalizeModel(tc.in); got != tc.want {
				t.Fatalf("normalizeModel(%q)=%q want %q", tc.in, got, tc.want)
			}
		})
	}
}

func TestTGemLegacyModelsTargetsAreCurrent(t *testing.T) {
	valid := map[string]bool{ModelFlash: true, ModelPro: true, ModelLite: true}
	for k, v := range legacyModels {
		if !valid[v] {
			t.Errorf("legacyModels[%q]=%q is not a current tier", k, v)
		}
		if _, again := legacyModels[v]; again {
			t.Errorf("legacyModels[%q]=%q maps to another legacy id", k, v)
		}
	}
}

func TestTGemBase(t *testing.T) {
	cases := []struct{ name, in, want string }{
		{"default", "", baseURL},
		{"override", "http://x.test/v1", "http://x.test/v1"},
		{"trailing slash", "http://x.test/v1/", "http://x.test/v1"},
		{"multiple slashes", "http://x.test///", "http://x.test"},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			c := &Client{BaseURL: tc.in}
			if got := c.base(); got != tc.want {
				t.Fatalf("base()=%q want %q", got, tc.want)
			}
		})
	}
}

func TestTGemNew(t *testing.T) {
	c := New("abc")
	if c.APIKey != "abc" || c.HTTP == nil || c.HTTP.Timeout == 0 || c.BaseURL != "" {
		t.Fatalf("unexpected client: %+v", c)
	}
}

func TestTGemTruncateStr(t *testing.T) {
	if got := truncateStr("abc", 3); got != "abc" {
		t.Fatalf("got %q", got)
	}
	if got := truncateStr("abcd", 3); got != "abc…" {
		t.Fatalf("got %q", got)
	}
	if got := truncateStr("", 3); got != "" {
		t.Fatalf("got %q", got)
	}
}

func TestTGemGenerateNoAPIKey(t *testing.T) {
	called := false
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) { called = true }))
	defer srv.Close()
	c := &Client{HTTP: &http.Client{}, BaseURL: srv.URL}
	_, err := c.Generate(context.Background(), "", GenerateRequest{})
	if err == nil || !strings.Contains(err.Error(), "API key not configured") {
		t.Fatalf("err=%v", err)
	}
	if called {
		t.Fatal("server must not be called without key")
	}
}

func TestTGemGenerateRequestShape(t *testing.T) {
	cap := &TGemCapture{}
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		cap.add(r)
		if ct := r.Header.Get("Content-Type"); ct != "application/json" {
			t.Errorf("content-type=%q", ct)
		}
		_, _ = io.WriteString(w, tgemOKBody("hello"))
	}))
	defer srv.Close()

	temp := 0.0
	req := GenerateRequest{
		Contents:          []Content{{Role: "user", Parts: []Part{{Text: "hi"}}}},
		SystemInstruction: &Content{Parts: []Part{{Text: "be nice"}}},
		GenerationConfig: &GenerationConfig{
			Temperature:      &temp,
			MaxOutputTokens:  99,
			ResponseMimeType: "application/json",
			ThinkingConfig:   NoThinking,
		},
	}
	c := tgemClient(srv.URL + "/models/") // trailing slash trimmed
	got, err := c.Generate(context.Background(), "gemini-2.5-flash", req)
	if err != nil || got != "hello" {
		t.Fatalf("got=%q err=%v", got, err)
	}
	if len(cap.paths) != 1 {
		t.Fatalf("calls=%d", len(cap.paths))
	}
	if cap.meths[0] != http.MethodPost {
		t.Errorf("method=%s", cap.meths[0])
	}
	// legacy model normalized into the URL path
	if cap.paths[0] != "/models/"+ModelFlash+":generateContent" {
		t.Errorf("path=%s", cap.paths[0])
	}
	if cap.query[0] != "key=k-test" {
		t.Errorf("query=%s", cap.query[0])
	}
	var body map[string]any
	if err := json.Unmarshal([]byte(cap.bodies[0]), &body); err != nil {
		t.Fatal(err)
	}
	si := body["systemInstruction"].(map[string]any)
	if si["parts"].([]any)[0].(map[string]any)["text"] != "be nice" {
		t.Errorf("systemInstruction=%v", si)
	}
	gc := body["generationConfig"].(map[string]any)
	if gc["maxOutputTokens"].(float64) != 99 || gc["responseMimeType"] != "application/json" {
		t.Errorf("generationConfig=%v", gc)
	}
	if v, ok := gc["temperature"]; !ok || v.(float64) != 0 {
		t.Errorf("temperature 0 must be serialized: %v", gc)
	}
	tc, ok := gc["thinkingConfig"].(map[string]any)
	if !ok {
		t.Fatalf("thinkingConfig missing: %v", gc)
	}
	if v, ok := tc["thinkingBudget"]; !ok || v.(float64) != 0 {
		t.Errorf("thinkingBudget 0 must be serialized: %v", tc)
	}
	contents := body["contents"].([]any)
	if contents[0].(map[string]any)["role"] != "user" {
		t.Errorf("contents=%v", contents)
	}
}

func TestTGemRequestOmitsOptionalFields(t *testing.T) {
	b, err := json.Marshal(GenerateRequest{Contents: []Content{{Parts: []Part{{Text: "x"}}}}})
	if err != nil {
		t.Fatal(err)
	}
	s := string(b)
	for _, k := range []string{"systemInstruction", "generationConfig", "role", "inlineData"} {
		if strings.Contains(s, k) {
			t.Errorf("%s should be omitted: %s", k, s)
		}
	}
	b, _ = json.Marshal(Part{InlineData: &InlineData{MimeType: "image/png", Data: "QQ=="}})
	if !strings.Contains(string(b), `"inlineData":{"mimeType":"image/png","data":"QQ=="}`) || strings.Contains(string(b), `"text"`) {
		t.Errorf("inline part: %s", b)
	}
	b, _ = json.Marshal(GenerationConfig{})
	if string(b) != "{}" {
		t.Errorf("empty config: %s", b)
	}
}

func TestTGemNoThinking(t *testing.T) {
	if NoThinking == nil || NoThinking.ThinkingBudget != 0 {
		t.Fatalf("NoThinking=%+v", NoThinking)
	}
	b, _ := json.Marshal(NoThinking)
	if string(b) != `{"thinkingBudget":0}` {
		t.Fatalf("got %s", b)
	}
}

func TestTGemGenerateResponses(t *testing.T) {
	cases := []struct {
		name    string
		status  int
		body    string
		want    string
		errPart string
	}{
		{"multi-part concat", 200, tgemOKBody("foo", " ", "bar"), "foo bar", ""},
		{"only first candidate", 200, `{"candidates":[{"content":{"parts":[{"text":"A"}]}},{"content":{"parts":[{"text":"B"}]}}]}`, "A", ""},
		{"error json", 400, `{"error":{"code":400,"message":"bad key"}}`, "", "API error 400: bad key"},
		{"error json with 200 status", 200, `{"error":{"code":429,"message":"quota"}}`, "", "API error 429: quota"},
		{"no candidates", 200, `{"candidates":[]}`, "", "empty response (status 200)"},
		{"missing candidates", 200, `{}`, "", "empty response"},
		{"candidate without parts", 200, `{"candidates":[{"content":{"parts":[]}}]}`, "", "empty response"},
		{"non-json body", 502, `<html>bad gateway</html>`, "", "decode response (status 502)"},
		{"empty body", 200, ``, "", "decode response"},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.WriteHeader(tc.status)
				_, _ = io.WriteString(w, tc.body)
			}))
			defer srv.Close()
			got, err := tgemClient(srv.URL).Generate(context.Background(), ModelFlash, GenerateRequest{})
			if tc.errPart == "" {
				if err != nil || got != tc.want {
					t.Fatalf("got=%q err=%v", got, err)
				}
				return
			}
			if err == nil || !strings.Contains(err.Error(), tc.errPart) {
				t.Fatalf("err=%v want contains %q", err, tc.errPart)
			}
			if got != "" {
				t.Errorf("text should be empty on error: %q", got)
			}
		})
	}
}

func TestTGemGenerateTransportError(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {}))
	url := srv.URL
	srv.Close() // connection refused
	_, err := tgemClient(url).Generate(context.Background(), ModelFlash, GenerateRequest{})
	if err == nil || !strings.Contains(err.Error(), "request failed") {
		t.Fatalf("err=%v", err)
	}
}

func TestTGemGenerateCancelledContext(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_, _ = io.WriteString(w, tgemOKBody("x"))
	}))
	defer srv.Close()
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	if _, err := tgemClient(srv.URL).Generate(ctx, ModelFlash, GenerateRequest{}); err == nil {
		t.Fatal("expected error for cancelled ctx")
	}
}

func TestTGemGenerateBadURL(t *testing.T) {
	c := &Client{APIKey: "k", HTTP: &http.Client{}, BaseURL: "http://bad host\x7f"}
	if _, err := c.Generate(context.Background(), ModelFlash, GenerateRequest{}); err == nil {
		t.Fatal("expected error for invalid URL")
	}
}

func TestTGemGenerateText(t *testing.T) {
	for _, tc := range []struct {
		name   string
		system string
	}{{"with system", "sys prompt"}, {"without system", ""}} {
		t.Run(tc.name, func(t *testing.T) {
			cap := &TGemCapture{}
			srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				cap.add(r)
				_, _ = io.WriteString(w, tgemOKBody("ok"))
			}))
			defer srv.Close()
			got, err := tgemClient(srv.URL).GenerateText(context.Background(), ModelLite, tc.system, "the prompt")
			if err != nil || got != "ok" {
				t.Fatalf("got=%q err=%v", got, err)
			}
			var req GenerateRequest
			if err := json.Unmarshal([]byte(cap.bodies[0]), &req); err != nil {
				t.Fatal(err)
			}
			if len(req.Contents) != 1 || req.Contents[0].Role != "user" || req.Contents[0].Parts[0].Text != "the prompt" {
				t.Errorf("contents=%+v", req.Contents)
			}
			if req.GenerationConfig == nil || req.GenerationConfig.MaxOutputTokens != 2048 {
				t.Errorf("config=%+v", req.GenerationConfig)
			}
			if !strings.Contains(cap.bodies[0], `"thinkingBudget":0`) {
				t.Errorf("thinkingBudget 0 missing: %s", cap.bodies[0])
			}
			if tc.system == "" {
				if req.SystemInstruction != nil || strings.Contains(cap.bodies[0], "systemInstruction") {
					t.Errorf("systemInstruction should be omitted: %s", cap.bodies[0])
				}
			} else if req.SystemInstruction == nil || req.SystemInstruction.Parts[0].Text != tc.system {
				t.Errorf("systemInstruction=%+v", req.SystemInstruction)
			}
			if cap.paths[0] != "/"+ModelLite+":generateContent" {
				t.Errorf("path=%s", cap.paths[0])
			}
		})
	}
}

func TestTGemGenerateTextPropagatesError(t *testing.T) {
	c := &Client{HTTP: &http.Client{}}
	if _, err := c.GenerateText(context.Background(), "", "", "p"); err == nil {
		t.Fatal("expected API key error")
	}
}

func TestTGemGenerateWithFallback(t *testing.T) {
	// behaviour per model name (path prefix): ok / empty / error
	behaviour := map[string]string{
		"m-err":   `{"error":{"code":503,"message":"overloaded"}}`,
		"m-empty": tgemOKBody("   "),
		"m-ok":    tgemOKBody("good"),
		"m-ok2":   tgemOKBody("second"),
	}
	newSrv := func(order *[]string) *httptest.Server {
		return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			m := strings.TrimSuffix(strings.TrimPrefix(r.URL.Path, "/"), ":generateContent")
			*order = append(*order, m)
			_, _ = io.WriteString(w, behaviour[m])
		}))
	}

	t.Run("first succeeds, stops", func(t *testing.T) {
		var order []string
		srv := newSrv(&order)
		defer srv.Close()
		text, m, err := tgemClient(srv.URL).GenerateWithFallback(context.Background(), []string{"m-ok", "m-ok2"}, GenerateRequest{})
		if err != nil || text != "good" || m != "m-ok" || len(order) != 1 {
			t.Fatalf("text=%q m=%q err=%v order=%v", text, m, err, order)
		}
	})
	t.Run("error then ok", func(t *testing.T) {
		var order []string
		srv := newSrv(&order)
		defer srv.Close()
		text, m, err := tgemClient(srv.URL).GenerateWithFallback(context.Background(), []string{"m-err", "m-ok"}, GenerateRequest{})
		if err != nil || text != "good" || m != "m-ok" || strings.Join(order, ",") != "m-err,m-ok" {
			t.Fatalf("text=%q m=%q err=%v order=%v", text, m, err, order)
		}
	})
	t.Run("whitespace-only output falls through", func(t *testing.T) {
		var order []string
		srv := newSrv(&order)
		defer srv.Close()
		text, m, err := tgemClient(srv.URL).GenerateWithFallback(context.Background(), []string{"m-empty", "m-ok2"}, GenerateRequest{})
		if err != nil || text != "second" || m != "m-ok2" {
			t.Fatalf("text=%q m=%q err=%v", text, m, err)
		}
	})
	t.Run("all error returns last error", func(t *testing.T) {
		var order []string
		srv := newSrv(&order)
		defer srv.Close()
		_, m, err := tgemClient(srv.URL).GenerateWithFallback(context.Background(), []string{"m-err", "m-err"}, GenerateRequest{})
		if err == nil || !strings.Contains(err.Error(), "overloaded") || m != "" || len(order) != 2 {
			t.Fatalf("m=%q err=%v order=%v", m, err, order)
		}
	})
	t.Run("all empty yields generic error", func(t *testing.T) {
		var order []string
		srv := newSrv(&order)
		defer srv.Close()
		_, _, err := tgemClient(srv.URL).GenerateWithFallback(context.Background(), []string{"m-empty"}, GenerateRequest{})
		if err == nil || !strings.Contains(err.Error(), "all models returned empty output") {
			t.Fatalf("err=%v", err)
		}
	})
	t.Run("error then empty reports generic (last attempt had no error)", func(t *testing.T) {
		var order []string
		srv := newSrv(&order)
		defer srv.Close()
		_, _, err := tgemClient(srv.URL).GenerateWithFallback(context.Background(), []string{"m-err", "m-empty"}, GenerateRequest{})
		if err == nil || !strings.Contains(err.Error(), "all models returned empty output") {
			t.Fatalf("err=%v", err)
		}
	})
	t.Run("no models", func(t *testing.T) {
		_, _, err := (&Client{APIKey: "k", HTTP: &http.Client{}}).GenerateWithFallback(context.Background(), nil, GenerateRequest{})
		if err == nil || !strings.Contains(err.Error(), "all models returned empty output") {
			t.Fatalf("err=%v", err)
		}
	})
}
