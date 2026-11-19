package localdb

import (
	"database/sql"
	"encoding/json"
	"os"
)

func mkdirAll(dir string) error { return os.MkdirAll(dir, 0o755) }

// loadRows returns every stored row of a table in insertion order. idHint (when non-empty) restricts to that primary key.
func (d *DB) loadRows(q querier, tbl, idHint string) ([]map[string]any, error) {
	return d.loadRowsWhere(q, tbl, idHint, nil)
}

// eqHint is a pushed-down "col = value" for text/uuid columns (the in-Go filter still runs, so this is only a pre-filter).
type eqHint struct{ col, val string }

func (d *DB) loadRowsWhere(q querier, tbl, idHint string, hints []eqHint) ([]map[string]any, error) {
	var rows *sql.Rows
	var err error
	if idHint != "" {
		rows, err = q.Query("SELECT doc FROM docs WHERE tbl=? AND id=? ORDER BY seqno", tbl, idHint)
	} else {
		where, args := "tbl=?", []any{tbl}
		for _, h := range hints {
			where += " AND json_extract(doc,'$." + h.col + "')=?"
			args = append(args, h.val)
		}
		rows, err = q.Query("SELECT doc FROM docs WHERE "+where+" ORDER BY seqno", args...)
	}
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []map[string]any{}
	for rows.Next() {
		var doc string
		if err := rows.Scan(&doc); err != nil {
			return nil, err
		}
		m := map[string]any{}
		if err := json.Unmarshal([]byte(doc), &m); err != nil {
			return nil, err
		}
		out = append(out, m)
	}
	return out, rows.Err()
}

func (d *DB) docExists(q querier, tbl, id string) bool {
	var one int
	return q.QueryRow("SELECT 1 FROM docs WHERE tbl=? AND id=?", tbl, id).Scan(&one) == nil
}

func (d *DB) putDoc(q execer, tbl, id string, row map[string]any) error {
	b, err := json.Marshal(row)
	if err != nil {
		return err
	}
	_, err = q.Exec("INSERT INTO docs(tbl,id,doc) VALUES(?,?,?)", tbl, id, string(b))
	return err
}

func (d *DB) replaceDoc(q execer, tbl, oldID, newID string, row map[string]any) error {
	b, err := json.Marshal(row)
	if err != nil {
		return err
	}
	_, err = q.Exec("UPDATE docs SET id=?, doc=? WHERE tbl=? AND id=?", newID, string(b), tbl, oldID)
	return err
}

func (d *DB) deleteDoc(q execer, tbl, id string) error {
	_, err := q.Exec("DELETE FROM docs WHERE tbl=? AND id=?", tbl, id)
	return err
}

// nextSeq allocates the next identity value for a table (never reused, like a Postgres sequence).
func (d *DB) nextSeq(q querier, tbl string) (float64, error) {
	var n int64
	err := q.QueryRow("INSERT INTO seq(tbl,n) VALUES(?,1) ON CONFLICT(tbl) DO UPDATE SET n=n+1 RETURNING n", tbl).Scan(&n)
	return float64(n), err
}

func (d *DB) refExists(q querier, ref, id string) bool {
	if ref == "users" {
		var one int
		return q.QueryRow("SELECT 1 FROM users WHERE id=?", id).Scan(&one) == nil
	}
	return d.docExists(q, ref, id)
}
