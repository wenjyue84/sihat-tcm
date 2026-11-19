package localdb

import (
	"bytes"
	"encoding/json"
	"strings"
	"testing"
	"time"
)

// reportProblems is the Go port of regress/journey.mjs reportProblems (the contract the report renderers depend on).
func reportProblems(rpt map[string]any) []string {
	var p []string
	switch d := rpt["diagnosis"].(type) {
	case string:
		if len(d) < 2 {
			p = append(p, "diagnosis string empty")
		}
	case map[string]any:
		if s, _ := d["primary_pattern"].(string); len([]rune(s)) < 2 {
			p = append(p, "diagnosis.primary_pattern missing")
		}
	default:
		p = append(p, "diagnosis missing")
	}
	an, _ := rpt["analysis"].(map[string]any)
	if _, isArr := an["key_findings"].([]any); isArr {
		p = append(p, "analysis.key_findings is an ARRAY")
	}
	if _, isObj := an["key_findings"].(map[string]any); !isObj {
		p = append(p, "analysis.key_findings is not an object")
	}
	rec, _ := rpt["recommendations"].(map[string]any)
	_, ft := rec["food_therapy"]
	_, lf := rec["lifestyle"].([]any)
	_, ap := rec["acupoints"].([]any)
	if !(ft || lf || ap) {
		p = append(p, "recommendations shape")
	}
	for _, k := range []string{"constitution", "follow_up", "disclaimer"} {
		if rpt[k] == nil {
			p = append(p, k+" missing")
		}
	}
	return p
}

func demoRows(t *testing.T, e *env, table string) []map[string]any {
	t.Helper()
	rows, err := e.db.loadRows(e.db.sql, table, "")
	if err != nil {
		t.Fatalf("loadRows %s: %v", table, err)
	}
	return rows
}

func TestDemoSeedCounts(t *testing.T) {
	start := time.Now()
	e := newRichEnv(t)
	t.Logf("open+seed took %v", time.Since(start))
	if time.Since(start) > 3*time.Second {
		t.Errorf("seed too slow: %v", time.Since(start))
	}
	profs := demoRows(t, e, "profiles")
	doctors, patients := map[string]map[string]any{}, map[string]map[string]any{}
	for _, p := range profs {
		switch p["role"] {
		case "doctor":
			doctors[p["id"].(string)] = p
		case "patient":
			patients[p["id"].(string)] = p
		}
	}
	if len(doctors) != 9 { // 8 named demo doctors + the generic doctor@sihat.com
		t.Errorf("doctors = %d, want 9", len(doctors))
	}
	if len(patients) != 16 {
		t.Errorf("patients = %d, want 16", len(patients))
	}
	for id, d := range doctors {
		if d["is_approved"] != true || d["qualification"] == nil || d["languages"] == nil || d["clinic"] == nil || d["avg_response_time"] == nil || d["bio"] == nil {
			t.Errorf("doctor %v profile incomplete: %v", d["email"], d)
		}
		_ = id
	}
	langs := map[string]int{}
	for _, p := range patients {
		if p["age"] == nil || p["gender"] == nil || p["height"] == nil || p["weight"] == nil || p["bmi"] == nil || p["medical_history"] == nil {
			t.Errorf("patient %v profile incomplete", p["email"])
		}
		langs[p["preferred_language"].(string)]++
	}
	if langs["en"] == 0 || langs["zh"] == 0 || langs["ms"] == 0 {
		t.Errorf("preferred languages not mixed: %v", langs)
	}

	// sessions: 1-3 per patient, full reports, >=10 distinct patterns, no dangling ids
	sess := demoRows(t, e, "diagnosis_sessions")
	per := map[string]int{}
	patterns := map[string]bool{}
	now := time.Now()
	for _, s := range sess {
		uid := s["user_id"].(string)
		if _, ok := patients[uid]; !ok {
			t.Errorf("session %v has dangling user_id %v", s["id"], uid)
		}
		per[uid]++
		rep, _ := s["full_report"].(map[string]any)
		if probs := reportProblems(rep); len(probs) > 0 {
			t.Errorf("session %v report: %s", s["id"], strings.Join(probs, "; "))
		}
		kf, _ := rep["analysis"].(map[string]any)["key_findings"].(map[string]any)
		for _, k := range []string{"from_inquiry", "from_visual", "from_audio", "from_pulse"} {
			if kf[k] == nil || kf[k] == "" {
				t.Errorf("session %v key_findings.%s empty", s["id"], k)
			}
		}
		scores, _ := rep["analysis"].(map[string]any)["five_elements"].(map[string]any)["scores"].(map[string]any)
		if len(scores) != 5 {
			t.Errorf("five_elements scores = %v", scores)
		}
		pd, _ := rep["diagnosis"].(map[string]any)["primary_pattern"].(string)
		if s["primary_diagnosis"] != pd {
			t.Errorf("primary_diagnosis column %q != report %q", s["primary_diagnosis"], pd)
		}
		patterns[pd] = true
		ts, perr := time.Parse(time.RFC3339Nano, s["created_at"].(string))
		if perr != nil || ts.After(now) || ts.Before(now.AddDate(0, 0, -95)) {
			t.Errorf("session %v created_at %v outside the last ~90 days", s["id"], s["created_at"])
		}
		if sc, _ := s["overall_score"].(float64); sc < 20 || sc > 95 {
			t.Errorf("overall_score %v", s["overall_score"])
		}
		if arr, _ := s["symptoms"].([]any); len(arr) == 0 {
			t.Errorf("session %v has no symptoms", s["id"])
		}
	}
	for uid := range patients {
		if n := per[uid]; n < 1 || n > 3 {
			t.Errorf("patient %v has %d sessions, want 1-3", uid, n)
		}
	}
	if len(patterns) < 10 {
		t.Errorf("distinct primary patterns = %d, want >=10: %v", len(patterns), patterns)
	}

	// inquiries: every doctor >=4, mixed status/flag, consistent ids and threads
	inq := demoRows(t, e, "inquiries")
	byDoc := map[string]int{}
	statuses, flags := map[string]int{}, map[string]int{}
	plans, threads := 0, 0
	for _, q := range inq {
		did, uid := q["doctor_id"].(string), q["user_id"].(string)
		if _, ok := doctors[did]; !ok {
			t.Errorf("inquiry %v dangling doctor_id", q["id"])
		}
		if _, ok := patients[uid]; !ok {
			t.Errorf("inquiry %v dangling user_id", q["id"])
		}
		byDoc[did]++
		statuses[q["status"].(string)]++
		if f, _ := q["flag"].(string); f != "" {
			flags[f]++
		}
		rep := q["diagnosis_report"].(map[string]any)
		if rep["status"] != q["status"] {
			t.Errorf("inquiry %v status column %v != report status %v", q["id"], q["status"], rep["status"])
		}
		if sd := rep["selected_doctor"].(map[string]any); sd["id"] != did {
			t.Errorf("inquiry %v selected_doctor mismatch", q["id"])
		}
		if probs := reportProblems(rep["full_report"].(map[string]any)); len(probs) > 0 {
			t.Errorf("inquiry %v full_report: %v", q["id"], probs)
		}
		msgs, _ := rep["messages"].([]any)
		if len(msgs) > 0 {
			threads++
			last, _ := msgs[len(msgs)-1].(map[string]any)
			if q["status"] == "reviewed" && last["role"] != "doctor" {
				t.Errorf("reviewed inquiry %v ends with a %v message", q["id"], last["role"])
			}
			if q["status"] == "pending" && last["role"] != "patient" {
				t.Errorf("pending inquiry %v with messages must end with a patient follow-up", q["id"])
			}
		} else if q["status"] == "reviewed" {
			t.Errorf("reviewed inquiry %v without a doctor reply", q["id"])
		}
		if rep["treatment_plan"] != nil {
			plans++
		}
	}
	for did := range doctors {
		if byDoc[did] < 4 {
			t.Errorf("doctor %v has %d requests, want >=4", doctors[did]["email"], byDoc[did])
		}
	}
	if statuses["pending"] == 0 || statuses["reviewed"] == 0 || flags["normal"] == 0 || flags["watch"] == 0 || flags["critical"] == 0 || plans == 0 || threads == 0 {
		t.Errorf("no mix: statuses=%v flags=%v plans=%d threads=%d", statuses, flags, plans, threads)
	}
	for uid := range patients {
		n := 0
		for _, q := range inq {
			if q["user_id"] == uid {
				n++
			}
		}
		if n == 0 {
			t.Errorf("patient %v has no consultation", patients[uid]["email"])
		}
	}

	// notifications, patients table, consoles
	for table, min := range map[string]int{"user_notification_preferences": 5, "scheduled_notifications": 15, "notification_history": 20, "system_logs": 100, "system_metrics": 300, "system_errors": 6, "patients": 16} {
		if n := len(demoRows(t, e, table)); n < min {
			t.Errorf("%s = %d rows, want >=%d", table, n, min)
		}
	}
	levels := map[string]int{}
	for _, l := range demoRows(t, e, "system_logs") {
		levels[l["level"].(string)]++
	}
	if levels["info"] == 0 || levels["warn"] == 0 || levels["error"] == 0 {
		t.Errorf("log levels not mixed: %v", levels)
	}
	resolved := 0
	for _, r := range demoRows(t, e, "system_errors") {
		if r["resolved"] == true {
			resolved++
		}
	}
	if resolved == 0 || resolved == len(demoRows(t, e, "system_errors")) {
		t.Errorf("system_errors resolved mix = %d", resolved)
	}
}

func TestDemoSeedLoginAndRLS(t *testing.T) {
	e := newRichEnv(t)
	for _, em := range []string{"patient@sihat.com", "demo-patient-16@sihat.com", "doctor@sihat.com", "dr.chong@sihat.com", "dr.aisyah@sihat.com", "admin@sihat.com"} {
		if r := e.login(em, DemoPassword); r.status != 200 {
			t.Errorf("login %s: %d %s", em, r.status, r.raw)
		}
	}
	// a patient sees only their own sessions through RLS
	r := e.login("demo-patient-02@sihat.com", DemoPassword)
	tok, uid := r.str("access_token"), r.obj()["user"].(map[string]any)["id"].(string)
	got := e.as(tok, "GET", "/rest/v1/diagnosis_sessions?select=user_id", nil, "")
	if got.status != 200 || len(got.arr()) == 0 {
		t.Fatalf("own sessions: %d %s", got.status, got.raw)
	}
	for _, row := range got.arr() {
		if row["user_id"] != uid {
			t.Errorf("RLS leak: %v", row)
		}
	}
}

func TestDemoSeedIdempotentAndDeterministic(t *testing.T) {
	e := newRichEnv(t)
	before := e.db.DemoStats()
	e.reopen() // restart: nothing is seeded twice
	eq(t, "stats after reopen", e.db.DemoStats(), before)
	if err := e.db.seed(); err != nil { // explicit re-seed is a no-op too
		t.Fatal(err)
	}
	eq(t, "stats after re-seed", e.db.DemoStats(), before)

	// a wiped + re-seeded database has the same shape and the same inquiry/session ids
	idsBefore := ids(demoRows(t, e, "inquiries"), "id")
	if err := e.db.reset(); err != nil {
		t.Fatal(err)
	}
	eq(t, "stats after reset", e.db.DemoStats(), before)
	same := map[any]bool{}
	for _, id := range idsBefore {
		same[id] = true
	}
	for _, id := range ids(demoRows(t, e, "inquiries"), "id") {
		if !same[id] {
			t.Errorf("inquiry id %v not stable across reset", id)
		}
	}
}

func TestDemoSeedOffSeedsNothing(t *testing.T) {
	e := newEnv(t, func(o *Options) { o.SeedDemo = false; o.NoRichDemo = false })
	st := e.db.DemoStats()
	for _, k := range []string{"users", "profiles", "patients", "inquiries", "diagnosis_sessions", "system_logs", "system_metrics", "system_errors", "scheduled_notifications", "notification_history", "user_notification_preferences"} {
		if st[k] != 0 {
			t.Errorf("SeedDemo=false but %s = %d", k, st[k])
		}
	}
	if st["system_prompts"] == 0 {
		t.Error("base data (system_prompts) must still be seeded")
	}
}

func TestDemoPatternsContract(t *testing.T) {
	pats, err := loadDemoPatterns()
	if err != nil {
		t.Fatal(err)
	}
	if len(pats) != 10 {
		t.Fatalf("patterns = %d, want 10", len(pats))
	}
	for _, p := range pats {
		for _, lang := range []string{"zh", "en", "ms"} {
			tx, ok := p.T[lang]
			if !ok {
				t.Errorf("%s missing %s", p.ID, lang)
				continue
			}
			rep := demoReport(p, lang, 60)
			b, _ := json.Marshal(rep)
			var back map[string]any
			_ = json.Unmarshal(b, &back)
			if probs := reportProblems(back); len(probs) > 0 {
				t.Errorf("%s/%s: %v", p.ID, lang, probs)
			}
			if tx.Pattern == "" || len(tx.Good) < 3 || len(tx.Points) < 3 || len(tx.Life) < 3 || len(tx.Symptoms) < 3 || tx.Inquiry == "" {
				t.Errorf("%s/%s thin content", p.ID, lang)
			}
		}
	}
}

func TestPrintDemoStats(t *testing.T) {
	var buf bytes.Buffer
	if err := PrintDemoStats(t.TempDir()+"/s.db", true, &buf); err != nil {
		t.Fatal(err)
	}
	for _, want := range []string{"inquiries", "diagnosis_sessions", "system_logs", "users"} {
		if !strings.Contains(buf.String(), want) {
			t.Errorf("stats output lacks %q:\n%s", want, buf.String())
		}
	}
	t.Log("\n" + buf.String())
}

// newRichEnv is newEnv with the full demo seed (the other localdb tests run on the tiny 4+6 account seed).
func newRichEnv(t *testing.T) *env {
	return newEnv(t, func(o *Options) { o.NoRichDemo = false })
}
