/**
 * devices.js - "Devices & health data" section of the patient dashboard (templates/patient.html, #devices).
 *
 * Four ways in, one list out:
 *   Bluetooth     straight from this page to a strap / cuff / oximeter / thermometer (static/js/health-connect.js)
 *   Google Health OAuth online portal (Fitbit, Pixel Watch, Android): server-side flow, /api/health/google/*
 *   Apple Health  upload of the iPhone export.zip / export.xml: POST /api/health/apple/import
 *   Automation    a private ingest token for iOS Shortcuts / Health Auto Export / Android Tasker: POST /api/health/ingest
 * plus manual entry, the latest value of every metric, the recent readings and delete controls.
 * Vanilla JS, no dependencies. All text goes through tcmT (en / zh / ms, keys health.*).
 */
(function () {
  'use strict';

  var root, body, banner;
  var METRICS = ['heart_rate', 'resting_heart_rate', 'hrv_rmssd', 'hrv_sdnn', 'spo2', 'systolic_bp', 'diastolic_bp', 'body_temperature', 'respiratory_rate', 'steps', 'weight_kg', 'sleep_hours'];
  var MANUAL_METRICS = ['heart_rate', 'resting_heart_rate', 'spo2', 'systolic_bp', 'diastolic_bp', 'body_temperature', 'respiratory_rate', 'weight_kg'];
  var MAX_APPLE_MB = 95;
  var data = { summary: null, readings: [], newToken: '' };
  var btHandle = null;

  function T(key, fallback, vars) {
    if (typeof window.tcmT === 'function') return window.tcmT(key, fallback, vars);
    var s = fallback;
    if (vars) Object.keys(vars).forEach(function (k) { s = String(s).split('{' + k + '}').join(vars[k]); });
    return s;
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function getCookie(n) {
    var m = document.cookie.match(new RegExp('(?:^|; )' + n + '=([^;]*)'));
    return m ? decodeURIComponent(m[1]) : '';
  }
  function token() { return localStorage.getItem('tcm-token') || getCookie('sb-access-token'); }
  function $(id) { return document.getElementById(id); }

  function api(method, path, payload, extra) {
    var headers = { 'Authorization': 'Bearer ' + token() };
    var init = { method: method, headers: headers };
    if (payload !== undefined && payload !== null && !(extra && extra.raw)) { headers['Content-Type'] = 'application/json'; init.body = JSON.stringify(payload); }
    if (extra && extra.raw) { init.body = extra.raw; Object.keys(extra.headers || {}).forEach(function (k) { headers[k] = extra.headers[k]; }); }
    return fetch(path, init).then(function (r) {
      return r.text().then(function (t) {
        var j = null; try { j = JSON.parse(t); } catch (e) { /* not JSON */ }
        return { ok: r.ok, status: r.status, json: j };
      });
    });
  }

  function say(msg, kind) {
    if (!banner) return;
    if (!msg) { banner.classList.add('hidden'); banner.textContent = ''; return; }
    banner.className = 'hd-banner' + (kind === 'warn' ? ' is-warn' : kind === 'error' ? ' is-error' : '');
    banner.textContent = msg;
  }
  function setStatus(id, msg, cls) {
    var e = $(id);
    if (!e) return;
    e.textContent = msg || '';
    e.className = 'hd-status' + (cls ? ' ' + cls : '');
  }
  function errText(r) { return (r && r.json && r.json.error) || ('HTTP ' + (r && r.status)); }

  var METRIC_KEYS = {
    heart_rate: 'health.m.heart_rate',
    resting_heart_rate: 'health.m.resting_heart_rate',
    hrv_rmssd: 'health.m.hrv_rmssd',
    hrv_sdnn: 'health.m.hrv_sdnn',
    spo2: 'health.m.spo2',
    systolic_bp: 'health.m.systolic_bp',
    diastolic_bp: 'health.m.diastolic_bp',
    body_temperature: 'health.m.body_temperature',
    respiratory_rate: 'health.m.respiratory_rate',
    steps: 'health.m.steps',
    weight_kg: 'health.m.weight_kg',
    sleep_hours: 'health.m.sleep_hours'
  };
  var SOURCE_KEYS = {
    manual: 'health.src.manual',
    bluetooth: 'health.src.bluetooth',
    google_health: 'health.src.google_health',
    apple_export: 'health.src.apple_export',
    ingest: 'health.src.ingest'
  };
  var RETURN_KEYS = {
    google_connected: 'health.ret.google_connected',
    google_denied: 'health.ret.google_denied',
    google_state: 'health.ret.google_state',
    google_error: 'health.ret.google_error',
    google_no_refresh: 'health.ret.google_no_refresh',
    google_scope: 'health.ret.google_scope',
    google_not_configured: 'health.ret.google_not_configured',
    server_not_ready: 'health.ret.server_not_ready'
  };
  var STEP_KEYS = ['health.auto.s1', 'health.auto.s2', 'health.auto.s3', 'health.auto.s4', 'health.auto.s5', 'health.auto.s6', 'health.auto.s7', 'health.auto.s8'];
  function label(m) { return METRIC_KEYS[m] ? T(METRIC_KEYS[m], m.replace(/_/g, ' ')) : m; }
  function unitText(u) { return u === 'degC' ? '°C' : u === 'brpm' ? '/min' : (u || ''); }
  function valueText(r) {
    var n = Number(r.value);
    var txt = Math.round(n) === n ? String(n) : String(Math.round(n * 100) / 100);
    return txt + ' ' + unitText(r.unit);
  }
  function whenText(iso) {
    var t = Date.parse(iso);
    return isNaN(t) ? '' : new Date(t).toLocaleString();
  }
  function sourceText(r) {
    var s = SOURCE_KEYS[r.source] ? T(SOURCE_KEYS[r.source], r.source) : (r.source || '');
    return r.device ? s + ' · ' + r.device : s;
  }

  /* ---------------------------------------------------------------- */
  /*  data                                                              */
  /* ---------------------------------------------------------------- */
  function load() {
    return Promise.all([api('GET', '/api/health/summary'), api('GET', '/api/health/readings?limit=30')]).then(function (rs) {
      if (rs[0].status === 401) { body.innerHTML = '<p class="text-muted">' + esc(T('health.signin', 'Sign in to link devices.')) + '</p>'; return; }
      if (!rs[0].ok) { body.innerHTML = '<div class="alert alert-error">' + esc(errText(rs[0])) + '</div>'; return; }
      data.summary = rs[0].json;
      data.readings = (rs[1].json && rs[1].json.readings) || [];
      render();
    }).catch(function (e) { body.innerHTML = '<div class="alert alert-error">' + esc(e.message) + '</div>'; });
  }

  /* ---------------------------------------------------------------- */
  /*  rendering                                                         */
  /* ---------------------------------------------------------------- */
  function btCard() {
    var HC = window.HealthConnect, why = HC ? HC.notSupportedReason() : 'no-api';
    var kinds = [['heart_rate', 'health.bt.hr', 'Heart-rate strap / watch'], ['spo2', 'health.bt.spo2', 'Pulse oximeter'], ['blood_pressure', 'health.bt.bp', 'Blood-pressure cuff'], ['thermometer', 'health.bt.temp', 'Thermometer']];
    var whyMsg = why ? T(why === 'ios' ? 'health.bt.ios' : why === 'insecure' ? 'health.bt.insecure' : 'health.bt.noapi', 'Web Bluetooth is not available in this browser.') : '';
    return '<article class="hd-card" id="hd-bt">' +
      '<h4>\u{1F4F6} ' + esc(T('health.bt.title', 'Bluetooth - straight to the device')) + '</h4>' +
      '<p>' + esc(T('health.bt.body', 'Pair a device from this page.')) + '</p>' +
      (why ? '<div class="hd-banner is-warn" style="margin:0">' + esc(whyMsg) + '</div>' : '') +
      '<div class="hd-actions">' + kinds.map(function (k) {
        return '<button type="button" class="btn btn-secondary btn-sm" data-act="bt" data-kind="' + k[0] + '"' + (why ? ' disabled' : '') + '>' + esc(T(k[1], k[2])) + '</button>';
      }).join('') + '<button type="button" class="btn btn-primary btn-sm hidden" id="hd-bt-stop">' + esc(T('health.bt.stop', 'Stop and use this')) + '</button></div>' +
      '<div class="hc-bar hidden" id="hd-bt-bar"><i></i></div><div class="hd-status" id="hd-bt-status" role="status" aria-live="polite"></div>' +
      '<p class="hd-honest">' + esc(T('health.bt.yes', '')) + '</p>' +
      '<p class="hd-honest">' + esc(T('health.bt.no', '')) + '</p>' +
      '</article>';
  }

  function googleCard() {
    var g = (data.summary.server || {}).google || {}, c = (data.summary.connections || {}).google_health;
    var state = !g.configured ? 'off' : c ? c.status : 'none';
    var pill = state === 'connected' ? '<span class="hd-pill is-on">' + esc(T('health.status.connected', 'Connected')) + '</span>'
      : state === 'revoked' ? '<span class="hd-pill is-warn">' + esc(T('health.status.revoked', 'Access revoked - reconnect')) + '</span>'
      : state === 'error' ? '<span class="hd-pill is-warn">' + esc(T('health.status.error', 'Needs attention')) + '</span>'
      : '<span class="hd-pill">' + esc(T('health.status.notconnected', 'Not connected')) + '</span>';
    var html = '<article class="hd-card" id="hd-google"><h4>\u{1F7E2} ' + esc(T('health.google.title', 'Google Health')) + ' ' + pill + '</h4>' +
      '<p>' + esc(T('health.google.body', '')) + '</p>';
    if (state === 'off') {
      html += '<div class="hd-banner is-warn" style="margin:0">' + esc(T('health.google.notconfigured', 'Not configured on this server yet.')) + '</div>' +
        '<div class="hd-actions"><button type="button" class="btn btn-secondary btn-sm" disabled>' + esc(T('health.google.connect', 'Connect Google Health')) + '</button></div>';
    } else if (state === 'connected') {
      var last = c.last_sync_at ? T('health.google.lastsync', 'Last sync: {when} - {status}', { when: whenText(c.last_sync_at), status: c.last_sync_status || '' }) : T('health.google.never', 'Not synced yet.');
      html += '<p class="hd-honest">' + esc(last) + '</p>' + (c.last_error ? '<p class="hd-honest hd-danger">' + esc(c.last_error) + '</p>' : '') +
        '<div class="hd-actions"><button type="button" class="btn btn-primary btn-sm" data-act="g-sync">' + esc(T('health.google.sync', 'Sync now')) + '</button>' +
        '<button type="button" class="btn btn-ghost btn-sm hd-danger" data-act="g-disconnect">' + esc(T('health.google.disconnect', 'Disconnect')) + '</button></div>';
    } else {
      html += (c && c.last_error ? '<p class="hd-honest hd-danger">' + esc(c.last_error) + '</p>' : '') +
        '<div class="hd-actions"><a class="btn btn-primary btn-sm" href="/api/health/google/connect" data-act="g-connect">' + esc(T('health.google.connect', 'Connect Google Health')) + '</a></div>';
    }
    return html + '<div class="hd-status" id="hd-google-status" role="status" aria-live="polite"></div></article>';
  }

  function appleCard() {
    return '<article class="hd-card" id="hd-apple"><h4>\u{1F34F} ' + esc(T('health.apple.title', 'Apple Health - export from your iPhone')) + '</h4>' +
      '<p>' + esc(T('health.apple.body', '')) + '</p>' +
      '<div class="hd-actions"><input type="file" id="hd-apple-file" accept=".zip,.xml,application/zip,text/xml,application/xml" aria-label="' + esc(T('health.apple.choose', 'Choose export.zip')) + '" style="max-width:100%">' +
      '<button type="button" class="btn btn-primary btn-sm" data-act="apple">' + esc(T('health.apple.upload', 'Import')) + '</button></div>' +
      '<div class="hd-status" id="hd-apple-status" role="status" aria-live="polite"></div></article>';
  }

  function autoCard() {
    var ing = data.summary.ingest || {}, url = ing.url || (location.origin + '/api/health/ingest');
    var html = '<article class="hd-card" id="hd-auto"><h4>\u{1F501} ' + esc(T('health.auto.title', 'Automatic push')) + '</h4><p>' + esc(T('health.auto.body', '')) + '</p>';
    if (data.newToken) {
      html += '<div class="hd-banner is-warn" style="margin:0">' + esc(T('health.auto.once', 'Copy this token now - it is shown only once.')) + '</div>' +
        '<div class="hd-token"><input class="form-input" id="hd-token-val" readonly value="' + esc(data.newToken) + '" aria-label="token"><button type="button" class="btn btn-secondary btn-sm" data-act="copy-token">' + esc(T('health.auto.copy', 'Copy')) + '</button></div>';
    } else if (ing.has_token) {
      html += '<p class="hd-honest">' + esc(T('health.auto.hint', 'Active token ending in {hint}', { hint: ing.hint || '' })) + ' · ' +
        esc(ing.last_used_at ? T('health.auto.lastused', 'Last used: {when}', { when: whenText(ing.last_used_at) }) : T('health.auto.unused', 'Never used yet.')) + '</p>';
    }
    html += '<p class="hd-honest">' + esc(T('health.auto.url', 'Your upload address')) + ': <code>' + esc(url) + '</code></p><div class="hd-actions">' +
      (ing.has_token
        ? '<button type="button" class="btn btn-secondary btn-sm" data-act="token-rotate">' + esc(T('health.auto.rotate', 'Replace token')) + '</button><button type="button" class="btn btn-ghost btn-sm hd-danger" data-act="token-revoke">' + esc(T('health.auto.revoke', 'Revoke token')) + '</button>'
        : '<button type="button" class="btn btn-primary btn-sm" data-act="token-create">' + esc(T('health.auto.create', 'Create token')) + '</button>') +
      '</div><div class="hd-status" id="hd-auto-status" role="status" aria-live="polite"></div>';
    var tok = data.newToken || 'YOUR_TOKEN';
    var sample = '{"metric":"heart_rate","value":72,"unit":"bpm","measured_at":"' + new Date().toISOString().replace(/\.\d{3}Z$/, 'Z') + '","source":"curl"}';
    var curl = 'curl -X POST ' + url + ' \\\n  -H "Authorization: Bearer ' + tok + '" \\\n  -H "Content-Type: application/json" \\\n  -d \'' + sample + '\'';
    html += '<details class="hd-details"><summary>' + esc(T('health.auto.steps.title', 'Step-by-step: iPhone Shortcut')) + '</summary><ol class="hd-steps">' +
      STEP_KEYS.map(function (k) { return '<li>' + esc(T(k, '')) + '</li>'; }).join('') + '</ol>' +
      '<p class="hd-honest">' + esc(T('health.auto.curl', 'Test from a computer:')) + '</p><pre class="hd-code">' + esc(curl) + '</pre></details></article>';
    return html;
  }

  function latestBlock() {
    var latest = (data.summary && data.summary.latest) || {};
    var tiles = METRICS.filter(function (m) { return latest[m]; }).map(function (m) {
      var r = latest[m];
      return '<div class="hd-vital"><b>' + esc(valueText(r)) + '</b><span>' + esc(label(m)) + '</span><span>' + esc(whenText(r.measured_at)) + '</span><span>' + esc(sourceText(r)) + '</span></div>';
    });
    return '<h4 class="dashboard-section-title" style="margin-top:1.4rem">' + esc(T('health.latest', 'Latest readings')) + '</h4>' +
      (tiles.length ? '<div class="hd-latest">' + tiles.join('') + '</div>' : '<p class="text-muted" style="font-size:.85rem">' + esc(T('health.none', 'No readings yet.')) + '</p>');
  }

  function recentBlock() {
    var rows = data.readings.map(function (r) {
      return '<tr><td>' + esc(whenText(r.measured_at)) + '</td><td>' + esc(label(r.metric)) + '</td><td><b>' + esc(valueText(r)) + '</b></td><td>' + esc(sourceText(r)) +
        '</td><td><button type="button" class="btn btn-ghost btn-sm hd-danger" data-act="del" data-id="' + esc(r.id) + '" aria-label="' + esc(T('health.delete', 'Delete')) + '">×</button></td></tr>';
    }).join('');
    return '<h4 class="dashboard-section-title" style="margin-top:1.4rem">' + esc(T('health.recent', 'Recent readings')) + '</h4>' +
      (rows ? '<div class="hd-table-wrap"><table class="hd-table"><thead><tr><th>' + esc(T('health.col.time', 'When')) + '</th><th>' + esc(T('health.col.metric', 'Metric')) + '</th><th>' + esc(T('health.col.value', 'Value')) +
        '</th><th>' + esc(T('health.col.source', 'Source')) + '</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
        '<p><button type="button" class="btn btn-ghost btn-sm hd-danger" data-act="del-all">' + esc(T('health.deleteall', 'Delete all my device data')) + '</button></p>' : '');
  }

  function manualBlock() {
    return '<details class="hd-details" style="margin-top:1rem"><summary>' + esc(T('health.add.title', 'Add a reading by hand')) + '</summary><div class="hd-manual">' +
      '<div class="form-group" style="margin:0"><label class="form-label" for="hd-m-metric">' + esc(T('health.add.metric', 'Measurement')) + '</label><select class="form-select" id="hd-m-metric">' +
      MANUAL_METRICS.map(function (m) { return '<option value="' + m + '">' + esc(label(m)) + '</option>'; }).join('') + '</select></div>' +
      '<div class="form-group" style="margin:0"><label class="form-label" for="hd-m-value">' + esc(T('health.add.value', 'Value')) + '</label><input class="form-input" id="hd-m-value" type="number" step="any" inputmode="decimal"></div>' +
      '<button type="button" class="btn btn-primary btn-sm" data-act="manual">' + esc(T('health.add.btn', 'Add')) + '</button></div><div class="hd-status" id="hd-manual-status" role="status" aria-live="polite"></div></details>';
  }

  function render() {
    if (btHandle) return; // do not rebuild the DOM under a running measurement
    body.innerHTML = '<div class="hd-cards">' + btCard() + googleCard() + appleCard() + autoCard() + '</div>' + latestBlock() + recentBlock() + manualBlock();
  }

  /* ---------------------------------------------------------------- */
  /*  actions                                                           */
  /* ---------------------------------------------------------------- */
  function btCapture(kind) {
    var HC = window.HealthConnect;
    if (btHandle || !HC) return;
    var bar = $('hd-bt-bar'), fill = bar && bar.firstChild, stop = $('hd-bt-stop');
    function busy(on) { document.querySelectorAll('#hd-bt [data-act="bt"]').forEach(function (b) { b.disabled = on; }); if (stop) stop.classList.toggle('hidden', !on); if (bar) bar.classList.toggle('hidden', !on || kind !== 'heart_rate'); }
    setStatus('hd-bt-status', T('health.bt.connecting', 'Choose your device in the pop-up…'));
    var h;
    try {
      h = HC.capture(kind, {
        seconds: 30,
        onStatus: function (c, d) {
          if (c === 'connected') setStatus('hd-bt-status', T('health.bt.connected', 'Connected to {name}. Waiting for data…', { name: d || '' }));
          else if (c === 'reconnecting') setStatus('hd-bt-status', T('health.bt.reconnecting', 'Connection lost - reconnecting ({n}/3)…', { n: d }), 'is-error');
        },
        onProgress: function (p) {
          if (kind !== 'heart_rate') return;
          if (fill) fill.style.width = Math.min(100, Math.round(100 * p.elapsed / p.seconds)) + '%';
          if (p.contact === 'no-contact') setStatus('hd-bt-status', T('health.bt.nocontact', 'No skin contact.'), 'is-error');
          else setStatus('hd-bt-status', T('health.bt.measuring', 'Measuring… {s} s left. Keep still.', { s: Math.max(0, Math.ceil(p.seconds - p.elapsed)) }) + (p.bpm ? '  ❤ ' + p.bpm + ' bpm' : ''));
        },
      });
    } catch (e) { setStatus('hd-bt-status', T('health.bt.err', 'Could not use that device: {err}', { err: e.message }), 'is-error'); return; }
    btHandle = h;
    busy(true);
    if (stop) stop.onclick = function () { h.stop(); };
    h.promise.then(function (res) {
      var msg = res.readings.map(function (r) { return label(r.metric) + ' ' + valueText(r); }).join(', ');
      return HC.saveReadings(token(), res.readings, res.device).then(function (saved) {
        btHandle = null;
        say(T('health.bt.captured', 'Captured: {what}', { what: msg }) + (saved ? ' - ' + T('health.bt.saved', 'Saved to your account.') : ''), saved ? '' : 'warn');
        return load();
      });
    }).catch(function (e) {
      btHandle = null;
      if (e && e.message === 'cancelled') { busy(false); return; }
      if (e && e.name === 'NotFoundError') setStatus('hd-bt-status', T('health.bt.cancel', 'No device was chosen.'));
      else setStatus('hd-bt-status', T('health.bt.err', 'Could not use that device: {err}', { err: (e && e.message) || String(e) }), 'is-error');
      busy(false);
    });
  }

  function googleSync(auto) {
    setStatus('hd-google-status', T('health.google.syncing', 'Syncing…'));
    return api('POST', '/api/health/google/sync', {}).then(function (r) {
      if (r.ok) {
        say(T('health.google.synced', 'Synced: {n} new readings ({d} already stored).', { n: r.json.inserted, d: r.json.duplicates }));
      } else if (r.status === 429 && auto) { /* just synced */ }
      else say(T('health.google.err', 'Sync failed: {err}', { err: errText(r) }), 'error');
      return load();
    });
  }

  function appleImport() {
    var f = $('hd-apple-file') && $('hd-apple-file').files[0];
    if (!f) { setStatus('hd-apple-status', T('health.apple.choose', 'Choose export.zip (or export.xml)'), 'is-error'); return; }
    if (f.size > MAX_APPLE_MB * 1024 * 1024) { setStatus('hd-apple-status', T('health.apple.big', 'That file is larger than 95 MB.'), 'is-error'); return; }
    setStatus('hd-apple-status', T('health.apple.uploading', 'Reading your export…'));
    var isXml = /\.xml$/i.test(f.name);
    api('POST', '/api/health/apple/import', null, { raw: f, headers: { 'X-Sihat-Upload': '1', 'Content-Type': isXml ? 'application/xml' : 'application/zip' } }).then(function (r) {
      if (!r.ok) { setStatus('hd-apple-status', T('health.apple.fail', 'Import failed: {err}', { err: errText(r) }), 'is-error'); return; }
      var j = r.json || {};
      say(j.message || T('health.apple.done', 'Imported {n} new readings ({d} already stored) from {s} records.', { n: j.inserted, d: j.duplicates, s: (j.stats || {}).records_scanned || 0 }));
      return load();
    }).catch(function (e) { setStatus('hd-apple-status', T('health.apple.fail', 'Import failed: {err}', { err: e.message }), 'is-error'); });
  }

  function onClick(e) {
    var el = e.target.closest && e.target.closest('[data-act]');
    if (!el) return;
    var act = el.getAttribute('data-act');
    if (act === 'g-connect') return; // plain link: the server redirects to Google
    if (act === 'bt') { btCapture(el.getAttribute('data-kind')); return; }
    if (act === 'g-sync') { googleSync(false); return; }
    if (act === 'g-disconnect') {
      if (!window.confirm(T('health.google.disconnect.confirm', 'Disconnect Google Health?'))) return;
      api('DELETE', '/api/health/google').then(function (r) { say(r.ok ? T('health.google.disconnect.keep', 'Disconnected.') : errText(r), r.ok ? '' : 'error'); return load(); });
      return;
    }
    if (act === 'apple') { appleImport(); return; }
    if (act === 'token-create' || act === 'token-rotate') {
      if (act === 'token-rotate' && !window.confirm(T('health.auto.rotate.confirm', 'Replace the token?'))) return;
      api('POST', '/api/health/ingest-token').then(function (r) {
        if (!r.ok) { setStatus('hd-auto-status', errText(r), 'is-error'); return; }
        data.newToken = r.json.token;
        return load().then(function () { var i = $('hd-token-val'); if (i) { i.focus(); i.select(); } });
      });
      return;
    }
    if (act === 'token-revoke') {
      if (!window.confirm(T('health.auto.revoke.confirm', 'Revoke the token?'))) return;
      api('DELETE', '/api/health/ingest-token').then(function (r) { data.newToken = ''; say(r.ok ? T('health.auto.revoked', 'Token revoked.') : errText(r), r.ok ? '' : 'error'); return load(); });
      return;
    }
    if (act === 'copy-token') {
      var v = $('hd-token-val') && $('hd-token-val').value;
      var done = function () { el.textContent = T('health.auto.copied', 'Copied'); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(v).then(done, function () { $('hd-token-val').select(); });
      else { $('hd-token-val').select(); document.execCommand && document.execCommand('copy'); done(); }
      return;
    }
    if (act === 'del') {
      api('DELETE', '/api/health/readings', { ids: [el.getAttribute('data-id')] }).then(function (r) { if (!r.ok) say(errText(r), 'error'); return load(); });
      return;
    }
    if (act === 'del-all') {
      if (!window.confirm(T('health.deleteall.confirm', 'Delete ALL readings?'))) return;
      api('DELETE', '/api/health/readings', { all: true }).then(function (r) { say(r.ok ? T('health.deleted', 'Deleted.') : errText(r), r.ok ? '' : 'error'); return load(); });
      return;
    }
    if (act === 'manual') {
      var metric = $('hd-m-metric').value, val = parseFloat($('hd-m-value').value);
      if (isNaN(val)) { setStatus('hd-manual-status', T('health.add.fail', 'Could not save that reading: {err}', { err: 'value' }), 'is-error'); return; }
      api('POST', '/api/health/readings', { source: 'manual', readings: [{ metric: metric, value: val }] }).then(function (r) {
        if (r.ok) { say(T('health.add.ok', 'Saved.')); return load(); }
        var rej = r.json && r.json.rejected && r.json.rejected[0];
        setStatus('hd-manual-status', T('health.add.fail', 'Could not save that reading: {err}', { err: rej ? rej.error : errText(r) }), 'is-error');
      });
    }
  }

  /* ---------------------------------------------------------------- */
  /*  boot                                                              */
  /* ---------------------------------------------------------------- */
  document.addEventListener('DOMContentLoaded', function () {
    root = $('devices');
    if (!root) return;
    body = $('hd-body'); banner = $('hd-banner');
    root.addEventListener('click', onClick);
    document.addEventListener('tcm:langchange', function () { if (data.summary) render(); });
    // returning from Google (/api/health/google/callback redirects to /patient?health=<code>#devices)
    var code = new URLSearchParams(location.search).get('health');
    if (code) {
      var ok = code === 'google_connected';
      say(RETURN_KEYS[code] ? T(RETURN_KEYS[code], code) : code, ok ? '' : 'warn');
      if (history.replaceState) history.replaceState(null, '', location.pathname + '#devices');
    }
    load().then(function () { if (code === 'google_connected') return googleSync(true); });
  });

  window.TcmDevices = { reload: load };
})();
