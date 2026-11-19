package localdb

// Regression tests added after MUTATION TESTING of internal/localdb (see regress/suites/hunt_mutation.mjs): each kills
// a mutant that every earlier test left green.

import (
	"strings"
	"testing"
	"time"
)

func (e *env) refresh(rt string) resp {
	return e.do(req{method: "POST", path: "/auth/v1/token?grant_type=refresh_token", body: map[string]any{"refresh_token": rt}, apikey: e.anon()})
}

// l13: a refresh token older than refreshTTL (30 days) must be refused, a younger one accepted.
func TestHMRefreshTokenExpires(t *testing.T) {
	e := newEnv(t, nil)
	old := e.signup("hm-old@example.com", "secret123", nil).str("refresh_token")
	young := e.signup("hm-young@example.com", "secret123", nil).str("refresh_token")
	e.db.now = func() time.Time { return time.Now().Add(29 * 24 * time.Hour) }
	if r := e.refresh(young); r.status != 200 {
		t.Fatalf("a 29-day-old refresh token must still work: %d %s", r.status, r.raw)
	}
	e.db.now = func() time.Time { return time.Now().Add(31 * 24 * time.Hour) }
	if r := e.refresh(old); r.status != 400 || r.obj()["error_code"] != "refresh_token_not_found" {
		t.Fatalf("a 31-day-old refresh token must be refused: %d %s", r.status, r.raw)
	}
}

// l08: changing the password ends every other refresh session (a stolen refresh token must not survive a reset).
func TestHMPasswordChangeRevokesRefreshSessions(t *testing.T) {
	e := newEnv(t, nil)
	s := e.signup("hm-pw@example.com", "secret123", nil)
	rt, tok := s.str("refresh_token"), s.str("access_token")
	r := e.do(req{method: "PUT", path: "/auth/v1/user", apikey: e.anon(), bearer: tok, body: map[string]any{"password": "newsecret456"}})
	okStatus(t, "password change", r, 200)
	if x := e.refresh(rt); x.status != 400 {
		t.Fatalf("refresh token issued before a password change must be dead: %d %s", x.status, x.raw)
	}
	fresh := e.login("hm-pw@example.com", "newsecret456")
	okStatus(t, "login with the new password", fresh, 200)
	if x := e.refresh(fresh.str("refresh_token")); x.status != 200 {
		t.Fatalf("a refresh token issued AFTER the change must work: %d %s", x.status, x.raw)
	}
}

// l24 / l31: GoTrue-level input caps (password 1024 bytes, email 254 chars) hold even when the app's own checks are bypassed.
func TestHMSignupInputCaps(t *testing.T) {
	e := newEnv(t, nil)
	if r := e.signup("hm-pw1024@example.com", strings.Repeat("p", 1024), nil); r.status != 200 {
		t.Fatalf("1024-byte password: %d %s", r.status, r.raw)
	}
	if r := e.signup("hm-pw1025@example.com", strings.Repeat("p", 1025), nil); r.status != 422 || r.obj()["error_code"] != "weak_password" {
		t.Fatalf("1025-byte password must be refused with weak_password: %d %s", r.status, r.raw)
	}
	ok254 := strings.Repeat("a", 254-len("@b.co")) + "@b.co"
	if len(ok254) != 254 {
		t.Fatalf("test email is %d chars", len(ok254))
	}
	if r := e.signup(ok254, "secret123", nil); r.status != 200 {
		t.Fatalf("254-char email: %d %s", r.status, r.raw)
	}
	if r := e.signup("a"+ok254, "secret123", nil); r.status != 400 || r.obj()["error_code"] != "validation_failed" {
		t.Fatalf("255-char email must be refused: %d %s", r.status, r.raw)
	}
}

// sec-03: a password change ends every OTHER access token of the user; the caller's own session stays valid.
func TestPasswordChangeRevokesOtherAccessTokens(t *testing.T) {
	e := newEnv(t, nil)
	a := e.signup("sess-a@example.com", "secret123", nil)
	b := e.login("sess-a@example.com", "secret123")
	other := e.signup("sess-b@example.com", "secret123", nil)
	me := func(tok string) int {
		return e.do(req{method: "GET", path: "/auth/v1/user", apikey: e.anon(), bearer: tok}).status
	}
	if me(a.str("access_token")) != 200 || me(b.str("access_token")) != 200 {
		t.Fatal("both tokens must work before the change")
	}
	okStatus(t, "password change", e.do(req{method: "PUT", path: "/auth/v1/user", apikey: e.anon(), bearer: b.str("access_token"), body: map[string]any{"password": "newsecret456"}}), 200)
	if s := me(a.str("access_token")); s != 401 {
		t.Fatalf("token issued before the password change must be dead, got %d", s)
	}
	if s := me(b.str("access_token")); s != 200 {
		t.Fatalf("the caller's own session must survive, got %d", s)
	}
	if s := me(other.str("access_token")); s != 200 {
		t.Fatalf("another user's token must be untouched, got %d", s)
	}
}

func TestCollateCompare(t *testing.T) {
	order := []string{"-y", "10", "9", "a", "A", "b", "B", "e", "é", "z", "Z", "ß", "李"}
	_ = order
	for _, p := range [][2]string{{"aaa", "ZZZ"}, {"a", "B"}, {"B", "c"}, {"e", "é"}, {"é", "f"}, {"a", "A"}, {"ab", "abc"}, {"ZZZ-x", "zzz-y"}, {"9", "a"}, {"_x", "a"}} {
		if collateCompare(p[0], p[1]) >= 0 || collateCompare(p[1], p[0]) <= 0 {
			t.Errorf("want %q < %q", p[0], p[1])
		}
	}
	if collateCompare("x", "x") != 0 || collateCompare("Ab", "ab") == 0 {
		t.Error("only identical strings may compare equal")
	}
	if collateCompare("2026-10-10T01:00:00.000000+00:00", "2026-10-10T02:00:00.000000+00:00") >= 0 {
		t.Error("timestamps must stay chronological")
	}
}
