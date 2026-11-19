package localdb

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"math"
	"regexp"
	"strconv"
	"strings"
	"time"
)

// pgError is a PostgREST-style error: {code, message, details, hint} with an HTTP status.
type pgError struct {
	Status  int
	Code    string
	Message string
	Details any
	Hint    any
}

func (e *pgError) Error() string { return e.Code + ": " + e.Message }

func pgErr(status int, code, msg string) *pgError {
	return &pgError{Status: status, Code: code, Message: msg}
}

var uuidRe = regexp.MustCompile(`^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$`)

func newUUID() string {
	var b [16]byte
	if _, err := rand.Read(b[:]); err != nil {
		panic(err)
	}
	b[6] = (b[6] & 0x0f) | 0x40
	b[8] = (b[8] & 0x3f) | 0x80
	h := hex.EncodeToString(b[:])
	return h[0:8] + "-" + h[8:12] + "-" + h[12:16] + "-" + h[16:20] + "-" + h[20:]
}

const tsLayout = "2006-01-02T15:04:05.000000-07:00" // fixed width => lexicographic order == chronological order

func nowTS() string { return time.Now().UTC().Format(tsLayout) }

var tsInputLayouts = []string{
	time.RFC3339Nano, "2006-01-02T15:04:05.999999999", "2006-01-02 15:04:05.999999999Z07:00", "2006-01-02 15:04:05.999999999-07",
	"2006-01-02 15:04:05.999999999", "2006-01-02T15:04Z07:00", "2006-01-02T15:04", "2006-01-02",
}

func parseTS(s string) (string, bool) {
	s = strings.TrimSpace(s)
	for _, l := range tsInputLayouts {
		if t, err := time.Parse(l, s); err == nil {
			return t.UTC().Format(tsLayout), true
		}
	}
	return "", false
}

func parseDate(s string) (string, bool) {
	s = strings.TrimSpace(s)
	if len(s) >= 10 {
		if t, err := time.Parse("2006-01-02", s[:10]); err == nil && (len(s) == 10 || s[10] == 'T' || s[10] == ' ') {
			return t.Format("2006-01-02"), true
		}
	}
	return "", false
}

func parseTime(s string) (string, bool) {
	for _, l := range []string{"15:04:05.999999", "15:04:05", "15:04"} {
		if t, err := time.Parse(l, strings.TrimSpace(s)); err == nil {
			return t.Format("15:04:05"), true
		}
	}
	return "", false
}

func invalidSyntax(typ, v string) *pgError {
	return pgErr(400, "22P02", fmt.Sprintf("invalid input syntax for type %s: %q", typ, v))
}

// parseTextArray reads a Postgres array literal like {a,"b c"}.
func parseTextArray(s string) ([]any, bool) {
	s = strings.TrimSpace(s)
	if len(s) < 2 || s[0] != '{' || s[len(s)-1] != '}' {
		return nil, false
	}
	body := s[1 : len(s)-1]
	out := []any{}
	if strings.TrimSpace(body) == "" {
		return out, true
	}
	items, ok := splitList(body)
	if !ok {
		return nil, false
	}
	for _, it := range items {
		if it == "NULL" {
			out = append(out, nil)
			continue
		}
		out = append(out, it)
	}
	return out, true
}

// splitList splits a comma separated list honouring double quotes and backslash escapes; quotes are removed.
func splitList(s string) ([]string, bool) {
	var out []string
	var cur strings.Builder
	inQ, esc, any := false, false, false
	for _, r := range s {
		switch {
		case esc:
			cur.WriteRune(r)
			esc = false
		case r == '\\' && inQ:
			esc = true
		case r == '"':
			inQ = !inQ
			any = true
		case r == ',' && !inQ:
			out = append(out, strings.TrimSpace(cur.String()))
			cur.Reset()
			any = false
		default:
			cur.WriteRune(r)
		}
	}
	if inQ || esc {
		return nil, false
	}
	if cur.Len() > 0 || any || len(out) > 0 {
		out = append(out, strings.TrimSpace(cur.String()))
	}
	return out, true
}

func asText(v any) string {
	switch x := v.(type) {
	case string:
		return x
	case float64:
		return strconv.FormatFloat(x, 'f', -1, 64)
	case bool:
		return strconv.FormatBool(x)
	default:
		b, _ := json.Marshal(x)
		return string(b)
	}
}

// coerce converts a JSON-decoded request value to the column's canonical stored representation.
func (c *column) coerce(v any) (any, *pgError) {
	if v == nil {
		return nil, nil
	}
	switch c.typ {
	case tAny:
		return v, nil
	case tUUID:
		s, ok := v.(string)
		if !ok || !uuidRe.MatchString(s) {
			return nil, invalidSyntax("uuid", asText(v))
		}
		return strings.ToLower(s), nil
	case tText:
		s := asText(v)
		if c.maxLen > 0 && len([]rune(s)) > c.maxLen {
			return nil, pgErr(400, "22001", fmt.Sprintf("value too long for type character varying(%d)", c.maxLen))
		}
		return s, nil
	case tInt:
		switch x := v.(type) {
		case float64:
			if x != math.Trunc(x) || math.Abs(x) > 1<<53 {
				return nil, invalidSyntax("integer", asText(v))
			}
			return x, nil
		case string:
			f, err := strconv.ParseFloat(strings.TrimSpace(x), 64)
			if err != nil || f != math.Trunc(f) {
				return nil, invalidSyntax("integer", x)
			}
			return f, nil
		}
		return nil, invalidSyntax("integer", asText(v))
	case tFloat:
		switch x := v.(type) {
		case float64:
			return x, nil
		case string:
			f, err := strconv.ParseFloat(strings.TrimSpace(x), 64)
			if err != nil {
				return nil, invalidSyntax("double precision", x)
			}
			return f, nil
		}
		return nil, invalidSyntax("double precision", asText(v))
	case tBool:
		switch x := v.(type) {
		case bool:
			return x, nil
		case string:
			switch strings.ToLower(strings.TrimSpace(x)) {
			case "true", "t":
				return true, nil
			case "false", "f":
				return false, nil
			}
		}
		return nil, invalidSyntax("boolean", asText(v))
	case tTS:
		if s, ok := v.(string); ok {
			if ts, ok := parseTS(s); ok {
				return ts, nil
			}
		}
		return nil, invalidSyntax("timestamp with time zone", asText(v))
	case tDate:
		if s, ok := v.(string); ok {
			if d, ok := parseDate(s); ok {
				return d, nil
			}
		}
		return nil, invalidSyntax("date", asText(v))
	case tTime:
		if s, ok := v.(string); ok {
			if d, ok := parseTime(s); ok {
				return d, nil
			}
		}
		return nil, invalidSyntax("time", asText(v))
	case tJSON:
		return v, nil
	case tTextArr:
		switch x := v.(type) {
		case []any:
			out := make([]any, len(x))
			for i, e := range x {
				if e == nil {
					out[i] = nil
				} else {
					out[i] = asText(e)
				}
			}
			return out, nil
		case string:
			if a, ok := parseTextArray(x); ok {
				return a, nil
			}
		}
		return nil, pgErr(400, "22P02", fmt.Sprintf("malformed array literal: %q", asText(v)))
	}
	return v, nil
}

// defaultValue returns the column default (or nil,false when there is none). seq is called for identity columns.
func (c *column) defaultValue(seq func() (float64, error)) (any, bool, error) {
	if c.def == "" {
		return nil, false, nil
	}
	switch c.def {
	case "now":
		return nowTS(), true, nil
	case "gen":
		return newUUID(), true, nil
	case "seq":
		n, err := seq()
		return n, true, err
	case "obj":
		return map[string]any{}, true, nil
	case "arr":
		return []any{}, true, nil
	case "cat":
		return map[string]any{"health": true, "medication": true, "exercise": true, "diet": true, "sleep": true, "appointments": true}, true, nil
	}
	v, perr := c.coerce(c.def)
	if perr != nil {
		return nil, false, perr
	}
	return v, true, nil
}

// idString renders a primary-key value as its storage key.
func idString(v any) (string, bool) {
	switch x := v.(type) {
	case string:
		return x, x != ""
	case float64:
		if x == math.Trunc(x) {
			return strconv.FormatFloat(x, 'f', -1, 64), true
		}
	}
	return "", false
}

// -------- comparison --------

// cmpVals orders two non-nil values of the same column type. Mixed or unordered types compare as equal-ish strings.
func cmpVals(a, b any) int {
	switch x := a.(type) {
	case float64:
		if y, ok := b.(float64); ok {
			switch {
			case x < y:
				return -1
			case x > y:
				return 1
			}
			return 0
		}
	case string:
		if y, ok := b.(string); ok {
			return collateCompare(x, y)
		}
	case bool:
		if y, ok := b.(bool); ok {
			switch {
			case x == y:
				return 0
			case !x:
				return -1
			}
			return 1
		}
	}
	return strings.Compare(asText(a), asText(b))
}

// jsonContains implements jsonb @> (and array @>).
func jsonContains(have, want any) bool {
	switch w := want.(type) {
	case map[string]any:
		h, ok := have.(map[string]any)
		if !ok {
			return false
		}
		for k, wv := range w {
			hv, ok := h[k]
			if !ok || !jsonContains(hv, wv) {
				return false
			}
		}
		return true
	case []any:
		h, ok := have.([]any)
		if !ok {
			return false
		}
		for _, wv := range w {
			found := false
			for _, hv := range h {
				if jsonContains(hv, wv) {
					found = true
					break
				}
			}
			if !found {
				return false
			}
		}
		return true
	}
	return cmpVals(have, want) == 0 && fmt.Sprintf("%T", have) == fmt.Sprintf("%T", want)
}
