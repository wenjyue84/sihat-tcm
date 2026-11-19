package localdb

import (
	"database/sql"
	_ "embed"
	"encoding/json"
	"fmt"
	"sort"
)

//go:embed seed-prompts.json
var seedPromptsJSON []byte

// DemoPassword is the password of every seeded demo account (same as scripts/seed-all.mjs).
const DemoPassword = "password123"

type seedAccount struct {
	email, name, role string
}

var demoAccounts = []seedAccount{
	{"patient@sihat.com", "Test Patient", "patient"},
	{"doctor@sihat.com", "Test Doctor", "doctor"},
	{"admin@sihat.com", "Test Admin", "admin"},
	{"developer@sihat.com", "Test Developer", "developer"},
}

type seedDoctor struct {
	email, name, specialty string
	years                  int
	qualification, bio     string
	languages, clinic      string
	avgResponse            int
}

// The 6 realistic demo doctors of scripts/seed-all.mjs.
var demoDoctors = []seedDoctor{
	{"dr.lew@sihat.com", "Lew Wen Jyue 刘文傕", "General TCM 全科中医", 22, "B.Med (TCM), Guangzhou UCM · Licensed by MOH Malaysia", "Senior physician focused on constitutional balancing, digestive and chronic-fatigue disorders. Blends classical formulas with practical lifestyle guidance.", "English, 中文, Bahasa Malaysia", "Sihat TCM Centre, Kuala Lumpur", 120},
	{"dr.tan@sihat.com", "Tan Wei Ming 陈伟明", "Acupuncture 针灸", 15, "M.Sc Acupuncture, Beijing UCM", "Pain-management and sports-injury specialist. Combines acupuncture with tui na for musculoskeletal recovery.", "English, 中文", "Wellness Point, Johor Bahru", 60},
	{"dr.lim@sihat.com", "Lim Siew Hoon 林秀云", "Gynaecology 妇科", 18, "B.Sc TCM (UiTM) · Cert. TCM Gynaecology", "Women's health and fertility support; menstrual and menopausal pattern regulation with gentle herbal therapy.", "English, 中文, 客家话", "Harmony TCM Clinic, Penang", 180},
	{"dr.nurul@sihat.com", "Nurul Aina Rahman", "Herbal Medicine 中药", 10, "Dip. TCM, INTI · Herbal Pharmacology Cert.", "Herbal-formula tailoring for chronic conditions, allergies and skin patterns. Warm, patient-centred consultations.", "Bahasa Malaysia, English", "Klinik Herba Sihat, Shah Alam", 90},
	{"dr.wong@sihat.com", "Wong Mei Ling 黄美玲", "Paediatric TCM 儿科", 12, "B.Med (TCM), Nanjing UCM", "Gentle paediatric care — appetite, sleep, immunity and growth support for children using mild formulas and tui na.", "中文, English", "Little Sprout TCM, Ipoh", 45},
	{"dr.raj@sihat.com", "Rajesh Kumar", "Tui Na 推拿 · 正骨", 8, "Dip. Tui Na & Manual Therapy", "Manual therapy for posture correction, neck/shoulder tension and stress relief. Hands-on, results-driven.", "English, Tamil, Bahasa Malaysia", "Balance Bodyworks, Petaling Jaya", 75},
}

// seed runs the one-time first-start seeding: the base data (admin_settings row, system prompts) always,
// the demo accounts only with Options.SeedDemo. Each part is recorded in meta so a restart never re-seeds.
func (d *DB) seed() error {
	return d.inTx(func(tx *sql.Tx) error {
		if _, done := d.metaGetTx(tx, "seeded_base"); !done {
			if _, perr := d.insertOne(tx, tables["admin_settings"], map[string]any{}, insertOpts{}); perr != nil {
				return perr
			}
			prompts := map[string]string{}
			if err := json.Unmarshal(seedPromptsJSON, &prompts); err != nil {
				return fmt.Errorf("seed prompts: %w", err)
			}
			roles := make([]string, 0, len(prompts))
			for r := range prompts {
				roles = append(roles, r)
			}
			sort.Strings(roles)
			for _, r := range roles {
				if _, perr := d.insertOne(tx, tables["system_prompts"], map[string]any{"role": r, "prompt_text": prompts[r]}, insertOpts{}); perr != nil {
					return perr
				}
			}
			if err := d.metaSet(tx, "seeded_base", "1"); err != nil {
				return err
			}
		}
		if !d.opt.SeedDemo {
			return nil
		}
		if _, done := d.metaGetTx(tx, "seeded_demo"); done {
			return d.seedRichDemo(tx) // databases seeded before the rich demo existed get it once
		}
		for _, a := range demoAccounts {
			if err := d.seedUser(tx, a.email, a.name, a.role, d.demoProfile(a)); err != nil {
				return err
			}
		}
		for _, dr := range demoDoctors {
			prof := map[string]any{"is_approved": true, "specialty": dr.specialty, "years_experience": float64(dr.years), "qualification": dr.qualification,
				"bio": dr.bio, "languages": dr.languages, "clinic": dr.clinic, "avg_response_time": float64(dr.avgResponse)}
			if err := d.seedUser(tx, dr.email, dr.name, "doctor", prof); err != nil {
				return err
			}
		}
		if err := d.metaSet(tx, "seeded_demo", "1"); err != nil {
			return err
		}
		return d.seedRichDemo(tx)
	})
}

func (d *DB) demoProfile(a seedAccount) map[string]any {
	if a.role == "doctor" {
		return map[string]any{"is_approved": true, "specialty": "General TCM 中医全科", "bio": "Seeded demo doctor", "years_experience": float64(12)}
	}
	return nil
}

func (d *DB) metaGetTx(tx *sql.Tx, k string) (string, bool) {
	var v string
	if err := tx.QueryRow("SELECT v FROM meta WHERE k=?", k).Scan(&v); err != nil {
		return "", false
	}
	return v, true
}

// seedUser creates an account with an explicit profile role (admin/developer are never self-assignable via signup).
func (d *DB) seedUser(tx *sql.Tx, email, name, role string, profile map[string]any) error {
	if _, err := d.userByEmail(tx, email); err == nil {
		return nil
	}
	p := map[string]any{"role": role, "full_name": name}
	for k, v := range profile {
		p[k] = v
	}
	hash, err := demoPasswordHash(d.opt.PBKDF2Iter)
	if err != nil {
		return err
	}
	_, err = d.createUser(tx, email, hash, map[string]any{"full_name": name, "role": role}, p)
	return err
}
