package server

// Google Health (Fitbit / Pixel Watch / Android) online-portal channel.
//
// Server-side OAuth 2.0 authorization-code flow with PKCE (S256) and a `state` check against the Google Health API
// (https://health.googleapis.com/v4 - the successor of the deprecated Google Fit REST API and of api.fitbit.com).
// Endpoints, scopes, data-type ids ("kebab-case") and response field names follow Jay's working Python client
// (jay-health/fitbit/fetch.py). The refresh token is AES-GCM sealed in health_connections and never reaches the
// browser; the access token lives only for the duration of one sync.

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"sort"
	"strings"
	"time"

	"sihattcm/internal/config"
)

const (
	defaultGoogleAuthURL   = "https://accounts.google.com/o/oauth2/v2/auth"
	defaultGoogleTokenURL  = "https://oauth2.googleapis.com/token"
	defaultGoogleRevokeURL = "https://oauth2.googleapis.com/revoke"
	defaultGoogleHealthAPI = "https://health.googleapis.com/v4"

	oauthCookie     = "sihat-health-oauth"
	oauthCookieTTL  = 10 * time.Minute
	googleSyncGap   = 30 * time.Second
	googleSyncDays  = 7
	googleMaxDays   = 30
	googleMaxPages  = 6
	googleMaxBytes  = 8 << 20
	googleHTTPLimit = 25 * time.Second
)

// googleScopes: read-only vitals (HR, HRV, SpO2, respiratory rate, weight) and activity (steps).
var googleScopes = []string{
	"https://www.googleapis.com/auth/googlehealth.health_metrics_and_measurements.readonly",
	"https://www.googleapis.com/auth/googlehealth.activity_and_fitness.readonly",
}

type googleCfg struct {
	clientID, clientSecret, redirect string
	authURL, tokenURL, revokeURL     string
	apiBase                          string
	key                              string
}

func (s *Server) googleCfg() googleCfg {
	c := s.Cfg
	if c == nil {
		c = &config.Config{}
	}
	pick := func(v, def string) string {
		if v != "" {
			return v
		}
		return def
	}
	return googleCfg{
		clientID: c.GoogleHealthClientID, clientSecret: c.GoogleHealthClientSecret, redirect: c.GoogleHealthRedirectURL,
		authURL: pick(c.GoogleHealthAuthURL, defaultGoogleAuthURL), tokenURL: pick(c.GoogleHealthTokenURL, defaultGoogleTokenURL),
		revokeURL: pick(c.GoogleHealthRevokeURL, defaultGoogleRevokeURL), apiBase: strings.TrimRight(pick(c.GoogleHealthAPIBase, defaultGoogleHealthAPI), "/"),
		key: c.HealthTokenKey,
	}
}

// configured: client id + secret + redirect + an encryption key (without the key nothing can be stored safely).
func (g googleCfg) configured() bool {
	return g.clientID != "" && g.clientSecret != "" && g.redirect != "" && len(strings.TrimSpace(g.key)) >= minHealthKeyLen
}

func (s *Server) googleHTTP() *http.Client {
	return &http.Client{Timeout: googleHTTPLimit}
}

// oauthState is what the sealed cookie carries between /connect and /callback.
type oauthState struct {
	State    string `json:"s"`
	Verifier string `json:"v"`
	UserID   string `json:"u"`
	Exp      int64  `json:"e"`
}

// GET /api/health/google/connect - starts the authorization (302 to Google). ?format=json returns {url} instead.
func (s *Server) handleGoogleConnect(w http.ResponseWriter, r *http.Request, user *AuthUser) {
	g := s.googleCfg()
	asJSON := r.URL.Query().Get("format") == "json"
	fail := func(status int, code, msg string) {
		if asJSON {
			s.JSON(w, status, map[string]string{"error": msg, "code": code})
			return
		}
		http.Redirect(w, r, "/patient?health="+code+"#devices", http.StatusFound)
	}
	if !g.configured() {
		fail(http.StatusServiceUnavailable, "google_not_configured", "Google Health is not configured on this server")
		return
	}
	if !s.healthServiceReady() {
		fail(http.StatusServiceUnavailable, "server_not_ready", "health integrations need the database service key")
		return
	}
	state, err1 := newRandomString(24)
	verifier, err2 := newRandomString(48) // 64 chars: inside the 43-128 PKCE range
	if err1 != nil || err2 != nil {
		fail(http.StatusInternalServerError, "server_error", "could not start the authorization")
		return
	}
	st := oauthState{State: state, Verifier: verifier, UserID: user.ID, Exp: time.Now().Add(oauthCookieTTL).Unix()}
	blob, _ := json.Marshal(st)
	sealed, err := sealString(g.key, "oauth-state", string(blob))
	if err != nil {
		fail(http.StatusInternalServerError, "server_error", "could not start the authorization")
		return
	}
	http.SetCookie(w, &http.Cookie{
		Name: oauthCookie, Value: sealed, Path: "/api/health/google", MaxAge: int(oauthCookieTTL.Seconds()),
		HttpOnly: true, Secure: isHTTPS(r) || (s.Cfg != nil && s.Cfg.Env == "production"), SameSite: http.SameSiteLaxMode,
	})
	q := url.Values{}
	q.Set("client_id", g.clientID)
	q.Set("redirect_uri", g.redirect)
	q.Set("response_type", "code")
	q.Set("scope", strings.Join(googleScopes, " "))
	q.Set("state", state)
	q.Set("code_challenge", pkceChallenge(verifier))
	q.Set("code_challenge_method", "S256")
	q.Set("access_type", "offline")
	q.Set("prompt", "consent")
	q.Set("include_granted_scopes", "true")
	target := g.authURL + "?" + q.Encode()
	if asJSON {
		s.JSON(w, http.StatusOK, map[string]string{"url": target})
		return
	}
	http.Redirect(w, r, target, http.StatusFound)
}

type googleTokenResp struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresIn    int    `json:"expires_in"`
	Scope        string `json:"scope"`
	Error        string `json:"error"`
	ErrorDesc    string `json:"error_description"`
}

var errGoogleInvalidGrant = errors.New("google: the authorization was revoked or expired")

// googleToken POSTs a form to Google's token endpoint.
func (s *Server) googleToken(ctx context.Context, g googleCfg, form url.Values) (*googleTokenResp, error) {
	form.Set("client_id", g.clientID)
	form.Set("client_secret", g.clientSecret)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, g.tokenURL, strings.NewReader(form.Encode()))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	resp, err := s.googleHTTP().Do(req)
	if err != nil {
		return nil, fmt.Errorf("google token endpoint unreachable")
	}
	defer resp.Body.Close()
	raw, _ := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	var tr googleTokenResp
	_ = json.Unmarshal(raw, &tr)
	if resp.StatusCode >= 400 || tr.AccessToken == "" {
		if tr.Error == "invalid_grant" {
			return nil, errGoogleInvalidGrant
		}
		return nil, fmt.Errorf("google token endpoint refused the request (%s)", truncRunes(firstNonEmpty(tr.Error, fmt.Sprint(resp.StatusCode)), 60))
	}
	return &tr, nil
}

func firstNonEmpty(v ...string) string {
	for _, s := range v {
		if s != "" {
			return s
		}
	}
	return ""
}

// GET /api/health/google/callback - Google redirects the browser here. The request is authenticated by the sealed
// state cookie planted at /connect (only that browser holds it), not by a bearer header.
func (s *Server) handleGoogleCallback(w http.ResponseWriter, r *http.Request) {
	g := s.googleCfg()
	done := func(code string) {
		http.SetCookie(w, &http.Cookie{Name: oauthCookie, Value: "", Path: "/api/health/google", MaxAge: -1, HttpOnly: true, SameSite: http.SameSiteLaxMode})
		w.Header().Set("Cache-Control", "no-store")
		http.Redirect(w, r, "/patient?health="+code+"#devices", http.StatusFound)
	}
	if !g.configured() || !s.healthServiceReady() {
		done("google_not_configured")
		return
	}
	q := r.URL.Query()
	if e := q.Get("error"); e != "" {
		if e == "access_denied" {
			done("google_denied")
		} else {
			done("google_error")
		}
		return
	}
	c, err := r.Cookie(oauthCookie)
	if err != nil || c.Value == "" {
		done("google_state")
		return
	}
	blob, err := openString(g.key, "oauth-state", c.Value)
	var st oauthState
	if err != nil || json.Unmarshal([]byte(blob), &st) != nil || st.UserID == "" || time.Now().Unix() > st.Exp {
		done("google_state")
		return
	}
	got := q.Get("state")
	code := q.Get("code")
	if got == "" || !constEq(got, st.State) || code == "" {
		done("google_state")
		return
	}
	// If the browser also carries a session it must be the user who started the flow.
	if u := s.Authenticate(r); u != nil && u.ID != st.UserID {
		done("google_state")
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 30*time.Second)
	defer cancel()
	tr, err := s.googleToken(ctx, g, url.Values{
		"grant_type": {"authorization_code"}, "code": {code}, "redirect_uri": {g.redirect}, "code_verifier": {st.Verifier},
	})
	if err != nil {
		log.Printf("health/google callback: %v", err)
		done("google_error")
		return
	}
	if tr.RefreshToken == "" {
		done("google_no_refresh")
		return
	}
	if !strings.Contains(tr.Scope, "googlehealth") { // the user unticked every Health scope on the consent screen
		done("google_scope")
		return
	}
	sealed, err := sealString(g.key, "refresh:"+st.UserID, tr.RefreshToken)
	if err != nil {
		done("google_error")
		return
	}
	if err := s.saveConnection(ctx, st.UserID, providerGoogle, tr.Scope, sealed); err != nil {
		log.Printf("health/google callback save: %v", err)
		done("google_error")
		return
	}
	done("google_connected")
}

// ---- sync ----

type googleResult struct {
	Inserted   int               `json:"inserted"`
	Duplicates int               `json:"duplicates"`
	PerMetric  map[string]int    `json:"per_metric"`
	Errors     map[string]string `json:"errors,omitempty"`
}

// POST /api/health/google/sync {days?}
func (s *Server) handleGoogleSync(w http.ResponseWriter, r *http.Request, user *AuthUser) {
	var body struct {
		Days int `json:"days"`
	}
	if r.ContentLength != 0 { // a malformed body is the caller's mistake whether or not Google is configured: 400 first
		if !dtReadJSON(w, r, &body) {
			return
		}
	}
	g := s.googleCfg()
	if !g.configured() || !s.healthServiceReady() {
		s.JSONError(w, http.StatusServiceUnavailable, "Google Health is not configured on this server")
		return
	}
	days := body.Days
	if days <= 0 {
		days = googleSyncDays
	}
	if days > googleMaxDays {
		days = googleMaxDays
	}
	defer lockKey("health-sync:" + user.ID)()
	ctx, cancel := context.WithTimeout(r.Context(), 90*time.Second)
	defer cancel()
	conn, err := s.getConnection(ctx, user.ID, providerGoogle)
	if err != nil {
		s.JSONError(w, http.StatusServiceUnavailable, "service temporarily unavailable, please try again")
		return
	}
	if conn == nil || conn.Status != "connected" || conn.RefreshTokenEnc == nil {
		s.JSONError(w, http.StatusConflict, "Google Health is not connected")
		return
	}
	if conn.LastSyncAt != nil {
		if t, e := time.Parse(time.RFC3339Nano, strings.Replace(*conn.LastSyncAt, " ", "T", 1)); e == nil && time.Since(t) < googleSyncGap {
			w.Header().Set("Retry-After", "30")
			s.JSONError(w, http.StatusTooManyRequests, "synced a moment ago - wait 30 seconds")
			return
		}
	}
	refresh, err := openString(g.key, "refresh:"+user.ID, *conn.RefreshTokenEnc)
	if err != nil {
		s.markConnection(ctx, conn.ID, map[string]any{"status": "error", "last_error": "stored authorization unreadable - reconnect"})
		s.JSONError(w, http.StatusConflict, "the stored Google authorization is unreadable, please reconnect")
		return
	}
	tr, err := s.googleToken(ctx, g, url.Values{"grant_type": {"refresh_token"}, "refresh_token": {refresh}})
	if err != nil {
		if errors.Is(err, errGoogleInvalidGrant) {
			s.markConnection(ctx, conn.ID, map[string]any{"status": "revoked", "last_error": "Google access was revoked or expired - reconnect"})
			s.JSONError(w, http.StatusConflict, "Google access was revoked or expired, please reconnect")
			return
		}
		log.Printf("health/google refresh: %v", err)
		s.JSONError(w, http.StatusBadGateway, "could not reach Google, please try again")
		return
	}
	res := s.googleSyncAll(ctx, g, tr.AccessToken, user.ID, days)
	now := time.Now().UTC().Format(healthTimeLayout)
	status := fmt.Sprintf("ok: %d new, %d already stored", res.Inserted, res.Duplicates)
	fields := map[string]any{"last_sync_at": now, "last_sync_status": status, "status": "connected", "last_error": nil}
	if len(res.Errors) > 0 && res.Inserted == 0 && res.Duplicates == 0 {
		fields["last_sync_status"] = "failed"
		fields["last_error"] = truncRunes("Google returned errors for: "+strings.Join(sortedKeys(res.Errors), ", "), 300)
	} else if len(res.Errors) > 0 {
		fields["last_sync_status"] = status + fmt.Sprintf("; %d data types failed", len(res.Errors))
	}
	s.markConnection(ctx, conn.ID, fields)
	s.JSON(w, http.StatusOK, res)
}

func sortedKeys(m map[string]string) []string {
	ks := make([]string, 0, len(m))
	for k := range m {
		ks = append(ks, k)
	}
	sort.Strings(ks)
	return ks
}

// googlePoint is one dataPoints[] entry; only the fields Jay's client reads are modelled.
type googlePoint map[string]any

func dig(m map[string]any, path ...string) any {
	var cur any = m
	for _, p := range path {
		mm, ok := cur.(map[string]any)
		if !ok {
			return nil
		}
		cur = mm[p]
	}
	return cur
}

func numOf(v any) (float64, bool) {
	switch x := v.(type) {
	case float64:
		return x, true
	case string:
		return jsonNumber(json.RawMessage(x))
	case json.Number:
		f, err := x.Float64()
		return f, err == nil
	}
	return 0, false
}

// civilDate reads {"year":2026,"month":5,"day":26} into midnight UTC of that date.
func civilDate(v any) (time.Time, bool) {
	m, ok := v.(map[string]any)
	if !ok {
		return time.Time{}, false
	}
	y, ok1 := numOf(m["year"])
	mo, ok2 := numOf(m["month"])
	d, ok3 := numOf(m["day"])
	if !ok1 || !ok2 || !ok3 {
		return time.Time{}, false
	}
	return time.Date(int(y), time.Month(int(mo)), int(d), 0, 0, 0, 0, time.UTC), true
}

func rfc3339Of(v any) (time.Time, bool) {
	s, ok := v.(string)
	if !ok {
		return time.Time{}, false
	}
	t, err := time.Parse(time.RFC3339Nano, s)
	return t.UTC(), err == nil
}

// fetchPoints pages through /users/me/dataTypes/{id}/dataPoints.
func (s *Server) fetchGooglePoints(ctx context.Context, g googleCfg, access, dataType, filter string, pageSize int) ([]googlePoint, error) {
	var all []googlePoint
	token := ""
	for page := 0; page < googleMaxPages; page++ {
		q := url.Values{}
		q.Set("filter", filter)
		q.Set("pageSize", fmt.Sprint(pageSize))
		if token != "" {
			q.Set("pageToken", token)
		}
		req, err := http.NewRequestWithContext(ctx, http.MethodGet, g.apiBase+"/users/me/dataTypes/"+dataType+"/dataPoints?"+q.Encode(), nil)
		if err != nil {
			return all, err
		}
		req.Header.Set("Authorization", "Bearer "+access)
		resp, err := s.googleHTTP().Do(req)
		if err != nil {
			return all, fmt.Errorf("unreachable")
		}
		raw, _ := io.ReadAll(io.LimitReader(resp.Body, googleMaxBytes))
		resp.Body.Close()
		if resp.StatusCode >= 400 {
			return all, fmt.Errorf("HTTP %d", resp.StatusCode)
		}
		var doc struct {
			DataPoints    []googlePoint `json:"dataPoints"`
			NextPageToken string        `json:"nextPageToken"`
		}
		if json.Unmarshal(raw, &doc) != nil {
			return all, fmt.Errorf("unreadable response")
		}
		all = append(all, doc.DataPoints...)
		if doc.NextPageToken == "" {
			break
		}
		token = doc.NextPageToken
	}
	return all, nil
}

func (s *Server) googleSyncAll(ctx context.Context, g googleCfg, access, userID string, days int) googleResult {
	res := googleResult{PerMetric: map[string]int{}, Errors: map[string]string{}}
	now := time.Now().UTC()
	from := now.AddDate(0, 0, -days)
	fromDate, toDate := from.Format("2006-01-02"), now.AddDate(0, 0, 1).Format("2006-01-02")
	dateFilter := func(field string) string {
		return fmt.Sprintf(`%s.date >= "%s" AND %s.date < "%s"`, field, fromDate, field, toDate)
	}
	var readings []healthReading
	device := "Google Health"
	add := func(metric string, v float64, at time.Time, dev string) {
		rr := rawReading{Metric: metric, Value: jsonRaw(v), MeasuredAt: jsonRaw(at.Format(time.RFC3339)), Device: firstNonEmpty(dev, device)}
		if hr, err := normalizeReading(rr, srcGoogle, now); err == nil {
			readings = append(readings, hr)
			res.PerMetric[metric]++
		}
	}
	// daily summaries: {type id, filter field, object key, value key, metric}
	daily := []struct{ id, field, obj, val, metric string }{
		{"daily-resting-heart-rate", "daily_resting_heart_rate", "dailyRestingHeartRate", "beatsPerMinute", "resting_heart_rate"},
		{"daily-heart-rate-variability", "daily_heart_rate_variability", "dailyHeartRateVariability", "averageHeartRateVariabilityMilliseconds", "hrv_rmssd"},
		{"daily-oxygen-saturation", "daily_oxygen_saturation", "dailyOxygenSaturation", "averagePercentage", "spo2"},
		{"daily-respiratory-rate", "daily_respiratory_rate", "dailyRespiratoryRate", "breathsPerMinute", "respiratory_rate"},
	}
	for _, d := range daily {
		pts, err := s.fetchGooglePoints(ctx, g, access, d.id, dateFilter(d.field), 100)
		if err != nil {
			res.Errors[d.id] = err.Error()
			continue
		}
		for _, p := range pts {
			obj, _ := p[d.obj].(map[string]any)
			v, ok := numOf(obj[d.val])
			at, ok2 := civilDate(obj["date"])
			if ok && ok2 {
				add(d.metric, v, at, "")
			}
		}
	}
	// weight (grams)
	tsFilter := func(field, sub string) string {
		return fmt.Sprintf(`%s.%s >= "%s" AND %s.%s < "%s"`, field, sub, from.Format(time.RFC3339), field, sub, now.Add(time.Hour).Format(time.RFC3339))
	}
	if pts, err := s.fetchGooglePoints(ctx, g, access, "weight", tsFilter("weight", "sample_time.physical_time"), 100); err != nil {
		res.Errors["weight"] = err.Error()
	} else {
		for _, p := range pts {
			grams, ok := numOf(dig(p, "weight", "weightGrams"))
			at, ok2 := rfc3339Of(dig(p, "weight", "sampleTime", "physicalTime"))
			if ok && ok2 {
				add("weight_kg", grams/1000, at, "")
			}
		}
	}
	// most recent heart-rate sample (intraday stream, newest of the window)
	if pts, err := s.fetchGooglePoints(ctx, g, access, "heart-rate", tsFilter("heart_rate", "sample_time.physical_time"), 5000); err != nil {
		res.Errors["heart-rate"] = err.Error()
	} else {
		var best time.Time
		var bestV float64
		for _, p := range pts {
			bpm, ok := numOf(dig(p, "heartRate", "beatsPerMinute"))
			at, ok2 := rfc3339Of(dig(p, "heartRate", "sampleTime", "physicalTime"))
			if ok && ok2 && bpm > 0 && at.After(best) {
				best, bestV = at, bpm
			}
		}
		if !best.IsZero() {
			add("heart_rate", bestV, best, "")
		}
	}
	// steps: one total per civil day, from ONE platform (Jay's client: the same physical steps are reported by the
	// wearable AND the phone; summing both double counts)
	if pts, err := s.fetchGooglePoints(ctx, g, access, "steps", tsFilter("steps", "interval.start_time"), 1440); err != nil {
		res.Errors["steps"] = err.Error()
	} else {
		byDayPlat := map[string]map[string]float64{}
		for _, p := range pts {
			n, ok := numOf(dig(p, "steps", "count"))
			at, ok2 := rfc3339Of(firstAny(dig(p, "steps", "interval", "startTime"), dig(p, "steps", "interval", "start_time")))
			if !ok || !ok2 {
				continue
			}
			plat, _ := dig(p, "dataSource", "platform").(string)
			if plat == "" {
				plat = "UNKNOWN"
			}
			day := at.Format("2006-01-02")
			if byDayPlat[day] == nil {
				byDayPlat[day] = map[string]float64{}
			}
			byDayPlat[day][plat] += n
		}
		for day, plats := range byDayPlat {
			chosen := ""
			if _, ok := plats["FITBIT"]; ok {
				chosen = "FITBIT"
			} else {
				for pl, v := range plats {
					if chosen == "" || v > plats[chosen] {
						chosen = pl
					}
				}
			}
			at, _ := time.Parse("2006-01-02", day)
			add("steps", plats[chosen], at, "Google Health ("+chosen+")")
		}
	}
	if len(readings) > 0 {
		ins, dup, err := s.insertReadings(ctx, "", userID, readings)
		res.Inserted, res.Duplicates = ins, dup
		if err != nil {
			log.Printf("health/google insert: %v", err)
			res.Errors["store"] = "could not store some readings"
		}
	}
	if len(res.Errors) == 0 {
		res.Errors = nil
	}
	return res
}

func firstAny(v ...any) any {
	for _, x := range v {
		if x != nil {
			return x
		}
	}
	return nil
}

// DELETE /api/health/google[?delete_data=1]
func (s *Server) handleGoogleDisconnect(w http.ResponseWriter, r *http.Request, user *AuthUser) {
	if !s.optionalJSONBody(w, r) {
		return
	}
	if !s.healthServiceReady() {
		s.JSONError(w, http.StatusServiceUnavailable, "health integrations need the database service key")
		return
	}
	g := s.googleCfg()
	ctx, cancel := context.WithTimeout(r.Context(), 30*time.Second)
	defer cancel()
	conn, err := s.getConnection(ctx, user.ID, providerGoogle)
	if err != nil {
		s.JSONError(w, http.StatusServiceUnavailable, "service temporarily unavailable, please try again")
		return
	}
	revoked := false
	if conn != nil && conn.RefreshTokenEnc != nil && g.configured() {
		if rt, e := openString(g.key, "refresh:"+user.ID, *conn.RefreshTokenEnc); e == nil {
			req, _ := http.NewRequestWithContext(ctx, http.MethodPost, g.revokeURL, strings.NewReader(url.Values{"token": {rt}}.Encode()))
			req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
			if resp, e := s.googleHTTP().Do(req); e == nil {
				resp.Body.Close()
				revoked = resp.StatusCode < 400
			}
		}
	}
	if err := s.deleteConnection(ctx, user.ID, providerGoogle); err != nil {
		s.JSONError(w, http.StatusInternalServerError, "could not disconnect, please try again")
		return
	}
	deleted := false
	if r.URL.Query().Get("delete_data") == "1" {
		if err := s.deleteReadings(ctx, user.Token, user.ID, nil, srcGoogle, false); err == nil {
			deleted = true
		}
	}
	s.JSON(w, http.StatusOK, map[string]any{"success": true, "revoked_at_google": revoked, "readings_deleted": deleted})
}
