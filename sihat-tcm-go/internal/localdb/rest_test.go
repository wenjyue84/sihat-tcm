package localdb

import (
	"fmt"
	"net/url"
	"sort"
	"strings"
	"testing"
)

func scratchEnv(t *testing.T) *env {
	return newEnv(t, func(o *Options) { o.ScratchTables = true; o.TestHooks = true })
}

func keysOf(e *env, tbl, qs, col string) []any {
	e.t.Helper()
	r := e.svc("GET", "/rest/v1/"+tbl+"?"+qs, nil, "")
	if r.status != 200 {
		e.t.Fatalf("GET %s?%s: %d %s", tbl, qs, r.status, r.raw)
	}
	return ids(r.arr(), col)
}

func sorted(v []any) []any {
	out := append([]any(nil), v...)
	sort.Slice(out, func(i, j int) bool { return fmt.Sprint(out[i]) < fmt.Sprint(out[j]) })
	return out
}

func seedOps(e *env) {
	r := e.svc("POST", "/rest/v1/ops", []map[string]any{
		{"k": "a", "n": 1, "s": "alpha", "flag": true, "opt": nil, "tags": []string{"x", "y"}},
		{"k": "b", "n": 2, "s": "Beta", "flag": false, "opt": "v", "tags": []string{"y"}},
		{"k": "c", "n": 3, "s": "gamma", "flag": true, "opt": "w", "tags": []string{}},
		{"k": "d", "n": 10, "s": "delta x", "flag": true, "opt": "v", "tags": []string{"z"}},
	}, "return=representation")
	okStatus(e.t, "seed ops", r, 201)
}

func TestFilterOperators(t *testing.T) {
	e := scratchEnv(t)
	seedOps(e)
	cases := []struct {
		qs   string
		want []any
	}{
		{"n=eq.2", []any{"b"}},
		{"s=eq.alpha", []any{"a"}},
		{"s=eq.beta", []any{}}, // eq is case-sensitive
		{"flag=eq.false", []any{"b"}},
		{"n=neq.2", []any{"a", "c", "d"}},
		{"opt=neq.v", []any{"c"}}, // NULL <> 'v' is NULL -> excluded (Postgres)
		{"n=gt.3", []any{"d"}},    // numeric, not lexical
		{"n=gte.3", []any{"c", "d"}},
		{"n=lt.3", []any{"a", "b"}},
		{"n=lte.3", []any{"a", "b", "c"}},
		{"n=in.(1,3)", []any{"a", "c"}},
		{`s=in.("alpha","Beta")`, []any{"a", "b"}},
		{"s=in.(alpha,gamma)", []any{"a", "c"}},
		{`s=in.("delta%20x")`, []any{"d"}},
		{"n=in.(99)", []any{}},
		{"n=in.()", []any{}},
		{"opt=is.null", []any{"a"}},
		{"flag=is.true", []any{"a", "c", "d"}},
		{"flag=is.false", []any{"b"}},
		{"tags=cs.{y}", []any{"a", "b"}},
		{"tags=cs.{x,y}", []any{"a"}},
		{"s=like.al*", []any{"a"}},
		{"s=like.al%25", []any{"a"}},
		{"s=like.*ETA*", []any{}}, // like is case-sensitive
		{"s=ilike.*ETA*", []any{"b"}},
		{"s=ilike.%25eta%25", []any{"b"}},
		{"s=like.g_mma", []any{"c"}}, // _ is the single-char wildcard
		{"n=gte.2&flag=eq.true", []any{"c", "d"}},
		{"n=gt.1&n=lt.3", []any{"b"}}, // two filters on one column AND together
		{"n=eq.404", []any{}},
	}
	for _, c := range cases {
		got := sorted(keysOf(e, "ops", c.qs, "k"))
		eq(t, c.qs, got, sorted(c.want))
	}
	// NULL never matches a comparison
	for _, qs := range []string{"opt=eq.v", "opt=gt.a", "opt=lt.z", "opt=in.(v)"} {
		for _, k := range keysOf(e, "ops", qs, "k") {
			if k == "a" {
				t.Errorf("%s matched a NULL row", qs)
			}
		}
	}
	// percent-encoded values with reserved characters
	e.svc("POST", "/rest/v1/ops", map[string]any{"k": "e", "n": 11, "s": "a&b=c,d"}, "")
	eq(t, "encoded value", keysOf(e, "ops", "s=eq."+url.QueryEscape("a&b=c,d"), "k"), []any{"e"})
}

func TestUnsupportedSyntaxIsExplicit(t *testing.T) {
	e := scratchEnv(t)
	seedOps(e)
	for _, qs := range []string{"or=(n.eq.1,n.eq.2)", "and=(n.gt.1,n.lt.5)", "n=not.eq.1", "n=wat.1", "n=fts.x", "n=cd.{1}", "select=k,rel(*)", "select=k:alias", "order=n.sideways", "columns=k", "n=gt", "limit=-1", "limit=abc", "offset=-5"} {
		r := e.svc("GET", "/rest/v1/ops?"+qs, nil, "")
		if r.status != 400 || r.obj()["code"] == nil {
			t.Errorf("%s: want explicit 400, got %d %s", qs, r.status, r.raw)
		}
		if _, isArr := r.json.([]any); isArr {
			t.Errorf("%s: silently returned rows", qs)
		}
	}
	if r := e.svc("GET", "/rest/v1/ops?n=wat.1", nil, ""); !strings.Contains(r.raw, "unsupported") {
		t.Errorf("message must say unsupported: %s", r.raw)
	}
	// PATCH/DELETE with unsupported filters change nothing
	p := e.svc("PATCH", "/rest/v1/ops?or=(n.eq.1)", map[string]any{"zz": 1}, "")
	d := e.svc("DELETE", "/rest/v1/ops?or=(n.eq.1)", nil, "")
	if p.status != 400 || d.status != 400 || len(e.svc("GET", "/rest/v1/ops", nil, "").arr()) != 4 {
		t.Fatalf("patch=%d delete=%d", p.status, d.status)
	}
}

func TestOrderingSemantics(t *testing.T) {
	e := scratchEnv(t)
	e.svc("POST", "/rest/v1/ord", []map[string]any{
		{"k": 1, "g": "a", "n": 1, "o": "p"}, {"k": 2, "g": "a", "n": 2, "o": nil},
		{"k": 3, "g": "b", "n": 3, "o": "q"}, {"k": 4, "g": "b", "n": 4, "o": "p"},
	}, "")
	f := func(qs, col string) []any { return keysOf(e, "ord", qs, col) }
	eq(t, "desc", f("order=n.desc", "k"), []any{4.0, 3.0, 2.0, 1.0})
	eq(t, "asc", f("order=n.asc", "k"), []any{1.0, 2.0, 3.0, 4.0})
	eq(t, "default asc", f("order=n", "k"), []any{1.0, 2.0, 3.0, 4.0})
	eq(t, "multi asc,desc", f("order=g.asc,n.desc", "k"), []any{2.0, 1.0, 4.0, 3.0})
	eq(t, "multi desc,asc", f("order=g.desc,n.asc", "k"), []any{3.0, 4.0, 1.0, 2.0})
	// Postgres null ordering: ASC => NULLS LAST, DESC => NULLS FIRST
	eq(t, "asc nulls last", f("order=o.asc", "o"), []any{"p", "p", "q", nil})
	eq(t, "desc nulls first", f("order=o.desc", "o"), []any{nil, "q", "p", "p"})
	eq(t, "desc nullslast", f("order=o.desc.nullslast", "o"), []any{"q", "p", "p", nil})
	eq(t, "asc nullsfirst", f("order=o.asc.nullsfirst", "o"), []any{nil, "p", "p", "q"})
	eq(t, "then limit", f("order=n.desc&limit=2", "k"), []any{4.0, 3.0})
	eq(t, "offset+limit", f("order=n.desc&offset=1&limit=2", "k"), []any{3.0, 2.0})
	eq(t, "limit 0 is empty", f("limit=0", "k"), []any{})
	eq(t, "limit > rows", len(f("limit=100", "k")), 4)
	eq(t, "offset only", f("order=n.asc&offset=3", "k"), []any{4.0})
	eq(t, "offset past end", f("offset=50", "k"), []any{})
	eq(t, "filter order limit", f("g=eq.b&order=n.asc&limit=1", "k"), []any{3.0})
	// numeric (not lexical) ordering
	e.svc("POST", "/rest/v1/ord", map[string]any{"k": 9, "g": "z", "n": 11, "o": "p"}, "")
	eq(t, "numeric not lexical", f("order=n.desc&limit=2", "k"), []any{9.0, 4.0})
	// a typed timestamp column compares chronologically whatever offset format the client used
	e.svc("POST", "/rest/v1/system_logs", []map[string]any{
		{"level": "info", "category": "t", "message": "old", "timestamp": "2026-01-01T00:00:00.000Z"},
		{"level": "info", "category": "t", "message": "mid", "timestamp": "2026-02-01T08:00:00+08:00"}, // = 2026-02-01T00:00Z
		{"level": "info", "category": "t", "message": "new", "timestamp": "2026-03-01T00:00:00.000Z"},
	}, "")
	eq(t, "ts gte", sorted(keysOf(e, "system_logs", "timestamp=gte."+url.QueryEscape("2026-02-01T00:00:00.000Z"), "message")), sorted([]any{"mid", "new"}))
	eq(t, "ts window", keysOf(e, "system_logs", "timestamp=gt.2026-01-01T00:00:00.000Z&timestamp=lte.2026-02-01T00:00:00.000Z", "message"), []any{"mid"})
	eq(t, "ts order desc", keysOf(e, "system_logs", "order=timestamp.desc", "message"), []any{"new", "mid", "old"})
}

func TestInsertUpsertPatchDelete(t *testing.T) {
	e := scratchEnv(t)
	i1 := e.svc("POST", "/rest/v1/ins", map[string]any{"a": 1}, "return=representation")
	if i1.status != 201 || len(i1.arr()) != 1 || !uuidRe.MatchString(i1.arr()[0]["id"].(string)) || i1.arr()[0]["created_at"] == nil {
		t.Fatalf("insert %d %s", i1.status, i1.raw)
	}
	if r := e.svc("POST", "/rest/v1/ins", map[string]any{"a": 9}, ""); r.status != 201 || r.raw != "" {
		t.Fatalf("no Prefer => 201 with no body: %d %q", r.status, r.raw)
	}
	i3 := e.svc("POST", "/rest/v1/ins", []map[string]any{{"a": 3}, {"a": 4}}, "return=representation")
	if i3.status != 201 || len(i3.arr()) != 2 || i3.arr()[0]["id"] == i3.arr()[1]["id"] {
		t.Fatalf("array insert %d %s", i3.status, i3.raw)
	}
	if bad := e.do(req{method: "POST", path: "/rest/v1/ins", raw: "{not json", apikey: e.service(), bearer: e.service()}); bad.status != 400 {
		t.Fatalf("bad json: %d", bad.status)
	}
	if n := len(e.svc("GET", "/rest/v1/ins", nil, "").arr()); n != 4 {
		t.Fatalf("rows %d want 4", n)
	}

	// primary-key duplicates are a 409 on plain insert...
	e.svc("POST", "/rest/v1/ups", map[string]any{"id": "u1", "a": 1, "b": 2}, "")
	dup := e.svc("POST", "/rest/v1/ups", map[string]any{"id": "u1", "a": 5}, "return=representation")
	if dup.status != 409 || dup.obj()["code"] != "23505" {
		t.Fatalf("dup pk %d %s", dup.status, dup.raw)
	}
	// ...and a merge for resolution=merge-duplicates
	up := e.svc("POST", "/rest/v1/ups", map[string]any{"id": "u1", "b": 3, "c": 9}, "resolution=merge-duplicates,return=representation")
	rows := e.svc("GET", "/rest/v1/ups", nil, "").arr()
	if up.status != 201 || len(rows) != 1 || rows[0]["a"] != 1.0 || rows[0]["b"] != 3.0 || rows[0]["c"] != 9.0 {
		t.Fatalf("merge %d %s / %v", up.status, up.raw, rows)
	}
	up2 := e.svc("POST", "/rest/v1/ups", []map[string]any{{"id": "u1", "b": 4}, {"id": "u2", "a": 7}}, "resolution=merge-duplicates,return=representation")
	if len(up2.arr()) != 2 || len(e.svc("GET", "/rest/v1/ups", nil, "").arr()) != 2 {
		t.Fatalf("mixed upsert %s", up2.raw)
	}
	ign := e.svc("POST", "/rest/v1/ups", []map[string]any{{"id": "u1", "b": 99}, {"id": "u3"}}, "resolution=ignore-duplicates,return=representation")
	if len(ign.arr()) != 1 || e.svc("GET", "/rest/v1/ups?id=eq.u1", nil, "").arr()[0]["b"] != 4.0 {
		t.Fatalf("ignore-duplicates %s", ign.raw)
	}

	// PATCH
	e.svc("POST", "/rest/v1/mut", []map[string]any{
		{"k": "m1", "grp": "g1", "v": "x", "keep": 1}, {"k": "m2", "grp": "g1", "v": "x", "keep": 2},
		{"k": "m3", "grp": "g2", "v": "x", "keep": 3}, {"k": "m4", "grp": "g2", "v": "x", "keep": 4},
	}, "")
	p1 := e.svc("PATCH", "/rest/v1/mut?k=eq.m2", map[string]any{"v": "new"}, "return=representation")
	if p1.status != 200 || len(p1.arr()) != 1 || p1.arr()[0]["v"] != "new" || p1.arr()[0]["keep"] != 2.0 {
		t.Fatalf("patch %d %s", p1.status, p1.raw)
	}
	if p := e.svc("PATCH", "/rest/v1/mut?grp=eq.g2", map[string]any{"v": "g2"}, ""); p.status != 204 || p.raw != "" {
		t.Fatalf("patch w/o Prefer => 204 empty: %d %q", p.status, p.raw)
	}
	vs := ids(e.svc("GET", "/rest/v1/mut?order=k", nil, "").arr(), "v")
	eq(t, "only matching rows changed", vs, []any{"x", "new", "g2", "g2"})
	p3 := e.svc("PATCH", "/rest/v1/mut?k=eq.nobody", map[string]any{"v": "zzz"}, "return=representation")
	if p3.status != 200 || p3.raw != "[]\n" {
		t.Fatalf("no match => 200 []: %d %q", p3.status, p3.raw)
	}
	p4 := e.svc("PATCH", "/rest/v1/mut?k=eq.m1", map[string]any{"v": nil}, "return=representation")
	if p4.arr()[0]["v"] != nil {
		t.Fatalf("set null %s", p4.raw)
	}
	// DELETE
	if d := e.svc("DELETE", "/rest/v1/mut?k=eq.m3", nil, ""); d.status != 204 || d.raw != "" {
		t.Fatalf("delete %d %q", d.status, d.raw)
	}
	if d := e.svc("DELETE", "/rest/v1/mut?k=eq.nobody", nil, ""); d.status != 204 {
		t.Fatalf("delete no match %d", d.status)
	}
	eq(t, "left after delete", sorted(keysOf(e, "mut", "", "k")), sorted([]any{"m1", "m2", "m4"}))
	d2 := e.svc("DELETE", "/rest/v1/mut?k=in.(m1,m2)", nil, "return=representation")
	if d2.status != 200 || len(d2.arr()) != 2 {
		t.Fatalf("delete rep %d %s", d2.status, d2.raw)
	}
	eq(t, "left", keysOf(e, "mut", "", "k"), []any{"m4"})
	// bulk insert is atomic
	bad := e.svc("POST", "/rest/v1/inquiries", []map[string]any{{"user_id": e.userID("atomic@example.com")}, {"symptoms": "no user"}}, "return=representation")
	if bad.status != 400 {
		t.Fatalf("second row lacks user_id: %d %s", bad.status, bad.raw)
	}
	if n := len(e.svc("GET", "/rest/v1/inquiries", nil, "").arr()); n != 0 {
		t.Fatalf("a failed bulk insert must roll back (rows=%d)", n)
	}
}

func (e *env) userID(email string) string {
	id, _ := e.user(email)
	return id
}

func TestUnknownTableAndColumns(t *testing.T) {
	e := newEnv(t, nil)
	r := e.svc("GET", "/rest/v1/not_a_table", nil, "")
	if r.status != 404 || r.obj()["code"] != "PGRST205" {
		t.Fatalf("unknown table %d %s", r.status, r.raw)
	}
	if r := e.svc("POST", "/rest/v1/not_a_table", map[string]any{"a": 1}, ""); r.status != 404 {
		t.Fatalf("write unknown table %d", r.status)
	}
	if r := e.svc("GET", "/rest/v1/profiles?nope=eq.1", nil, ""); r.status != 400 || r.obj()["code"] != "42703" {
		t.Fatalf("unknown filter column %d %s", r.status, r.raw)
	}
	if r := e.svc("GET", "/rest/v1/profiles?select=id,nope", nil, ""); r.status != 400 {
		t.Fatalf("unknown select column %d", r.status)
	}
	if r := e.svc("GET", "/rest/v1/profiles?order=nope", nil, ""); r.status != 400 {
		t.Fatalf("unknown order column %d", r.status)
	}
	if r := e.svc("POST", "/rest/v1/system_logs", map[string]any{"level": "info", "category": "c", "message": "m", "bogus": 1}, ""); r.status != 400 || r.obj()["code"] != "PGRST204" {
		t.Fatalf("unknown insert column %d %s", r.status, r.raw)
	}
	if r := e.svc("PATCH", "/rest/v1/profiles?id=eq."+newUUID(), map[string]any{"bogus": 1}, ""); r.status != 400 || r.obj()["code"] != "PGRST204" {
		t.Fatalf("unknown patch column %d %s", r.status, r.raw)
	}
	// invalid uuid / int literals are 400 22P02, not an empty list
	if r := e.svc("GET", "/rest/v1/profiles?id=eq.not-a-uuid", nil, ""); r.status != 400 || r.obj()["code"] != "22P02" {
		t.Fatalf("bad uuid %d %s", r.status, r.raw)
	}
	if r := e.svc("GET", "/rest/v1/system_logs?id=eq.abc", nil, ""); r.status != 400 {
		t.Fatalf("bad int %d", r.status)
	}
}

func TestTypedColumnsAndIDs(t *testing.T) {
	e := newEnv(t, nil)
	// identity (bigint) ids count up; admin_settings is the single seeded row id=1
	a := e.svc("POST", "/rest/v1/system_logs", map[string]any{"level": "info", "category": "c", "message": "1"}, "return=representation").arr()[0]
	b := e.svc("POST", "/rest/v1/system_logs", map[string]any{"level": "warn", "category": "c", "message": "2"}, "return=representation").arr()[0]
	if a["id"].(float64) <= 0 || b["id"].(float64) != a["id"].(float64)+1 {
		t.Fatalf("identity ids %v %v", a["id"], b["id"])
	}
	if ts, _ := a["timestamp"].(string); !strings.HasSuffix(ts, "+00:00") {
		t.Fatalf("timestamp default %v", a["timestamp"])
	}
	eq(t, "admin_settings seeded", ids(e.svc("GET", "/rest/v1/admin_settings?id=gt.0", nil, "").arr(), "id"), []any{1.0})
	pg := e.svc("PATCH", "/rest/v1/admin_settings?id=gt.0", map[string]any{"music_url": "http://m"}, "return=representation")
	if pg.status != 200 || len(pg.arr()) != 1 || pg.arr()[0]["music_url"] != "http://m" {
		t.Fatalf("admin_settings patch %d %s", pg.status, pg.raw)
	}
	if r := e.svc("POST", "/rest/v1/admin_settings", map[string]any{"music_url": "x"}, ""); r.status != 409 {
		t.Fatalf("second admin_settings row must conflict: %d %s", r.status, r.raw)
	}
	if r := e.svc("POST", "/rest/v1/admin_settings", map[string]any{"id": 2}, ""); r.status != 400 || r.obj()["code"] != "23514" {
		t.Fatalf("admin_settings id!=1: %d %s", r.status, r.raw)
	}
	// system_errors ids are uuids (the Go handler reads them as strings)
	se := e.svc("POST", "/rest/v1/system_errors", map[string]any{"error_type": "t", "message": "m"}, "return=representation").arr()[0]
	if !uuidRe.MatchString(se["id"].(string)) || se["severity"] != "medium" || se["resolved"] != false {
		t.Fatalf("system_errors defaults %v", se)
	}
	// system_metrics.value is text: JSON numbers are stored as their text
	sm := e.svc("POST", "/rest/v1/system_metrics", map[string]any{"type": "t", "name": "n", "value": 42.5}, "return=representation").arr()[0]
	if sm["value"] != "42.5" || sm["unit"] != "count" {
		t.Fatalf("system_metrics %v", sm)
	}
	// select=* returns every column of the table, nulls included
	row := e.svc("GET", "/rest/v1/profiles?select=*&limit=1", nil, "").arr()[0]
	for _, c := range []string{"id", "email", "role", "is_approved", "specialty", "preferences", "created_at", "flag", "preferred_language"} {
		if _, ok := row[c]; !ok {
			t.Errorf("select=* misses %s", c)
		}
	}
	// select=a,b projects
	pr := e.svc("GET", "/rest/v1/profiles?select=id,role&limit=1", nil, "").arr()[0]
	if len(pr) != 2 {
		t.Fatalf("projection %v", pr)
	}
	// update trigger touches updated_at; created_at stays
	pid := row["id"].(string)
	before := e.svc("GET", "/rest/v1/profiles?id=eq."+pid, nil, "").arr()[0]
	e.svc("PATCH", "/rest/v1/profiles?id=eq."+pid, map[string]any{"bio": "hello"}, "")
	after := e.svc("GET", "/rest/v1/profiles?id=eq."+pid, nil, "").arr()[0]
	if after["bio"] != "hello" || after["created_at"] != before["created_at"] || after["updated_at"].(string) <= before["updated_at"].(string) {
		t.Fatalf("trigger: before %v after %v", before["updated_at"], after["updated_at"])
	}
	// array columns accept arrays and Postgres literals, jsonb accepts any JSON, overall_score is checked
	uid := e.userID("ds@example.com")
	ds := e.svc("POST", "/rest/v1/diagnosis_sessions", map[string]any{"user_id": uid, "primary_diagnosis": "qi", "full_report": map[string]any{"a": []int{1}}, "symptoms": "{cough,\"sore throat\"}", "overall_score": 80, "follow_up_date": "2026-10-10T00:00:00Z"}, "return=representation")
	if ds.status != 201 {
		t.Fatalf("ds insert %d %s", ds.status, ds.raw)
	}
	d0 := ds.arr()[0]
	eq(t, "symptoms literal", d0["symptoms"], []any{"cough", "sore throat"})
	if d0["follow_up_date"] != "2026-10-10" || d0["is_guest_session"] != false {
		t.Fatalf("ds defaults %v", d0)
	}
	for _, bad := range []map[string]any{
		{"user_id": uid, "primary_diagnosis": "x", "full_report": map[string]any{}, "overall_score": 101},
		{"user_id": uid, "primary_diagnosis": "x", "full_report": map[string]any{}, "overall_score": -1},
		{"user_id": uid, "primary_diagnosis": "x", "full_report": map[string]any{}, "overall_score": 85.5},
		{"user_id": uid, "full_report": map[string]any{}},
		{"user_id": uid, "primary_diagnosis": "x"},
		{"user_id": uid, "primary_diagnosis": "x", "full_report": map[string]any{}, "follow_up_date": "tomorrow"},
	} {
		if r := e.svc("POST", "/rest/v1/diagnosis_sessions", bad, ""); r.status != 400 {
			t.Errorf("%v: want 400 got %d %s", bad, r.status, r.raw)
		}
	}
}

func TestConstraints(t *testing.T) {
	e := newEnv(t, nil)
	uid, _ := e.user("c@example.com")
	// profiles.role check
	for _, role := range []string{"god", "", "Admin"} {
		r := e.svc("PATCH", "/rest/v1/profiles?id=eq."+uid, map[string]any{"role": role}, "")
		if r.status != 400 || r.obj()["code"] != "23514" {
			t.Errorf("role %q: %d %s", role, r.status, r.raw)
		}
	}
	if r := e.svc("PATCH", "/rest/v1/profiles?id=eq."+uid, map[string]any{"role": "admin"}, ""); r.status != 204 {
		t.Fatalf("valid role: %d %s", r.status, r.raw)
	}
	if r := e.svc("PATCH", "/rest/v1/profiles?id=eq."+uid, map[string]any{"role": nil}, ""); r.status != 400 || r.obj()["code"] != "23502" {
		t.Fatalf("role null: %d %s", r.status, r.raw)
	}
	if r := e.svc("PATCH", "/rest/v1/profiles?id=eq."+uid, map[string]any{"preferred_language": "fr"}, ""); r.status != 400 {
		t.Fatalf("language check: %d", r.status)
	}
	if r := e.svc("PATCH", "/rest/v1/profiles?id=eq."+uid, map[string]any{"preferred_language": "toolong"}, ""); r.status != 400 {
		t.Fatalf("language varchar(5): %d", r.status)
	}
	// unique email (case-insensitive) across profiles
	uid2, _ := e.user("c2@example.com")
	if r := e.svc("PATCH", "/rest/v1/profiles?id=eq."+uid2, map[string]any{"email": "C@Example.com"}, ""); r.status != 409 || r.obj()["code"] != "23505" {
		t.Fatalf("unique email: %d %s", r.status, r.raw)
	}
	// a profile cannot exist without an auth user (FK), nor with an invalid role on insert
	if r := e.svc("POST", "/rest/v1/profiles", map[string]any{"id": newUUID(), "email": "orphan@example.com"}, ""); r.status != 409 || r.obj()["code"] != "23503" {
		t.Fatalf("profile FK: %d %s", r.status, r.raw)
	}
	if r := e.svc("POST", "/rest/v1/profiles", map[string]any{"email": "noid@example.com"}, ""); r.status != 400 || r.obj()["code"] != "23502" {
		t.Fatalf("profile id required: %d %s", r.status, r.raw)
	}
	// upsert of an existing profile (the app's trigger-race pattern) merges and keeps other columns
	up := e.svc("POST", "/rest/v1/profiles", map[string]any{"id": uid, "full_name": "Upserted", "role": "doctor"}, "resolution=merge-duplicates,return=representation")
	if up.status != 201 || up.arr()[0]["full_name"] != "Upserted" || up.arr()[0]["email"] != "c@example.com" {
		t.Fatalf("profile upsert %d %s", up.status, up.raw)
	}
	// on_conflict on a unique column (seed-all.mjs / system_prompts.role)
	pr := e.svc("POST", "/rest/v1/system_prompts?on_conflict=role", map[string]any{"role": "doctor_body", "prompt_text": "changed"}, "resolution=merge-duplicates,return=representation")
	if pr.status != 201 || pr.arr()[0]["prompt_text"] != "changed" {
		t.Fatalf("on_conflict role %d %s", pr.status, pr.raw)
	}
	if n := len(e.svc("GET", "/rest/v1/system_prompts?role=eq.doctor_body", nil, "").arr()); n != 1 {
		t.Fatalf("on_conflict must not duplicate (n=%d)", n)
	}
	if r := e.svc("POST", "/rest/v1/system_prompts?on_conflict=prompt_text", map[string]any{"role": "x"}, "resolution=merge-duplicates"); r.status != 400 {
		t.Fatalf("on_conflict without unique constraint: %d", r.status)
	}
	if r := e.svc("POST", "/rest/v1/system_prompts", map[string]any{"role": "doctor_body"}, ""); r.status != 409 {
		t.Fatalf("system_prompts.role unique: %d", r.status)
	}
	// inquiries: user_id required + FK to profiles
	if r := e.svc("POST", "/rest/v1/inquiries", map[string]any{"symptoms": "x"}, ""); r.status != 400 || r.obj()["code"] != "23502" {
		t.Fatalf("inquiry needs user_id: %d %s", r.status, r.raw)
	}
	if r := e.svc("POST", "/rest/v1/inquiries", map[string]any{"user_id": newUUID()}, ""); r.status != 409 || r.obj()["code"] != "23503" {
		t.Fatalf("inquiry FK: %d %s", r.status, r.raw)
	}
	in := e.svc("POST", "/rest/v1/inquiries", map[string]any{"user_id": uid, "symptoms": "cough"}, "return=representation")
	if in.status != 201 || in.arr()[0]["status"] != "pending" || in.arr()[0]["doctor_id"] != nil {
		t.Fatalf("inquiry %d %s", in.status, in.raw)
	}
	// enum-ish checks
	if r := e.svc("POST", "/rest/v1/system_logs", map[string]any{"level": "fatal", "category": "c", "message": "m"}, ""); r.status != 400 {
		t.Fatalf("log level check: %d", r.status)
	}
	if r := e.svc("POST", "/rest/v1/system_errors", map[string]any{"error_type": "t", "message": "m", "severity": "meh"}, ""); r.status != 400 {
		t.Fatalf("severity check: %d", r.status)
	}
	if r := e.svc("POST", "/rest/v1/user_devices", map[string]any{"user_id": uid, "device_token": "t", "device_type": "toaster"}, ""); r.status != 400 {
		t.Fatalf("device_type check: %d", r.status)
	}
	if r := e.svc("POST", "/rest/v1/system_errors", map[string]any{"error_type": strings.Repeat("x", 101), "message": "m"}, ""); r.status != 400 || r.obj()["code"] != "22001" {
		t.Fatalf("varchar(100): %d %s", r.status, r.raw)
	}
	// user_devices unique (user_id, device_token)
	d1 := map[string]any{"user_id": uid, "device_token": "tok", "device_type": "web"}
	okStatus(t, "device", e.svc("POST", "/rest/v1/user_devices", d1, ""), 201)
	if r := e.svc("POST", "/rest/v1/user_devices", d1, ""); r.status != 409 {
		t.Fatalf("device unique: %d", r.status)
	}
	// user_notification_preferences one row per user
	okStatus(t, "prefs", e.svc("POST", "/rest/v1/user_notification_preferences", map[string]any{"user_id": uid}, ""), 201)
	if r := e.svc("POST", "/rest/v1/user_notification_preferences", map[string]any{"user_id": uid}, ""); r.status != 409 {
		t.Fatalf("prefs unique: %d", r.status)
	}
	p := e.svc("GET", "/rest/v1/user_notification_preferences?user_id=eq."+uid, nil, "").arr()[0]
	if p["quiet_hours_start"] != "22:00:00" || p["frequency_monthly"] != false || p["categories"].(map[string]any)["sleep"] != true {
		t.Fatalf("prefs defaults %v", p)
	}
}

func TestPreferHeaders(t *testing.T) {
	e := newEnv(t, nil)
	uid, _ := e.user("pf@example.com")
	r := e.svc("POST", "/rest/v1/inquiries", map[string]any{"user_id": uid}, "return=minimal")
	if r.status != 201 || r.raw != "" {
		t.Fatalf("return=minimal %d %q", r.status, r.raw)
	}
	r = e.do(req{method: "GET", path: "/rest/v1/profiles", apikey: e.service(), headers: map[string]string{"Accept": "application/vnd.pgrst.object+json"}})
	if r.status != 406 {
		t.Fatalf("object negotiation must be explicit: %d", r.status)
	}
}
