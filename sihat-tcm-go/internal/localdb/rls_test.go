package localdb

import (
	"fmt"
	"sync"
	"testing"
)

func newSession(e *env, uid, token, diag string) string {
	r := e.as(token, "POST", "/rest/v1/diagnosis_sessions", map[string]any{"user_id": uid, "primary_diagnosis": diag, "full_report": map[string]any{"d": diag}}, "return=representation")
	if r.status != 201 {
		e.t.Fatalf("create session as user: %d %s", r.status, r.raw)
	}
	return r.arr()[0]["id"].(string)
}

func TestRLSOwnerRules(t *testing.T) {
	e := newEnv(t, nil)
	aID, aTok := e.user("a@example.com")
	bID, bTok := e.user("b@example.com")
	sa := newSession(e, aID, aTok, "A-diag")
	sb := newSession(e, bID, bTok, "B-diag")

	// SELECT: only own rows, whatever the filter says
	eq(t, "A sees own", ids(e.as(aTok, "GET", "/rest/v1/diagnosis_sessions?select=primary_diagnosis", nil, "").arr(), "primary_diagnosis"), []any{"A-diag"})
	eq(t, "A cannot read B by id", e.as(aTok, "GET", "/rest/v1/diagnosis_sessions?id=eq."+sb, nil, "").arr(), []map[string]any{})
	eq(t, "A cannot read B by user_id", e.as(aTok, "GET", "/rest/v1/diagnosis_sessions?user_id=eq."+bID, nil, "").arr(), []map[string]any{})
	if n := len(e.svc("GET", "/rest/v1/diagnosis_sessions", nil, "").arr()); n != 2 {
		t.Fatalf("service role sees all: %d", n)
	}

	// INSERT: WITH CHECK (auth.uid() = user_id)
	imp := e.as(aTok, "POST", "/rest/v1/diagnosis_sessions", map[string]any{"user_id": bID, "primary_diagnosis": "forged", "full_report": map[string]any{}}, "return=representation")
	if imp.status != 403 || imp.obj()["code"] != "42501" {
		t.Fatalf("insert as another user: %d %s", imp.status, imp.raw)
	}
	nouser := e.as(aTok, "POST", "/rest/v1/diagnosis_sessions", map[string]any{"primary_diagnosis": "orphan", "full_report": map[string]any{}}, "")
	if nouser.status != 403 {
		t.Fatalf("insert without user_id: %d %s", nouser.status, nouser.raw)
	}

	// UPDATE: other users' rows are invisible (0 rows), own rows can't be handed to someone else
	up := e.as(aTok, "PATCH", "/rest/v1/diagnosis_sessions?id=eq."+sb, map[string]any{"primary_diagnosis": "hacked"}, "return=representation")
	if up.status != 200 || len(up.arr()) != 0 {
		t.Fatalf("patch B's row as A: %d %s", up.status, up.raw)
	}
	if got := e.svc("GET", "/rest/v1/diagnosis_sessions?id=eq."+sb, nil, "").arr()[0]["primary_diagnosis"]; got != "B-diag" {
		t.Fatalf("B's row changed: %v", got)
	}
	steal := e.as(aTok, "PATCH", "/rest/v1/diagnosis_sessions?id=eq."+sa, map[string]any{"user_id": bID}, "return=representation")
	if steal.status != 403 {
		t.Fatalf("handing own row to B must violate the policy: %d %s", steal.status, steal.raw)
	}
	own := e.as(aTok, "PATCH", "/rest/v1/diagnosis_sessions?id=eq."+sa, map[string]any{"notes": "mine"}, "return=representation")
	if own.status != 200 || len(own.arr()) != 1 || own.arr()[0]["notes"] != "mine" {
		t.Fatalf("patch own: %d %s", own.status, own.raw)
	}
	// unfiltered PATCH/DELETE only ever touches own rows
	e.as(aTok, "PATCH", "/rest/v1/diagnosis_sessions", map[string]any{"notes": "bulk"}, "")
	if e.svc("GET", "/rest/v1/diagnosis_sessions?id=eq."+sb, nil, "").arr()[0]["notes"] != nil {
		t.Fatal("bulk PATCH leaked into B's rows")
	}

	// DELETE
	e.as(aTok, "DELETE", "/rest/v1/diagnosis_sessions?id=eq."+sb, nil, "")
	if len(e.svc("GET", "/rest/v1/diagnosis_sessions?id=eq."+sb, nil, "").arr()) != 1 {
		t.Fatal("A deleted B's row")
	}
	e.as(aTok, "DELETE", "/rest/v1/diagnosis_sessions", nil, "") // all of A's
	left := e.svc("GET", "/rest/v1/diagnosis_sessions", nil, "").arr()
	if len(left) != 1 || left[0]["id"] != sb {
		t.Fatalf("unfiltered DELETE as A must remove only A's rows: %v", ids(left, "id"))
	}
}

func TestRLSNotificationTables(t *testing.T) {
	e := newEnv(t, nil)
	aID, aTok := e.user("na@example.com")
	bID, bTok := e.user("nb@example.com")
	rows := map[string]map[string]any{
		"user_notification_preferences": {"enabled": true},
		"user_devices":                  {"device_token": "tok", "device_type": "web"},
		"scheduled_notifications":       {"notification_type": "t", "title": "T", "body": "B", "category": "c", "scheduled_for": "2026-10-10T08:00:00Z"},
		"notification_history":          {"notification_type": "t", "title": "T", "body": "B", "category": "c", "priority": "normal"},
	}
	for tbl, base := range rows {
		mk := func(uid string) map[string]any {
			m := map[string]any{"user_id": uid}
			for k, v := range base {
				m[k] = v
			}
			return m
		}
		okStatus(t, tbl+" A insert", e.as(aTok, "POST", "/rest/v1/"+tbl, mk(aID), "return=representation"), 201)
		okStatus(t, tbl+" B insert", e.as(bTok, "POST", "/rest/v1/"+tbl, mk(bID), "return=representation"), 201)
		if r := e.as(aTok, "POST", "/rest/v1/"+tbl, mk(bID), ""); r.status != 403 {
			t.Errorf("%s: A inserting for B: %d", tbl, r.status)
		}
		got := e.as(aTok, "GET", "/rest/v1/"+tbl, nil, "").arr()
		if len(got) != 1 || got[0]["user_id"] != aID {
			t.Errorf("%s: A sees %v", tbl, ids(got, "user_id"))
		}
		if n := len(e.as(aTok, "GET", "/rest/v1/"+tbl+"?user_id=eq."+bID, nil, "").arr()); n != 0 {
			t.Errorf("%s: A read B's rows (%d)", tbl, n)
		}
		up := e.as(aTok, "PATCH", "/rest/v1/"+tbl+"?user_id=eq."+bID, map[string]any{"user_id": aID}, "return=representation")
		if len(up.arr()) != 0 {
			t.Errorf("%s: A modified B's row: %s", tbl, up.raw)
		}
		e.as(aTok, "DELETE", "/rest/v1/"+tbl+"?user_id=eq."+bID, nil, "")
		if n := len(e.svc("GET", "/rest/v1/"+tbl+"?user_id=eq."+bID, nil, "").arr()); n != 1 {
			t.Errorf("%s: A deleted B's row", tbl)
		}
	}
}

func TestRLSProfilesAndPrivileges(t *testing.T) {
	e := newEnv(t, nil)
	aID, aTok := e.user("pa@example.com")
	bID, _ := e.user("pb@example.com")

	// profiles: authenticated may SELECT only their own row
	own := e.as(aTok, "GET", "/rest/v1/profiles", nil, "").arr()
	if len(own) != 1 || own[0]["id"] != aID {
		t.Fatalf("profiles as A: %v", ids(own, "id"))
	}
	if n := len(e.as(aTok, "GET", "/rest/v1/profiles?id=eq."+bID, nil, "").arr()); n != 0 {
		t.Fatalf("A read B's profile")
	}
	// ...and has no write privilege at all (GRANT select only): no self-promotion to admin
	for _, c := range []struct{ m, p string }{
		{"PATCH", "/rest/v1/profiles?id=eq." + aID},
		{"DELETE", "/rest/v1/profiles?id=eq." + aID},
		{"POST", "/rest/v1/profiles"},
	} {
		r := e.as(aTok, c.m, c.p, map[string]any{"role": "admin", "id": aID}, "")
		if r.status != 403 || r.obj()["code"] != "42501" {
			t.Errorf("%s %s as user: %d %s", c.m, c.p, r.status, r.raw)
		}
	}
	if e.svc("GET", "/rest/v1/profiles?id=eq."+aID, nil, "").arr()[0]["role"] != "patient" {
		t.Fatal("role changed")
	}
	// tables with RLS on and no policy / no grant are service-role only
	for _, tbl := range []string{"inquiries", "patients", "guest_diagnosis_sessions", "admin_settings", "system_prompts", "system_logs", "system_errors", "system_metrics"} {
		for _, m := range []string{"GET", "POST", "PATCH", "DELETE"} {
			var body any
			if m == "POST" || m == "PATCH" {
				body = map[string]any{}
			}
			if r := e.as(aTok, m, "/rest/v1/"+tbl, body, ""); r.status != 403 || r.obj()["code"] != "42501" {
				t.Errorf("%s %s as user: %d %s", m, tbl, r.status, r.raw)
			}
		}
	}
	// the anon key reads and writes nothing (no GRANT to anon): 401 permission denied
	for _, tbl := range []string{"profiles", "diagnosis_sessions", "system_prompts", "admin_settings", "inquiries"} {
		for _, m := range []string{"GET", "POST", "PATCH", "DELETE"} {
			var body any
			if m == "POST" || m == "PATCH" {
				body = map[string]any{}
			}
			r := e.do(req{method: m, path: "/rest/v1/" + tbl, body: body, apikey: e.anon(), bearer: e.anon()})
			if r.status != 401 || r.obj()["code"] != "42501" {
				t.Errorf("anon %s %s: %d %s", m, tbl, r.status, r.raw)
			}
		}
	}
	// apikey=anon with a user JWT as bearer acts as that user (PostgREST uses the JWT's role)
	r := e.do(req{path: "/rest/v1/profiles", apikey: e.anon(), bearer: aTok})
	if r.status != 200 || len(r.arr()) != 1 {
		t.Fatalf("anon apikey + user jwt: %d %s", r.status, r.raw)
	}
}

func TestRLSUpsertCannotTakeOverRows(t *testing.T) {
	e := newEnv(t, nil)
	aID, aTok := e.user("ua@example.com")
	_, bTok := e.user("ub@example.com")
	rID := newSession(e, aID, aTok, "A-diag")
	r := e.as(bTok, "POST", "/rest/v1/diagnosis_sessions", map[string]any{"id": rID, "user_id": aID, "primary_diagnosis": "x", "full_report": map[string]any{}}, "resolution=merge-duplicates,return=representation")
	if r.status != 403 {
		t.Fatalf("B upserting A's id with A's user_id: %d %s", r.status, r.raw)
	}
}

func TestConcurrentWrites(t *testing.T) {
	e := newEnv(t, nil)
	uid, tok := e.user("conc@example.com")
	const workers, per = 16, 12
	var wg sync.WaitGroup
	errs := make(chan string, workers*per*3)
	for w := 0; w < workers; w++ {
		wg.Add(1)
		go func(w int) {
			defer wg.Done()
			for i := 0; i < per; i++ {
				// inserts as the user (RLS path) and as the service role, plus new signups and reads
				r := e.as(tok, "POST", "/rest/v1/diagnosis_sessions", map[string]any{"user_id": uid, "primary_diagnosis": fmt.Sprintf("w%d-%d", w, i), "full_report": map[string]any{}}, "")
				if r.status != 201 {
					errs <- fmt.Sprintf("insert: %d %s", r.status, r.raw)
				}
				r = e.svc("POST", "/rest/v1/system_logs", map[string]any{"level": "info", "category": "c", "message": fmt.Sprintf("%d-%d", w, i)}, "")
				if r.status != 201 {
					errs <- fmt.Sprintf("log: %d %s", r.status, r.raw)
				}
				if i%4 == 0 {
					if s := e.signup(fmt.Sprintf("cw%d-%d@example.com", w, i), "secret123", nil); s.status != 200 {
						errs <- fmt.Sprintf("signup: %d %s", s.status, s.raw)
					}
				}
				if g := e.as(tok, "GET", "/rest/v1/diagnosis_sessions?limit=5", nil, ""); g.status != 200 {
					errs <- fmt.Sprintf("read: %d %s", g.status, g.raw)
				}
			}
		}(w)
	}
	wg.Wait()
	close(errs)
	for m := range errs {
		t.Error(m)
	}
	if n := len(e.as(tok, "GET", "/rest/v1/diagnosis_sessions?select=id", nil, "").arr()); n != workers*per {
		t.Fatalf("sessions %d want %d", n, workers*per)
	}
	logs := e.svc("GET", "/rest/v1/system_logs?select=id", nil, "").arr()
	if len(logs) != workers*per {
		t.Fatalf("logs %d want %d", len(logs), workers*per)
	}
	seen := map[any]bool{}
	for _, l := range logs {
		if seen[l["id"]] {
			t.Fatalf("duplicate identity id %v", l["id"])
		}
		seen[l["id"]] = true
	}
	wantSignups := workers * (per / 4)
	if n := len(e.svc("GET", "/rest/v1/profiles?email=like.cw*", nil, "").arr()); n != wantSignups {
		t.Fatalf("signups %d want %d", n, wantSignups)
	}
}

func TestConcurrentSignupSameEmail(t *testing.T) {
	e := newEnv(t, nil)
	var wg sync.WaitGroup
	res := make(chan int, 12)
	for i := 0; i < 12; i++ {
		wg.Add(1)
		go func() { defer wg.Done(); res <- e.signup("race@example.com", "secret123", nil).status }()
	}
	wg.Wait()
	close(res)
	ok, dup := 0, 0
	for s := range res {
		switch s {
		case 200:
			ok++
		case 422:
			dup++
		}
	}
	if ok != 1 || dup != 11 {
		t.Fatalf("exactly one signup may win: ok=%d dup=%d", ok, dup)
	}
}

func TestPersistenceAcrossReopen(t *testing.T) {
	e := newEnv(t, nil)
	uid, tok := e.user("p@example.com")
	sid := newSession(e, uid, tok, "persist")
	anon, svc := e.anon(), e.service()
	secret := string(e.db.secret)
	nProfiles := len(e.svc("GET", "/rest/v1/profiles", nil, "").arr())
	nPrompts := len(e.svc("GET", "/rest/v1/system_prompts", nil, "").arr())

	e.reopen()
	if e.anon() != anon || e.service() != svc || string(e.db.secret) != secret {
		t.Fatal("keys / JWT secret must survive a restart")
	}
	if g := e.do(req{path: "/auth/v1/user", apikey: e.anon(), bearer: tok}); g.status != 200 || g.str("id") != uid {
		t.Fatalf("a token issued before the restart must still work: %d", g.status)
	}
	if e.login("p@example.com", "secret123").status != 200 {
		t.Fatal("login after reopen")
	}
	if r := e.as(tok, "GET", "/rest/v1/diagnosis_sessions?id=eq."+sid, nil, "").arr(); len(r) != 1 || r[0]["primary_diagnosis"] != "persist" {
		t.Fatalf("data after reopen: %v", r)
	}
	if n := len(e.svc("GET", "/rest/v1/profiles", nil, "").arr()); n != nProfiles {
		t.Fatalf("reopen re-seeded profiles: %d vs %d", n, nProfiles)
	}
	if n := len(e.svc("GET", "/rest/v1/system_prompts", nil, "").arr()); n != nPrompts {
		t.Fatalf("reopen re-seeded prompts: %d vs %d", n, nPrompts)
	}
	// identity sequences keep counting after a restart
	a := e.svc("POST", "/rest/v1/system_logs", map[string]any{"level": "info", "category": "c", "message": "1"}, "return=representation").arr()[0]["id"].(float64)
	e.reopen()
	b := e.svc("POST", "/rest/v1/system_logs", map[string]any{"level": "info", "category": "c", "message": "2"}, "return=representation").arr()[0]["id"].(float64)
	if b != a+1 {
		t.Fatalf("sequence after reopen: %v then %v", a, b)
	}
}

func TestExplicitSecretsFromOptions(t *testing.T) {
	e := newEnv(t, func(o *Options) {
		o.JWTSecret = "fixed-secret-for-test"
		o.ServiceKey = "svc-key-123"
		o.AnonKey = "anon-key-123"
	})
	if e.anon() != "anon-key-123" || e.service() != "svc-key-123" {
		t.Fatalf("keys %q %q", e.anon(), e.service())
	}
	tok := signJWT([]byte("fixed-secret-for-test"), map[string]any{"sub": newUUID(), "role": "authenticated", "exp": e.db.now().Add(3600e9).Unix()})
	if _, err := verifyJWT(e.db.secret, tok, e.db.now()); err != nil {
		t.Fatal("LOCAL_JWT_SECRET must be used to verify")
	}
	// a token signed with a different secret is not accepted
	forged := signJWT([]byte("attacker"), map[string]any{"sub": newUUID(), "role": "authenticated", "exp": e.db.now().Add(3600e9).Unix()})
	if r := e.do(req{path: "/rest/v1/diagnosis_sessions", apikey: "anon-key-123", bearer: forged}); r.status != 401 {
		t.Fatalf("forged JWT accepted: %d", r.status)
	}
	// a correctly signed token for a role other than authenticated is not accepted either
	svcJWT := signJWT([]byte("fixed-secret-for-test"), map[string]any{"sub": "x", "role": "service_role", "exp": e.db.now().Add(3600e9).Unix()})
	if r := e.do(req{path: "/rest/v1/profiles", apikey: "anon-key-123", bearer: svcJWT}); r.status != 401 {
		t.Fatalf("self-minted service_role JWT accepted: %d", r.status)
	}
}

func TestSeedData(t *testing.T) {
	e := newEnv(t, nil)
	profiles := e.svc("GET", "/rest/v1/profiles?order=email", nil, "").arr()
	if len(profiles) != 10 {
		t.Fatalf("4 demo accounts + 6 doctors, got %d", len(profiles))
	}
	roles := map[string]int{}
	approved := 0
	for _, p := range profiles {
		roles[p["role"].(string)]++
		if p["role"] == "doctor" && p["is_approved"] == true {
			approved++
		}
	}
	if roles["patient"] != 1 || roles["admin"] != 1 || roles["developer"] != 1 || roles["doctor"] != 7 || approved != 7 {
		t.Fatalf("roles %v approved doctors %d", roles, approved)
	}
	for _, em := range []string{"patient", "doctor", "admin", "developer"} {
		if r := e.login(em+"@sihat.com", "password123"); r.status != 200 {
			t.Errorf("seed login %s: %d", em, r.status)
		}
	}
	if n := len(e.svc("GET", "/rest/v1/system_prompts", nil, "").arr()); n != 12 {
		t.Fatalf("system prompts %d want 12", n)
	}
	if n := len(e.svc("GET", "/rest/v1/admin_settings", nil, "").arr()); n != 1 {
		t.Fatalf("admin_settings rows %d", n)
	}
	// SEED_DEMO off: base data only, no accounts
	e2 := newEnv(t, func(o *Options) { o.SeedDemo = false })
	if n := len(e2.svc("GET", "/rest/v1/profiles", nil, "").arr()); n != 0 {
		t.Fatalf("no demo accounts expected, got %d", n)
	}
	if e2.login("admin@sihat.com", "password123").status == 200 {
		t.Fatal("demo admin exists with SeedDemo=false")
	}
	if n := len(e2.svc("GET", "/rest/v1/system_prompts", nil, "").arr()); n != 12 {
		t.Fatalf("prompts still seeded: %d", n)
	}
}

func TestResetHook(t *testing.T) {
	e := newEnv(t, func(o *Options) { o.TestHooks = true })
	_, tok := e.user("rs@example.com")
	if r := e.do(req{method: "POST", path: "/__fake/reset"}); r.status != 200 {
		t.Fatalf("reset %d", r.status)
	}
	if n := len(e.svc("GET", "/rest/v1/profiles", nil, "").arr()); n != 10 {
		t.Fatalf("profiles after reset %d", n)
	}
	if e.login("rs@example.com", "secret123").status == 200 {
		t.Fatal("signed-up user survived reset")
	}
	if g := e.do(req{path: "/auth/v1/user", apikey: e.anon(), bearer: tok}); g.status != 401 {
		t.Fatalf("old token after reset: %d", g.status)
	}
	if e.login("admin@sihat.com", "password123").status != 200 {
		t.Fatal("seed login after reset")
	}
	h := e.do(req{path: "/__fake/health"})
	if h.status != 200 || h.obj()["users"] != 10.0 {
		t.Fatalf("health hook %s", h.raw)
	}
}

func TestConcurrentPatchSameRow(t *testing.T) {
	e := newEnv(t, nil)
	uid, tok := e.user("pat@example.com")
	sid := newSession(e, uid, tok, "start")
	var wg sync.WaitGroup
	for i := 0; i < 20; i++ {
		wg.Add(1)
		go func(i int) {
			defer wg.Done()
			e.as(tok, "PATCH", "/rest/v1/diagnosis_sessions?id=eq."+sid, map[string]any{"notes": fmt.Sprintf("n%d", i)}, "")
		}(i)
	}
	wg.Wait()
	rows := e.as(tok, "GET", "/rest/v1/diagnosis_sessions?id=eq."+sid, nil, "").arr()
	if len(rows) != 1 || rows[0]["primary_diagnosis"] != "start" || rows[0]["notes"] == nil {
		t.Fatalf("row after concurrent patches: %v", rows)
	}
}

func TestServeAndClose(t *testing.T) {
	db, err := Open(Options{Path: t.TempDir() + "/nested/dir/s.db", PBKDF2Iter: testIter})
	if err != nil {
		t.Fatal(err)
	}
	run, err := db.Serve("127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	anon, _ := db.Keys()
	e := &env{t: t, db: db}
	e.srv = httptestServerFor(run.URL)
	r := e.do(req{path: "/auth/v1/health", apikey: anon})
	if r.status != 200 {
		t.Fatalf("health via Serve: %d", r.status)
	}
	if err := run.Close(); err != nil {
		t.Fatal(err)
	}
	if _, err := Open(Options{}); err == nil {
		t.Fatal("Open without a path must fail")
	}
}

func TestBackupWhileOpen(t *testing.T) {
	e := newEnv(t, nil)
	uid, tok := e.user("bk@example.com")
	sid := newSession(e, uid, tok, "backup-me")
	dest := t.TempDir() + "/out/bk.db"
	if err := Backup(e.path, dest); err != nil {
		t.Fatalf("Backup: %v", err)
	}
	if err := Backup(e.path, dest); err == nil {
		t.Fatal("must refuse to overwrite an existing backup")
	}
	if err := Backup(t.TempDir()+"/nope.db", t.TempDir()+"/x.db"); err == nil {
		t.Fatal("missing source must fail")
	}
	// the copy opens as a normal database with the same data, keys and login
	e2 := &env{t: t, opt: Options{Path: dest, PBKDF2Iter: testIter, Logf: e.logs.Logf}}
	e2.open()
	t.Cleanup(func() { e2.srv.Close(); e2.db.Close() })
	if e2.anon() != e.anon() || e2.service() != e.service() {
		t.Fatal("backup must carry the keys")
	}
	if r := e2.as(tok, "GET", "/rest/v1/diagnosis_sessions?id=eq."+sid, nil, "").arr(); len(r) != 1 || r[0]["primary_diagnosis"] != "backup-me" {
		t.Fatalf("backup content %v", r)
	}
	if e2.login("bk@example.com", "secret123").status != 200 {
		t.Fatal("login against the backup")
	}
}

func TestSetRole(t *testing.T) {
	e := newEnv(t, nil)
	uid, tok := e.user("boss@example.com")
	if err := SetRole(e.path, "Boss@Example.com", "admin"); err != nil {
		t.Fatal(err)
	}
	p := e.svc("GET", "/rest/v1/profiles?id=eq."+uid, nil, "").arr()
	if len(p) != 1 || p[0]["role"] != "admin" {
		t.Fatalf("profile %v", p)
	}
	if got := e.as(tok, "GET", "/rest/v1/profiles?select=role", nil, "").arr(); len(got) != 1 || got[0]["role"] != "admin" {
		t.Fatalf("the user's own view %v", got)
	}
	for _, bad := range []string{"root", "", "ADMIN"} {
		if err := SetRole(e.path, "boss@example.com", bad); err == nil {
			t.Errorf("role %q accepted", bad)
		}
	}
	if err := SetRole(e.path, "ghost@example.com", "admin"); err == nil {
		t.Fatal("unknown email must fail")
	}
	if err := SetRole(t.TempDir()+"/none.db", "boss@example.com", "admin"); err == nil {
		t.Fatal("missing db must fail")
	}
}
