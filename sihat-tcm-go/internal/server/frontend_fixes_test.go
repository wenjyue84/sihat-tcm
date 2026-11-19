package server

// Pins for the frontend fixes (hunt_frontend / hunt_patient / hunt_staff): private-page caching, landmarks and
// headings, keyboard + dialog accessibility, favicon, current copyright year, caption track, and i18n coverage.
// The browser-behaviour fixes (wizard refresh, guest save/migration, history order, string-shaped reports, ...) are
// pinned by regress/suites/hunt_patient.mjs, which executes the shipped static/js files in a node:vm sandbox.

import (
	"fmt"
	"html/template"
	"math"
	"net/http"
	"net/http/httptest"
	"os"
	"regexp"
	"sort"
	"strconv"
	"strings"
	"testing"
	"time"

	"sihattcm/internal/config"
	"sihattcm/internal/gemini"
)

// ffServer builds a Server with the REAL templates, a fake Supabase (tokens p/d/a = patient/doctor/admin) and routes.
func ffServer(t *testing.T) *Server {
	t.Helper()
	auth := TAuthFakeSupabase(t, map[string]string{"p": "patient", "d": "doctor", "a": "admin"})
	root := os.DirFS("../..")
	tmpl, err := template.New("").Funcs(templateFuncs()).ParseFS(root, "templates/*.html")
	if err != nil {
		t.Fatalf("parse templates: %v", err)
	}
	s := &Server{
		Cfg:    &config.Config{PublicBaseURL: "https://tcm.example.com/", Env: "development"},
		AI:     gemini.New(""),
		DB:     auth.DB,
		Tmpl:   tmpl,
		Mux:    http.NewServeMux(),
		Static: root,
	}
	s.routes()
	return s
}

var ffIP int

func ffGet(s *Server, path, token string) *httptest.ResponseRecorder {
	ffIP++
	req := httptest.NewRequest("GET", path, nil)
	req.RemoteAddr = "127.0.0.1:4000"
	req.Header.Set("X-Forwarded-For", fmt.Sprintf("10.8.%d.%d", ffIP/250, ffIP%250))
	if token != "" {
		req.AddCookie(&http.Cookie{Name: "sb-access-token", Value: token})
	}
	rec := httptest.NewRecorder()
	s.Handler().ServeHTTP(rec, req)
	return rec
}

func ffRead(t *testing.T, rel string) string {
	t.Helper()
	b, err := os.ReadFile("../../" + rel)
	if err != nil {
		t.Fatalf("read %s: %v", rel, err)
	}
	return string(b)
}

// frontend-01: pages that render the signed-in user's data must not be cacheable (Back after Logout re-shows them).
func TestFFPrivatePagesAreNoStore(t *testing.T) {
	s := ffServer(t)
	for _, c := range []struct{ path, tok string }{
		{"/patient", "p"}, {"/patient/report/abc", "p"}, {"/doctor", "d"}, {"/admin", "a"},
	} {
		rec := ffGet(s, c.path, c.tok)
		if rec.Code != 200 {
			t.Fatalf("GET %s = %d", c.path, rec.Code)
		}
		if cc := rec.Header().Get("Cache-Control"); !strings.Contains(cc, "no-store") {
			t.Errorf("GET %s Cache-Control = %q, want no-store", c.path, cc)
		}
	}
	// redirects and public pages are untouched
	if cc := ffGet(s, "/", "").Header().Get("Cache-Control"); strings.Contains(cc, "no-store") {
		t.Errorf("public home must stay cacheable-by-default, got %q", cc)
	}
}

// frontend-16: the footer year is the current year, not a hard-coded 2025.
func TestFFFooterYearIsCurrent(t *testing.T) {
	s := ffServer(t)
	want := "&copy; " + strconv.Itoa(time.Now().Year()) + " "
	for _, p := range []string{"/", "/login", "/reset-password", "/video"} {
		if body := ffGet(s, p, "").Body.String(); !strings.Contains(body, want) {
			t.Errorf("%s footer missing %q", p, want)
		}
	}
}

// frontend-14 / 12 / 05 / 04 / 11 / 22 / 07: structure the keyboard and screen-reader paths depend on.
func TestFFPageStructure(t *testing.T) {
	s := ffServer(t)
	home := ffGet(s, "/", "").Body.String()
	login := ffGet(s, "/login", "").Body.String()
	reset := ffGet(s, "/reset-password", "").Body.String()
	patient := ffGet(s, "/patient", "p").Body.String()
	doctor := ffGet(s, "/doctor", "d").Body.String()
	admin := ffGet(s, "/admin", "a").Body.String()
	report := ffGet(s, "/patient/report/x", "p").Body.String()

	for name, body := range map[string]string{"home": home, "login": login, "reset": reset, "patient": patient, "doctor": doctor, "admin": admin, "report": report} {
		if !regexp.MustCompile(`<link rel="icon"[^>]+href="/static/img/favicon\.svg\?v=\d+"`).MatchString(body) {
			t.Errorf("%s: no versioned favicon link", name)
		}
	}
	if !strings.Contains(home, "<main") || !strings.Contains(home, "</main>") {
		t.Error("home has no <main> landmark")
	}
	for name, body := range map[string]string{"patient": patient, "doctor": doctor} {
		if n := strings.Count(body, "<h1"); n != 1 {
			t.Errorf("%s has %d <h1>, want exactly 1", name, n)
		}
	}
	// wizard chips: every symptom + pulse chip is focusable and has a checkbox role
	chips := regexp.MustCompile(`<(?:span|div) class="(?:chip|quality-chip)"[^>]*>`).FindAllString(home, -1)
	if len(chips) != 19 {
		t.Errorf("found %d wizard chips, want 19", len(chips))
	}
	for _, c := range chips {
		if !strings.Contains(c, `tabindex="0"`) || !strings.Contains(c, `role="checkbox"`) || !strings.Contains(c, `aria-checked="false"`) {
			t.Errorf("chip not keyboard operable: %s", c)
		}
	}
	// doctor detail modal is a real dialog
	if !strings.Contains(patient, `role="dialog"`) || !strings.Contains(patient, `aria-modal="true"`) {
		t.Error("doctor modal lacks role=dialog / aria-modal")
	}
	// announced error containers
	for _, id := range []string{"login-alert", "signup-alert", "forgot-alert"} {
		if !regexp.MustCompile(`id="` + id + `"[^>]*role="alert"`).MatchString(login) {
			t.Errorf("#%s is not role=alert", id)
		}
	}
	if !regexp.MustCompile(`id="step0-error"[^>]*role="alert"`).MatchString(home) {
		t.Error("#step0-error is not role=alert")
	}
	// the language button on /doctor is the same #lang-toggle the shared script repaints
	if !strings.Contains(doctor, `id="lang-toggle"`) || !strings.Contains(doctor, `querySelectorAll('.lang-btn')`) {
		t.Error("doctor header language button is not wired to the shared language script")
	}
	if strings.Contains(doctor, "lang-toggle-doc") {
		t.Error("stale #lang-toggle-doc id on /doctor")
	}
}

// staff-25: the doctor stat cards must not come from the doctor's OWN sessions.
func TestFFDoctorStatsComeFromTheInbox(t *testing.T) {
	s := ffServer(t)
	doctor := ffGet(s, "/doctor", "d").Body.String()
	if regexp.MustCompile(`fetch\(\s*['"]/api/patient/sessions['"]`).MatchString(doctor) {
		t.Error("doctor.html still fetches /api/patient/sessions for the stat cards")
	}
	if !strings.Contains(doctor, `id="stat-total"`) {
		t.Error("stat-total card missing")
	}
	inbox := ffRead(t, "static/js/doctor-inbox.js")
	for _, want := range []string{"function updateStats", "stat-total", "stat-today", "stat-constitution", "window.doctorStats"} {
		if !strings.Contains(inbox, want) {
			t.Errorf("doctor-inbox.js missing %q", want)
		}
	}
}

// frontend-23: the promo video ships a captions track and the server labels WebVTT correctly.
func TestFFVideoCaptionsTrack(t *testing.T) {
	dir := t.TempDir()
	if err := os.WriteFile(dir+"/"+promoVideoFile, []byte("x"), 0o644); err != nil {
		t.Fatal(err)
	}
	t.Setenv("MEDIA_DIR", dir)
	s := ffServer(t)
	page := ffGet(s, "/video", "").Body.String()
	m := regexp.MustCompile(`<track\b[^>]*kind="captions"[^>]*src="(/static/video/[^"?]+\.vtt)\?v=\d+"`).FindStringSubmatch(page)
	if m == nil {
		t.Fatalf("/video has no <track kind=captions> with a versioned .vtt src:\n%s", page)
	}
	rec := httptest.NewRecorder()
	staticHandler(os.DirFS("../..")).ServeHTTP(rec, httptest.NewRequest("GET", m[1], nil))
	if rec.Code != 200 {
		t.Fatalf("GET %s = %d", m[1], rec.Code)
	}
	if ct := rec.Header().Get("Content-Type"); !strings.HasPrefix(ct, "text/vtt") {
		t.Errorf("captions Content-Type = %q, want text/vtt", ct)
	}
	body := rec.Body.String()
	if !strings.HasPrefix(body, "WEBVTT") {
		t.Fatalf("captions do not start with WEBVTT: %.40q", body)
	}
	// cues are ordered, non-overlapping and end before the end of the narration (last scene ends at ~157 s)
	cue := regexp.MustCompile(`(\d\d):(\d\d):(\d\d)\.(\d\d\d) --> (\d\d):(\d\d):(\d\d)\.(\d\d\d)`)
	secs := func(h, m, s, ms string) float64 {
		a, _ := strconv.Atoi(h)
		b, _ := strconv.Atoi(m)
		c, _ := strconv.Atoi(s)
		d, _ := strconv.Atoi(ms)
		return float64(a*3600+b*60+c) + float64(d)/1000
	}
	all := cue.FindAllStringSubmatch(body, -1)
	if len(all) < 20 {
		t.Fatalf("only %d caption cues", len(all))
	}
	prevEnd := -1.0
	for i, c := range all {
		st, en := secs(c[1], c[2], c[3], c[4]), secs(c[5], c[6], c[7], c[8])
		if en <= st || st+0.001 < prevEnd || en > 165 {
			t.Fatalf("cue %d out of order: %.3f --> %.3f (prev end %.3f)", i+1, st, en, prevEnd)
		}
		prevEnd = en
	}
	// the favicon is a real SVG
	rec = httptest.NewRecorder()
	staticHandler(os.DirFS("../..")).ServeHTTP(rec, httptest.NewRequest("GET", "/static/img/favicon.svg", nil))
	if rec.Code != 200 || !strings.HasPrefix(rec.Header().Get("Content-Type"), "image/svg+xml") || !strings.Contains(rec.Body.String(), "<svg") {
		t.Errorf("favicon.svg = %d %q", rec.Code, rec.Header().Get("Content-Type"))
	}
}

// frontend-17/18/19/20: every i18n key the markup or the scripts use exists in all three dictionaries.
func TestFFI18nKeysUsedExistInEveryLanguage(t *testing.T) {
	src := ffRead(t, "static/js/i18n.js")
	lang := func(name string) map[string]bool {
		start := strings.Index(src, "\n    "+name+": {")
		if start < 0 {
			t.Fatalf("dictionary %s not found", name)
		}
		rest := src[start+1:]
		end := strings.Index(rest, "\n    },")
		if end < 0 {
			end = len(rest)
		}
		keys := map[string]bool{}
		for _, m := range regexp.MustCompile(`'([A-Za-z0-9_.]+)':`).FindAllStringSubmatch(rest[:end], -1) {
			keys[m[1]] = true
		}
		return keys
	}
	dict := map[string]map[string]bool{"en": lang("en"), "zh": lang("zh"), "ms": lang("ms")}
	for l, d := range dict {
		if len(d) < 150 {
			t.Fatalf("dictionary %s parsed to only %d keys", l, len(d))
		}
	}
	used := map[string]string{}
	files, _ := os.ReadDir("../../templates")
	attr := regexp.MustCompile(`data-i18n(?:-html|-ph|-alt)?="([^"]+)"`)
	setAttr := regexp.MustCompile(`setAttribute\('data-i18n', '([^']+)'\)`)
	for _, f := range files {
		b := ffRead(t, "templates/"+f.Name())
		for _, m := range attr.FindAllStringSubmatch(b, -1) {
			used[m[1]] = f.Name()
		}
		for _, m := range setAttr.FindAllStringSubmatch(b, -1) {
			used[m[1]] = f.Name()
		}
	}
	js := regexp.MustCompile(`\b(?:T|tr)\('([A-Za-z0-9_.]+)'`)
	for _, f := range []string{"wizard.js", "auth.js", "reset.js"} {
		for _, m := range js.FindAllStringSubmatch(ffRead(t, "static/js/"+f), -1) {
			used[m[1]] = f
		}
	}
	for _, m := range setAttr.FindAllStringSubmatch(ffRead(t, "static/js/dashboard.js"), -1) {
		used[m[1]] = "dashboard.js"
	}
	var keys []string
	for k := range used {
		keys = append(keys, k)
	}
	sort.Strings(keys)
	for _, k := range keys {
		for _, l := range []string{"en", "zh", "ms"} {
			if !dict[l][k] {
				t.Errorf("i18n key %q (used in %s) missing from the %s dictionary", k, used[k], l)
			}
		}
	}
	// the three dictionaries stay in key parity
	for _, a := range []string{"zh", "ms"} {
		for k := range dict["en"] {
			if !dict[a][k] {
				t.Errorf("key %q is in en but not in %s", k, a)
			}
		}
		for k := range dict[a] {
			if !dict["en"][k] {
				t.Errorf("key %q is in %s but not in en", k, a)
			}
		}
	}
	// chrome that used to be hard-coded English must carry data-i18n
	login := ffRead(t, "templates/login.html")
	for _, id := range []string{"login-btn", "signup-btn", "forgot-btn"} {
		if !regexp.MustCompile(`id="` + id + `"[^>]*data-i18n=`).MatchString(login) {
			t.Errorf("#%s has no data-i18n", id)
		}
	}
	if n := len(regexp.MustCompile(`data-i18n`).FindAllString(strings.SplitN(ffRead(t, "templates/reset-password.html"), "<footer", 2)[0], -1)); n < 5 {
		t.Errorf("reset-password has %d data-i18n attributes, want >= 5", n)
	}
}

// frontend-06/08/10/19/20: CSS rules the hunter pinned, measured from the served stylesheet.
func TestFFStylesheetAccessibilityRules(t *testing.T) {
	css := ffRead(t, "static/css/app.css")
	for _, want := range []string{":focus-visible", "@media print", ".adm-table-wrap", "min-height: 40px"} {
		if !strings.Contains(css, want) {
			t.Errorf("app.css missing %q", want)
		}
	}
	hex := func(name string) (r, g, b float64) {
		m := regexp.MustCompile(name + `:\s*#([0-9a-fA-F]{6})`).FindStringSubmatch(css)
		if m == nil {
			t.Fatalf("css var %s not found", name)
		}
		v, _ := strconv.ParseUint(m[1], 16, 32)
		return float64(v >> 16 & 255), float64(v >> 8 & 255), float64(v & 255)
	}
	lum := func(r, g, b float64) float64 {
		f := func(c float64) float64 {
			c /= 255
			if c <= 0.03928 {
				return c / 12.92
			}
			return math.Pow((c+0.055)/1.055, 2.4)
		}
		return 0.2126*f(r) + 0.7152*f(g) + 0.0722*f(b)
	}
	ratio := func(a, b float64) float64 {
		if a < b {
			a, b = b, a
		}
		return (a + 0.05) / (b + 0.05)
	}
	// .btn-primary background is emerald-700 (white text) and outline/link text colour is emerald-700 on the cream page
	if !regexp.MustCompile(`\.btn-primary\s*\{[^}]*background:\s*var\(--emerald-700\)`).MatchString(css) {
		t.Error(".btn-primary must use --emerald-700 (white on emerald-600 is 3.8:1)")
	}
	r, g, b := hex("--emerald-700")
	if cr := ratio(1, lum(r, g, b)); cr < 4.5 {
		t.Errorf("white on --emerald-700 = %.2f:1", cr)
	}
	if cr := ratio(lum(253, 251, 242), lum(r, g, b)); cr < 4.5 {
		t.Errorf("--emerald-700 text on cream = %.2f:1", cr)
	}
}
