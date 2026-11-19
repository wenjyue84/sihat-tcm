package server

import (
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"testing/fstest"
)

// The test-log appendix must never render a dead image or a half-translated entry: unknown statuses and missing
// or path-like files are dropped by loadDemoTests, and the committed tests.json must be complete.
func TestLoadDemoTestsDropsBrokenEntries(t *testing.T) {
	fsys := fstest.MapFS{
		"static/demo-tests/tests.json": {Data: []byte(`{"updated":"2026-10-12","groups":[{"id":"g","title":{"zh":"组","en":"G"},"intro":{"zh":"介绍","en":"Intro"},"items":[
			{"id":"A","status":"pass","title":{"zh":"甲","en":"A"},"desc":{"zh":"方法","en":"How"},"result":{"zh":"结果","en":"Result"},
			 "shots":[{"file":"ok.webp","caption":{"zh":"图","en":"Pic"}},{"file":"missing.webp"},{"file":"../x.webp"}]},
			{"id":"B","status":"weird","title":{"zh":"乙","en":"B"}}]}]}`)},
		"static/demo-tests/ok.webp": {Data: []byte("RIFF")},
	}
	s := &Server{Static: fsys}
	log := s.loadDemoTests()
	if log.Updated != "2026-10-12" || len(log.Groups) != 1 {
		t.Fatalf("groups = %+v", log)
	}
	items := log.Groups[0].Items
	if len(items) != 1 || items[0].ID != "A" {
		t.Fatalf("unknown status must be dropped, got %+v", items)
	}
	if len(items[0].Shots) != 1 || items[0].Shots[0].Src != "/static/demo-tests/ok.webp" {
		t.Fatalf("only the existing bare-name shot may survive, got %+v", items[0].Shots)
	}
	if items[0].Title.ZH != "甲" || items[0].Title.EN != "A" || items[0].Shots[0].Caption.EN != "Pic" {
		t.Fatalf("bilingual fields not decoded: %+v", items[0])
	}
}

func TestCommittedDemoTestLogIsComplete(t *testing.T) {
	dir := filepath.Join("..", "..", "static", "demo-tests")
	raw, err := os.ReadFile(filepath.Join(dir, "tests.json"))
	if err != nil {
		t.Skip("no static/demo-tests/tests.json")
	}
	var log demoTestLog
	if err := json.Unmarshal(raw, &log); err != nil {
		t.Fatalf("tests.json: %v", err)
	}
	seen := map[string]bool{}
	for _, g := range log.Groups {
		for _, bi := range []demoBi{g.Title, g.Intro} {
			if strings.TrimSpace(bi.ZH) == "" || strings.TrimSpace(bi.EN) == "" {
				t.Errorf("group %s: empty zh/en", g.ID)
			}
		}
		for _, it := range g.Items {
			if seen[it.ID] {
				t.Errorf("duplicate item id %s", it.ID)
			}
			seen[it.ID] = true
			if _, ok := demoTestStatus[it.Status]; !ok {
				t.Errorf("%s: unknown status %q", it.ID, it.Status)
			}
			for name, bi := range map[string]demoBi{"title": it.Title, "desc": it.Desc, "result": it.Result} {
				if strings.TrimSpace(bi.ZH) == "" || strings.TrimSpace(bi.EN) == "" {
					t.Errorf("%s: empty %s", it.ID, name)
				}
			}
			for _, sh := range it.Shots {
				st, err := os.Stat(filepath.Join(dir, sh.File))
				if err != nil {
					t.Errorf("%s: shot %s missing", it.ID, sh.File)
					continue
				}
				if st.Size() > 300*1024 {
					t.Errorf("%s: shot %s is %d bytes (> 300 KB)", it.ID, sh.File, st.Size())
				}
				if sh.W == 0 || sh.H == 0 {
					t.Errorf("%s: shot %s has no width/height (run scripts/build_test_evidence.py)", it.ID, sh.File)
				}
				if strings.TrimSpace(sh.Caption.ZH) == "" || strings.TrimSpace(sh.Caption.EN) == "" {
					t.Errorf("%s: shot %s caption missing zh/en", it.ID, sh.File)
				}
			}
		}
	}
	if len(seen) < 10 {
		t.Errorf("only %d test entries", len(seen))
	}
}
