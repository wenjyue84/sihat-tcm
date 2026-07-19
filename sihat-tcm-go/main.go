// Sihat TCM — Go rewrite of the AI-powered TCM diagnostic platform.
package main

import (
	"embed"
	"log"
	"net/http"

	"sihattcm/internal/config"
	"sihattcm/internal/server"
)

//go:embed templates/*.html
var templatesFS embed.FS

//go:embed static
var staticFS embed.FS

func main() {
	cfg := config.Load()
	srv, err := server.New(cfg, templatesFS, staticFS)
	if err != nil {
		log.Fatalf("server init: %v", err)
	}
	addr := ":" + cfg.Port
	log.Printf("sihat-tcm-go listening on %s (env=%s)", addr, cfg.Env)
	if err := http.ListenAndServe(addr, srv.Handler()); err != nil {
		log.Fatal(err)
	}
}
