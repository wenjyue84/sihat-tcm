package server

// Shared hardening helpers (bug-hunt fixes): keyed locks for read-modify-write sections, text/e-mail sanity,
// token revocation, database-outage classification, the per-account login throttle, JSON shape helpers and
// the media/JSON salvage helpers used by the AI handlers.

import (
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"hash/fnv"
	"io"
	"math"
	"regexp"
	"strconv"
	"strings"
	"sync"
	"time"
	"unicode"
	"unicode/utf8"
)

// ---------------------------------------------------------------------------------------------------------------
// keyed locks
// ---------------------------------------------------------------------------------------------------------------

// The app runs as ONE process in front of ONE database, so a striped in-process mutex is what makes the
// select-then-update sections (thread messages, guest-token claim, device/preferences upsert, sync dedupe) atomic.
// Two different keys may share a stripe (harmless). Never hold two stripes at once: callers take exactly one lock.
const lockStripes = 256

var keyLocks [lockStripes]sync.Mutex

// lockKey locks the stripe for key and returns the unlock function.
func lockKey(key string) func() {
	h := fnv.New32a()
	_, _ = h.Write([]byte(key))
	m := &keyLocks[h.Sum32()%lockStripes]
	m.Lock()
	return m.Unlock
}

// ---------------------------------------------------------------------------------------------------------------
// text / e-mail sanity
// ---------------------------------------------------------------------------------------------------------------

// invisibleOrBidi reports invisible formatting characters that make look-alike text: zero-width space/marks, the
// bidi embedding/override/isolate controls (U+202E reverses the text around it), word joiners and the BOM.
func invisibleOrBidi(r rune) bool {
	switch {
	case r == 0x200B, r == 0x200E, r == 0x200F, r == 0x061C, r == 0xFEFF:
		return true
	case r >= 0x202A && r <= 0x202E:
		return true
	case r >= 0x2060 && r <= 0x2064:
		return true
	case r >= 0x2066 && r <= 0x2069:
		return true
	}
	return false
}

// hasUnsafeRunes reports control characters (NUL, DEL, C1 ...) and invisible/bidi formatting characters. Newlines
// and tabs are tolerated only when allowNewline is set (free-text fields such as a bio).
func hasUnsafeRunes(s string, allowNewline bool) bool {
	if !utf8.ValidString(s) {
		return true
	}
	for _, r := range s {
		switch {
		case r == '\n' || r == '\r' || r == '\t':
			if !allowNewline {
				return true
			}
		case unicode.IsControl(r), invisibleOrBidi(r):
			return true
		}
	}
	return false
}

// validEmail is a strict, ASCII-only syntax check. The address is the account identity, so invisible,
// control, HTML and look-alike (non-ASCII) characters are refused instead of creating twin accounts.
func validEmail(e string) bool {
	if e == "" || len(e) > maxEmailLen {
		return false
	}
	at := strings.LastIndexByte(e, '@')
	if at < 1 || at == len(e)-1 {
		return false
	}
	local, domain := e[:at], e[at+1:]
	if len(local) > 64 || strings.ContainsRune(local, '@') {
		return false
	}
	if local[0] == '.' || local[len(local)-1] == '.' || strings.Contains(local, "..") {
		return false
	}
	for i := 0; i < len(local); i++ {
		c := local[i]
		switch {
		case c >= 'a' && c <= 'z', c >= 'A' && c <= 'Z', c >= '0' && c <= '9':
		case strings.IndexByte(".!#$%&'*+/=?^_`{|}~-", c) >= 0:
		default:
			return false
		}
	}
	if len(domain) > 253 {
		return false
	}
	for _, label := range strings.Split(domain, ".") {
		if label == "" || len(label) > 63 || label[0] == '-' || label[len(label)-1] == '-' {
			return false
		}
		for i := 0; i < len(label); i++ {
			c := label[i]
			if !(c >= 'a' && c <= 'z' || c >= 'A' && c <= 'Z' || c >= '0' && c <= '9' || c == '-') {
				return false
			}
		}
	}
	return true
}

// ---------------------------------------------------------------------------------------------------------------
// JWT payload helpers (NO signature check: the identity provider still validates every token it is given)
// ---------------------------------------------------------------------------------------------------------------

func jwtClaims(token string) map[string]any {
	parts := strings.Split(token, ".")
	if len(parts) != 3 {
		return nil
	}
	raw, err := base64.RawURLEncoding.DecodeString(strings.TrimRight(parts[1], "="))
	if err != nil {
		return nil
	}
	var m map[string]any
	if json.Unmarshal(raw, &m) != nil {
		return nil
	}
	return m
}

// jwtHasAMR reports whether the token's amr claim lists one of the given authentication methods.
func jwtHasAMR(token string, methods ...string) bool {
	c := jwtClaims(token)
	if c == nil {
		return false
	}
	list, _ := c["amr"].([]any)
	for _, e := range list {
		var m string
		switch x := e.(type) {
		case map[string]any:
			m, _ = x["method"].(string)
		case string:
			m = x
		}
		for _, want := range methods {
			if m == want {
				return true
			}
		}
	}
	return false
}

func jwtExpiry(token string) time.Time {
	if c := jwtClaims(token); c != nil {
		if exp, ok := c["exp"].(float64); ok && exp > 0 {
			return time.Unix(int64(exp), 0)
		}
	}
	return time.Time{}
}

// ---------------------------------------------------------------------------------------------------------------
// session-token revocation (logout)
// ---------------------------------------------------------------------------------------------------------------

// Access tokens are stateless and short-lived (1 h); a logout used to only expire the cookie, so a copied token
// kept working. Logout now remembers the token's hash until the token would have expired anyway.
var (
	revokeMu sync.Mutex
	revoked  = map[[32]byte]time.Time{}
)

const maxRevoked = 100000

func revokeToken(token string) {
	if token == "" {
		return
	}
	until := jwtExpiry(token)
	if until.IsZero() || until.After(time.Now().Add(26*time.Hour)) {
		until = time.Now().Add(2 * time.Hour)
	}
	revokeMu.Lock()
	defer revokeMu.Unlock()
	if len(revoked) >= maxRevoked/2 {
		now := time.Now()
		for k, v := range revoked {
			if now.After(v) {
				delete(revoked, k)
			}
		}
	}
	if len(revoked) >= maxRevoked { // pathological: refuse to grow further, drop the oldest half
		n := 0
		for k := range revoked {
			delete(revoked, k)
			if n++; n > maxRevoked/2 {
				break
			}
		}
	}
	revoked[sha256.Sum256([]byte(token))] = until
}

func isRevoked(token string) bool {
	if token == "" {
		return false
	}
	revokeMu.Lock()
	defer revokeMu.Unlock()
	until, ok := revoked[sha256.Sum256([]byte(token))]
	if !ok {
		return false
	}
	if time.Now().After(until) {
		delete(revoked, sha256.Sum256([]byte(token)))
		return false
	}
	return true
}

// ---------------------------------------------------------------------------------------------------------------
// database outage vs. client error
// ---------------------------------------------------------------------------------------------------------------

var dbStatusRe = regexp.MustCompile(`→ (\d{3}):`)

// dbBackendDown reports whether err means the database/identity backend is unavailable (transport failure, 5xx, a
// 402 quota gateway, 408/429) as opposed to a normal rejection (400/401/403/404/409/422 or an explicit
// "invalid credentials" result). A backend fault must not be reported to users as "wrong password".
func dbBackendDown(err error) bool {
	if err == nil {
		return false
	}
	msg := err.Error()
	if m := dbStatusRe.FindStringSubmatch(msg); m != nil {
		code, _ := strconv.Atoi(m[1])
		return code >= 500 || code == 402 || code == 408 || code == 429
	}
	// no HTTP status in the message: the auth helpers' own "supabase auth: <reason>" / "supabase verify: <reason>"
	// are credential rejections; anything else (dial error, EOF, timeout, bad gateway body) is an outage.
	return !strings.HasPrefix(msg, "supabase auth:") && !strings.HasPrefix(msg, "supabase verify:")
}

// ---------------------------------------------------------------------------------------------------------------
// per-account login throttle
// ---------------------------------------------------------------------------------------------------------------

// A per-IP limiter cannot stop a distributed guess against ONE account. The account locks when its failures come
// from several different clients (credential stuffing through rotating addresses); a lone client is bounded by the
// per-IP limit and so never locks its own account out.
type acctFails struct {
	first, lockedUntil time.Time
	count              int
	ips                map[string]struct{}
}

var (
	acctMu    sync.Mutex
	acctState = map[string]*acctFails{}
)

const (
	acctWindow      = 15 * time.Minute
	acctLockFor     = 5 * time.Minute
	acctMinFailures = 8
	acctMinClients  = 5
	acctMaxTracked  = 20000
)

// acctLockedFor returns how long the account stays locked (0 = not locked).
func acctLockedFor(email string) time.Duration {
	acctMu.Lock()
	defer acctMu.Unlock()
	if a := acctState[email]; a != nil && time.Now().Before(a.lockedUntil) {
		return time.Until(a.lockedUntil)
	}
	return 0
}

func acctFailure(email, client string) {
	now := time.Now()
	acctMu.Lock()
	defer acctMu.Unlock()
	a := acctState[email]
	if a == nil || now.Sub(a.first) > acctWindow {
		if len(acctState) >= acctMaxTracked {
			for k, v := range acctState {
				if now.Sub(v.first) > acctWindow && now.After(v.lockedUntil) {
					delete(acctState, k)
				}
			}
			if len(acctState) >= acctMaxTracked { // flood of distinct accounts: drop an arbitrary tenth
				n := 0
				for k := range acctState {
					delete(acctState, k)
					if n++; n > acctMaxTracked/10 {
						break
					}
				}
			}
		}
		a = &acctFails{first: now, ips: map[string]struct{}{}}
		acctState[email] = a
	}
	a.count++
	if len(a.ips) < 64 {
		a.ips[client] = struct{}{}
	}
	if a.count >= acctMinFailures && len(a.ips) >= acctMinClients {
		a.lockedUntil = now.Add(acctLockFor)
	}
}

func acctSuccess(email string) {
	acctMu.Lock()
	delete(acctState, email)
	acctMu.Unlock()
}

// ---------------------------------------------------------------------------------------------------------------
// JSON value helpers
// ---------------------------------------------------------------------------------------------------------------

// jsonDepthExceeds reports whether the decoded JSON value nests deeper than max levels (SQLite's JSON functions
// stop at 1000; Postgres accepts more, so a hostile document must be refused up front, not as a DB 500).
func jsonDepthExceeds(v any, max int) bool {
	var walk func(v any, d int) bool
	walk = func(v any, d int) bool {
		if d > max {
			return true
		}
		switch x := v.(type) {
		case map[string]any:
			for _, e := range x {
				if walk(e, d+1) {
					return true
				}
			}
		case []any:
			for _, e := range x {
				if walk(e, d+1) {
					return true
				}
			}
		}
		return false
	}
	return walk(v, 1)
}

// asInt converts a decoded JSON number into an integer; ok is false for non-numbers, NaN/Inf, fractions and values
// outside the int32 range.
func asInt(v any) (int, bool) {
	f, ok := v.(float64)
	if !ok || math.IsNaN(f) || math.IsInf(f, 0) || f != math.Trunc(f) || f < math.MinInt32 || f > math.MaxInt32 {
		return 0, false
	}
	return int(f), true
}

// asFloat converts a decoded JSON number into a finite float64.
func asFloat(v any) (float64, bool) {
	f, ok := v.(float64)
	if !ok || math.IsNaN(f) || math.IsInf(f, 0) {
		return 0, false
	}
	return f, true
}

var timeOfDayRe = regexp.MustCompile(`^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$`)

func validTimeOfDay(s string) bool { return timeOfDayRe.MatchString(s) }

// parseTimestamp accepts RFC3339 (with or without fractional seconds) and returns it in UTC.
func parseTimestamp(s string) (time.Time, bool) {
	s = strings.TrimSpace(s)
	for _, layout := range []string{time.RFC3339Nano, time.RFC3339} {
		if t, err := time.Parse(layout, s); err == nil {
			return t.UTC(), true
		}
	}
	return time.Time{}, false
}

// normalizeDate accepts YYYY-MM-DD (a real calendar date) or a full RFC3339 timestamp and returns YYYY-MM-DD.
func normalizeDate(s string) (string, bool) {
	s = strings.TrimSpace(s)
	if t, err := time.Parse("2006-01-02", s); err == nil {
		return t.Format("2006-01-02"), true
	}
	if t, ok := parseTimestamp(s); ok {
		return t.Format("2006-01-02"), true
	}
	return "", false
}

// ---------------------------------------------------------------------------------------------------------------
// model output salvage (AI handlers)
// ---------------------------------------------------------------------------------------------------------------

// anExtractJSON returns the first complete, valid JSON object/array found in a model reply: a bare value, a value
// wrapped in a ``` fence, or a value after a line of preamble ("Sure, here is the analysis:"). ok is false when the
// reply holds no complete JSON value (prose only, or a truncated document).
func anExtractJSON(text string) (string, bool) {
	s := strings.TrimSpace(text)
	if s == "" {
		return "", false
	}
	if (s[0] == '{' || s[0] == '[') && json.Valid([]byte(s)) {
		return s, true
	}
	// candidate starts: every '{' / '[' that could open the document (preamble may itself contain brackets)
	tried := 0
	for i := 0; i < len(s) && tried < 64; i++ {
		if s[i] != '{' && s[i] != '[' {
			continue
		}
		tried++
		dec := json.NewDecoder(strings.NewReader(s[i:]))
		var raw json.RawMessage
		err := dec.Decode(&raw)
		if err == nil && len(raw) > 1 {
			return string(raw), true
		}
		if err == io.ErrUnexpectedEOF {
			// a document that starts here but never ends: it is TRUNCATED. Do not descend into it and return
			// one of its complete inner objects as if that were the answer.
			return "", false
		}
	}
	return "", false
}

// anLooksLikeJSON reports whether a model reply is JSON-ish (starts with a bracket or carries a code fence), i.e.
// it must never be shown to a user as if it were prose.
func anLooksLikeJSON(text string) bool {
	s := strings.TrimSpace(text)
	return strings.HasPrefix(s, "{") || strings.HasPrefix(s, "[") || strings.Contains(s, "```")
}

// anSalvageString pulls the value of a "field": "..." out of malformed or TRUNCATED JSON, tolerating a final string
// that never closes. Returns "" when the field is absent.
func anSalvageString(raw, field string) string {
	re := regexp.MustCompile(`"` + regexp.QuoteMeta(field) + `"\s*:\s*"((?:[^"\\]|\\.)*)(\\$|"|$)`)
	m := re.FindStringSubmatch(raw)
	if m == nil {
		return ""
	}
	body := m[1] // m[2] is the closing quote, or "" / a lone trailing backslash when the string was cut off
	var out string
	if err := json.Unmarshal([]byte(`"`+body+`"`), &out); err == nil {
		return strings.TrimSpace(out)
	}
	return strings.TrimSpace(body)
}

// ---------------------------------------------------------------------------------------------------------------
// media sniffing (analyze-image / extract-text)
// ---------------------------------------------------------------------------------------------------------------

// anSniffImage identifies the image formats the model accepts (png, jpeg, webp, heic/heif) from the leading bytes
// of a standard-base64 payload and returns the canonical mime type. "" = unsupported (svg, gif, text ...).
func anSniffImage(b64 string) string {
	head := b64
	if len(head) > 48 {
		head = head[:48]
	}
	head = head[:len(head)/4*4]
	if head == "" {
		return ""
	}
	b, err := base64.StdEncoding.DecodeString(head)
	if err != nil {
		if b2, err2 := base64.RawStdEncoding.DecodeString(strings.TrimRight(head, "=")); err2 == nil {
			b = b2
		} else {
			return ""
		}
	}
	switch {
	case len(b) >= 8 && string(b[:8]) == "\x89PNG\r\n\x1a\n":
		return "image/png"
	case len(b) >= 3 && b[0] == 0xFF && b[1] == 0xD8 && b[2] == 0xFF:
		return "image/jpeg"
	case len(b) >= 12 && string(b[:4]) == "RIFF" && string(b[8:12]) == "WEBP":
		return "image/webp"
	case len(b) >= 12 && string(b[4:8]) == "ftyp":
		switch string(b[8:12]) {
		case "heic", "heix", "hevc", "hevx":
			return "image/heic"
		case "mif1", "msf1", "heim", "heis":
			return "image/heif"
		}
	}
	return ""
}

var mimeRe = regexp.MustCompile(`^[a-z]+/[a-z0-9][a-z0-9.+-]*$`)

// ---------------------------------------------------------------------------------------------------------------
// language and model allow-lists
// ---------------------------------------------------------------------------------------------------------------

// aiLang maps any client locale tag ("zh-CN", "ZH", "ms_MY", " en ") to zh | ms | en. Unknown = en.
func aiLang(lang string) string {
	l := strings.ToLower(strings.TrimSpace(lang))
	if i := strings.IndexAny(l, "-_"); i >= 0 {
		l = l[:i]
	}
	switch l {
	case "zh", "ms":
		return l
	}
	return "en"
}
