package server

import (
	"fmt"
	"html/template"
	"net/http"
	"net/http/httptest"
	"os"
	"regexp"
	"strings"
	"testing"
	"testing/fstest"

	"sihattcm/internal/config"
	"sihattcm/internal/gemini"
	"sihattcm/internal/supabase"
)

// demoTestServer builds a Server with the REAL templates and static tree from disk (tests run in
// internal/server, so the module root is two levels up).
func demoTestServer(t *testing.T) *Server {
	t.Helper()
	root := os.DirFS("../..")
	tmpl, err := template.New("").Funcs(templateFuncs()).ParseFS(root, "templates/*.html")
	if err != nil {
		t.Fatalf("parse templates: %v", err)
	}
	s := &Server{
		Cfg:    &config.Config{PublicBaseURL: "https://tcm.example.com/", Env: "development"},
		AI:     gemini.New(""),
		DB:     supabase.New("", "", ""),
		Tmpl:   tmpl,
		Mux:    http.NewServeMux(),
		Static: root,
	}
	s.routes()
	return s
}

func demoGet(s *Server, method, target string) *httptest.ResponseRecorder {
	req := httptest.NewRequest(method, target, nil)
	rec := httptest.NewRecorder()
	s.Handler().ServeHTTP(rec, req)
	return rec
}

func TestDemoPageServesTour(t *testing.T) {
	s := demoTestServer(t)
	rec := demoGet(s, "GET", "/demo")
	if rec.Code != 200 {
		t.Fatalf("GET /demo = %d, want 200", rec.Code)
	}
	if ct := rec.Header().Get("Content-Type"); !strings.HasPrefix(ct, "text/html") {
		t.Errorf("content-type = %q", ct)
	}
	body := rec.Body.String()
	for _, want := range []string{`<meta name="robots" content="noindex, nofollow">`, `/static/css/demo.css`, `/static/js/demo.js`, `data-dlang="zh"`} {
		if !strings.Contains(body, want) {
			t.Errorf("page missing %q", want)
		}
	}
	if got := rec.Header().Get("X-Robots-Tag"); !strings.Contains(got, "noindex") {
		t.Errorf("X-Robots-Tag = %q, want noindex", got)
	}
}

func TestDemoPageStableDOMIDs(t *testing.T) {
	s := demoTestServer(t)
	body := demoGet(s, "GET", "/demo").Body.String()
	for n := 0; n <= 8; n++ {
		if !strings.Contains(body, fmt.Sprintf(`id="act-%d"`, n)) {
			t.Errorf("missing id=act-%d", n)
		}
	}
	for _, a := range demoAdvantages {
		if !strings.Contains(body, `id="step-`+a.ID+`"`) {
			t.Errorf("missing advantage id step-%s", a.ID)
		}
	}
	steps := 0
	for _, act := range demoActs {
		for _, st := range act.Steps {
			steps++
			if !strings.Contains(body, `id="step-`+st.ID+`"`) {
				t.Errorf("missing id=step-%s", st.ID)
			}
			if !strings.HasPrefix(st.ID, fmt.Sprint(act.N)+"-") {
				t.Errorf("step %s does not belong to act %d", st.ID, act.N)
			}
		}
	}
	if steps < 30 {
		t.Errorf("only %d steps in the tour, want >= 30", steps)
	}
	if !strings.Contains(body, `id="step-8-1"`) || !strings.Contains(body, `id="step-8-2"`) {
		t.Error("summary steps step-8-1/step-8-2 missing")
	}
	for _, role := range []string{"patient", "doctor", "admin", "developer"} {
		if !strings.Contains(body, `data-quick="`+role+`"`) {
			t.Errorf("quick-login button for %s missing", role)
		}
	}
}

// Every visible string must exist in both languages: the zh/en spans come in matched, non-empty pairs.
func TestDemoPageBilingualPairs(t *testing.T) {
	s := demoTestServer(t)
	body := demoGet(s, "GET", "/demo").Body.String()
	zh := regexp.MustCompile(`<span class="zh"[^>]*>(.*?)</span>`).FindAllStringSubmatch(body, -1)
	en := regexp.MustCompile(`<span class="en"[^>]*>(.*?)</span>`).FindAllStringSubmatch(body, -1)
	if len(zh) == 0 || len(zh) != len(en) {
		t.Fatalf("zh spans=%d en spans=%d, want equal and > 0", len(zh), len(en))
	}
	for i := range zh {
		if strings.TrimSpace(zh[i][1]) == "" || strings.TrimSpace(en[i][1]) == "" {
			t.Errorf("pair %d has an empty half: zh=%q en=%q", i, zh[i][1], en[i][1])
		}
	}
	if !regexp.MustCompile(`[\x{4e00}-\x{9fff}]`).MatchString(zh[0][1] + zh[1][1] + zh[2][1]) {
		t.Error("zh spans contain no Chinese characters")
	}
}

func TestDemoContentIsComplete(t *testing.T) {
	check := func(where string, b demoBi) {
		t.Helper()
		if strings.TrimSpace(b.ZH) == "" || strings.TrimSpace(b.EN) == "" {
			t.Errorf("%s: empty zh/en (%q / %q)", where, b.ZH, b.EN)
		}
	}
	roles := map[string]bool{}
	seen := map[string]bool{}
	for _, act := range demoActs {
		check(fmt.Sprintf("act %d title", act.N), act.Title)
		check(fmt.Sprintf("act %d intro", act.N), act.Intro)
		if _, ok := demoRoleLabels[act.Role]; !ok {
			t.Errorf("act %d role %q has no label", act.N, act.Role)
		}
		for _, st := range act.Steps {
			if seen[st.ID] {
				t.Errorf("duplicate step id %s", st.ID)
			}
			seen[st.ID] = true
			roles[st.Role] = true
			check("step "+st.ID+" title", st.Title)
			check("step "+st.ID+" see", st.See)
			check("step "+st.ID+" why", st.Why)
			if !strings.HasPrefix(st.Href, "/") || strings.HasPrefix(st.Href, "//") {
				t.Errorf("step %s href %q must be a same-origin path", st.ID, st.Href)
			}
			if len(st.Verified) == 0 {
				t.Errorf("step %s has no 'Verified by' chip", st.ID)
			}
			if _, ok := demoRoleLabels[st.Role]; !ok {
				t.Errorf("step %s role %q has no label", st.ID, st.Role)
			}
		}
	}
	for _, r := range []string{"guest", "patient", "doctor", "admin", "developer", "system"} {
		if !roles[r] {
			t.Errorf("no step for role %s", r)
		}
	}
	if len(demoAdvantages) != 5 {
		t.Errorf("advantages = %d, want 5", len(demoAdvantages))
	}
	for _, a := range demoAdvantages {
		check("advantage "+a.ID+" title", a.Title)
		check("advantage "+a.ID+" body", a.Body)
	}
	want := map[string]string{"go": "1082", "integration": "982", "browser": "136", "realmodel": "81/81"}
	for _, st := range demoStats {
		check("stat "+st.Key, st.Label)
		if want[st.Key] != st.Value {
			t.Errorf("stat %s = %q, want %q (the last stamped predeploy counts)", st.Key, st.Value, want[st.Key])
		}
		delete(want, st.Key)
	}
	if len(want) != 0 {
		t.Errorf("stats missing: %v", want)
	}
}

func TestDemoPageNoExternalDependencies(t *testing.T) {
	s := demoTestServer(t)
	body := demoGet(s, "GET", "/demo").Body.String()
	if m := regexp.MustCompile(`(?i)(src|href)\s*=\s*["'](https?:)?//`).FindString(body); m != "" {
		t.Errorf("page references an external resource (%q): it must work offline", m)
	}
	if strings.Contains(body, "fonts.googleapis") || strings.Contains(body, "cdn.") {
		t.Error("page references a font/CDN host")
	}
	for _, f := range []string{"static/css/demo.css", "static/js/demo.js"} {
		b, err := os.ReadFile("../../" + f)
		if err != nil {
			t.Fatalf("%s: %v", f, err)
		}
		if regexp.MustCompile(`https?://`).Match(b) && !strings.Contains(string(b), "w3.org") {
			// only comments may mention URLs; flag real fetches
			if regexp.MustCompile(`url\(\s*["']?https?:|@import|fetch\(\s*["']https?:`).Match(b) {
				t.Errorf("%s fetches an external resource", f)
			}
		}
	}
}

func TestDemoPageParamsDoNotBreak(t *testing.T) {
	s := demoTestServer(t)
	for _, q := range []string{"?autoplay=1", "?autoplay=1&act=4", "?act=7", "?act=99", "?act=-1", "?act=abc", "?step=4-3", "?lang=en", "?autoplay=1&dwell=1500&loop=1&act=2", "?autoplay=%00"} {
		rec := demoGet(s, "GET", "/demo"+q)
		if rec.Code != 200 {
			t.Errorf("GET /demo%s = %d", q, rec.Code)
		}
		if !strings.Contains(rec.Body.String(), `id="act-8"`) {
			t.Errorf("GET /demo%s lost its DOM", q)
		}
	}
	on := demoGet(s, "GET", "/demo?autoplay=1").Body.String()
	off := demoGet(s, "GET", "/demo").Body.String()
	if !strings.Contains(on, `<body class="autoplay"`) || strings.Contains(off, `<body class="autoplay"`) {
		t.Error("autoplay=1 must (only) add the autoplay body class")
	}
	if !strings.Contains(demoGet(s, "GET", "/demo?act=4").Body.String(), `data-start-act="4"`) {
		t.Error("?act=4 not reflected in data-start-act")
	}
	if !strings.Contains(demoGet(s, "GET", "/demo?act=99").Body.String(), `data-start-act="0"`) {
		t.Error("out-of-range ?act must fall back to 0")
	}
}

func TestDemoPageMethodsAndPublicAccess(t *testing.T) {
	s := demoTestServer(t)
	// (httptest recorders do not strip HEAD bodies the way net/http does, so only the status is pinned)
	if rec := demoGet(s, "HEAD", "/demo"); rec.Code != 200 {
		t.Errorf("HEAD /demo = %d", rec.Code)
	}
	for _, m := range []string{"POST", "PUT", "DELETE", "PATCH"} {
		if c := demoGet(s, m, "/demo").Code; c != http.StatusMethodNotAllowed {
			t.Errorf("%s /demo = %d, want 405", m, c)
		}
	}
	// public: no redirect to /login even with a junk token
	req := httptest.NewRequest("GET", "/demo", nil)
	req.Header.Set("Authorization", "Bearer junk")
	rec := httptest.NewRecorder()
	s.Handler().ServeHTTP(rec, req)
	if rec.Code != 200 {
		t.Errorf("/demo with a junk token = %d, want 200 (public)", rec.Code)
	}
}

func TestDemoRobotsAndSitemap(t *testing.T) {
	s := demoTestServer(t)
	if rb := demoGet(s, "GET", "/robots.txt").Body.String(); !strings.Contains(rb, "Disallow: /demo\n") {
		t.Errorf("robots.txt must Disallow /demo:\n%s", rb)
	}
	if sm := demoGet(s, "GET", "/sitemap.xml").Body.String(); strings.Contains(sm, "/demo") {
		t.Errorf("sitemap.xml must NOT list /demo:\n%s", sm)
	}
}

func TestDemoManifestShotsAreRenderedAndGuarded(t *testing.T) {
	manifest := `{"generated":"2026-10-10T00:00:00","order":["a","b","c","d"],"shots":{
	  "a":{"file":"a.webp","act":1,"step":2,"caption_zh":"图甲","caption_en":"Shot A","viewport":"desktop","width":1440,"height":900},
	  "b":{"file":"b.webp","act":1,"step":2,"caption_zh":"图乙","caption_en":"Shot B","viewport":"mobile","width":780,"height":1688},
	  "c":{"file":"missing.webp","act":1,"step":3,"caption_zh":"缺","caption_en":"Missing","viewport":"desktop","width":1,"height":1},
	  "d":{"file":"../../etc/passwd","act":1,"step":4,"caption_zh":"逃","caption_en":"Escape","viewport":"desktop","width":1,"height":1}}}`
	s := demoTestServer(t)
	s.Static = fstest.MapFS{
		"static/demo/manifest.json": {Data: []byte(manifest)},
		"static/demo/a.webp":        {Data: []byte("x")},
		"static/demo/b.webp":        {Data: []byte("y")},
	}
	body := demoGet(s, "GET", "/demo").Body.String()
	for _, want := range []string{"/static/demo/a.webp", "/static/demo/b.webp", "Shot A", "Shot B", `data-mobile="1"`} {
		// the first shot of a step is the main figure; the others are thumbnail buttons
		if !strings.Contains(body, want) {
			t.Errorf("page missing %q", want)
		}
	}
	if strings.Contains(body, "missing.webp") {
		t.Error("a shot whose file is missing must be omitted")
	}
	if strings.Contains(body, "passwd") {
		t.Error("a manifest file name with a path must be ignored")
	}
	if !strings.Contains(body, "· 2 screenshots") {
		t.Error("screenshot count not shown (want 2 valid shots)")
	}
	// the step without any usable shot shows the placeholder instead of a broken image
	if !strings.Contains(body, `class="step-media empty"`) {
		t.Error("steps without screenshots should render the placeholder")
	}
}

func TestDemoPageWithoutStaticOrManifestStillRenders(t *testing.T) {
	s := demoTestServer(t)
	s.Static = nil
	if rec := demoGet(s, "GET", "/demo"); rec.Code != 200 || !strings.Contains(rec.Body.String(), `id="act-1"`) {
		t.Errorf("nil Static: status=%d", rec.Code)
	}
	s.Static = fstest.MapFS{"static/demo/manifest.json": {Data: []byte("{not json")}}
	if rec := demoGet(s, "GET", "/demo"); rec.Code != 200 {
		t.Errorf("corrupt manifest: status=%d", rec.Code)
	}
}

func TestDemoEmbeddedAssetsExist(t *testing.T) {
	for _, f := range []string{"static/css/demo.css", "static/js/demo.js", "templates/demo.html"} {
		if st, err := os.Stat("../../" + f); err != nil || st.Size() < 500 {
			t.Errorf("%s missing or empty: %v", f, err)
		}
	}
}
