// Package localdb is a SQLite-backed stand-in for the subset of Supabase the Sihat TCM app uses:
// GoTrue password auth (/auth/v1/*) and PostgREST (/rest/v1/<table>), served over plain HTTP so the
// app's supabase.Client works against it unchanged. Switching back to Supabase is a pure env change.
//
// Real security properties: PBKDF2-SHA256 password hashes, HS256 JWTs with enforced expiry, apikey /
// Authorization checks, and the owner-based Row-Level-Security policies of db/schema.sql.
package localdb

import (
	"context"
	"crypto/rand"
	"crypto/subtle"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	_ "modernc.org/sqlite" // pure-Go driver: CGO_ENABLED=0 builds keep working
)

// Options configures a DB.
type Options struct {
	Path          string // SQLite file
	JWTSecret     string // LOCAL_JWT_SECRET; empty = generated once and persisted in the meta table
	AnonKey       string // LOCAL_ANON_KEY; empty = generated+persisted
	ServiceKey    string // LOCAL_SERVICE_KEY; empty = generated+persisted
	PBKDF2Iter    int    // 0 = DefaultPBKDF2Iterations
	SeedDemo      bool   // demo accounts + demo doctors on first start
	NoRichDemo    bool   // SeedDemo seeds only the 4 accounts + 6 doctors (unit tests that need a tiny database)
	TestHooks     bool   // expose /__fake/* (health, reset, table dump, recovery token, schema) - TESTS ONLY
	ScratchTables bool   // schemaless unknown tables (contract suite) - TESTS ONLY
	Logf          func(format string, args ...any)
}

// DB is the SQLite store plus the HTTP behaviour.
type DB struct {
	sql        *sql.DB
	mu         sync.Mutex // serialises writers (SQLite has one writer anyway; this also makes read-modify-write atomic)
	opt        Options
	secret     []byte
	anonKey    string
	serviceKey string
	dummyHash  string
	now        func() time.Time

	recMu    sync.Mutex
	recovery map[string]string // test hooks only: email -> last plaintext token_hash
}

const (
	accessTokenTTL = time.Hour
	recoveryTTL    = time.Hour
	refreshTTL     = 30 * 24 * time.Hour
)

const ddl = `
CREATE TABLE IF NOT EXISTS meta(k TEXT PRIMARY KEY, v TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS users(
  id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, pw_hash TEXT NOT NULL,
  meta TEXT NOT NULL DEFAULT '{}', created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS refresh_tokens(
  hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS sessions(
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, created_at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS sessions_user ON sessions(user_id);
CREATE TABLE IF NOT EXISTS recoveries(
  hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS seq(tbl TEXT PRIMARY KEY, n INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS docs(
  seqno INTEGER PRIMARY KEY AUTOINCREMENT, tbl TEXT NOT NULL, id TEXT NOT NULL, doc TEXT NOT NULL, UNIQUE(tbl, id));
CREATE INDEX IF NOT EXISTS docs_user_id ON docs(tbl, json_extract(doc, '$.user_id'));
CREATE INDEX IF NOT EXISTS docs_doctor_id ON docs(tbl, json_extract(doc, '$.doctor_id'));
CREATE INDEX IF NOT EXISTS docs_email ON docs(tbl, lower(json_extract(doc, '$.email')));
CREATE INDEX IF NOT EXISTS refresh_user ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS refresh_exp ON refresh_tokens(expires_at);
`

// Open opens (creating if needed) the database file, loads or creates the secrets, and seeds on first start.
func Open(opt Options) (*DB, error) {
	if opt.Path == "" {
		return nil, errors.New("localdb: Path is required")
	}
	if opt.PBKDF2Iter <= 0 {
		opt.PBKDF2Iter = DefaultPBKDF2Iterations
	}
	if opt.Logf == nil {
		opt.Logf = log.Printf
	}
	if dir := filepath.Dir(opt.Path); dir != "" && dir != "." {
		if err := mkdirAll(dir); err != nil {
			return nil, fmt.Errorf("localdb: create dir: %w", err)
		}
	}
	// the file holds the JWT secret and API keys: owner-only (SQLite gives -wal/-shm the same mode)
	if f, err := os.OpenFile(opt.Path, os.O_CREATE|os.O_RDWR, 0o600); err == nil {
		f.Close()
	}
	dsn := "file:" + filepath.ToSlash(opt.Path) + "?_pragma=busy_timeout(10000)&_pragma=journal_mode(WAL)&_pragma=synchronous(NORMAL)&_pragma=foreign_keys(ON)"
	sdb, err := sql.Open("sqlite", dsn)
	if err != nil {
		return nil, err
	}
	sdb.SetMaxOpenConns(8)
	d := &DB{sql: sdb, opt: opt, now: time.Now, recovery: map[string]string{}}
	if _, err := sdb.Exec(ddl); err != nil {
		sdb.Close()
		return nil, fmt.Errorf("localdb: init schema: %w", err)
	}
	if err := d.loadSecrets(); err != nil {
		sdb.Close()
		return nil, err
	}
	d.dummyHash, err = hashPassword("dummy-password-for-timing", opt.PBKDF2Iter)
	if err != nil {
		sdb.Close()
		return nil, err
	}
	if err := d.seed(); err != nil {
		sdb.Close()
		return nil, fmt.Errorf("localdb: seed: %w", err)
	}
	return d, nil
}

// Close checkpoints the WAL and closes the file.
func (d *DB) Close() error {
	d.mu.Lock()
	defer d.mu.Unlock()
	_, _ = d.sql.Exec("PRAGMA wal_checkpoint(TRUNCATE)")
	return d.sql.Close()
}

// Keys returns the anon and service-role API keys (SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY equivalents).
func (d *DB) Keys() (anon, service string) { return d.anonKey, d.serviceKey }

func randHex(n int) string {
	b := make([]byte, n)
	if _, err := rand.Read(b); err != nil {
		panic(err)
	}
	return hex.EncodeToString(b)
}

func (d *DB) metaGet(k string) (string, bool) {
	var v string
	if err := d.sql.QueryRow("SELECT v FROM meta WHERE k=?", k).Scan(&v); err != nil {
		return "", false
	}
	return v, true
}

func (d *DB) metaSet(q execer, k, v string) error {
	_, err := q.Exec("INSERT INTO meta(k,v) VALUES(?,?) ON CONFLICT(k) DO UPDATE SET v=excluded.v", k, v)
	return err
}

// secretOr returns the explicit option when set, else the persisted value, else a new random one (persisted).
func (d *DB) secretOr(explicit, metaKey string, gen func() string) (string, error) {
	if explicit != "" {
		return explicit, nil
	}
	if v, ok := d.metaGet(metaKey); ok && v != "" {
		return v, nil
	}
	v := gen()
	if err := d.metaSet(d.sql, metaKey, v); err != nil {
		return "", err
	}
	return v, nil
}

func (d *DB) loadSecrets() error {
	js, err := d.secretOr(d.opt.JWTSecret, "jwt_secret", func() string { return randHex(32) })
	if err != nil {
		return err
	}
	d.secret = []byte(js)
	far := d.now().AddDate(10, 0, 0).Unix()
	d.anonKey, err = d.secretOr(d.opt.AnonKey, "anon_key", func() string {
		return signJWT(d.secret, map[string]any{"iss": "sihat-localdb", "role": "anon", "iat": d.now().Unix(), "exp": far})
	})
	if err != nil {
		return err
	}
	d.serviceKey, err = d.secretOr(d.opt.ServiceKey, "service_key", func() string {
		return signJWT(d.secret, map[string]any{"iss": "sihat-localdb", "role": "service_role", "iat": d.now().Unix(), "exp": far})
	})
	return err
}

// ------------------------------------------------------------------ plumbing

type execer interface {
	Exec(query string, args ...any) (sql.Result, error)
}

type querier interface {
	Query(query string, args ...any) (*sql.Rows, error)
	QueryRow(query string, args ...any) *sql.Row
	Exec(query string, args ...any) (sql.Result, error)
}

// inTx runs fn in a write transaction under the writer mutex; an error rolls back.
func (d *DB) inTx(fn func(tx *sql.Tx) error) error {
	d.mu.Lock()
	defer d.mu.Unlock()
	tx, err := d.sql.Begin()
	if err != nil {
		return err
	}
	if err := fn(tx); err != nil {
		_ = tx.Rollback()
		return err
	}
	return tx.Commit()
}

func ctEq(a, b string) bool { return subtle.ConstantTimeCompare([]byte(a), []byte(b)) == 1 }

// ------------------------------------------------------------------ identity

type role string

const (
	roleAnon    role = "anon"
	roleAuth    role = "authenticated"
	roleService role = "service_role"
)

type identity struct {
	role   role
	uid    string
	claims map[string]any
}

type httpErr struct {
	status int
	body   map[string]any
}

// identify resolves the caller from the apikey and Authorization headers the way Supabase's gateway + PostgREST do.
// rest=true uses PostgREST error shapes; false uses GoTrue's.
func (d *DB) identify(r *http.Request) (*identity, *httpErr) {
	apikey := strings.TrimSpace(r.Header.Get("apikey"))
	bearer := ""
	if h := r.Header.Get("Authorization"); len(h) > 7 && strings.EqualFold(h[:7], "bearer ") {
		bearer = strings.TrimSpace(h[7:])
	}
	keyRole := func(k string) role {
		switch {
		case k == "":
			return ""
		case ctEq(k, d.serviceKey):
			return roleService
		case ctEq(k, d.anonKey):
			return roleAnon
		}
		return ""
	}
	if apikey == "" && (bearer == "" || keyRole(bearer) == "") {
		return nil, &httpErr{401, map[string]any{"message": "No API key found in request", "hint": "No `apikey` request header or url param was found."}}
	}
	if apikey != "" && keyRole(apikey) == "" {
		return nil, &httpErr{401, map[string]any{"message": "Invalid API key", "hint": "Double check your Supabase `anon` or `service_role` API key."}}
	}
	if bearer == "" {
		return &identity{role: keyRole(apikey)}, nil
	}
	if kr := keyRole(bearer); kr != "" {
		return &identity{role: kr}, nil
	}
	claims, err := verifyJWT(d.secret, bearer, d.now())
	if err != nil {
		code := "PGRST301"
		if errors.Is(err, errJWTExpired) {
			code = "PGRST303"
		}
		return nil, &httpErr{401, map[string]any{"code": code, "details": nil, "hint": nil, "message": err.Error()}}
	}
	sub, _ := claims["sub"].(string)
	if sub == "" || claims["role"] != "authenticated" {
		// service/anon-role JWTs minted elsewhere are not accepted: only keys we hold.
		return nil, &httpErr{401, map[string]any{"code": "PGRST301", "details": nil, "hint": nil, "message": "invalid JWT: unsupported role or subject"}}
	}
	// a password change/reset deletes the user's other session rows, which ends the access tokens minted for them
	if sid, _ := claims["session_id"].(string); sid != "" {
		var n int
		if err := d.sql.QueryRow("SELECT count(*) FROM sessions WHERE id=? AND user_id=?", sid, sub).Scan(&n); err != nil || n == 0 {
			return nil, &httpErr{401, map[string]any{"code": "PGRST301", "details": nil, "hint": nil, "message": "invalid JWT: session has ended"}}
		}
	}
	return &identity{role: roleAuth, uid: sub, claims: claims}, nil
}

// ------------------------------------------------------------------ HTTP

// Handler returns the HTTP handler (GoTrue + PostgREST subset, plus /__fake/* when Options.TestHooks).
func (d *DB) Handler() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("/auth/v1/", d.handleAuth)
	mux.HandleFunc("/rest/v1/", d.handleREST)
	mux.HandleFunc("/rest/v1", d.handleREST)
	if d.opt.TestHooks {
		mux.HandleFunc("/__fake/", d.handleHooks)
	}
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, 404, map[string]any{"message": "localdb: no route " + r.Method + " " + r.URL.Path})
	})
	return http.MaxBytesHandler(mux, 10<<20)
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	if v == nil {
		return
	}
	enc := json.NewEncoder(w)
	enc.SetEscapeHTML(false)
	_ = enc.Encode(v)
}

func readJSONBody(r *http.Request) (any, bool) {
	var v any
	dec := json.NewDecoder(r.Body)
	if err := dec.Decode(&v); err != nil {
		return nil, false
	}
	if dec.More() {
		return nil, false
	}
	return v, true
}

// Running is a started in-process listener.
type Running struct {
	URL      string
	Addr     string
	DB       *DB
	srv      *http.Server
	listener net.Listener
}

// Serve starts the handler on addr (e.g. "127.0.0.1:0"). The returned URL is what SUPABASE_URL should be.
func (d *DB) Serve(addr string) (*Running, error) {
	ln, err := net.Listen("tcp", addr)
	if err != nil {
		return nil, err
	}
	srv := &http.Server{Handler: d.Handler(), ReadHeaderTimeout: 10 * time.Second, ReadTimeout: 60 * time.Second, WriteTimeout: 120 * time.Second}
	go func() {
		if err := srv.Serve(ln); err != nil && !errors.Is(err, http.ErrServerClosed) {
			d.opt.Logf("localdb: serve: %v", err)
		}
	}()
	host, port, _ := net.SplitHostPort(ln.Addr().String())
	if host == "" || host == "::" || host == "0.0.0.0" {
		host = "127.0.0.1"
	}
	u := url.URL{Scheme: "http", Host: net.JoinHostPort(host, port)}
	return &Running{URL: u.String(), Addr: ln.Addr().String(), DB: d, srv: srv, listener: ln}, nil
}

// Close stops the listener and closes the database.
func (r *Running) Close() error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_ = r.srv.Shutdown(ctx)
	return r.DB.Close()
}

// ------------------------------------------------------------------ test hooks

func (d *DB) handleHooks(w http.ResponseWriter, r *http.Request) {
	p := strings.TrimPrefix(r.URL.Path, "/__fake/")
	switch {
	case p == "health":
		var n int
		_ = d.sql.QueryRow("SELECT count(*) FROM users").Scan(&n)
		writeJSON(w, 200, map[string]any{"ok": true, "fake": "localdb", "backend": "sqlite", "users": n})
	case p == "reset" && r.Method == http.MethodPost:
		if err := d.reset(); err != nil {
			writeJSON(w, 500, map[string]any{"message": err.Error()})
			return
		}
		writeJSON(w, 200, map[string]any{"ok": true})
	case strings.HasPrefix(p, "table/"):
		name, _ := url.PathUnescape(strings.TrimPrefix(p, "table/"))
		rows, err := d.loadRows(d.sql, name, "")
		if err != nil {
			writeJSON(w, 500, map[string]any{"message": err.Error()})
			return
		}
		writeJSON(w, 200, rows)
	case p == "recovery":
		d.recMu.Lock()
		th, ok := d.recovery[strings.ToLower(r.URL.Query().Get("email"))]
		d.recMu.Unlock()
		if !ok {
			writeJSON(w, 200, map[string]any{"token_hash": nil})
			return
		}
		writeJSON(w, 200, map[string]any{"token_hash": th})
	case p == "schema":
		writeJSON(w, 200, d.schemaInfo())
	default:
		writeJSON(w, 404, map[string]any{"message": "localdb: no hook " + p})
	}
}

// schemaInfo describes the typed tables (contract suite uses it to build valid rows).
func (d *DB) schemaInfo() map[string]any {
	out := map[string]any{}
	for name, t := range tables {
		req := []string{}
		cols := []string{}
		for _, c := range t.cols {
			cols = append(cols, c.name)
			if c.notNull && c.def == "" {
				req = append(req, c.name)
			}
		}
		out[name] = map[string]any{"id": t.idKind(), "required": req, "columns": cols, "grant": t.grant, "owner": t.owner}
	}
	return map[string]any{"tables": out, "scratch": d.opt.ScratchTables}
}

// reset wipes all data (keeping the secrets) and re-seeds. Test hooks only.
func (d *DB) reset() error {
	err := d.inTx(func(tx *sql.Tx) error {
		for _, q := range []string{"DELETE FROM docs", "DELETE FROM refresh_tokens", "DELETE FROM sessions", "DELETE FROM recoveries", "DELETE FROM users", "DELETE FROM seq", "DELETE FROM meta WHERE k LIKE 'seeded_%'"} {
			if _, err := tx.Exec(q); err != nil {
				return err
			}
		}
		return nil
	})
	if err != nil {
		return err
	}
	d.recMu.Lock()
	d.recovery = map[string]string{}
	d.recMu.Unlock()
	return d.seed()
}
