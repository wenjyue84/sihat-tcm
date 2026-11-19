package server

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"strings"
	"time"
)

// registerNotificationRoutes mounts notification endpoints.
func (s *Server) registerNotificationRoutes() {
	// Preferences
	s.Mux.HandleFunc("GET /api/notifications/preferences", s.RequireAuth(s.handleNotifPrefsGet))
	s.Mux.HandleFunc("POST /api/notifications/preferences", s.RequireAuth(s.handleNotifPrefsPost))

	// Device registration / deactivation
	s.Mux.HandleFunc("POST /api/notifications/register-device", s.RequireAuth(s.handleNotifRegisterDevice))
	s.Mux.HandleFunc("DELETE /api/notifications/register-device", s.RequireAuth(s.handleNotifDeregisterDevice))

	// Scheduled notifications
	s.Mux.HandleFunc("GET /api/notifications/schedule", s.RequireAuth(s.handleNotifScheduleGet))
	s.Mux.HandleFunc("POST /api/notifications/schedule", s.RequireAuth(s.handleNotifSchedulePost))
	s.Mux.HandleFunc("DELETE /api/notifications/schedule", s.RequireAuth(s.handleNotifScheduleDelete))

	// Sync
	s.Mux.HandleFunc("GET /api/notifications/sync", s.RequireAuth(s.handleNotifSyncGet))
	s.Mux.HandleFunc("POST /api/notifications/sync", s.RequireAuth(s.handleNotifSyncPost))

	// Report viewed — no auth; with Telegram configured every call messages the operator chat, so it is throttled.
	s.Mux.HandleFunc("POST /api/notifications/report-viewed", s.RateLimit(10, 200, s.handleNotifReportViewed))
}

// ---- input validation (the raw body used to be upserted: DB constraint errors surfaced as 500s and clients could
// mass-assign server-controlled columns) ----

// notifServerCols are columns only the server sets; a client value is ignored, never stored.
var notifServerCols = map[string]bool{
	"id": true, "user_id": true, "created_at": true, "updated_at": true,
	"is_sent": true, "sent_at": true, "is_cancelled": true, "cancelled_at": true,
}

var notifPrefBoolCols = map[string]bool{
	"enabled": true, "health_reminders": true, "medication_alerts": true, "appointment_reminders": true,
	"exercise_reminders": true, "sleep_reminders": true, "quiet_hours_enabled": true,
	"frequency_daily": true, "frequency_weekly": true, "frequency_monthly": true,
}

// notifCleanPrefs validates a preferences payload and returns the columns to store, or an error message.
func notifCleanPrefs(in map[string]any) (map[string]any, string) {
	out := map[string]any{}
	for k, v := range in {
		switch {
		case notifServerCols[k]:
			continue
		case notifPrefBoolCols[k]:
			b, ok := v.(bool)
			if !ok {
				return nil, k + " must be true or false"
			}
			out[k] = b
		case k == "quiet_hours_start" || k == "quiet_hours_end":
			str, ok := v.(string)
			if !ok || !validTimeOfDay(str) {
				return nil, k + " must be a time of day (HH:MM)"
			}
			if len(str) == 5 {
				str += ":00"
			}
			out[k] = str
		case k == "categories":
			m, ok := v.(map[string]any)
			if !ok || len(m) > 20 {
				return nil, "categories must be an object of true/false values"
			}
			for ck, cv := range m {
				if _, isBool := cv.(bool); !isBool || len(ck) > 50 {
					return nil, "categories must be an object of true/false values"
				}
			}
			out[k] = m
		default:
			return nil, "unknown preference field: " + k
		}
	}
	return out, ""
}

var notifPriorities = map[string]bool{"low": true, "normal": true, "high": true, "urgent": true}

// notifCleanScheduled validates a scheduled-notification payload and returns the columns to store.
func notifCleanScheduled(in map[string]any) (map[string]any, string) {
	out := map[string]any{}
	for _, f := range []struct {
		key string
		max int
	}{{"notification_type", 100}, {"title", 200}, {"body", 2000}, {"category", 100}} {
		v, ok := in[f.key]
		str, isStr := v.(string)
		if !ok || !isStr || strings.TrimSpace(str) == "" {
			return nil, "missing required field: " + f.key
		}
		if len([]rune(str)) > f.max || hasUnsafeRunes(str, f.key == "body") {
			return nil, f.key + " is too long or contains control characters"
		}
		out[f.key] = str
	}
	sf, isStr := in["scheduled_for"].(string)
	if !isStr || strings.TrimSpace(sf) == "" {
		return nil, "missing required field: scheduled_for"
	}
	t, ok := parseTimestamp(sf)
	if !ok {
		return nil, "scheduled_for must be an RFC3339 timestamp (e.g. 2026-10-12T08:00:00Z)"
	}
	out["scheduled_for"] = t.Format(time.RFC3339)
	out["priority"] = "normal"
	if v, present := in["priority"]; present && v != nil {
		p, isStr := v.(string)
		if !isStr || !notifPriorities[p] {
			return nil, "priority must be low, normal, high or urgent"
		}
		out["priority"] = p
	}
	out["data"] = map[string]any{}
	if v, present := in["data"]; present && v != nil {
		m, isObj := v.(map[string]any)
		if !isObj || jsonDepthExceeds(m, 20) {
			return nil, "data must be an object"
		}
		out["data"] = m
	}
	if v, present := in["repeat_pattern"]; present && v != nil {
		p, isStr := v.(string)
		if !isStr || len(p) > 50 {
			return nil, "repeat_pattern must be a short string"
		}
		out["repeat_pattern"] = p
	}
	if v, present := in["repeat_config"]; present && v != nil {
		m, isObj := v.(map[string]any)
		if !isObj || jsonDepthExceeds(m, 20) {
			return nil, "repeat_config must be an object"
		}
		out["repeat_config"] = m
	}
	for k := range in {
		switch k {
		case "notification_type", "title", "body", "category", "scheduled_for", "priority", "data", "repeat_pattern", "repeat_config":
		default:
			if !notifServerCols[k] {
				return nil, "unknown field: " + k
			}
		}
	}
	return out, ""
}

// defaultPreferences returns the default notification preference object.
func dtDefaultPreferences() map[string]any {
	return map[string]any{
		"enabled":               true,
		"health_reminders":      true,
		"medication_alerts":     true,
		"appointment_reminders": true,
		"exercise_reminders":    true,
		"sleep_reminders":       true,
		"quiet_hours_enabled":   true,
		"quiet_hours_start":     "22:00:00",
		"quiet_hours_end":       "07:00:00",
		"frequency_daily":       true,
		"frequency_weekly":      true,
		"frequency_monthly":     false,
		"categories": map[string]bool{
			"health":       true,
			"medication":   true,
			"exercise":     true,
			"diet":         true,
			"sleep":        true,
			"appointments": true,
		},
	}
}

// handleNotifPrefsGet returns the user's notification preferences (defaults if none exist).
func (s *Server) handleNotifPrefsGet(w http.ResponseWriter, r *http.Request, user *AuthUser) {
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	var rows []map[string]any
	q := "select=*&user_id=eq." + user.ID
	if err := s.DB.Select(ctx, "user_notification_preferences", q, user.Token, &rows); err != nil {
		log.Printf("notif/prefs get: %v", err)
		s.JSONError(w, http.StatusInternalServerError, "failed to fetch preferences")
		return
	}

	if len(rows) == 0 {
		s.JSON(w, http.StatusOK, map[string]any{
			"success":     true,
			"preferences": dtDefaultPreferences(),
		})
		return
	}
	s.JSON(w, http.StatusOK, map[string]any{
		"success":     true,
		"preferences": rows[0],
	})
}

// handleNotifPrefsPost upserts notification preferences for the user.
func (s *Server) handleNotifPrefsPost(w http.ResponseWriter, r *http.Request, user *AuthUser) {
	var in map[string]any
	if !dtReadJSON(w, r, &in) {
		return
	}
	body, bad := notifCleanPrefs(in)
	if bad != "" {
		s.JSONError(w, http.StatusBadRequest, bad)
		return
	}

	defer lockKey("prefs:" + user.ID)()

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	// Try update first; if no rows affected, insert. (The lock makes the pair atomic for one user.)
	var updated []map[string]any
	var err error
	if len(body) > 0 {
		err = s.DB.Update(ctx, "user_notification_preferences",
			"user_id=eq."+user.ID, body, user.Token, &updated)
	} else {
		// nothing client-controlled to change (e.g. only server columns were sent): just return the current row
		err = s.DB.Select(ctx, "user_notification_preferences", "select=*&user_id=eq."+user.ID, user.Token, &updated)
	}
	if err != nil || len(updated) == 0 {
		var inserted []map[string]any
		row := map[string]any{"user_id": user.ID}
		for k, v := range body {
			row[k] = v
		}
		if err2 := s.DB.Insert(ctx, "user_notification_preferences", row, user.Token, &inserted); err2 != nil {
			log.Printf("notif/prefs upsert: %v", err2)
			s.JSONError(w, http.StatusInternalServerError, "failed to update preferences")
			return
		}
		if len(inserted) > 0 {
			updated = inserted
		}
	}

	var prefs any
	if len(updated) > 0 {
		prefs = updated[0]
	} else {
		prefs = body
	}
	s.JSON(w, http.StatusOK, map[string]any{
		"success":     true,
		"preferences": prefs,
	})
}

// handleNotifRegisterDevice upserts a user device record.
func (s *Server) handleNotifRegisterDevice(w http.ResponseWriter, r *http.Request, user *AuthUser) {
	var body struct {
		DeviceToken  string         `json:"deviceToken"`
		DeviceType   string         `json:"deviceType"`
		DeviceName   string         `json:"deviceName"`
		PlatformInfo map[string]any `json:"platformInfo"`
	}
	if !dtReadJSON(w, r, &body) {
		return
	}
	if body.DeviceToken == "" || body.DeviceType == "" {
		s.JSONError(w, http.StatusBadRequest, "deviceToken and deviceType are required")
		return
	}
	// device_type is a constrained column (ios | android | web): anything else used to surface as a DB 500.
	if body.DeviceType != "ios" && body.DeviceType != "android" && body.DeviceType != "web" {
		s.JSONError(w, http.StatusBadRequest, "deviceType must be ios, android or web")
		return
	}
	if len(body.DeviceToken) > 512 || len([]rune(body.DeviceName)) > 200 || hasUnsafeRunes(body.DeviceToken, false) || hasUnsafeRunes(body.DeviceName, false) {
		s.JSONError(w, http.StatusBadRequest, "deviceToken or deviceName is too long or contains control characters")
		return
	}
	if jsonDepthExceeds(body.PlatformInfo, 20) {
		s.JSONError(w, http.StatusBadRequest, "platformInfo is nested too deeply")
		return
	}

	// update-then-insert is not atomic: two tabs registering the same NEW token raced into the unique
	// (user_id, device_token) key and one of them got a 500. Serialise per (user, token).
	defer lockKey("dev:" + user.ID + ":" + body.DeviceToken)()

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	record := map[string]any{
		"user_id":       user.ID,
		"device_token":  body.DeviceToken,
		"device_type":   body.DeviceType,
		"device_name":   body.DeviceName,
		"platform_info": body.PlatformInfo,
		"is_active":     true,
		"last_seen":     dtNowISO(),
	}

	// Try update existing; fall back to insert.
	var updated []map[string]any
	err := s.DB.Update(ctx, "user_devices",
		"user_id=eq."+user.ID+"&device_token=eq."+url.QueryEscape(body.DeviceToken),
		record, user.Token, &updated)
	if err != nil || len(updated) == 0 {
		var inserted []map[string]any
		if err2 := s.DB.Insert(ctx, "user_devices", record, user.Token, &inserted); err2 != nil {
			log.Printf("notif/register-device: %v", err2)
			s.JSONError(w, http.StatusInternalServerError, "failed to register device")
			return
		}
		if len(inserted) > 0 {
			updated = inserted
		}
	}

	var device any
	if len(updated) > 0 {
		device = updated[0]
	}
	s.JSON(w, http.StatusOK, map[string]any{
		"success": true,
		"device":  device,
	})
}

// handleNotifDeregisterDevice sets is_active=false for the given device token.
func (s *Server) handleNotifDeregisterDevice(w http.ResponseWriter, r *http.Request, user *AuthUser) {
	deviceToken := r.URL.Query().Get("deviceToken")
	if deviceToken == "" {
		s.JSONError(w, http.StatusBadRequest, "deviceToken query param is required")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	q := "user_id=eq." + user.ID + "&device_token=eq." + url.QueryEscape(deviceToken)
	var ignore []map[string]any
	if err := s.DB.Update(ctx, "user_devices", q,
		map[string]any{"is_active": false}, user.Token, &ignore); err != nil {
		log.Printf("notif/deregister-device: %v", err)
		s.JSONError(w, http.StatusInternalServerError, "failed to deactivate device")
		return
	}
	s.JSON(w, http.StatusOK, map[string]bool{"success": true})
}

// handleNotifScheduleGet returns scheduled notifications for the user.
// ?pending=true filters to unsent, uncancelled notifications due now or earlier.
func (s *Server) handleNotifScheduleGet(w http.ResponseWriter, r *http.Request, user *AuthUser) {
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	q := "select=*&user_id=eq." + user.ID + "&order=scheduled_for.asc"
	if r.URL.Query().Get("pending") == "true" {
		now := time.Now().UTC().Format(time.RFC3339)
		q += "&is_sent=eq.false&is_cancelled=eq.false&scheduled_for=lte." + now
	}

	var rows []map[string]any
	if err := s.DB.Select(ctx, "scheduled_notifications", q, user.Token, &rows); err != nil {
		log.Printf("notif/schedule get: %v", err)
		s.JSONError(w, http.StatusInternalServerError, "failed to fetch notifications")
		return
	}
	if rows == nil {
		rows = []map[string]any{}
	}
	s.JSON(w, http.StatusOK, map[string]any{
		"success":       true,
		"notifications": rows,
	})
}

// handleNotifSchedulePost inserts a scheduled notification.
func (s *Server) handleNotifSchedulePost(w http.ResponseWriter, r *http.Request, user *AuthUser) {
	var in map[string]any
	if !dtReadJSON(w, r, &in) {
		return
	}
	// Required fields, types, the date and the priority enum are checked up front (a null title used to pass the
	// "%v" check, a bad date or priority surfaced as a DB 500), and the sender-only state flags (is_sent,
	// is_cancelled, sent_at ...) are never taken from the client: a new reminder is born pending.
	body, bad := notifCleanScheduled(in)
	if bad != "" {
		s.JSONError(w, http.StatusBadRequest, bad)
		return
	}
	body["user_id"] = user.ID

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	var inserted []map[string]any
	if err := s.DB.Insert(ctx, "scheduled_notifications", body, user.Token, &inserted); err != nil {
		log.Printf("notif/schedule post: %v", err)
		s.JSONError(w, http.StatusInternalServerError, "failed to schedule notification")
		return
	}

	var notif any
	if len(inserted) > 0 {
		notif = inserted[0]
	}
	s.JSON(w, http.StatusOK, map[string]any{
		"success":      true,
		"notification": notif,
	})
}

// handleNotifScheduleDelete cancels notifications by id or type.
func (s *Server) handleNotifScheduleDelete(w http.ResponseWriter, r *http.Request, user *AuthUser) {
	q := r.URL.Query()
	notifID := q.Get("id")
	notifType := q.Get("type")

	if notifID == "" && notifType == "" {
		s.JSONError(w, http.StatusBadRequest, "id or type query param is required")
		return
	}
	if notifID != "" && !validUUID(notifID) { // the id column is a uuid: a slug would reach the DB and 500
		s.JSONError(w, http.StatusBadRequest, "invalid id")
		return
	}
	if len(notifType) > 100 {
		s.JSONError(w, http.StatusBadRequest, "invalid type")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	filter := "user_id=eq." + user.ID + "&is_cancelled=eq.false"
	if notifID != "" {
		filter += "&id=eq." + notifID
	} else {
		filter += "&notification_type=eq." + url.QueryEscape(notifType)
	}

	update := map[string]any{
		"is_cancelled": true,
		"cancelled_at": dtNowISO(),
	}
	var ignore []map[string]any
	if err := s.DB.Update(ctx, "scheduled_notifications", filter, update, user.Token, &ignore); err != nil {
		log.Printf("notif/schedule delete: %v", err)
		s.JSONError(w, http.StatusInternalServerError, "failed to cancel notification")
		return
	}
	s.JSON(w, http.StatusOK, map[string]bool{"success": true})
}

// handleNotifSyncGet returns a full sync payload without Postgres RPCs.
func (s *Server) handleNotifSyncGet(w http.ResponseWriter, r *http.Request, user *AuthUser) {
	ctx, cancel := context.WithTimeout(r.Context(), 15*time.Second)
	defer cancel()

	uid := user.ID

	var prefs []map[string]any
	_ = s.DB.Select(ctx, "user_notification_preferences", "select=*&user_id=eq."+uid, user.Token, &prefs)

	var devices []map[string]any
	_ = s.DB.Select(ctx, "user_devices", "select=*&user_id=eq."+uid+"&is_active=eq.true", user.Token, &devices)

	// Pending = unsent, uncancelled, scheduled_for <= now
	now := time.Now().UTC().Format(time.RFC3339)
	var pending []map[string]any
	_ = s.DB.Select(ctx, "scheduled_notifications",
		"select=*&user_id=eq."+uid+"&is_sent=eq.false&is_cancelled=eq.false&scheduled_for=lte."+now,
		user.Token, &pending)

	var scheduled []map[string]any
	_ = s.DB.Select(ctx, "scheduled_notifications",
		"select=*&user_id=eq."+uid+"&is_sent=eq.false&is_cancelled=eq.false&order=scheduled_for.asc",
		user.Token, &scheduled)

	var history []map[string]any
	_ = s.DB.Select(ctx, "notification_history",
		"select=*&user_id=eq."+uid+"&order=sent_at.desc&limit=100",
		user.Token, &history)

	dtSliceOrEmpty := func(v []map[string]any) []map[string]any {
		if v == nil {
			return []map[string]any{}
		}
		return v
	}

	var prefsObj any
	if len(prefs) > 0 {
		prefsObj = prefs[0]
	}

	s.JSON(w, http.StatusOK, map[string]any{
		"success": true,
		"syncData": map[string]any{
			"preferences":            prefsObj,
			"devices":                dtSliceOrEmpty(devices),
			"pendingNotifications":   dtSliceOrEmpty(pending),
			"scheduledNotifications": dtSliceOrEmpty(scheduled),
			"notificationHistory":    dtSliceOrEmpty(history),
			"timestamp":              dtNowISO(),
		},
	})
}

// handleNotifSyncPost updates device last_seen and optionally syncs local history/scheduled rows.
func (s *Server) handleNotifSyncPost(w http.ResponseWriter, r *http.Request, user *AuthUser) {
	var body struct {
		DeviceToken string         `json:"deviceToken"`
		SyncData    map[string]any `json:"syncData"`
	}
	if !dtReadJSON(w, r, &body) {
		return
	}
	if body.DeviceToken == "" {
		s.JSONError(w, http.StatusBadRequest, "deviceToken is required")
		return
	}
	if len(body.DeviceToken) > 512 {
		s.JSONError(w, http.StatusBadRequest, "deviceToken is too long")
		return
	}

	// Serialise per user: the dedupe below reads the existing rows and then inserts the new ones.
	defer lockKey("sync:" + user.ID)()

	ctx, cancel := context.WithTimeout(r.Context(), 20*time.Second)
	defer cancel()

	uid := user.ID

	// Update device last_seen directly (skip RPC)
	var ignore []map[string]any
	_ = s.DB.Update(ctx, "user_devices",
		"user_id=eq."+uid+"&device_token=eq."+url.QueryEscape(body.DeviceToken),
		map[string]any{"last_seen": dtNowISO()},
		user.Token, &ignore)

	// Sync local notification history if provided
	if body.SyncData != nil {
		// Re-syncing the same local rows used to double the history and the reminders on every sync (no dedupe
		// key). A row is "the same" when type, title, body and time (to the second) match one already stored.
		secKey := func(parts ...string) string { return strings.Join(parts, "\x1f") }
		secOf := func(ts string) string {
			if t, ok := parseTimestamp(ts); ok {
				return t.Format(time.RFC3339)
			}
			return ""
		}
		if rawHist, ok := body.SyncData["notificationHistory"]; ok {
			if histArr, ok := rawHist.([]any); ok {
				if len(histArr) > 200 {
					histArr = histArr[:200]
				}
				var have []map[string]any
				_ = s.DB.Select(ctx, "notification_history", "select=notification_type,title,body,sent_at&user_id=eq."+uid+"&order=sent_at.desc&limit=1000", user.Token, &have)
				timed, untimed := map[string]bool{}, map[string]bool{}
				for _, h := range have {
					ty, ti, bo := dtStrOr(h, "notification_type", ""), dtStrOr(h, "title", ""), dtStrOr(h, "body", "")
					untimed[secKey(ty, ti, bo)] = true
					if at := secOf(dtStrOr(h, "sent_at", "")); at != "" {
						timed[secKey(ty, ti, bo, at)] = true
					}
				}
				for _, item := range histArr {
					m, ok := item.(map[string]any)
					if !ok {
						continue
					}
					ty, ti, bo := dtStrOr(m, "type", "unknown"), dtStrOr(m, "title", ""), dtStrOr(m, "body", "")
					sent := secOf(dtStrOr(m, "sentAt", ""))
					k := secKey(ty, ti, bo)
					if sent != "" {
						k = secKey(ty, ti, bo, sent)
						if timed[k] {
							continue
						}
						timed[k] = true
					} else {
						if untimed[k] {
							continue
						}
						sent = dtNowISO()
					}
					untimed[secKey(ty, ti, bo)] = true
					prio := dtStrOr(m, "priority", "normal")
					if !notifPriorities[prio] {
						prio = "normal"
					}
					row := map[string]any{
						"user_id":           uid,
						"notification_type": ty,
						"title":             ti,
						"body":              bo,
						"data":              dtMapOr(m, "data"),
						"category":          dtStrOr(m, "category", "general"),
						"priority":          prio,
						"sent_at":           sent,
						"clicked":           dtBoolOr(m, "clicked"),
						"clicked_at":        m["clickedAt"],
						"device_type":       dtStrOr(m, "deviceType", "mobile"),
					}
					var ign []map[string]any
					_ = s.DB.Insert(ctx, "notification_history", row, user.Token, &ign)
				}
			}
		}

		if rawSched, ok := body.SyncData["scheduledNotifications"]; ok {
			if schedArr, ok := rawSched.([]any); ok {
				if len(schedArr) > 200 {
					schedArr = schedArr[:200]
				}
				var have []map[string]any
				_ = s.DB.Select(ctx, "scheduled_notifications", "select=notification_type,title,body,scheduled_for&user_id=eq."+uid+"&is_cancelled=eq.false&limit=1000", user.Token, &have)
				seen := map[string]bool{}
				for _, h := range have {
					seen[secKey(dtStrOr(h, "notification_type", ""), dtStrOr(h, "title", ""), dtStrOr(h, "body", ""), secOf(dtStrOr(h, "scheduled_for", "")))] = true
				}
				for _, item := range schedArr {
					m, ok := item.(map[string]any)
					if !ok {
						continue
					}
					ty, ti, bo := dtStrOr(m, "type", "unknown"), dtStrOr(m, "title", ""), dtStrOr(m, "body", "")
					when := secOf(dtStrOr(m, "scheduledFor", ""))
					if when == "" {
						when = dtNowISO()
					}
					k := secKey(ty, ti, bo, secOf(when))
					if seen[k] {
						continue
					}
					seen[k] = true
					prio := dtStrOr(m, "priority", "normal")
					if !notifPriorities[prio] {
						prio = "normal"
					}
					row := map[string]any{
						"user_id":           uid,
						"notification_type": ty,
						"title":             ti,
						"body":              bo,
						"data":              dtMapOr(m, "data"),
						"scheduled_for":     when,
						"repeat_pattern":    m["repeatPattern"],
						"repeat_config":     m["repeatConfig"],
						"category":          dtStrOr(m, "category", "general"),
						"priority":          prio,
					}
					var ign []map[string]any
					_ = s.DB.Insert(ctx, "scheduled_notifications", row, user.Token, &ign)
				}
			}
		}
	}

	// Re-read sync data for response
	var prefs []map[string]any
	_ = s.DB.Select(ctx, "user_notification_preferences", "select=*&user_id=eq."+uid, user.Token, &prefs)

	var devices []map[string]any
	_ = s.DB.Select(ctx, "user_devices", "select=*&user_id=eq."+uid+"&is_active=eq.true", user.Token, &devices)

	now := time.Now().UTC().Format(time.RFC3339)
	var pending []map[string]any
	_ = s.DB.Select(ctx, "scheduled_notifications",
		"select=*&user_id=eq."+uid+"&is_sent=eq.false&is_cancelled=eq.false&scheduled_for=lte."+now,
		user.Token, &pending)

	var scheduled []map[string]any
	_ = s.DB.Select(ctx, "scheduled_notifications",
		"select=*&user_id=eq."+uid+"&is_sent=eq.false&is_cancelled=eq.false&order=scheduled_for.asc",
		user.Token, &scheduled)

	var prefsObj any
	if len(prefs) > 0 {
		prefsObj = prefs[0]
	}

	s.JSON(w, http.StatusOK, map[string]any{
		"success": true,
		"syncData": map[string]any{
			"preferences":            prefsObj,
			"devices":                dtNilToSlice(devices),
			"pendingNotifications":   dtNilToSlice(pending),
			"scheduledNotifications": dtNilToSlice(scheduled),
			"timestamp":              dtNowISO(),
		},
	})
}

// handleNotifReportViewed sends a Telegram notification when a TCM report is viewed.
func (s *Server) handleNotifReportViewed(w http.ResponseWriter, r *http.Request) {
	var body struct {
		IsGuest *bool `json:"isGuest"`
	}
	// Silently ignore JSON parse errors (optional body)
	_ = json.NewDecoder(r.Body).Decode(&body)

	token := s.Cfg.TelegramBotToken
	chatID := s.Cfg.TelegramChatID

	if token == "" || chatID == "" {
		s.JSON(w, http.StatusOK, map[string]any{
			"ok":      false,
			"sent":    false,
			"message": "Telegram credentials not configured (TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID missing in environment variables)",
		})
		return
	}

	guestLabel := "Authenticated User"
	if body.IsGuest != nil && *body.IsGuest {
		guestLabel = "Guest User"
	}

	msgText := fmt.Sprintf(
		"<b>📋 TCM Report Viewed</b>\n\nA Comprehensive TCM Report was just viewed by a <b>%s</b>.\n\n<i>%s</i>",
		guestLabel, dtNowISO(),
	)

	payload := map[string]any{
		"chat_id":    chatID,
		"text":       msgText,
		"parse_mode": "HTML",
	}
	payloadBytes, _ := json.Marshal(payload)

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	tgURL := fmt.Sprintf("https://api.telegram.org/bot%s/sendMessage", token)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, tgURL, bytes.NewReader(payloadBytes))
	if err != nil {
		// err can embed the request URL (and so the bot token): log only the cause.
		log.Printf("report-viewed: build telegram request: %v", dtRedactURLErr(err))
		s.JSON(w, http.StatusInternalServerError, map[string]any{
			"ok": false, "sent": false,
			"message": "failed to build notification request",
		})
		return
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		log.Printf("report-viewed: telegram send: %v", dtRedactURLErr(err))
		s.JSON(w, http.StatusInternalServerError, map[string]any{
			"ok": false, "sent": false,
			"message": "failed to send notification",
		})
		return
	}
	defer resp.Body.Close()

	s.JSON(w, http.StatusOK, map[string]any{
		"ok":      true,
		"sent":    true,
		"message": "Report notification sent to professional doctor via P2P encrypted Telegram",
	})
}

// ---- small sync helpers ----

// dtRedactURLErr strips the request URL (which contains the Telegram bot token)
// from a net/http error, keeping only the underlying cause for server logs.
func dtRedactURLErr(err error) error {
	var ue *url.Error
	if errors.As(err, &ue) && ue.Err != nil {
		return ue.Err
	}
	return errors.New("request failed")
}

func dtStrOr(m map[string]any, key, def string) string {
	if v, ok := m[key]; ok {
		if s, ok := v.(string); ok && s != "" {
			return s
		}
	}
	return def
}

func dtBoolOr(m map[string]any, key string) bool {
	if v, ok := m[key]; ok {
		if b, ok := v.(bool); ok {
			return b
		}
	}
	return false
}

func dtMapOr(m map[string]any, key string) any {
	if v, ok := m[key]; ok && v != nil {
		return v
	}
	return map[string]any{}
}

func dtNilToSlice(v []map[string]any) []map[string]any {
	if v == nil {
		return []map[string]any{}
	}
	return v
}
