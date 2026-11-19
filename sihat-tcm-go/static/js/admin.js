/**
 * admin.js — read-only operations dashboard. Surfaces the existing admin /
 * monitoring APIs; performs no writes. Auth rides the HttpOnly cookie (a bearer
 * header is added when a JS-readable token happens to exist), so we never
 * pre-gate — sections that need admin rights degrade to a notice on 401/403.
 */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    if (!document.getElementById('adm-overview')) return;
    var token = localStorage.getItem('tcm-token') || getCookie('sb-access-token');
    var auth = token ? { 'Authorization': 'Bearer ' + token } : {};

    getJSON('/api/monitoring/health', {}).then(function (d) {
      if (!d) return;
      setPill('ov-status', d.status);
      setPill('ov-db', d.components && d.components.database && d.components.database.status);
      setPill('ov-ai', d.components && d.components.ai_service && d.components.ai_service.status);
      setText('ov-uptime', fmtUptime(d.uptime));
      setText('ov-env', d.environment || '—');
    });

    getJSON('/api/admin/db-status', {}).then(function (d) {
      if (!d) return;
      var s = d.stats || {};
      setText('st-users', num(s.totalUsers));
      setText('st-admins', num(s.adminUsers));
      setText('st-diag', num(s.totalDiagnoses));
      renderPrompts(d.promptsStatus || []);
    });

    getJSON('/api/admin/system-health', auth).then(function (d) {
      if (!d) { notice('adm-errors'); return; }
      renderErrors(d);
    });

    getJSON('/api/logs?limit=20', auth).then(function (d) {
      if (!d || !d.logs) { notice('adm-logs'); return; }
      renderLogs(d.logs);
    });

    getJSON('/api/admin/settings', {}).then(function (d) { renderSettings(d || {}); });

    var tk = document.getElementById('adm-testkey');
    if (tk) tk.addEventListener('click', function () { testGeminiKey(auth); });
  });

  function testGeminiKey(auth) {
    var out = document.getElementById('adm-testkey-result');
    if (!out) return;
    out.textContent = 'Testing… 测试中…'; out.style.color = '';
    fetch('/api/admin/test-api-key', {
      method: 'POST',
      headers: Object.assign({ 'Content-Type': 'application/json' }, auth || {}),
      body: JSON.stringify({ useSavedKey: true }),
    })
      .then(function (r) { return r.json().then(function (d) { return { status: r.status, ok: r.ok, d: d }; }); })
      .then(function (res) {
        if (res.ok && res.d && res.d.success) {
          out.innerHTML = '<span class="pill healthy">✓ Valid 有效</span> ' + esc(res.d.message || 'Key is working');
        } else {
          var msg = (res.d && res.d.error) || 'Test failed';
          var quota = res.status === 429;
          out.innerHTML = '<span class="pill ' + (quota ? 'degraded' : 'unhealthy') + '">' + (quota ? '⚠ Quota 配额' : '✗ Error 错误') + '</span> ' + esc(msg);
        }
      })
      .catch(function () { out.textContent = 'Could not run the test. 无法测试。'; });
  }

  /* ---- renderers ---- */
  function renderPrompts(arr) {
    var box = document.getElementById('adm-prompts');
    if (!arr.length) { box.innerHTML = '<p class="muted">No prompt data.</p>'; return; }
    box.innerHTML = '<div class="adm-table-wrap"><table class="adm-table"><thead><tr><th>Role</th><th>Exists</th><th>Has content</th></tr></thead><tbody>'
      + arr.map(function (p) {
          return '<tr><td>' + esc(p.role) + '</td><td>' + yn(p.exists) + '</td><td>' + yn(p.hasContent) + '</td></tr>';
        }).join('') + '</tbody></table></div>';
  }

  function renderErrors(d) {
    var box = document.getElementById('adm-errors');
    var s = d.error_statistics || {};
    var overall = d.overall_status || 'unknown';
    var chips = [
      ['Total 总', s.total_errors], ['Critical 严重', s.critical_errors], ['High 高', s.high_errors],
      ['Medium 中', s.medium_errors], ['Low 低', s.low_errors], ['Resolved 已解决', s.resolved_errors],
    ].map(function (r) { return '<span class="admin-stat" style="display:inline-block;padding:.4rem .7rem;margin:.2rem"><strong>' + num(r[1]) + '</strong> <span class="muted">' + esc(r[0]) + '</span></span>'; }).join('');
    var recent = (d.recent_errors || []).slice(0, 8);
    var list = recent.length
      ? '<div class="adm-table-wrap" style="margin-top:.6rem"><table class="adm-table"><thead><tr><th>When</th><th>Severity</th><th>Message</th></tr></thead><tbody>'
          + recent.map(function (e) {
              return '<tr><td>' + esc(fmtDT(e.created_at)) + '</td><td>' + esc(e.severity || '—') + '</td><td>' + esc(trunc(e.message || e.error_type || '', 90)) + '</td></tr>';
            }).join('') + '</tbody></table></div>'
      : '<p class="muted" style="margin-top:.5rem">No errors in the last 24h. ✓</p>';
    box.innerHTML = '<div>Overall: <span class="pill ' + pillClass(overall) + '">' + esc(overall) + '</span></div><div style="margin-top:.5rem">' + chips + '</div>' + list;
  }

  function renderLogs(logs) {
    var box = document.getElementById('adm-logs');
    if (!logs.length) { box.innerHTML = '<p class="muted">No logs.</p>'; return; }
    box.innerHTML = '<div class="adm-table-wrap"><table class="adm-table"><thead><tr><th>When</th><th>Level</th><th>Category</th><th>Message</th></tr></thead><tbody>'
      + logs.map(function (l) {
          var lvl = (l.level || 'info');
          return '<tr><td>' + esc(fmtDT(l.timestamp)) + '</td><td class="lvl ' + esc(lvl) + '">' + esc(lvl) + '</td><td>' + esc(l.category || '—') + '</td><td>' + esc(trunc(l.message || '', 100)) + '</td></tr>';
        }).join('') + '</tbody></table></div>';
  }

  function renderSettings(obj) {
    var box = document.getElementById('adm-settings');
    var keys = Object.keys(obj).filter(function (k) { return k !== 'id'; });
    if (!keys.length) { box.innerHTML = '<p class="muted">No settings saved.</p>'; return; }
    box.innerHTML = '<div class="adm-table-wrap"><table class="adm-table"><tbody>'
      + keys.map(function (k) {
          var v = obj[k];
          if (v && typeof v === 'object') v = JSON.stringify(v);
          return '<tr><th style="text-transform:none;width:35%">' + esc(k) + '</th><td>' + esc(trunc(String(v == null ? '' : v), 120)) + '</td></tr>';
        }).join('') + '</tbody></table></div>';
  }

  /* ---- helpers ---- */
  function getJSON(url, headers) {
    return fetch(url, { headers: headers }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
  }
  function notice(id) { var e = document.getElementById(id); if (e) e.innerHTML = '<p class="muted">Requires admin/developer access, or unavailable.</p>'; }
  function setText(id, v) { var e = document.getElementById(id); if (e) e.textContent = v; }
  function setPill(id, status) {
    var e = document.getElementById(id); if (!e) return;
    status = status || 'unknown';
    e.innerHTML = '<span class="pill ' + pillClass(status) + '">' + esc(status) + '</span>';
  }
  function pillClass(s) { s = String(s || '').toLowerCase(); return (s === 'healthy' || s === 'degraded' || s === 'unhealthy') ? s : 'degraded'; }
  function num(v) { return (v == null || isNaN(v)) ? '—' : String(v); }
  function yn(b) { return b ? '✓' : '—'; }
  function fmtUptime(sec) {
    sec = Number(sec) || 0;
    if (sec < 60) return Math.round(sec) + 's';
    if (sec < 3600) return Math.round(sec / 60) + 'm';
    if (sec < 86400) return (sec / 3600).toFixed(1) + 'h';
    return (sec / 86400).toFixed(1) + 'd';
  }
  function fmtDT(iso) { if (!iso) return '—'; try { return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch (e) { return String(iso); } }
  function trunc(s, n) { s = String(s == null ? '' : s); return s.length > n ? s.slice(0, n) + '…' : s; }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function getCookie(n) { var m = document.cookie.match('(^|;)\\s*' + n + '\\s*=\\s*([^;]+)'); return m ? m.pop() : ''; }
})();
