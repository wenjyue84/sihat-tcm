package main

import (
	"fmt"
	"log"

	"sihattcm/internal/config"
	"sihattcm/internal/localdb"
)

// startLocalDB opens the SQLite fallback, serves it on an internal 127.0.0.1 listener inside this process and
// points cfg's Supabase settings at it, so every handler keeps talking "Supabase" unchanged.
// testMode (--localdb-only) additionally enables the /__fake/* hooks and schemaless scratch tables; both are
// refused when APP_ENV=production, as is LOCALDB_TEST_HOOKS.
func startLocalDB(cfg *config.Config, testMode bool) (*localdb.Running, error) {
	if cfg.Env == "production" && (testMode || cfg.LocalDBHooks) {
		return nil, fmt.Errorf("test hooks / --localdb-only are refused when APP_ENV=production")
	}
	db, err := localdb.Open(localdb.Options{
		Path:          cfg.SQLitePath,
		JWTSecret:     cfg.LocalJWTSecret,
		AnonKey:       cfg.LocalAnonKey,
		ServiceKey:    cfg.LocalServiceKey,
		PBKDF2Iter:    cfg.LocalPBKDF2Iter,
		SeedDemo:      cfg.SeedDemo,
		TestHooks:     testMode || cfg.LocalDBHooks,
		ScratchTables: testMode,
	})
	if err != nil {
		return nil, err
	}
	run, err := db.Serve(cfg.LocalDBAddr)
	if err != nil {
		_ = db.Close()
		return nil, err
	}
	anon, service := db.Keys()
	if cfg.SupabaseURL != "" && cfg.SupabaseURL != run.URL {
		log.Printf("DB_BACKEND=sqlite: ignoring SUPABASE_URL/SUPABASE_*_KEY from the environment (kept for the future switch back)")
	}
	cfg.SupabaseURL, cfg.SupabaseAnonKey, cfg.SupabaseServiceKey = run.URL, anon, service
	log.Printf("localdb: SQLite at %s, internal API on %s (seed_demo=%v, test_hooks=%v)", cfg.SQLitePath, run.URL, cfg.SeedDemo, testMode || cfg.LocalDBHooks)
	return run, nil
}
