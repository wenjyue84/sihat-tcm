package server

// Unit tests for the data-layer bug-hunt fixes (patient / staff / robust lenses): atomic claims and thread updates,
// validation, paging, de-duplication, notification hygiene. They run against the in-memory PostgREST stand-in from
// hardening_test.go.

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"
	"time"

	"sihattcm/internal/config"
	"sihattcm/internal/gemini"
)

const hDocID = "11111111-1111-4111-8111-111111111111"

func dataFake(t *testing.T) (*Server, *hfake) {
	t.Helper()
	f := newHFake()
	f.user("tok-pat", "pat-1", "patient")
	f.user("tok-pat2", "pat-2", "patient")
	f.user("tok-doc", hDocID, "doctor")
	f.user("tok-adm", "adm-1", "admin")
	f.user("tok-dev", "dev-1", "developer")
	f.tables["profiles"] = []map[string]any{{"id": hDocID, "role": "doctor", "is_approved": true, "full_name": "Dr Demo"}}
	return f.server(t), f
}

// hdoIP is hdo with a fixed client address (for the rate-limit tests).
func hdoIP(s *Server, method, path, tok, body, ip string) *httptest.ResponseRecorder {
	r := httptest.NewRequest(method, path, strings.NewReader(body))
	if body != "" {
		r.Header.Set("Content-Type", "application/json")
	}
	if tok != "" {
		r.Header.Set("Authorization", "Bearer "+tok)
	}
	r.RemoteAddr = "127.0.0.1:1"
	r.Header.Set("X-Forwarded-For", ip)
	rec := httptest.NewRecorder()
	s.Mux.ServeHTTP(rec, r)
	return rec
}

func newRequest(t *testing.T, s *Server, tok string, n int) string {
	t.Helper()
	body := fmt.Sprintf(`{"doctorId":%q,"doctorName":"Dr Demo","patientData":{"name":"P"},"reportData":{"diagnosis":"x","n":%d}}`, hDocID, n)
	rec := hdo(s, "POST", "/api/verification-request", tok, body)
	if rec.Code != 200 {
		t.Fatalf("verification-request = %d %s", rec.Code, rec.Body.String())
	}
	data, _ := hjson(t, rec)["data"].(map[string]any)
	id, _ := data["id"].(string)
	if id == "" {
		t.Fatalf("no id in %s", rec.Body.String())
	}
	return id
}

func inquiryRow(f *hfake, id string) map[string]any {
	for _, r := range f.rows("inquiries") {
		if r["id"] == id {
			return r
		}
	}
	return nil
}

func messagesOf(row map[string]any) []any {
	rep, _ := row["diagnosis_report"].(map[string]any)
	m, _ := rep["messages"].([]any)
	return m
}

// ---------------------------------------------------------------------------------------------------------------
// patient-24 / robust-03: verification requests
// ---------------------------------------------------------------------------------------------------------------

func TestVerificationRequestIsDeduplicatedAndBounded(t *testing.T) {
	s, f := dataFake(t)
	id1 := newRequest(t, s, "tok-pat", 1)
	if id2 := newRequest(t, s, "tok-pat", 1); id2 != id1 {
		t.Fatalf("an identical pending request (double click) must return the existing one: %s vs %s", id2, id1)
	}
	// 8 racing double-clicks
	var wg sync.WaitGroup
	ids := make([]string, 8)
	for i := range ids {
		wg.Add(1)
		go func(i int) {
			defer wg.Done()
			body := fmt.Sprintf(`{"doctorId":%q,"doctorName":"Dr Demo","patientData":{"name":"P"},"reportData":{"diagnosis":"x","n":2}}`, hDocID)
			rec := hdo(s, "POST", "/api/verification-request", "tok-pat", body)
			d, _ := hjson(t, rec)["data"].(map[string]any)
			ids[i], _ = d["id"].(string)
		}(i)
	}
	wg.Wait()
	for _, id := range ids {
		if id == "" || id != ids[0] {
			t.Fatalf("racing identical requests produced different ids: %v", ids)
		}
	}
	if n := len(f.rows("inquiries")); n != 2 {
		t.Fatalf("%d inquiry rows, want 2 (two distinct reports)", n)
	}
	// another patient asking the same doctor the same thing is NOT a duplicate
	if other := newRequest(t, s, "tok-pat2", 1); other == id1 {
		t.Fatal("dedupe must be per patient")
	}
	// a completed (reviewed) request does not block a new one
	inquiryRow(f, id1)["status"] = "reviewed"
	if again := newRequest(t, s, "tok-pat", 1); again == id1 {
		t.Fatal("a reviewed request must not swallow a new identical one")
	}
}

func TestVerificationRequestRefusesHugeReportsAndUnapprovedDoctors(t *testing.T) {
	s, f := dataFake(t)
	big := fmt.Sprintf(`{"doctorId":%q,"doctorName":"Dr","patientData":{"name":"x"},"reportData":{"diagnosis":"x","blob":%q}}`, hDocID, strings.Repeat("note ", maxRequestReportBytes/4))
	if rec := hdo(s, "POST", "/api/verification-request", "tok-pat", big); rec.Code != http.StatusRequestEntityTooLarge {
		t.Errorf("oversized reportData = %d, want 413 (one huge row poisons the master inbox)", rec.Code)
	}
	deep := fmt.Sprintf(`{"doctorId":%q,"doctorName":"Dr","reportData":%s1%s}`, hDocID, strings.Repeat(`{"a":`, 300), strings.Repeat("}", 300))
	if rec := hdo(s, "POST", "/api/verification-request", "tok-pat", deep); rec.Code != 400 {
		t.Errorf("deeply nested reportData = %d, want 400", rec.Code)
	}
	ok := fmt.Sprintf(`{"doctorId":%q,"doctorName":"Dr","reportData":{"diagnosis":"x"}}`, hDocID)
	if rec := hdo(s, "POST", "/api/verification-request", "tok-pat", fmt.Sprintf(`{"doctorId":"22222222-2222-4222-8222-222222222222","doctorName":"Dr","reportData":{"diagnosis":"x"}}`)); rec.Code != 404 {
		t.Errorf("request to a doctor that does not exist = %d, want 404", rec.Code)
	}
	for i := 0; i < maxRequestsPerPatient; i++ {
		f.tables["inquiries"] = append(f.tables["inquiries"], map[string]any{"id": fmt.Sprintf("old%d", i), "user_id": "pat-1", "status": "reviewed"})
	}
	if rec := hdo(s, "POST", "/api/verification-request", "tok-pat", ok); rec.Code != http.StatusTooManyRequests {
		t.Errorf("a patient over the request cap = %d, want 429", rec.Code)
	}
}

// ---------------------------------------------------------------------------------------------------------------
// patient-04 / patient-05 / robust-07: guest-token claim
// ---------------------------------------------------------------------------------------------------------------

func TestGuestSessionMigratesExactlyOnceAndKeepsItsDate(t *testing.T) {
	s, f := dataFake(t)
	f.tables["guest_diagnosis_sessions"] = []map[string]any{{
		"id": "g1", "session_token": "tok1", "primary_diagnosis": "Qi", "full_report": map[string]any{"diagnosis": "Qi"},
		"symptoms": []any{"fatigue"}, "created_at": "2026-03-04T05:06:07Z",
	}}
	var wg sync.WaitGroup
	codes := make([]int, 24)
	for i := range codes {
		wg.Add(1)
		go func(i int) {
			defer wg.Done()
			tok := "tok-pat"
			if i%2 == 1 {
				tok = "tok-pat2" // a second account holding the same token races too
			}
			codes[i] = hdo(s, "POST", "/api/migrate-guest-session", tok, `{"sessionToken":"tok1"}`).Code
		}(i)
	}
	wg.Wait()
	ok := 0
	for _, c := range codes {
		if c == 200 {
			ok++
		}
	}
	if ok != 1 {
		t.Fatalf("%d claims succeeded, want exactly 1: %v", ok, codes)
	}
	rows := f.rows("diagnosis_sessions")
	if len(rows) != 1 {
		t.Fatalf("%d sessions created, want 1", len(rows))
	}
	if rows[0]["created_at"] != "2026-03-04T05:06:07Z" {
		t.Errorf("the migrated report lost its assessment date: %v", rows[0]["created_at"])
	}
	if f.rows("guest_diagnosis_sessions")[0]["migrated_to_user_id"] == nil {
		t.Error("the guest row must be marked as migrated")
	}
	if rec := hdo(s, "POST", "/api/migrate-guest-session", "tok-pat", `{"sessionToken":"tok1"}`); rec.Code != 400 {
		t.Errorf("a claimed token = %d, want 400", rec.Code)
	}
}

func TestFailedMigrationReleasesTheToken(t *testing.T) {
	s, f := dataFake(t)
	f.tables["guest_diagnosis_sessions"] = []map[string]any{{"id": "g1", "session_token": "tok2", "primary_diagnosis": "Qi", "full_report": map[string]any{"a": 1}}}
	fail := true
	f.failPost = func(table string) bool { return fail && table == "diagnosis_sessions" }
	if rec := hdo(s, "POST", "/api/migrate-guest-session", "tok-pat", `{"sessionToken":"tok2"}`); rec.Code != 500 {
		t.Fatalf("copy failure = %d, want 500", rec.Code)
	}
	if f.rows("guest_diagnosis_sessions")[0]["migrated_to_user_id"] != nil {
		t.Fatal("the claim must be released when the copy fails, or the report is lost for good")
	}
	fail = false
	if rec := hdo(s, "POST", "/api/migrate-guest-session", "tok-pat", `{"sessionToken":"tok2"}`); rec.Code != 200 {
		t.Fatalf("retry = %d", rec.Code)
	}
}

// ---------------------------------------------------------------------------------------------------------------
// staff-02..07 / robust-01 / robust-02: the consultation thread
// ---------------------------------------------------------------------------------------------------------------

func TestConcurrentRepliesAreAllPersisted(t *testing.T) {
	s, f := dataFake(t)
	id := newRequest(t, s, "tok-pat", 10)
	var wg sync.WaitGroup
	const n = 12
	for i := 0; i < n; i++ {
		wg.Add(2)
		go func(i int) {
			defer wg.Done()
			hdo(s, "POST", "/api/doctor/reply", "tok-doc", fmt.Sprintf(`{"requestId":%q,"message":"doc-%d","targetTable":"inquiries"}`, id, i))
		}(i)
		go func(i int) {
			defer wg.Done()
			hdo(s, "POST", "/api/patient/reply", "tok-pat", fmt.Sprintf(`{"requestId":%q,"message":"pat-%d"}`, id, i))
		}(i)
	}
	wg.Wait()
	if got := len(messagesOf(inquiryRow(f, id))); got != 2*n {
		t.Fatalf("%d of %d concurrent replies persisted (lost updates)", got, 2*n)
	}
}

func TestReplyAndTreatmentPlanRaceKeepsBoth(t *testing.T) {
	s, f := dataFake(t)
	id := newRequest(t, s, "tok-pat", 11)
	var wg sync.WaitGroup
	const n = 8
	for i := 0; i < n; i++ {
		wg.Add(2)
		go func(i int) {
			defer wg.Done()
			hdo(s, "POST", "/api/doctor/reply", "tok-doc", fmt.Sprintf(`{"requestId":%q,"message":"r-%d","targetTable":"inquiries"}`, id, i))
		}(i)
		go func(i int) {
			defer wg.Done()
			hdo(s, "POST", "/api/doctor/treatment-plan", "tok-doc", fmt.Sprintf(`{"requestId":%q,"plan":{"pattern":"p%d"}}`, id, i))
		}(i)
	}
	wg.Wait()
	row := inquiryRow(f, id)
	rep, _ := row["diagnosis_report"].(map[string]any)
	if got := len(messagesOf(row)); got != n || rep["treatment_plan"] == nil {
		t.Fatalf("replies kept: %d of %d, plan kept: %v", got, n, rep["treatment_plan"] != nil)
	}
}

func TestDoctorReplyValidation(t *testing.T) {
	s, f := dataFake(t)
	id := newRequest(t, s, "tok-pat", 12)
	post := func(body string) int {
		return hdo(s, "POST", "/api/doctor/reply", "tok-doc", body).Code
	}
	for _, c := range []struct {
		body string
		want int
	}{
		{fmt.Sprintf(`{"requestId":%q,"message":"   \n\t ","targetTable":"inquiries"}`, id), 400},
		{fmt.Sprintf(`{"requestId":%q,"message":"ok","status":"bogus-status","targetTable":"inquiries"}`, id), 400},
		{fmt.Sprintf(`{"requestId":%q,"message":"ok","status":"cancelled","targetTable":"inquiries"}`, id), 400},
		{fmt.Sprintf(`{"requestId":%q,"message":"ok","status":"pending","targetTable":"inquiries"}`, id), 200},
		{fmt.Sprintf(`{"requestId":%q,"message":"ok","status":"reviewed","targetTable":"inquiries"}`, id), 200},
		{fmt.Sprintf(`{"requestId":%q,"message":"ok","targetTable":"inquiries"}`, id), 200},
	} {
		if got := post(c.body); got != c.want {
			t.Errorf("%s -> %d want %d", c.body, got, c.want)
		}
	}
	if st := inquiryRow(f, id)["status"]; st != "reviewed" {
		t.Errorf("status %v after the last reply", st)
	}
	if n := len(messagesOf(inquiryRow(f, id))); n != 3 {
		t.Errorf("%d messages stored, rejected replies must not leave a bubble", n)
	}
}

func TestTreatmentPlanValidationAndPendingFollowUp(t *testing.T) {
	s, f := dataFake(t)
	id := newRequest(t, s, "tok-pat", 13)
	plan := func(p string) *httptest.ResponseRecorder {
		return hdo(s, "POST", "/api/doctor/treatment-plan", "tok-doc", fmt.Sprintf(`{"requestId":%q,"plan":%s}`, id, p))
	}
	for _, empty := range []string{`{"pattern":"","treatment":"","lifestyle":""}`, `{"pattern":"  ","notes":"\n"}`, `{"lifestyle":[]}`, `{"lifestyle":["", "  "]}`, `{"a":null}`} {
		if rec := plan(empty); rec.Code != 400 {
			t.Errorf("empty plan %s = %d, want 400", empty, rec.Code)
		}
	}
	if rec := plan(`{"pattern":"Spleen qi deficiency","treatment":""}`); rec.Code != 200 {
		t.Fatalf("plan with one field = %d", rec.Code)
	}
	if st := inquiryRow(f, id)["status"]; st != "reviewed" {
		t.Errorf("a plan on a fresh request marks it reviewed, got %v", st)
	}
	// the patient follows up; a plan saved without answering must not hide the question
	hdo(s, "POST", "/api/doctor/reply", "tok-doc", fmt.Sprintf(`{"requestId":%q,"message":"first answer","targetTable":"inquiries"}`, id))
	hdo(s, "POST", "/api/patient/reply", "tok-pat", fmt.Sprintf(`{"requestId":%q,"message":"new question about the herbs"}`, id))
	if rec := plan(`{"pattern":"Updated pattern"}`); rec.Code != 200 {
		t.Fatalf("plan = %d", rec.Code)
	}
	row := inquiryRow(f, id)
	rep, _ := row["diagnosis_report"].(map[string]any)
	if row["status"] != "pending" || rep["status"] != "pending" {
		t.Errorf("an unanswered patient follow-up must stay pending after a plan: row=%v report=%v", row["status"], rep["status"])
	}
	// answering it clears the pending state
	hdo(s, "POST", "/api/doctor/reply", "tok-doc", fmt.Sprintf(`{"requestId":%q,"message":"answer","targetTable":"inquiries"}`, id))
	plan(`{"pattern":"Final"}`)
	if st := inquiryRow(f, id)["status"]; st != "reviewed" {
		t.Errorf("after the doctor answered, a plan marks reviewed; got %v", st)
	}
}

func TestThreadIsBounded(t *testing.T) {
	s, f := dataFake(t)
	id := newRequest(t, s, "tok-pat", 14)
	msgs := make([]any, maxThreadMessages)
	for i := range msgs {
		msgs[i] = map[string]any{"role": "patient", "content": "m"}
	}
	row := inquiryRow(f, id)
	row["diagnosis_report"].(map[string]any)["messages"] = msgs
	if rec := hdo(s, "POST", "/api/doctor/reply", "tok-doc", fmt.Sprintf(`{"requestId":%q,"message":"x","targetTable":"inquiries"}`, id)); rec.Code != http.StatusConflict {
		t.Errorf("doctor reply on a full thread = %d, want 409", rec.Code)
	}
	if rec := hdo(s, "POST", "/api/patient/reply", "tok-pat", fmt.Sprintf(`{"requestId":%q,"message":"x"}`, id)); rec.Code != http.StatusConflict {
		t.Errorf("patient reply on a full thread = %d, want 409", rec.Code)
	}
	// a thread whose serialized size is over the per-row bound is refused too
	row["diagnosis_report"].(map[string]any)["messages"] = []any{map[string]any{"role": "patient", "content": strings.Repeat("A", maxThreadBytes)}}
	if rec := hdo(s, "POST", "/api/doctor/reply", "tok-doc", fmt.Sprintf(`{"requestId":%q,"message":"x","targetTable":"inquiries"}`, id)); rec.Code != http.StatusRequestEntityTooLarge {
		t.Errorf("reply on an oversized thread = %d, want 413", rec.Code)
	}
}

func TestPatientCancelKeepsWhatTheDoctorAlreadyWorkedOn(t *testing.T) {
	s, f := dataFake(t)
	untouched := newRequest(t, s, "tok-pat", 20)
	worked := newRequest(t, s, "tok-pat", 21)
	hdo(s, "POST", "/api/doctor/reply", "tok-doc", fmt.Sprintf(`{"requestId":%q,"message":"Clinical advice that must not vanish","targetTable":"inquiries"}`, worked))
	hdo(s, "POST", "/api/doctor/treatment-plan", "tok-doc", fmt.Sprintf(`{"requestId":%q,"plan":{"pattern":"x"}}`, worked))

	if rec := hdo(s, "POST", "/api/patient/requests/cancel", "tok-pat2", fmt.Sprintf(`{"id":%q}`, worked)); rec.Code != 403 {
		t.Errorf("someone else's request = %d, want 403", rec.Code)
	}
	rec := hdo(s, "POST", "/api/patient/requests/cancel", "tok-pat", fmt.Sprintf(`{"id":%q}`, untouched))
	if rec.Code != 200 || inquiryRow(f, untouched) != nil {
		t.Errorf("an untouched request is deleted: %d row=%v", rec.Code, inquiryRow(f, untouched))
	}
	rec = hdo(s, "POST", "/api/patient/requests/cancel", "tok-pat", fmt.Sprintf(`{"id":%q}`, worked))
	row := inquiryRow(f, worked)
	if rec.Code != 200 || row == nil {
		t.Fatalf("a worked-on request is archived, not deleted: %d row=%v", rec.Code, row)
	}
	rep, _ := row["diagnosis_report"].(map[string]any)
	if rep["cancelled_by_patient"] != true || len(messagesOf(row)) != 1 || rep["treatment_plan"] == nil {
		t.Errorf("the doctor's reply and plan must survive, flagged cancelled: %v", rep)
	}
	// the doctor still sees it; the patient no longer does
	inbox := hjson(t, hdo(s, "GET", "/api/doctor/requests", "tok-doc", ""))["requests"].([]any)
	found := false
	for _, r := range inbox {
		found = found || r.(map[string]any)["id"] == worked
	}
	if !found {
		t.Error("the doctor's inbox lost the cancelled-but-answered request")
	}
	mine := hjson(t, hdo(s, "GET", "/api/patient/requests", "tok-pat", ""))["requests"].([]any)
	for _, r := range mine {
		if r.(map[string]any)["id"] == worked {
			t.Error("the patient's own list must hide the cancelled request")
		}
	}
	if rec := hdo(s, "POST", "/api/patient/reply", "tok-pat", fmt.Sprintf(`{"requestId":%q,"message":"hello?"}`, worked)); rec.Code != http.StatusConflict {
		t.Errorf("replying into a cancelled request = %d, want 409", rec.Code)
	}
}

// ---------------------------------------------------------------------------------------------------------------
// staff-08 / robust-03: the master inbox
// ---------------------------------------------------------------------------------------------------------------

func seedInbox(f *hfake, n int) {
	base := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)
	for i := 0; i < n; i++ {
		row := map[string]any{
			"id": fmt.Sprintf("r%04d", i), "user_id": "pat-1", "doctor_id": hDocID, "status": "reviewed", "symptoms": "x",
			"created_at": base.Add(time.Duration(i) * time.Second).Format(time.RFC3339), "diagnosis_report": map[string]any{"messages": []any{}},
		}
		if i == 0 { // the OLDEST row is the one that must not vanish: critical and pending
			row["status"], row["flag"] = "pending", "critical"
		}
		f.tables["inquiries"] = append(f.tables["inquiries"], row)
	}
}

func TestInboxDeclaresTruncationAndKeepsOpenCases(t *testing.T) {
	s, f := dataFake(t)
	seedInbox(f, inboxLimit+60)
	rec := hdo(s, "GET", "/api/doctor/requests", "tok-doc", "")
	m := hjson(t, rec)
	rows, _ := m["requests"].([]any)
	if m["truncated"] != true || int(m["total"].(float64)) != inboxLimit+60 || m["next"] == nil {
		t.Fatalf("truncation not declared: truncated=%v total=%v next=%v", m["truncated"], m["total"], m["next"])
	}
	has := func(id string) bool {
		for _, r := range rows {
			if r.(map[string]any)["id"] == id {
				return true
			}
		}
		return false
	}
	if !has("r0000") {
		t.Error("the oldest critical pending request vanished from the inbox")
	}
	if !has(fmt.Sprintf("r%04d", inboxLimit+59)) {
		t.Error("the newest request is missing")
	}
	if len(rows) != inboxLimit+1 {
		t.Errorf("%d rows, want the newest %d plus the one open older case", len(rows), inboxLimit)
	}
	// a small inbox is not truncated
	s2, f2 := dataFake(t)
	seedInbox(f2, 5)
	m2 := hjson(t, hdo(s2, "GET", "/api/doctor/requests", "tok-doc", ""))
	if m2["truncated"] != false || int(m2["total"].(float64)) != 5 || m2["next"] != nil {
		t.Errorf("small inbox: %v", m2)
	}
	if rec := hdo(s2, "GET", "/api/doctor/requests?before=yesterday", "tok-doc", ""); rec.Code != 400 {
		t.Errorf("bad cursor = %d, want 400", rec.Code)
	}
}

func TestInboxSurvivesAnUnreadablyLargeResponse(t *testing.T) {
	s, f := dataFake(t)
	seedInbox(f, 40)
	// the one-shot query (limit=300) fails as if the response blew the 10 MB client cap; small pages work
	f.failGet = func(table, raw string) bool { return table == "inquiries" && strings.Contains(raw, "limit=300") }
	rec := hdo(s, "GET", "/api/doctor/requests", "tok-doc", "")
	rows, _ := hjson(t, rec)["requests"].([]any)
	if rec.Code != 200 || len(rows) != 40 {
		t.Fatalf("fallback paging: %d, %d rows, want 40", rec.Code, len(rows))
	}
	// and a single poisonous row costs only itself
	f.failGet = func(table, raw string) bool {
		return table == "inquiries" && (strings.Contains(raw, "limit=300") || strings.Contains(raw, "limit=8&offset=8") || strings.Contains(raw, "limit=1&offset=10"))
	}
	rec = hdo(s, "GET", "/api/doctor/requests", "tok-doc", "")
	rows, _ = hjson(t, rec)["requests"].([]any)
	if rec.Code != 200 || len(rows) < 30 || len(rows) >= 40 {
		t.Fatalf("poison row: %d, %d rows (want most of 40 but not all)", rec.Code, len(rows))
	}
}

// ---------------------------------------------------------------------------------------------------------------
// patient-07 / patient-08 / patient-23: profile
// ---------------------------------------------------------------------------------------------------------------

func lastProfileUpsert(f *hfake) map[string]any {
	rows := f.rows("profiles")
	return rows[len(rows)-1]
}

func TestProfileFieldsCanBeCleared(t *testing.T) {
	s, f := dataFake(t)
	if rec := hdo(s, "PUT", "/api/patient/profile", "tok-pat", `{"medical_history":"diabetes","gender":"female","age":40,"height":170.5,"weight":60,"bmi":20.7,"full_name":"Ann"}`); rec.Code != 200 {
		t.Fatalf("save = %d %s", rec.Code, rec.Body.String())
	}
	row := lastProfileUpsert(f)
	if row["medical_history"] != "diabetes" || row["gender"] != "female" || row["full_name"] != "Ann" || row["age"] != float64(40) {
		t.Fatalf("saved row %v", row)
	}
	for _, body := range []string{`{"medical_history":"","gender":""}`, `{"medical_history":null,"gender":null}`, `{"medical_history":"   \n","gender":"  "}`} {
		if rec := hdo(s, "PUT", "/api/patient/profile", "tok-pat", body); rec.Code != 200 {
			t.Fatalf("%s = %d", body, rec.Code)
		}
		row = lastProfileUpsert(f)
		mh, hasMH := row["medical_history"]
		g, hasG := row["gender"]
		if !hasMH || mh != nil || !hasG || g != nil {
			t.Errorf("%s must send an explicit NULL for both fields, row=%v", body, row)
		}
	}
	// numeric fields clear with null
	hdo(s, "PUT", "/api/patient/profile", "tok-pat", `{"age":null,"height":null}`)
	row = lastProfileUpsert(f)
	if v, has := row["age"]; !has || v != nil {
		t.Errorf("age:null must clear, row=%v", row)
	}
	// absent fields are left alone (not cleared)
	hdo(s, "PUT", "/api/patient/profile", "tok-pat", `{"full_name":"Bea"}`)
	row = lastProfileUpsert(f)
	if _, has := row["medical_history"]; has {
		t.Errorf("a field that was not sent must not be touched: %v", row)
	}
}

func TestProfileNumbersAndNamesAreValidated(t *testing.T) {
	s, f := dataFake(t)
	before := len(f.rows("profiles"))
	for _, body := range []string{
		`{"age":-1}`, `{"age":0}`, `{"age":121}`, `{"age":200}`, `{"age":3.5}`, `{"age":1e30}`, `{"age":1e20}`, `{"age":"30"}`,
		`{"height":-5}`, `{"height":29}`, `{"height":301}`, `{"weight":0}`, `{"weight":501}`, `{"bmi":99999}`, `{"bmi":4}`,
		`{"full_name":"   "}`, `{"full_name":"Dr\u0000x"}`, `{"full_name":"Dr ‮weL"}`, `{"full_name":5}`,
		`{"gender":5}`, `{"medical_history":["a"]}`, `{"preferred_language":"klingon"}`,
	} {
		if rec := hdo(s, "PUT", "/api/patient/profile", "tok-pat", body); rec.Code != 400 {
			t.Errorf("%s = %d, want 400", body, rec.Code)
		}
	}
	if len(f.rows("profiles")) != before {
		t.Error("a refused profile update must not write anything")
	}
	for _, body := range []string{`{"age":1}`, `{"age":120}`, `{"height":30}`, `{"height":300}`, `{"weight":2}`, `{"bmi":5}`, `{"bmi":100}`, `{"full_name":"李 医生"}`, `{"preferred_language":"ms"}`, `{"preferred_language":""}`} {
		if rec := hdo(s, "PUT", "/api/patient/profile", "tok-pat", body); rec.Code != 200 {
			t.Errorf("%s = %d, want 200", body, rec.Code)
		}
	}
}

// ---------------------------------------------------------------------------------------------------------------
// patient-09 / patient-21 / robust-10: sessions
// ---------------------------------------------------------------------------------------------------------------

func TestSessionPayloadsAreValidated(t *testing.T) {
	s, f := dataFake(t)
	deep := fmt.Sprintf(`{"full_report":%s1%s,"primary_diagnosis":"x"}`, strings.Repeat(`{"a":`, maxSessionJSONNesting+50), strings.Repeat("}", maxSessionJSONNesting+50))
	bad := []string{
		`{"full_report":{"a":1},"primary_diagnosis":"x","overall_score":"abc"}`,
		`{"full_report":{"a":1},"primary_diagnosis":"x","overall_score":55.5}`,
		`{"full_report":{"a":1},"primary_diagnosis":"x","overall_score":101}`,
		`{"full_report":{"a":1},"primary_diagnosis":"x","overall_score":-1}`,
		`{"full_report":{"a":1},"primary_diagnosis":"x","symptoms":{"a":1}}`,
		`{"full_report":{"a":1},"primary_diagnosis":"x","symptoms":[1,2]}`,
		`{"full_report":{"a":1},"primary_diagnosis":"x","medicines":"aspirin"}`,
		`{"full_report":{"a":1},"primary_diagnosis":"x","follow_up_date":"notadate"}`,
		`{"full_report":{"a":1},"primary_diagnosis":"x","follow_up_date":"2026-13-45"}`,
		`{"full_report":{"a":1},"primary_diagnosis":"x","follow_up_date":5}`,
		`{"full_report":[1,2],"primary_diagnosis":"x"}`,
		`{"full_report":"just text","primary_diagnosis":"x"}`,
		`{"full_report":{"a":1},"primary_diagnosis":{"o":1}}`,
		`{"full_report":{"a":1},"primary_diagnosis":"x","notes":5}`,
		`{"full_report":{"a":1},"primary_diagnosis":"x","is_hidden":"yes"}`,
		deep,
	}
	for _, b := range bad {
		for _, route := range []string{"/api/patient/sessions", "/api/guest/sessions"} {
			tok := "tok-pat"
			if route == "/api/guest/sessions" {
				tok = ""
				if strings.Contains(b, "is_hidden") {
					continue // not a guest column: dropped by the column filter
				}
			}
			if rec := hdo(s, "POST", route, tok, b); rec.Code != 400 {
				t.Errorf("%s %.80s = %d, want 400", route, b, rec.Code)
			}
		}
	}
	if len(f.rows("diagnosis_sessions"))+len(f.rows("guest_diagnosis_sessions")) != 0 {
		t.Fatal("a rejected payload was stored")
	}
	rec := hdo(s, "POST", "/api/patient/sessions", "tok-pat", `{"full_report":{"a":1},"primary_diagnosis":"x","overall_score":88,"follow_up_date":"2026-10-12T08:00:00Z","symptoms":"a, b","medicines":["m"]}`)
	if rec.Code != 201 {
		t.Fatalf("valid session = %d %s", rec.Code, rec.Body.String())
	}
	row := f.rows("diagnosis_sessions")[0]
	if row["follow_up_date"] != "2026-10-12" || row["overall_score"] != float64(88) {
		t.Errorf("stored %v (a timestamp must be normalised to a date)", row)
	}
}

func TestSessionListPagesAndHidesHiddenSessions(t *testing.T) {
	s, f := dataFake(t)
	base := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)
	for i := 0; i < 52; i++ {
		f.tables["diagnosis_sessions"] = append(f.tables["diagnosis_sessions"], map[string]any{
			"id": fmt.Sprintf("11111111-0000-4000-8000-%012d", i), "user_id": "pat-1", "symptoms": []any{fmt.Sprintf("s%d", i)},
			"created_at": base.Add(time.Duration(i) * time.Hour).Format(time.RFC3339), "full_report": map[string]any{}, "is_hidden": false,
		})
	}
	f.tables["diagnosis_sessions"] = append(f.tables["diagnosis_sessions"],
		map[string]any{"id": "hidden-1", "user_id": "pat-1", "symptoms": []any{"hidden"}, "created_at": base.Add(100 * time.Hour).Format(time.RFC3339), "full_report": map[string]any{}, "is_hidden": true},
		map[string]any{"id": "other-1", "user_id": "pat-2", "symptoms": []any{"other"}, "created_at": base.Format(time.RFC3339), "full_report": map[string]any{}},
	)
	m := hjson(t, hdo(s, "GET", "/api/patient/sessions", "tok-pat", ""))
	list, _ := m["sessions"].([]any)
	if len(list) > sessionsPageDefault || int(m["total"].(float64)) != 52 || m["has_more"] != true || m["truncated"] != true {
		t.Fatalf("page 1: %d sessions, total=%v has_more=%v", len(list), m["total"], m["has_more"])
	}
	for _, x := range list {
		if x.(map[string]any)["id"] == "hidden-1" || x.(map[string]any)["id"] == "other-1" {
			t.Fatalf("hidden / foreign session listed: %v", x)
		}
		if _, leaked := x.(map[string]any)["is_hidden"]; leaked {
			t.Fatal("the is_hidden column is not part of the response shape")
		}
	}
	m2 := hjson(t, hdo(s, "GET", "/api/patient/sessions?offset=50&limit=50", "tok-pat", ""))
	rest, _ := m2["sessions"].([]any)
	if m2["has_more"] != false {
		t.Fatalf("page 2: has_more=%v", m2["has_more"])
	}
	// the two pages together are every visible session exactly once (a hidden row only shortens its own page)
	seen := map[string]bool{}
	for _, x := range append(append([]any{}, list...), rest...) {
		id := x.(map[string]any)["id"].(string)
		if seen[id] {
			t.Fatalf("session %s listed twice", id)
		}
		seen[id] = true
	}
	if len(seen) != 52 {
		t.Fatalf("pages cover %d sessions, want all 52 visible ones", len(seen))
	}
	one := hjson(t, hdo(s, "GET", "/api/patient/sessions?id=11111111-0000-4000-8000-000000000003", "tok-pat", ""))
	if got, _ := one["sessions"].([]any); len(got) != 1 {
		t.Fatalf("?id= returned %v", one)
	}
	for _, q := range []string{"limit=0", "limit=abc", "offset=-1", "id=not-a-uuid"} {
		if rec := hdo(s, "GET", "/api/patient/sessions?"+q, "tok-pat", ""); rec.Code != 400 {
			t.Errorf("?%s = %d, want 400", q, rec.Code)
		}
	}
}

func TestGuestSessionCreateIsRateLimited(t *testing.T) {
	s, _ := dataFake(t)
	codes := []int{}
	for i := 0; i < 12; i++ {
		codes = append(codes, hdoIP(s, "POST", "/api/guest/sessions", "", `{"full_report":{"a":1},"primary_diagnosis":"x"}`, "10.55.66.77").Code)
	}
	if codes[9] != 201 || codes[10] != 429 || codes[11] != 429 {
		t.Fatalf("expected 10 saves then 429s: %v", codes)
	}
	if hdoIP(s, "POST", "/api/guest/sessions", "", `{"full_report":{"a":1},"primary_diagnosis":"x"}`, "10.55.66.78").Code != 201 {
		t.Error("another client has its own budget")
	}
}

// ---------------------------------------------------------------------------------------------------------------
// patient-10 / 11 / 12 / 22 / robust-09: notifications
// ---------------------------------------------------------------------------------------------------------------

func TestNotificationPreferencesAreValidatedAndServerControlled(t *testing.T) {
	s, f := dataFake(t)
	for _, body := range []string{`{"foo":1}`, `{"quiet_hours_start":"99:99"}`, `{"quiet_hours_end":"25:99"}`, `{"quiet_hours_start":5}`, `{"enabled":"yes"}`, `{"enabled":null}`, `{"categories":{"health":"yes"}}`, `{"categories":[true]}`} {
		if rec := hdo(s, "POST", "/api/notifications/preferences", "tok-pat", body); rec.Code != 400 {
			t.Errorf("%s = %d, want 400", body, rec.Code)
		}
	}
	if len(f.rows("user_notification_preferences")) != 0 {
		t.Fatal("a refused preferences update wrote a row")
	}
	first := hjson(t, hdo(s, "POST", "/api/notifications/preferences", "tok-pat", `{"enabled":true,"quiet_hours_start":"21:30"}`))
	prefs, _ := first["preferences"].(map[string]any)
	id0, ca0 := prefs["id"], prefs["created_at"]
	if prefs["quiet_hours_start"] != "21:30:00" {
		t.Errorf("time normalised to HH:MM:SS, got %v", prefs["quiet_hours_start"])
	}
	// a client cannot overwrite id / created_at / user_id; a payload with only server columns changes nothing
	evil := hjson(t, hdo(s, "POST", "/api/notifications/preferences", "tok-pat", `{"id":"11111111-1111-1111-1111-111111111111","created_at":"2000-01-01T00:00:00Z","user_id":"pat-2"}`))
	p2, _ := evil["preferences"].(map[string]any)
	if p2["id"] != id0 || p2["created_at"] != ca0 || p2["user_id"] != "pat-1" {
		t.Errorf("mass assignment: id %v->%v created_at %v->%v user_id %v", id0, p2["id"], ca0, p2["created_at"], p2["user_id"])
	}
	if n := len(f.rows("user_notification_preferences")); n != 1 {
		t.Errorf("%d preference rows, want 1", n)
	}
	// the same call mixed with a real change applies the real change only
	hdo(s, "POST", "/api/notifications/preferences", "tok-pat", `{"id":"x","enabled":false}`)
	row := f.rows("user_notification_preferences")[0]
	if row["enabled"] != false || row["id"] != id0 {
		t.Errorf("row %v", row)
	}
}

func TestDeviceRegistrationIsValidatedAndRaceFree(t *testing.T) {
	s, f := dataFake(t)
	for _, body := range []string{`{"deviceToken":"t","deviceType":"toaster"}`, `{"deviceToken":"t","deviceType":"Web"}`, `{"deviceToken":"` + strings.Repeat("x", 600) + `","deviceType":"web"}`, `{"deviceToken":"t\u0000","deviceType":"web"}`} {
		if rec := hdo(s, "POST", "/api/notifications/register-device", "tok-pat", body); rec.Code != 400 {
			t.Errorf("%.60s = %d, want 400", body, rec.Code)
		}
	}
	var wg sync.WaitGroup
	codes := make([]int, 20)
	for i := range codes {
		wg.Add(1)
		go func(i int) {
			defer wg.Done()
			codes[i] = hdo(s, "POST", "/api/notifications/register-device", "tok-pat", `{"deviceToken":"same-new-token","deviceType":"web","deviceName":"tab"}`).Code
		}(i)
	}
	wg.Wait()
	for _, c := range codes {
		if c != 200 {
			t.Fatalf("parallel registrations of one new token: %v", codes)
		}
	}
	if n := len(f.rows("user_devices")); n != 1 {
		t.Fatalf("%d device rows, want 1 (the unique key would have 500'd the loser)", n)
	}
}

func TestScheduledNotificationValidation(t *testing.T) {
	s, f := dataFake(t)
	when := time.Now().Add(time.Hour).UTC().Format(time.RFC3339)
	ok := func(extra string) string {
		return fmt.Sprintf(`{"notification_type":"med","title":"T","body":"B","scheduled_for":%q,"category":"medication"%s}`, when, extra)
	}
	for _, c := range []struct{ name, body string }{
		{"bad date", fmt.Sprintf(`{"notification_type":"med","title":"T","body":"B","scheduled_for":"tomorrow","category":"c"}`)},
		{"null title", fmt.Sprintf(`{"notification_type":"med","title":null,"body":"B","scheduled_for":%q,"category":"c"}`, when)},
		{"numeric title", fmt.Sprintf(`{"notification_type":"med","title":5,"body":"B","scheduled_for":%q,"category":"c"}`, when)},
		{"blank body", fmt.Sprintf(`{"notification_type":"med","title":"T","body":"  ","scheduled_for":%q,"category":"c"}`, when)},
		{"bad priority", ok(`,"priority":"urgentest"`)},
		{"data not an object", ok(`,"data":"x"`)},
		{"unknown field", ok(`,"foo":1`)},
		{"repeat_config not an object", ok(`,"repeat_config":[1]`)},
	} {
		if rec := hdo(s, "POST", "/api/notifications/schedule", "tok-pat", c.body); rec.Code != 400 {
			t.Errorf("%s = %d %s, want 400", c.name, rec.Code, rec.Body.String())
		}
	}
	if len(f.rows("scheduled_notifications")) != 0 {
		t.Fatal("refused reminders were stored")
	}
	rec := hdo(s, "POST", "/api/notifications/schedule", "tok-pat", ok(`,"priority":"high","is_sent":true,"is_cancelled":true,"sent_at":"2000-01-01T00:00:00Z","user_id":"pat-2","id":"x"`))
	if rec.Code != 200 {
		t.Fatalf("valid reminder = %d %s", rec.Code, rec.Body.String())
	}
	row := f.rows("scheduled_notifications")[0]
	if row["is_sent"] != false || row["is_cancelled"] != false || row["sent_at"] != nil || row["user_id"] != "pat-1" || row["id"] == "x" || row["priority"] != "high" {
		t.Errorf("state flags / owner must be server controlled: %v", row)
	}
	// DELETE with a slug id is a 400, a uuid cancels
	if rec := hdo(s, "DELETE", "/api/notifications/schedule?id=abc", "tok-pat", ""); rec.Code != 400 {
		t.Errorf("non-uuid id = %d, want 400", rec.Code)
	}
	if rec := hdo(s, "DELETE", "/api/notifications/schedule?id=11111111-1111-4111-8111-111111111111", "tok-pat", ""); rec.Code != 200 {
		t.Errorf("uuid id = %d, want 200", rec.Code)
	}
}

func TestNotificationSyncIsIdempotent(t *testing.T) {
	s, f := dataFake(t)
	when := time.Now().Add(24 * time.Hour).UTC().Format(time.RFC3339)
	body := fmt.Sprintf(`{"deviceToken":"dev","syncData":{"notificationHistory":[{"type":"med","title":"H","body":"b","sentAt":"2026-01-01T00:00:00Z"},{"type":"med","title":"H","body":"b","sentAt":"2026-01-01T00:00:00Z"},{"type":"x","title":"NoTime","body":"b"}],"scheduledNotifications":[{"type":"x","title":"S","body":"b","scheduledFor":%q,"category":"health"}]}}`, when)
	for i := 0; i < 3; i++ {
		if rec := hdo(s, "POST", "/api/notifications/sync", "tok-pat", body); rec.Code != 200 {
			t.Fatalf("sync %d = %d %s", i, rec.Code, rec.Body.String())
		}
	}
	if n := len(f.rows("notification_history")); n != 2 {
		t.Errorf("%d history rows after 3 syncs, want 2 (H once, NoTime once)", n)
	}
	if n := len(f.rows("scheduled_notifications")); n != 1 {
		t.Errorf("%d scheduled rows after 3 syncs, want 1", n)
	}
	// a different time is a different row
	hdo(s, "POST", "/api/notifications/sync", "tok-pat", `{"deviceToken":"dev","syncData":{"notificationHistory":[{"type":"med","title":"H","body":"b","sentAt":"2026-02-02T00:00:00Z"}]}}`)
	if n := len(f.rows("notification_history")); n != 3 {
		t.Errorf("%d history rows, want 3", n)
	}
}

func TestReportViewedIsRateLimited(t *testing.T) {
	s, _ := dataFake(t)
	var last int
	n429 := 0
	for i := 0; i < 15; i++ {
		last = hdoIP(s, "POST", "/api/notifications/report-viewed", "", `{"isGuest":true}`, "10.9.9.9").Code
		if last == 429 {
			n429++
		}
	}
	if n429 == 0 {
		t.Fatal("report-viewed (a Telegram message per call when configured) must be throttled")
	}
}

// ---------------------------------------------------------------------------------------------------------------
// staff-10..24: admin
// ---------------------------------------------------------------------------------------------------------------

func TestAdminSettingsMaskingAndRoundTrip(t *testing.T) {
	s, f := dataFake(t)
	f.tables["admin_settings"] = []map[string]any{{
		"id": 1, "gemini_api_key": "AIzaSyREALKEY123456", "music_enabled": true,
		"settings": map[string]any{"smtp_password": "hunter2hunter2", "nested": map[string]any{"x_api_key": "abcdefghijkl", "list": []any{map[string]any{"token": "tttttttttt"}}}, "plain": "visible"},
	}}
	get := func(tok string) string { return hdo(s, "GET", "/api/admin/settings", tok, "").Body.String() }
	for _, tok := range []string{"tok-adm", "tok-dev"} {
		body := get(tok)
		for _, secret := range []string{"AIzaSyREALKEY123456", "hunter2hunter2", "abcdefghijkl", "tttttttttt"} {
			if strings.Contains(body, secret) {
				t.Errorf("%s: secret %q returned in clear: %s", tok, secret, body)
			}
		}
		if !strings.Contains(body, "...123456") || !strings.Contains(body, "visible") {
			t.Errorf("%s: masking shape wrong: %s", tok, body)
		}
	}
	// a form that loaded the masked values and saves them back must not destroy the stored secrets
	masked := hjson(t, hdo(s, "GET", "/api/admin/settings", "tok-adm", ""))
	payload, _ := json.Marshal(map[string]any{"gemini_api_key": masked["gemini_api_key"], "music_enabled": false, "settings": masked["settings"]})
	rec := hdo(s, "PUT", "/api/admin/settings", "tok-adm", string(payload))
	if rec.Code != 200 {
		t.Fatalf("PUT = %d %s", rec.Code, rec.Body.String())
	}
	row := f.rows("admin_settings")[0]
	if row["gemini_api_key"] != "AIzaSyREALKEY123456" {
		t.Errorf("the mask overwrote the key: %v", row["gemini_api_key"])
	}
	st, _ := row["settings"].(map[string]any)
	nested, _ := st["nested"].(map[string]any)
	if st["smtp_password"] != "hunter2hunter2" || nested["x_api_key"] != "abcdefghijkl" || st["plain"] != "visible" || row["music_enabled"] != false {
		t.Errorf("nested secrets lost / change not applied: %v", row)
	}
	// the response never echoes a full secret
	rec = hdo(s, "PUT", "/api/admin/settings", "tok-adm", `{"gemini_api_key":"AIzaSyBRANDNEWKEY987654"}`)
	if strings.Contains(rec.Body.String(), "BRANDNEWKEY") || !strings.Contains(rec.Body.String(), "...987654") {
		t.Errorf("PUT response: %s", rec.Body.String())
	}
	if f.rows("admin_settings")[0]["gemini_api_key"] != "AIzaSyBRANDNEWKEY987654" {
		t.Error("a real new key must be stored")
	}
	// only masked placeholders in the body: no change, still a success
	before := f.rows("admin_settings")[0]["gemini_api_key"]
	if rec := hdo(s, "PUT", "/api/admin/settings", "tok-adm", `{"gemini_api_key":"...987654"}`); rec.Code != 200 || f.rows("admin_settings")[0]["gemini_api_key"] != before {
		t.Errorf("masked-only PUT: %d key %v", rec.Code, f.rows("admin_settings")[0]["gemini_api_key"])
	}
}

func TestAdminSettingsTypeAndURLValidation(t *testing.T) {
	s, f := dataFake(t)
	f.tables["admin_settings"] = []map[string]any{{"id": 1}}
	for _, body := range []string{
		`{"music_enabled":"yes"}`, `{"music_url":"javascript:alert(1)"}`, `{"music_url":"data:text/html,<script>"}`, `{"music_url":"//evil.example/x.mp3"}`, `{"music_url":5}`,
		`{"acknowledged_alerts":"x"}`, `{"acknowledged_alerts":[1]}`, `{"gemini_api_key":5}`, `{"gemini_api_key":"` + strings.Repeat("k", 600) + `"}`,
		`{"settings":"x"}`, `{"settings":[1]}`,
	} {
		if rec := hdo(s, "PUT", "/api/admin/settings", "tok-adm", body); rec.Code != 400 {
			t.Errorf("%.70s = %d, want 400", body, rec.Code)
		}
	}
	for _, body := range []string{
		`{"music_enabled":true}`, `{"music_enabled":null}`, `{"music_url":"https://cdn.example/x.mp3"}`, `{"music_url":"/static/music.mp3"}`, `{"music_url":""}`, `{"music_url":null}`,
		`{"acknowledged_alerts":["a","b"]}`, `{"gemini_api_key":""}`, `{"settings":{}}`, `{"settings":null}`,
	} {
		if rec := hdo(s, "PUT", "/api/admin/settings", "tok-adm", body); rec.Code != 200 {
			t.Errorf("%.70s = %d %s, want 200", body, rec.Code, rec.Body.String())
		}
	}
}

func TestSystemHealthIngestIsValidatedAttributedAndThrottled(t *testing.T) {
	s, f := dataFake(t)
	post := func(tok, body string) *httptest.ResponseRecorder {
		return hdoIP(s, "POST", "/api/admin/system-health", tok, body, "10.20.30.40")
	}
	for _, body := range []string{
		`{"error_type":"t","message":"m","severity":"BOGUS"}`, `{"error_type":"t","message":"m","not_a_column":1}`, `{"message":"m"}`, `{"error_type":"t"}`,
		`{"error_type":5,"message":"m"}`, `{"error_type":"t","message":"   "}`, `{"error_type":"t","message":"m","metadata":"x"}`, `{"error_type":"t","message":"m","component":5}`,
	} {
		if rec := post("", body); rec.Code != 400 {
			t.Errorf("%s = %d, want 400", body, rec.Code)
		}
	}
	if len(f.rows("system_errors")) != 0 || len(f.rows("system_logs")) != 0 {
		t.Fatal("a refused report must not be stored or swallowed into the log fallback")
	}
	// anonymous: client-chosen user_id / resolved / created_at are ignored
	if rec := post("", `{"error_type":"t","message":"anon","severity":"low","user_id":"victim","resolved":true,"created_at":"2000-01-01T00:00:00Z","id":"x"}`); rec.Code != 200 {
		t.Fatalf("valid report = %d %s", rec.Code, rec.Body.String())
	}
	row := f.rows("system_errors")[0]
	if row["user_id"] != nil || row["resolved"] != nil || row["id"] == "x" || row["created_at"] == "2000-01-01T00:00:00Z" {
		t.Errorf("server-controlled columns taken from the client: %v", row)
	}
	// logged in: attributed to the session user, never to the body
	post("tok-pat", `{"error_type":"t","message":"mine","user_id":"victim"}`)
	if row := f.rows("system_errors")[1]; row["user_id"] != "pat-1" {
		t.Errorf("session attribution: %v", row["user_id"])
	}
	n429 := 0
	for i := 0; i < 40; i++ {
		if post("", `{"error_type":"t","message":"flood","severity":"low"}`).Code == 429 {
			n429++
		}
	}
	if n429 == 0 {
		t.Error("the open error ingest must be rate limited (a few anonymous 'critical' posts flip the console to unhealthy)")
	}
}

func TestSystemHealthIgnoresResolvedErrors(t *testing.T) {
	s, f := dataFake(t)
	now := time.Now().UTC().Format(time.RFC3339)
	f.tables["system_errors"] = []map[string]any{
		{"id": "e1", "severity": "critical", "resolved": true, "created_at": now},
		{"id": "e2", "severity": "high", "resolved": true, "created_at": now},
		{"id": "e3", "severity": "low", "resolved": false, "created_at": now},
	}
	get := func() map[string]any { return hjson(t, hdo(s, "GET", "/api/admin/system-health", "tok-adm", "")) }
	m := get()
	st, _ := m["error_statistics"].(map[string]any)
	if m["overall_status"] != "healthy" || st["critical_errors"] != float64(0) || st["critical_total"] != float64(1) || st["unresolved_errors"] != float64(1) || st["resolved_errors"] != float64(2) {
		t.Fatalf("resolved errors must not degrade the console: %v %v", m["overall_status"], st)
	}
	f.tables["system_errors"] = append(f.tables["system_errors"], map[string]any{"id": "e4", "severity": "critical", "resolved": false, "created_at": now})
	if m := get(); m["overall_status"] != "degraded" {
		t.Errorf("an open critical error degrades: %v", m["overall_status"])
	}
}

func TestDBStatusChecksTheRealPromptRolesAndCountsPastAThousand(t *testing.T) {
	s, f := dataFake(t)
	for i := 0; i < 1030; i++ {
		f.tables["profiles"] = append(f.tables["profiles"], map[string]any{"id": fmt.Sprintf("p%d", i), "role": "patient"})
	}
	f.tables["profiles"] = append(f.tables["profiles"], map[string]any{"id": "a1", "role": "admin"})
	for i := 0; i < 2100; i++ {
		f.tables["diagnosis_sessions"] = append(f.tables["diagnosis_sessions"], map[string]any{"id": fmt.Sprintf("d%d", i)})
	}
	m := hjson(t, hdo(s, "GET", "/api/admin/db-status", "tok-adm", ""))
	stats, _ := m["stats"].(map[string]any)
	if stats["totalUsers"] != float64(1032) || stats["totalDiagnoses"] != float64(2100) {
		t.Errorf("counts are capped: %v", stats)
	}
	roles := map[string]bool{}
	for _, p := range m["promptsStatus"].([]any) {
		roles[p.(map[string]any)["role"].(string)] = true
	}
	for _, want := range []string{"doctor_chat", "doctor_final", "doctor_image", "doctor_listening", "doctor_inquiry_summary", "doctor_report_chat", "doctor_western_chat", "heart_companion"} {
		if !roles[want] {
			t.Errorf("prompt role %s is not checked", want)
		}
	}
	for _, legacy := range []string{"doctor_tongue", "doctor_face", "doctor_body", "doctor_pulse"} {
		if roles[legacy] {
			t.Errorf("legacy role %s is checked but nothing reads it", legacy)
		}
	}
}

func TestTestAPIKeyUsesTheConfiguredBackendAndSavedKey(t *testing.T) {
	s, f := dataFake(t)
	up := taiNewFake(t, func(n int, _ taiUpstreamReq, w http.ResponseWriter) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"candidates":[{"content":{"parts":[{"text":"API key is valid"}]}}]}`))
	})
	s.AI = gemini.New("env-key")
	s.AI.BaseURL = up.srv.URL
	s.AI.HTTP = up.srv.Client()
	s.Cfg = &config.Config{GeminiAPIKey: "env-key"}

	rec := hdo(s, "POST", "/api/admin/test-api-key", "tok-adm", `{"useSavedKey":true}`)
	if rec.Code != 200 || up.count() != 1 || !strings.Contains(up.req(0).Query, "key=env-key") {
		t.Fatalf("env key via the configured backend: %d calls=%d q=%s", rec.Code, up.count(), func() string {
			if up.count() > 0 {
				return up.req(0).Query
			}
			return ""
		}())
	}
	f.tables["admin_settings"] = []map[string]any{{"id": 1, "gemini_api_key": "saved-key"}}
	rec = hdo(s, "POST", "/api/admin/test-api-key", "tok-adm", `{"useSavedKey":true}`)
	if rec.Code != 200 || !strings.Contains(up.req(1).Query, "key=saved-key") {
		t.Fatalf("the key saved in the console wins: %d q=%s", rec.Code, up.req(1).Query)
	}
	rec = hdo(s, "POST", "/api/admin/test-api-key", "tok-adm", `{"apiKey":"typed-key"}`)
	if rec.Code != 200 || !strings.Contains(up.req(2).Query, "key=typed-key") {
		t.Fatalf("a typed key: %d", rec.Code)
	}
}

func TestLogsAndMetricsInputHandling(t *testing.T) {
	s, f := dataFake(t)
	// any category POST accepts can be filtered (it used to be limited to [A-Za-z0-9_.:-])
	for _, cat := range []string{"http request x", "api/chat", "weird & category=ok"} {
		body, _ := json.Marshal(map[string]string{"level": "info", "category": cat, "message": "m"})
		if rec := hdoIP(s, "POST", "/api/logs", "", string(body), "10.1.1.1"); rec.Code != 200 {
			t.Fatalf("post category %q = %d", cat, rec.Code)
		}
		f.mu.Lock()
		f.calls = nil
		f.mu.Unlock()
		if rec := hdo(s, "GET", "/api/logs?category="+strings.ReplaceAll(cat, " ", "%20")+"&limit=5", "tok-dev", ""); rec.Code != 200 {
			t.Errorf("filter by %q = %d %s", cat, rec.Code, rec.Body.String())
		}
		f.mu.Lock()
		found := false
		for _, c := range f.calls {
			found = found || (strings.Contains(c, "system_logs") && strings.Contains(c, "category=eq.") && !strings.Contains(c, "category=ok"))
		}
		f.mu.Unlock()
		if !found {
			t.Errorf("category %q must reach PostgREST as ONE escaped eq value: %v", cat, f.calls)
		}
	}
	for _, c := range []string{strings.Repeat("c", 101), "a\u0000b", "line\nbreak"} {
		body, _ := json.Marshal(map[string]string{"level": "info", "category": c, "message": "m"})
		if rec := hdoIP(s, "POST", "/api/logs", "", string(body), "10.1.1.2"); rec.Code != 400 {
			t.Errorf("category %.12q accepted: %d", c, rec.Code)
		}
	}
	// a malformed limit falls back to the default (50) - it must never collapse the answer to ONE row
	for i := 0; i < 5; i++ {
		f.tables["system_logs"] = append(f.tables["system_logs"], map[string]any{"id": fmt.Sprintf("l%d", i), "level": "info", "category": "c", "message": "m"})
	}
	for _, q := range []string{"0", "-3", "1e2", "abc", "2.5", ""} {
		rec := hdo(s, "GET", "/api/logs?limit="+q, "tok-dev", "")
		if got := int(hjson(t, rec)["count"].(float64)); rec.Code != 200 || got < 5 {
			t.Errorf("limit=%q -> %d with %d rows, want 200 and all 5 rows (the default limit)", q, rec.Code, got)
		}
	}
	if got := parseLimit("1e2", 50, 200); got != 50 {
		t.Errorf("parseLimit(1e2) = %d", got)
	}
	if got, want := parseLimit("500", 50, 200), 200; got != want {
		t.Errorf("parseLimit clamps to the max: %d", got)
	}
	if rec := hdo(s, "GET", "/api/logs?limit=99999", "tok-dev", ""); rec.Code != 200 {
		t.Errorf("a big limit is clamped, got %d", rec.Code)
	}

	post := func(body string) int { return hdoIP(s, "POST", "/api/monitoring/metrics", "", body, "10.1.1.3").Code }
	for _, b := range []string{
		`{"type":"hunt","metrics":[{"name":"n","value":null}]}`, `{"type":"hunt","metrics":[{"name":"n","value":"abc"}]}`,
		`{"type":"hunt","metrics":[{"name":"n","value":1,"timestamp":"garbage"}]}`, `{"type":"hunt","timestamp":"garbage","metrics":[{"name":"n","value":1}]}`,
		`{"type":"hunt","metrics":[{"value":1}]}`, `{"type":"hunt","metrics":[{"name":"  ","value":1}]}`, `{"type":"hunt","metrics":[{"name":"n","value":1,"tags":"x"}]}`,
	} {
		if c := post(b); c != 400 {
			t.Errorf("%s = %d, want 400", b, c)
		}
	}
	if c := post(`{"type":"hunt","timestamp":"2026-10-10T10:00:00Z","metrics":[{"name":"n","value":1.5,"unit":"ms","tags":{"a":"b"}}]}`); c != 200 {
		t.Errorf("valid metric = %d", c)
	}
}

func TestGeminiKeyEndpointTokenCheckAndThrottle(t *testing.T) {
	t.Setenv("MOBILE_APP_TOKEN", "s3cret-token")
	s, _ := dataFake(t)
	s.Cfg = &config.Config{GeminiAPIKey: "the-key"}
	get := func(tok string) *httptest.ResponseRecorder {
		r := httptest.NewRequest("GET", "/api/config/gemini-key", nil)
		r.RemoteAddr = "127.0.0.1:1"
		r.Header.Set("X-Forwarded-For", "10.8.8.8")
		if tok != "" {
			r.Header.Set("X-App-Token", tok)
		}
		rec := httptest.NewRecorder()
		s.Mux.ServeHTTP(rec, r)
		return rec
	}
	if rec := get("s3cret-token"); rec.Code != 200 || !strings.Contains(rec.Body.String(), "the-key") {
		t.Fatalf("right token = %d %s", rec.Code, rec.Body.String())
	}
	for _, bad := range []string{"", "s3cret-toke", "s3cret-tokenX", "S3CRET-TOKEN"} {
		if rec := get(bad); rec.Code != 401 {
			t.Errorf("token %q = %d, want 401", bad, rec.Code)
		}
	}
	n429 := 0
	for i := 0; i < 15; i++ {
		if get("guess").Code == 429 {
			n429++
		}
	}
	if n429 == 0 {
		t.Error("the key endpoint must be rate limited so the token cannot be ground down")
	}
}

// ---------------------------------------------------------------------------------------------------------------
// misc hygiene
// ---------------------------------------------------------------------------------------------------------------

func TestAuthenticatedJSONIsNeverCacheable(t *testing.T) {
	s, _ := dataFake(t)
	for _, p := range []string{"/api/auth/me", "/api/patient/sessions", "/api/patient/profile"} {
		rec := hdo(s, "GET", p, "tok-pat", "")
		if rec.Code != 200 || !strings.Contains(rec.Header().Get("Cache-Control"), "no-store") {
			t.Errorf("GET %s: %d Cache-Control=%q", p, rec.Code, rec.Header().Get("Cache-Control"))
		}
	}
}

func TestUpstreamAIErrorsAreRedactedInTheServerLog(t *testing.T) {
	var buf bytes.Buffer
	log.SetOutput(&buf)
	defer log.SetOutput(log.Writer())
	// the AI backend is down: Go's transport error embeds the full request URL, whose query carries the API key
	ai := gemini.New("SUPERSECRETKEY123")
	ai.BaseURL = "http://127.0.0.1:1"
	s, f := dataFake(t)
	s.AI = ai
	s.Cfg = &config.Config{GeminiAPIKey: "SUPERSECRETKEY123"}
	f.tables["patients"] = []map[string]any{{"id": "p1", "first_name": "A", "user_id": "pat-1"}}

	taiPostTo := func(h http.HandlerFunc, body string) {
		r := httptest.NewRequest("POST", "/x", strings.NewReader(body))
		r.Header.Set("Content-Type", "application/json")
		h(httptest.NewRecorder(), r)
	}
	taiPostTo(s.handleChat, `{"messages":[{"role":"user","content":"hi"}]}`)
	rec := httptest.NewRecorder()
	r := httptest.NewRequest("POST", "/api/ai/patient-summary", strings.NewReader(`{"patientId":"p1"}`))
	s.handleAIPatientSummary(rec, r, &AuthUser{ID: "d", Role: "doctor"})
	hdo(s, "POST", "/api/admin/test-api-key", "tok-adm", `{"apiKey":"SUPERSECRETKEY123"}`)
	// the test-api-key route above runs with the fake's server AI: call the handler directly with the dead backend
	rec = httptest.NewRecorder()
	r = httptest.NewRequest("POST", "/api/admin/test-api-key", strings.NewReader(`{"apiKey":"SUPERSECRETKEY123"}`))
	r.Header.Set("Content-Type", "application/json")
	s.handleAdminTestAPIKey(rec, r, &AuthUser{ID: "a", Role: "admin"})

	out := buf.String()
	if out == "" {
		t.Fatal("expected the failures to be logged")
	}
	if strings.Contains(out, "SUPERSECRETKEY123") {
		t.Fatalf("the API key reached the server log:\n%s", out)
	}
	if !strings.Contains(out, "REDACTED") {
		t.Errorf("expected key=REDACTED in the log:\n%s", out)
	}
}
