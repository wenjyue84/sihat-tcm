package server

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"math"
	"mime"
	"net/http"
	"strconv"
	"strings"
	"time"
	"unicode/utf8"
)

// Input limits for the auth endpoints. The name ends up in the user metadata
// (and therefore the JWT), so an unbounded name can overflow request headers.
const (
	maxEmailLen     = 254
	minPasswordLen  = 8
	maxPasswordLen  = 128
	maxNameLen      = 100
	maxSpecialtyLen = 100
	maxBioLen       = 2000
)

// isJSONContentType reports whether the request declares a JSON body.
func isJSONContentType(r *http.Request) bool {
	mt, _, err := mime.ParseMediaType(r.Header.Get("Content-Type"))
	return err == nil && (mt == "application/json" || strings.HasSuffix(mt, "+json"))
}

// requireJSON writes 415 and returns false unless the request is application/json.
// Rejecting text/plain and form content types closes the cross-site "simple
// request" route (login CSRF): browsers cannot send JSON cross-origin without
// a CORS preflight.
func requireJSON(w http.ResponseWriter, r *http.Request) bool {
	if isJSONContentType(r) {
		return true
	}
	dtWriteError(w, http.StatusUnsupportedMediaType, "Content-Type must be application/json")
	return false
}

// dtWriteError writes {"error": msg} as application/json.
func dtWriteError(w http.ResponseWriter, status int, msg string) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(map[string]string{"error": msg})
}

// dtReadJSON decodes the request body into v; writes a JSON 400 (or 413 when
// the body exceeded the size cap) and returns false on error.
func dtReadJSON(w http.ResponseWriter, r *http.Request, v any) bool {
	if err := decodeJSONBody(r.Body, v); err != nil {
		var tooBig *http.MaxBytesError
		if errors.As(err, &tooBig) {
			dtWriteError(w, http.StatusRequestEntityTooLarge, "request body too large")
			return false
		}
		dtWriteError(w, http.StatusBadRequest, "invalid JSON body")
		return false
	}
	return true
}

// dtNowISO returns the current UTC time in RFC3339 format.
func dtNowISO() string {
	return time.Now().UTC().Format(time.RFC3339)
}

// dtSetAuthCookie writes the Supabase access-token cookie. Secure is set in
// production or whenever the request itself arrived over HTTPS.
func (s *Server) dtSetAuthCookie(w http.ResponseWriter, r *http.Request, token string, maxAge int) {
	c := &http.Cookie{
		Name:     "sb-access-token",
		Value:    token,
		Path:     "/",
		HttpOnly: true,
		MaxAge:   maxAge,
		SameSite: http.SameSiteLaxMode,
	}
	if s.Cfg.Env == "production" || isHTTPS(r) {
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
	if !requireJSON(w, r) {
		return
	}
	var body struct {
		Email string `json:"email"`
	}
	if !dtReadJSON(w, r, &body) {
		return
	}

	if e := normalizeEmail(body.Email); e != "" && len(e) <= maxEmailLen {
		ctx, cancel := context.WithTimeout(r.Context(), 15*time.Second)
		defer cancel()
		redirectTo := strings.TrimRight(s.Cfg.PublicBaseURL, "/") + "/reset-password"
		if err := s.DB.RequestPasswordReset(ctx, e, redirectTo); err != nil {
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
	if !requireJSON(w, r) {
		return
	}
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
	if msg := validatePassword(body.Password); msg != "" {
		s.JSONError(w, http.StatusBadRequest, msg)
		return
	}
	if body.TokenHash == "" && body.AccessToken == "" {
		s.JSONError(w, http.StatusBadRequest, "token_hash or access_token is required")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 15*time.Second)
	defer cancel()

	var accessToken string
	if body.TokenHash != "" {
		sess, err := s.DB.VerifyRecovery(ctx, body.TokenHash)
		if err != nil {
			log.Printf("auth/reset-password verify: %v", err)
			if dbBackendDown(err) {
				s.JSONError(w, http.StatusServiceUnavailable, "service temporarily unavailable, please try again")
				return
			}
			s.JSONError(w, http.StatusBadRequest, "invalid or expired reset link")
			return
		}
		accessToken = sess.AccessToken
	} else {
		// A session issued by recovery carries amr=recovery/otp. An ORDINARY login/signup session must never work
		// as a "recovery proof": whoever held a session token for a moment could otherwise set a new password
		// permanently without the old one or any e-mailed link.
		accessToken = body.AccessToken
		if !jwtHasAMR(accessToken, "recovery", "otp") {
			s.JSONError(w, http.StatusBadRequest, "invalid or expired reset link")
			return
		}
	}

	if err := s.DB.UpdatePassword(ctx, accessToken, body.Password); err != nil {
		log.Printf("auth/reset-password update: %v", err)
		if dbBackendDown(err) {
			s.JSONError(w, http.StatusServiceUnavailable, "service temporarily unavailable, please try again")
			return
		}
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
	if !requireJSON(w, r) {
		return
	}
	var body struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if !dtReadJSON(w, r, &body) {
		return
	}
	body.Email = normalizeEmail(body.Email)
	if body.Email == "" || body.Password == "" {
		s.JSONError(w, http.StatusBadRequest, "email and password are required")
		return
	}
	if len(body.Email) > maxEmailLen || len(body.Password) > maxPasswordLen {
		s.JSONError(w, http.StatusBadRequest, "invalid credentials")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 15*time.Second)
	defer cancel()

	// Per-account throttle: the per-IP limit cannot stop one account being guessed from many addresses.
	if wait := acctLockedFor(body.Email); wait > 0 {
		w.Header().Set("Retry-After", strconv.Itoa(int(wait/time.Second)+1))
		s.JSONError(w, http.StatusTooManyRequests, "too many failed sign-in attempts for this account; try again later")
		return
	}

	sess, err := s.DB.SignInPassword(ctx, body.Email, body.Password)
	if err != nil {
		log.Printf("auth/login: %v", err)
		if dbBackendDown(err) {
			// the database / identity service is unreachable: that is OUR fault, not a wrong password
			s.JSONError(w, http.StatusServiceUnavailable, "service temporarily unavailable, please try again")
			return
		}
		acctFailure(body.Email, clientIP(r))
		s.JSONError(w, http.StatusUnauthorized, "invalid credentials")
		return
	}
	acctSuccess(body.Email)

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

	s.dtSetAuthCookie(w, r, sess.AccessToken, sess.ExpiresIn)
	s.JSON(w, http.StatusOK, map[string]any{
		"success": true,
		"user":    map[string]string{"id": u.ID, "email": u.Email},
		"role":    role,
	})
}

// handleAuthSignup registers a new user, upserts a profile row, sets the cookie.
func (s *Server) handleAuthSignup(w http.ResponseWriter, r *http.Request) {
	if !requireJSON(w, r) {
		return
	}
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
	body.Email = normalizeEmail(body.Email)
	rawName := body.Name
	body.Name = strings.TrimSpace(body.Name)
	body.Specialty = strings.TrimSpace(body.Specialty)
	body.Bio = strings.TrimSpace(body.Bio)
	if body.Email == "" || body.Password == "" {
		s.JSONError(w, http.StatusBadRequest, "email and password are required")
		return
	}
	if !validEmail(body.Email) {
		s.JSONError(w, http.StatusBadRequest, "a valid email address (plain ASCII, at most 254 characters) is required")
		return
	}
	if rawName != "" && body.Name == "" {
		s.JSONError(w, http.StatusBadRequest, "name must not be blank")
		return
	}
	if hasUnsafeRunes(body.Name, false) || hasUnsafeRunes(body.Specialty, false) || hasUnsafeRunes(body.Bio, true) {
		s.JSONError(w, http.StatusBadRequest, "name, specialty and bio must not contain control or invisible formatting characters")
		return
	}
	if msg := validatePassword(body.Password); msg != "" {
		s.JSONError(w, http.StatusBadRequest, msg)
		return
	}
	if utf8.RuneCountInString(body.Name) > maxNameLen {
		s.JSONError(w, http.StatusBadRequest, "name must be at most 100 characters")
		return
	}
	if utf8.RuneCountInString(body.Specialty) > maxSpecialtyLen {
		s.JSONError(w, http.StatusBadRequest, "specialty must be at most 100 characters")
		return
	}
	if utf8.RuneCountInString(body.Bio) > maxBioLen {
		s.JSONError(w, http.StatusBadRequest, "bio must be at most 2000 characters")
		return
	}
	years, yearsOK := parseYears(body.YearsExperience)
	if !yearsOK {
		s.JSONError(w, http.StatusBadRequest, "yearsExperience must be a number between 0 and 80")
		return
	}

	// Only patient/doctor self-registration is allowed (admin/developer are
	// seeded); any other requested role silently becomes patient.
	role := "patient"
	if strings.EqualFold(strings.TrimSpace(body.Role), "doctor") {
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
		log.Printf("signup failed: %v", err)
		if dbBackendDown(err) {
			s.JSONError(w, http.StatusServiceUnavailable, "service temporarily unavailable, please try again")
			return
		}
		s.JSONError(w, http.StatusBadRequest, signupErrorMessage(err))
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
			// A self-registered doctor is NOT approved: the doctor-only APIs (the master inbox of every patient's
			// record, replies, flags, treatment plans) and the public directory need profiles.is_approved, which an
			// admin grants (POST /api/admin/doctors/approve). Demo doctors are seeded as approved.
			profileRow["is_approved"] = false
			if body.Specialty != "" {
				profileRow["specialty"] = body.Specialty
			}
			if body.Bio != "" {
				profileRow["bio"] = body.Bio
			}
			if years != nil {
				profileRow["years_experience"] = years
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
	s.dtSetAuthCookie(w, r, sess.AccessToken, maxAge)
	s.JSON(w, http.StatusOK, map[string]any{
		"success": true,
		"user":    map[string]string{"id": u.ID, "email": u.Email},
		"role":    role,
	})
}

// handleAuthLogout clears the auth cookie.
func (s *Server) handleAuthLogout(w http.ResponseWriter, r *http.Request) {
	// Expiring the cookie is not enough: a copied access token stays valid for its whole hour. Remember it as revoked.
	revokeToken(BearerToken(r))
	http.SetCookie(w, &http.Cookie{
		Name:     "sb-access-token",
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		Secure:   s.Cfg.Env == "production" || isHTTPS(r),
		SameSite: http.SameSiteLaxMode,
		MaxAge:   -1,
	})
	s.JSON(w, http.StatusOK, map[string]bool{"success": true})
}

// handleAuthMe returns the authenticated user's id, email, and role.
func (s *Server) handleAuthMe(w http.ResponseWriter, r *http.Request, user *AuthUser) {
	s.JSON(w, http.StatusOK, map[string]any{
		"user": map[string]any{
			"id":          user.ID,
			"email":       user.Email,
			"role":        user.Role,
			"is_approved": user.Approved,
		},
	})
}

// normalizeEmail trims and lowercases an email address.
func normalizeEmail(e string) string {
	return strings.ToLower(strings.TrimSpace(e))
}

// validatePassword returns a user-facing error message, or "" if the password is acceptable.
func validatePassword(p string) string {
	switch {
	case strings.TrimSpace(p) == "":
		return "password must not be blank"
	case len(p) < minPasswordLen:
		return "password must be at least 8 characters"
	case len(p) > maxPasswordLen:
		return "password must be at most 128 characters"
	}
	return ""
}

// parseYears validates the optional yearsExperience field (a number or a
// numeric string, 0-80). It returns (nil, true) when absent.
func parseYears(v any) (any, bool) {
	var f float64
	switch x := v.(type) {
	case nil:
		return nil, true
	case float64:
		f = x
	case string:
		x = strings.TrimSpace(x)
		if x == "" {
			return nil, true
		}
		n, err := strconv.ParseFloat(x, 64)
		if err != nil {
			return nil, false
		}
		f = n
	default:
		return nil, false
	}
	if math.IsNaN(f) || math.IsInf(f, 0) || f < 0 || f > 80 {
		return nil, false
	}
	return int(f), true
}

// signupErrorMessage maps an auth-provider failure to a user-safe message. The raw error can embed the
// provider URL / network details, so it is logged server-side and never returned.
func signupErrorMessage(err error) string {
	m := strings.ToLower(err.Error())
	switch {
	case strings.Contains(m, "already registered"), strings.Contains(m, "user_already_exists"), strings.Contains(m, "already been registered"):
		return "signup failed: this email is already registered"
	case strings.Contains(m, "weak_password"), strings.Contains(m, "at least"):
		return "signup failed: password is too weak"
	case strings.Contains(m, "validate email"), strings.Contains(m, "invalid format"), strings.Contains(m, "email_address_invalid"):
		return "signup failed: invalid email address"
	default:
		return "signup failed: please try again later"
	}
}
