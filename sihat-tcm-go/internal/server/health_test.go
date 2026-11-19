package server

import (
	"context"
	"encoding/json"
	"math"
	"net/http"
	"os"
	"strings"
	"testing"
	"time"
)

func hNow() time.Time { return time.Date(2026, 10, 12, 12, 0, 0, 0, time.UTC) }

func hRaw(metric string, value any, unit, at string) rawReading {
	return rawReading{Metric: metric, Value: jsonRaw(value), Unit: unit, MeasuredAt: jsonRaw(at)}
}

func TestHealthNormalizeUnitsAndRanges(t *testing.T) {
	cases := []struct {
		name   string
		rr     rawReading
		metric string
		want   float64
		err    string
	}{
		{"hr bpm", hRaw("heart_rate", 72, "bpm", "2026-10-12T10:00:00Z"), "heart_rate", 72, ""},
		{"hr apple identifier + count/min", hRaw("HKQuantityTypeIdentifierHeartRate", 61, "count/min", "2026-10-12T10:00:00Z"), "heart_rate", 61, ""},
		{"hr string value", rawReading{Metric: "hr", Value: json.RawMessage(`"88"`), MeasuredAt: jsonRaw("2026-10-12T10:00:00Z")}, "heart_rate", 88, ""},
		{"hr too high", hRaw("heart_rate", 300, "", "2026-10-12T10:00:00Z"), "", 0, "outside the plausible range"},
		{"hr too low", hRaw("heart_rate", 5, "", "2026-10-12T10:00:00Z"), "", 0, "outside the plausible range"},
		{"spo2 apple fraction", hRaw("OxygenSaturation", 0.97, "%", "2026-10-12T10:00:00Z"), "spo2", 97, ""},
		{"spo2 percent", hRaw("spo2", 96.5, "%", "2026-10-12T10:00:00Z"), "spo2", 96.5, ""},
		{"spo2 impossible", hRaw("spo2", 40, "%", "2026-10-12T10:00:00Z"), "", 0, "outside the plausible range"},
		{"temp F to C", hRaw("body_temperature", 98.6, "degF", "2026-10-12T10:00:00Z"), "body_temperature", 37, ""},
		{"temp F unit symbol", hRaw("temperature", 100.4, "°F", "2026-10-12T10:00:00Z"), "body_temperature", 38, ""},
		{"temp unlabelled F is rejected, not guessed", hRaw("body_temperature", 98.6, "", "2026-10-12T10:00:00Z"), "", 0, "outside the plausible range"},
		{"bp kPa", hRaw("systolic_bp", 16, "kPa", "2026-10-12T10:00:00Z"), "systolic_bp", 120.01, ""},
		{"weight lb", hRaw("weight", 154.3, "lb", "2026-10-12T10:00:00Z"), "weight_kg", 69.989, ""},
		{"weight g", hRaw("weight_kg", 70000, "g", "2026-10-12T10:00:00Z"), "weight_kg", 70, ""},
		{"weight absurd", hRaw("weight_kg", 7000, "kg", "2026-10-12T10:00:00Z"), "", 0, "outside the plausible range"},
		{"hrv seconds", hRaw("hrv_rmssd", 0.045, "s", "2026-10-12T10:00:00Z"), "hrv_rmssd", 45, ""},
		{"sleep minutes", hRaw("sleep", 450, "min", "2026-10-12T00:00:00Z"), "sleep_hours", 7.5, ""},
		{"wrong unit for metric", hRaw("heart_rate", 70, "mmHg", "2026-10-12T10:00:00Z"), "", 0, "is not valid for heart_rate"},
		{"unknown metric", hRaw("blood_sugar", 5.5, "", "2026-10-12T10:00:00Z"), "", 0, "unknown metric"},
		{"missing value", rawReading{Metric: "hr", MeasuredAt: jsonRaw("2026-10-12T10:00:00Z")}, "", 0, "value must be a number"},
		{"NaN-ish string", rawReading{Metric: "hr", Value: json.RawMessage(`"abc"`), MeasuredAt: jsonRaw("2026-10-12T10:00:00Z")}, "", 0, "value must be a number"},
		{"future", hRaw("heart_rate", 70, "", "2026-10-13T10:00:00Z"), "", 0, "in the future"},
		{"ancient", hRaw("heart_rate", 70, "", "1999-01-01T00:00:00Z"), "", 0, "before 2000"},
		{"bad time", hRaw("heart_rate", 70, "", "yesterday"), "", 0, "ISO 8601"},
		{"missing time", rawReading{Metric: "hr", Value: jsonRaw(70)}, "", 0, "measured_at is required"},
	}
	for _, c := range cases {
		got, err := normalizeReading(c.rr, srcIngest, hNow())
		if c.err != "" {
			if err == nil || !strings.Contains(err.Error(), c.err) {
				t.Errorf("%s: err = %v, want containing %q", c.name, err, c.err)
			}
			continue
		}
		if err != nil {
			t.Errorf("%s: unexpected error %v", c.name, err)
			continue
		}
		if got.Metric != c.metric || math.Abs(got.Value-c.want) > 0.02 {
			t.Errorf("%s: got %s=%v, want %s=%v", c.name, got.Metric, got.Value, c.metric, c.want)
		}
		if got.Unit != healthMetrics[c.metric].Unit || got.Source != srcIngest {
			t.Errorf("%s: unit/source = %q/%q", c.name, got.Unit, got.Source)
		}
	}
}

func TestHealthTimeFormats(t *testing.T) {
	for in, want := range map[string]string{
		`"2026-10-12T10:00:00Z"`:      "2026-10-12T10:00:00Z",
		`"2026-10-12 18:00:00 +0800"`: "2026-10-12T10:00:00Z", // Health Auto Export / Apple
		`"2026-10-12T18:00:00+08:00"`: "2026-10-12T10:00:00Z",
		`"2026-10-12T10:00:00.789Z"`:  "2026-10-12T10:00:00Z",
	} {
		got, err := parseHealthTime(json.RawMessage(in))
		if err != nil {
			t.Errorf("%s: %v", in, err)
			continue
		}
		if got.Truncate(time.Second).Format(healthTimeLayout) != want {
			t.Errorf("%s = %s, want %s", in, got.Format(healthTimeLayout), want)
		}
	}
	ms, err := parseHealthTime(json.RawMessage(`1760263200000`))
	if err != nil || ms.Unix() != 1760263200 {
		t.Errorf("unix ms = %v, %v", ms, err)
	}
}

func TestHealthDeviceLabel(t *testing.T) {
	rr := hRaw("heart_rate", 70, "", "2026-10-12T10:00:00Z")
	rr.Device, rr.Source = "Polar H10", "Shortcut"
	got, err := normalizeReading(rr, srcIngest, hNow())
	if err != nil || got.Device != "Polar H10 / Shortcut" {
		t.Errorf("device = %q err=%v", got.Device, err)
	}
	rr.Device, rr.Source = "", "Apple Watch"
	got, _ = normalizeReading(rr, srcIngest, hNow())
	if got.Device != "Apple Watch" {
		t.Errorf("source-only label = %q", got.Device)
	}
	rr.Device, rr.Source = strings.Repeat("x", 500), ""
	got, _ = normalizeReading(rr, srcIngest, hNow())
	if len([]rune(got.Device)) != maxDeviceLen {
		t.Errorf("device not truncated: %d", len([]rune(got.Device)))
	}
	rr.Device = "bad\x00dev"
	if _, err := normalizeReading(rr, srcIngest, hNow()); err == nil {
		t.Error("control characters in device must be rejected")
	}
}

func TestHealthParseIngestShapes(t *testing.T) {
	one := `{"metric":"heart_rate","value":71,"unit":"bpm","measured_at":"2026-10-12T10:00:00Z","source":"Shortcut","device":"Apple Watch"}`
	for name, body := range map[string]string{
		"array":   "[" + one + "]",
		"wrapper": `{"readings":[` + one + `]}`,
		"single":  one,
	} {
		rs, errs, _, err := parseIngestPayload([]byte(body), srcIngest, hNow())
		if err != nil || len(errs) != 0 || len(rs) != 1 || rs[0].Value != 71 {
			t.Errorf("%s: rs=%v errs=%v err=%v", name, rs, errs, err)
		}
	}
	// partial acceptance: one good, one out of range, one malformed
	rs, errs, _, err := parseIngestPayload([]byte(`[`+one+`,{"metric":"heart_rate","value":999,"measured_at":"2026-10-12T10:00:00Z"},"x"]`), srcIngest, hNow())
	if err != nil || len(rs) != 1 || len(errs) != 2 || errs[0].Index != 1 || errs[1].Index != 2 {
		t.Errorf("partial: rs=%d errs=%v err=%v", len(rs), errs, err)
	}
	for name, body := range map[string]string{"empty": ``, "garbage": `{{`, "empty array": `[]`, "scalar": `7`, "object without metric": `{"foo":1}`} {
		if _, _, _, err := parseIngestPayload([]byte(body), srcIngest, hNow()); err == nil {
			t.Errorf("%s: want error", name)
		}
	}
	big := make([]string, maxIngestBatch+1)
	for i := range big {
		big[i] = one
	}
	if _, _, _, err := parseIngestPayload([]byte("["+strings.Join(big, ",")+"]"), srcIngest, hNow()); err == nil || !strings.Contains(err.Error(), "too many") {
		t.Errorf("batch cap: %v", err)
	}
}

func TestHealthAutoExportShape(t *testing.T) {
	body := `{"data":{"metrics":[
	 {"name":"heart_rate","units":"count/min","data":[{"date":"2026-10-12 18:00:00 +0800","qty":72,"Min":60,"Avg":72,"Max":90,"source":"Apple Watch"}]},
	 {"name":"blood_oxygen_saturation","units":"%","data":[{"date":"2026-10-12 03:00:00 +0800","qty":97}]},
	 {"name":"blood_pressure","units":"mmHg","data":[{"date":"2026-10-12 07:00:00 +0800","systolic":120,"diastolic":80}]},
	 {"name":"sleep_analysis","units":"hr","data":[{"date":"2026-10-12 00:00:00 +0800","asleep":7.2,"inBed":8}]},
	 {"name":"dietary_water","units":"mL","data":[{"date":"2026-10-12 10:00:00 +0800","qty":250}]},
	 {"name":"step_count","units":"count","data":[{"date":"2026-10-12 00:00:00 +0800","qty":9000}]}
	]}}`
	rs, errs, unknown, err := parseIngestPayload([]byte(body), srcIngest, hNow())
	if err != nil || len(errs) != 0 {
		t.Fatalf("err=%v errs=%v", err, errs)
	}
	got := map[string]float64{}
	for _, r := range rs {
		got[r.Metric] = r.Value
	}
	want := map[string]float64{"heart_rate": 72, "spo2": 97, "systolic_bp": 120, "diastolic_bp": 80, "sleep_hours": 7.2, "steps": 9000}
	for k, v := range want {
		if got[k] != v {
			t.Errorf("%s = %v, want %v (all: %v)", k, got[k], v, got)
		}
	}
	if unknown != 1 {
		t.Errorf("unknown metrics = %d, want 1 (dietary_water)", unknown)
	}
	for _, r := range rs {
		if r.Metric == "heart_rate" && r.Device != "Apple Watch" {
			t.Errorf("device = %q", r.Device)
		}
	}
}

func TestHealthCryptoRoundTrip(t *testing.T) {
	key := "0123456789abcdef-test-key"
	sealed, err := sealString(key, "refresh:u1", "1//refresh-token-value")
	if err != nil {
		t.Fatal(err)
	}
	if strings.Contains(sealed, "refresh-token-value") {
		t.Error("ciphertext leaks the plaintext")
	}
	if pt, err := openString(key, "refresh:u1", sealed); err != nil || pt != "1//refresh-token-value" {
		t.Errorf("round trip: %q %v", pt, err)
	}
	if _, err := openString(key, "refresh:u2", sealed); err == nil {
		t.Error("a blob sealed for user u1 must not open for u2 (aad binding)")
	}
	if _, err := openString("another-key-0123456789", "refresh:u1", sealed); err == nil {
		t.Error("wrong key must fail")
	}
	tampered := sealed[:len(sealed)-3] + "AAA"
	if _, err := openString(key, "refresh:u1", tampered); err == nil {
		t.Error("tampered blob must fail")
	}
	if _, err := sealString("short", "a", "b"); err == nil {
		t.Error("keys under 16 chars must be refused")
	}
	a, _ := sealString(key, "x", "same")
	b, _ := sealString(key, "x", "same")
	if a == b {
		t.Error("nonce reuse: two seals of the same plaintext are identical")
	}
}

func TestHealthIngestTokenShape(t *testing.T) {
	tok, err := newIngestToken()
	if err != nil || !strings.HasPrefix(tok, ingestTokenPrefix) || len(tok) < 40 {
		t.Fatalf("token = %q err=%v", tok, err)
	}
	h := hashIngestToken(tok)
	if len(h) != 64 || strings.Contains(h, tok) || h == hashIngestToken(tok+"x") {
		t.Errorf("hash = %q", h)
	}
	if len(tokenHint(tok)) != 4 {
		t.Errorf("hint = %q", tokenHint(tok))
	}
	t2, _ := newIngestToken()
	if t2 == tok {
		t.Error("tokens must be random")
	}
	// RFC 7636 appendix B example
	if got := pkceChallenge("dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"); got != "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM" {
		t.Errorf("pkce challenge = %q", got)
	}
}

// loadAppleFixture fills the {{dN}} date placeholders of the shared synthetic export relative to now.
func loadAppleFixture(t *testing.T, now time.Time) string {
	t.Helper()
	raw, err := os.ReadFile("../../regress/fixtures/health/export.template.xml")
	if err != nil {
		t.Fatal(err)
	}
	s := string(raw)
	for _, n := range []int{0, 1, 2, 3, 45} {
		s = strings.ReplaceAll(s, "{{d"+itoa(n)+"}}", now.AddDate(0, 0, -n).Format("2006-01-02"))
	}
	return s
}

func itoa(n int) string { b, _ := json.Marshal(n); return string(b) }

func TestAppleParseSyntheticExport(t *testing.T) {
	now := time.Now().UTC()
	xmlText := loadAppleFixture(t, now)
	rs, st, err := parseAppleHealth(context.Background(), strings.NewReader(xmlText), now, 30)
	if err != nil {
		t.Fatal(err)
	}
	by := map[string][]healthReading{}
	for _, r := range rs {
		by[r.Metric] = append(by[r.Metric], r)
		if r.Source != srcAppleExport {
			t.Errorf("source = %q", r.Source)
		}
	}
	if st.Scanned != 21 {
		t.Errorf("scanned = %d, want 21 records", st.Scanned)
	}
	if st.Matched != 19 {
		t.Errorf("matched = %d, want 19 (old HR + unknown type excluded)", st.Matched)
	}
	if st.RejectedValues != 1 {
		t.Errorf("rejected values = %d, want 1 (120 degC)", st.RejectedValues)
	}
	hr := by["heart_rate"]
	if len(hr) != 2 {
		t.Fatalf("hourly heart-rate readings = %d, want 2: %+v", len(hr), hr)
	}
	vals := []float64{hr[0].Value, hr[1].Value}
	if !(vals[0] == 75 && vals[1] == 90) && !(vals[0] == 90 && vals[1] == 75) {
		t.Errorf("hourly means = %v, want 75 and 90", vals)
	}
	one := func(metric string) healthReading {
		if len(by[metric]) != 1 {
			t.Fatalf("%s readings = %d, want 1: %+v", metric, len(by[metric]), by[metric])
		}
		return by[metric][0]
	}
	if v := one("spo2").Value; v != 97 {
		t.Errorf("spo2 = %v (Apple writes the fraction 0.97)", v)
	}
	if v := one("body_temperature").Value; math.Abs(v-37) > 0.01 {
		t.Errorf("98.6 degF = %v degC", v)
	}
	if v := one("steps").Value; v != 5000 {
		t.Errorf("steps = %v, want the single largest source (iPhone 5000), not 7500", v)
	}
	if v := one("sleep_hours").Value; v != 6.5 {
		t.Errorf("sleep = %v h, want 6.5 (asleep stages only, InBed/Awake excluded)", v)
	}
	if one("resting_heart_rate").Value != 58 || one("hrv_sdnn").Value != 42.5 || one("systolic_bp").Value != 118 ||
		one("diastolic_bp").Value != 76 || one("respiratory_rate").Value != 15 || one("weight_kg").Value != 70.5 {
		t.Errorf("as-is metrics wrong: %+v", by)
	}
	if st.Prepared != 12 || len(rs) != 12 {
		t.Errorf("prepared = %d (%d), want 12", st.Prepared, len(rs))
	}
	// the window really bounds the data: with a 0-day window nothing qualifies
	rs0, _, _ := parseAppleHealth(context.Background(), strings.NewReader(xmlText), now, 0)
	if len(rs0) != 0 {
		t.Errorf("0-day window kept %d readings", len(rs0))
	}
}

func TestAppleParseRejectsGarbage(t *testing.T) {
	if _, _, err := parseAppleHealth(context.Background(), strings.NewReader("<HealthData><Record type="), time.Now(), 30); err == nil {
		t.Error("truncated XML must be an error")
	}
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	big := "<HealthData>" + strings.Repeat(`<Record type="x" startDate="2026-01-01 00:00:00 +0000" value="1"/>`, 25000) + "</HealthData>"
	if _, _, err := parseAppleHealth(ctx, strings.NewReader(big), time.Now(), 30); err == nil {
		t.Error("an expired context must stop the parse")
	}
}

func TestConsultCarriesDeviceVitalsToTheModel(t *testing.T) {
	f := taiNewFake(t, func(_ int, _ taiUpstreamReq, w http.ResponseWriter) { taiSSE(w, `{"diagnosis":`, `{}}`) })
	s := taiNewServer(t, f)
	with := `{"data":{"basic_info":{"name":"Ann"},"qie":{"bpm":"61","qualities":["thready"],"device_vitals":[{"metric":"heart_rate","value":61,"unit":"bpm","device":"Polar H10","measured_at":"2026-10-12T10:00:00Z","source":"bluetooth"},{"metric":"spo2","value":97,"unit":"%","device":"Test Oximeter","measured_at":"2026-10-12T10:01:00Z","source":"bluetooth"}]}},"language":"en"}`
	if rec := taiPost(t, s.handleConsult, with); rec.Code != 200 {
		t.Fatalf("status %d %s", rec.Code, rec.Body.String())
	}
	up := f.req(0).Body.Contents[0].Parts[0].Text
	taiMustContain(t, up, "NOTE: qie.device_vitals", `"device_vitals"`, "Polar H10", "Test Oximeter", `"metric": "spo2"`)
	if !strings.Contains(up, "a single reading is not a diagnosis") {
		t.Error("the note must warn that one reading is not a diagnosis")
	}
	// typed-in values only: no note, prompt unchanged (pure JSON)
	without := `{"data":{"basic_info":{"name":"Ann"},"qie":{"bpm":"72","qualities":[]}},"language":"en"}`
	if rec := taiPost(t, s.handleConsult, without); rec.Code != 200 {
		t.Fatalf("status %d", rec.Code)
	}
	up2 := f.req(1).Body.Contents[0].Parts[0].Text
	if strings.Contains(up2, "NOTE:") || json.Unmarshal([]byte(up2), &map[string]any{}) != nil {
		t.Errorf("a consult without device vitals must send the bare JSON, got %q", taiTrunc(up2, 80))
	}
	if aiDeviceVitalsNote(map[string]json.RawMessage{"qie": json.RawMessage(`{"device_vitals":[]}`)}) != "" || aiDeviceVitalsNote(map[string]json.RawMessage{"qie": json.RawMessage(`"x"`)}) != "" {
		t.Error("empty / malformed device_vitals must not add a note")
	}
}
