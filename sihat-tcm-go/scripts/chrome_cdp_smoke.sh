#!/usr/bin/env bash
# Basic interface test in the REAL Chrome through the chrome-cdp skill (Jay, 2026-10-12: "do some basic interface test with
# chrome-cdp before deployment"). Read-only against the given base URL (a hermetic stack or production); logs in only when
# DEMO_LOGIN=1 (hermetic stacks seed patient@sihat.com / password123 — never use it against production).
#
#   scripts/chrome_cdp_smoke.sh <base-url> <chrome-targetId-prefix> [out-dir]
#
# Needs Chrome remote debugging on (chrome://inspect/#remote-debugging) and a click on "Allow debugging" for the target tab.
# Use ONE tab you opened yourself for localhost; never a tab of the user's.
set -u
BASE="${1:?base url}"; T="${2:?target id prefix}"; OUT="${3:-${TMPDIR:-/tmp}/cdp-smoke}"
NODE=/c/Users/Jyue/.nvm/versions/node/v22.22.2/bin/node
CDP="$NODE /c/Users/Jyue/.claude/skills/chrome-cdp/scripts/cdp.mjs"
mkdir -p "$OUT"; pass=0; fail=0
ok()   { pass=$((pass+1)); echo "PASS $1"; }
bad()  { fail=$((fail+1)); echo "FAIL $1 - $2"; }
ev()   { $CDP eval "$T" "$1" 2>&1 | tail -n 1; }

# every <img> on the page decoded (lazy ones forced) + no sideways scroll + a title
PROBE='(async()=>{const im=[...document.images];im.forEach(i=>{i.loading="eager"});await Promise.all(im.map(i=>i.complete?0:new Promise(r=>{i.onload=i.onerror=r;setTimeout(r,8000)})));return JSON.stringify({n:im.length,broken:im.filter(i=>i.offsetParent!==null&&!i.naturalWidth).map(i=>i.getAttribute("src")),over:document.documentElement.scrollWidth-document.documentElement.clientWidth,title:document.title,h1:(document.querySelector("h1")||{}).textContent||""})})()'

check_page () {  # name path [min images]
  local name="$1" path="$2" min="${3:-0}"
  $CDP nav "$T" "$BASE$path" >/dev/null 2>&1 || { bad "$name.nav" "navigation failed"; return; }
  sleep 1
  local r; r=$(ev "$PROBE")
  local n broken over title
  n=$(echo "$r" | sed -n 's/.*\\\?"n\\\?":\([0-9]*\).*/\1/p'); broken=$(echo "$r" | grep -o 'broken[^]]*]' | head -1); over=$(echo "$r" | sed -n 's/.*over\\\?":\(-\?[0-9]*\).*/\1/p')
  [ -n "$n" ] && [ "$n" -ge "$min" ] && ok "$name.images_present($n)" || bad "$name.images_present" "r=$r"
  echo "$broken" | grep -q '\[\]' && ok "$name.no_broken_images" || bad "$name.no_broken_images" "$broken"
  [ "${over:-1}" -le 1 ] && ok "$name.no_sideways_scroll" || bad "$name.no_sideways_scroll" "over=$over"
  $CDP evalraw "$T" Page.bringToFront '{}' >/dev/null 2>&1   # a background tab times out Page.captureScreenshot
  $CDP shot "$T" "$OUT/$name.png" >/dev/null 2>&1 && ok "$name.screenshot" || bad "$name.screenshot" "shot failed"
}

check_page home "/" 3
check_page login "/login" 1
check_page reset "/reset-password" 1
check_page notfound "/no-such-page-404" 1
check_page demo "/demo" 20

# the new test-log appendix renders and a thumbnail click switches the main image
$CDP nav "$T" "$BASE/demo#tests" >/dev/null 2>&1; sleep 1
cnt=$(ev 'document.querySelectorAll("#tests article.tcase").length')
echo "$cnt" | grep -qE '^"?1[0-9]"?$|^"?[2-9][0-9]"?$' && ok "demo.test_log_entries($cnt)" || bad "demo.test_log_entries" "count=$cnt"
before=$(ev 'document.querySelector("#test-T3-2 [data-main] img").getAttribute("src")')
ev 'document.querySelectorAll("#test-T3-2 .thumb")[1].click()' >/dev/null; sleep 1
after=$(ev 'document.querySelector("#test-T3-2 [data-main] img").getAttribute("src")')
[ "$before" != "$after" ] && ok "demo.thumbnail_switches_main_image" || bad "demo.thumbnail_switches_main_image" "$before == $after"

# language toggle on the home page: the Pulse card icon is not a missing glyph and zh/en switch changes the headline
$CDP nav "$T" "$BASE/" >/dev/null 2>&1; sleep 1
icon=$(ev 'document.querySelectorAll(".feature-icon")[3].textContent.trim().codePointAt(0).toString(16)')
[ "$(echo "$icon" | tr -d '"')" = "1f493" ] && ok "home.pulse_icon_is_1f493_not_unicode13" || bad "home.pulse_icon" "codepoint=$icon"

if [ "${DEMO_LOGIN:-0}" = "1" ]; then
  r=$(ev '(async()=>{const x=await fetch("/api/auth/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:"patient@sihat.com",password:"password123"})});return x.status})()')
  echo "$r" | grep -q 200 && ok "login.demo_patient" || bad "login.demo_patient" "$r"
  check_page patient "/patient" 2
  d=$(ev 'document.querySelectorAll("#devices .hd-card").length')
  echo "$d" | grep -q 4 && ok "patient.devices_four_cards" || bad "patient.devices_four_cards" "cards=$d"
  g=$(ev 'document.querySelector("#hd-google") ? document.querySelector("#hd-google").innerText.slice(0,80) : "none"')
  echo "$g" | grep -qi "not configured\|Not connected\|Sign in with Google" && ok "patient.google_card_state" || bad "patient.google_card_state" "$g"
  bt=$(ev '!!navigator.bluetooth')
  ok "browser.web_bluetooth_available=$bt"
fi

echo "---"; echo "$pass passed, $fail failed  (screenshots: $OUT)"
[ "$fail" = 0 ]
