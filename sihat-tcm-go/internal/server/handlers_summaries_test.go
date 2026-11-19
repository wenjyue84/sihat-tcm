package server

import (
	"encoding/base64"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"
	"time"

	"sihattcm/internal/config"
	"sihattcm/internal/gemini"
	"sihattcm/internal/supabase"
)

// ---- helpers ----

// TSumFake is a fake Gemini endpoint that records request paths/bodies.
type TSumFake struct {
	mu     sync.Mutex
	paths  []string
	bodies []string
	// handler decides the response; default returns a "hello" candidate.
	handler func(w http.ResponseWriter, r *http.Request, call int)
}

func (f *TSumFake) calls() int {
	f.mu.Lock()
	defer f.mu.Unlock()
	return len(f.paths)
}

func (f *TSumFake) lastBody() string {
	f.mu.Lock()
	defer f.mu.Unlock()
	if len(f.bodies) == 0 {
		return ""
	}
	return f.bodies[len(f.bodies)-1]
}

func tsumCandidate(text string) string {
	b, _ := json.Marshal(map[string]any{
		"candidates": []any{map[string]any{
			"content": map[string]any{"parts": []any{map[string]any{"text": text}}},
		}},
	})
	return string(b)
}

func tsumNewServer(t *testing.T, f *TSumFake) *Server {
	t.Helper()
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		b, _ := io.ReadAll(r.Body)
		f.mu.Lock()
		f.paths = append(f.paths, r.URL.Path)
		f.bodies = append(f.bodies, string(b))
		n := len(f.paths)
		f.mu.Unlock()
		if f.handler != nil {
			f.handler(w, r, n)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		_, _ = io.WriteString(w, tsumCandidate("hello summary"))
	}))
	t.Cleanup(ts.Close)

	s := &Server{
		Cfg: &config.Config{},
		AI: &gemini.Client{
			APIKey:  "test-key",
			HTTP:    &http.Client{Timeout: 5 * time.Second},
			BaseURL: ts.URL,
		},
		DB:  supabase.New("", "", ""),
		Mux: http.NewServeMux(),
	}
	s.registerSummaryRoutes()
	return s
}

func tsumPost(s *Server, path, body string) *httptest.ResponseRecorder {
	req := httptest.NewRequest(http.MethodPost, path, strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	s.Mux.ServeHTTP(rec, req)
	return rec
}

func tsumDecode(t *testing.T, rec *httptest.ResponseRecorder) map[string]any {
	t.Helper()
	var m map[string]any
	if err := json.Unmarshal(rec.Body.Bytes(), &m); err != nil {
		t.Fatalf("response not JSON: %v; body=%q", err, rec.Body.String())
	}
	return m
}

func tsumDecodeSVG(t *testing.T, dataURL string) string {
	t.Helper()
	const prefix = "data:image/svg+xml;base64,"
	if !strings.HasPrefix(dataURL, prefix) {
		t.Fatalf("missing data URL prefix: %.60s", dataURL)
	}
	raw, err := base64.StdEncoding.DecodeString(strings.TrimPrefix(dataURL, prefix))
	if err != nil {
		t.Fatalf("bad base64: %v", err)
	}
	return string(raw)
}

func tsumReport() map[string]any {
	return map[string]any{
		"diagnosis":    "Qi Deficiency",
		"constitution": "Yang type",
		"recommendations": map[string]any{
			"food_therapy": map[string]any{
				"beneficial": []any{"ginger", "rice", "oats", "dates", "goji", "yam", "extra7"},
				"avoid":      []any{"ice", "raw", "fried", "spicy", "extra5"},
			},
			"lifestyle": []any{"sleep early", "walk", "tai chi", "meditate", "extra5"},
		},
	}
}

// ---- pure helper tests ----

func TestTSumStr(t *testing.T) {
	tests := []struct {
		name string
		in   any
		want string
	}{
		{"nil", nil, ""},
		{"string", "abc", "abc"},
		{"empty", "", ""},
		{"int", 5, ""},
		{"map", map[string]any{}, ""},
		{"bool", true, ""},
	}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			if got := sumStr(tc.in); got != tc.want {
				t.Errorf("sumStr(%v)=%q want %q", tc.in, got, tc.want)
			}
		})
	}
}

func TestTSumStrOr(t *testing.T) {
	tests := []struct {
		name string
		in   any
		def  string
		want string
	}{
		{"nil uses default", nil, "d", "d"},
		{"empty uses default", "", "d", "d"},
		{"non-string uses default", 3.5, "d", "d"},
		{"value wins", "v", "d", "v"},
	}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			if got := sumStrOr(tc.in, tc.def); got != tc.want {
				t.Errorf("got %q want %q", got, tc.want)
			}
		})
	}
}

func TestTSumMapStr(t *testing.T) {
	m := map[string]any{"name": "Ann", "age": 30, "empty": ""}
	tests := []struct {
		name string
		m    map[string]any
		key  string
		want string
	}{
		{"nil map", nil, "name", "def"},
		{"present", m, "name", "Ann"},
		{"missing", m, "zzz", "def"},
		{"non-string value", m, "age", "def"},
		{"empty string value", m, "empty", "def"},
	}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			if got := sumMapStr(tc.m, tc.key, "def"); got != tc.want {
				t.Errorf("got %q want %q", got, tc.want)
			}
		})
	}
}

func TestTSumLangLabel(t *testing.T) {
	tests := []struct {
		lang, contains string
	}{
		{"zh", "Simplified Chinese"},
		{"ms", "Bahasa Malaysia"},
		{"en", "English"},
		{"", "English"},
		{"fr", "English"},
	}
	for _, tc := range tests {
		t.Run("lang="+tc.lang, func(t *testing.T) {
			if got := sumLangLabel(tc.lang); !strings.Contains(got, tc.contains) {
				t.Errorf("sumLangLabel(%q)=%q want contains %q", tc.lang, got, tc.contains)
			}
		})
	}
}

func TestTSumXMLEscape(t *testing.T) {
	tests := []struct{ in, want string }{
		{"", ""},
		{"plain", "plain"},
		{"a&b", "a&amp;b"},
		{"<b>", "&lt;b&gt;"},
		{`say "hi"`, "say &quot;hi&quot;"},
		{"it's", "it&apos;s"},
		{"&lt;", "&amp;lt;"}, // & escaped first, no double-unescape
		{`<script>alert("x")</script>`, "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;"},
		{"中文 ok", "中文 ok"},
	}
	for _, tc := range tests {
		t.Run(tc.in, func(t *testing.T) {
			if got := xmlEscape(tc.in); got != tc.want {
				t.Errorf("xmlEscape(%q)=%q want %q", tc.in, got, tc.want)
			}
		})
	}
}

func TestTSumDiagnosisStr(t *testing.T) {
	const def = "TCM Health Summary"
	tests := []struct {
		name string
		rd   map[string]any
		want string
	}{
		{"nil", nil, def},
		{"empty map", map[string]any{}, def},
		{"string", map[string]any{"diagnosis": "Damp Heat"}, "Damp Heat"},
		{"empty string", map[string]any{"diagnosis": ""}, def},
		{"object primary_pattern", map[string]any{"diagnosis": map[string]any{"primary_pattern": "Liver Qi Stagnation"}}, "Liver Qi Stagnation"},
		{"object no pattern", map[string]any{"diagnosis": map[string]any{"other": "x"}}, def},
		{"wrong type", map[string]any{"diagnosis": 42}, def},
	}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			if got := sumDiagnosisStr(tc.rd); got != tc.want {
				t.Errorf("got %q want %q", got, tc.want)
			}
		})
	}
}

func TestTSumConstitutionStr(t *testing.T) {
	tests := []struct {
		name string
		rd   map[string]any
		want string
	}{
		{"nil", nil, ""},
		{"missing", map[string]any{}, ""},
		{"string", map[string]any{"constitution": "Yin"}, "Yin"},
		{"object type", map[string]any{"constitution": map[string]any{"type": "Phlegm"}}, "Phlegm"},
		{"object no type", map[string]any{"constitution": map[string]any{}}, ""},
		{"wrong type", map[string]any{"constitution": []any{"x"}}, ""},
	}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			if got := sumConstitutionStr(tc.rd); got != tc.want {
				t.Errorf("got %q want %q", got, tc.want)
			}
		})
	}
}

func TestTSumStringSlice(t *testing.T) {
	rd := tsumReport()
	tests := []struct {
		name string
		rd   map[string]any
		top  string
		sub  string
		leaf string
		max  int
		want []string
	}{
		{"nil", nil, "recommendations", "food_therapy", "beneficial", 3, nil},
		{"capped", rd, "recommendations", "food_therapy", "beneficial", 3, []string{"ginger", "rice", "oats"}},
		{"under cap", rd, "recommendations", "food_therapy", "avoid", 10, []string{"ice", "raw", "fried", "spicy", "extra5"}},
		{"missing top", rd, "nope", "food_therapy", "beneficial", 3, nil},
		{"missing sub", rd, "recommendations", "nope", "beneficial", 3, nil},
		{"missing leaf", rd, "recommendations", "food_therapy", "nope", 3, nil},
		{"top wrong type", map[string]any{"recommendations": "x"}, "recommendations", "a", "b", 3, nil},
		{"non-string items skipped", map[string]any{"r": map[string]any{"s": map[string]any{"l": []any{1, "a", nil, "b"}}}}, "r", "s", "l", 5, []string{"a", "b"}},
	}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			got := sumStringSlice(tc.rd, tc.top, tc.sub, tc.leaf, tc.max)
			if strings.Join(got, "|") != strings.Join(tc.want, "|") {
				t.Errorf("got %v want %v", got, tc.want)
			}
			if tc.want == nil && got != nil {
				t.Errorf("expected nil, got %v", got)
			}
		})
	}
}

func TestTSumStringSliceTop(t *testing.T) {
	rd := tsumReport()
	tests := []struct {
		name string
		rd   map[string]any
		sub  string
		max  int
		want []string
	}{
		{"nil", nil, "lifestyle", 4, nil},
		{"capped", rd, "lifestyle", 2, []string{"sleep early", "walk"}},
		{"all", rd, "lifestyle", 10, []string{"sleep early", "walk", "tai chi", "meditate", "extra5"}},
		{"missing", rd, "nope", 4, nil},
		{"wrong type", rd, "food_therapy", 4, nil},
		{"mixed", map[string]any{"recommendations": map[string]any{"lifestyle": []any{"a", 2, "b"}}}, "lifestyle", 5, []string{"a", "b"}},
	}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			got := sumStringSliceTop(tc.rd, "recommendations", tc.sub, tc.max)
			if strings.Join(got, "|") != strings.Join(tc.want, "|") {
				t.Errorf("got %v want %v", got, tc.want)
			}
		})
	}
}

func TestTSumInfographicHTML(t *testing.T) {
	t.Run("full report", func(t *testing.T) {
		h := sumInfographicHTML(tsumReport(), nil, "modern")
		for _, want := range []string{
			"<!DOCTYPE html>", "Qi Deficiency", "Constitution: Yang type",
			"Recommended Foods", "Foods to Avoid", "Lifestyle Tips",
			"ginger", "goji", "<strong>4.</strong> meditate",
			"#10b981", time.Now().Format("2006-01-02"),
		} {
			if !strings.Contains(h, want) {
				t.Errorf("html missing %q", want)
			}
		}
		// caps: 6 beneficial, 4 avoid, 4 lifestyle
		if strings.Contains(h, "extra7") || strings.Contains(h, "extra5") {
			t.Error("items beyond caps leaked into html")
		}
		if n := strings.Count(h, `class="food-item"`); n != 6 {
			t.Errorf("beneficial items=%d want 6", n)
		}
		if n := strings.Count(h, "avoid-item\""); n != 4 {
			t.Errorf("avoid items=%d want 4", n)
		}
	})
	t.Run("empty data omits sections", func(t *testing.T) {
		h := sumInfographicHTML(map[string]any{}, nil, "modern")
		if !strings.Contains(h, "TCM Health Summary</h3>") {
			t.Error("default diagnosis missing")
		}
		for _, bad := range []string{"Recommended Foods", "Foods to Avoid", "Lifestyle Tips", "Constitution:"} {
			if strings.Contains(h, bad) {
				t.Errorf("html should not contain %q", bad)
			}
		}
	})
	t.Run("nil report", func(t *testing.T) {
		h := sumInfographicHTML(nil, nil, "")
		if !strings.Contains(h, "TCM Health Summary") {
			t.Error("nil report should render default")
		}
	})
	t.Run("style colors", func(t *testing.T) {
		for style, accent := range map[string]string{
			"modern": "#10b981", "traditional": "#dc2626", "minimal": "#374151", "colorful": "#8b5cf6",
		} {
			if h := sumInfographicHTML(map[string]any{}, nil, style); !strings.Contains(h, accent) {
				t.Errorf("style %s missing accent %s", style, accent)
			}
		}
	})
	t.Run("unknown style falls back to modern", func(t *testing.T) {
		a := sumInfographicHTML(tsumReport(), nil, "bogus")
		b := sumInfographicHTML(tsumReport(), nil, "modern")
		if a != b {
			t.Error("unknown style should equal modern output")
		}
	})
	t.Run("XSS escaped in every field", func(t *testing.T) {
		evil := `<script>alert(1)</script>`
		rd := map[string]any{
			"diagnosis":    evil,
			"constitution": evil,
			"recommendations": map[string]any{
				"food_therapy": map[string]any{
					"beneficial": []any{evil},
					"avoid":      []any{evil},
				},
				"lifestyle": []any{evil},
			},
		}
		h := sumInfographicHTML(rd, nil, "modern")
		if strings.Contains(h, "<script>") || strings.Contains(h, "alert(1)</script>") {
			t.Fatal("raw <script> present in html")
		}
		if n := strings.Count(h, "&lt;script&gt;"); n != 5 {
			t.Errorf("escaped script count=%d want 5", n)
		}
	})
}

func TestTSumPlaceholderSVG(t *testing.T) {
	t.Run("full report", func(t *testing.T) {
		svg := tsumDecodeSVG(t, sumPlaceholderSVG(tsumReport(), nil, "modern"))
		for _, want := range []string{"<svg", "</svg>", "Qi Deficiency", "Constitution: Yang type", "ginger", "rice", "oats", "#10b981"} {
			if !strings.Contains(svg, want) {
				t.Errorf("svg missing %q", want)
			}
		}
		// only 3 food rows
		if strings.Contains(svg, "dates") {
			t.Error("more than 3 foods rendered")
		}
		if n := strings.Count(svg, "✅"); n != 3 {
			t.Errorf("food rows=%d want 3", n)
		}
	})
	t.Run("no foods uses default row", func(t *testing.T) {
		svg := tsumDecodeSVG(t, sumPlaceholderSVG(map[string]any{}, nil, "minimal"))
		if !strings.Contains(svg, "Balanced diet recommended") {
			t.Error("default food row missing")
		}
		if !strings.Contains(svg, "TCM Health Summary") {
			t.Error("default diagnosis missing")
		}
	})
	t.Run("long food label truncated to 35", func(t *testing.T) {
		long := strings.Repeat("a", 60)
		rd := map[string]any{"recommendations": map[string]any{"food_therapy": map[string]any{"beneficial": []any{long}}}}
		svg := tsumDecodeSVG(t, sumPlaceholderSVG(rd, nil, "modern"))
		if !strings.Contains(svg, strings.Repeat("a", 35)+"</text>") {
			t.Error("label not truncated to 35 chars")
		}
		if strings.Contains(svg, strings.Repeat("a", 36)) {
			t.Error("label longer than 35 chars present")
		}
	})
	t.Run("long diagnosis truncated with ellipsis", func(t *testing.T) {
		rd := map[string]any{"diagnosis": strings.Repeat("d", 80)}
		svg := tsumDecodeSVG(t, sumPlaceholderSVG(rd, nil, "modern"))
		if !strings.Contains(svg, strings.Repeat("d", 50)+"...") {
			t.Error("diagnosis not truncated with ellipsis")
		}
		if strings.Contains(svg, strings.Repeat("d", 51)) {
			t.Error("diagnosis longer than 50 present")
		}
	})
	t.Run("styles and fallback", func(t *testing.T) {
		for style, primary := range map[string]string{
			"modern": "#10b981", "traditional": "#dc2626", "minimal": "#374151", "colorful": "#8b5cf6",
		} {
			svg := tsumDecodeSVG(t, sumPlaceholderSVG(map[string]any{}, nil, style))
			if !strings.Contains(svg, primary) {
				t.Errorf("style %s missing primary %s", style, primary)
			}
		}
		a := sumPlaceholderSVG(map[string]any{}, nil, "nope")
		b := sumPlaceholderSVG(map[string]any{}, nil, "modern")
		if a != b {
			t.Error("unknown style should equal modern")
		}
	})
	t.Run("XSS escaped", func(t *testing.T) {
		evil := `<script>alert("x")</script>`
		rd := map[string]any{
			"diagnosis":       evil,
			"constitution":    evil,
			"recommendations": map[string]any{"food_therapy": map[string]any{"beneficial": []any{evil}}},
		}
		svg := tsumDecodeSVG(t, sumPlaceholderSVG(rd, nil, "modern"))
		if strings.Contains(svg, "<script") {
			t.Fatal("raw <script> in svg")
		}
		if !strings.Contains(svg, "&lt;script&gt;") {
			t.Error("escaped script missing")
		}
	})
}

// ---- HTTP tests ----

func TestTSumMethodNotAllowed(t *testing.T) {
	s := tsumNewServer(t, &TSumFake{})
	handlers := map[string]http.HandlerFunc{
		"inquiry":  s.handleSummarizeInquiry,
		"reports":  s.handleSummarizeReports,
		"history":  s.handleSummarizeMedicalHistory,
		"dietary":  s.handleAskDietaryAdvice,
		"infograp": s.handleGenerateInfographic,
	}
	for name, h := range handlers {
		t.Run(name, func(t *testing.T) {
			rec := httptest.NewRecorder()
			h(rec, httptest.NewRequest(http.MethodGet, "/x", nil))
			if rec.Code != http.StatusMethodNotAllowed {
				t.Errorf("status=%d want 405", rec.Code)
			}
		})
	}
}

func TestTSumRoutesRejectGET(t *testing.T) {
	s := tsumNewServer(t, &TSumFake{})
	req := httptest.NewRequest(http.MethodGet, "/api/summarize-inquiry", nil)
	rec := httptest.NewRecorder()
	s.Mux.ServeHTTP(rec, req)
	if rec.Code != http.StatusMethodNotAllowed {
		t.Errorf("mux GET status=%d want 405", rec.Code)
	}
}

func TestTSumBadJSON(t *testing.T) {
	paths := []string{
		"/api/summarize-inquiry", "/api/summarize-reports", "/api/summarize-medical-history",
		"/api/ask-dietary-advice", "/api/generate-infographic",
	}
	for _, p := range paths {
		t.Run(p, func(t *testing.T) {
			f := &TSumFake{}
			s := tsumNewServer(t, f)
			rec := tsumPost(s, p, "{not json")
			if rec.Code != http.StatusBadRequest {
				t.Errorf("status=%d want 400", rec.Code)
			}
			if f.calls() != 0 {
				t.Error("Gemini must not be called on bad JSON")
			}
		})
	}
}

func TestTSumSummarizeInquiry(t *testing.T) {
	t.Run("success builds prompt", func(t *testing.T) {
		f := &TSumFake{}
		s := tsumNewServer(t, f)
		body := `{"chatHistory":[{"role":"user","content":"I have a cough"},{"role":"assistant","content":"How long?"}],
			"reportFiles":[{"name":"blood.pdf","extractedText":"WBC high"},{"name":"empty.pdf"}],
			"medicineFiles":[{"name":"pill.jpg"}],
			"basicInfo":{"name":"Ann","age":"30"},"language":"zh"}`
		rec := tsumPost(s, "/api/summarize-inquiry", body)
		if rec.Code != http.StatusOK {
			t.Fatalf("status=%d body=%s", rec.Code, rec.Body.String())
		}
		m := tsumDecode(t, rec)
		if m["summary"] != "hello summary" {
			t.Errorf("summary=%v", m["summary"])
		}
		if m["modelUsed"] != "gemini-2.0-flash" {
			t.Errorf("modelUsed=%v", m["modelUsed"])
		}
		if _, ok := m["timing"].(map[string]any)["total"]; !ok {
			t.Error("timing.total missing")
		}
		sent := f.lastBody()
		for _, want := range []string{
			"Name: Ann", "Age: 30", "Gender: Not provided", "Chief Complaint: Not provided",
			"blood.pdf", "WBC high", "No text extracted", "No medication info extracted",
			"[USER]: I have a cough", "[ASSISTANT]: How long?", "Simplified Chinese",
		} {
			if !strings.Contains(sent, want) {
				t.Errorf("request body missing %q", want)
			}
		}
	})
	t.Run("empty body object uses defaults", func(t *testing.T) {
		f := &TSumFake{}
		s := tsumNewServer(t, f)
		rec := tsumPost(s, "/api/summarize-inquiry", `{}`)
		if rec.Code != http.StatusOK {
			t.Fatalf("status=%d", rec.Code)
		}
		sent := f.lastBody()
		if !strings.Contains(sent, "None uploaded") || !strings.Contains(sent, "Respond in English.") {
			t.Errorf("defaults missing: %.300s", sent)
		}
	})
	t.Run("client model is allow-listed (cheap tiers only)", func(t *testing.T) {
		// the expensive tier (a legacy alias of it too) and unknown ids are ignored: the server default is used
		for _, in := range []string{"gemini-1.5-pro", "gemini-2.5-pro", "gemini-3.5-flash", "pc-opus", "gemini-flash-latest?alt=json&x="} {
			f := &TSumFake{}
			s := tsumNewServer(t, f)
			rec := tsumPost(s, "/api/summarize-inquiry", `{"model":`+strconvQuote(in)+`}`)
			if rec.Code != http.StatusOK {
				t.Fatalf("%q: status=%d", in, rec.Code)
			}
			if m := tsumDecode(t, rec); m["modelUsed"] != "gemini-2.0-flash" {
				t.Errorf("%q: modelUsed=%v", in, m["modelUsed"])
			}
			if !strings.Contains(f.paths[0], gemini.ModelFlash+":generateContent") || strings.Contains(f.paths[0], "?alt") {
				t.Errorf("%q: upstream path %s", in, f.paths[0])
			}
		}
		// a cheap legacy alias is honoured and normalised
		f := &TSumFake{}
		s := tsumNewServer(t, f)
		rec := tsumPost(s, "/api/summarize-inquiry", `{"model":"gemini-1.5-flash"}`)
		if m := tsumDecode(t, rec); rec.Code != http.StatusOK || m["modelUsed"] != "gemini-1.5-flash" || !strings.Contains(f.paths[0], gemini.ModelLite+":generateContent") {
			t.Errorf("lite alias: %d %v %v", rec.Code, m, f.paths)
		}
	})
	t.Run("falls back to next model on first failure", func(t *testing.T) {
		f := &TSumFake{handler: func(w http.ResponseWriter, r *http.Request, n int) {
			if n == 1 {
				_, _ = io.WriteString(w, `{"error":{"code":503,"message":"overloaded"}}`)
				return
			}
			_, _ = io.WriteString(w, tsumCandidate("second try"))
		}}
		s := tsumNewServer(t, f)
		rec := tsumPost(s, "/api/summarize-inquiry", `{"model":"custom-model"}`)
		if rec.Code != http.StatusOK {
			t.Fatalf("status=%d body=%s", rec.Code, rec.Body.String())
		}
		m := tsumDecode(t, rec)
		if m["summary"] != "second try" || m["modelUsed"] != "gemini-1.5-flash" {
			t.Errorf("unexpected: %v", m)
		}
		if f.calls() != 2 {
			t.Errorf("calls=%d want 2", f.calls())
		}
	})
	t.Run("all models fail gives 500", func(t *testing.T) {
		f := &TSumFake{handler: func(w http.ResponseWriter, r *http.Request, n int) {
			_, _ = io.WriteString(w, `{"error":{"code":500,"message":"boom"}}`)
		}}
		s := tsumNewServer(t, f)
		rec := tsumPost(s, "/api/summarize-inquiry", `{}`)
		if rec.Code != http.StatusBadGateway {
			t.Fatalf("status=%d", rec.Code)
		}
		if e, _ := tsumDecode(t, rec)["error"].(string); e == "" || strings.Contains(e, "boom") {
			t.Errorf("error=%q (must be generic, no upstream text)", e)
		}
	})
}

func TestTSumSummarizeReports(t *testing.T) {
	t.Run("no data gives 400 NO_DATA", func(t *testing.T) {
		f := &TSumFake{}
		s := tsumNewServer(t, f)
		for _, body := range []string{`{}`, `{"reports":[],"diagnosisHistory":[]}`} {
			rec := tsumPost(s, "/api/summarize-reports", body)
			if rec.Code != http.StatusBadRequest {
				t.Fatalf("status=%d", rec.Code)
			}
			m := tsumDecode(t, rec)
			if m["code"] != "NO_DATA" || m["error"] != "No data provided" {
				t.Errorf("unexpected: %v", m)
			}
		}
		if f.calls() != 0 {
			t.Error("Gemini must not be called with no data")
		}
	})
	t.Run("success with reports and history", func(t *testing.T) {
		f := &TSumFake{}
		s := tsumNewServer(t, f)
		body := `{"reports":[{"name":"r1","date":"2026-01-01","extractedText":"cholesterol 5"},{"name":"r2"}],
			"diagnosisHistory":[{"created_at":"2026-02-02","symptoms":"cough",
			"diagnosis_report":{"mainComplaint":"cough","tcmDiagnosis":"Lung Yin deficiency","syndromePattern":"dry"}},
			{"created_at":"2026-03-03"}],"language":"ms"}`
		rec := tsumPost(s, "/api/summarize-reports", body)
		if rec.Code != http.StatusOK {
			t.Fatalf("status=%d body=%s", rec.Code, rec.Body.String())
		}
		m := tsumDecode(t, rec)
		if m["summary"] != "hello summary" {
			t.Errorf("summary=%v", m["summary"])
		}
		tm := m["timing"].(map[string]any)
		if _, ok := tm["total"]; !ok {
			t.Error("timing.total missing")
		}
		if _, ok := tm["generation"]; !ok {
			t.Error("timing.generation missing")
		}
		sent := f.lastBody()
		for _, want := range []string{
			"Report 1: r1", "cholesterol 5", "No extracted text available",
			"Consultation 1 (2026-02-02)", "Symptoms: cough", "Main Complaint: cough",
			"TCM Diagnosis: Lung Yin deficiency", "Syndrome Pattern: dry",
			"Consultation 2 (2026-03-03)", "Bahasa Malaysia",
		} {
			if !strings.Contains(sent, want) {
				t.Errorf("request body missing %q", want)
			}
		}
	})
	t.Run("history only", func(t *testing.T) {
		f := &TSumFake{}
		s := tsumNewServer(t, f)
		rec := tsumPost(s, "/api/summarize-reports", `{"diagnosisHistory":[{"created_at":"x"}]}`)
		if rec.Code != http.StatusOK {
			t.Fatalf("status=%d", rec.Code)
		}
		if strings.Contains(f.lastBody(), "MEDICAL REPORTS:") {
			t.Error("reports header should be absent")
		}
	})
	t.Run("upstream failure gives 500", func(t *testing.T) {
		f := &TSumFake{handler: func(w http.ResponseWriter, r *http.Request, n int) {
			w.WriteHeader(http.StatusBadGateway)
			_, _ = io.WriteString(w, "<html>bad gateway</html>")
		}}
		s := tsumNewServer(t, f)
		rec := tsumPost(s, "/api/summarize-reports", `{"reports":[{"name":"a"}]}`)
		if rec.Code != http.StatusBadGateway {
			t.Fatalf("status=%d", rec.Code)
		}
		if e, _ := tsumDecode(t, rec)["error"].(string); e == "" || strings.Contains(e, "<html>") {
			t.Errorf("error=%q", e)
		}
	})
}

func TestTSumSummarizeMedicalHistory(t *testing.T) {
	t.Run("no data uses placeholders and trims output", func(t *testing.T) {
		f := &TSumFake{handler: func(w http.ResponseWriter, r *http.Request, n int) {
			_, _ = io.WriteString(w, tsumCandidate("  \n padded text \n "))
		}}
		s := tsumNewServer(t, f)
		rec := tsumPost(s, "/api/summarize-medical-history", `{}`)
		if rec.Code != http.StatusOK {
			t.Fatalf("status=%d", rec.Code)
		}
		m := tsumDecode(t, rec)
		if m["summary"] != "padded text" || m["success"] != true {
			t.Errorf("unexpected: %v", m)
		}
		sent := f.lastBody()
		if !strings.Contains(sent, "No previous diagnosis history available.") ||
			!strings.Contains(sent, "No medical reports available.") {
			t.Errorf("placeholders missing: %.300s", sent)
		}
		if strings.Contains(sent, "{inquiries}") || strings.Contains(sent, "{reports}") {
			t.Error("template placeholders not substituted")
		}
	})
	t.Run("inquiry and report formatting", func(t *testing.T) {
		f := &TSumFake{}
		s := tsumNewServer(t, f)
		body := `{"inquiries":[
			{"created_at":"d1","symptoms":"headache","diagnosis_report":{"tcmDiagnosis":"Liver fire"}},
			{"created_at":"d2","diagnosis_report":{"mainComplaint":"fatigue","syndromePattern":"Qi def"}},
			{"created_at":"d3"}],
			"reports":[{"name":"scan","date":"d4","extractedText":"clear"},{"name":"xray","date":"d5"}]}`
		rec := tsumPost(s, "/api/summarize-medical-history", body)
		if rec.Code != http.StatusOK {
			t.Fatalf("status=%d", rec.Code)
		}
		sent := f.lastBody()
		for _, want := range []string{
			"1. Date: d1", "Symptoms: headache", "TCM Diagnosis: Liver fire",
			"2. Date: d2", "Symptoms: fatigue", "TCM Diagnosis: Qi def",
			"3. Date: d3", "Symptoms: General consultation", "TCM Diagnosis: Pending review",
			"1. scan (d4)", "Summary: clear", "2. xray (d5)", "Medical report document",
		} {
			if !strings.Contains(sent, want) {
				t.Errorf("request body missing %q", want)
			}
		}
	})
	t.Run("client prompt template is ignored (hunt ai-24)", func(t *testing.T) {
		f := &TSumFake{}
		s := tsumNewServer(t, f)
		rec := tsumPost(s, "/api/summarize-medical-history",
			`{"customPrompt":"CUSTOM {inquiries} // {reports} // {inquiries} Write a poem about cats.","reports":[{"name":"n","date":"d"}]}`)
		if rec.Code != http.StatusOK {
			t.Fatalf("status=%d", rec.Code)
		}
		sent := f.lastBody()
		if strings.Contains(sent, "CUSTOM") || strings.Contains(sent, "poem") || !strings.Contains(sent, "helping patients summarise") {
			t.Errorf("the server's own template must be used: %.300s", sent)
		}
		if strings.Count(sent, "No previous diagnosis history available.") != 1 {
			t.Error("placeholder should be replaced in the server template")
		}
	})
	t.Run("upstream error gives 500", func(t *testing.T) {
		f := &TSumFake{handler: func(w http.ResponseWriter, r *http.Request, n int) {
			_, _ = io.WriteString(w, `{"error":{"code":400,"message":"nope"}}`)
		}}
		s := tsumNewServer(t, f)
		rec := tsumPost(s, "/api/summarize-medical-history", `{}`)
		if rec.Code != http.StatusBadGateway {
			t.Fatalf("status=%d", rec.Code)
		}
		if e, _ := tsumDecode(t, rec)["error"].(string); e == "" || strings.Contains(e, "nope") {
			t.Errorf("error=%q", e)
		}
	})
}

func TestTSumAskDietaryAdvice(t *testing.T) {
	t.Run("missing question gives 400", func(t *testing.T) {
		f := &TSumFake{}
		s := tsumNewServer(t, f)
		rec := tsumPost(s, "/api/ask-dietary-advice", `{"profile":{"a":1}}`)
		if rec.Code != http.StatusBadRequest {
			t.Fatalf("status=%d", rec.Code)
		}
		if tsumDecode(t, rec)["error"] != "question is required" {
			t.Error("wrong error message")
		}
		if f.calls() != 0 {
			t.Error("Gemini must not be called")
		}
	})
	t.Run("success substitutes context", func(t *testing.T) {
		f := &TSumFake{}
		s := tsumNewServer(t, f)
		rec := tsumPost(s, "/api/ask-dietary-advice",
			`{"question":"Can I eat crab?","profile":{"age":40},"diagnosis":"Damp heat"}`)
		if rec.Code != http.StatusOK {
			t.Fatalf("status=%d", rec.Code)
		}
		m := tsumDecode(t, rec)
		if m["answer"] != "hello summary" {
			t.Errorf("answer=%v", m["answer"])
		}
		// hunt patient-15 / ai-23: the model prompt (template + the patient's profile) never goes back to the browser
		if _, has := m["prompt"]; has {
			t.Errorf("response must not echo the prompt: %v", m)
		}
		p := f.lastBody()
		for _, want := range []string{
			`Patient Profile: {\"age\":40}`, `Latest Diagnosis: \"Damp heat\"`,
			"Latest Dietary Advice: Not provided", "User Question: Can I eat crab?", "Respond in English.",
		} {
			if !strings.Contains(p, want) {
				t.Errorf("prompt missing %q", want)
			}
		}
		for _, ph := range []string{"{profile}", "{diagnosis}", "{advice}", "{question}"} {
			if strings.Contains(p, ph) {
				t.Errorf("placeholder %s not replaced", ph)
			}
		}
	})
	t.Run("rate limit errors map to 429", func(t *testing.T) {
		msgs := []string{"429 too many", "quota exceeded", "RATE_LIMIT hit", "rate limit reached"}
		for _, msg := range msgs {
			t.Run(msg, func(t *testing.T) {
				f := &TSumFake{handler: func(w http.ResponseWriter, r *http.Request, n int) {
					b, _ := json.Marshal(map[string]any{"error": map[string]any{"code": 429, "message": msg}})
					_, _ = w.Write(b)
				}}
				s := tsumNewServer(t, f)
				rec := tsumPost(s, "/api/ask-dietary-advice", `{"question":"q"}`)
				if rec.Code != http.StatusTooManyRequests {
					t.Fatalf("status=%d want 429", rec.Code)
				}
				e, _ := tsumDecode(t, rec)["error"].(string)
				if !strings.Contains(e, "rate limit") || strings.Contains(e, msg) {
					t.Errorf("error should be a clean message, got %q", e)
				}
			})
		}
	})
	t.Run("other upstream errors map to a generic 502 (like the sibling routes) without leaking", func(t *testing.T) {
		f := &TSumFake{handler: func(w http.ResponseWriter, r *http.Request, n int) {
			_, _ = io.WriteString(w, `{"error":{"code":500,"message":"secret internal detail"}}`)
		}}
		s := tsumNewServer(t, f)
		rec := tsumPost(s, "/api/ask-dietary-advice", `{"question":"q"}`)
		if rec.Code != http.StatusBadGateway {
			t.Fatalf("status=%d", rec.Code)
		}
		e, _ := tsumDecode(t, rec)["error"].(string)
		if strings.Contains(e, "secret") || !strings.Contains(e, "unavailable") {
			t.Errorf("error=%q", e)
		}
	})
	t.Run("non-JSON upstream body gives 502", func(t *testing.T) {
		f := &TSumFake{handler: func(w http.ResponseWriter, r *http.Request, n int) {
			_, _ = io.WriteString(w, "not json at all")
		}}
		s := tsumNewServer(t, f)
		rec := tsumPost(s, "/api/ask-dietary-advice", `{"question":"q"}`)
		if rec.Code != http.StatusBadGateway {
			t.Fatalf("status=%d", rec.Code)
		}
	})
	t.Run("blank, huge and oversized-context questions are refused before the model call (hunt patient-15)", func(t *testing.T) {
		f := &TSumFake{}
		s := tsumNewServer(t, f)
		huge := strings.Repeat("x", maxDietaryQuestionRune+1)
		bigCtx := `{"question":"q","profile":{"blob":"` + strings.Repeat("y", 25000) + `"}}`
		for _, body := range []string{`{"question":"   \n\t"}`, `{"question":"` + huge + `"}`, bigCtx} {
			if rec := tsumPost(s, "/api/ask-dietary-advice", body); rec.Code != http.StatusBadRequest {
				t.Errorf("%.60s -> %d want 400", body, rec.Code)
			}
		}
		if f.calls() != 0 {
			t.Errorf("model called %d times for refused questions", f.calls())
		}
	})
	t.Run("upstream quota 429 carries Retry-After (hunt ai-18)", func(t *testing.T) {
		f := &TSumFake{handler: func(w http.ResponseWriter, r *http.Request, n int) {
			_, _ = io.WriteString(w, `{"error":{"code":429,"message":"RESOURCE_EXHAUSTED"}}`)
		}}
		s := tsumNewServer(t, f)
		rec := tsumPost(s, "/api/ask-dietary-advice", `{"question":"q"}`)
		if rec.Code != http.StatusTooManyRequests || rec.Header().Get("Retry-After") == "" {
			t.Errorf("status %d Retry-After %q", rec.Code, rec.Header().Get("Retry-After"))
		}
	})
}

func TestTSumGenerateInfographicHandler(t *testing.T) {
	t.Run("success no AI call", func(t *testing.T) {
		f := &TSumFake{}
		s := tsumNewServer(t, f)
		rec := tsumPost(s, "/api/generate-infographic",
			`{"style":"colorful","reportData":{"diagnosis":"Blood Stasis","constitution":{"type":"Yin"}}}`)
		if rec.Code != http.StatusOK {
			t.Fatalf("status=%d", rec.Code)
		}
		m := tsumDecode(t, rec)
		if m["success"] != true || m["type"] != "html" {
			t.Errorf("unexpected: %v", m)
		}
		if h, _ := m["html"].(string); !strings.Contains(h, "Blood Stasis") || !strings.Contains(h, "Constitution: Yin") || !strings.Contains(h, "#8b5cf6") {
			t.Error("html content wrong")
		}
		img, _ := m["imageUrl"].(string)
		if svg := tsumDecodeSVG(t, img); !strings.Contains(svg, "Blood Stasis") {
			t.Error("svg content wrong")
		}
		if f.calls() != 0 {
			t.Error("infographic must not call Gemini")
		}
	})
	t.Run("defaults when empty", func(t *testing.T) {
		s := tsumNewServer(t, &TSumFake{})
		rec := tsumPost(s, "/api/generate-infographic", `{}`)
		if rec.Code != http.StatusOK {
			t.Fatalf("status=%d", rec.Code)
		}
		m := tsumDecode(t, rec)
		if h, _ := m["html"].(string); !strings.Contains(h, "TCM Health Summary") || !strings.Contains(h, "#10b981") {
			t.Error("defaults (modern style / default diagnosis) not applied")
		}
	})
	t.Run("XSS in reportData is escaped in response", func(t *testing.T) {
		s := tsumNewServer(t, &TSumFake{})
		rec := tsumPost(s, "/api/generate-infographic",
			`{"reportData":{"diagnosis":"<script>alert(1)</script>"}}`)
		if rec.Code != http.StatusOK {
			t.Fatalf("status=%d", rec.Code)
		}
		m := tsumDecode(t, rec)
		h, _ := m["html"].(string)
		if strings.Contains(h, "<script>") {
			t.Error("raw script tag in html")
		}
		if svg := tsumDecodeSVG(t, m["imageUrl"].(string)); strings.Contains(svg, "<script>") {
			t.Error("raw script tag in svg")
		}
	})
}
