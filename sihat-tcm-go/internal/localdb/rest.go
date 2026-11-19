package localdb

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"sort"
	"strings"
)

func jsonUnmarshalString(s string, v any) error { return json.Unmarshal([]byte(s), v) }

func writePgErr(w http.ResponseWriter, e *pgError) {
	writeJSON(w, e.Status, map[string]any{"code": e.Code, "message": e.Message, "details": e.Details, "hint": e.Hint})
}

type prefer struct {
	ret        string // representation | minimal | headers-only | ""
	merge      bool
	ignoreDups bool
}

func parsePrefer(r *http.Request) prefer {
	var p prefer
	for _, h := range r.Header.Values("Prefer") {
		for _, tok := range strings.Split(h, ",") {
			k, v, _ := strings.Cut(strings.TrimSpace(tok), "=")
			switch k {
			case "return":
				p.ret = v
			case "resolution":
				p.merge = v == "merge-duplicates"
				p.ignoreDups = v == "ignore-duplicates"
			}
		}
	}
	return p
}

func (d *DB) handleREST(w http.ResponseWriter, r *http.Request) {
	idn, herr := d.identify(r)
	if herr != nil {
		writeJSON(w, herr.status, herr.body)
		return
	}
	name, _ := url.PathUnescape(strings.TrimPrefix(strings.TrimPrefix(r.URL.Path, "/rest/v1"), "/"))
	if name == "" {
		writeJSON(w, 200, map[string]any{"swagger": "2.0", "info": map[string]any{"title": "sihat-tcm localdb"}})
		return
	}
	var t *table
	if tt := tables[name]; tt != nil {
		t = tt
	} else if d.opt.ScratchTables && !strings.Contains(name, "/") {
		t = scratchTable(name)
	} else {
		writePgErr(w, &pgError{Status: 404, Code: "PGRST205", Message: fmt.Sprintf("Could not find the table 'public.%s' in the schema cache", name), Hint: nil})
		return
	}
	if strings.Contains(r.Header.Get("Accept"), "vnd.pgrst") {
		writePgErr(w, pgErr(406, "PGRST107", "unsupported by localdb: custom Accept media types (vnd.pgrst.*)"))
		return
	}
	write := r.Method != http.MethodGet && r.Method != http.MethodHead
	if perr := privilege(idn, t, write); perr != nil {
		writePgErr(w, perr)
		return
	}
	pq, perr := parseQuery(t, r.URL.Query())
	if perr != nil {
		writePgErr(w, perr)
		return
	}
	pref := parsePrefer(r)
	switch r.Method {
	case http.MethodGet, http.MethodHead:
		d.restGet(w, idn, t, pq)
	case http.MethodPost:
		d.restPost(w, r, idn, t, pq, pref)
	case http.MethodPatch:
		d.restPatch(w, r, idn, t, pq, pref)
	case http.MethodDelete:
		d.restDelete(w, idn, t, pq, pref)
	default:
		writePgErr(w, pgErr(405, "PGRST117", "unsupported HTTP method: "+r.Method))
	}
}

// privilege mirrors the GRANTs of db/schema.sql: anon has none, authenticated has a few, service_role has all.
func privilege(idn *identity, t *table, write bool) *pgError {
	denied := func(status int) *pgError {
		return pgErr(status, "42501", fmt.Sprintf("permission denied for table %s", t.name))
	}
	switch idn.role {
	case roleService:
		return nil
	case roleAnon:
		return denied(401)
	}
	if t.grant == "rw" || (t.grant == "r" && !write) {
		return nil
	}
	return denied(403)
}

// visible implements the owner-based RLS policies (USING clause) for the authenticated role.
func visible(idn *identity, t *table, row map[string]any) bool {
	if idn.role == roleService {
		return true
	}
	if t.owner == "" {
		return false
	}
	s, _ := row[t.owner].(string)
	return s != "" && s == idn.uid
}

func rlsViolation(t *table) *pgError {
	return pgErr(403, "42501", fmt.Sprintf("new row violates row-level security policy for table %q", t.name))
}

func filterRows(idn *identity, t *table, pq *parsedQuery, rows []map[string]any) []map[string]any {
	out := rows[:0:0]
	for _, row := range rows {
		if !visible(idn, t, row) {
			continue
		}
		ok := true
		for _, f := range pq.filters {
			if !f(row) {
				ok = false
				break
			}
		}
		if ok {
			out = append(out, row)
		}
	}
	return out
}

func (d *DB) restGet(w http.ResponseWriter, idn *identity, t *table, pq *parsedQuery) {
	rows, err := d.loadRowsWhere(d.sql, t.name, pq.idHint, pq.eqHints)
	if err != nil {
		d.serverError(w, err)
		return
	}
	rows = filterRows(idn, t, pq, rows)
	sortRows(rows, pq.order)
	if pq.offset > 0 {
		if pq.offset >= len(rows) {
			rows = rows[:0]
		} else {
			rows = rows[pq.offset:]
		}
	}
	if pq.hasLimit && pq.limit < len(rows) {
		rows = rows[:pq.limit]
	}
	out := make([]map[string]any, len(rows))
	for i, row := range rows {
		out[i] = projectRow(row, pq.sel)
	}
	writeJSON(w, 200, out)
}

func (d *DB) serverError(w http.ResponseWriter, err error) {
	d.opt.Logf("localdb: %v", err)
	writePgErr(w, pgErr(500, "XX000", "internal error"))
}

func (d *DB) finish(w http.ResponseWriter, err error) bool {
	if err == nil {
		return true
	}
	var pe *pgError
	if errors.As(err, &pe) {
		writePgErr(w, pe)
		return false
	}
	d.serverError(w, err)
	return false
}

func payloadItems(r *http.Request) ([]map[string]any, *pgError) {
	v, ok := readJSONBody(r)
	if !ok || v == nil {
		return nil, pgErr(400, "PGRST102", "Empty or invalid json")
	}
	switch x := v.(type) {
	case map[string]any:
		return []map[string]any{x}, nil
	case []any:
		out := make([]map[string]any, 0, len(x))
		for _, e := range x {
			m, ok := e.(map[string]any)
			if !ok {
				return nil, pgErr(400, "PGRST102", "All object keys must match")
			}
			out = append(out, m)
		}
		return out, nil
	}
	return nil, pgErr(400, "PGRST102", "Payload must be a JSON object or an array of objects")
}

func respondRows(w http.ResponseWriter, status int, pq *parsedQuery, rows []map[string]any) {
	out := make([]map[string]any, len(rows))
	for i, row := range rows {
		out[i] = projectRow(row, pq.sel)
	}
	writeJSON(w, status, out)
}

func (d *DB) restPost(w http.ResponseWriter, r *http.Request, idn *identity, t *table, pq *parsedQuery, pref prefer) {
	items, perr := payloadItems(r)
	if perr != nil {
		writePgErr(w, perr)
		return
	}
	var made []map[string]any
	err := d.inTx(func(tx *sql.Tx) error {
		made = made[:0]
		for _, it := range items {
			row, perr := d.insertOne(tx, t, it, insertOpts{idn: idn, merge: pref.merge, ignore: pref.ignoreDups, onConflict: pq.onConflict})
			if perr != nil {
				return perr
			}
			if row != nil {
				made = append(made, row)
			}
		}
		return nil
	})
	if !d.finish(w, err) {
		return
	}
	if pref.ret == "representation" {
		respondRows(w, 201, pq, made)
		return
	}
	w.WriteHeader(201)
}

func (d *DB) restPatch(w http.ResponseWriter, r *http.Request, idn *identity, t *table, pq *parsedQuery, pref prefer) {
	v, ok := readJSONBody(r)
	body, isObj := v.(map[string]any)
	if !ok || !isObj {
		writePgErr(w, pgErr(400, "PGRST102", "Empty or invalid json"))
		return
	}
	patch, perr := d.coercePatch(t, body)
	if perr != nil {
		writePgErr(w, perr)
		return
	}
	var updated []map[string]any
	err := d.inTx(func(tx *sql.Tx) error {
		updated = updated[:0]
		rows, err := d.loadRowsWhere(tx, t.name, pq.idHint, pq.eqHints)
		if err != nil {
			return err
		}
		for _, row := range filterRows(idn, t, pq, rows) {
			nr, perr := d.applyUpdate(tx, t, row, patch, idn)
			if perr != nil {
				return perr
			}
			updated = append(updated, nr)
		}
		return nil
	})
	if !d.finish(w, err) {
		return
	}
	if pref.ret == "representation" {
		respondRows(w, 200, pq, updated)
		return
	}
	w.WriteHeader(204)
}

func (d *DB) restDelete(w http.ResponseWriter, idn *identity, t *table, pq *parsedQuery, pref prefer) {
	var gone []map[string]any
	err := d.inTx(func(tx *sql.Tx) error {
		gone = gone[:0]
		rows, err := d.loadRowsWhere(tx, t.name, pq.idHint, pq.eqHints)
		if err != nil {
			return err
		}
		for _, row := range filterRows(idn, t, pq, rows) {
			id, _ := idString(row["id"])
			if err := d.deleteDoc(tx, t.name, id); err != nil {
				return err
			}
			gone = append(gone, row)
		}
		return nil
	})
	if !d.finish(w, err) {
		return
	}
	if pref.ret == "representation" {
		respondRows(w, 200, pq, gone)
		return
	}
	w.WriteHeader(204)
}

// ------------------------------------------------------------------ row building / constraints

type insertOpts struct {
	idn        *identity // nil = trusted internal caller (seed, signup trigger)
	merge      bool
	ignore     bool
	onConflict []string
}

func missingColumn(t *table, name string) *pgError {
	return pgErr(400, "PGRST204", fmt.Sprintf("Could not find the '%s' column of '%s' in the schema cache", name, t.name))
}

// coercePatch validates and canonicalises the provided columns of a PATCH body.
func (d *DB) coercePatch(t *table, body map[string]any) (map[string]any, *pgError) {
	keys := make([]string, 0, len(body))
	for k := range body {
		keys = append(keys, k)
	}
	sort.Strings(keys)
	out := make(map[string]any, len(body))
	for _, k := range keys {
		c := t.col(k)
		if c == nil {
			if !t.scratch {
				return nil, missingColumn(t, k)
			}
			out[k] = body[k]
			continue
		}
		v, perr := c.coerce(body[k])
		if perr != nil {
			return nil, perr
		}
		out[k] = v
	}
	return out, nil
}

func notNullErr(t *table, col string) *pgError {
	return pgErr(400, "23502", fmt.Sprintf("null value in column %q of relation %q violates not-null constraint", col, t.name))
}

// insertOne builds, validates and stores one row (Prefer: resolution=merge-duplicates upserts on the conflict target).
// It returns (nil, nil) for a row skipped by ignore-duplicates.
func (d *DB) insertOne(tx *sql.Tx, t *table, item map[string]any, o insertOpts) (map[string]any, *pgError) {
	patch, perr := d.coercePatch(t, item)
	if perr != nil {
		return nil, perr
	}
	row := map[string]any{}
	if t.scratch {
		for k, v := range patch {
			row[k] = v
		}
		if row["id"] == nil {
			row["id"] = newUUID()
		}
		if row["created_at"] == nil {
			row["created_at"] = nowTS()
		}
	} else {
		for _, c := range t.cols {
			if v, ok := patch[c.name]; ok {
				row[c.name] = v
				continue
			}
			dv, has, err := c.defaultValue(func() (float64, error) { return d.nextSeq(tx, t.name) })
			if err != nil {
				var pe *pgError
				if errors.As(err, &pe) {
					return nil, pe
				}
				return nil, pgErr(500, "XX000", err.Error())
			}
			if has {
				row[c.name] = dv
			} else {
				row[c.name] = nil
			}
		}
	}
	// RLS WITH CHECK is evaluated before the table constraints.
	if o.idn != nil && o.idn.role == roleAuth && (t.owner == "" || row[t.owner] != o.idn.uid) {
		return nil, rlsViolation(t)
	}
	for _, c := range t.cols {
		if c.notNull && row[c.name] == nil {
			return nil, notNullErr(t, c.name)
		}
	}
	idStr, ok := idString(row["id"])
	if !ok {
		return nil, pgErr(400, "22P02", "invalid input syntax for primary key id")
	}

	// conflict target
	target := o.onConflict
	if len(target) == 0 {
		target = []string{"id"}
	}
	var existing map[string]any
	if len(o.onConflict) > 0 && !(len(target) == 1 && target[0] == "id") {
		if !d.isUniqueSet(t, target) {
			return nil, pgErr(400, "42P10", "there is no unique or exclusion constraint matching the ON CONFLICT specification")
		}
		id, found := d.findByUnique(tx, t, target, row, "")
		if found {
			rows, err := d.loadRows(tx, t.name, id)
			if err == nil && len(rows) == 1 {
				existing = rows[0]
			}
		}
	} else if d.docExists(tx, t.name, idStr) {
		rows, err := d.loadRows(tx, t.name, idStr)
		if err == nil && len(rows) == 1 {
			existing = rows[0]
		}
	}
	if existing != nil {
		switch {
		case o.ignore:
			return nil, nil
		case o.merge:
			return d.applyUpdate(tx, t, existing, patch, o.idn)
		}
		return nil, dupErr(t, target)
	}
	if d.docExists(tx, t.name, idStr) {
		return nil, dupErr(t, []string{"id"})
	}
	if perr := d.checkRow(tx, t, row, "", nil); perr != nil {
		return nil, perr
	}
	if err := d.putDoc(tx, t.name, idStr, row); err != nil {
		return nil, pgErr(500, "XX000", err.Error())
	}
	return row, nil
}

func dupErr(t *table, cols []string) *pgError {
	name := t.name + "_pkey"
	if !(len(cols) == 1 && cols[0] == "id") {
		name = t.name + "_" + strings.TrimPrefix(strings.Join(cols, "_"), "~") + "_key"
	}
	e := pgErr(409, "23505", fmt.Sprintf("duplicate key value violates unique constraint %q", name))
	e.Details = fmt.Sprintf("Key (%s) already exists.", strings.Join(cols, ", "))
	return e
}

// applyUpdate merges patch into existing, re-validates, and stores it (PATCH and upsert-update path).
func (d *DB) applyUpdate(tx *sql.Tx, t *table, existing, patch map[string]any, idn *identity) (map[string]any, *pgError) {
	oldID, _ := idString(existing["id"])
	if idn != nil && idn.role == roleAuth && !visible(idn, t, existing) {
		return nil, rlsViolation(t)
	}
	nr := make(map[string]any, len(existing))
	for k, v := range existing {
		nr[k] = v
	}
	changed := map[string]bool{}
	for k, v := range patch {
		if cmpNullable(existing[k], v) {
			continue
		}
		nr[k] = v
		changed[k] = true
	}
	if t.touch {
		nr["updated_at"] = nowTS()
	}
	if idn != nil && idn.role == roleAuth && (t.owner == "" || nr[t.owner] != idn.uid) {
		return nil, rlsViolation(t)
	}
	for _, c := range t.cols {
		if c.notNull && nr[c.name] == nil {
			return nil, notNullErr(t, c.name)
		}
	}
	newID, ok := idString(nr["id"])
	if !ok {
		return nil, pgErr(400, "22P02", "invalid input syntax for primary key id")
	}
	if newID != oldID && d.docExists(tx, t.name, newID) {
		return nil, dupErr(t, []string{"id"})
	}
	if perr := d.checkRow(tx, t, nr, oldID, changed); perr != nil {
		return nil, perr
	}
	if err := d.replaceDoc(tx, t.name, oldID, newID, nr); err != nil {
		return nil, pgErr(500, "XX000", err.Error())
	}
	return nr, nil
}

func cmpNullable(a, b any) bool {
	if a == nil || b == nil {
		return a == nil && b == nil
	}
	return asText(a) == asText(b) && fmt.Sprintf("%T", a) == fmt.Sprintf("%T", b)
}

// checkRow runs CHECK, UNIQUE and FOREIGN KEY constraints. selfID excludes the row being updated; changed (when
// non-nil) limits FK validation to columns that changed.
func (d *DB) checkRow(tx *sql.Tx, t *table, row map[string]any, selfID string, changed map[string]bool) *pgError {
	for _, chk := range t.checks {
		if name, ok := chk(row); !ok {
			return pgErr(400, "23514", fmt.Sprintf("new row for relation %q violates check constraint %q", t.name, name))
		}
	}
	for _, set := range t.unique {
		if _, found := d.findByUnique(tx, t, set, row, selfID); found {
			return dupErr(t, set)
		}
	}
	for _, f := range t.fks {
		v, _ := row[f.col].(string)
		if v == "" || (changed != nil && !changed[f.col]) {
			continue
		}
		if !d.refExists(tx, f.ref, v) {
			e := pgErr(409, "23503", fmt.Sprintf("insert or update on table %q violates foreign key constraint %q", t.name, t.name+"_"+f.col+"_fkey"))
			e.Details = fmt.Sprintf("Key (%s)=(%s) is not present in table %q.", f.col, v, f.ref)
			return e
		}
	}
	return nil
}

func (d *DB) isUniqueSet(t *table, cols []string) bool {
	for _, set := range t.unique {
		if len(set) != len(cols) {
			continue
		}
		ok := true
		for i := range set {
			if strings.TrimPrefix(set[i], "~") != cols[i] {
				ok = false
			}
		}
		if ok {
			return true
		}
	}
	return false
}

// findByUnique looks for another row sharing the unique key (NULLs never conflict).
func (d *DB) findByUnique(q querier, t *table, set []string, row map[string]any, selfID string) (string, bool) {
	where := []string{"tbl=?"}
	args := []any{t.name}
	for _, c := range set {
		ci := strings.HasPrefix(c, "~")
		c = strings.TrimPrefix(c, "~")
		v, _ := row[c].(string)
		if row[c] == nil {
			return "", false
		}
		if ci {
			where = append(where, "lower(json_extract(doc,'$."+c+"'))=?")
			args = append(args, strings.ToLower(v))
		} else {
			where = append(where, "json_extract(doc,'$."+c+"')=?")
			args = append(args, v)
		}
	}
	if selfID != "" {
		where = append(where, "id<>?")
		args = append(args, selfID)
	}
	var id string
	if err := q.QueryRow("SELECT id FROM docs WHERE "+strings.Join(where, " AND ")+" LIMIT 1", args...).Scan(&id); err != nil {
		return "", false
	}
	return id, true
}
