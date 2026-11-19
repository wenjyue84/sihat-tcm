package server

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"

	"sihattcm/internal/gemini"
	"sihattcm/internal/supabase"
)

// ---- test harness ----

// tAnFake is a fake Gemini endpoint. respond receives the call index (0-based),
// the model segment from the URL path and the decoded request body, and returns
// the text to place in candidates[0].content.parts[0].text. If errStatus is
// non-empty the fake returns a Gemini-style error object instead.
type tAnFake struct {
	mu      sync.Mutex
	calls   int
	models  []string
	bodies  []gemini.GenerateRequest
	respond func(call int, model string, req gemini.GenerateRequest) (text string, apiErr bool)
}

func (f *tAnFake) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	raw, _ := io.ReadAll(r.Body)
	var req gemini.GenerateRequest
	_ = json.Unmarshal(raw, &req)
	// path: /models/<model>:generateContent  (BaseURL has no /models suffix in tests)
	seg := r.URL.Path[strings.LastIndex(r.URL.Path, "/")+1:]
	model := strings.TrimSuffix(seg, ":generateContent")

	f.mu.Lock()
	call := f.calls
	f.calls++
	f.models = append(f.models, model)
	f.bodies = append(f.bodies, req)
	f.mu.Unlock()

	text, apiErr := f.respond(call, model, req)
	w.Header().Set("Content-Type", "application/json")
	if apiErr {
		_, _ = w.Write([]byte(`{"error":{"code":429,"message":"quota"}}`))
		return
	}
	out := map[string]any{
		"candidates": []any{map[string]any{
			"content": map[string]any{"parts": []any{map[string]any{"text": text}}},
		}},
	}
	_ = json.NewEncoder(w).Encode(out)
}

func tAnNewServer(t *testing.T, respond func(call int, model string, req gemini.GenerateRequest) (string, bool)) (*Server, *tAnFake) {
	t.Helper()
	fake := &tAnFake{respond: respond}
	ts := httptest.NewServer(fake)
	t.Cleanup(ts.Close)
	s := &Server{
		AI:  &gemini.Client{APIKey: "k", HTTP: ts.Client(), BaseURL: ts.URL},
		DB:  supabase.New("", "", ""),
		Mux: http.NewServeMux(),
	}
	s.registerAnalysisRoutes()
	return s, fake
}

func tAnConst(text string) func(int, string, gemini.GenerateRequest) (string, bool) {
	return func(int, string, gemini.GenerateRequest) (string, bool) { return text, false }
}

func tAnPost(s *Server, path, body string) *httptest.ResponseRecorder {
	req := httptest.NewRequest(http.MethodPost, path, strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	// every call is a distinct client: the public analysis routes are rate-limited per IP+path (package-global map)
	req.RemoteAddr = fmt.Sprintf("10.9.%d.%d:5000", (tAnIPSeq>>8)&0xff, tAnIPSeq&0xff)
	tAnIPSeq++
	rec := httptest.NewRecorder()
	s.Mux.ServeHTTP(rec, req)
	return rec
}

var tAnIPSeq = 1

func tAnDecode(t *testing.T, rec *httptest.ResponseRecorder) map[string]any {
	t.Helper()
	var m map[string]any
	if err := json.Unmarshal(rec.Body.Bytes(), &m); err != nil {
		t.Fatalf("response not JSON: %v; body=%q", err, rec.Body.String())
	}
	return m
}

const tAnLongObs = "The tongue body is pale with a thin white coating and visible teeth marks along the edges."

// ---- pure helpers ----

func TestTAnStripDataURL(t *testing.T) {
	tests := []struct {
		name, in, fb, wantMime, wantB64 string
	}{
		{"png data url", "data:image/png;base64,AAAA", "image/jpeg", "image/png", "AAAA"},
		{"audio with codecs param", "data:audio/webm;codecs=opus;base64,QUJD", "x", "audio/webm;codecs=opus", "QUJD"},
		{"raw base64 uses fallback", "AAAA", "image/jpeg", "image/jpeg", "AAAA"},
		{"data prefix without base64 marker", "data:text/plain,hello", "fb", "fb", "data:text/plain,hello"},
		{"empty string", "", "fb", "fb", ""},
		{"empty payload", "data:image/png;base64,", "fb", "image/png", ""},
		{"empty mime", "data:;base64,ZZ", "fb", "", "ZZ"},
		{";base64, at index 0 is not a data url", ";base64,AA", "fb", "fb", ";base64,AA"},
	}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			m, b := anStripDataURL(tc.in, tc.fb)
			if m != tc.wantMime || b != tc.wantB64 {
				t.Fatalf("anStripDataURL(%q,%q) = (%q,%q), want (%q,%q)", tc.in, tc.fb, m, b, tc.wantMime, tc.wantB64)
			}
		})
	}
}

func TestTAnDetectMime(t *testing.T) {
	tests := []struct {
		name, existing, file, want string
	}{
		{"existing wins", "image/webp", "a.pdf", "image/webp"},
		{"octet-stream is overridden", "application/octet-stream", "scan.PDF", "application/pdf"},
		{"jpg", "", "a.jpg", "image/jpeg"},
		{"jpeg upper", "", "A.JPEG", "image/jpeg"},
		{"png", "", "x.png", "image/png"},
		{"gif", "", "x.gif", "image/gif"},
		{"webp", "", "x.webp", "image/webp"},
		{"unknown ext defaults to png", "", "x.bin", "image/png"},
		{"no name defaults to png", "", "", "image/png"},
		{"octet-stream no hint defaults to png", "application/octet-stream", "", "image/png"},
	}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			if got := anDetectMime(tc.existing, tc.file); got != tc.want {
				t.Fatalf("anDetectMime(%q,%q)=%q want %q", tc.existing, tc.file, got, tc.want)
			}
		})
	}
}

func TestTAnCleanJSON(t *testing.T) {
	tests := []struct{ name, in, want string }{
		{"plain", `{"a":1}`, `{"a":1}`},
		{"json fence", "```json\n{\"a\":1}\n```", `{"a":1}`},
		{"bare fence", "```\n{\"a\":1}\n```", `{"a":1}`},
		{"surrounding whitespace", "  \n {\"a\":1} \n ", `{"a":1}`},
		{"fence with outer whitespace", "\n```json\n[1,2]\n```\n", `[1,2]`},
		{"empty", "", ""},
		{"only fences", "```json```", ""},
	}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			if got := anCleanJSON(tc.in); got != tc.want {
				t.Fatalf("got %q want %q", got, tc.want)
			}
		})
	}
}

func TestTAnValidObs(t *testing.T) {
	tests := []struct {
		name, in string
		want     bool
	}{
		{"good observation", tAnLongObs, true},
		{"empty", "", false},
		{"too short", "Pale tongue.", false},
		{"short after trim", "   " + strings.Repeat("a", 49) + "   ", false},
		{"exactly 50 chars ok", strings.Repeat("a", 50), true},
		{"refusal: cannot analyze", strings.Repeat("x", 40) + " I Cannot Analyze this image at all, thanks", false},
		{"refusal: sorry", "Sorry about that. " + tAnLongObs, false},
		{"refusal: i'm unable", "I'm unable to continue. " + tAnLongObs, false},
		{"refusal: not visible", "Coating not visible. " + tAnLongObs, false},
		{"refusal: unclear image", "Unclear image quality. " + tAnLongObs, false},
		{"refusal: no observation", "no observation possible; " + tAnLongObs, false},
		// hunt ai-07: stock phrases in a LATER clause of a clinically valid observation do not discard it
		{"valid: later clause says veins not visible", "Tongue body pale with teeth marks; the sublingual veins are not visible in this photo; coating thin white and moist.", true},
		{"valid: later clause says cannot see the root", "Tongue body pale and swollen, coating thin white; I cannot see the root of the tongue clearly but the visible portion shows teeth marks.", true},
		{"valid: sorry inside a later sentence", tAnLongObs + " Sorry, the photo is slightly dark but the findings stand.", true},
	}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			if got := anValidObs(tc.in); got != tc.want {
				t.Fatalf("anValidObs(%q)=%v want %v", tc.in, got, tc.want)
			}
		})
	}
}

func TestTAnModelStatus(t *testing.T) {
	tests := map[string]string{
		"gemini-2.0-flash": "Using rapid analysis...",
		"gemini-1.5-flash": "Using standard analysis...",
		"gemini-2.5-pro":   "Using expert-level analysis...",
		"gemini-2.5-flash": "Using advanced analysis...",
		"":                 "Analysis complete",
		"something-else":   "Analysis complete",
	}
	for in, want := range tests {
		if got := anModelStatus(in); got != want {
			t.Errorf("anModelStatus(%q)=%q want %q", in, got, want)
		}
	}
}

func TestTAnTypeLabel(t *testing.T) {
	tests := map[string]string{
		"tongue": "tongue",
		"face":   "face",
		"part":   "body area",
		"body":   "body area",
		"":       "image",
		"hand":   "hand",
	}
	for in, want := range tests {
		if got := anTypeLabel(in); got != want {
			t.Errorf("anTypeLabel(%q)=%q want %q", in, got, want)
		}
	}
}

func TestTAnVisualPromptFor(t *testing.T) {
	tests := []struct{ kind, label string }{
		{"face", "face"},
		{"body", "body area"},
		{"part", "body area"},
		{"", "image"},
	}
	for _, tc := range tests {
		t.Run("kind="+tc.kind, func(t *testing.T) {
			sys, user := anVisualPromptFor(tc.kind)
			if !strings.Contains(sys, "visual inspection (望诊) of a "+tc.label) {
				t.Errorf("sys prompt missing label %q: %s", tc.label, sys)
			}
			if !strings.Contains(sys, `"is_valid_image" to false ONLY if the image clearly does not show a `+tc.label) {
				t.Errorf("sys prompt missing validity rule for %q", tc.label)
			}
			if !strings.Contains(user, "Analyse this "+tc.label+" image") {
				t.Errorf("user prompt missing label: %s", user)
			}
			// Must never be the tongue prompt (regression: face photo rejected as "not a tongue").
			if strings.Contains(strings.ToLower(sys+user), "tongue") {
				t.Errorf("non-tongue prompt mentions tongue")
			}
			if strings.Contains(sys+user, "%!") {
				t.Errorf("format verb error in prompt")
			}
		})
	}
}

func TestTAnExtractJSONString(t *testing.T) {
	tests := []struct {
		name, raw, field, want string
	}{
		{"simple", `{"observation":"hello"}`, "observation", "hello"},
		{"spaces around colon", `{"observation"  :   "hi there"}`, "observation", "hi there"},
		{"escaped quote", `{"observation":"say \"ah\" now"}`, "observation", `say "ah" now`},
		{"newline escape", `{"observation":"a\nb"}`, "observation", "a\nb"},
		{"unicode escape", `{"observation":"中文"}`, "observation", "中文"},
		{"raw chinese", `{"observation":"舌淡红"}`, "observation", "舌淡红"},
		{"truncated json still salvaged", `{"is_valid_image": true, "observation": "pale tongue", "analysis_tags": [{"title": "Sw`, "observation", "pale tongue"},
		{"missing field", `{"a":"b"}`, "observation", ""},
		{"non-string value ignored", `{"observation": 5}`, "observation", ""},
		{"unterminated string not matched", `{"observation":"abc`, "observation", ""},
		{"field name with regex metachar is quoted", `{"a.b":"x","aXb":"y"}`, "a.b", "x"},
		{"first match wins", `{"observation":"one","observation":"two"}`, "observation", "one"},
		{"empty value", `{"observation":""}`, "observation", ""},
		{"empty input", "", "observation", ""},
	}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			if got := anExtractJSONString(tc.raw, tc.field); got != tc.want {
				t.Fatalf("got %q want %q", got, tc.want)
			}
		})
	}
}

func TestTAnExtractJSONStringBadEscapeFallsBackToRaw(t *testing.T) {
	// \x is not a valid JSON escape: the re-parse fails and the raw capture is returned.
	got := anExtractJSONString(`{"observation":"a\xb"}`, "observation")
	if got != `a\xb` {
		t.Fatalf("got %q want raw capture", got)
	}
}

func TestTAnExtractJSONBool(t *testing.T) {
	tests := []struct {
		name, raw       string
		wantVal, wantOK bool
	}{
		{"true", `{"is_valid_image": true}`, true, true},
		{"false", `{"is_valid_image":false}`, false, true},
		{"missing", `{"x":true}`, false, false},
		{"string not bool", `{"is_valid_image":"true"}`, false, false},
		{"malformed surroundings", `{"is_valid_image" :   false, "obs": "tru`, false, true},
		{"empty", ``, false, false},
	}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			v, ok := anExtractJSONBool(tc.raw, "is_valid_image")
			if v != tc.wantVal || ok != tc.wantOK {
				t.Fatalf("got (%v,%v) want (%v,%v)", v, ok, tc.wantVal, tc.wantOK)
			}
		})
	}
}

func TestTAnEnsureString(t *testing.T) {
	tests := []struct {
		name string
		in   any
		want string
	}{
		{"nil", nil, ""},
		{"string", "abc", "abc"},
		{"empty string", "", ""},
		{"map", map[string]any{"a": 1}, `{"a":1}`},
		{"slice", []any{"x", 2}, `["x",2]`},
		{"number", 3.5, "3.5"},
		{"bool", true, "true"},
		{"unmarshalable falls back to Sprintf", make(chan int), ""}, // checked specially below
	}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			got := anEnsureString(tc.in)
			if _, isChan := tc.in.(chan int); isChan {
				if !strings.HasPrefix(got, "0x") && got == "" {
					t.Fatalf("expected non-empty %%v fallback, got %q", got)
				}
				return
			}
			if got != tc.want {
				t.Fatalf("got %q want %q", got, tc.want)
			}
		})
	}
}

func TestTAnMapAccessors(t *testing.T) {
	m := map[string]any{
		"s":    "str",
		"e":    "",
		"n":    float64(4.5),
		"f32":  float32(2),
		"i":    7,
		"num":  json.Number("9.25"),
		"badn": json.Number("zz"),
		"b":    true,
		"nil":  nil,
		"arr":  []any{1, 2},
	}

	t.Run("stringVal", func(t *testing.T) {
		if stringVal(m, "s", "d") != "str" {
			t.Error("present string")
		}
		if stringVal(m, "e", "d") != "" {
			t.Error("empty present string is returned, not default")
		}
		if stringVal(m, "n", "d") != "d" {
			t.Error("wrong type -> default")
		}
		if stringVal(m, "zz", "d") != "d" {
			t.Error("missing -> default")
		}
		if stringVal(nil, "s", "d") != "d" {
			t.Error("nil map -> default")
		}
	})
	t.Run("firstStringVal", func(t *testing.T) {
		if got := firstStringVal(m, "zz", "e", "s"); got != "str" {
			t.Errorf("skips missing and empty, got %q", got)
		}
		if got := firstStringVal(m, "zz", "n"); got != "" {
			t.Errorf("none found, got %q", got)
		}
		if got := firstStringVal(m); got != "" {
			t.Errorf("no keys, got %q", got)
		}
	})
	t.Run("floatVal", func(t *testing.T) {
		cases := []struct {
			key  string
			want float64
		}{
			{"n", 4.5}, {"f32", 2}, {"i", 7}, {"num", 9.25},
			{"badn", -1}, {"s", -1}, {"zz", -1}, {"nil", -1},
		}
		for _, c := range cases {
			if got := floatVal(m, c.key, -1); got != c.want {
				t.Errorf("floatVal(%q)=%v want %v", c.key, got, c.want)
			}
		}
	})
	t.Run("boolVal", func(t *testing.T) {
		if !boolVal(m, "b", false) {
			t.Error("present true")
		}
		if boolVal(m, "s", false) {
			t.Error("wrong type -> default false")
		}
		if !boolVal(m, "zz", true) {
			t.Error("missing -> default true")
		}
	})
	t.Run("sliceVal", func(t *testing.T) {
		if got, ok := sliceVal(m, "arr").([]any); !ok || len(got) != 2 {
			t.Errorf("present: %#v", sliceVal(m, "arr"))
		}
		if got, ok := sliceVal(m, "zz").([]any); !ok || len(got) != 0 {
			t.Errorf("missing should be empty []any, got %#v", sliceVal(m, "zz"))
		}
		// present-but-nil is returned as nil (current contract).
		if sliceVal(m, "nil") != nil {
			t.Errorf("present nil is returned as-is")
		}
	})
	t.Run("anySliceVal", func(t *testing.T) {
		if got, ok := anySliceVal(m, "zz", "nil", "arr").([]any); !ok || len(got) != 2 {
			t.Errorf("skips missing and nil, got %#v", anySliceVal(m, "zz", "nil", "arr"))
		}
		if got, ok := anySliceVal(m, "zz").([]any); !ok || len(got) != 0 {
			t.Errorf("none -> empty []any")
		}
		if got := anySliceVal(m, "s", "arr"); got != "str" {
			t.Errorf("returns first non-nil of any type, got %#v", got)
		}
	})
	t.Run("strOrDefault", func(t *testing.T) {
		cases := []struct{ in, want string }{
			{"", "D"}, {"  ", "D"}, {"<nil>", "D"}, {"0", "0"}, {"42", "42"}, {"abc", "abc"},
		}
		for _, c := range cases {
			if got := strOrDefault(c.in, "D"); got != c.want {
				t.Errorf("strOrDefault(%q)=%q want %q", c.in, got, c.want)
			}
		}
	})
}

func TestTAnFallbackQuestionsShape(t *testing.T) {
	qs, ok := anFallbackQuestions["questions"].([]map[string]any)
	if !ok || len(qs) != 6 {
		t.Fatalf("expected 6 fallback questions, got %#v", anFallbackQuestions["questions"])
	}
	seen := map[string]bool{}
	for _, q := range qs {
		id, _ := q["id"].(string)
		if id == "" || seen[id] {
			t.Errorf("bad/duplicate id %q", id)
		}
		seen[id] = true
		if ch, _ := q["choices"].([]map[string]string); len(ch) < 3 {
			t.Errorf("question %s has <3 choices", id)
		}
		if _, ok := q["multiSelect"].(bool); !ok {
			t.Errorf("question %s missing multiSelect bool", id)
		}
	}
}

// ---- HTTP: validation (never reaches the AI) ----

func TestTAnValidation(t *testing.T) {
	endpoints := []struct {
		path        string
		missingBody string
		missingMsg  string
	}{
		{"/api/analyze-image", `{"type":"tongue"}`, "image is required"},
		{"/api/analyze-audio", `{}`, "audio is required"},
		{"/api/analyze-snore", `{"duration":3}`, "audio is required"},
		{"/api/extract-text", `{"mode":"medicine"}`, "file is required"},
		{"/api/validate-medicine", `{"language":"en"}`, "text is required"},
	}
	for _, ep := range endpoints {
		ep := ep
		t.Run(ep.path, func(t *testing.T) {
			s, fake := tAnNewServer(t, tAnConst("{}"))

			rec := tAnPost(s, ep.path, `{not json`)
			if rec.Code != http.StatusBadRequest {
				t.Errorf("bad JSON: status %d want 400", rec.Code)
			}
			if !strings.Contains(rec.Body.String(), "invalid JSON body") {
				t.Errorf("bad JSON body: %q", rec.Body.String())
			}

			rec = tAnPost(s, ep.path, ``)
			if rec.Code != http.StatusBadRequest {
				t.Errorf("empty body: status %d want 400", rec.Code)
			}

			rec = tAnPost(s, ep.path, ep.missingBody)
			if rec.Code != http.StatusBadRequest {
				t.Errorf("missing field: status %d want 400", rec.Code)
			}
			if got := tAnDecode(t, rec)["error"]; got != ep.missingMsg {
				t.Errorf("error=%v want %q", got, ep.missingMsg)
			}

			// Wrong JSON type for the required field is also a decode failure.
			rec = tAnPost(s, ep.path, `[1,2,3]`)
			if rec.Code != http.StatusBadRequest {
				t.Errorf("array body: status %d want 400", rec.Code)
			}

			if fake.calls != 0 {
				t.Errorf("AI was called %d times on invalid requests", fake.calls)
			}
		})
	}
}

func TestTAnMethodNotAllowed(t *testing.T) {
	s, fake := tAnNewServer(t, tAnConst("{}"))
	paths := []string{
		"/api/analyze-image", "/api/analyze-audio", "/api/analyze-snore",
		"/api/extract-text", "/api/validate-medicine", "/api/doctor/generate-inquiry",
	}
	for _, p := range paths {
		t.Run("mux GET "+p, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodGet, p, nil)
			rec := httptest.NewRecorder()
			s.Mux.ServeHTTP(rec, req)
			if rec.Code != http.StatusMethodNotAllowed {
				t.Fatalf("status %d want 405", rec.Code)
			}
		})
	}
	handlers := map[string]http.HandlerFunc{
		"image":    s.handleAnalyzeImage,
		"audio":    s.handleAnalyzeAudio,
		"snore":    s.handleAnalyzeSnore,
		"extract":  s.handleExtractText,
		"validate": s.handleValidateMedicine,
		"inquiry": func(w http.ResponseWriter, r *http.Request) {
			s.handleGenerateInquiry(w, r, &AuthUser{Role: "doctor"})
		},
	}
	for name, h := range handlers {
		t.Run("direct PUT "+name, func(t *testing.T) {
			rec := httptest.NewRecorder()
			h(rec, httptest.NewRequest(http.MethodPut, "/x", strings.NewReader(`{}`)))
			if rec.Code != http.StatusMethodNotAllowed {
				t.Fatalf("status %d want 405", rec.Code)
			}
			if !strings.Contains(rec.Body.String(), "method not allowed") {
				t.Fatalf("body %q", rec.Body.String())
			}
		})
	}
	if fake.calls != 0 {
		t.Errorf("AI called %d times", fake.calls)
	}
}

// ---- HTTP: analyze-image ----

func TestTAnAnalyzeImageSuccessTongue(t *testing.T) {
	aiJSON := `{"is_valid_image":true,"image_description":"clear tongue","observation":"` + tAnLongObs + `","confidence":88,
	"analysis_tags":[{"title":"Pale"}],"tcm_indicators":["x"],"pattern_suggestions":["Qi deficiency"],"notes":"n1"}`
	s, fake := tAnNewServer(t, tAnConst("```json\n"+aiJSON+"\n```"))

	rec := tAnPost(s, "/api/analyze-image",
		`{"image":"data:image/png;base64,iVBORw0KGgo=","type":"tongue","symptoms":"fatigue","mainComplaint":""}`)
	if rec.Code != 200 {
		t.Fatalf("status %d body=%s", rec.Code, rec.Body.String())
	}
	got := tAnDecode(t, rec)
	if got["observation"] != tAnLongObs {
		t.Errorf("observation=%v", got["observation"])
	}
	if got["modelUsed"] != float64(1) {
		t.Errorf("modelUsed=%v want 1", got["modelUsed"])
	}
	if got["status"] != "Using rapid analysis..." {
		t.Errorf("status=%v", got["status"])
	}
	if got["confidence"] != float64(88) {
		t.Errorf("confidence=%v", got["confidence"])
	}
	if got["notes"] != "n1" {
		t.Errorf("notes=%v", got["notes"])
	}
	if tags, _ := got["analysis_tags"].([]any); len(tags) != 1 {
		t.Errorf("analysis_tags=%v", got["analysis_tags"])
	}
	// potential_issues falls back to pattern_suggestions.
	if pi, _ := got["potential_issues"].([]any); len(pi) != 1 || pi[0] != "Qi deficiency" {
		t.Errorf("potential_issues=%v", got["potential_issues"])
	}

	if fake.calls != 1 {
		t.Fatalf("calls=%d want 1", fake.calls)
	}
	req := fake.bodies[0]
	parts := req.Contents[0].Parts
	if parts[1].InlineData == nil || parts[1].InlineData.MimeType != "image/png" || parts[1].InlineData.Data != "iVBORw0KGgo=" {
		t.Errorf("inline data=%+v", parts[1].InlineData)
	}
	if !strings.Contains(parts[0].Text, "PATIENT CONTEXT:\nMain Complaint: Not provided\nSymptoms: fatigue") {
		t.Errorf("patient context missing/incorrect: %s", parts[0].Text[len(parts[0].Text)-120:])
	}
	if req.SystemInstruction == nil || !strings.Contains(req.SystemInstruction.Parts[0].Text, "Shé Zhěn") {
		t.Errorf("tongue system prompt not used")
	}
	if req.GenerationConfig == nil || req.GenerationConfig.ResponseMimeType != "application/json" ||
		req.GenerationConfig.ThinkingConfig == nil || req.GenerationConfig.ThinkingConfig.ThinkingBudget != 0 {
		t.Errorf("generation config=%+v", req.GenerationConfig)
	}
}

func TestTAnAnalyzeImageFaceUsesVisualPrompt(t *testing.T) {
	aiJSON := `{"is_valid_image":true,"observation":"` + tAnLongObs + `","confidence":90}`
	s, fake := tAnNewServer(t, tAnConst(aiJSON))
	// raw base64 (no data URL) -> fallback mime image/jpeg
	rec := tAnPost(s, "/api/analyze-image", `{"image":"/9j/4AAQSkZJRgAB","type":"face"}`)
	if rec.Code != 200 {
		t.Fatalf("status %d", rec.Code)
	}
	req := fake.bodies[0]
	if strings.Contains(req.SystemInstruction.Parts[0].Text, "Shé Zhěn") {
		t.Errorf("face request must not use tongue prompt")
	}
	if !strings.Contains(req.SystemInstruction.Parts[0].Text, "of a face") {
		t.Errorf("face prompt not used: %s", req.SystemInstruction.Parts[0].Text)
	}
	if strings.Contains(req.Contents[0].Parts[0].Text, "PATIENT CONTEXT") {
		t.Errorf("no context expected when symptoms/complaint empty")
	}
	if mt := req.Contents[0].Parts[1].InlineData.MimeType; mt != "image/jpeg" {
		t.Errorf("fallback mime=%q", mt)
	}
}

func TestTAnAnalyzeImageInvalidImage(t *testing.T) {
	tests := []struct {
		name, ai string
	}{
		{"is_valid_image false", `{"is_valid_image":false,"image_description":"a cat","observation":"` + tAnLongObs + `","confidence":95}`},
		{"low confidence", `{"is_valid_image":true,"image_description":"a cat","observation":"` + tAnLongObs + `","confidence":59.9}`},
	}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			s, fake := tAnNewServer(t, tAnConst(tc.ai))
			rec := tAnPost(s, "/api/analyze-image", `{"image":"iVBORw0KGgo=","type":"tongue"}`)
			if rec.Code != 200 {
				t.Fatalf("status %d", rec.Code)
			}
			got := tAnDecode(t, rec)
			if got["status"] != "invalid_image" {
				t.Errorf("status=%v", got["status"])
			}
			msg, _ := got["observation"].(string)
			if !strings.Contains(msg, "clear tongue photo") || !strings.Contains(msg, "a cat") {
				t.Errorf("message=%q", msg)
			}
			if got["message"] != got["observation"] {
				t.Errorf("message and observation should match")
			}
			if fake.calls != 1 {
				t.Errorf("invalid image must short-circuit; calls=%d", fake.calls)
			}
		})
	}
}

func TestTAnAnalyzeImageConfidenceBoundary(t *testing.T) {
	// confidence exactly 60 is accepted (rejection is < 60).
	ai := `{"is_valid_image":true,"observation":"` + tAnLongObs + `","confidence":60}`
	s, _ := tAnNewServer(t, tAnConst(ai))
	got := tAnDecode(t, tAnPost(s, "/api/analyze-image", `{"image":"iVBORw0KGgo=","type":"tongue"}`))
	if got["status"] == "invalid_image" {
		t.Fatalf("confidence 60 should be accepted: %v", got)
	}
}

func TestTAnAnalyzeImageFallsBackToSecondModel(t *testing.T) {
	good := `{"is_valid_image":true,"observation":"` + tAnLongObs + `","confidence":80}`
	s, fake := tAnNewServer(t, func(call int, _ string, _ gemini.GenerateRequest) (string, bool) {
		if call == 0 {
			return "", true // API error on first model
		}
		return good, false
	})
	got := tAnDecode(t, tAnPost(s, "/api/analyze-image", `{"image":"iVBORw0KGgo=","type":"tongue"}`))
	if got["modelUsed"] != float64(2) {
		t.Errorf("modelUsed=%v want 2", got["modelUsed"])
	}
	if got["status"] != "Using standard analysis..." {
		t.Errorf("status=%v", got["status"])
	}
	if fake.calls != 2 {
		t.Errorf("calls=%d", fake.calls)
	}
}

func TestTAnAnalyzeImageAllModelsFail(t *testing.T) {
	tests := []struct {
		name string
		fn   func(int, string, gemini.GenerateRequest) (string, bool)
	}{
		{"api errors", func(int, string, gemini.GenerateRequest) (string, bool) { return "", true }},
		{"refusal text", tAnConst(`{"is_valid_image":true,"observation":"Sorry, I cannot see anything meaningful in this picture at all.","confidence":90}`)},
		{"unparseable and unsalvageable", tAnConst("this is not json")},
		{"observation too short", tAnConst(`{"is_valid_image":true,"observation":"pale","confidence":90}`)},
	}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			s, fake := tAnNewServer(t, tc.fn)
			rec := tAnPost(s, "/api/analyze-image", `{"image":"iVBORw0KGgo=","type":"tongue"}`)
			if rec.Code != 200 {
				t.Fatalf("status %d", rec.Code)
			}
			got := tAnDecode(t, rec)
			if got["status"] != "Analysis pending" || got["modelUsed"] != float64(0) {
				t.Errorf("placeholder expected, got %v", got)
			}
			if fake.calls != 2 {
				t.Errorf("both models should be tried, calls=%d", fake.calls)
			}
		})
	}
}

func TestTAnAnalyzeImageSalvagesMalformedJSON(t *testing.T) {
	// Truncated JSON: strict parse fails, observation is salvaged by regex.
	trunc := `{"is_valid_image": true, "image_description": "tongue", "observation": "` + tAnLongObs + `", "analysis_tags": [{"title": "Sw`
	s, _ := tAnNewServer(t, tAnConst(trunc))
	got := tAnDecode(t, tAnPost(s, "/api/analyze-image", `{"image":"iVBORw0KGgo=","type":"tongue"}`))
	if got["observation"] != tAnLongObs {
		t.Fatalf("observation not salvaged: %v", got)
	}
	if _, has := got["analysis_tags"]; has {
		t.Errorf("salvaged response should not include analysis_tags")
	}
	if got["confidence"] != float64(100) {
		t.Errorf("confidence default=%v want 100", got["confidence"])
	}

	// Salvaged is_valid_image=false is honoured.
	bad := `{"is_valid_image": false, "image_description": "a wall", "observation": "nope", "analysis_tags": [`
	s2, _ := tAnNewServer(t, tAnConst(bad))
	got2 := tAnDecode(t, tAnPost(s2, "/api/analyze-image", `{"image":"iVBORw0KGgo=","type":"face"}`))
	if got2["status"] != "invalid_image" {
		t.Errorf("status=%v", got2["status"])
	}
	if msg, _ := got2["observation"].(string); !strings.Contains(msg, "clear face photo") || !strings.Contains(msg, "a wall") {
		t.Errorf("msg=%q", msg)
	}
}

func TestTAnAnalyzeImageObservationFallsBackToDescription(t *testing.T) {
	ai := `{"is_valid_image":true,"image_description":"` + tAnLongObs + `","confidence":75}`
	s, _ := tAnNewServer(t, tAnConst(ai))
	got := tAnDecode(t, tAnPost(s, "/api/analyze-image", `{"image":"iVBORw0KGgo=","type":"tongue"}`))
	if got["observation"] != tAnLongObs {
		t.Fatalf("observation should fall back to image_description: %v", got)
	}
}

func TestTAnAnalyzeImageAlternateObservationKeys(t *testing.T) {
	for _, key := range []string{"analysis", "description"} {
		t.Run(key, func(t *testing.T) {
			ai := `{"` + key + `":"` + tAnLongObs + `","confidence":70}`
			s, _ := tAnNewServer(t, tAnConst(ai))
			got := tAnDecode(t, tAnPost(s, "/api/analyze-image", `{"image":"iVBORw0KGgo=","type":"tongue"}`))
			if got["observation"] != tAnLongObs {
				t.Fatalf("observation=%v", got["observation"])
			}
		})
	}
}

// ---- HTTP: analyze-audio ----

func TestTAnAnalyzeAudioSuccess(t *testing.T) {
	t.Run("overall_observation gets default status and modelUsed", func(t *testing.T) {
		s, fake := tAnNewServer(t, tAnConst(`{"overall_observation":"Voice is strong and clear."}`))
		rec := tAnPost(s, "/api/analyze-audio", `{"audio":"data:audio/ogg;base64,QUJD"}`)
		if rec.Code != 200 {
			t.Fatalf("status %d", rec.Code)
		}
		got := tAnDecode(t, rec)
		if got["status"] != "success" || got["modelUsed"] != float64(1) {
			t.Errorf("got %v", got)
		}
		idm := fake.bodies[0].Contents[0].Parts[1].InlineData
		if idm.MimeType != "audio/ogg" || idm.Data != "QUJD" {
			t.Errorf("inline=%+v", idm)
		}
	})
	t.Run("existing status preserved", func(t *testing.T) {
		s, _ := tAnNewServer(t, tAnConst("```json\n"+`{"overall_observation":"silence","status":"silence"}`+"\n```"))
		got := tAnDecode(t, tAnPost(s, "/api/analyze-audio", `{"audio":"QUJD"}`))
		if got["status"] != "silence" {
			t.Errorf("status=%v", got["status"])
		}
	})
	t.Run("voice_quality_analysis alone is accepted", func(t *testing.T) {
		s, fake := tAnNewServer(t, tAnConst(`{"voice_quality_analysis":{"observation":"x"}}`))
		got := tAnDecode(t, tAnPost(s, "/api/analyze-audio", `{"audio":"QUJD"}`))
		if got["status"] != "success" || got["modelUsed"] != float64(1) {
			t.Errorf("got %v", got)
		}
		// raw base64 -> default webm mime
		if mt := fake.bodies[0].Contents[0].Parts[1].InlineData.MimeType; mt != "audio/webm" {
			t.Errorf("mime=%q", mt)
		}
	})
}

func TestTAnAnalyzeAudioFallbacks(t *testing.T) {
	t.Run("non-JSON long text -> partial", func(t *testing.T) {
		longText := strings.Repeat("The patient's voice is soft. ", 4)
		s, _ := tAnNewServer(t, tAnConst(longText))
		got := tAnDecode(t, tAnPost(s, "/api/analyze-audio", `{"audio":"QUJD"}`))
		if got["status"] != "partial" || got["overall_observation"] != strings.TrimSpace(longText) || got["modelUsed"] != float64(1) {
			t.Errorf("got %v", got)
		}
	})
	t.Run("non-JSON short text on both models -> pending placeholder", func(t *testing.T) {
		s, fake := tAnNewServer(t, tAnConst("short"))
		got := tAnDecode(t, tAnPost(s, "/api/analyze-audio", `{"audio":"QUJD"}`))
		if got["status"] != "pending" || got["modelUsed"] != float64(0) {
			t.Errorf("got %v", got)
		}
		if fake.calls != 2 {
			t.Errorf("calls=%d", fake.calls)
		}
	})
	t.Run("JSON without expected keys -> pending placeholder", func(t *testing.T) {
		s, _ := tAnNewServer(t, tAnConst(`{"foo":"bar"}`))
		got := tAnDecode(t, tAnPost(s, "/api/analyze-audio", `{"audio":"QUJD"}`))
		if got["status"] != "pending" {
			t.Errorf("got %v", got)
		}
	})
	t.Run("api errors -> pending placeholder with full shape", func(t *testing.T) {
		s, _ := tAnNewServer(t, func(int, string, gemini.GenerateRequest) (string, bool) { return "", true })
		got := tAnDecode(t, tAnPost(s, "/api/analyze-audio", `{"audio":"QUJD"}`))
		for _, k := range []string{"overall_observation", "voice_quality_analysis", "breathing_patterns",
			"speech_patterns", "cough_sounds", "pattern_suggestions", "recommendations", "confidence", "notes"} {
			if _, ok := got[k]; !ok {
				t.Errorf("placeholder missing %q", k)
			}
		}
		if got["confidence"] != "low" {
			t.Errorf("confidence=%v", got["confidence"])
		}
	})
	t.Run("second model succeeds", func(t *testing.T) {
		s, _ := tAnNewServer(t, func(call int, _ string, _ gemini.GenerateRequest) (string, bool) {
			if call == 0 {
				return "", true
			}
			return `{"overall_observation":"ok"}`, false
		})
		got := tAnDecode(t, tAnPost(s, "/api/analyze-audio", `{"audio":"QUJD"}`))
		if got["modelUsed"] != float64(2) || got["status"] != "success" {
			t.Errorf("got %v", got)
		}
	})
}

// ---- HTTP: analyze-snore ----

func TestTAnAnalyzeSnore(t *testing.T) {
	t.Run("success builds prompt from duration and tcmContext", func(t *testing.T) {
		s, fake := tAnNewServer(t, tAnConst("```json\n"+`{"snoring_detected":true,"severity":"mild"}`+"\n```"))
		rec := tAnPost(s, "/api/analyze-snore",
			`{"audio":"data:audio/mp4;base64,QUJD","duration":12.5,"tcmContext":{"pattern":"Phlegm-Dampness"}}`)
		if rec.Code != 200 {
			t.Fatalf("status %d body=%s", rec.Code, rec.Body.String())
		}
		got := tAnDecode(t, rec)
		if got["snoring_detected"] != true || got["severity"] != "mild" {
			t.Errorf("got %v", got)
		}
		req := fake.bodies[0]
		prompt := req.Contents[0].Parts[0].Text
		if !strings.Contains(prompt, "12.5 seconds long") {
			t.Errorf("duration missing from prompt")
		}
		if !strings.Contains(prompt, `{"pattern":"Phlegm-Dampness"}`) {
			t.Errorf("tcm context missing from prompt")
		}
		// Mime is hardcoded to audio/webm regardless of data URL.
		if id := req.Contents[0].Parts[1].InlineData; id.MimeType != "audio/webm" || id.Data != "QUJD" {
			t.Errorf("inline=%+v", id)
		}
		if req.SystemInstruction == nil || !strings.Contains(req.SystemInstruction.Parts[0].Text, "Hān Mián") {
			t.Errorf("snore system prompt missing")
		}
		if req.GenerationConfig.MaxOutputTokens != 2048 {
			t.Errorf("max tokens=%d", req.GenerationConfig.MaxOutputTokens)
		}
	})
	t.Run("defaults when duration and context absent", func(t *testing.T) {
		s, fake := tAnNewServer(t, tAnConst(`{"ok":true}`))
		rec := tAnPost(s, "/api/analyze-snore", `{"audio":"QUJD"}`)
		if rec.Code != 200 {
			t.Fatalf("status %d", rec.Code)
		}
		prompt := fake.bodies[0].Contents[0].Parts[0].Text
		if !strings.Contains(prompt, "unknown seconds long") || !strings.Contains(prompt, "No previous diagnosis data available.") {
			t.Errorf("defaults missing: %s", prompt)
		}
	})
	t.Run("AI quota error -> 429 generic", func(t *testing.T) {
		s, _ := tAnNewServer(t, func(int, string, gemini.GenerateRequest) (string, bool) { return "", true })
		rec := tAnPost(s, "/api/analyze-snore", `{"audio":"QUJD"}`)
		if rec.Code != 429 {
			t.Fatalf("status %d", rec.Code)
		}
		if e, _ := tAnDecode(t, rec)["error"].(string); strings.Contains(e, "API error") || e == "" {
			t.Errorf("error=%q", e)
		}
	})
	t.Run("unparseable AI output -> 502", func(t *testing.T) {
		s, _ := tAnNewServer(t, tAnConst("not json"))
		rec := tAnPost(s, "/api/analyze-snore", `{"audio":"QUJD"}`)
		if rec.Code != 502 || tAnDecode(t, rec)["error"] != "failed to parse AI response" {
			t.Fatalf("status %d body=%s", rec.Code, rec.Body.String())
		}
	})
}

// ---- HTTP: extract-text ----

func TestTAnExtractTextGeneral(t *testing.T) {
	t.Run("string text", func(t *testing.T) {
		s, fake := tAnNewServer(t, tAnConst(`{"text":"Hb 12.3 g/dL"}`))
		rec := tAnPost(s, "/api/extract-text", `{"file":"data:application/pdf;base64,JVBERi0xLjQK","fileName":"lab.pdf"}`)
		if rec.Code != 200 {
			t.Fatalf("status %d", rec.Code)
		}
		got := tAnDecode(t, rec)
		if got["text"] != "Hb 12.3 g/dL" || got["warning"] != nil {
			t.Errorf("got %v", got)
		}
		if _, has := got["is_valid"]; has {
			t.Errorf("general mode must not set is_valid")
		}
		req := fake.bodies[0]
		if id := req.Contents[0].Parts[1].InlineData; id.MimeType != "application/pdf" || id.Data != "JVBERi0xLjQK" {
			t.Errorf("inline=%+v", id)
		}
		if !strings.Contains(req.Contents[0].Parts[0].Text, "Language for response: English") {
			t.Errorf("default language should be English")
		}
	})
	t.Run("object text is marshalled to string", func(t *testing.T) {
		s, _ := tAnNewServer(t, tAnConst(`{"text":{"a":1}}`))
		got := tAnDecode(t, tAnPost(s, "/api/extract-text", `{"file":"iVBORw0KGgo="}`))
		if got["text"] != `{"a":1}` {
			t.Errorf("text=%v", got["text"])
		}
	})
	t.Run("missing text key returns raw AI text", func(t *testing.T) {
		s, _ := tAnNewServer(t, tAnConst(`{"other":1}`))
		got := tAnDecode(t, tAnPost(s, "/api/extract-text", `{"file":"iVBORw0KGgo="}`))
		if got["text"] != `{"other":1}` {
			t.Errorf("text=%v", got["text"])
		}
	})
	t.Run("non-JSON output returns raw text with nil warning", func(t *testing.T) {
		s, _ := tAnNewServer(t, tAnConst("plain words"))
		got := tAnDecode(t, tAnPost(s, "/api/extract-text", `{"file":"iVBORw0KGgo="}`))
		if got["text"] != "plain words" || got["warning"] != nil {
			t.Errorf("got %v", got)
		}
	})
	t.Run("AI quota error -> 429 without upstream text", func(t *testing.T) {
		s, _ := tAnNewServer(t, func(int, string, gemini.GenerateRequest) (string, bool) { return "", true })
		rec := tAnPost(s, "/api/extract-text", `{"file":"iVBORw0KGgo="}`)
		if rec.Code != 429 || strings.Contains(rec.Body.String(), "API error") {
			t.Fatalf("status %d body=%s", rec.Code, rec.Body.String())
		}
	})
}

func TestTAnExtractTextMimeDetection(t *testing.T) {
	tests := []struct {
		name, body, wantMime string
	}{
		// the declared type (reduced to type/subtype) goes to the model; only analyze-image checks the bytes
		{"data url mime wins", `{"file":"data:image/webp;base64,UklGRgAAAABXRUJQVlA4IA==","fileName":"a.pdf"}`, "image/webp"},
		{"fileName extension", `{"file":"/9j/4AAQSkZJRgAB","fileName":"scan.JPG"}`, "image/jpeg"},
		{"fileType hint", `{"file":"JVBERi0xLjQK","fileType":"application/x.pdf"}`, "application/pdf"},
		{"no hints defaults to png", `{"file":"iVBORw0KGgo="}`, "image/png"},
	}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			s, fake := tAnNewServer(t, tAnConst(`{"text":"x"}`))
			if rec := tAnPost(s, "/api/extract-text", tc.body); rec.Code != 200 {
				t.Fatalf("status %d", rec.Code)
			}
			if mt := fake.bodies[0].Contents[0].Parts[1].InlineData.MimeType; mt != tc.wantMime {
				t.Fatalf("mime=%q want %q", mt, tc.wantMime)
			}
		})
	}
}

func TestTAnExtractTextLanguages(t *testing.T) {
	tests := []struct{ lang, want string }{
		{"zh", "Chinese (简体中文)"},
		{"ms", "Malay (Bahasa Malaysia)"},
		{"en", "English"},
		{"fr", "English"},
		{"", "English"},
	}
	for _, tc := range tests {
		t.Run("lang="+tc.lang, func(t *testing.T) {
			s, fake := tAnNewServer(t, tAnConst(`{"text":"x"}`))
			tAnPost(s, "/api/extract-text", `{"file":"iVBORw0KGgo=","language":"`+tc.lang+`"}`)
			if p := fake.bodies[0].Contents[0].Parts[0].Text; !strings.Contains(p, "Language for response: "+tc.want) {
				t.Fatalf("prompt lacks language %q", tc.want)
			}
		})
	}
}

func TestTAnExtractTextMedicineMode(t *testing.T) {
	t.Run("medicine image", func(t *testing.T) {
		s, fake := tAnNewServer(t, tAnConst(`{"is_medicine_image":true,"text":"Panadol 500mg","warning":"check dose"}`))
		got := tAnDecode(t, tAnPost(s, "/api/extract-text", `{"file":"iVBORw0KGgo=","mode":"medicine"}`))
		if got["text"] != "Panadol 500mg" || got["warning"] != "check dose" || got["is_valid"] != true {
			t.Errorf("got %v", got)
		}
		if !strings.Contains(fake.bodies[0].Contents[0].Parts[0].Text, "extract ONLY medicine-related information") {
			t.Errorf("medicine prompt not used")
		}
	})
	t.Run("medicine text object is stringified", func(t *testing.T) {
		s, _ := tAnNewServer(t, tAnConst(`{"is_medicine_image":true,"text":["a","b"]}`))
		got := tAnDecode(t, tAnPost(s, "/api/extract-text", `{"file":"iVBORw0KGgo=","mode":"medicine"}`))
		if got["text"] != `["a","b"]` {
			t.Errorf("text=%v", got["text"])
		}
	})
	noMed := []struct{ lang, marker string }{
		{"en", "=== NO MEDICINE DETECTED ==="},
		{"zh", "=== 未检测到药物 ==="},
		{"ms", "=== TIADA UBAT DIKESAN ==="},
		{"xx", "=== NO MEDICINE DETECTED ==="},
		{"", "=== NO MEDICINE DETECTED ==="},
	}
	for _, tc := range noMed {
		t.Run("not medicine lang="+tc.lang, func(t *testing.T) {
			s, _ := tAnNewServer(t, tAnConst(`{"is_medicine_image":false,"text":"it is pizza"}`))
			got := tAnDecode(t, tAnPost(s, "/api/extract-text",
				`{"file":"/9j/4AAQSkZJRgAB","mode":"medicine","fileName":"pizza.jpg","language":"`+tc.lang+`"}`))
			text, _ := got["text"].(string)
			if got["is_valid"] != false || !strings.Contains(text, tc.marker) || !strings.Contains(text, "pizza.jpg") {
				t.Errorf("got %v", got)
			}
			if strings.Contains(text, "it is pizza") {
				t.Errorf("AI text should be replaced by canned message")
			}
		})
	}
	t.Run("missing is_medicine_image flag treated as not medicine", func(t *testing.T) {
		s, _ := tAnNewServer(t, tAnConst(`{"text":"Panadol"}`))
		got := tAnDecode(t, tAnPost(s, "/api/extract-text", `{"file":"iVBORw0KGgo=","mode":"medicine"}`))
		if got["is_valid"] != false {
			t.Errorf("got %v", got)
		}
	})
}

// ---- HTTP: validate-medicine ----

func TestTAnValidateMedicine(t *testing.T) {
	t.Run("success passes through AI JSON", func(t *testing.T) {
		s, fake := tAnNewServer(t, tAnConst("```json\n"+`{"isValid":true,"message":"ok"}`+"\n```"))
		rec := tAnPost(s, "/api/validate-medicine", `{"text":"Panadol","language":"ms"}`)
		if rec.Code != 200 {
			t.Fatalf("status %d", rec.Code)
		}
		got := tAnDecode(t, rec)
		if got["isValid"] != true || got["message"] != "ok" {
			t.Errorf("got %v", got)
		}
		p := fake.bodies[0].Contents[0].Parts[0].Text
		if !strings.Contains(p, `text: "Panadol"`) || !strings.Contains(p, "user's language (ms)") {
			t.Errorf("prompt wrong: %s", p)
		}
		if fake.bodies[0].SystemInstruction != nil {
			t.Errorf("no system instruction expected")
		}
	})
	t.Run("default language en", func(t *testing.T) {
		s, fake := tAnNewServer(t, tAnConst(`{"isValid":false,"message":"nope"}`))
		got := tAnDecode(t, tAnPost(s, "/api/validate-medicine", `{"text":"hello"}`))
		if got["isValid"] != false {
			t.Errorf("got %v", got)
		}
		if !strings.Contains(fake.bodies[0].Contents[0].Parts[0].Text, "user's language (en)") {
			t.Errorf("default language missing")
		}
	})
	t.Run("AI quota error -> 429", func(t *testing.T) {
		s, _ := tAnNewServer(t, func(int, string, gemini.GenerateRequest) (string, bool) { return "", true })
		rec := tAnPost(s, "/api/validate-medicine", `{"text":"x"}`)
		if rec.Code != 429 {
			t.Fatalf("status %d", rec.Code)
		}
	})
	t.Run("unparseable -> 502", func(t *testing.T) {
		s, _ := tAnNewServer(t, tAnConst("maybe"))
		rec := tAnPost(s, "/api/validate-medicine", `{"text":"x"}`)
		if rec.Code != 502 || tAnDecode(t, rec)["error"] != "failed to parse AI response" {
			t.Fatalf("status %d body=%s", rec.Code, rec.Body.String())
		}
	})
}

// ---- HTTP: generate-inquiry (same file, same fallback contract) ----

func TestTAnGenerateInquiry(t *testing.T) {
	t.Run("success passes AI questions through and fills unknown patient info", func(t *testing.T) {
		s, fake := tAnNewServer(t, tAnConst(`{"questions":[{"id":"a","question":"Q?","choices":[],"multiSelect":false}]}`))
		rec := tAnInquiry(s, `{"patientInfo":{"gender":"female"},"symptoms":"cough"}`)
		if rec.Code != 200 {
			t.Fatalf("status %d", rec.Code)
		}
		qs, _ := tAnDecode(t, rec)["questions"].([]any)
		if len(qs) != 1 {
			t.Errorf("questions=%v", qs)
		}
		p := fake.bodies[0].Contents[0].Parts[0].Text
		for _, want := range []string{"- Age: Unknown", "- Gender: female", "- Height: Unknown cm", "Symptoms: cough"} {
			if !strings.Contains(p, want) {
				t.Errorf("prompt missing %q", want)
			}
		}
	})
	t.Run("numeric patient info rendered", func(t *testing.T) {
		s, fake := tAnNewServer(t, tAnConst(`{"questions":[{"id":"a"}]}`))
		tAnInquiry(s, `{"patientInfo":{"age":35,"height":170,"weight":65}}`)
		p := fake.bodies[0].Contents[0].Parts[0].Text
		for _, want := range []string{"- Age: 35", "- Height: 170 cm", "- Weight: 65 kg", "Symptoms: None provided"} {
			if !strings.Contains(p, want) {
				t.Errorf("prompt missing %q", want)
			}
		}
	})
	t.Run("bad JSON -> 400", func(t *testing.T) {
		s, fake := tAnNewServer(t, tAnConst("{}"))
		if rec := tAnInquiry(s, `{oops`); rec.Code != 400 {
			t.Fatalf("status %d", rec.Code)
		}
		if fake.calls != 0 {
			t.Errorf("AI called")
		}
	})
	fallbacks := map[string]func(int, string, gemini.GenerateRequest) (string, bool){
		"AI error":            func(int, string, gemini.GenerateRequest) (string, bool) { return "", true },
		"empty response":      tAnConst("   "),
		"unparseable":         tAnConst("not json"),
		"empty questions":     tAnConst(`{"questions":[]}`),
		"missing questions":   tAnConst(`{"foo":1}`),
		"questions not array": tAnConst(`{"questions":"x"}`),
		"questions null":      tAnConst(`{"questions":null}`),
	}
	for name, fn := range fallbacks {
		t.Run("fallback on "+name, func(t *testing.T) {
			s, _ := tAnNewServer(t, fn)
			rec := tAnInquiry(s, `{}`)
			if rec.Code != 200 {
				t.Fatalf("status %d", rec.Code)
			}
			qs, _ := tAnDecode(t, rec)["questions"].([]any)
			if len(qs) != 6 {
				t.Fatalf("expected 6 fallback questions, got %d", len(qs))
			}
		})
	}
}

// tAnInquiry calls handleGenerateInquiry directly as an authenticated doctor
// (the mux route itself requires a session; see TestTAnGenerateInquiryAuth).
func tAnInquiry(s *Server, body string) *httptest.ResponseRecorder {
	req := httptest.NewRequest(http.MethodPost, "/api/doctor/generate-inquiry", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	s.handleGenerateInquiry(rec, req, &AuthUser{ID: "u1", Role: "doctor"})
	return rec
}

func TestTAnGenerateInquiryAuth(t *testing.T) {
	s, fake := tAnNewServer(t, tAnConst(`{"questions":[{"id":"a"}]}`))
	rec := tAnPost(s, "/api/doctor/generate-inquiry", `{}`)
	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("anonymous status %d want 401", rec.Code)
	}
	if fake.calls != 0 {
		t.Errorf("AI called %d times for an anonymous request", fake.calls)
	}
}
