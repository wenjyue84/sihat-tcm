package server

import "net/http"

// routes registers all HTTP routes. Handler implementations live in the
// handlers_*.go files in this package.
func (s *Server) routes() {
	// Health
	s.Mux.HandleFunc("GET /healthz", s.handleHealthz)
	s.Mux.HandleFunc("GET /api/health", s.handleHealthz)

	// Pages (server-rendered)
	s.Mux.HandleFunc("GET /{$}", s.handleHome)
	s.registerPageRoutes()

	// API routes by group.
	s.registerAIRoutes()
	s.registerAnalysisRoutes()
	s.registerSummaryRoutes()
	s.registerAuthRoutes()
	s.registerDataRoutes()
	s.registerDoctorRoutes()
	s.registerNotificationRoutes()
	s.registerAdminRoutes()
}

func (s *Server) handleHealthz(w http.ResponseWriter, r *http.Request) {
	s.JSON(w, http.StatusOK, map[string]any{
		"status":  "ok",
		"service": "sihat-tcm-go",
		"env":     s.Cfg.Env,
		"ai":      s.AI.APIKey != "",
		"db":      s.DB.Configured(),
	})
}

func (s *Server) handleHome(w http.ResponseWriter, r *http.Request) {
	s.Render(w, "home.html", map[string]any{"Title": "Sihat TCM"})
}
