package server

// Apple Health has no web API. This channel reads the export the Health app produces on the iPhone (Profile ->
// Export All Health Data -> export.zip, which holds export.xml).
//
// Privacy / storage rules:
//   - the file is never stored: a zip is spooled to a temp file only because zip needs random access, and that file
//     is removed before the response is written; export.xml is parsed as a stream (encoding/xml Decoder, constant
//     memory) and only whitelisted metrics of the last 30 days leave the parser, as plain numbers;
//   - nothing from the export is kept except those normalised readings (health_readings) - no blobs, no raw XML.

import (
	"archive/zip"
	"bufio"
	"bytes"
	"context"
	"encoding/xml"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"path"
	"strconv"
	"strings"
	"time"
)

const (
	maxAppleUpload   = 95 << 20   // compressed upload (Cloudflare's free plan stops requests at 100 MB)
	maxAppleXML      = 1500 << 20 // decompressed export.xml we are willing to stream through
	maxAppleReadings = 20000
	appleDays        = 30
	appleParseBudget = 4 * time.Minute
)

// appleType describes how a HealthKit identifier becomes readings.
type appleType struct {
	metric string
	mode   string // "asis" | "hourly" (mean per hour) | "daily-sum" (steps) | "sleep"
}

var appleTypes = map[string]appleType{
	"HKQuantityTypeIdentifierHeartRate":                {"heart_rate", "hourly"},
	"HKQuantityTypeIdentifierRestingHeartRate":         {"resting_heart_rate", "asis"},
	"HKQuantityTypeIdentifierHeartRateVariabilitySDNN": {"hrv_sdnn", "asis"},
	"HKQuantityTypeIdentifierOxygenSaturation":         {"spo2", "hourly"},
	"HKQuantityTypeIdentifierBloodPressureSystolic":    {"systolic_bp", "asis"},
	"HKQuantityTypeIdentifierBloodPressureDiastolic":   {"diastolic_bp", "asis"},
	"HKQuantityTypeIdentifierBodyTemperature":          {"body_temperature", "asis"},
	"HKQuantityTypeIdentifierRespiratoryRate":          {"respiratory_rate", "hourly"},
	"HKQuantityTypeIdentifierStepCount":                {"steps", "daily-sum"},
	"HKQuantityTypeIdentifierBodyMass":                 {"weight_kg", "asis"},
	"HKCategoryTypeIdentifierSleepAnalysis":            {"sleep_hours", "sleep"},
}

// asleep values of HKCategoryValueSleepAnalysis (InBed / Awake are not sleep).
var appleAsleepValues = map[string]bool{
	"HKCategoryValueSleepAnalysisAsleep": true, "HKCategoryValueSleepAnalysisAsleepUnspecified": true,
	"HKCategoryValueSleepAnalysisAsleepCore": true, "HKCategoryValueSleepAnalysisAsleepDeep": true,
	"HKCategoryValueSleepAnalysisAsleepREM": true,
}

// AppleStats is what an import reports back.
type AppleStats struct {
	Scanned        int            `json:"records_scanned"`
	Matched        int            `json:"records_matched"`
	RejectedValues int            `json:"rejected_values"`
	Prepared       int            `json:"readings_prepared"`
	Truncated      bool           `json:"truncated"`
	PerMetric      map[string]int `json:"per_metric"`
	PeriodDays     int            `json:"period_days"`
}

type hourBucket struct {
	sum    float64
	n      int
	device string
	at     time.Time
}

type dayAgg struct {
	bySource map[string]float64
}

// parseAppleHealth streams export.xml. now/days bound the window (only records starting inside it are used).
func parseAppleHealth(ctx context.Context, r io.Reader, now time.Time, days int) ([]healthReading, AppleStats, error) {
	st := AppleStats{PerMetric: map[string]int{}, PeriodDays: days}
	cutoff := now.AddDate(0, 0, -days)
	cutoffDay := cutoff.Format("2006-01-02")
	dec := xml.NewDecoder(bufio.NewReaderSize(r, 256<<10))
	dec.Strict = false // Apple's DTD preamble and stray entities must not abort a 500 MB parse

	var out []healthReading
	hours := map[string]*hourBucket{} // metric|hour -> mean
	steps := map[string]*dayAgg{}     // day -> source -> total
	sleep := map[string]*dayAgg{}     // wake day -> source -> seconds
	full := func() bool { return len(out)+len(hours)+len(steps)+len(sleep) >= maxAppleReadings }

	emit := func(metric string, v float64, at time.Time, device, unit string) {
		hr, err := normalizeReading(rawReading{Metric: metric, Value: jsonRaw(v), Unit: unit, MeasuredAt: jsonRaw(at.UTC().Format(time.RFC3339)), Device: device}, srcAppleExport, now)
		if err != nil {
			st.RejectedValues++
			return
		}
		out = append(out, hr)
		st.PerMetric[metric]++
	}

	tokens := 0
	for {
		tok, err := dec.Token()
		if err == io.EOF {
			break
		}
		if err != nil {
			return nil, st, userErrf("could not read the Health export XML")
		}
		if tokens++; tokens%20000 == 0 {
			if ctx.Err() != nil {
				return nil, st, userErrf("the export took too long to process")
			}
		}
		se, ok := tok.(xml.StartElement)
		if !ok || se.Name.Local != "Record" {
			continue
		}
		st.Scanned++
		var typ, unit, start, end, value, source string
		for _, a := range se.Attr {
			switch a.Name.Local {
			case "type":
				typ = a.Value
			case "unit":
				unit = a.Value
			case "startDate":
				start = a.Value
			case "endDate":
				end = a.Value
			case "value":
				value = a.Value
			case "sourceName":
				source = a.Value
			}
		}
		spec, known := appleTypes[typ]
		if !known || start == "" {
			continue
		}
		startT, err := parseHealthTimeString(start)
		if err != nil || startT.Before(cutoff) || startT.After(now.Add(healthFutureSkew)) {
			continue
		}
		if full() {
			st.Truncated = true
			continue
		}
		st.Matched++
		device := truncRunes(strings.TrimSpace(source), maxDeviceLen)

		if spec.mode == "sleep" {
			if !appleAsleepValues[value] || end == "" {
				continue
			}
			endT, err := parseHealthTimeString(end)
			if err != nil || endT.Before(startT) {
				continue
			}
			day := end[:min(10, len(end))]
			if day < cutoffDay {
				continue
			}
			a := sleep[day]
			if a == nil {
				a = &dayAgg{bySource: map[string]float64{}}
				sleep[day] = a
			}
			a.bySource[device] += endT.Sub(startT).Seconds()
			continue
		}

		v, err := strconv.ParseFloat(strings.TrimSpace(value), 64)
		if err != nil {
			st.RejectedValues++
			continue
		}
		cv, ok := convertUnit(spec.metric, v, unit)
		if !ok {
			st.RejectedValues++
			continue
		}
		if m := healthMetrics[spec.metric]; cv < m.Min || cv > m.Max {
			st.RejectedValues++
			continue
		}
		switch spec.mode {
		case "hourly":
			h := startT.UTC().Truncate(time.Hour)
			k := spec.metric + "|" + h.Format(healthTimeLayout)
			b := hours[k]
			if b == nil {
				b = &hourBucket{device: device, at: h}
				hours[k] = b
			}
			b.sum += cv
			b.n++
		case "daily-sum":
			day := start[:min(10, len(start))]
			if day < cutoffDay {
				continue
			}
			a := steps[day]
			if a == nil {
				a = &dayAgg{bySource: map[string]float64{}}
				steps[day] = a
			}
			a.bySource[device] += cv
		default:
			emit(spec.metric, cv, startT, device, "")
		}
	}

	for k, b := range hours {
		metric := k[:strings.Index(k, "|")]
		emit(metric, b.sum/float64(b.n), b.at, b.device, "")
	}
	// The same physical steps / sleep are reported by the iPhone AND the Watch: use the single largest source per
	// day (Apple's own app prioritises sources the same way) instead of adding them up.
	pickDay := func(m map[string]*dayAgg, metric string, scale float64) {
		for day, a := range m {
			best, bestV := "", -1.0
			for src, v := range a.bySource {
				if v > bestV {
					best, bestV = src, v
				}
			}
			at, err := time.Parse("2006-01-02", day)
			if err != nil {
				continue
			}
			emit(metric, minF(bestV*scale, healthMetrics[metric].Max), at, best, "")
		}
	}
	pickDay(steps, "steps", 1)
	pickDay(sleep, "sleep_hours", 1.0/3600)
	st.Prepared = len(out)
	return out, st, nil
}

func minF(a, b float64) float64 {
	if a < b {
		return a
	}
	return b
}

var errNotAppleExport = &userError{msg: "this does not look like an Apple Health export (expected export.zip or export.xml)"}

// openAppleExport returns a reader over export.xml for an uploaded body (zip or raw XML) plus a cleanup func.
func openAppleExport(body io.Reader) (io.Reader, func(), error) {
	br := bufio.NewReaderSize(body, 64<<10)
	head, _ := br.Peek(8)
	switch {
	case bytes.HasPrefix(head, []byte("PK\x03\x04")):
		tmp, err := os.CreateTemp("", "sihat-health-*.zip")
		if err != nil {
			return nil, func() {}, userErrf("server could not buffer the upload")
		}
		cleanup := func() { name := tmp.Name(); tmp.Close(); os.Remove(name) }
		if _, err := io.Copy(tmp, io.LimitReader(br, maxAppleUpload+1)); err != nil {
			cleanup()
			return nil, func() {}, err
		}
		zr, err := zip.OpenReader(tmp.Name())
		if err != nil {
			cleanup()
			return nil, func() {}, errNotAppleExport
		}
		cleanup2 := func() { zr.Close(); cleanup() }
		var pick *zip.File
		for _, f := range zr.File {
			if strings.EqualFold(path.Base(f.Name), "export.xml") && !f.FileInfo().IsDir() {
				if pick == nil || len(f.Name) < len(pick.Name) {
					pick = f
				}
			}
		}
		if pick == nil {
			cleanup2()
			return nil, func() {}, errNotAppleExport
		}
		if pick.UncompressedSize64 > maxAppleXML {
			cleanup2()
			return nil, func() {}, userErrf("export.xml is larger than the %d MB limit", maxAppleXML>>20)
		}
		rc, err := pick.Open()
		if err != nil {
			cleanup2()
			return nil, func() {}, errNotAppleExport
		}
		return io.LimitReader(rc, maxAppleXML), func() { rc.Close(); cleanup2() }, nil
	default:
		trim := bytes.TrimLeft(head, "\xef\xbb\xbf \t\r\n")
		if len(trim) == 0 || trim[0] != '<' {
			return nil, func() {}, errNotAppleExport
		}
		return io.LimitReader(br, maxAppleXML), func() {}, nil
	}
}

// POST /api/health/apple/import - raw body (application/zip | application/xml | octet-stream), header X-Sihat-Upload: 1.
func (s *Server) handleAppleImport(w http.ResponseWriter, r *http.Request, user *AuthUser) {
	if r.Header.Get("X-Sihat-Upload") != "1" {
		s.JSONError(w, http.StatusBadRequest, "missing X-Sihat-Upload header")
		return
	}
	r.Body = http.MaxBytesReader(w, r.Body, maxAppleUpload)
	xmlR, cleanup, err := openAppleExport(r.Body)
	defer cleanup()
	if err != nil {
		var tooBig *http.MaxBytesError
		if errors.As(err, &tooBig) {
			s.JSONError(w, http.StatusRequestEntityTooLarge, fmt.Sprintf("the file is larger than %d MB - export a shorter period, or use the Shortcut channel", maxAppleUpload>>20))
			return
		}
		s.JSONError(w, http.StatusBadRequest, userMsg(err, "could not read the upload"))
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), appleParseBudget)
	defer cancel()
	readings, st, err := parseAppleHealth(ctx, xmlR, time.Now().UTC(), appleDays)
	if err != nil {
		var tooBig *http.MaxBytesError
		if errors.As(err, &tooBig) {
			s.JSONError(w, http.StatusRequestEntityTooLarge, "the file is too large")
			return
		}
		s.JSONError(w, http.StatusBadRequest, userMsg(err, "could not read the upload"))
		return
	}
	resp := map[string]any{"success": true, "stats": st, "file_stored": false}
	if len(readings) == 0 {
		resp["inserted"], resp["duplicates"] = 0, 0
		resp["message"] = "no heart rate, SpO2, blood pressure, temperature, respiratory rate, steps, weight or sleep records from the last 30 days were found"
		s.JSON(w, http.StatusOK, resp)
		return
	}
	ictx, icancel := context.WithTimeout(r.Context(), time.Minute)
	defer icancel()
	ins, dup, err := s.insertReadings(ictx, user.Token, user.ID, readings)
	if err != nil {
		s.JSONError(w, http.StatusServiceUnavailable, "could not store the readings, please try again")
		return
	}
	resp["inserted"], resp["duplicates"] = ins, dup
	s.JSON(w, http.StatusOK, resp)
}
