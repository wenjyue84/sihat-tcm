// Sihat TCM — Go rewrite of the AI-powered TCM diagnostic platform.
package main

import (
	"context"
	"embed"
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"

	"sihattcm/internal/config"
	"sihattcm/internal/localdb"
	"sihattcm/internal/server"
)

//go:embed templates/*.html
var templatesFS embed.FS

//go:embed static
var staticFS embed.FS

// Server timeouts. Without them a client that dribbles header bytes (or promises a body and stalls) holds a goroutine
// and a file descriptor forever (slowloris). The upload routes extend their own read deadline (server.withBodyLimit);
// the 10-minute write bound covers the slowest model stream (300 s per upstream call) yet still frees dead sockets.
// (Variables, not constants, so the test can shorten them.)
var (
	readHeaderTimeout = 10 * time.Second
	readTimeout       = 30 * time.Second
	writeTimeout      = 10 * time.Minute
	idleTimeout       = 120 * time.Second
)

// newHTTPServer builds the production http.Server around h.
func newHTTPServer(addr string, h http.Handler) *http.Server {
	return &http.Server{
		Addr:              addr,
		Handler:           h,
		ReadHeaderTimeout: readHeaderTimeout,
		ReadTimeout:       readTimeout,
		WriteTimeout:      writeTimeout,
		IdleTimeout:       idleTimeout,
	}
}

func main() {
	localOnly := flag.Bool("localdb-only", false, "TEST MODE: boot only the SQLite Supabase stand-in (with /__fake/* hooks and schemaless scratch tables) and exit on SIGINT/SIGTERM; used by the contract suite")
	port := flag.Int("port", 0, "with --localdb-only: listen port on 127.0.0.1 (0 = random)")
	backup := flag.String("backup", "", "write a consistent copy of the SQLite database (SQLITE_PATH) to this new file and exit; safe while the app runs")
	promote := flag.String("promote", "", "set the role of an existing account (by email) in the SQLite database and exit; use with --role (default admin)")
	promoteRole := flag.String("role", "admin", "with --promote: patient|doctor|admin|developer")
	seedStats := flag.Bool("seed-demo-stats", false, "open the SQLite database (SQLITE_PATH; SEED_DEMO decides whether demo data is seeded on a fresh file), print the row count per table and exit")
	flag.Parse()

	if *seedStats {
		path := os.Getenv("SQLITE_PATH")
		if path == "" {
			path = "./data/sihat.db"
		}
		if err := localdb.PrintDemoStats(path, config.Load().SeedDemo, os.Stdout); err != nil {
			log.Fatalf("seed-demo-stats: %v", err)
		}
		return
	}

	if *promote != "" {
		path := os.Getenv("SQLITE_PATH")
		if path == "" {
			path = "./data/sihat.db"
		}
		if err := localdb.SetRole(path, *promote, *promoteRole); err != nil {
			log.Fatalf("promote: %v", err)
		}
		fmt.Println(*promote, "is now", *promoteRole, "in", path)
		return
	}
	if *backup != "" {
		path := os.Getenv("SQLITE_PATH")
		if path == "" {
			path = "./data/sihat.db"
		}
		if err := localdb.Backup(path, *backup); err != nil {
			log.Fatalf("backup: %v", err)
		}
		fmt.Println("backup of", path, "written to", *backup)
		return
	}

	cfg := config.Load()
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)

	if *localOnly {
		cfg.DBBackend = "sqlite"
		cfg.LocalDBAddr = "127.0.0.1:" + strconv.Itoa(*port)
		ldb, err := startLocalDB(cfg, true)
		if err != nil {
			log.Fatalf("localdb: %v", err)
		}
		fmt.Printf("localdb-only listening on %s\n", ldb.URL)
		<-stop
		_ = ldb.Close()
		return
	}

	if cfg.DBBackend == "sqlite" {
		ldb, err := startLocalDB(cfg, false)
		if err != nil {
			log.Fatalf("localdb: %v", err)
		}
		defer ldb.Close()
	}

	srv, err := server.New(cfg, templatesFS, staticFS)
	if err != nil {
		log.Fatalf("server init: %v", err)
	}
	// BIND_ADDR (e.g. 127.0.0.1) limits the listener to loopback: test stacks use it so Windows Defender Firewall never prompts;
	// production leaves it empty (nginx proxies to :PORT on the same box).
	addr := os.Getenv("BIND_ADDR") + ":" + cfg.Port
	log.Printf("sihat-tcm-go listening on %s (env=%s, db=%s)", addr, cfg.Env, cfg.DBBackend)
	hs := newHTTPServer(addr, srv.Handler())
	errc := make(chan error, 1)
	go func() { errc <- hs.ListenAndServe() }()
	select {
	case err := <-errc:
		log.Fatal(err)
	case <-stop:
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		_ = hs.Shutdown(ctx)
	}
}
