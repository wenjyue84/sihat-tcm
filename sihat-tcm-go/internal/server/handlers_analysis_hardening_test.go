package server

import (
	"encoding/base64"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"
	"unicode/utf8"

	"sihattcm/internal/gemini"
)

const tHardPNG = "data:image/png;base64,iVBORw0KGgo="
const tHardWEBM = "data:audio/webm;base64,GkXfowEAAAAAAAAf"

func TestTAnTruncRunes(t *testing.T) {
	cases := []struct {
		in   string
		n    int
		want string
	}{
		{"hello", 10, "hello"},
		{"hello", 3, "hel"},
		{"你好世界", 2, "你好"},
		{"你好世界", 4, "你好世界"},
		{"你好世界", 0, ""},
		{"a😀b", 2, "a😀"},
		{"", 5, ""},
	}
	for _, c := range cases {
		got := anTruncRunes(c.in, c.n)
		if got != c.want || !utf8.ValidString(got) {
			t.Errorf("anTruncRunes(%q,%d)=%q want %q", c.in, c.n, got, c.want)
		}
	}
}

func TestTSumPlaceholderSVGMultibyteStaysValidUTF8(t *testing.T) {
	long := strings.Repeat("你好", 40)
	rd := map[string]any{
		"diagnosis": long,
		"recommendations": map[string]any{
			"food_therapy": map[string]any{"beneficial": []any{long}},
		},
	}
	url := sumPlaceholderSVG(rd, nil, "modern")
	raw, err := base64.StdEncoding.DecodeString(strings.TrimPrefix(url, "data:image/svg+xml;base64,"))
	if err != nil {
		t.Fatal(err)
	}
	if !utf8.Valid(raw) {
		t.Fatal("SVG contains invalid UTF-8 (label truncated mid-rune)")
	}
	if !strings.Contains(string(raw), strings.Repeat("你好", 25)+"...") {
		t.Errorf("diagnosis label not truncated to 50 runes + ellipsis")
	}
}

func TestTAnExtractJSONStringConcurrent(t *testing.T) {
	var wg sync.WaitGroup
	fields := []string{"a", "b", "c", "d", "e", "f", "observation", "g", "h"}
	for i := 0; i < 64; i++ {
		wg.Add(1)
		go func(i int) {
			defer wg.Done()
			f := fields[i%len(fields)]
			got := anExtractJSONString(`{"`+f+`": "v`+f+`"`, f)
			if got != "v"+f {
				t.Errorf("field %s got %q", f, got)
			}
		}(i)
	}
	wg.Wait()
}

func TestTAnExtractJSONConfidence(t *testing.T) {
	cases := []struct {
		in   string
		want float64
		ok   bool
	}{
		{`{"confidence": 85, "obs`, 85, true},
		{`{"confidence":72.5,`, 72.5, true},
		{`{"confidence": "91"`, 91, true},
		{`{"confidence": 0,`, 0, true},
		{`{"nothing": 1`, 0, false},
	}
	for _, c := range cases {
		got, ok := anExtractJSONConfidence(c.in)
		if got != c.want || ok != c.ok {
			t.Errorf("%q => (%v,%v) want (%v,%v)", c.in, got, ok, c.want, c.ok)
		}
	}
}

func TestTAnStrOrDefaultZero(t *testing.T) {
	if got := strOrDefault("0", "Unknown"); got != "0" {
		t.Errorf("'0' must be kept, got %q", got)
	}
	for _, in := range []string{"", "   ", "\t\n", "<nil>"} {
		if got := strOrDefault(in, "Unknown"); got != "Unknown" {
			t.Errorf("strOrDefault(%q)=%q want default", in, got)
		}
	}
}

func TestTAnBadJSONIsJSONContentType(t *testing.T) {
	s, _ := tAnNewServer(t, tAnConst("{}"))
	rec := tAnPost(s, "/api/analyze-image", `{nope`)
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("status %d", rec.Code)
	}
	if ct := rec.Header().Get("Content-Type"); !strings.HasPrefix(ct, "application/json") {
		t.Errorf("Content-Type=%q want application/json", ct)
	}
	if tAnDecode(t, rec)["error"] == "" {
		t.Error("missing error field")
	}
}

func TestTAnBodyTooLarge413(t *testing.T) {
	s, fake := tAnNewServer(t, tAnConst("{}"))
	big := `{"text":"` + strings.Repeat("A", anMaxBodyBytes+10) + `"}`
	rec := tAnPost(s, "/api/validate-medicine", big)
	if rec.Code != http.StatusRequestEntityTooLarge {
		t.Fatalf("status %d want 413", rec.Code)
	}
	if fake.calls != 0 {
		t.Error("AI called")
	}
}

func TestTAnMediaValidationRejectsBeforeAI(t *testing.T) {
	s, fake := tAnNewServer(t, tAnConst("{}"))
	big := "data:image/png;base64," + strings.Repeat("A", anMaxMediaB64+4)
	cases := []struct {
		name, path, body string
		want             int
	}{
		{"image not data url mime", "/api/analyze-image", `{"image":"data:text/html;base64,PGI+"}`, 400},
		{"image data url without base64", "/api/analyze-image", `{"image":"data:image/png,abc"}`, 400},
		{"image not base64", "/api/analyze-image", `{"image":"not base64 !!!"}`, 400},
		{"image audio mime", "/api/analyze-image", `{"image":"` + tHardWEBM + `"}`, 400},
		{"image oversize", "/api/analyze-image", `{"image":"` + big + `"}`, 413},
		{"image type too long", "/api/analyze-image", `{"image":"` + tHardPNG + `","type":"` + strings.Repeat("x", 100) + `"}`, 400},
		{"image symptoms too long", "/api/analyze-image", `{"image":"` + tHardPNG + `","symptoms":"` + strings.Repeat("x", anMaxTextField+1) + `"}`, 400},
		{"audio image mime", "/api/analyze-audio", `{"audio":"` + tHardPNG + `"}`, 400},
		{"audio garbage", "/api/analyze-audio", `{"audio":"%%%"}`, 400},
		{"snore image mime", "/api/analyze-snore", `{"audio":"` + tHardPNG + `"}`, 400},
		{"snore garbage", "/api/analyze-snore", `{"audio":"@@@@"}`, 400},
		{"extract script mime", "/api/extract-text", `{"file":"data:application/x-sh;base64,AAAA"}`, 400},
		{"extract garbage", "/api/extract-text", `{"file":"<html>"}`, 400},
		{"medicine text too long", "/api/validate-medicine", `{"text":"` + strings.Repeat("x", anMaxTextField+1) + `"}`, 400},
		{"medicine language too long", "/api/validate-medicine", `{"text":"x","language":"` + strings.Repeat("x", 100) + `"}`, 400},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			rec := tAnPost(s, c.path, c.body)
			if rec.Code != c.want {
				t.Fatalf("status %d want %d body=%.120s", rec.Code, c.want, rec.Body.String())
			}
		})
	}
	if fake.calls != 0 {
		t.Errorf("AI was called %d times for invalid payloads", fake.calls)
	}
}

func TestTAnMediaValidationAcceptsLegitimate(t *testing.T) {
	s, fake := tAnNewServer(t, tAnConst(`{"overall_observation":"ok enough","status":"success"}`))
	for _, c := range []struct{ path, body string }{
		{"/api/analyze-audio", `{"audio":"` + tHardWEBM + `"}`},
		{"/api/analyze-audio", `{"audio":"data:audio/webm;codecs=opus;base64,QUJD"}`},
		{"/api/analyze-audio", `{"audio":"QUJD"}`},
		{"/api/analyze-snore", `{"audio":"data:audio/mp4;base64,QUJD","duration":5}`},
		// images and PDFs are checked by their magic bytes (png / jpeg / webp / heic, %PDF), not by the label
		{"/api/extract-text", `{"file":"data:application/pdf;base64,JVBERi0xLjQK","fileName":"a.pdf"}`},
		{"/api/extract-text", `{"file":"/9j/4AAQSkZJRgAB","fileName":"a.jpg"}`},
		{"/api/analyze-image", `{"image":"iVBORw0KGgo="}`},
	} {
		rec := tAnPost(s, c.path, c.body)
		if rec.Code != http.StatusOK {
			t.Errorf("%s %.40s -> %d %.100s", c.path, c.body, rec.Code, rec.Body.String())
		}
	}
	if fake.calls == 0 {
		t.Error("AI never called")
	}
}

func TestTAnUpstreamErrorsNotEchoed(t *testing.T) {
	const secret = "https://generativelanguage.googleapis.com/v1/models/x:generateContent?key=AIzaSECRETKEY123"
	for _, c := range []struct {
		name, path, body string
		quota            bool
		want             int
	}{
		{"snore quota", "/api/analyze-snore", `{"audio":"` + tHardWEBM + `"}`, true, 429},
		{"snore other", "/api/analyze-snore", `{"audio":"` + tHardWEBM + `"}`, false, 502},
		{"extract quota", "/api/extract-text", `{"file":"` + tHardPNG + `"}`, true, 429},
		{"extract other", "/api/extract-text", `{"file":"` + tHardPNG + `"}`, false, 502},
		{"validate quota", "/api/validate-medicine", `{"text":"x"}`, true, 429},
		{"validate other", "/api/validate-medicine", `{"text":"x"}`, false, 502},
	} {
		t.Run(c.name, func(t *testing.T) {
			s, _ := tAnNewServer(t, tAnConst("x"))
			// Point the client at a dead URL so the transport error embeds the key-bearing URL.
			s.AI = &gemini.Client{APIKey: "AIzaSECRETKEY123", HTTP: http.DefaultClient, BaseURL: "http://127.0.0.1:1"}
			if c.quota {
				ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
					_, _ = w.Write([]byte(`{"error":{"code":429,"message":"quota exceeded for ` + secret + `"}}`))
				}))
				defer ts.Close()
				s.AI = &gemini.Client{APIKey: "AIzaSECRETKEY123", HTTP: ts.Client(), BaseURL: ts.URL}
			}
			rec := tAnPost(s, c.path, c.body)
			if rec.Code != c.want {
				t.Fatalf("status %d want %d: %s", rec.Code, c.want, rec.Body.String())
			}
			b := rec.Body.String()
			for _, leak := range []string{"AIza", "googleapis", "127.0.0.1", "gemini:", "key="} {
				if strings.Contains(b, leak) {
					t.Errorf("response leaks %q: %s", leak, b)
				}
			}
			if !strings.HasPrefix(rec.Header().Get("Content-Type"), "application/json") {
				t.Errorf("Content-Type=%q", rec.Header().Get("Content-Type"))
			}
		})
	}
}

func TestTAnAnalyzeImageSalvagesNumericConfidence(t *testing.T) {
	// Truncated JSON with a NUMERIC confidence of 40 -> must be treated as low confidence.
	trunc := `{"is_valid_image": true, "image_description": "blurry", "observation": "` + tAnLongObs + `", "confidence": 40, "analysis_tags": [{"title"`
	s, _ := tAnNewServer(t, tAnConst(trunc))
	rec := tAnPost(s, "/api/analyze-image", `{"image":"`+tHardPNG+`","type":"tongue"}`)
	m := tAnDecode(t, rec)
	if m["status"] != "invalid_image" {
		t.Errorf("numeric low confidence ignored: %v", m)
	}
	if c, _ := m["confidence"].(float64); c != 40 {
		t.Errorf("confidence=%v want 40", m["confidence"])
	}
}

func TestTAnValidateMedicineRequiresVerdict(t *testing.T) {
	s, _ := tAnNewServer(t, tAnConst(`{"ok":true}`))
	rec := tAnPost(s, "/api/validate-medicine", `{"text":"Panadol"}`)
	if rec.Code != http.StatusBadGateway {
		t.Fatalf("status %d want 502 (no invented verdict): %s", rec.Code, rec.Body.String())
	}
	s, _ = tAnNewServer(t, tAnConst(`{"isValid":true}`))
	rec = tAnPost(s, "/api/validate-medicine", `{"text":"Panadol"}`)
	m := tAnDecode(t, rec)
	if rec.Code != 200 || m["isValid"] != true || m["message"] != "" {
		t.Fatalf("status %d body=%s", rec.Code, rec.Body.String())
	}
}
