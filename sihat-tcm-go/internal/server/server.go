// Package server wires up the HTTP mux, templates, and shared dependencies.
package server

import (
	"embed"
	"encoding/json"
	"html/template"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"sihattcm/internal/config"
	"sihattcm/internal/gemini"
	"sihattcm/internal/supabase"
)

// Server holds shared dependencies for all handlers.
type Server struct {
	Cfg  *config.Config
	AI   *gemini.Client
	DB   *supabase.Client
	Tmpl *template.Template
	Mux  *http.ServeMux
}

// assetVersion is stamped once at process start. Because a deploy = a new
// process, it changes on every deploy, which cache-busts static assets behind
// Cloudflare (the HTML is served DYNAMIC, so new ?v=… URLs are fetched fresh).
var assetVersion = strconv.FormatInt(time.Now().Unix(), 10)

// New builds a Server from config plus embedded templates/static assets.
func New(cfg *config.Config, templates embed.FS, static embed.FS) (*Server, error) {
	tmpl, err := template.New("").Funcs(template.FuncMap{
		// asset appends the build version so browsers/Cloudflare fetch fresh
		// JS/CSS after each deploy instead of a stale cached copy.
		"asset": func(p string) string {
			if strings.Contains(p, "?") {
				return p + "&v=" + assetVersion
			}
			return p + "?v=" + assetVersion
		},
	}).ParseFS(templates, "templates/*.html")
	if err != nil {
		return nil, err
	}
	s := &Server{
		Cfg:  cfg,
		AI:   gemini.New(cfg.GeminiAPIKey),
		DB:   supabase.New(cfg.SupabaseURL, cfg.SupabaseAnonKey, cfg.SupabaseServiceKey),
		Tmpl: tmpl,
		Mux:  http.NewServeMux(),
	}
	s.Mux.Handle("/static/", http.FileServerFS(static))
	s.routes()
	return s, nil
}

// Handler returns the root handler with common middleware applied.
func (s *Server) Handler() http.Handler {
	return withLogging(withSecurityHeaders(s.Mux))
}

// ---- helpers shared by handlers ----

// JSON writes a JSON response with the given status.
func (s *Server) JSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(v); err != nil {
		log.Printf("JSON encode error: %v", err)
	}
}

// JSONError writes {"error": msg} with the given status.
func (s *Server) JSONError(w http.ResponseWriter, status int, msg string) {
	s.JSON(w, status, map[string]string{"error": msg})
}

// Render renders a named template with data; 500s on failure.
func (s *Server) Render(w http.ResponseWriter, name string, data any) {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	if err := s.Tmpl.ExecuteTemplate(w, name, data); err != nil {
		log.Printf("template %s: %v", name, err)
		http.Error(w, "internal error", http.StatusInternalServerError)
	}
}

// ---- middleware ----

func withSecurityHeaders(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		h := w.Header()
		h.Set("X-Content-Type-Options", "nosniff")
		h.Set("X-Frame-Options", "DENY")
		h.Set("Referrer-Policy", "strict-origin-when-cross-origin")
		next.ServeHTTP(w, r)
	})
}

func withLogging(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		next.ServeHTTP(w, r)
		log.Printf("%s %s", r.Method, r.URL.Path)
	})
}
