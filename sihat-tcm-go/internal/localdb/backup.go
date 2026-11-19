package localdb

import (
	"database/sql"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

// Backup writes a consistent, compacted copy of the SQLite file at path to dest using VACUUM INTO. It is safe to run
// while the app is serving (WAL readers never block writers) and it never modifies the source. dest must not exist.
func Backup(path, dest string) error {
	if _, err := os.Stat(path); err != nil {
		return fmt.Errorf("localdb: backup source: %w", err)
	}
	if _, err := os.Stat(dest); err == nil {
		return errors.New("localdb: backup destination already exists: " + dest)
	}
	if dir := filepath.Dir(dest); dir != "" && dir != "." {
		if err := os.MkdirAll(dir, 0o700); err != nil {
			return err
		}
	}
	db, err := sql.Open("sqlite", "file:"+filepath.ToSlash(path)+"?_pragma=busy_timeout(10000)")
	if err != nil {
		return err
	}
	defer db.Close()
	if _, err := db.Exec("VACUUM INTO '" + strings.ReplaceAll(filepath.ToSlash(dest), "'", "''") + "'"); err != nil {
		return fmt.Errorf("localdb: backup: %w", err)
	}
	return os.Chmod(dest, 0o600)
}

// SetRole sets the profile role of an existing account (admin/developer cannot be self-assigned through signup, so on a
// production SQLite deployment without demo accounts this is how the first admin is made: sign up normally, then
// `sihat-tcm-go --promote you@example.com --role admin`). Safe while the app runs; it only touches that profile row.
func SetRole(path, email, role string) error {
	switch role {
	case "patient", "doctor", "admin", "developer":
	default:
		return errors.New("localdb: role must be one of patient|doctor|admin|developer")
	}
	if _, err := os.Stat(path); err != nil {
		return fmt.Errorf("localdb: database: %w", err)
	}
	db, err := sql.Open("sqlite", "file:"+filepath.ToSlash(path)+"?_pragma=busy_timeout(10000)")
	if err != nil {
		return err
	}
	defer db.Close()
	res, err := db.Exec(`UPDATE docs SET doc=json_set(doc,'$.role',?,'$.updated_at',?) WHERE tbl='profiles' AND lower(json_extract(doc,'$.email'))=?`,
		role, nowTS(), strings.ToLower(strings.TrimSpace(email)))
	if err != nil {
		return err
	}
	if n, _ := res.RowsAffected(); n != 1 {
		return fmt.Errorf("localdb: no account with email %q (it must sign up first)", email)
	}
	return nil
}
