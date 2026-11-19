package localdb

import (
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"errors"
	"net/http"
	"net/url"
	"regexp"
	"strings"
	"time"
)

var emailRe = regexp.MustCompile(`^[^@\s]+@[^@\s]+\.[^@\s]+$`)

const (
	minPasswordLen = 6
	maxPasswordLen = 1024
)

type userRow struct {
	ID, Email, PWHash string
	Meta              map[string]any
	Created, Updated  string
}

func authErr(w http.ResponseWriter, status int, code, msg string) {
	writeJSON(w, status, map[string]any{"code": status, "error_code": code, "msg": msg})
}

func hashToken(tok string) string {
	h := sha256.Sum256([]byte(tok))
	return hex.EncodeToString(h[:])
}

func scanUser(row interface{ Scan(...any) error }) (*userRow, error) {
	var u userRow
	var meta string
	if err := row.Scan(&u.ID, &u.Email, &u.PWHash, &meta, &u.Created, &u.Updated); err != nil {
		return nil, err
	}
	u.Meta = map[string]any{}
	_ = json.Unmarshal([]byte(meta), &u.Meta)
	return &u, nil
}

const userCols = "id, email, pw_hash, meta, created_at, updated_at"

func (d *DB) userByEmail(q querier, email string) (*userRow, error) {
	return scanUser(q.QueryRow("SELECT "+userCols+" FROM users WHERE email=?", strings.ToLower(strings.TrimSpace(email))))
}

func (d *DB) userByID(q querier, id string) (*userRow, error) {
	return scanUser(q.QueryRow("SELECT "+userCols+" FROM users WHERE id=?", id))
}

func (u *userRow) json() map[string]any {
	meta := u.Meta
	if meta == nil {
		meta = map[string]any{}
	}
	return map[string]any{
		"id": u.ID, "aud": "authenticated", "role": "authenticated", "email": u.Email,
		"email_confirmed_at": u.Created, "confirmed_at": u.Created, "phone": "",
		"app_metadata":  map[string]any{"provider": "email", "providers": []string{"email"}},
		"user_metadata": meta, "identities": []any{}, "created_at": u.Created, "updated_at": u.Updated,
	}
}

// newSession mints an access token (HS256 JWT) and an opaque refresh token for u.
func (d *DB) newSession(q execer, u *userRow) (map[string]any, error) {
	now := d.now()
	exp := now.Add(accessTokenTTL)
	meta := u.Meta
	if meta == nil {
		meta = map[string]any{}
	}
	sid := newUUID()
	if _, err := q.Exec("INSERT INTO sessions(id,user_id,created_at) VALUES(?,?,?)", sid, u.ID, now.Unix()); err != nil {
		return nil, err
	}
	_, _ = q.Exec("DELETE FROM sessions WHERE created_at < ?", now.Add(-2*accessTokenTTL).Unix())
	access := signJWT(d.secret, map[string]any{
		"iss": "sihat-localdb/auth/v1", "aud": "authenticated", "sub": u.ID, "email": u.Email, "role": "authenticated",
		"iat": now.Unix(), "exp": exp.Unix(), "session_id": sid,
		"app_metadata": map[string]any{"provider": "email", "providers": []string{"email"}}, "user_metadata": meta,
	})
	refresh := randHex(24)
	if _, err := q.Exec("INSERT INTO refresh_tokens(hash,user_id,expires_at) VALUES(?,?,?)", hashToken(refresh), u.ID, now.Add(refreshTTL).Unix()); err != nil {
		return nil, err
	}
	// the app never refreshes sessions, so cap what repeated logins leave behind: drop expired tokens, keep a user's newest 10
	_, _ = q.Exec("DELETE FROM refresh_tokens WHERE expires_at < ?", now.Unix())
	_, _ = q.Exec("DELETE FROM refresh_tokens WHERE user_id=? AND rowid NOT IN (SELECT rowid FROM refresh_tokens WHERE user_id=? ORDER BY rowid DESC LIMIT 10)", u.ID, u.ID)
	return map[string]any{
		"access_token": access, "token_type": "bearer", "expires_in": int(accessTokenTTL.Seconds()), "expires_at": exp.Unix(),
		"refresh_token": refresh, "user": u.json(),
	}, nil
}

// createUser inserts the auth user and its profile row (the handle_new_user trigger). profile carries extra
// profile columns (seed use); the role is validated by the table check.
func (d *DB) createUser(tx *sql.Tx, email, hash string, meta map[string]any, profile map[string]any) (*userRow, error) {
	now := nowTS()
	u := &userRow{ID: newUUID(), Email: strings.ToLower(strings.TrimSpace(email)), PWHash: hash, Meta: meta, Created: now, Updated: now}
	if u.Meta == nil {
		u.Meta = map[string]any{}
	}
	mb, _ := json.Marshal(u.Meta)
	if _, err := tx.Exec("INSERT INTO users(id,email,pw_hash,meta,created_at,updated_at) VALUES(?,?,?,?,?,?)", u.ID, u.Email, hash, string(mb), now, now); err != nil {
		return nil, err
	}
	// handle_new_user(): only 'doctor' is honoured from client-supplied metadata; anything else becomes 'patient'.
	r := strings.ToLower(asTextOr(u.Meta["role"], "patient"))
	if r != "patient" && r != "doctor" {
		r = "patient"
	}
	name := strings.TrimSpace(asTextOr(u.Meta["full_name"], ""))
	if name == "" {
		name = strings.TrimSpace(asTextOr(u.Meta["name"], ""))
	}
	if name == "" {
		name, _, _ = strings.Cut(u.Email, "@")
	}
	row := map[string]any{"id": u.ID, "email": u.Email, "full_name": name, "role": r}
	for k, v := range profile {
		row[k] = v
	}
	if _, perr := d.insertOne(tx, tables["profiles"], row, insertOpts{}); perr != nil {
		return nil, perr
	}
	return u, nil
}

func asTextOr(v any, def string) string {
	if s, ok := v.(string); ok {
		return s
	}
	return def
}

func (d *DB) handleAuth(w http.ResponseWriter, r *http.Request) {
	id, herr := d.identify(r)
	if herr != nil {
		writeJSON(w, herr.status, herr.body)
		return
	}
	switch strings.TrimPrefix(r.URL.Path, "/auth/v1/") {
	case "health":
		writeJSON(w, 200, map[string]any{"name": "GoTrue", "description": "sihat-tcm localdb"})
	case "signup":
		if r.Method == http.MethodPost {
			d.authSignup(w, r)
			return
		}
		authErr(w, 405, "method_not_allowed", "method not allowed")
	case "token":
		if r.Method == http.MethodPost {
			d.authToken(w, r)
			return
		}
		authErr(w, 405, "method_not_allowed", "method not allowed")
	case "user":
		switch r.Method {
		case http.MethodGet, http.MethodPut:
			d.authUser(w, r, id)
		default:
			authErr(w, 405, "method_not_allowed", "method not allowed")
		}
	case "recover":
		if r.Method == http.MethodPost {
			d.authRecover(w, r)
			return
		}
		authErr(w, 405, "method_not_allowed", "method not allowed")
	case "verify":
		if r.Method == http.MethodPost {
			d.authVerify(w, r)
			return
		}
		authErr(w, 405, "method_not_allowed", "method not allowed")
	default:
		authErr(w, 404, "not_found", "localdb: no auth route "+r.Method+" "+r.URL.Path)
	}
}

func bodyMap(r *http.Request) (map[string]any, bool) {
	v, ok := readJSONBody(r)
	if !ok {
		return nil, false
	}
	m, ok := v.(map[string]any)
	return m, ok
}

func str(m map[string]any, k string) string {
	s, _ := m[k].(string)
	return s
}

func (d *DB) authSignup(w http.ResponseWriter, r *http.Request) {
	b, ok := bodyMap(r)
	if !ok || str(b, "email") == "" || str(b, "password") == "" {
		authErr(w, 400, "validation_failed", "email and password required")
		return
	}
	pw := str(b, "password")
	if len(pw) < minPasswordLen {
		authErr(w, 422, "weak_password", "Password should be at least 6 characters.")
		return
	}
	if len(pw) > maxPasswordLen {
		authErr(w, 422, "weak_password", "Password is too long.")
		return
	}
	email := strings.ToLower(strings.TrimSpace(str(b, "email")))
	if !emailRe.MatchString(email) || len(email) > 254 {
		authErr(w, 400, "validation_failed", "Unable to validate email address: invalid format")
		return
	}
	meta, _ := b["data"].(map[string]any)
	hash, herr := hashPassword(pw, d.opt.PBKDF2Iter) // PBKDF2 runs before the writer lock is taken
	if herr != nil {
		authErr(w, 500, "unexpected_failure", "could not hash password")
		return
	}
	var sess map[string]any
	err := d.inTx(func(tx *sql.Tx) error {
		var n int
		if err := tx.QueryRow("SELECT count(*) FROM users WHERE email=?", email).Scan(&n); err != nil {
			return err
		}
		if n > 0 {
			return errUserExists
		}
		u, err := d.createUser(tx, email, hash, meta, nil)
		if err != nil {
			return err
		}
		sess, err = d.newSession(tx, u)
		return err
	})
	switch {
	case errors.Is(err, errUserExists):
		authErr(w, 422, "user_already_exists", "User already registered")
	case err != nil:
		d.opt.Logf("localdb: signup: %v", err)
		authErr(w, 500, "unexpected_failure", "Database error saving new user")
	default:
		writeJSON(w, 200, sess)
	}
}

var errUserExists = errors.New("user exists")

func (d *DB) authToken(w http.ResponseWriter, r *http.Request) {
	b, ok := bodyMap(r)
	if !ok {
		authErr(w, 400, "bad_json", "Could not parse request body as JSON")
		return
	}
	switch r.URL.Query().Get("grant_type") {
	case "password":
		email, pw := str(b, "email"), str(b, "password")
		u, err := d.userByEmail(d.sql, email)
		if err != nil {
			verifyPassword(pw, d.dummyHash) // equalise timing so unknown emails are indistinguishable
			authErr(w, 400, "invalid_credentials", "Invalid login credentials")
			return
		}
		if !verifyPassword(pw, u.PWHash) {
			authErr(w, 400, "invalid_credentials", "Invalid login credentials")
			return
		}
		var sess map[string]any
		if err := d.inTx(func(tx *sql.Tx) (e error) { sess, e = d.newSession(tx, u); return }); err != nil {
			authErr(w, 500, "unexpected_failure", "could not create session")
			return
		}
		writeJSON(w, 200, sess)
	case "refresh_token":
		rt := str(b, "refresh_token")
		var sess map[string]any
		err := d.inTx(func(tx *sql.Tx) error {
			var uid string
			var exp int64
			if err := tx.QueryRow("SELECT user_id, expires_at FROM refresh_tokens WHERE hash=?", hashToken(rt)).Scan(&uid, &exp); err != nil {
				return errBadRefresh
			}
			if _, err := tx.Exec("DELETE FROM refresh_tokens WHERE hash=?", hashToken(rt)); err != nil {
				return err
			}
			if d.now().Unix() >= exp {
				return errBadRefresh
			}
			u, err := d.userByID(tx, uid)
			if err != nil {
				return errBadRefresh
			}
			sess, err = d.newSession(tx, u)
			return err
		})
		if errors.Is(err, errBadRefresh) || rt == "" {
			authErr(w, 400, "refresh_token_not_found", "Invalid Refresh Token: Refresh Token Not Found")
			return
		}
		if err != nil {
			authErr(w, 500, "unexpected_failure", "could not refresh session")
			return
		}
		writeJSON(w, 200, sess)
	default:
		authErr(w, 400, "validation_failed", "unsupported grant_type: only password and refresh_token are available")
	}
}

var errBadRefresh = errors.New("bad refresh token")

func (d *DB) authUser(w http.ResponseWriter, r *http.Request, id *identity) {
	if id.role != roleAuth {
		authErr(w, 401, "bad_jwt", "invalid JWT: a user access token is required")
		return
	}
	u, err := d.userByID(d.sql, id.uid)
	if err != nil {
		authErr(w, 401, "bad_jwt", "User from sub claim in JWT does not exist")
		return
	}
	if r.Method == http.MethodGet {
		writeJSON(w, 200, u.json())
		return
	}
	b, ok := bodyMap(r)
	if !ok {
		authErr(w, 400, "bad_json", "Could not parse request body as JSON")
		return
	}
	pw := str(b, "password")
	if _, has := b["password"]; has {
		if len(pw) < minPasswordLen {
			authErr(w, 422, "weak_password", "Password should be at least 6 characters.")
			return
		}
		if len(pw) > maxPasswordLen {
			authErr(w, 422, "weak_password", "Password is too long.")
			return
		}
		if verifyPassword(pw, u.PWHash) {
			authErr(w, 422, "same_password", "New password should be different from the old password.")
			return
		}
	}
	err = d.inTx(func(tx *sql.Tx) error {
		now := nowTS()
		if _, has := b["password"]; has {
			h, err := hashPassword(pw, d.opt.PBKDF2Iter)
			if err != nil {
				return err
			}
			if _, err := tx.Exec("UPDATE users SET pw_hash=?, updated_at=? WHERE id=?", h, now, u.ID); err != nil {
				return err
			}
			// a password change ends every other refresh session
			if _, err := tx.Exec("DELETE FROM refresh_tokens WHERE user_id=?", u.ID); err != nil {
				return err
			}
			// ...and every other access token (the caller's own session stays, as in GoTrue)
			keep, _ := id.claims["session_id"].(string)
			if _, err := tx.Exec("DELETE FROM sessions WHERE user_id=? AND id<>?", u.ID, keep); err != nil {
				return err
			}
		}
		if data, ok := b["data"].(map[string]any); ok {
			for k, v := range data {
				u.Meta[k] = v
			}
			mb, _ := json.Marshal(u.Meta)
			if _, err := tx.Exec("UPDATE users SET meta=?, updated_at=? WHERE id=?", string(mb), now, u.ID); err != nil {
				return err
			}
		}
		return nil
	})
	if err != nil {
		authErr(w, 500, "unexpected_failure", "could not update user")
		return
	}
	u2, err := d.userByID(d.sql, u.ID)
	if err != nil {
		authErr(w, 500, "unexpected_failure", "could not reload user")
		return
	}
	writeJSON(w, 200, u2.json())
}

func (d *DB) authRecover(w http.ResponseWriter, r *http.Request) {
	b, _ := bodyMap(r)
	email := strings.ToLower(strings.TrimSpace(str(b, "email")))
	redirect := r.URL.Query().Get("redirect_to")
	if email != "" {
		if u, err := d.userByEmail(d.sql, email); err == nil {
			tok := randHex(24)
			err := d.inTx(func(tx *sql.Tx) error {
				_, _ = tx.Exec("DELETE FROM recoveries WHERE expires_at < ?", d.now().Unix())
				if _, err := tx.Exec("DELETE FROM recoveries WHERE user_id=?", u.ID); err != nil {
					return err
				}
				_, err := tx.Exec("INSERT INTO recoveries(hash,user_id,expires_at) VALUES(?,?,?)", hashToken(tok), u.ID, d.now().Add(recoveryTTL).Unix())
				return err
			})
			if err != nil {
				d.opt.Logf("localdb: recover: %v", err)
			} else {
				// There is no mail server: the operator relays this link. It never appears in any HTTP response.
				d.opt.Logf("localdb: PASSWORD RECOVERY LINK for %s (valid 1h, single use): %s", u.Email, recoveryLink(redirect, tok))
				if d.opt.TestHooks {
					d.recMu.Lock()
					d.recovery[u.Email] = tok
					d.recMu.Unlock()
				}
			}
		}
	}
	writeJSON(w, 200, map[string]any{})
}

func recoveryLink(redirect, tok string) string {
	if redirect == "" {
		return "?token_hash=" + url.QueryEscape(tok) + "&type=recovery (no redirect_to given)"
	}
	sep := "?"
	if strings.Contains(redirect, "?") {
		sep = "&"
	}
	return redirect + sep + "token_hash=" + url.QueryEscape(tok) + "&type=recovery"
}

func (d *DB) authVerify(w http.ResponseWriter, r *http.Request) {
	b, ok := bodyMap(r)
	th := str(b, "token_hash")
	if !ok || th == "" {
		authErr(w, 400, "validation_failed", "token_hash is required")
		return
	}
	if t := str(b, "type"); t != "recovery" {
		authErr(w, 400, "validation_failed", "only type=recovery is supported")
		return
	}
	var sess map[string]any
	err := d.inTx(func(tx *sql.Tx) error {
		var uid string
		var exp int64
		h := hashToken(th)
		if err := tx.QueryRow("SELECT user_id, expires_at FROM recoveries WHERE hash=?", h).Scan(&uid, &exp); err != nil {
			return errOTP
		}
		if _, err := tx.Exec("DELETE FROM recoveries WHERE hash=?", h); err != nil { // single use, even when expired
			return err
		}
		if d.now().Unix() >= exp {
			return errOTP
		}
		u, err := d.userByID(tx, uid)
		if err != nil {
			return errOTP
		}
		sess, err = d.newSession(tx, u)
		return err
	})
	switch {
	case errors.Is(err, errOTP):
		authErr(w, 400, "otp_expired", "Email link is invalid or has expired")
	case err != nil:
		authErr(w, 500, "unexpected_failure", "could not verify")
	default:
		writeJSON(w, 200, sess)
	}
}

var errOTP = errors.New("otp expired")

var _ = time.Second
