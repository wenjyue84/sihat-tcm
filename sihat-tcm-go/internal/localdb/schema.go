package localdb

import (
	"fmt"
	"strings"
)

// colType is the (small) set of Postgres column types the app's schema uses.
type colType int

const (
	tAny     colType = iota // untyped (scratch tables used by the contract suite)
	tUUID                   // uuid
	tText                   // text / varchar
	tInt                    // integer / bigint
	tFloat                  // double precision
	tBool                   // boolean
	tTS                     // timestamptz
	tDate                   // date
	tTime                   // time
	tJSON                   // jsonb
	tTextArr                // text[]
)

type column struct {
	name    string
	typ     colType
	notNull bool
	def     string // "" = no default; see defaultValue
	maxLen  int    // varchar(n); 0 = unlimited
}

type fk struct {
	col string
	ref string // "users" (auth.users) or "profiles"
}

// table describes one public.* table of db/schema.sql.
type table struct {
	name   string
	cols   []*column
	byName map[string]*column
	// unique constraints; a leading "~" on a column name means case-insensitive text.
	unique [][]string
	fks    []fk
	checks []func(row map[string]any) (constraint string, ok bool)
	owner  string // RLS owner column (auth.uid() = owner); "" = no policy for authenticated
	// authenticated role privileges (grants): "" none, "r" select only, "rw" select/insert/update/delete.
	grant   string
	touch   bool // BEFORE UPDATE trigger set_updated_at()
	scratch bool // untyped, schemaless table (contract-suite mode only)
}

func (t *table) col(name string) *column { return t.byName[name] }

// idKind reports "uuid", "int" (identity / literal) or "any".
func (t *table) idKind() string {
	c := t.col("id")
	switch {
	case c == nil:
		return "any"
	case c.typ == tUUID:
		return "uuid"
	case c.typ == tInt:
		return "int"
	}
	return "any"
}

var typeNames = map[string]colType{
	"uuid": tUUID, "text": tText, "int": tInt, "float": tFloat, "bool": tBool,
	"ts": tTS, "date": tDate, "time": tTime, "json": tJSON, "arr": tTextArr,
}

// parseCols reads "name:type[!][=default]" tokens.
func parseCols(spec string) []*column {
	var out []*column
	for _, tok := range strings.Fields(spec) {
		def := ""
		if i := strings.Index(tok, "="); i >= 0 {
			def = tok[i+1:]
			tok = tok[:i]
		}
		notNull := false
		if strings.HasSuffix(tok, "!") {
			notNull = true
			tok = strings.TrimSuffix(tok, "!")
		}
		name, ty, ok := strings.Cut(tok, ":")
		if !ok {
			panic("localdb schema: bad column token " + tok)
		}
		maxLen := 0
		if j := strings.Index(ty, "/"); j >= 0 {
			fmt.Sscanf(ty[j+1:], "%d", &maxLen)
			ty = ty[:j]
		}
		ct, ok := typeNames[ty]
		if !ok {
			panic("localdb schema: unknown type " + ty)
		}
		out = append(out, &column{name: name, typ: ct, notNull: notNull, def: def, maxLen: maxLen})
	}
	return out
}

func newTable(name, spec string) *table {
	t := &table{name: name, cols: parseCols(spec), byName: map[string]*column{}}
	for _, c := range t.cols {
		t.byName[c.name] = c
	}
	return t
}

func inSet(v any, set ...string) bool {
	s, ok := v.(string)
	if !ok {
		return false
	}
	for _, x := range set {
		if s == x {
			return true
		}
	}
	return false
}

func enumCheck(col, constraint string, nullable bool, set ...string) func(map[string]any) (string, bool) {
	return func(r map[string]any) (string, bool) {
		v := r[col]
		if v == nil {
			return constraint, nullable
		}
		return constraint, inSet(v, set...)
	}
}

// tables is the registry (db/schema.sql, derived from what the Go app reads and writes).
var tables = buildTables()

func buildTables() map[string]*table {
	m := map[string]*table{}
	add := func(t *table) *table { m[t.name] = t; return t }

	p := add(newTable("profiles", `id:uuid! email:text full_name:text role:text!=patient is_approved:bool!=false
		specialty:text bio:text years_experience:int qualification:text languages:text clinic:text avg_response_time:int
		age:int gender:text height:float weight:float bmi:float medical_history:text preferred_language:text/5=en
		preferences:json!=obj flag:text created_at:ts!=now updated_at:ts!=now`))
	p.unique = [][]string{{"~email"}}
	p.fks = []fk{{"id", "users"}}
	p.checks = []func(map[string]any) (string, bool){
		enumCheck("role", "profiles_role_check", false, "patient", "doctor", "admin", "developer"),
		enumCheck("preferred_language", "valid_language_code", true, "en", "zh", "ms"),
	}
	p.owner, p.grant, p.touch = "id", "r", true

	pt := add(newTable("patients", `id:uuid!=gen created_at:ts!=now updated_at:ts!=now first_name:text! last_name:text ic_no:text
		email:text phone:text birth_date:date gender:text status:text!=active type:text!=managed user_id:uuid created_by:uuid
		clinical_summary:json flag:text`))
	pt.unique = [][]string{{"ic_no"}, {"user_id"}}
	pt.fks = []fk{{"user_id", "users"}, {"created_by", "users"}}
	pt.checks = []func(map[string]any) (string, bool){
		enumCheck("status", "patients_status_enum", false, "active", "archived", "pending_invite"),
		enumCheck("type", "patients_type_enum", false, "managed", "registered", "guest"),
	}
	pt.touch = true

	inq := add(newTable("inquiries", `id:uuid!=gen user_id:uuid! doctor_id:uuid symptoms:text status:text!=pending flag:text notes:text
		diagnosis_report:json created_at:ts!=now updated_at:ts!=now`))
	inq.fks = []fk{{"user_id", "profiles"}, {"doctor_id", "profiles"}}
	inq.touch = true

	sessCols := `primary_diagnosis:text! constitution:text overall_score:int full_report:json! notes:text symptoms:arr medicines:arr
		vital_signs:json clinical_notes:text treatment_plan:text follow_up_date:date inquiry_summary:text inquiry_chat_history:json
		inquiry_report_files:json inquiry_medicine_files:json tongue_analysis:json face_analysis:json body_analysis:json
		audio_analysis:json pulse_data:json`
	scoreCheck := func(r map[string]any) (string, bool) {
		v, ok := r["overall_score"].(float64)
		return "overall_score_check", r["overall_score"] == nil || (ok && v >= 0 && v <= 100)
	}
	ds := add(newTable("diagnosis_sessions", `id:uuid!=gen user_id:uuid patient_id:uuid `+sessCols+` is_guest_session:bool=false
		guest_email:text guest_name:text is_hidden:bool=false created_at:ts!=now updated_at:ts!=now`))
	ds.fks = []fk{{"user_id", "users"}, {"patient_id", "patients"}}
	ds.checks = []func(map[string]any) (string, bool){scoreCheck}
	ds.owner, ds.grant, ds.touch = "user_id", "rw", true

	gs := add(newTable("guest_diagnosis_sessions", `id:uuid!=gen session_token:text! guest_email:text guest_name:text `+sessCols+`
		created_at:ts!=now updated_at:ts!=now migrated_to_user_id:uuid migrated_at:ts`))
	gs.unique = [][]string{{"session_token"}}
	gs.fks = []fk{{"migrated_to_user_id", "users"}}
	gs.checks = []func(map[string]any) (string, bool){scoreCheck}
	gs.touch = true

	as := add(newTable("admin_settings", `id:int!=1 updated_at:ts=now acknowledged_alerts:arr=arr music_url:text music_enabled:bool=true
		gemini_api_key:text openai_api_key:text settings:json!=obj`))
	as.checks = []func(map[string]any) (string, bool){func(r map[string]any) (string, bool) {
		v, ok := r["id"].(float64)
		return "admin_settings_single_row", ok && v == 1
	}}

	sp := add(newTable("system_prompts", `id:int!=seq role:text! prompt_text:text updated_at:ts=now`))
	sp.unique = [][]string{{"role"}}

	sl := add(newTable("system_logs", `id:int!=seq timestamp:ts!=now level:text! category:text! message:text! metadata:json=obj user_id:uuid`))
	sl.fks = []fk{{"user_id", "profiles"}}
	sl.checks = []func(map[string]any) (string, bool){enumCheck("level", "system_logs_level_check", false, "info", "warn", "error", "debug")}

	se := add(newTable("system_errors", `id:uuid!=gen timestamp:ts!=now error_type:text/100! message:text! stack_trace:text component:text/200
		user_id:uuid session_id:text/255 url:text user_agent:text severity:text/20=medium resolved:bool=false resolved_at:ts resolved_by:uuid
		metadata:json=obj created_at:ts!=now updated_at:ts!=now`))
	se.fks = []fk{{"user_id", "users"}, {"resolved_by", "users"}}
	se.checks = []func(map[string]any) (string, bool){enumCheck("severity", "system_errors_severity_check", true, "low", "medium", "high", "critical")}
	se.touch = true

	add(newTable("system_metrics", `id:int!=seq type:text! name:text! value:text! unit:text=count tags:json=obj metadata:json=obj
		timestamp:ts!=now created_at:ts!=now`))

	unp := add(newTable("user_notification_preferences", `id:uuid!=gen user_id:uuid! enabled:bool=true health_reminders:bool=true
		medication_alerts:bool=true appointment_reminders:bool=true exercise_reminders:bool=true sleep_reminders:bool=true
		quiet_hours_enabled:bool=true quiet_hours_start:time=22:00:00 quiet_hours_end:time=07:00:00 frequency_daily:bool=true
		frequency_weekly:bool=true frequency_monthly:bool=false categories:json=cat created_at:ts=now updated_at:ts=now`))
	unp.unique = [][]string{{"user_id"}}
	unp.fks = []fk{{"user_id", "users"}}
	unp.owner, unp.grant, unp.touch = "user_id", "rw", true

	ud := add(newTable("user_devices", `id:uuid!=gen user_id:uuid! device_token:text! device_type:text! device_name:text
		platform_info:json is_active:bool=true last_seen:ts=now created_at:ts=now updated_at:ts=now`))
	ud.unique = [][]string{{"user_id", "device_token"}}
	ud.fks = []fk{{"user_id", "users"}}
	ud.checks = []func(map[string]any) (string, bool){enumCheck("device_type", "user_devices_device_type_check", false, "ios", "android", "web")}
	ud.owner, ud.grant, ud.touch = "user_id", "rw", true

	sn := add(newTable("scheduled_notifications", `id:uuid!=gen user_id:uuid! notification_type:text! title:text! body:text!
		data:json=obj scheduled_for:ts! repeat_pattern:text repeat_config:json category:text! priority:text=normal is_sent:bool=false
		sent_at:ts is_cancelled:bool=false cancelled_at:ts created_at:ts=now updated_at:ts=now`))
	sn.fks = []fk{{"user_id", "users"}}
	sn.checks = []func(map[string]any) (string, bool){enumCheck("priority", "scheduled_notifications_priority_check", true, "low", "normal", "high", "urgent")}
	sn.owner, sn.grant, sn.touch = "user_id", "rw", true

	nh := add(newTable("notification_history", `id:uuid!=gen user_id:uuid! notification_type:text! title:text! body:text! data:json=obj
		category:text! priority:text! sent_at:ts=now clicked:bool=false clicked_at:ts device_type:text created_at:ts=now`))
	nh.fks = []fk{{"user_id", "users"}}
	nh.owner, nh.grant = "user_id", "rw"

	// ---- wearable / phone health data (internal/server/health_*.go) ----
	hr := add(newTable("health_readings", `id:uuid!=gen user_id:uuid! metric:text! value:float! unit:text/12! measured_at:ts! source:text!
		device:text/120 created_at:ts!=now`))
	hr.unique = [][]string{{"user_id", "metric", "measured_at", "source"}}
	hr.fks = []fk{{"user_id", "users"}}
	hr.checks = []func(map[string]any) (string, bool){
		enumCheck("metric", "health_readings_metric_check", false, healthMetricNames...),
		enumCheck("source", "health_readings_source_check", false, "manual", "bluetooth", "google_health", "apple_export", "ingest"),
		func(r map[string]any) (string, bool) {
			v, ok := r["value"].(float64)
			m, _ := r["metric"].(string)
			rng, known := healthRanges[m]
			return "health_readings_value_range", ok && known && v >= rng[0] && v <= rng[1]
		},
	}
	hr.owner, hr.grant = "user_id", "rw"

	// service-role only (no owner policy, no grant to authenticated): they hold the sealed Google refresh token and the
	// ingest-token hash
	hc := add(newTable("health_connections", `id:uuid!=gen user_id:uuid! provider:text! status:text!=connected scopes:text
		refresh_token_enc:text connected_at:ts!=now last_sync_at:ts last_sync_status:text last_error:text`))
	hc.unique = [][]string{{"user_id", "provider"}}
	hc.fks = []fk{{"user_id", "users"}}
	hc.checks = []func(map[string]any) (string, bool){
		enumCheck("provider", "health_connections_provider_check", false, "google_health"),
		enumCheck("status", "health_connections_status_check", false, "connected", "error", "revoked"),
	}

	hit := add(newTable("health_ingest_tokens", `id:uuid!=gen user_id:uuid! token_hash:text/64! token_hint:text/8 created_at:ts!=now last_used_at:ts`))
	hit.unique = [][]string{{"user_id"}, {"token_hash"}}
	hit.fks = []fk{{"user_id", "users"}}

	return m
}

// healthRanges mirrors the per-metric plausibility CHECK of db/schema.sql (and healthMetrics in internal/server).
var healthRanges = map[string][2]float64{
	"heart_rate": {20, 250}, "resting_heart_rate": {20, 200}, "hrv_rmssd": {1, 500}, "hrv_sdnn": {1, 500}, "spo2": {50, 100},
	"systolic_bp": {50, 260}, "diastolic_bp": {30, 160}, "body_temperature": {30, 45}, "respiratory_rate": {4, 60},
	"steps": {0, 200000}, "weight_kg": {10, 400}, "sleep_hours": {0, 24},
}

var healthMetricNames = []string{"heart_rate", "resting_heart_rate", "hrv_rmssd", "hrv_sdnn", "spo2", "systolic_bp", "diastolic_bp",
	"body_temperature", "respiratory_rate", "steps", "weight_kg", "sleep_hours"}

// scratchTable is the untyped schemaless table used for unknown names in contract-suite mode.
func scratchTable(name string) *table {
	return &table{name: name, byName: map[string]*column{}, scratch: true, grant: ""}
}

// tableNames returns the schema's table names (sorted by the caller if needed).
func tableNames() []string {
	out := make([]string, 0, len(tables))
	for n := range tables {
		out = append(out, n)
	}
	return out
}
