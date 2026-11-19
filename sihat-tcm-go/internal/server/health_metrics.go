package server

// Wearable / phone health data: the metric catalogue and the one normaliser every channel (manual entry, Web
// Bluetooth, Google Health sync, Apple Health export, iOS Shortcut / Android automation ingest) funnels through.
// A reading is only ever stored after normalizeReading() accepted it, so the database holds canonical units and
// plausible values no matter which channel produced them.

import (
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"strconv"
	"strings"
	"time"
)

// healthMetric is one stored metric: its canonical unit and the plausible range a reading must fall in.
type healthMetric struct {
	Unit     string
	Min, Max float64
}

// healthMetrics is mirrored by the CHECK constraints in db/schema.sql and internal/localdb/schema.go.
var healthMetrics = map[string]healthMetric{
	"heart_rate":         {"bpm", 20, 250},
	"resting_heart_rate": {"bpm", 20, 200},
	"hrv_rmssd":          {"ms", 1, 500},
	"hrv_sdnn":           {"ms", 1, 500},
	"spo2":               {"%", 50, 100},
	"systolic_bp":        {"mmHg", 50, 260},
	"diastolic_bp":       {"mmHg", 30, 160},
	"body_temperature":   {"degC", 30, 45},
	"respiratory_rate":   {"brpm", 4, 60},
	"steps":              {"count", 0, 200000},
	"weight_kg":          {"kg", 10, 400},
	"sleep_hours":        {"h", 0, 24},
}

// healthMetricOrder is the display / summary order.
var healthMetricOrder = []string{
	"heart_rate", "resting_heart_rate", "hrv_rmssd", "hrv_sdnn", "spo2", "systolic_bp", "diastolic_bp",
	"body_temperature", "respiratory_rate", "steps", "weight_kg", "sleep_hours",
}

// Channels that may write a reading (health_readings.source).
const (
	srcManual      = "manual"
	srcBluetooth   = "bluetooth"
	srcGoogle      = "google_health"
	srcAppleExport = "apple_export"
	srcIngest      = "ingest"
)

var healthSources = map[string]bool{srcManual: true, srcBluetooth: true, srcGoogle: true, srcAppleExport: true, srcIngest: true}

const (
	maxDeviceLen        = 120
	healthMinYear       = 2000
	healthFutureSkew    = 10 * time.Minute
	healthTimeLayout    = "2006-01-02T15:04:05Z"
	maxIngestBatch      = 500
	maxIngestBodyBytes  = 512 << 10
	maxManualBatch      = 200
	healthOnConflictKey = "user_id,metric,measured_at,source"
)

// metricAliases maps a normalised (lower-case, alphanumerics only) name to the stored metric.
var metricAliases = map[string]string{}

func init() {
	add := func(metric string, names ...string) {
		metricAliases[strings.ReplaceAll(metric, "_", "")] = metric
		for _, n := range names {
			metricAliases[aliasKey(n)] = metric
		}
	}
	add("heart_rate", "hr", "pulse", "bpm", "heartrate", "HKQuantityTypeIdentifierHeartRate", "heart_rate_avg")
	add("resting_heart_rate", "rhr", "restingheartrate", "HKQuantityTypeIdentifierRestingHeartRate")
	add("hrv_rmssd", "rmssd", "hrv_rmssd_ms")
	add("hrv_sdnn", "hrv", "heart_rate_variability", "heartratevariability", "sdnn", "HKQuantityTypeIdentifierHeartRateVariabilitySDNN")
	add("spo2", "oxygen_saturation", "blood_oxygen", "blood_oxygen_saturation", "HKQuantityTypeIdentifierOxygenSaturation", "sao2")
	add("systolic_bp", "systolic", "blood_pressure_systolic", "HKQuantityTypeIdentifierBloodPressureSystolic")
	add("diastolic_bp", "diastolic", "blood_pressure_diastolic", "HKQuantityTypeIdentifierBloodPressureDiastolic")
	add("body_temperature", "temperature", "temp", "HKQuantityTypeIdentifierBodyTemperature")
	add("respiratory_rate", "breathing_rate", "resp_rate", "HKQuantityTypeIdentifierRespiratoryRate")
	add("steps", "step_count", "stepcount", "HKQuantityTypeIdentifierStepCount")
	add("weight_kg", "weight", "body_mass", "weight_body_mass", "HKQuantityTypeIdentifierBodyMass")
	add("sleep_hours", "sleep", "sleep_analysis", "sleep_duration")
}

func aliasKey(s string) string {
	var b strings.Builder
	for _, r := range strings.ToLower(s) {
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') {
			b.WriteRune(r)
		}
	}
	return b.String()
}

// metricFor resolves a client-supplied metric name ("HKQuantityTypeIdentifierHeartRate", "heartRate", "SpO2" ...).
func metricFor(name string) (string, bool) {
	m, ok := metricAliases[aliasKey(name)]
	return m, ok
}

// healthReading is one normalised reading, ready to insert.
type healthReading struct {
	Metric     string
	Value      float64
	Unit       string
	MeasuredAt time.Time
	Source     string
	Device     string
}

func (h healthReading) key() string {
	return h.Source + "|" + h.Metric + "|" + h.MeasuredAt.UTC().Format(healthTimeLayout)
}

// row is the JSON stored in health_readings for the given owner.
func (h healthReading) row(userID string) map[string]any {
	r := map[string]any{
		"user_id":     userID,
		"metric":      h.Metric,
		"value":       h.Value,
		"unit":        h.Unit,
		"measured_at": h.MeasuredAt.UTC().Format(healthTimeLayout),
		"source":      h.Source,
	}
	if h.Device != "" {
		r["device"] = h.Device
	}
	return r
}

// rawReading is a reading as a client sends it (every field optional until normalised).
type rawReading struct {
	Metric     string          `json:"metric"`
	Value      json.RawMessage `json:"value"`
	Unit       string          `json:"unit"`
	MeasuredAt json.RawMessage `json:"measured_at"`
	Source     string          `json:"source"`
	Device     string          `json:"device"`
}

// parseHealthTime accepts RFC 3339, the "2006-01-02 15:04:05 -0700" shape of Health Auto Export / Apple, a bare
// local datetime (taken as UTC) and unix seconds / milliseconds (JSON numbers).
func parseHealthTime(raw json.RawMessage) (time.Time, error) {
	s := strings.TrimSpace(string(raw))
	if s == "" || s == "null" {
		return time.Time{}, userErrf("measured_at is required")
	}
	if s[0] == '"' {
		var str string
		if err := json.Unmarshal(raw, &str); err != nil {
			return time.Time{}, userErrf("measured_at must be a timestamp")
		}
		return parseHealthTimeString(str)
	}
	n, err := strconv.ParseFloat(s, 64)
	if err != nil || math.IsNaN(n) || math.IsInf(n, 0) || n <= 0 {
		return time.Time{}, userErrf("measured_at must be a timestamp")
	}
	if n > 1e11 { // milliseconds
		return time.UnixMilli(int64(n)).UTC(), nil
	}
	return time.Unix(int64(n), 0).UTC(), nil
}

func parseHealthTimeString(str string) (time.Time, error) {
	str = strings.TrimSpace(str)
	for _, l := range []string{time.RFC3339Nano, "2006-01-02 15:04:05 -0700", "2006-01-02 15:04:05 -07:00", "2006-01-02T15:04:05-0700",
		"2006-01-02 15:04:05Z07:00", "2006-01-02T15:04:05", "2006-01-02 15:04:05", "2006-01-02T15:04", "2006-01-02"} {
		if t, err := time.Parse(l, str); err == nil {
			return t.UTC(), nil
		}
	}
	return time.Time{}, userErrf("measured_at must be an ISO 8601 timestamp")
}

// jsonNumber reads a JSON number or a numeric string.
func jsonNumber(raw json.RawMessage) (float64, bool) {
	s := strings.TrimSpace(string(raw))
	if s == "" || s == "null" {
		return 0, false
	}
	s = strings.Trim(s, `"`)
	f, err := strconv.ParseFloat(strings.TrimSpace(s), 64)
	if err != nil || math.IsNaN(f) || math.IsInf(f, 0) {
		return 0, false
	}
	return f, true
}

// convertUnit converts v from unit (as the client labelled it; empty = already canonical) to the canonical unit of
// metric. The bool is false when the unit is not one this metric accepts.
func convertUnit(metric string, v float64, unit string) (float64, bool) {
	u := strings.ToLower(strings.TrimSpace(unit))
	switch metric {
	case "heart_rate", "resting_heart_rate":
		switch u {
		case "", "bpm", "count/min", "beats/min", "/min", "per_min", "1/min", "beat/min":
			return v, true
		case "hz":
			return v * 60, true
		}
	case "respiratory_rate":
		switch u {
		case "", "brpm", "count/min", "breaths/min", "/min", "breath/min", "1/min", "per_min":
			return v, true
		}
	case "hrv_rmssd", "hrv_sdnn":
		switch u {
		case "", "ms", "millisecond", "milliseconds":
			return v, true
		case "s", "sec", "second", "seconds":
			return v * 1000, true
		}
	case "spo2":
		switch u {
		case "", "%", "percent", "pct", "fraction":
			if v <= 1.0 { // Apple Health writes 0.97 with unit "%"; a real saturation below 1 % is impossible
				return v * 100, true
			}
			return v, true
		}
	case "systolic_bp", "diastolic_bp":
		switch u {
		case "", "mmhg":
			return v, true
		case "kpa":
			return v * 7.50062, true
		}
	case "body_temperature":
		switch u {
		case "", "degc", "c", "°c", "celsius":
			return v, true
		case "degf", "f", "°f", "fahrenheit":
			return (v - 32) * 5 / 9, true
		}
	case "steps":
		switch u {
		case "", "count", "steps", "step":
			return v, true
		}
	case "weight_kg":
		switch u {
		case "", "kg", "kilogram", "kilograms":
			return v, true
		case "g", "gram", "grams":
			return v / 1000, true
		case "lb", "lbs", "pound", "pounds", "[lb_av]":
			return v * 0.45359237, true
		}
	case "sleep_hours":
		switch u {
		case "", "h", "hr", "hrs", "hour", "hours":
			return v, true
		case "min", "minute", "minutes":
			return v / 60, true
		}
	}
	return 0, false
}

func roundTo(v float64, places int) float64 {
	p := math.Pow(10, float64(places))
	return math.Round(v*p) / p
}

// normalizeReading validates and canonicalises one client reading. channel is the source the server assigns
// (srcIngest for the token endpoint ...); a client "source" label becomes part of the device label because the
// channel, not a free-text label, is what the database keys on.
func normalizeReading(rr rawReading, channel string, now time.Time) (healthReading, error) {
	var out healthReading
	metric, ok := metricFor(rr.Metric)
	if !ok {
		return out, userErrf("unknown metric %q", truncRunes(rr.Metric, 40))
	}
	val, ok := jsonNumber(rr.Value)
	if !ok {
		return out, userErrf("value must be a number")
	}
	val, ok = convertUnit(metric, val, rr.Unit)
	if !ok {
		return out, userErrf("unit %q is not valid for %s (use %s)", truncRunes(rr.Unit, 20), metric, healthMetrics[metric].Unit)
	}
	spec := healthMetrics[metric]
	val = roundTo(val, 3)
	if val < spec.Min || val > spec.Max {
		return out, userErrf("%s value %v is outside the plausible range %v-%v %s", metric, val, spec.Min, spec.Max, spec.Unit)
	}
	at, err := parseHealthTime(rr.MeasuredAt)
	if err != nil {
		return out, err
	}
	at = at.Truncate(time.Second)
	if at.Year() < healthMinYear {
		return out, userErrf("measured_at is before %d", healthMinYear)
	}
	if at.After(now.Add(healthFutureSkew)) {
		return out, userErrf("measured_at is in the future")
	}
	device := strings.TrimSpace(rr.Device)
	if lbl := strings.TrimSpace(rr.Source); lbl != "" && lbl != device {
		if device == "" {
			device = lbl
		} else {
			device = device + " / " + lbl
		}
	}
	if hasUnsafeRunes(device, false) {
		return out, userErrf("device contains control characters")
	}
	device = truncRunes(device, maxDeviceLen)
	return healthReading{Metric: metric, Value: val, Unit: spec.Unit, MeasuredAt: at, Source: channel, Device: device}, nil
}

func truncRunes(s string, n int) string {
	r := []rune(s)
	if len(r) <= n {
		return s
	}
	return string(r[:n])
}

// ingestError is one rejected item of a batch.
type ingestError struct {
	Index int    `json:"index"`
	Error string `json:"error"`
}

// parseIngestPayload turns an ingest body into normalised readings. Accepted shapes: a JSON array of readings, an
// object {"readings":[...]}, a single reading object, or the "Health Auto Export" app JSON
// ({"data":{"metrics":[{"name":..,"units":..,"data":[...]}]}}). Unknown Health Auto Export metric names are counted
// in unknown, not treated as errors, because the app exports many metrics this server does not store.
func parseIngestPayload(body []byte, channel string, now time.Time) (readings []healthReading, errs []ingestError, unknown int, err error) {
	trim := strings.TrimSpace(string(body))
	if trim == "" {
		return nil, nil, 0, userErrf("empty body")
	}
	var top any
	if e := json.Unmarshal(body, &top); e != nil {
		return nil, nil, 0, userErrf("invalid JSON body")
	}
	var items []json.RawMessage
	switch t := top.(type) {
	case []any:
		if e := json.Unmarshal(body, &items); e != nil {
			return nil, nil, 0, userErrf("invalid JSON body")
		}
	case map[string]any:
		if d, ok := t["data"].(map[string]any); ok {
			if _, ok := d["metrics"]; ok {
				r, ue, un := parseHealthAutoExport(body, channel, now)
				return r, ue, un, nil
			}
		}
		if _, ok := t["readings"]; ok {
			var w struct {
				Readings []json.RawMessage `json:"readings"`
			}
			if e := json.Unmarshal(body, &w); e != nil {
				return nil, nil, 0, userErrf("readings must be an array")
			}
			items = w.Readings
		} else if _, ok := t["metric"]; ok {
			items = []json.RawMessage{body}
		} else {
			return nil, nil, 0, userErrf("expected an array of readings, {\"readings\": [...]} or a Health Auto Export payload")
		}
	default:
		return nil, nil, 0, userErrf("expected an array of readings")
	}
	if len(items) == 0 {
		return nil, nil, 0, userErrf("no readings in the request")
	}
	if len(items) > maxIngestBatch {
		return nil, nil, 0, userErrf("too many readings in one request (max %d)", maxIngestBatch)
	}
	for i, raw := range items {
		var rr rawReading
		if e := json.Unmarshal(raw, &rr); e != nil {
			errs = append(errs, ingestError{i, "each reading must be an object"})
			continue
		}
		hr, e := normalizeReading(rr, channel, now)
		if e != nil {
			errs = append(errs, ingestError{i, e.Error()})
			continue
		}
		readings = append(readings, hr)
	}
	return readings, errs, 0, nil
}

// healthAutoExportMetrics maps the app's metric names onto ours (names are matched through aliasKey).
var healthAutoExportMetrics = map[string]string{
	"heartrate": "heart_rate", "restingheartrate": "resting_heart_rate", "heartratevariability": "hrv_sdnn",
	"bloodoxygensaturation": "spo2", "oxygensaturation": "spo2", "bodytemperature": "body_temperature",
	"respiratoryrate": "respiratory_rate", "stepcount": "steps", "weightbodymass": "weight_kg", "bodymass": "weight_kg",
}

func parseHealthAutoExport(body []byte, channel string, now time.Time) (readings []healthReading, errs []ingestError, unknown int) {
	var doc struct {
		Data struct {
			Metrics []struct {
				Name  string                       `json:"name"`
				Units string                       `json:"units"`
				Data  []map[string]json.RawMessage `json:"data"`
			} `json:"metrics"`
		} `json:"data"`
	}
	if json.Unmarshal(body, &doc) != nil {
		return nil, []ingestError{{0, "invalid Health Auto Export payload"}}, 0
	}
	idx := 0
	add := func(metric string, val json.RawMessage, unit string, pt map[string]json.RawMessage) {
		var src string
		_ = json.Unmarshal(pt["source"], &src)
		rr := rawReading{Metric: metric, Value: val, Unit: unit, MeasuredAt: pt["date"], Device: src}
		hr, e := normalizeReading(rr, channel, now)
		if e != nil {
			errs = append(errs, ingestError{idx, e.Error()})
		} else {
			readings = append(readings, hr)
		}
		idx++
	}
	for _, m := range doc.Data.Metrics {
		key := aliasKey(m.Name)
		switch key {
		case "bloodpressure":
			for _, pt := range m.Data {
				if v, ok := pt["systolic"]; ok {
					add("systolic_bp", v, m.Units, pt)
				}
				if v, ok := pt["diastolic"]; ok {
					add("diastolic_bp", v, m.Units, pt)
				}
			}
			continue
		case "sleepanalysis":
			for _, pt := range m.Data {
				v, ok := pt["asleep"]
				if !ok {
					v, ok = pt["totalSleep"]
				}
				if ok {
					unit := m.Units
					if unit == "" {
						unit = "h"
					}
					add("sleep_hours", v, unit, pt)
				}
			}
			continue
		}
		metric, ok := healthAutoExportMetrics[key]
		if !ok {
			unknown++
			continue
		}
		for _, pt := range m.Data {
			v, ok := pt["qty"]
			if !ok {
				v, ok = pt["Avg"]
			}
			if !ok {
				continue
			}
			unit := m.Units
			if metric == "spo2" && (unit == "" || unit == "%") {
				unit = "%" // the app exports whole percent (97), Apple raw export exports a fraction (0.97): convertUnit handles both
			}
			add(metric, v, unit, pt)
		}
	}
	return readings, errs, unknown
}

// jsonRaw marshals v for a rawReading field.
func jsonRaw(v any) json.RawMessage {
	b, _ := json.Marshal(v)
	return b
}

// userError is an error whose text is written for the end user, so it is safe to put in a response body (anything else
// - database or network errors - must never reach the client).
type userError struct{ msg string }

func (e *userError) Error() string { return e.msg }

func userErrf(format string, a ...any) error { return &userError{msg: fmt.Sprintf(format, a...)} }

// userMsg returns the end-user text of err, or fallback when err is not a userError.
func userMsg(err error, fallback string) string {
	var ue *userError
	if errors.As(err, &ue) {
		return ue.msg
	}
	return fallback
}
