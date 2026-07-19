package server

import (
	"net/http"
)

// pgPageData is the base template data passed to all server-rendered pages.
type pgPageData struct {
	Title string
	User  *AuthUser
}

// registerPageRoutes registers all server-rendered page routes.
// Called from routes() in routes.go — do NOT redefine handleHome here.
func (s *Server) registerPageRoutes() {
	s.Mux.HandleFunc("GET /login", s.handleLoginPage)
	s.Mux.HandleFunc("GET /reset-password", s.handleResetPasswordPage)
	s.Mux.HandleFunc("GET /patient", s.handlePatientPage)
	s.Mux.HandleFunc("GET /doctor", s.handleDoctorPage)
}

// handleResetPasswordPage renders reset-password.html. No auth gate — the user
// arrives here from a recovery email link (the token is validated on submit).
func (s *Server) handleResetPasswordPage(w http.ResponseWriter, r *http.Request) {
	s.Render(w, "reset-password.html", pgPageData{Title: "Reset Password"})
}

// handleLoginPage renders login.html.
// Redirects already-authenticated users to their role dashboard.
func (s *Server) handleLoginPage(w http.ResponseWriter, r *http.Request) {
	user := s.Authenticate(r)
	if user != nil {
		pgRedirectByRole(w, r, user.Role)
		return
	}
	s.Render(w, "login.html", pgPageData{Title: "Sign In"})
}

// handlePatientPage renders patient.html.
// Requires authentication; unauthenticated requests are redirected to /login.
func (s *Server) handlePatientPage(w http.ResponseWriter, r *http.Request) {
	user := s.Authenticate(r)
	if user == nil {
		http.Redirect(w, r, "/login", http.StatusFound)
		return
	}
	s.Render(w, "patient.html", pgPageData{Title: "Health Journey", User: user})
}

// handleDoctorPage renders doctor.html.
// Requires authentication; unauthenticated requests are redirected to /login.
// Any authenticated role may view — the doctor header is cosmetic; the API
// enforces role-scoped access separately.
func (s *Server) handleDoctorPage(w http.ResponseWriter, r *http.Request) {
	user := s.Authenticate(r)
	if user == nil {
		http.Redirect(w, r, "/login", http.StatusFound)
		return
	}
	s.Render(w, "doctor.html", pgPageData{Title: "Doctor Dashboard", User: user})
}

// pgRedirectByRole sends the user to their role-appropriate dashboard.
func pgRedirectByRole(w http.ResponseWriter, r *http.Request, role string) {
	dest := "/patient"
	if role == "doctor" {
		dest = "/doctor"
	}
	http.Redirect(w, r, dest, http.StatusFound)
}
