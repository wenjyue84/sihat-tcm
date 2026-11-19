package server

import (
	"encoding/json"
	"io/fs"
	"net/http"
	"path"
	"strconv"
)

// registerDemoRoutes mounts the public, guided product tour.
//
// robots/sitemap decision (justified here because tests pin it): /demo is an investor / prospect page that is
// shared by link, and it names the demo accounts' shared password. So it is
//   - NOT in sitemap.xml (nobody should discover it through search),
//   - noindex via <meta robots>, via the X-Robots-Tag header (works for non-HTML fetchers too), and
//   - listed under robots.txt Disallow so well-behaved crawlers do not even fetch it.
//
// Disallow alone would hide the meta tag from crawlers, but the header + meta are belt-and-braces for engines
// that index a URL they were merely linked to.
func (s *Server) registerDemoRoutes() {
	s.Mux.HandleFunc("GET /demo", s.handleDemoPage)
}

// demoShot is one screenshot of a step, resolved from static/demo/manifest.json.
type demoShot struct {
	ID      string
	File    string // file name under /static/demo/
	Src     string // URL path of the image (/static/demo/<file>)
	Caption demoBi
	W, H    int
	Mobile  bool
}

// demoStepView is a step plus everything the template needs that is not static copy.
type demoStepView struct {
	demoStep
	RoleLabel demoBi
	Act       int
	Index     int
}

type demoActView struct {
	demoAct
	RoleLabel demoBi
	Steps     []demoStepView
}

type demoPageData struct {
	Title      string
	Stats      []demoStat
	Advantages []demoAdvantage
	Acts       []demoActView
	Autoplay   bool
	StartAct   int
	ShotCount  int
	Generated  string
	Tests      demoTestLog
	TestStatus map[string]demoBi
}

var demoRoleLabels = map[string]demoBi{
	"guest":     {"访客", "Guest"},
	"patient":   {"患者", "Patient"},
	"doctor":    {"医生", "Doctor"},
	"admin":     {"管理员", "Admin"},
	"developer": {"开发者", "Developer"},
	"system":    {"系统", "System"},
}

// demoManifest mirrors scripts/capture_manifest.json (the capture script writes both copies).
type demoManifest struct {
	Generated string   `json:"generated"`
	Order     []string `json:"order"`
	Shots     map[string]struct {
		File      string `json:"file"`
		Act       int    `json:"act"`
		Step      int    `json:"step"`
		CaptionZH string `json:"caption_zh"`
		CaptionEN string `json:"caption_en"`
		Viewport  string `json:"viewport"`
		Width     int    `json:"width"`
		Height    int    `json:"height"`
	} `json:"shots"`
}

// loadDemoShots reads the embedded manifest and returns screenshots grouped by "act-step". A missing manifest
// or a missing image file is not an error: the step simply renders without that picture.
func (s *Server) loadDemoShots() (map[string][]demoShot, int, string) {
	out := map[string][]demoShot{}
	if s.Static == nil {
		return out, 0, ""
	}
	raw, err := fs.ReadFile(s.Static, "static/demo/manifest.json")
	if err != nil {
		return out, 0, ""
	}
	var m demoManifest
	if json.Unmarshal(raw, &m) != nil {
		return out, 0, ""
	}
	n := 0
	for _, id := range m.Order {
		sh, ok := m.Shots[id]
		if !ok || sh.File == "" || path.Base(sh.File) != sh.File {
			continue
		}
		if _, err := fs.Stat(s.Static, "static/demo/"+sh.File); err != nil {
			continue
		}
		key := strconv.Itoa(sh.Act) + "-" + strconv.Itoa(sh.Step)
		out[key] = append(out[key], demoShot{
			ID: id, File: sh.File, Src: "/static/demo/" + sh.File, Caption: demoBi{ZH: sh.CaptionZH, EN: sh.CaptionEN},
			W: sh.Width, H: sh.Height, Mobile: sh.Viewport == "mobile",
		})
		n++
	}
	return out, n, m.Generated
}

func (s *Server) handleDemoPage(w http.ResponseWriter, r *http.Request) {
	shots, n, gen := s.loadDemoShots()
	data := demoPageData{
		Title:      "Sihat TCM 产品演示",
		Stats:      demoStats,
		Advantages: demoAdvantages,
		ShotCount:  n,
		Generated:  gen,
		Tests:      s.loadDemoTests(),
		TestStatus: demoTestStatus,
	}
	q := r.URL.Query()
	data.Autoplay = q.Get("autoplay") == "1"
	if a, err := strconv.Atoi(q.Get("act")); err == nil && a >= 0 && a <= 8 {
		data.StartAct = a
	}
	for _, act := range demoActs {
		av := demoActView{demoAct: act, RoleLabel: demoRoleLabels[act.Role]}
		av.Steps = make([]demoStepView, 0, len(act.Steps))
		for i, st := range act.Steps {
			st.Shots = shots[st.ID]
			av.Steps = append(av.Steps, demoStepView{demoStep: st, RoleLabel: demoRoleLabels[st.Role], Act: act.N, Index: i + 1})
		}
		data.Acts = append(data.Acts, av)
	}
	h := w.Header()
	h.Set("X-Robots-Tag", "noindex, nofollow")
	h.Set("Cache-Control", "no-cache")
	s.Render(w, "demo.html", data)
}
