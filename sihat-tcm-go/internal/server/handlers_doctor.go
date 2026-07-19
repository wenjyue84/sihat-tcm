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
	// Guest report save (no auth) — returns a session_token for later migration.
	s.Mux.HandleFunc("POST /api/guest/sessions", s.handleGuestSessionCreate)
}

// handleDoctorsDirectory returns approved doctors for the patient to choose from.
func (s *Server) handleDoctorsDirectory(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 15*time.Second)
	defer cancel()
	var docs []map[string]any
	q := "select=id,full_name,specialty,bio,years_experience,qualification,languages,clinic,avg_response_time&role=eq.doctor&is_approved=eq.true&order=full_name.asc"
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

// handleDoctorRequests lists consultation requests routed to the authed doctor.
func (s *Server) handleDoctorRequests(w http.ResponseWriter, r *http.Request, user *AuthUser) {
	ctx, cancel := context.WithTimeout(r.Context(), 15*time.Second)
	defer cancel()
	var rows []map[string]any
	q := "select=id,user_id,doctor_id,symptoms,status,diagnosis_report,created_at&doctor_id=eq." + user.ID + "&order=created_at.desc&limit=200"
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
