package localdb

// Rich demo data (SEED_DEMO=1 only): 8 named doctors + the generic test doctor, 16 patients, 1-3 full TCM reports per
// patient over ~90 days, consultation requests routed to every doctor with replies/plans/flags, notifications and the
// admin/developer consoles' logs, metrics and errors. Everything is generated deterministically from the embedded JSON
// (fixed PRNG seed, ids derived from names, timestamps relative to "now"), in the same transaction as the base seed,
// guarded by the meta key seeded_demo_rich so a restart never duplicates it.

import (
	"crypto/sha256"
	"database/sql"
	"embed"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"math"
	"math/rand/v2"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"
)

//go:embed seed-demo-data.json
var seedDemoDataJSON []byte

//go:embed seed-demo-patterns-*.json
var seedDemoPatternFS embed.FS

type demoDoc struct {
	Email         string `json:"email"`
	Name          string `json:"name"`
	Specialty     string `json:"specialty"`
	Years         int    `json:"years"`
	Qualification string `json:"qualification"`
	Bio           string `json:"bio"`
	Languages     string `json:"languages"`
	Clinic        string `json:"clinic"`
	Avg           int    `json:"avg"`
}

type demoPatient struct {
	N       int     `json:"n"`
	Name    string  `json:"name"`
	First   string  `json:"first"`
	Last    string  `json:"last"`
	Age     int     `json:"age"`
	Gender  string  `json:"gender"`
	Height  float64 `json:"height"`
	Weight  float64 `json:"weight"`
	Lang    string  `json:"lang"`
	History string  `json:"history"`
	Phone   string  `json:"phone"`
}

type demoThread struct {
	Doctor  []string `json:"doctor"`
	Patient []string `json:"patient"`
	Doctor2 []string `json:"doctor2"`
}

type demoNotif struct {
	Type     string `json:"type"`
	Title    string `json:"title"`
	Body     string `json:"body"`
	Category string `json:"category"`
}

type demoLog struct {
	Level    string `json:"level"`
	Category string `json:"category"`
	Message  string `json:"message"`
	W        int    `json:"w"`
}

type demoErr struct {
	Type      string `json:"type"`
	Message   string `json:"message"`
	Component string `json:"component"`
	Severity  string `json:"severity"`
	URL       string `json:"url"`
	Resolved  bool   `json:"resolved"`
	AgoH      int    `json:"ago_h"`
}

type demoData struct {
	Doctors  []demoDoc                    `json:"doctors"`
	Patients []demoPatient                `json:"patients"`
	Threads  map[string]demoThread        `json:"threads"`
	Plans    map[string]map[string]string `json:"plans"`
	Notif    map[string][]demoNotif       `json:"notif"`
	Logs     []demoLog                    `json:"logs"`
	Errors   []demoErr                    `json:"errors"`
}

type demoText struct {
	Pattern   string   `json:"pattern"`
	Secondary []string `json:"secondary"`
	Organs    []string `json:"organs"`
	Mech      string   `json:"mech"`
	Cause     string   `json:"cause"`
	CType     string   `json:"ctype"`
	CChar     string   `json:"cchar"`
	CTend     string   `json:"ctend"`
	Symptoms  []string `json:"symptoms"`
	Inquiry   string   `json:"inquiry"`
	Tongue    string   `json:"tongue"`
	Face      string   `json:"face"`
	Audio     string   `json:"audio"`
	Pulse     string   `json:"pulse"`
	Summary   string   `json:"summary"`
	Rationale string   `json:"rationale"`
	Principle string   `json:"principle"`
	Method    string   `json:"method"`
	Good      []string `json:"good"`
	Avoid     []string `json:"avoid"`
	Recipes   []string `json:"recipes"`
	Life      []string `json:"life"`
	Points    []string `json:"points"`
	Exercise  []string `json:"exercise"`
	Emotion   string   `json:"emotion"`
	Formula   string   `json:"formula"`
	Purpose   string   `json:"purpose"`
	Dosage    string   `json:"dosage"`
	Warn      []string `json:"warn"`
	Contra    []string `json:"contra"`
	Note      string   `json:"note"`
	FuTime    string   `json:"fu_time"`
	FuImprove string   `json:"fu_improve"`
	FuNext    string   `json:"fu_next"`
}

type demoPattern struct {
	ID     string              `json:"id"`
	Scores map[string]float64  `json:"scores"`
	BPM    int                 `json:"bpm"`
	PulseQ []string            `json:"pulse_q"`
	Base   int                 `json:"base"`
	Herbs  []string            `json:"herbs"`
	T      map[string]demoText `json:"t"`
}

var demoDisclaimer = map[string]string{
	"zh": "本评估由AI辅助生成，仅供健康教育参考，不能替代专业中医师或医生的诊疗意见。如症状加重请及时就医。",
	"en": "This AI-assisted assessment is for educational purposes only and does not replace professional medical advice. Please consult a qualified practitioner.",
	"ms": "Penilaian dibantu AI ini hanya untuk tujuan pendidikan dan tidak menggantikan nasihat perubatan profesional. Sila rujuk pengamal yang bertauliah.",
}

var (
	demoHashMu    sync.Mutex
	demoHashCache = map[int]string{}
)

// demoPasswordHash hashes DemoPassword once per process and iteration count: every demo account shares the hash (the
// accounts are public throw-away logins), which keeps the seed of ~30 accounts well under a second.
func demoPasswordHash(iter int) (string, error) {
	demoHashMu.Lock()
	defer demoHashMu.Unlock()
	if h, ok := demoHashCache[iter]; ok {
		return h, nil
	}
	h, err := hashPassword(DemoPassword, iter)
	if err != nil {
		return "", err
	}
	demoHashCache[iter] = h
	return h, nil
}

func loadDemoPatterns() ([]demoPattern, error) {
	names, err := seedDemoPatternFS.ReadDir(".")
	if err != nil {
		return nil, err
	}
	var files []string
	for _, e := range names {
		if strings.HasPrefix(e.Name(), "seed-demo-patterns-") {
			files = append(files, e.Name())
		}
	}
	sort.Strings(files)
	var out []demoPattern
	for _, f := range files {
		b, err := seedDemoPatternFS.ReadFile(f)
		if err != nil {
			return nil, err
		}
		var ps []demoPattern
		if err := json.Unmarshal(b, &ps); err != nil {
			return nil, fmt.Errorf("%s: %w", f, err)
		}
		out = append(out, ps...)
	}
	return out, nil
}

// demoID derives a stable UUID from a name so demo URLs survive nightly resets.
func demoID(parts ...any) string {
	h := sha256.Sum256([]byte("sihat-demo:" + fmt.Sprint(parts...)))
	b := h[:16]
	b[6] = (b[6] & 0x0f) | 0x40
	b[8] = (b[8] & 0x3f) | 0x80
	s := hex.EncodeToString(b)
	return s[0:8] + "-" + s[8:12] + "-" + s[12:16] + "-" + s[16:20] + "-" + s[20:32]
}

func iso(t time.Time) string { return t.UTC().Format(time.RFC3339) }

// norm round-trips through JSON so every number is a float64 and every list an []any (what the REST layer would hand over).
func norm(m map[string]any) map[string]any {
	b, _ := json.Marshal(m)
	var out map[string]any
	_ = json.Unmarshal(b, &out)
	return out
}

func (d *DB) demoInsert(tx *sql.Tx, table string, item map[string]any) error {
	if _, perr := d.insertOne(tx, tables[table], norm(item), insertOpts{}); perr != nil {
		return fmt.Errorf("demo seed %s: %w", table, perr)
	}
	return nil
}

func round1(f float64) float64 { return math.Round(f*10) / 10 }

func clampInt(v, lo, hi int) int {
	if v < lo {
		return lo
	}
	if v > hi {
		return hi
	}
	return v
}

func demoEmail(n int) string {
	if n == 1 {
		return "patient@sihat.com"
	}
	return fmt.Sprintf("demo-patient-%02d@sihat.com", n)
}

// demoReport builds a report with exactly the key set of the app's consult output (key_findings is an OBJECT).
func demoReport(p demoPattern, lang string, score int) map[string]any {
	t := p.T[lang]
	nl := func(s string) string { return strings.ReplaceAll(s, `\n`, "\n") }
	delta := (score - p.Base) / 2
	scores := map[string]any{}
	for k, v := range p.Scores {
		scores[k] = clampInt(int(v)+delta, 5, 95)
	}
	var herbs []any
	for _, h := range p.Herbs {
		herbs = append(herbs, h)
	}
	return map[string]any{
		"diagnosis": map[string]any{
			"primary_pattern": t.Pattern, "secondary_patterns": t.Secondary, "affected_organs": t.Organs,
			"pathomechanism": t.Mech, "disease_cause": t.Cause,
		},
		"constitution": map[string]any{
			"type": t.CType, "description": t.CChar, "characteristics": t.CChar, "tendencies": t.CTend,
			"percentage_match": strconv.Itoa(70+score%25) + "%",
		},
		"analysis": map[string]any{
			"summary": nl(t.Summary),
			"key_findings": map[string]any{
				"from_inquiry": t.Inquiry, "from_visual": t.Tongue + " " + t.Face, "from_audio": t.Audio, "from_pulse": t.Pulse,
			},
			"pattern_rationale": t.Rationale,
			"five_elements":     map[string]any{"scores": scores},
		},
		"treatment": map[string]any{"therapeutic_principle": t.Principle, "treatment_method": t.Method},
		"recommendations": map[string]any{
			"food_therapy":    map[string]any{"beneficial": t.Good, "avoid": t.Avoid, "recipes": t.Recipes},
			"foods_to_avoid":  t.Avoid,
			"lifestyle":       t.Life,
			"acupoints":       t.Points,
			"exercise":        t.Exercise,
			"emotional_care":  t.Emotion,
			"herbal_formulas": []any{map[string]any{"name": t.Formula, "ingredients": herbs, "dosage": t.Dosage, "purpose": t.Purpose}},
		},
		"precautions": map[string]any{"warning_signs": t.Warn, "contraindications": t.Contra, "special_notes": t.Note},
		"follow_up":   map[string]any{"timeline": t.FuTime, "expected_improvement": t.FuImprove, "next_steps": t.FuNext},
		"disclaimer":  demoDisclaimer[lang],
	}
}

type demoSession struct {
	id, userID string
	created    time.Time
	pattern    int
	score      int
	report     map[string]any
}

type demoPatientRec struct {
	demoPatient
	userID, patientRowID string
	sessions             []*demoSession
}

type demoDocRef struct{ id, name string }

// seedRichDemo runs inside seed()'s transaction.
func (d *DB) seedRichDemo(tx *sql.Tx) error {
	if d.opt.NoRichDemo {
		return nil
	}
	if _, done := d.metaGetTx(tx, "seeded_demo_rich"); done {
		return nil
	}
	var dd demoData
	if err := json.Unmarshal(seedDemoDataJSON, &dd); err != nil {
		return fmt.Errorf("seed demo data: %w", err)
	}
	pats, err := loadDemoPatterns()
	if err != nil {
		return fmt.Errorf("seed demo patterns: %w", err)
	}
	rng := rand.New(rand.NewPCG(20261010, 7))
	now := d.now().UTC().Truncate(time.Second)

	// ---- doctors
	byEmail := func(email string) (string, error) {
		u, err := d.userByEmail(tx, email)
		if err != nil {
			return "", fmt.Errorf("demo seed: account %s: %w", email, err)
		}
		return u.ID, nil
	}
	var docs []demoDocRef
	docEnrich := map[string]map[string]any{
		"doctor@sihat.com": {"qualification": "B.Med (TCM), Beijing UCM · Licensed by MOH Malaysia", "languages": "English, 中文, Bahasa Malaysia", "clinic": "Sihat TCM Telehealth", "avg_response_time": 30,
			"bio": "General TCM physician answering consultation requests across all specialties; the default login of the demo environment."},
	}
	if prof, ok := docEnrich["doctor@sihat.com"]; ok {
		id, err := byEmail("doctor@sihat.com")
		if err != nil {
			return err
		}
		prof["id"] = id
		if _, perr := d.insertOne(tx, tables["profiles"], norm(prof), insertOpts{merge: true}); perr != nil {
			return perr
		}
		docs = append(docs, demoDocRef{id, "Test Doctor"})
	}
	for _, dr := range demoDoctors {
		id, err := byEmail(dr.email)
		if err != nil {
			return err
		}
		docs = append(docs, demoDocRef{id, dr.name})
	}
	for _, dr := range dd.Doctors {
		prof := map[string]any{"is_approved": true, "specialty": dr.Specialty, "years_experience": dr.Years, "qualification": dr.Qualification,
			"bio": dr.Bio, "languages": dr.Languages, "clinic": dr.Clinic, "avg_response_time": dr.Avg}
		if err := d.seedUser(tx, dr.Email, dr.Name, "doctor", norm(prof)); err != nil {
			return err
		}
		id, err := byEmail(dr.Email)
		if err != nil {
			return err
		}
		docs = append(docs, demoDocRef{id, dr.Name})
	}
	adminID, err := byEmail("admin@sihat.com")
	if err != nil {
		return err
	}

	// ---- patients (+ the managed `patients` row each registered patient has)
	recs := make([]*demoPatientRec, 0, len(dd.Patients))
	for _, p := range dd.Patients {
		email := demoEmail(p.N)
		bmi := round1(p.Weight / math.Pow(p.Height/100, 2))
		prof := map[string]any{"age": p.Age, "gender": p.Gender, "height": p.Height, "weight": p.Weight, "bmi": bmi,
			"medical_history": p.History, "preferred_language": p.Lang}
		var uid string
		if u, err := d.userByEmail(tx, email); err == nil {
			uid = u.ID
			prof["id"] = uid
			if _, perr := d.insertOne(tx, tables["profiles"], norm(prof), insertOpts{merge: true}); perr != nil {
				return perr
			}
		} else {
			if err := d.seedUser(tx, email, p.Name, "patient", norm(prof)); err != nil {
				return err
			}
			if uid, err = byEmail(email); err != nil {
				return err
			}
		}
		rec := &demoPatientRec{demoPatient: p, userID: uid, patientRowID: demoID("patient", p.N)}
		recs = append(recs, rec)
		if err := d.demoInsert(tx, "patients", map[string]any{
			"id": rec.patientRowID, "first_name": p.First, "last_name": p.Last, "ic_no": fmt.Sprintf("DEMO-IC-%03d", p.N), "email": email, "phone": p.Phone,
			"birth_date": fmt.Sprintf("%d-06-15", now.Year()-p.Age), "gender": p.Gender, "status": "active", "type": "registered",
			"user_id": uid, "created_by": docs[1].id, "created_at": iso(now.AddDate(0, 0, -95)), "updated_at": iso(now.AddDate(0, 0, -95)),
		}); err != nil {
			return err
		}
	}

	// ---- diagnosis sessions: 1-3 per patient across ~90 days, scores trending upward
	for pi, rec := range recs {
		ns := 1 + pi%3
		first := 86 - (pi*5)%20
		shift := (pi * 11) % 30
		for j := 0; j < ns; j++ {
			age := clampInt(first-j*28-shift, 1, 89)
			created := now.AddDate(0, 0, -age).Add(-time.Duration(2+rng.IntN(10)) * time.Hour)
			pidx := (pi * 3) % len(pats)
			if j == 2 {
				pidx = (pidx + 1) % len(pats)
			}
			pt := pats[pidx]
			score := clampInt(pt.Base+j*7+rng.IntN(7)-3, 20, 95)
			rep := demoReport(pt, rec.Lang, score)
			s := &demoSession{id: demoID("session", rec.N, j), userID: rec.userID, created: created, pattern: pidx, score: score, report: rep}
			rec.sessions = append(rec.sessions, s)
			t := pt.T[rec.Lang]
			row := map[string]any{
				"id": s.id, "user_id": rec.userID, "patient_id": rec.patientRowID, "primary_diagnosis": t.Pattern, "constitution": t.CType,
				"overall_score": score, "full_report": rep, "symptoms": t.Symptoms,
				"vital_signs":          map[string]any{"bpm": pt.BPM + rng.IntN(7) - 3, "temperature": 36.4 + float64(rng.IntN(6))/10, "blood_pressure": fmt.Sprintf("%d/%d", 108+rng.IntN(22), 68+rng.IntN(14))},
				"inquiry_summary":      t.Inquiry,
				"inquiry_chat_history": []any{map[string]any{"role": "user", "content": t.Inquiry}, map[string]any{"role": "assistant", "content": t.Rationale}},
				"tongue_analysis":      map[string]any{"observation": t.Tongue},
				"face_analysis":        map[string]any{"observation": t.Face},
				"audio_analysis":       map[string]any{"observation": t.Audio},
				"pulse_data":           map[string]any{"bpm": pt.BPM, "qualities": pt.PulseQ, "observation": t.Pulse},
				"treatment_plan":       t.Principle, "follow_up_date": created.AddDate(0, 0, 14).Format("2006-01-02"),
				"is_guest_session": false, "is_hidden": false, "created_at": iso(created), "updated_at": iso(created),
			}
			if err := d.demoInsert(tx, "diagnosis_sessions", row); err != nil {
				return err
			}
		}
	}

	// ---- consultation requests: every doctor gets 5, with a spread of statuses / flags / threads / plans
	type reqCfg struct {
		status, flag string
		msgs         int // 0 none, 1 doctor, 2 doctor+patient follow-up, 3 doctor+patient+doctor
		plan         bool
	}
	cfgs := []reqCfg{
		{"reviewed", "normal", 1, true},
		{"pending", "watch", 2, false},
		{"pending", "normal", 0, false},
		{"pending", "critical", 0, false},
		{"reviewed", "watch", 3, false},
	}
	for di, doc := range docs {
		for k, cf := range cfgs {
			rec := recs[(di*5+k*3+di/2)%len(recs)]
			sess := rec.sessions[(di+k)%len(rec.sessions)]
			flag := cf.flag
			if flag == "critical" && di%3 == 2 {
				flag = "watch"
			}
			created := sess.created.Add(2*time.Hour + time.Duration(rng.IntN(90))*time.Minute)
			if created.After(now.Add(-5 * time.Minute)) {
				created = now.Add(-5 * time.Minute)
			}
			th := dd.Threads[rec.Lang]
			var msgs []any
			at := created
			stepTime := func(h int) string {
				at = at.Add(time.Duration(h)*time.Hour + time.Duration(rng.IntN(40))*time.Minute)
				if at.After(now) {
					at = now.Add(-time.Minute)
				}
				return iso(at)
			}
			if cf.msgs >= 1 {
				msgs = append(msgs, map[string]any{"role": "doctor", "content": th.Doctor[(di+k)%len(th.Doctor)], "doctor_id": doc.id, "timestamp": stepTime(3 + rng.IntN(6))})
			}
			if cf.msgs >= 2 {
				msgs = append(msgs, map[string]any{"role": "patient", "content": th.Patient[k%len(th.Patient)], "timestamp": stepTime(10 + rng.IntN(10))})
			}
			if cf.msgs >= 3 {
				msgs = append(msgs, map[string]any{"role": "doctor", "content": th.Doctor2[k%len(th.Doctor2)], "doctor_id": doc.id, "timestamp": stepTime(5 + rng.IntN(5))})
			}
			status := cf.status
			t := pats[sess.pattern].T[rec.Lang]
			report := map[string]any{
				"type": "verification_request", "status": status, "messages": msgs,
				"patient_profile": map[string]any{"name": rec.Name, "email": demoEmail(rec.N), "age": rec.Age, "gender": rec.Gender, "symptoms": strings.Join(t.Symptoms, ", ")},
				"ai_diagnosis":    sess.report["diagnosis"], "full_report": sess.report,
				"selected_doctor": map[string]any{"id": doc.id, "name": doc.name}, "requested_at": iso(created),
			}
			if msgs == nil {
				report["messages"] = []any{}
			}
			if cf.plan {
				pl := dd.Plans[rec.Lang]
				report["treatment_plan"] = map[string]any{
					"pattern": t.Pattern, "treatment": t.Formula + "：" + strings.Join(pats[sess.pattern].Herbs, "、") + "。" + pl["treatment"],
					"lifestyle": pl["lifestyle"], "follow_up": created.AddDate(0, 0, 14).Format("2006-01-02"), "authored_at": iso(at), "doctor_id": doc.id,
				}
			}
			updated := created
			if len(msgs) > 0 {
				updated = at
			}
			if err := d.demoInsert(tx, "inquiries", map[string]any{
				"id": demoID("inquiry", di, k), "user_id": rec.userID, "doctor_id": doc.id, "symptoms": "Request for Verification", "status": status, "flag": flag,
				"diagnosis_report": report, "created_at": iso(created), "updated_at": iso(updated),
			}); err != nil {
				return err
			}
		}
	}

	// ---- notifications for a handful of patients
	for _, pi := range []int{0, 1, 2, 4, 6, 9, 12} {
		rec := recs[pi]
		nt := dd.Notif[rec.Lang]
		created := now.AddDate(0, 0, -30+pi)
		if err := d.demoInsert(tx, "user_notification_preferences", map[string]any{
			"id": demoID("notifpref", rec.N), "user_id": rec.userID, "enabled": pi != 6, "health_reminders": true, "medication_alerts": pi%2 == 0,
			"appointment_reminders": true, "exercise_reminders": pi%3 != 0, "sleep_reminders": true, "quiet_hours_enabled": true,
			"quiet_hours_start": "22:00:00", "quiet_hours_end": "07:00:00", "frequency_daily": true, "frequency_weekly": pi%2 == 1, "frequency_monthly": false,
			"categories": map[string]any{"health": true, "exercise": pi%3 != 0, "sleep": true, "appointment": true},
			"created_at": iso(created), "updated_at": iso(created),
		}); err != nil {
			return err
		}
		for i := 0; i < 3; i++ {
			n := nt[(pi+i)%len(nt)]
			when := now.Add(time.Duration(24*(i)+8) * time.Hour).Truncate(time.Hour)
			sent := i == 0
			if sent {
				when = now.AddDate(0, 0, -2).Truncate(time.Hour)
			}
			row := map[string]any{
				"id": demoID("sched", rec.N, i), "user_id": rec.userID, "notification_type": n.Type, "title": n.Title, "body": n.Body, "data": map[string]any{"demo": true},
				"scheduled_for": iso(when), "category": n.Category, "priority": []string{"normal", "high", "low"}[i%3], "is_sent": sent, "created_at": iso(created), "updated_at": iso(created),
			}
			if i == 1 {
				row["repeat_pattern"], row["repeat_config"] = "daily", map[string]any{"time": "08:00"}
			}
			if sent {
				row["sent_at"] = iso(when)
			}
			if err := d.demoInsert(tx, "scheduled_notifications", row); err != nil {
				return err
			}
		}
		for i := 0; i < 4; i++ {
			n := nt[(pi+i)%len(nt)]
			sentAt := now.AddDate(0, 0, -(i*3 + 1)).Truncate(time.Hour).Add(8 * time.Hour)
			clicked := (pi+i)%2 == 0
			row := map[string]any{
				"id": demoID("nhist", rec.N, i), "user_id": rec.userID, "notification_type": n.Type, "title": n.Title, "body": n.Body, "data": map[string]any{"demo": true},
				"category": n.Category, "priority": "normal", "sent_at": iso(sentAt), "clicked": clicked, "device_type": "web", "created_at": iso(sentAt),
			}
			if clicked {
				row["clicked_at"] = iso(sentAt.Add(12 * time.Minute))
			}
			if err := d.demoInsert(tx, "notification_history", row); err != nil {
				return err
			}
		}
	}

	// ---- admin / developer consoles: logs, metrics, errors over the last 7 days
	totalW := 0
	for _, l := range dd.Logs {
		totalW += l.W
	}
	var actors []string
	for _, r := range recs[:6] {
		actors = append(actors, r.userID)
	}
	for _, dc := range docs[:3] {
		actors = append(actors, dc.id)
	}
	for i := 0; i < 160; i++ {
		x, pick := rng.IntN(totalW), dd.Logs[0]
		for _, l := range dd.Logs {
			if x < l.W {
				pick = l
				break
			}
			x -= l.W
		}
		ts := now.Add(-time.Duration(rng.IntN(7*24*60)) * time.Minute)
		row := map[string]any{"timestamp": iso(ts), "level": pick.Level, "category": pick.Category, "message": pick.Message,
			"metadata": map[string]any{"demo": true, "request_id": fmt.Sprintf("req-%08x", rng.Uint32())}}
		if pick.Category == "auth" {
			row["user_id"] = actors[rng.IntN(len(actors))]
		}
		if err := d.demoInsert(tx, "system_logs", row); err != nil {
			return err
		}
	}
	for h := 0; h < 7*24; h++ {
		ts := now.Add(-time.Duration(h) * time.Hour).Truncate(time.Hour)
		hod := float64(ts.Hour())
		load := 0.5 + 0.5*math.Sin((hod-6)/24*2*math.Pi) // peaks mid-afternoon
		reqs := 12 + int(load*70) + rng.IntN(10)
		lat := 180 + int((1-load)*40) + rng.IntN(120)
		for _, m := range []struct {
			typ, name, val, unit string
		}{
			{"http", "request_count", strconv.Itoa(reqs), "count"},
			{"http", "latency_p95_ms", strconv.Itoa(lat), "ms"},
		} {
			if err := d.demoInsert(tx, "system_metrics", map[string]any{"type": m.typ, "name": m.name, "value": m.val, "unit": m.unit,
				"tags": map[string]any{"scope": "all"}, "timestamp": iso(ts), "created_at": iso(ts)}); err != nil {
				return err
			}
		}
		if h%3 == 0 {
			for _, m := range []struct {
				name, val, unit string
			}{{"ai_requests", strconv.Itoa(3 + int(load*14) + rng.IntN(4)), "count"}, {"ai_latency_ms", strconv.Itoa(3800 + rng.IntN(5200)), "ms"}} {
				if err := d.demoInsert(tx, "system_metrics", map[string]any{"type": "ai", "name": m.name, "value": m.val, "unit": m.unit,
					"tags": map[string]any{"model": "routed"}, "timestamp": iso(ts), "created_at": iso(ts)}); err != nil {
					return err
				}
			}
		}
	}
	for day := 0; day < 7; day++ {
		ts := now.AddDate(0, 0, -day).Truncate(24 * time.Hour).Add(23 * time.Hour)
		for _, m := range []struct {
			name string
			val  int
		}{{"consultations_created", 4 + rng.IntN(6)}, {"reports_generated", 9 + rng.IntN(10)}, {"new_registrations", 1 + rng.IntN(4)}} {
			if err := d.demoInsert(tx, "system_metrics", map[string]any{"type": "business", "name": m.name, "value": strconv.Itoa(m.val), "unit": "count",
				"tags": map[string]any{"period": "day"}, "timestamp": iso(ts), "created_at": iso(ts)}); err != nil {
				return err
			}
		}
	}
	for i, e := range dd.Errors {
		ts := now.Add(-time.Duration(e.AgoH) * time.Hour)
		row := map[string]any{
			"id": demoID("syserr", i), "timestamp": iso(ts), "error_type": e.Type, "message": e.Message, "component": e.Component, "severity": e.Severity,
			"stack_trace": fmt.Sprintf("%s: %s\n\tat sihattcm/internal/server.(*Server).%s (demo)\n\tat net/http.HandlerFunc.ServeHTTP", e.Type, e.Message, e.Component),
			"url":         e.URL, "user_agent": "Mozilla/5.0 (demo environment)", "session_id": fmt.Sprintf("demo-sess-%02d", i), "resolved": e.Resolved,
			"metadata": map[string]any{"demo": true}, "created_at": iso(ts), "updated_at": iso(ts),
		}
		if e.Resolved {
			row["resolved_at"], row["resolved_by"] = iso(ts.Add(2*time.Hour)), adminID
		}
		if err := d.demoInsert(tx, "system_errors", row); err != nil {
			return err
		}
	}
	return d.metaSet(tx, "seeded_demo_rich", "1")
}

// DemoStats counts the demo data per table (for --seed-demo-stats and tests).
func (d *DB) DemoStats() map[string]int {
	out := map[string]int{}
	for _, t := range []string{"profiles", "patients", "inquiries", "diagnosis_sessions", "guest_diagnosis_sessions", "user_notification_preferences",
		"scheduled_notifications", "notification_history", "system_logs", "system_metrics", "system_errors", "system_prompts"} {
		rows, err := d.loadRows(d.sql, t, "")
		if err == nil {
			out[t] = len(rows)
		}
	}
	var n int
	_ = d.sql.QueryRow("SELECT count(*) FROM users").Scan(&n)
	out["users"] = n
	return out
}

// PrintDemoStats opens (and seeds, per seedDemo) the database at path and writes the per-table counts, sorted.
func PrintDemoStats(path string, seedDemo bool, w io.Writer) error {
	db, err := Open(Options{Path: path, SeedDemo: seedDemo, Logf: func(string, ...any) {}})
	if err != nil {
		return err
	}
	defer db.Close()
	st := db.DemoStats()
	keys := make([]string, 0, len(st))
	for k := range st {
		keys = append(keys, k)
	}
	sort.Strings(keys)
	for _, k := range keys {
		fmt.Fprintf(w, "%-32s %d\n", k, st[k])
	}
	return nil
}
