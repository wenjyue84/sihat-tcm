package server

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"log"
	"net/http"
	"time"
)

// registerDoctorRoutes wires the patient↔doctor flow: a public doctor directory
// the patient chooses from, the doctor's inbox of routed records, the patient's
// own consultations (with doctor feedback), and guest report persistence.
func (s *Server) registerDoctorRoutes() {
	// Public directory — patients browse registered doctors and pick one.
	s.Mux.HandleFunc("GET /api/doctors", s.handleDoctorsDirectory)
	// Doctor inbox — consultation requests routed to the authenticated doctor.
	s.Mux.HandleFunc("GET /api/doctor/requests", s.RequireAuth(s.handleDoctorRequests, "doctor"))
	// Patient consultations — the patient's own requests + any doctor replies.
	s.Mux.HandleFunc("GET /api/patient/requests", s.RequireAuth(s.handlePatientRequests))
	// Patient cancels/removes one of their own consultation requests.
	s.Mux.HandleFunc("POST /api/patient/requests/cancel", s.RequireAuth(s.handlePatientRequestCancel))
	// Patient profile — view + save basic profile fields.
	s.Mux.HandleFunc("GET /api/patient/profile", s.RequireAuth(s.handlePatientProfileGet))
	s.Mux.HandleFunc("PUT /api/patient/profile", s.RequireAuth(s.handlePatientProfilePut))
	// Guest report save (no auth) — returns a session_token for later migration.
	s.Mux.HandleFunc("POST /api/guest/sessions", s.handleGuestSessionCreate)
}

// handleDoctorsDirectory returns approved doctors for the patient to choose from.
func (s *Server) handleDoctorsDirectory(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 15*time.Second)
	defer cancel()
	var docs []map[string]any
	q := "select=id,full_name,email,specialty,bio,years_experience,qualification,languages,clinic,avg_response_time&role=eq.doctor&is_approved=eq.true&order=full_name.asc"
	if err := s.DB.Select(ctx, "profiles", q, "", &docs); err != nil {
		log.Printf("doctors directory: %v", err)
		s.JSONError(w, http.StatusInternalServerError, "failed to load doctors")
		return
	}
	if docs == nil {
		docs = []map[string]any{}
	}
	s.JSON(w, http.StatusOK, map[string]any{"doctors": docs})
}

// handleDoctorRequests lists consultation requests. /doctor is a MASTER inbox:
// any authenticated doctor sees ALL patient requests (each still shows which
// doctor the patient selected), so a single doctor can triage everything.
func (s *Server) handleDoctorRequests(w http.ResponseWriter, r *http.Request, user *AuthUser) {
	ctx, cancel := context.WithTimeout(r.Context(), 15*time.Second)
	defer cancel()
	var rows []map[string]any
	q := "select=id,user_id,doctor_id,symptoms,status,diagnosis_report,created_at&order=created_at.desc&limit=300"
	if err := s.DB.Select(ctx, "inquiries", q, "", &rows); err != nil {
		log.Printf("doctor/requests: %v", err)
		s.JSONError(w, http.StatusInternalServerError, "failed to load requests")
		return
	}
	if rows == nil {
		rows = []map[string]any{}
	}
	s.JSON(w, http.StatusOK, map[string]any{"requests": rows})
}

// handlePatientRequests lists the patient's own consultation requests + replies.
func (s *Server) handlePatientRequests(w http.ResponseWriter, r *http.Request, user *AuthUser) {
	ctx, cancel := context.WithTimeout(r.Context(), 15*time.Second)
	defer cancel()
	var rows []map[string]any
	q := "select=id,doctor_id,symptoms,status,diagnosis_report,created_at&user_id=eq." + user.ID + "&order=created_at.desc&limit=100"
	if err := s.DB.Select(ctx, "inquiries", q, "", &rows); err != nil {
		log.Printf("patient/requests: %v", err)
		s.JSONError(w, http.StatusInternalServerError, "failed to load consultations")
		return
	}
	if rows == nil {
		rows = []map[string]any{}
	}
	s.JSON(w, http.StatusOK, map[string]any{"requests": rows})
}

// handlePatientRequestCancel deletes one of the patient's OWN consultation
// requests (ownership enforced by user_id).
func (s *Server) handlePatientRequestCancel(w http.ResponseWriter, r *http.Request, user *AuthUser) {
	var body struct {
		ID string `json:"id"`
	}
	if !dtReadJSON(w, r, &body) {
		return
	}
	if body.ID == "" {
		s.JSONError(w, http.StatusBadRequest, "id is required")
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 15*time.Second)
	defer cancel()

	var rows []struct {
		UserID string `json:"user_id"`
	}
	if err := s.DB.Select(ctx, "inquiries", "select=user_id&id=eq."+body.ID, "", &rows); err != nil || len(rows) == 0 {
		s.JSONError(w, http.StatusNotFound, "request not found")
		return
	}
	if rows[0].UserID != user.ID {
		s.JSONError(w, http.StatusForbidden, "you can only cancel your own request")
		return
	}
	if err := s.DB.Delete(ctx, "inquiries", "id=eq."+body.ID, ""); err != nil {
		log.Printf("patient/requests/cancel: %v", err)
		s.JSONError(w, http.StatusInternalServerError, "failed to cancel request")
		return
	}
	s.JSON(w, http.StatusOK, map[string]any{"success": true})
}

// handlePatientProfileGet returns the patient's basic profile.
func (s *Server) handlePatientProfileGet(w http.ResponseWriter, r *http.Request, user *AuthUser) {
	ctx, cancel := context.WithTimeout(r.Context(), 15*time.Second)
	defer cancel()
	var rows []map[string]any
	q := "select=full_name,age,gender,height,weight,bmi,medical_history,preferred_language&id=eq." + user.ID
	if err := s.DB.Select(ctx, "profiles", q, "", &rows); err != nil {
		log.Printf("patient/profile get: %v", err)
		s.JSONError(w, http.StatusInternalServerError, "failed to load profile")
		return
	}
	profile := map[string]any{}
	if len(rows) > 0 {
		profile = rows[0]
	}
	profile["email"] = user.Email
	profile["role"] = user.Role
	s.JSON(w, http.StatusOK, map[string]any{"profile": profile})
}

// handlePatientProfilePut saves the patient's basic profile fields.
func (s *Server) handlePatientProfilePut(w http.ResponseWriter, r *http.Request, user *AuthUser) {
	var body struct {
		FullName          string `json:"full_name"`
		Age               any    `json:"age"`
		Gender            string `json:"gender"`
		Height            any    `json:"height"`
		Weight            any    `json:"weight"`
		BMI               any    `json:"bmi"`
		MedicalHistory    string `json:"medical_history"`
		PreferredLanguage string `json:"preferred_language"`
	}
	if !dtReadJSON(w, r, &body) {
		return
	}
	upd := map[string]any{"id": user.ID}
	if body.FullName != "" {
		upd["full_name"] = body.FullName
	}
	if body.Age != nil {
		upd["age"] = body.Age
	}
	if body.Gender != "" {
		upd["gender"] = body.Gender
	}
	if body.Height != nil {
		upd["height"] = body.Height
	}
	if body.Weight != nil {
		upd["weight"] = body.Weight
	}
	if body.BMI != nil {
		upd["bmi"] = body.BMI
	}
	if body.MedicalHistory != "" {
		upd["medical_history"] = body.MedicalHistory
	}
	if body.PreferredLanguage != "" {
		upd["preferred_language"] = body.PreferredLanguage
	}

	ctx, cancel := context.WithTimeout(r.Context(), 15*time.Second)
	defer cancel()
	var ignore []map[string]any
	if err := s.DB.Upsert(ctx, "profiles", upd, "", &ignore); err != nil {
		log.Printf("patient/profile put: %v", err)
		s.JSONError(w, http.StatusInternalServerError, "failed to save profile")
		return
	}
	s.JSON(w, http.StatusOK, map[string]any{"success": true})
}

// handleGuestSessionCreate persists a guest diagnosis report and returns a
// session_token the client stores to migrate the report after registering.
func (s *Server) handleGuestSessionCreate(w http.ResponseWriter, r *http.Request) {
	var payload map[string]any
	if !dtReadJSON(w, r, &payload) {
		return
	}
	dtNormalizeSymptoms(payload)
	token, err := randToken(16)
	if err != nil {
		s.JSONError(w, http.StatusInternalServerError, "failed to create token")
		return
	}
	payload["session_token"] = token
	delete(payload, "id") // never let the client set the primary key

	ctx, cancel := context.WithTimeout(r.Context(), 15*time.Second)
	defer cancel()
	var inserted []map[string]any
	if err := s.DB.Insert(ctx, "guest_diagnosis_sessions", payload, "", &inserted); err != nil {
		log.Printf("guest/sessions create: %v", err)
		s.JSONError(w, http.StatusInternalServerError, "failed to save guest session")
		return
	}
	s.JSON(w, http.StatusCreated, map[string]any{"success": true, "session_token": token})
}

// randToken returns a hex-encoded cryptographically-random token of n bytes.
func randToken(n int) (string, error) {
	b := make([]byte, n)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}
