package localdb

import (
	"fmt"
	"net/url"
	"regexp"
	"sort"
	"strconv"
	"strings"
)

// rowFilter reports whether a stored row matches.
type rowFilter func(row map[string]any) bool

type orderKey struct {
	col        *column
	desc       bool
	nullsFirst bool
}

type parsedQuery struct {
	filters    []rowFilter
	sel        []string // nil = all columns
	order      []orderKey
	limit      int
	hasLimit   bool
	offset     int
	onConflict []string
	idHint     string
	eqHints    []eqHint
}

// hintable columns have an expression index on docs (see ddl); pushing other columns down would not help.
var hintable = map[string]bool{"user_id": true, "doctor_id": true}

const supportedOps = "eq, neq, gt, gte, lt, lte, in, is, cs, like, ilike"

func unsupported(what string) *pgError {
	return pgErr(400, "PGRST100", "unsupported by localdb: "+what+" (implemented: "+supportedOps+"; order; limit; offset; select=cols)")
}

// colFor resolves a column; typed tables reject unknown names (42703), scratch tables are untyped.
func colFor(t *table, name string) (*column, *pgError) {
	if c := t.col(name); c != nil {
		return c, nil
	}
	if t.scratch {
		return &column{name: name, typ: tAny}, nil
	}
	return nil, pgErr(400, "42703", fmt.Sprintf("column %s.%s does not exist", t.name, name))
}

var selectColRe = regexp.MustCompile(`^[A-Za-z_][A-Za-z0-9_]*$`)

func parseQuery(t *table, vals url.Values) (*parsedQuery, *pgError) {
	pq := &parsedQuery{}
	keys := make([]string, 0, len(vals))
	for k := range vals {
		keys = append(keys, k)
	}
	sort.Strings(keys)
	for _, k := range keys {
		list := vals[k]
		switch k {
		case "select":
			sel := strings.TrimSpace(list[len(list)-1])
			if sel == "" || sel == "*" {
				continue
			}
			for _, c := range strings.Split(sel, ",") {
				c = strings.TrimSpace(c)
				if c == "*" {
					pq.sel = nil
					break
				}
				if !selectColRe.MatchString(c) {
					return nil, unsupported("select item '" + c + "' (embedding, aliases and casts)")
				}
				if _, perr := colFor(t, c); perr != nil {
					return nil, perr
				}
				pq.sel = append(pq.sel, c)
			}
		case "order":
			for _, part := range strings.Split(list[len(list)-1], ",") {
				fields := strings.Split(strings.TrimSpace(part), ".")
				c, perr := colFor(t, fields[0])
				if perr != nil {
					return nil, perr
				}
				ok := orderKey{col: c}
				nulls := ""
				for _, f := range fields[1:] {
					switch f {
					case "asc":
						ok.desc = false
					case "desc":
						ok.desc = true
					case "nullsfirst", "nullslast":
						nulls = f
					default:
						return nil, unsupported("order modifier '" + f + "'")
					}
				}
				switch nulls {
				case "nullsfirst":
					ok.nullsFirst = true
				case "nullslast":
					ok.nullsFirst = false
				default:
					ok.nullsFirst = ok.desc // Postgres: NULLS LAST for ASC, NULLS FIRST for DESC
				}
				pq.order = append(pq.order, ok)
			}
		case "limit":
			n, err := strconv.Atoi(list[len(list)-1])
			if err != nil || n < 0 {
				return nil, pgErr(400, "PGRST100", "invalid limit: "+list[len(list)-1])
			}
			pq.limit, pq.hasLimit = n, true
		case "offset":
			n, err := strconv.Atoi(list[len(list)-1])
			if err != nil || n < 0 {
				return nil, pgErr(400, "PGRST100", "invalid offset: "+list[len(list)-1])
			}
			pq.offset = n
		case "on_conflict":
			for _, c := range strings.Split(list[len(list)-1], ",") {
				pq.onConflict = append(pq.onConflict, strings.TrimSpace(c))
			}
		case "or", "and", "not":
			return nil, unsupported(k + "=(...) logic trees")
		case "columns":
			return nil, unsupported("the columns= parameter")
		default:
			c, perr := colFor(t, k)
			if perr != nil {
				return nil, perr
			}
			for _, expr := range list {
				f, perr := compileFilter(c, expr)
				if perr != nil {
					return nil, perr
				}
				name := c.name
				pq.filters = append(pq.filters, func(row map[string]any) bool { return f(row[name]) })
				if strings.HasPrefix(expr, "eq.") && (c.typ == tUUID || c.typ == tText) && !t.scratch && hintable[c.name] {
					if v, perr := c.coerce(strings.TrimPrefix(expr, "eq.")); perr == nil {
						if sv, ok := v.(string); ok {
							pq.eqHints = append(pq.eqHints, eqHint{c.name, sv})
						}
					}
				}
				if k == "id" && strings.HasPrefix(expr, "eq.") && t.col("id") != nil {
					if v, perr := c.coerce(strings.TrimPrefix(expr, "eq.")); perr == nil {
						if s, ok := idString(v); ok {
							pq.idHint = s
						}
					}
				}
			}
		}
	}
	return pq, nil
}

// compileFilter turns "op.value" into a predicate over the stored value. SQL semantics: NULL never satisfies a
// comparison (neq included); only is.null does.
func compileFilter(c *column, expr string) (func(v any) bool, *pgError) {
	op, val, ok := strings.Cut(expr, ".")
	if !ok {
		return nil, pgErr(400, "PGRST100", fmt.Sprintf("failed to parse filter (%s): expected <operator>.<value>", expr))
	}
	switch op {
	case "eq", "neq", "gt", "gte", "lt", "lte":
		cmp, perr := comparator(c, val)
		if perr != nil {
			return nil, perr
		}
		return func(v any) bool {
			if v == nil {
				return false
			}
			r, ok := cmp(v)
			if !ok {
				return op == "neq"
			}
			switch op {
			case "eq":
				return r == 0
			case "neq":
				return r != 0
			case "gt":
				return r > 0
			case "gte":
				return r >= 0
			case "lt":
				return r < 0
			}
			return r <= 0
		}, nil
	case "in":
		if len(val) < 2 || val[0] != '(' || val[len(val)-1] != ')' {
			return nil, pgErr(400, "PGRST100", "failed to parse filter ("+expr+"): in expects a parenthesised list")
		}
		items, ok := splitList(val[1 : len(val)-1])
		if !ok {
			return nil, pgErr(400, "PGRST100", "failed to parse filter ("+expr+"): unbalanced quotes")
		}
		var cmps []func(any) (int, bool)
		for _, it := range items {
			cmp, perr := comparator(c, it)
			if perr != nil {
				return nil, perr
			}
			cmps = append(cmps, cmp)
		}
		return func(v any) bool {
			if v == nil {
				return false
			}
			for _, cmp := range cmps {
				if r, ok := cmp(v); ok && r == 0 {
					return true
				}
			}
			return false
		}, nil
	case "is":
		switch strings.ToLower(val) {
		case "null", "unknown":
			return func(v any) bool { return v == nil }, nil
		case "true":
			return func(v any) bool { return isBool(v, true) }, nil
		case "false":
			return func(v any) bool { return isBool(v, false) }, nil
		}
		return nil, pgErr(400, "PGRST100", "failed to parse filter ("+expr+"): is expects null, true, false or unknown")
	case "cs":
		want, perr := containsOperand(c, val)
		if perr != nil {
			return nil, perr
		}
		return func(v any) bool { return v != nil && jsonContains(v, want) }, nil
	case "like", "ilike":
		if c.typ != tText && c.typ != tAny {
			return nil, pgErr(400, "42883", fmt.Sprintf("operator does not exist: %s ~~ unknown (like/ilike need a text column)", c.name))
		}
		re, err := regexp.Compile(likeToRegexp(val, op == "ilike"))
		if err != nil {
			return nil, pgErr(400, "PGRST100", "bad pattern")
		}
		return func(v any) bool { return v != nil && re.MatchString(asText(v)) }, nil
	}
	if strings.HasPrefix(op, "not") {
		return nil, unsupported("negated operator '" + op + "'")
	}
	return nil, unsupported("operator '" + op + "'")
}

func isBool(v any, want bool) bool {
	switch x := v.(type) {
	case bool:
		return x == want
	case string:
		return x == strconv.FormatBool(want)
	}
	return false
}

// comparator returns cmp(rowValue)->(order vs operand, comparable).
func comparator(c *column, raw string) (func(any) (int, bool), *pgError) {
	if c.typ == tAny {
		return func(v any) (int, bool) {
			switch x := v.(type) {
			case float64:
				f, err := strconv.ParseFloat(raw, 64)
				if err != nil {
					return 0, false
				}
				return cmpVals(x, f), true
			case bool:
				return strings.Compare(strconv.FormatBool(x), raw), true
			case string:
				return collateCompare(x, raw), true
			}
			return strings.Compare(asText(v), raw), true
		}, nil
	}
	op, perr := c.coerce(raw)
	if perr != nil {
		return nil, perr
	}
	if c.typ == tJSON || c.typ == tTextArr {
		want := asText(op)
		return func(v any) (int, bool) { return strings.Compare(asText(v), want), true }, nil
	}
	return func(v any) (int, bool) { return cmpVals(v, op), true }, nil
}

func containsOperand(c *column, raw string) (any, *pgError) {
	switch c.typ {
	case tTextArr:
		a, ok := parseTextArray(raw)
		if !ok {
			return nil, pgErr(400, "22P02", "malformed array literal: "+strconv.Quote(raw))
		}
		return a, nil
	case tJSON:
		var v any
		if err := jsonUnmarshalString(raw, &v); err != nil {
			return nil, pgErr(400, "22P02", "invalid input syntax for type json")
		}
		return v, nil
	case tAny:
		if strings.HasPrefix(raw, "{") || strings.HasPrefix(raw, "[") {
			var v any
			if jsonUnmarshalString(raw, &v) == nil {
				return v, nil
			}
			if a, ok := parseTextArray(raw); ok {
				return a, nil
			}
		}
		return nil, pgErr(400, "22P02", "cs expects an array literal {a,b} or a JSON value")
	}
	return nil, pgErr(400, "42883", fmt.Sprintf("operator does not exist: %s @> unknown (cs needs an array or json column)", c.name))
}

func likeToRegexp(pat string, ci bool) string {
	var b strings.Builder
	b.WriteString("(?s)")
	if ci {
		b.WriteString("(?i)")
	}
	b.WriteString("^")
	rs := []rune(pat)
	for i := 0; i < len(rs); i++ {
		switch r := rs[i]; r {
		case '*', '%':
			b.WriteString(".*")
		case '_':
			b.WriteString(".")
		case '\\':
			if i+1 < len(rs) {
				i++
				b.WriteString(regexp.QuoteMeta(string(rs[i])))
			}
		default:
			b.WriteString(regexp.QuoteMeta(string(r)))
		}
	}
	b.WriteString("$")
	return b.String()
}

// sortRows orders rows (stable) by the parsed keys.
func sortRows(rows []map[string]any, keys []orderKey) {
	if len(keys) == 0 {
		return
	}
	sort.SliceStable(rows, func(i, j int) bool {
		for _, k := range keys {
			a, b := rows[i][k.col.name], rows[j][k.col.name]
			if a == nil && b == nil {
				continue
			}
			if a == nil || b == nil {
				if (a == nil) == k.nullsFirst {
					return true
				}
				return false
			}
			r := cmpVals(a, b)
			if r == 0 {
				continue
			}
			if k.desc {
				return r > 0
			}
			return r < 0
		}
		return false
	})
}

func projectRow(row map[string]any, sel []string) map[string]any {
	if sel == nil {
		return row
	}
	out := make(map[string]any, len(sel))
	for _, c := range sel {
		out[c] = row[c]
	}
	return out
}
