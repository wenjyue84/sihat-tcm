package server

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"strings"
	"time"
)

// dtReadJSON decodes the request body into v; writes 400 and returns false on error.
func dtReadJSON(w http.ResponseWriter, r *http.Request, v any) bool {
	if err := json.NewDecoder(r.Body).Decode(v); err != nil {
		http.Error(w, `{"error":"invalid JSON body"}`, http.StatusBadRequest)
		return false
	}
	return true
}

// dtNowISO returns the current UTC time in RFC3339 format.
func dtNowISO() string {
	return time.Now().UTC().Format(time.RFC3339)
}

// dtSetAuthCookie writes the Supabase access-token cookie.
func (s *Server) dtSetAuthCookie(w http.ResponseWriter, token string, maxAge int) {
	c := &http.Cookie{
		Name:     "sb-access-token",
		Value:    token,
		Path:     "/",
		HttpOnly: true,
		MaxAge:   maxAge,
		SameSite: http.SameSiteLaxMode,
	}
	if s.Cfg.Env == "production" {
		c.Secure = true
	}
	http.SetCookie(w, c)
}

// registerAuthRoutes mounts cookie-based auth endpoints for the Go frontend.
func (s *Server) registerAuthRoutes() {
	// POST /api/auth/login
	s.Mux.HandleFunc("POST /api/auth/login", s.RateLimit(10, 100, s.handleAuthLogin))

	// POST /api/auth/signup
	s.Mux.HandleFunc("POST /api/auth/signup", s.RateLimit(5, 20, s.handleAuthSignup))

	// POST /api/auth/logout
	s.Mux.HandleFunc("POST /api/auth/logout", s.handleAuthLogout)

	// GET /api/auth/me
	s.Mux.HandleFunc("GET /api/auth/me", s.RequireAuth(s.handleAuthMe))

	// POST /api/auth/forgot-password — sends recovery email (rate-limited, always 200)
	s.Mux.HandleFunc("POST /api/auth/forgot-password", s.RateLimit(3, 10, s.handleForgotPassword))

	// POST /api/auth/reset-password — completes the reset with a recovery token
	s.Mux.HandleFunc("POST /api/auth/reset-password", s.RateLimit(5, 20, s.handleResetPassword))
}

// handleForgotPassword triggers a password-recovery email. It ALWAYS returns
// 200 (even for unknown emails) to prevent account enumeration.
func (s *Server) handleForgotPassword(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Email string `json:"email"`
	}
	if !dtReadJSON(w, r, &body) {
		return
	}

	if strings.TrimSpace(body.Email) != "" {
		ctx, cancel := context.WithTimeout(r.Context(), 15*time.Second)
		defer cancel()
		redirectTo := strings.TrimRight(s.Cfg.PublicBaseURL, "/") + "/reset-password"
		if err := s.DB.RequestPasswordReset(ctx, strings.TrimSpace(body.Email), redirectTo); err != nil {
			// Log but do not surface — response is uniform regardless of outcome.
			log.Printf("auth/forgot-password: %v", err)
		}
	}

	s.JSON(w, http.StatusOK, map[string]any{
		"success": true,
		"message": "If an account exists for that email, a password reset link has been sent.",
	})
}

// handleResetPassword sets a new password from a recovery link. It accepts
// EITHER a token_hash (newer ?token_hash=…&type=recovery links → verified via
// GoTrue /verify) OR an access_token (default links that redirect with a
// session in the URL hash), so both Supabase email-template styles work.
func (s *Server) handleResetPassword(w http.ResponseWriter, r *http.Request) {
	var body struct {
		TokenHash   string `json:"token_hash"`
		AccessToken string `json:"access_token"`
		Password    string `json:"password"`
	}
	if !dtReadJSON(w, r, &body) {
		return
	}
	if body.Password == "" {
		s.JSONError(w, http.StatusBadRequest, "password is required")
		return
	}
	if len(body.Password) < 8 {
		s.JSONError(w, http.StatusBadRequest, "password must be at least 8 characters")
		return
	}
	if body.TokenHash == "" && body.AccessToken == "" {
		s.JSONError(w, http.StatusBadRequest, "token_hash or access_token is required")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 15*time.Second)
	defer cancel()

	accessToken := body.AccessToken
	if accessToken == "" {
		sess, err := s.DB.VerifyRecovery(ctx, body.TokenHash)
		if err != nil {
			log.Printf("auth/reset-password verify: %v", err)
			s.JSONError(w, http.StatusBadRequest, "invalid or expired reset link")
			return
		}
		accessToken = sess.AccessToken
	}

	if err := s.DB.UpdatePassword(ctx, accessToken, body.Password); err != nil {
		log.Printf("auth/reset-password update: %v", err)
		s.JSONError(w, http.StatusBadRequest, "could not update password — the reset link may have expired")
		return
	}

	s.JSON(w, http.StatusOK, map[string]any{
		"success": true,
		"message": "Password updated. You can now sign in with your new password.",
	})
}

// handleAuthLogin signs in with email+password, sets the cookie, returns {success,user,role}.
func (s *Server) handleAuthLogin(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if !dtReadJSON(w, r, &body) {
		return
	}
	if body.Email == "" || body.Password == "" {
		s.JSONError(w, http.StatusBadRequest, "email and password are required")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 15*time.Second)
	defer cancel()

	sess, err := s.DB.SignInPassword(ctx, body.Email, body.Password)
	if err != nil {
		log.Printf("auth/login: %v", err)
		s.JSONError(w, http.StatusUnauthorized, "invalid credentials")
		return
	}

	// Decode user from session
	var u struct {
		ID    string `json:"id"`
		Email string `json:"email"`
	}
	if err := json.Unmarshal(sess.User, &u); err != nil || u.ID == "" {
		s.JSONError(w, http.StatusInternalServerError, "failed to parse user")
		return
	}

	// Fetch role from profiles
	role := "patient"
	var profiles []struct {
		Role string `json:"role"`
	}
	if err := s.DB.Select(ctx, "profiles", "select=role&id=eq."+u.ID, "", &profiles); err == nil && len(profiles) > 0 && profiles[0].Role != "" {
		role = profiles[0].Role
	}

	s.dtSetAuthCookie(w, sess.AccessToken, sess.ExpiresIn)
	s.JSON(w, http.StatusOK, map[string]any{
		"success": true,
		"user":    map[string]string{"id": u.ID, "email": u.Email},
		"role":    role,
	})
}

// handleAuthSignup registers a new user, upserts a profile row, sets the cookie.
func (s *Server) handleAuthSignup(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Email           string `json:"email"`
		Password        string `json:"password"`
		Name            string `json:"name"`
		Role            string `json:"role"` // "patient" (default) | "doctor"
		Specialty       string `json:"specialty"`
		Bio             string `json:"bio"`
		YearsExperience any    `json:"yearsExperience"`
	}
	if !dtReadJSON(w, r, &body) {
		return
	}
	if body.Email == "" || body.Password == "" {
		s.JSONError(w, http.StatusBadRequest, "email and password are required")
		return
	}

	// Only patient/doctor self-registration is allowed (admin/developer are seeded).
	role := "patient"
	if body.Role == "doctor" {
		role = "doctor"
	}

	ctx, cancel := context.WithTimeout(r.Context(), 15*time.Second)
	defer cancel()

	meta := map[string]any{"role": role}
	if body.Name != "" {
		meta["full_name"] = body.Name
	}

	sess, err := s.DB.SignUp(ctx, body.Email, body.Password, meta)
	if err != nil {
		log.Printf("auth/signup: %v", err)
		s.JSONError(w, http.StatusBadRequest, "signup failed: "+err.Error())
		return
	}

	var u struct {
		ID    string `json:"id"`
		Email string `json:"email"`
	}
	if sess.User != nil {
		_ = json.Unmarshal(sess.User, &u)
	}

	// Upsert profile row via service key (empty userToken → service key). Upsert
	// (not insert) so a DB trigger that pre-created the row doesn't clobber role.
	if u.ID != "" {
		profileRow := map[string]any{
			"id":        u.ID,
			"role":      role,
			"full_name": body.Name,
			"email":     u.Email,
		}
		if role == "doctor" {
			// Demo: doctors are auto-approved so the directory shows them immediately.
			profileRow["is_approved"] = true
			if body.Specialty != "" {
				profileRow["specialty"] = body.Specialty
			}
			if body.Bio != "" {
				profileRow["bio"] = body.Bio
			}
			if body.YearsExperience != nil {
				profileRow["years_experience"] = body.YearsExperience
			}
		}
		var ignore []map[string]any
		if err := s.DB.Upsert(ctx, "profiles", profileRow, "", &ignore); err != nil {
			log.Printf("auth/signup: upsert profile: %v", err)
		}
	}

	maxAge := sess.ExpiresIn
	if maxAge == 0 {
		maxAge = 3600
	}
	s.dtSetAuthCookie(w, sess.AccessToken, maxAge)
	s.JSON(w, http.StatusOK, map[string]any{
		"success": true,
		"user":    map[string]string{"id": u.ID, "email": u.Email},
		"role":    role,
	})
}

// handleAuthLogout clears the auth cookie.
func (s *Server) handleAuthLogout(w http.ResponseWriter, r *http.Request) {
	http.SetCookie(w, &http.Cookie{
		Name:     "sb-access-token",
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		MaxAge:   -1,
	})
	s.JSON(w, http.StatusOK, map[string]bool{"success": true})
}

// handleAuthMe returns the authenticated user's id, email, and role.
func (s *Server) handleAuthMe(w http.ResponseWriter, r *http.Request, user *AuthUser) {
	s.JSON(w, http.StatusOK, map[string]any{
		"user": map[string]string{
			"id":    user.ID,
			"email": user.Email,
			"role":  user.Role,
		},
	})
}
