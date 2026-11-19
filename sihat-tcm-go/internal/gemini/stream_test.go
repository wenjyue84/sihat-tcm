package gemini

import (
	"context"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func tgemSSEServer(t *testing.T, status int, body string, cap *TGemCapture) *httptest.Server {
	t.Helper()
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if cap != nil {
			cap.add(r)
		}
		w.Header().Set("Content-Type", "text/event-stream")
		w.WriteHeader(status)
		_, _ = io.WriteString(w, body)
	}))
}

func tgemChunk(text string) string {
	return "data: " + tgemOKBody(text) + "\n\n"
}

func TestTGemStreamNoAPIKey(t *testing.T) {
	c := &Client{HTTP: &http.Client{}}
	_, err := c.GenerateStream(context.Background(), "", GenerateRequest{}, nil)
	if err == nil || !strings.Contains(err.Error(), "API key not configured") {
		t.Fatalf("err=%v", err)
	}
}

func TestTGemStreamRequestShape(t *testing.T) {
	cap := &TGemCapture{}
	srv := tgemSSEServer(t, 200, tgemChunk("x"), cap)
	defer srv.Close()
	_, err := tgemClient(srv.URL+"/").GenerateStream(context.Background(), "gemini-2.5-pro", GenerateRequest{
		Contents: []Content{{Role: "user", Parts: []Part{{Text: "hi"}}}},
	}, nil)
	if err != nil {
		t.Fatal(err)
	}
	if cap.meths[0] != http.MethodPost {
		t.Errorf("method=%s", cap.meths[0])
	}
	if cap.paths[0] != "/"+ModelPro+":streamGenerateContent" {
		t.Errorf("path=%s", cap.paths[0])
	}
	if cap.query[0] != "alt=sse&key=k-test" {
		t.Errorf("query=%s", cap.query[0])
	}
	if !strings.Contains(cap.bodies[0], `"text":"hi"`) {
		t.Errorf("body=%s", cap.bodies[0])
	}
}

func TestTGemStreamParsing(t *testing.T) {
	cases := []struct {
		name      string
		body      string
		want      string
		wantChunk []string
	}{
		{
			"multiple chunks",
			tgemChunk("Hel") + tgemChunk("lo") + tgemChunk("!"),
			"Hello!", []string{"Hel", "lo", "!"},
		},
		{
			"DONE terminates, later data ignored",
			tgemChunk("a") + "data: [DONE]\n\n" + tgemChunk("b"),
			"a", []string{"a"},
		},
		{
			"malformed chunk skipped",
			tgemChunk("a") + "data: {not json\n\n" + tgemChunk("b"),
			"ab", []string{"a", "b"},
		},
		{
			"non-data lines ignored",
			": comment\nevent: message\nid: 1\n" + tgemChunk("a") + "data:nospace\n",
			"a", []string{"a"},
		},
		{
			"empty text parts skipped",
			"data: " + tgemOKBody("") + "\n\n" + tgemChunk("z"),
			"z", []string{"z"},
		},
		{
			"multi-part chunk emits each part",
			"data: " + tgemOKBody("x", "y") + "\n\n",
			"xy", []string{"x", "y"},
		},
		{
			"chunk without candidates",
			"data: {}\n\n" + tgemChunk("k"),
			"k", []string{"k"},
		},
		{
			"CRLF line endings",
			strings.ReplaceAll(tgemChunk("a")+tgemChunk("b"), "\n", "\r\n"),
			"ab", []string{"a", "b"},
		},
		{"empty stream", "", "", nil},
		{"unicode preserved", tgemChunk("你好") + tgemChunk("世界"), "你好世界", []string{"你好", "世界"}},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			srv := tgemSSEServer(t, 200, tc.body, nil)
			defer srv.Close()
			var got []string
			full, err := tgemClient(srv.URL).GenerateStream(context.Background(), ModelFlash, GenerateRequest{}, func(s string) { got = append(got, s) })
			if err != nil {
				t.Fatal(err)
			}
			if full != tc.want {
				t.Errorf("full=%q want %q", full, tc.want)
			}
			if strings.Join(got, "|") != strings.Join(tc.wantChunk, "|") {
				t.Errorf("chunks=%q want %q", got, tc.wantChunk)
			}
		})
	}
}

// hunt ai-09: an error EVENT inside a 200 stream, or a MAX_TOKENS cut, is a failed stream: the caller must be able to
// tell it from a complete answer (it used to end as a clean, silently truncated reply).
func TestTGemStreamFailuresMidStream(t *testing.T) {
	cases := []struct {
		name, body, wantText, wantErr string
	}{
		{"error event after some text", tgemChunk("Your tongue is pale ") + `data: {"error":{"code":503,"message":"The model is overloaded","status":"UNAVAILABLE"}}` + "\n\n", "Your tongue is pale ", "stream error 503"},
		{"error event first", `data: {"error":{"code":429,"message":"quota"}}` + "\n\n" + tgemChunk("k"), "", "stream error 429"},
		{"max tokens cut", `data: {"candidates":[{"content":{"parts":[{"text":"half a rep"}]},"finishReason":"MAX_TOKENS"}]}` + "\n\n", "half a rep", "MAX_TOKENS"},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			srv := tgemSSEServer(t, 200, tc.body, nil)
			defer srv.Close()
			var got []string
			full, err := tgemClient(srv.URL).GenerateStream(context.Background(), ModelFlash, GenerateRequest{}, func(s string) { got = append(got, s) })
			if err == nil || !strings.Contains(err.Error(), tc.wantErr) {
				t.Fatalf("err=%v want it to contain %q", err, tc.wantErr)
			}
			if full != tc.wantText {
				t.Errorf("text so far = %q want %q", full, tc.wantText)
			}
		})
	}
	// a normal finish reason is not a failure
	srv := tgemSSEServer(t, 200, `data: {"candidates":[{"content":{"parts":[{"text":"done"}]},"finishReason":"STOP"}]}`+"\n\n", nil)
	defer srv.Close()
	if full, err := tgemClient(srv.URL).GenerateStream(context.Background(), ModelFlash, GenerateRequest{}, nil); err != nil || full != "done" {
		t.Fatalf("STOP: %q %v", full, err)
	}
}

func TestTGemStreamNilCallback(t *testing.T) {
	srv := tgemSSEServer(t, 200, tgemChunk("a")+tgemChunk("b"), nil)
	defer srv.Close()
	full, err := tgemClient(srv.URL).GenerateStream(context.Background(), ModelFlash, GenerateRequest{}, nil)
	if err != nil || full != "ab" {
		t.Fatalf("full=%q err=%v", full, err)
	}
}

func TestTGemStreamLargeLine(t *testing.T) {
	big := strings.Repeat("a", 200*1024) // exceeds bufio default 64KB token size
	srv := tgemSSEServer(t, 200, tgemChunk(big), nil)
	defer srv.Close()
	full, err := tgemClient(srv.URL).GenerateStream(context.Background(), ModelFlash, GenerateRequest{}, nil)
	if err != nil || full != big {
		t.Fatalf("len=%d err=%v", len(full), err)
	}
}

func TestTGemStreamNon200(t *testing.T) {
	long := strings.Repeat("e", 500)
	cases := []struct {
		name   string
		status int
		body   string
		parts  []string
	}{
		{"429", 429, `{"error":"quota"}`, []string{"stream status 429", "quota"}},
		{"500", 500, "internal", []string{"stream status 500", "internal"}},
		{"body truncated at 300", 400, long, []string{"stream status 400", strings.Repeat("e", 300) + "…"}},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			srv := tgemSSEServer(t, tc.status, tc.body, nil)
			defer srv.Close()
			called := false
			full, err := tgemClient(srv.URL).GenerateStream(context.Background(), ModelFlash, GenerateRequest{}, func(string) { called = true })
			if err == nil {
				t.Fatal("expected error")
			}
			for _, p := range tc.parts {
				if !strings.Contains(err.Error(), p) {
					t.Errorf("err %q missing %q", err, p)
				}
			}
			if tc.name == "body truncated at 300" && strings.Contains(err.Error(), strings.Repeat("e", 301)) {
				t.Error("body not truncated")
			}
			if full != "" || called {
				t.Errorf("full=%q called=%v", full, called)
			}
		})
	}
}

func TestTGemStreamTransportAndContext(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {}))
	url := srv.URL
	srv.Close()
	_, err := tgemClient(url).GenerateStream(context.Background(), ModelFlash, GenerateRequest{}, nil)
	if err == nil || !strings.Contains(err.Error(), "stream request failed") {
		t.Fatalf("err=%v", err)
	}

	srv2 := tgemSSEServer(t, 200, tgemChunk("x"), nil)
	defer srv2.Close()
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	if _, err := tgemClient(srv2.URL).GenerateStream(ctx, ModelFlash, GenerateRequest{}, nil); err == nil {
		t.Fatal("expected error for cancelled ctx")
	}

	c := &Client{APIKey: "k", HTTP: &http.Client{}, BaseURL: "http://bad host\x7f"}
	if _, err := c.GenerateStream(context.Background(), ModelFlash, GenerateRequest{}, nil); err == nil {
		t.Fatal("expected error for invalid URL")
	}
}

func TestTGemStreamWithFallback(t *testing.T) {
	newSrv := func(order *[]string) *httptest.Server {
		return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			m := strings.TrimSuffix(strings.TrimPrefix(r.URL.Path, "/"), ":streamGenerateContent")
			*order = append(*order, m)
			switch m {
			case "s-429":
				w.WriteHeader(429)
				_, _ = io.WriteString(w, "rate limited")
			case "s-503":
				w.WriteHeader(503)
				_, _ = io.WriteString(w, "unavailable")
			case "s-empty":
				w.WriteHeader(200)
			default:
				w.WriteHeader(200)
				_, _ = io.WriteString(w, tgemChunk("from-"+m))
			}
		}))
	}

	t.Run("first ok", func(t *testing.T) {
		var order []string
		srv := newSrv(&order)
		defer srv.Close()
		text, m, err := tgemClient(srv.URL).StreamWithFallback(context.Background(), []string{"s-a", "s-b"}, GenerateRequest{}, nil)
		if err != nil || text != "from-s-a" || m != "s-a" || len(order) != 1 {
			t.Fatalf("text=%q m=%q err=%v order=%v", text, m, err, order)
		}
	})
	t.Run("fails over in order and forwards chunks of winner only", func(t *testing.T) {
		var order []string
		srv := newSrv(&order)
		defer srv.Close()
		var chunks []string
		text, m, err := tgemClient(srv.URL).StreamWithFallback(context.Background(), []string{"s-429", "s-503", "s-win"}, GenerateRequest{}, func(s string) { chunks = append(chunks, s) })
		if err != nil || text != "from-s-win" || m != "s-win" {
			t.Fatalf("text=%q m=%q err=%v", text, m, err)
		}
		if strings.Join(order, ",") != "s-429,s-503,s-win" {
			t.Errorf("order=%v", order)
		}
		if len(chunks) != 1 || chunks[0] != "from-s-win" {
			t.Errorf("chunks=%v", chunks)
		}
	})
	t.Run("all fail returns last error", func(t *testing.T) {
		var order []string
		srv := newSrv(&order)
		defer srv.Close()
		text, m, err := tgemClient(srv.URL).StreamWithFallback(context.Background(), []string{"s-429", "s-503"}, GenerateRequest{}, nil)
		if err == nil || !strings.Contains(err.Error(), "503") || text != "" || m != "" {
			t.Fatalf("text=%q m=%q err=%v", text, m, err)
		}
	})
	t.Run("empty stream counts as success (current behavior)", func(t *testing.T) {
		var order []string
		srv := newSrv(&order)
		defer srv.Close()
		text, m, err := tgemClient(srv.URL).StreamWithFallback(context.Background(), []string{"s-empty", "s-b"}, GenerateRequest{}, nil)
		if err != nil || text != "" || m != "s-empty" || len(order) != 1 {
			t.Fatalf("text=%q m=%q err=%v order=%v", text, m, err, order)
		}
	})
	t.Run("no models yields nil error and empty result (current behavior)", func(t *testing.T) {
		text, m, err := (&Client{APIKey: "k", HTTP: &http.Client{}}).StreamWithFallback(context.Background(), nil, GenerateRequest{}, nil)
		if err != nil || text != "" || m != "" {
			t.Fatalf("text=%q m=%q err=%v", text, m, err)
		}
	})
}
