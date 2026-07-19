#!/usr/bin/env bash
# Seed realistic demo TCM doctors (real EN/ZH names + full profiles) so the
# patient "Find a Doctor" directory looks credible. Idempotent: re-running
# updates the password + profile. Password for all: password123.
#
# Requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (sourced from .env).
set -euo pipefail
cd "$(dirname "$0")/.."
set -a
[ -f .env ] && source .env
set +a
: "${SUPABASE_URL:?}"; : "${SUPABASE_SERVICE_ROLE_KEY:?}"
PW="${TEST_ACCOUNT_PASSWORD:-password123}"
AUTH="$SUPABASE_URL/auth/v1/admin/users"
REST="$SUPABASE_URL/rest/v1/profiles"
HK="apikey: $SUPABASE_SERVICE_ROLE_KEY"; HA="Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"

# email | name | specialty | years | qualification | bio | languages | clinic | avg_response_time(min)
DOCTORS=(
'dr.lew@sihat.com|Lew Wen Jyue 刘文傕|General TCM 全科中医|22|B.Med (TCM), Guangzhou UCM · Licensed by MOH Malaysia|Senior physician focused on constitutional balancing, digestive and chronic-fatigue disorders. Blends classical formulas with practical lifestyle guidance.|English, 中文, Bahasa Malaysia|Sihat TCM Centre, Kuala Lumpur|120'
'dr.tan@sihat.com|Tan Wei Ming 陈伟明|Acupuncture 针灸|15|M.Sc Acupuncture, Beijing UCM|Pain-management and sports-injury specialist. Combines acupuncture with tui na for musculoskeletal recovery.|English, 中文|Wellness Point, Johor Bahru|60'
'dr.lim@sihat.com|Lim Siew Hoon 林秀云|Gynaecology 妇科|18|B.Sc TCM (UiTM) · Cert. TCM Gynaecology|Women'"'"'s health and fertility support; menstrual and menopausal pattern regulation with gentle herbal therapy.|English, 中文, 客家话|Harmony TCM Clinic, Penang|180'
'dr.nurul@sihat.com|Nurul Aina Rahman|Herbal Medicine 中药|10|Dip. TCM, INTI · Herbal Pharmacology Cert.|Herbal-formula tailoring for chronic conditions, allergies and skin patterns. Warm, patient-centred consultations.|Bahasa Malaysia, English|Klinik Herba Sihat, Shah Alam|90'
'dr.wong@sihat.com|Wong Mei Ling 黄美玲|Paediatric TCM 儿科|12|B.Med (TCM), Nanjing UCM|Gentle paediatric care — appetite, sleep, immunity and growth support for children using mild formulas and tui na.|中文, English|Little Sprout TCM, Ipoh|45'
'dr.raj@sihat.com|Rajesh Kumar|Tui Na 推拿 · 正骨|8|Dip. Tui Na & Manual Therapy|Manual therapy for posture correction, neck/shoulder tension and stress relief. Hands-on, results-driven.|English, Tamil, Bahasa Malaysia|Balance Bodyworks, Petaling Jaya|75'
)

find_user_id () {
  curl -s "$AUTH?page=1&per_page=1000" -H "$HK" -H "$HA" | python -c "
import json,sys
email='$1'.lower()
try: d=json.load(sys.stdin)
except Exception: print(''); sys.exit()
for u in d.get('users', d if isinstance(d,list) else []):
    if (u.get('email') or '').lower()==email: print(u.get('id','')); break
else: print('')"
}

for row in "${DOCTORS[@]}"; do
  IFS='|' read -r email name spec years qual bio langs clinic art <<< "$row"
  echo "==> $email ($name)"
  body=$(python -c "import json,sys; print(json.dumps({'email':sys.argv[1],'password':sys.argv[2],'email_confirm':True,'user_metadata':{'full_name':sys.argv[3],'role':'doctor'}}))" "$email" "$PW" "$name")
  resp=$(curl -s -w '\n%{http_code}' -X POST "$AUTH" -H "$HK" -H "$HA" -H 'Content-Type: application/json' -d "$body")
  code=$(echo "$resp" | tail -1); json=$(echo "$resp" | sed '$d')
  uid=""
  if [ "$code" = "200" ] || [ "$code" = "201" ]; then
    uid=$(echo "$json" | python -c "import json,sys; print(json.load(sys.stdin).get('id',''))" 2>/dev/null || echo "")
  else
    uid=$(find_user_id "$email")
    [ -n "$uid" ] && curl -s -o /dev/null -X PUT "$AUTH/$uid" -H "$HK" -H "$HA" -H 'Content-Type: application/json' -d "$(python -c "import json,sys;print(json.dumps({'password':sys.argv[1],'email_confirm':True}))" "$PW")"
  fi
  [ -z "$uid" ] && { echo "   !! no uid, skipping"; continue; }
  prow=$(python -c "import json,sys
print(json.dumps({'id':sys.argv[1],'role':'doctor','is_approved':True,'full_name':sys.argv[2],'specialty':sys.argv[3],'years_experience':int(sys.argv[4]),'qualification':sys.argv[5],'bio':sys.argv[6],'languages':sys.argv[7],'clinic':sys.argv[8],'avg_response_time':int(sys.argv[9])}))" \
    "$uid" "$name" "$spec" "$years" "$qual" "$bio" "$langs" "$clinic" "$art")
  pc=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$REST" -H "$HK" -H "$HA" -H 'Content-Type: application/json' -H 'Prefer: resolution=merge-duplicates' -d "$prow")
  echo "   profile upsert HTTP $pc"
done
echo "==> done."
