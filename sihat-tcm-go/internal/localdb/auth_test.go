package localdb

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"strings"
	"testing"
	"time"
)

func TestJWTSignVerify(t *testing.T) {
	sec := []byte("s3cret")
	now := time.Now()
	tok := signJWT(sec, map[string]any{"sub": "u1", "exp": now.Add(time.Minute).Unix()})
	c, err := verifyJWT(sec, tok, now)
	if err != nil || c["sub"] != "u1" {
		t.Fatalf("verify: %v %v", c, err)
	}
	if strings.Count(tok, ".") != 2 {
		t.Fatal("not a compact JWT")
	}
}

func TestJWTExpiry(t *testing.T) {
	sec := []byte("s3cret")
	now := time.Now()
	tok := signJWT(sec, map[string]any{"sub": "u1", "exp": now.Add(time.Minute).Unix()})
	if _, err := verifyJWT(sec, tok, now.Add(2*time.Minute)); err != errJWTExpired {
		t.Fatalf("want expired, got %v", err)
	}
	if _, err := verifyJWT(sec, signJWT(sec, map[string]any{"sub": "x"}), now); err == nil {
		t.Fatal("a token with no exp must be rejected")
	}
	nbf := signJWT(sec, map[string]any{"exp": now.Add(time.Hour).Unix(), "nbf": now.Add(time.Minute).Unix()})
	if _, err := verifyJWT(sec, nbf, now); err == nil {
		t.Fatal("nbf in the future must be rejected")
	}
}

func TestJWTTamperAndAlg(t *testing.T) {
	sec := []byte("s3cret")
	now := time.Now()
	tok := signJWT(sec, map[string]any{"sub": "u1", "role": "authenticated", "exp": now.Add(time.Hour).Unix()})
	p := strings.Split(tok, ".")
	// payload swapped for an admin claim, original signature kept
	evil, _ := json.Marshal(map[string]any{"sub": "admin", "role": "authenticated", "exp": now.Add(time.Hour).Unix()})
	if _, err := verifyJWT(sec, p[0]+"."+b64.EncodeToString(evil)+"."+p[2], now); err == nil {
		t.Fatal("tampered payload must fail")
	}
	// flipped signature byte
	sig, _ := b64.DecodeString(p[2])
	sig[0] ^= 1
	if _, err := verifyJWT(sec, p[0]+"."+p[1]+"."+b64.EncodeToString(sig), now); err == nil {
		t.Fatal("tampered signature must fail")
	}
	// wrong secret
	if _, err := verifyJWT([]byte("other"), tok, now); err == nil {
		t.Fatal("wrong secret must fail")
	}
	// alg=none with empty signature
	h, _ := json.Marshal(map[string]string{"alg": "none", "typ": "JWT"})
	none := b64.EncodeToString(h) + "." + p[1] + "."
	if _, err := verifyJWT(sec, none, now); err == nil {
		t.Fatal("alg=none must fail")
	}
	// alg=HS512 header is not accepted either
	h2, _ := json.Marshal(map[string]string{"alg": "HS512", "typ": "JWT"})
	if _, err := verifyJWT(sec, b64.EncodeToString(h2)+"."+p[1]+"."+p[2], now); err == nil {
		t.Fatal("non-HS256 alg must fail")
	}
	for _, junk := range []string{"", "a.b", "a.b.c", "....", base64.StdEncoding.EncodeToString([]byte("x"))} {
		if _, err := verifyJWT(sec, junk, now); err == nil {
			t.Fatalf("junk %q must fail", junk)
		}
	}
}

func TestPasswordHash(t *testing.T) {
	h1, err := hashPassword("correct horse", testIter)
	if err != nil {
		t.Fatal(err)
	}
	h2, _ := hashPassword("correct horse", testIter)
	if h1 == h2 {
		t.Fatal("per-user salt: identical passwords must hash differently")
	}
	if !strings.HasPrefix(h1, "pbkdf2-sha256$1000$") || strings.Contains(h1, "correct") {
		t.Fatalf("unexpected format %q", h1)
	}
	if !verifyPassword("correct horse", h1) || !verifyPassword("correct horse", h2) {
		t.Fatal("correct password must verify")
	}
	for _, bad := range []string{"", "correct hors", "Correct horse", "correct horse "} {
		if verifyPassword(bad, h1) {
			t.Fatalf("%q must not verify", bad)
		}
	}
	for _, junk := range []string{"", "x", "pbkdf2-sha256$0$aa$bb", "pbkdf2-sha256$abc$aa$bb", "bcrypt$1$aa$bb", "pbkdf2-sha256$1000$!!$!!"} {
		if verifyPassword("correct horse", junk) {
			t.Fatalf("junk hash %q must not verify", junk)
		}
	}
	if DefaultPBKDF2Iterations < 100_000 {
		t.Fatal("default iterations must be >= 100k")
	}
}

func TestSignupAndLogin(t *testing.T) {
	e := newEnv(t, nil)
	r := e.signup("New@Example.com", "secret123", map[string]any{"role": "doctor", "full_name": "Dr New"})
	okStatus(t, "signup", r, 200)
	u := r.obj()["user"].(map[string]any)
	if !uuidRe.MatchString(u["id"].(string)) || u["email"] != "new@example.com" {
		t.Fatalf("user %v", u)
	}
	if r.str("access_token") == "" || r.str("refresh_token") == "" || r.obj()["expires_in"].(float64) != 3600 {
		t.Fatalf("session %s", r.raw)
	}
	claims, err := verifyJWT(e.db.secret, r.str("access_token"), time.Now())
	if err != nil || claims["sub"] != u["id"] || claims["email"] != "new@example.com" || claims["role"] != "authenticated" {
		t.Fatalf("claims %v %v", claims, err)
	}
	// the handle_new_user trigger created the profile
	p := e.svc("GET", "/rest/v1/profiles?id=eq."+u["id"].(string), nil, "").arr()
	if len(p) != 1 || p[0]["role"] != "doctor" || p[0]["full_name"] != "Dr New" || p[0]["is_approved"] != false {
		t.Fatalf("profile %v", p)
	}
	// duplicate (case-insensitive), weak, invalid email, missing password
	d := e.signup("NEW@example.com", "secret123", nil)
	if d.status != 422 || d.obj()["error_code"] != "user_already_exists" {
		t.Fatalf("dup %d %s", d.status, d.raw)
	}
	w := e.signup("weak@example.com", "123", nil)
	if w.status != 422 || w.obj()["error_code"] != "weak_password" {
		t.Fatalf("weak %d %s", w.status, w.raw)
	}
	if n := len(e.svc("GET", "/rest/v1/profiles?email=eq.weak@example.com", nil, "").arr()); n != 0 {
		t.Fatal("weak signup must create nothing")
	}
	if b := e.signup("not-an-email", "secret123", nil); b.status != 400 || b.obj()["error_code"] != "validation_failed" {
		t.Fatalf("bad email %d %s", b.status, b.raw)
	}
	if b := e.do(req{method: "POST", path: "/auth/v1/signup", body: map[string]any{"email": "x@y.com"}, apikey: e.anon()}); b.status != 400 {
		t.Fatalf("no password %d", b.status)
	}
	// login
	l := e.login("NEW@example.com", "secret123")
	okStatus(t, "login", l, 200)
	if l.str("access_token") == r.str("access_token") {
		t.Fatal("each login mints a new token")
	}
	bad := e.login("new@example.com", "wrong-pass")
	ghost := e.login("ghost@example.com", "secret123")
	if bad.status != 400 || bad.obj()["error_code"] != "invalid_credentials" || ghost.raw != bad.raw {
		t.Fatalf("bad %s vs ghost %s must be identical", bad.raw, ghost.raw)
	}
	// missing grant_type
	g := e.do(req{method: "POST", path: "/auth/v1/token", body: map[string]any{"email": "new@example.com", "password": "secret123"}, apikey: e.anon()})
	if g.status != 400 {
		t.Fatalf("no grant_type: %d", g.status)
	}
}

func TestSignupCannotEscalateRole(t *testing.T) {
	e := newEnv(t, nil)
	for i, role := range []string{"admin", "developer", "ADMIN", "superuser", ""} {
		r := e.signup(fmt.Sprintf("esc-%d@example.com", i), "secret123", map[string]any{"role": role})
		okStatus(t, "signup "+role, r, 200)
		id := r.obj()["user"].(map[string]any)["id"].(string)
		p := e.svc("GET", "/rest/v1/profiles?select=role&id=eq."+id, nil, "").arr()
		if len(p) != 1 || p[0]["role"] != "patient" {
			t.Errorf("metadata role %q produced profile %v (must be patient)", role, p)
		}
	}
}

func TestPasswordStoredHashedNotPlain(t *testing.T) {
	e := newEnv(t, nil)
	e.signup("h@example.com", "plain-secret-pw", nil)
	var h string
	if err := e.db.sql.QueryRow("SELECT pw_hash FROM users WHERE email='h@example.com'").Scan(&h); err != nil {
		t.Fatal(err)
	}
	if strings.Contains(h, "plain-secret-pw") || !strings.HasPrefix(h, "pbkdf2-sha256$") {
		t.Fatalf("stored hash %q", h)
	}
	// the dump hook / REST never expose users
	if r := e.svc("GET", "/rest/v1/users", nil, ""); r.status != 404 {
		t.Fatalf("users must not be a REST table: %d", r.status)
	}
}

func TestUserEndpoint(t *testing.T) {
	e := newEnv(t, nil)
	id, tok := e.user("u1@example.com")
	g := e.do(req{path: "/auth/v1/user", apikey: e.anon(), bearer: tok})
	if g.status != 200 || g.str("id") != id || g.str("email") != "u1@example.com" {
		t.Fatalf("get user %d %s", g.status, g.raw)
	}
	if r := e.do(req{path: "/auth/v1/user", apikey: e.anon()}); r.status != 401 {
		t.Fatalf("no token: %d", r.status)
	}
	if r := e.do(req{path: "/auth/v1/user", apikey: e.anon(), bearer: "garbage.token.value"}); r.status != 401 {
		t.Fatalf("garbage token: %d", r.status)
	}
	// the anon/service keys are not user tokens
	if r := e.do(req{path: "/auth/v1/user", apikey: e.anon(), bearer: e.service()}); r.status != 401 {
		t.Fatalf("service key as user token: %d", r.status)
	}
	// PUT /user: weak, same, ok
	if r := e.do(req{method: "PUT", path: "/auth/v1/user", apikey: e.anon(), bearer: tok, body: map[string]any{"password": "123"}}); r.status != 422 {
		t.Fatalf("weak put: %d", r.status)
	}
	if r := e.do(req{method: "PUT", path: "/auth/v1/user", apikey: e.anon(), bearer: tok, body: map[string]any{"password": "secret123"}}); r.status != 422 || r.obj()["error_code"] != "same_password" {
		t.Fatalf("same pw: %d %s", r.status, r.raw)
	}
	if r := e.do(req{method: "PUT", path: "/auth/v1/user", apikey: e.anon(), body: map[string]any{"password": "hijack12345"}}); r.status != 401 {
		t.Fatalf("PUT without token: %d", r.status)
	}
	if e.login("u1@example.com", "hijack12345").status == 200 {
		t.Fatal("unauthenticated PUT changed the password")
	}
	r := e.do(req{method: "PUT", path: "/auth/v1/user", apikey: e.anon(), bearer: tok, body: map[string]any{"password": "newsecret456", "data": map[string]any{"lang": "zh"}}})
	if r.status != 200 || r.obj()["user_metadata"].(map[string]any)["lang"] != "zh" {
		t.Fatalf("put: %d %s", r.status, r.raw)
	}
	if e.login("u1@example.com", "secret123").status != 400 || e.login("u1@example.com", "newsecret456").status != 200 {
		t.Fatal("old password must stop, new must work")
	}
}

func TestAPIKeyRequired(t *testing.T) {
	e := newEnv(t, nil)
	_, tok := e.user("k@example.com")
	cases := []struct {
		name string
		q    req
		want int
	}{
		{"no key at all", req{path: "/rest/v1/profiles"}, 401},
		{"bogus apikey", req{path: "/rest/v1/profiles", apikey: "nope"}, 401},
		{"user jwt without apikey", req{path: "/rest/v1/diagnosis_sessions", bearer: tok}, 401},
		{"auth without apikey", req{method: "POST", path: "/auth/v1/token?grant_type=password", body: map[string]any{"email": "a@b.co", "password": "x"}}, 401},
		{"service key as bearer only", req{path: "/rest/v1/profiles?select=id&limit=1", bearer: e.service()}, 200},
	}
	for _, c := range cases {
		if r := e.do(c.q); r.status != c.want {
			t.Errorf("%s: %d want %d (%s)", c.name, r.status, c.want, r.raw)
		}
	}
}

func TestExpiredTokenRejected(t *testing.T) {
	e := newEnv(t, nil)
	_, tok := e.user("x@example.com")
	e.db.now = func() time.Time { return time.Now().Add(2 * time.Hour) }
	g := e.do(req{path: "/auth/v1/user", apikey: e.anon(), bearer: tok})
	if g.status != 401 {
		t.Fatalf("expired token on /user: %d", g.status)
	}
	r := e.as(tok, "GET", "/rest/v1/diagnosis_sessions", nil, "")
	if r.status != 401 || r.obj()["code"] != "PGRST303" {
		t.Fatalf("expired token on REST: %d %s", r.status, r.raw)
	}
}

func TestDeletedUserTokenRejected(t *testing.T) {
	e := newEnv(t, nil)
	_, tok := e.user("gone@example.com")
	if _, err := e.db.sql.Exec("DELETE FROM users WHERE email='gone@example.com'"); err != nil {
		t.Fatal(err)
	}
	if r := e.do(req{path: "/auth/v1/user", apikey: e.anon(), bearer: tok}); r.status != 401 {
		t.Fatalf("token of a deleted user must be rejected: %d", r.status)
	}
}

func TestRefreshToken(t *testing.T) {
	e := newEnv(t, nil)
	s := e.signup("r@example.com", "secret123", nil)
	rt := s.str("refresh_token")
	r := e.do(req{method: "POST", path: "/auth/v1/token?grant_type=refresh_token", body: map[string]any{"refresh_token": rt}, apikey: e.anon()})
	if r.status != 200 || r.str("refresh_token") == rt || r.str("access_token") == "" {
		t.Fatalf("refresh: %d %s", r.status, r.raw)
	}
	again := e.do(req{method: "POST", path: "/auth/v1/token?grant_type=refresh_token", body: map[string]any{"refresh_token": rt}, apikey: e.anon()})
	if again.status != 400 {
		t.Fatalf("a refresh token is single-use: %d", again.status)
	}
	if x := e.do(req{method: "POST", path: "/auth/v1/token?grant_type=refresh_token", body: map[string]any{}, apikey: e.anon()}); x.status != 400 {
		t.Fatalf("empty refresh: %d", x.status)
	}
}

func TestRecoveryFlow(t *testing.T) {
	e := newEnv(t, func(o *Options) { o.TestHooks = true })
	e.signup("rec@example.com", "secret123", nil)
	// unknown email: 200 and no token; known: 200, empty body (no leak), link in the LOG only
	g := e.do(req{method: "POST", path: "/auth/v1/recover", body: map[string]any{"email": "ghost@example.com"}, apikey: e.anon()})
	if g.status != 200 || strings.TrimSpace(g.raw) != "{}" {
		t.Fatalf("ghost recover %d %s", g.status, g.raw)
	}
	if strings.Contains(e.logs.joined(), "ghost@example.com") {
		t.Fatal("no token may be minted for an unknown email")
	}
	k := e.do(req{method: "POST", path: "/auth/v1/recover?redirect_to=" + "http%3A%2F%2Fx%2Freset-password", body: map[string]any{"email": "REC@example.com"}, apikey: e.anon()})
	if k.status != 200 || strings.TrimSpace(k.raw) != "{}" {
		t.Fatalf("recover %d %s", k.status, k.raw)
	}
	th := e.do(req{path: "/__fake/recovery?email=rec@example.com"}).str("token_hash")
	if len(th) < 32 {
		t.Fatalf("token_hash %q", th)
	}
	if strings.Contains(k.raw, th) {
		t.Fatal("the recovery token must not appear in the HTTP response")
	}
	if !strings.Contains(e.logs.joined(), "http://x/reset-password?token_hash="+th+"&type=recovery") {
		t.Fatalf("the recovery link must be logged, got logs:\n%s", e.logs.joined())
	}
	// the DB stores only a hash of it
	var n int
	e.db.sql.QueryRow("SELECT count(*) FROM recoveries WHERE hash=?", th).Scan(&n)
	if n != 0 {
		t.Fatal("plaintext token stored")
	}
	bad := e.do(req{method: "POST", path: "/auth/v1/verify", body: map[string]any{"type": "recovery", "token_hash": "deadbeef"}, apikey: e.anon()})
	if bad.status != 400 || bad.obj()["error_code"] != "otp_expired" || bad.str("access_token") != "" {
		t.Fatalf("bad verify %d %s", bad.status, bad.raw)
	}
	if x := e.do(req{method: "POST", path: "/auth/v1/verify", body: map[string]any{"type": "recovery"}, apikey: e.anon()}); x.status != 400 {
		t.Fatalf("missing hash: %d", x.status)
	}
	v := e.do(req{method: "POST", path: "/auth/v1/verify", body: map[string]any{"type": "recovery", "token_hash": th}, apikey: e.anon()})
	if v.status != 200 || v.str("access_token") == "" {
		t.Fatalf("verify %d %s", v.status, v.raw)
	}
	if again := e.do(req{method: "POST", path: "/auth/v1/verify", body: map[string]any{"type": "recovery", "token_hash": th}, apikey: e.anon()}); again.status != 400 {
		t.Fatalf("single use: %d", again.status)
	}
	put := e.do(req{method: "PUT", path: "/auth/v1/user", apikey: e.anon(), bearer: v.str("access_token"), body: map[string]any{"password": "recovered789"}})
	if put.status != 200 || e.login("rec@example.com", "recovered789").status != 200 {
		t.Fatalf("reset end to end: %d", put.status)
	}
}

func TestRecoveryExpiryAndReplacement(t *testing.T) {
	e := newEnv(t, func(o *Options) { o.TestHooks = true })
	e.signup("exp@example.com", "secret123", nil)
	rec := func() string {
		e.do(req{method: "POST", path: "/auth/v1/recover", body: map[string]any{"email": "exp@example.com"}, apikey: e.anon()})
		return e.do(req{path: "/__fake/recovery?email=exp@example.com"}).str("token_hash")
	}
	first := rec()
	second := rec() // a newer request replaces the older token
	if first == second {
		t.Fatal("tokens must be fresh")
	}
	if e.do(req{method: "POST", path: "/auth/v1/verify", body: map[string]any{"type": "recovery", "token_hash": first}, apikey: e.anon()}).status != 400 {
		t.Fatal("older token must be dead after a new request")
	}
	e.db.now = func() time.Time { return time.Now().Add(2 * time.Hour) }
	if e.do(req{method: "POST", path: "/auth/v1/verify", body: map[string]any{"type": "recovery", "token_hash": second}, apikey: e.anon()}).status != 400 {
		t.Fatal("expired token must be rejected")
	}
}

func TestHooksOffByDefault(t *testing.T) {
	e := newEnv(t, nil)
	for _, p := range []string{"/__fake/health", "/__fake/table/profiles", "/__fake/recovery?email=a@b.co", "/__fake/schema"} {
		if r := e.do(req{path: p}); r.status != 404 {
			t.Errorf("%s must not exist without TestHooks: %d", p, r.status)
		}
	}
	if r := e.do(req{method: "POST", path: "/__fake/reset"}); r.status != 404 {
		t.Errorf("reset hook exposed: %d", r.status)
	}
}
