// Package server wires up the HTTP mux, templates, and shared dependencies.
package server

import (
	"embed"
	"encoding/json"
	"html/template"
	"io"
	"io/fs"
	"log"
	"net/http"
	"path"
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
	// Static is the embedded static tree (paths like "static/css/app.css"); handlers read build-time data
	// from it (e.g. the /demo screenshot manifest). May be nil in tests.
	Static fs.FS
}

// assetVersion is stamped once at process start. Because a deploy = a new
// process, it changes on every deploy, which cache-busts static assets behind
// Cloudflare (the HTML is served DYNAMIC, so new ?v=… URLs are fetched fresh).
var assetVersion = strconv.FormatInt(time.Now().Unix(), 10)

// publicBase is Config.PublicBaseURL, set in New, used by the absasset template func.
var publicBase string

// templateFuncs is the FuncMap every page template is parsed with.
func templateFuncs() template.FuncMap {
	return template.FuncMap{
		// asset appends the build version so browsers/Cloudflare fetch fresh
		// JS/CSS after each deploy instead of a stale cached copy.
		"asset": func(p string) string {
			if strings.Contains(p, "?") {
				return p + "&v=" + assetVersion
			}
			return p + "?v=" + assetVersion
		},
		// absasset is asset with the public origin in front: og:image / twitter:image must be absolute URLs.
		"absasset": func(p string) string {
			sep := "?v="
			if strings.Contains(p, "?") {
				sep = "&v="
			}
			return strings.TrimRight(publicBase, "/") + p + sep + assetVersion
		},
		// year is the current calendar year for the footer copyright (it was hard-coded to 2025).
		"year": func() int { return time.Now().Year() },
		// pair builds the bilingual (zh, en) value the /demo template renders as two switchable spans.
		"pair": func(zh, en string) demoBi { return demoBi{ZH: zh, EN: en} },
	}
}

// New builds a Server from config plus embedded templates/static assets.
func New(cfg *config.Config, templates embed.FS, static embed.FS) (*Server, error) {
	publicBase = cfg.PublicBaseURL
	tmpl, err := template.New("").Funcs(templateFuncs()).ParseFS(templates, "templates/*.html")
	if err != nil {
		return nil, err
	}
	ai := gemini.New(cfg.GeminiAPIKey)
	ai.BaseURL = cfg.AIBaseURL
	if cfg.AIBaseURL != "" {
		// local Claude models (sihat-listener) generate a full report in 60-170s, not Gemini's ~8s
		ai.HTTP.Timeout = 300 * time.Second
	}
	s := &Server{
		Cfg:  cfg,
		AI:   ai,
		DB:   supabase.New(cfg.SupabaseURL, cfg.SupabaseAnonKey, cfg.SupabaseServiceKey),
		Tmpl: tmpl,
		Mux:  http.NewServeMux(),

		Static: static,
	}
	s.Mux.Handle("/static/", staticHandler(static))
	s.routes()
	return s, nil
}

// Handler returns the root handler with common middleware applied.
func (s *Server) Handler() http.Handler {
	return withLogging(withSecurityHeaders(withNotFoundPage(withBodyLimit(s.Mux))))
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
		// The UI builds HTML with innerHTML from user/AI data and ships inline scripts, so a script-src policy would
		// need a rewrite of every page; these directives are the part that is safe to enforce today and cut the
		// common escalation paths (framing, plugins, <base> hijack, form posts to other origins).
		h.Set("Content-Security-Policy", "frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'")
		// The wizard uses camera + microphone, and Web Bluetooth links heart-rate straps / BLE cuffs (static/js/health-connect.js); nothing uses geolocation.
		h.Set("Permissions-Policy", "camera=(self), microphone=(self), bluetooth=(self), geolocation=()")
		if isHTTPS(r) {
			h.Set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
		}
		next.ServeHTTP(w, r)
	})
}

// logSafe makes a client-supplied string safe to write as ONE log line (no CR/LF/control characters).
func logSafe(s string) string {
	return strings.Map(func(r rune) rune {
		if r < 0x20 || r == 0x7f {
			return '?'
		}
		return r
	}, s)
}

func withLogging(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		next.ServeHTTP(w, r)
		// EscapedPath, not Path: the decoded path of GET /x%0AFORGED... would start a new, attacker-written log line.
		log.Printf("%s %s", logSafe(r.Method), logSafe(r.URL.EscapedPath()))
	})
}

// notFoundHTML is what a browser navigation to an unknown URL gets instead of the bare text "404 page not found".
const notFoundHTML = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Page not found — Sihat TCM</title>
<style>body{margin:0;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;background:#fdfbf2;color:#1f2937;display:flex;min-height:100vh;align-items:center;justify-content:center}
main{max-width:30rem;padding:2rem;text-align:center}h1{font-size:3.5rem;margin:0;color:#047857}p{line-height:1.6}
a{color:#047857}.btn{display:inline-block;margin:.5rem .4rem;padding:.65rem 1.2rem;border-radius:.6rem;background:#047857;color:#fff;text-decoration:none;font-weight:600}
img{display:block;width:100%;max-width:300px;height:auto;margin:0 auto 1rem;border-radius:1rem}</style>
</head><body><main><img src="/static/img/art/notfound.webp" width="900" height="700" alt="" aria-hidden="true" decoding="async"><h1>404</h1><p>We couldn't find that page. It may have moved, or the link may be mistyped.<br>找不到该页面 · Halaman tidak dijumpai</p>
<p><a class="btn" href="/">Back to home</a><a href="/login">Sign in</a></p></main></body></html>
`

// notFoundWriter swaps net/http's plain-text 404 body for notFoundHTML.
type notFoundWriter struct {
	http.ResponseWriter
	wrote, swallow bool
}

func (n *notFoundWriter) WriteHeader(code int) {
	if n.wrote {
		return
	}
	n.wrote = true
	if code == http.StatusNotFound && strings.HasPrefix(n.Header().Get("Content-Type"), "text/plain") {
		n.swallow = true
		n.Header().Set("Content-Type", "text/html; charset=utf-8")
		n.Header().Del("Content-Length")
		n.ResponseWriter.WriteHeader(code)
		_, _ = io.WriteString(n.ResponseWriter, notFoundHTML)
		return
	}
	n.ResponseWriter.WriteHeader(code)
}

func (n *notFoundWriter) Write(b []byte) (int, error) {
	if !n.wrote {
		n.WriteHeader(http.StatusOK)
	}
	if n.swallow {
		return len(b), nil
	}
	return n.ResponseWriter.Write(b)
}

func (n *notFoundWriter) Flush() {
	if f, ok := n.ResponseWriter.(http.Flusher); ok {
		f.Flush()
	}
}

func (n *notFoundWriter) Unwrap() http.ResponseWriter { return n.ResponseWriter }

// withNotFoundPage turns the mux's plain-text 404 into a styled page for browser navigations (GET/HEAD that accept
// text/html, outside /api/). API clients keep the original response.
func withNotFoundPage(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if (r.Method == http.MethodGet || r.Method == http.MethodHead) && strings.Contains(r.Header.Get("Accept"), "text/html") &&
			!strings.HasPrefix(r.URL.Path, "/api/") {
			w = &notFoundWriter{ResponseWriter: w}
		}
		next.ServeHTTP(w, r)
	})
}

// Request body caps. Image/audio/document endpoints carry base64 payloads;
// everything else is small JSON.
const (
	maxBodyDefault = 2 << 20  // 2 MB
	maxBodyUpload  = 30 << 20 // 30 MB
)

var uploadPaths = map[string]bool{
	"/api/analyze-image":     true,
	"/api/analyze-audio":     true,
	"/api/analyze-snore":     true,
	"/api/extract-text":      true,
	"/api/validate-medicine": true,
}

// withBodyLimit bounds request bodies: POST/PUT/PATCH/DELETE with a
// Content-Length over the cap get 413, and the body is wrapped in
// http.MaxBytesReader so chunked uploads are capped too. (The JSON
// Content-Type requirement lives in RequireAuth and the auth handlers, after
// authentication, so anonymous probes still get a plain 401.)
func withBodyLimit(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodPost, http.MethodPut, http.MethodPatch, http.MethodDelete:
			limit := int64(maxBodyDefault)
			if r.URL.Path == "/api/health/apple/import" {
				// Apple Health export.zip: big, and a phone on mobile data is slow. Bounded size and a bounded (long) read deadline.
				limit = maxAppleUpload
				if BearerToken(r) != "" { // only a request that claims a session gets the long deadline
					_ = http.NewResponseController(w).SetReadDeadline(time.Now().Add(10 * time.Minute))
				}
			} else if uploadPaths[r.URL.Path] {
				limit = maxBodyUpload
				// main.go's ReadTimeout (30 s) would cut a slow phone upload of a 30 MB photo/recording: give
				// the upload routes a longer, still bounded, read deadline.
				_ = http.NewResponseController(w).SetReadDeadline(time.Now().Add(3 * time.Minute))
			}
			if r.ContentLength > limit {
				dtWriteError(w, http.StatusRequestEntityTooLarge, "request body too large")
				return
			}
			r.Body = http.MaxBytesReader(w, r.Body, limit)
		}
		next.ServeHTTP(w, r)
	})
}

// staticHandler serves the embedded static assets read-only: GET/HEAD only,
// no directory listings, ETag per build, long-lived caching for versioned
// (?v=) URLs and revalidation otherwise.
func staticHandler(static fs.FS) http.Handler {
	files := http.FileServerFS(static)
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet && r.Method != http.MethodHead {
			w.Header().Set("Allow", "GET, HEAD")
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}
		p := path.Clean(strings.TrimPrefix(r.URL.Path, "/"))
		if strings.HasSuffix(r.URL.Path, "/") {
			http.NotFound(w, r)
			return
		}
		info, err := fs.Stat(static, p)
		if err != nil || info.IsDir() {
			http.NotFound(w, r)
			return
		}
		h := w.Header()
		if r.URL.Query().Get("v") != "" {
			h.Set("Cache-Control", "public, max-age=31536000, immutable")
		} else {
			h.Set("Cache-Control", "no-cache")
		}
		// embed.FS has no mtime; a per-build ETag gives clients a validator.
		h.Set("ETag", `"`+assetVersion+"-"+strconv.FormatInt(info.Size(), 10)+`"`)
		files.ServeHTTP(w, r)
	})
}
