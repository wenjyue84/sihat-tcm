package server

import (
	"encoding/json"
	"io/fs"
	"path"
)

// The /demo "测试实录 / Test log" appendix: every test run that backs a feature, with screenshots and a plain
// description of what was checked and what came out (including partial results and failures — it is a log,
// not a brochure). Content and images live in static/demo-tests/ (tests.json + *.webp), kept apart from
// static/demo/ so the tour's capture manifest stays the single source for the guided acts.

type demoTestShot struct {
	File    string `json:"file"`
	Caption demoBi `json:"caption"`
	W       int    `json:"w"`
	H       int    `json:"h"`
	Mobile  bool   `json:"mobile"`
	Src     string `json:"-"`
}

type demoTestItem struct {
	ID       string         `json:"id"`
	Status   string         `json:"status"` // pass | partial | fail | info
	Title    demoBi         `json:"title"`
	Desc     demoBi         `json:"desc"`   // what was tested and how
	Result   demoBi         `json:"result"` // what came out, with numbers
	Verified []string       `json:"verified"`
	Shots    []demoTestShot `json:"shots"`
}

type demoTestGroup struct {
	ID    string         `json:"id"`
	Title demoBi         `json:"title"`
	Intro demoBi         `json:"intro"`
	Items []demoTestItem `json:"items"`
}

type demoTestLog struct {
	Updated string          `json:"updated"`
	Groups  []demoTestGroup `json:"groups"`
}

// tests.json writes bilingual strings as {"zh": "...", "en": "..."}; encoding/json matches those keys to
// demoBi's ZH/EN fields case-insensitively.

var demoTestStatus = map[string]demoBi{
	"pass":    {"通过", "Pass"},
	"partial": {"部分完成", "Partial"},
	"fail":    {"未通过", "Fail"},
	"info":    {"记录", "Record"},
}

// loadDemoTests reads static/demo-tests/tests.json. Items with an unknown status are dropped, and shots whose
// file is missing (or is not a bare file name) are skipped, so a broken entry never renders a dead image.
func (s *Server) loadDemoTests() demoTestLog {
	var log demoTestLog
	if s.Static == nil {
		return log
	}
	raw, err := fs.ReadFile(s.Static, "static/demo-tests/tests.json")
	if err != nil || json.Unmarshal(raw, &log) != nil {
		return demoTestLog{}
	}
	for gi := range log.Groups {
		g := &log.Groups[gi]
		items := g.Items[:0]
		for _, it := range g.Items {
			if _, ok := demoTestStatus[it.Status]; !ok {
				continue
			}
			shots := it.Shots[:0]
			for _, sh := range it.Shots {
				if sh.File == "" || path.Base(sh.File) != sh.File {
					continue
				}
				if _, err := fs.Stat(s.Static, "static/demo-tests/"+sh.File); err != nil {
					continue
				}
				sh.Src = "/static/demo-tests/" + sh.File
				shots = append(shots, sh)
			}
			it.Shots = shots
			items = append(items, it)
		}
		g.Items = items
	}
	return log
}
