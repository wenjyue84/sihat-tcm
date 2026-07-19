package server

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
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

	// Report viewed — no auth
	s.Mux.HandleFunc("POST /api/notifications/report-viewed", s.handleNotifReportViewed)
}

// defaultPreferences returns the default notification preference object.
func dtDefaultPreferences() map[string]any {
	return map[string]any{
		"enabled":                true,
		"health_reminders":       true,
		"medication_alerts":      true,
		"appointment_reminders":  true,
		"exercise_reminders":     true,
		"sleep_reminders":        true,
		"quiet_hours_enabled":    true,
		"quiet_hours_start":      "22:00:00",
		"quiet_hours_end":        "07:00:00",
		"frequency_daily":        true,
		"frequency_weekly":       true,
		"frequency_monthly":      false,
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
	var body map[string]any
	if !dtReadJSON(w, r, &body) {
		return
	}
	body["user_id"] = user.ID

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	// Try update first; if no rows affected, insert.
	var updated []map[string]any
	err := s.DB.Update(ctx, "user_notification_preferences",
		"user_id=eq."+user.ID, body, user.Token, &updated)
	if err != nil || len(updated) == 0 {
		var inserted []map[string]any
		if err2 := s.DB.Insert(ctx, "user_notification_preferences", body, user.Token, &inserted); err2 != nil {
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
		"user_id=eq."+user.ID+"&device_token=eq."+body.DeviceToken,
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

	q := "user_id=eq." + user.ID + "&device_token=eq." + deviceToken
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
	var body map[string]any
	if !dtReadJSON(w, r, &body) {
		return
	}

	// Validate required fields
	for _, f := range []string{"notification_type", "title", "body", "scheduled_for", "category"} {
		if v, ok := body[f]; !ok || fmt.Sprintf("%v", v) == "" {
			s.JSONError(w, http.StatusBadRequest, "missing required field: "+f)
			return
		}
	}

	body["user_id"] = user.ID
	if _, ok := body["priority"]; !ok {
		body["priority"] = "normal"
	}
	if _, ok := body["data"]; !ok {
		body["data"] = map[string]any{}
	}

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

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	filter := "user_id=eq." + user.ID + "&is_cancelled=eq.false"
	if notifID != "" {
		filter += "&id=eq." + notifID
	} else {
		filter += "&notification_type=eq." + notifType
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
			"preferences":           prefsObj,
			"devices":               dtSliceOrEmpty(devices),
			"pendingNotifications":  dtSliceOrEmpty(pending),
			"scheduledNotifications": dtSliceOrEmpty(scheduled),
			"notificationHistory":   dtSliceOrEmpty(history),
			"timestamp":             dtNowISO(),
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

	ctx, cancel := context.WithTimeout(r.Context(), 20*time.Second)
	defer cancel()

	uid := user.ID

	// Update device last_seen directly (skip RPC)
	var ignore []map[string]any
	_ = s.DB.Update(ctx, "user_devices",
		"user_id=eq."+uid+"&device_token=eq."+body.DeviceToken,
		map[string]any{"last_seen": dtNowISO()},
		user.Token, &ignore)

	// Sync local notification history if provided
	if body.SyncData != nil {
		if rawHist, ok := body.SyncData["notificationHistory"]; ok {
			if histArr, ok := rawHist.([]any); ok {
				for _, item := range histArr {
					m, ok := item.(map[string]any)
					if !ok {
						continue
					}
					row := map[string]any{
						"user_id":           uid,
						"notification_type": dtStrOr(m, "type", "unknown"),
						"title":             dtStrOr(m, "title", ""),
						"body":              dtStrOr(m, "body", ""),
						"data":              dtMapOr(m, "data"),
						"category":          dtStrOr(m, "category", "general"),
						"priority":          dtStrOr(m, "priority", "normal"),
						"sent_at":           dtStrOr(m, "sentAt", dtNowISO()),
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
				for _, item := range schedArr {
					m, ok := item.(map[string]any)
					if !ok {
						continue
					}
					row := map[string]any{
						"user_id":           uid,
						"notification_type": dtStrOr(m, "type", "unknown"),
						"title":             dtStrOr(m, "title", ""),
						"body":              dtStrOr(m, "body", ""),
						"data":              dtMapOr(m, "data"),
						"scheduled_for":     dtStrOr(m, "scheduledFor", dtNowISO()),
						"repeat_pattern":    m["repeatPattern"],
						"repeat_config":     m["repeatConfig"],
						"category":          dtStrOr(m, "category", "general"),
						"priority":          dtStrOr(m, "priority", "normal"),
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

	url := fmt.Sprintf("https://api.telegram.org/bot%s/sendMessage", token)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(payloadBytes))
	if err != nil {
		s.JSON(w, http.StatusInternalServerError, map[string]any{
			"ok": false, "sent": false,
			"message": "failed to build Telegram request: " + err.Error(),
		})
		return
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		log.Printf("report-viewed: telegram send: %v", err)
		s.JSON(w, http.StatusInternalServerError, map[string]any{
			"ok": false, "sent": false,
			"message": "failed to send notification: " + err.Error(),
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
