/**
 * doctor-inbox.js — doctor-side inbox of patient consultation requests routed to
 * this doctor. Review the AI report and send feedback to the patient.
 */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    if (!document.getElementById('doctor-inbox')) return; // doctor page only
    loadInbox();
  });

  function token() { return localStorage.getItem('tcm-token') || getCookie('sb-access-token'); }

  var allRequests = [];

  function loadInbox() {
    var box = document.getElementById('doctor-inbox');
    fetch('/api/doctor/requests', { headers: { 'Authorization': 'Bearer ' + token() } })
      .then(function (r) {
        if (r.status === 401 || r.status === 403) { box.innerHTML = '<p class="alert alert-error">Doctor access required. Please sign in as a doctor.</p>'; return null; }
        return r.json();
      })
      .then(function (d) {
        if (!d) return;
        allRequests = d.requests || [];
        // Wire the filter controls once.
        ['inbox-search', 'inbox-status', 'inbox-flag'].forEach(function (id) {
          var e = document.getElementById(id);
          if (e && !e.dataset.wired) { e.dataset.wired = '1'; e.addEventListener('input', applyFilters); e.addEventListener('change', applyFilters); }
        });
        applyFilters();
      })
      .catch(function () { box.innerHTML = '<p class="alert alert-error">Could not load requests.</p>'; });
  }

  function applyFilters() {
    var box = document.getElementById('doctor-inbox');
    var q = (val('inbox-search') || '').toLowerCase();
    var statusF = val('inbox-status');
    var flagF = val('inbox-flag');
    var filtered = allRequests.filter(function (req) {
      if (statusF && (req.status || 'pending') !== statusF) return false;
      if (flagF && (req.flag || 'normal') !== flagF) return false;
      if (q) {
        var rep = req.diagnosis_report || {};
        var hay = ((rep.patient_profile && rep.patient_profile.name) || '') + ' '
          + ((rep.full_report && rep.full_report.diagnosis && rep.full_report.diagnosis.primary_pattern) || '') + ' '
          + ((rep.selected_doctor && rep.selected_doctor.name) || '');
        if (hay.toLowerCase().indexOf(q) === -1) return false;
      }
      return true;
    });
    var countEl = document.getElementById('inbox-count'); if (countEl) countEl.textContent = allRequests.length;
    var pendEl = document.getElementById('inbox-pending'); if (pendEl) pendEl.textContent = allRequests.filter(function (x) { return (x.status || 'pending') !== 'reviewed'; }).length;
    if (!allRequests.length) { box.innerHTML = '<p class="text-muted">No patient requests yet. When a patient selects a doctor, their report appears here.</p>'; return; }
    if (!filtered.length) { box.innerHTML = '<p class="text-muted">No requests match your filters.</p>'; return; }
    box.innerHTML = filtered.map(renderRequest).join('');
    box.querySelectorAll('button[data-reply]').forEach(function (b) { b.addEventListener('click', function () { doctorReply(b.getAttribute('data-reply')); }); });
    box.querySelectorAll('select[data-flag]').forEach(function (sel) { sel.addEventListener('change', function () { doctorSetFlag(sel.getAttribute('data-flag'), sel.value); }); });
    box.querySelectorAll('button[data-print]').forEach(function (b) { b.addEventListener('click', function () { doctorPrint(b.getAttribute('data-print')); }); });
  }

  function doctorPrint(id) {
    var req = allRequests.filter(function (x) { return String(x.id) === String(id); })[0];
    if (!req || !window.TCMPrintReport) return;
    var rep = req.diagnosis_report || {};
    var pp = rep.patient_profile || {};
    window.TCMPrintReport({
      full_report: rep.full_report || {},
      symptoms: pp.symptoms || (Array.isArray(req.symptoms) ? req.symptoms.join(', ') : req.symptoms) || '',
      created_at: req.created_at,
    });
  }

  function doctorSetFlag(id, flag) {
    fetch('/api/doctor/flag', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token() }, body: JSON.stringify({ requestId: id, flag: flag }) })
      .then(function (r) { return r.json(); })
      .then(function () { var req = allRequests.filter(function (x) { return x.id === id; })[0]; if (req) req.flag = flag; applyFilters(); })
      .catch(function () { /* ignore */ });
  }

  function val(id) { var e = document.getElementById(id); return e ? e.value : ''; }

  function renderRequest(req) {
    var rep = req.diagnosis_report || {};
    var pp = rep.patient_profile || {};
    var doc = rep.selected_doctor || {};
    var report = rep.full_report || {};
    var diag = (report.diagnosis && report.diagnosis.primary_pattern) || rep.ai_diagnosis || '—';
    if (diag && typeof diag === 'object') diag = diag.primary_pattern || '—';
    var constitution = (report.constitution && report.constitution.type) || '';
    var summary = (report.analysis && report.analysis.summary) || '';
    var hasReport = !!(report && (report.diagnosis || report.constitution || report.analysis || report.recommendations));
    var msgs = (rep.messages || []).filter(function (m) { return m.role === 'doctor'; });
    var reviewed = req.status === 'reviewed' || msgs.length > 0;
    var flag = req.flag || 'normal';
    var flagBadge = flag !== 'normal' ? '<span class="flag-badge flag-' + flag + '">' + (flag === 'critical' ? '🔴 Critical' : '🟡 Watch') + '</span> ' : '';

    return '<div class="inbox-item flag-border-' + flag + '">'
      + '<div class="inbox-head"><div><strong>' + esc(pp.name || 'Patient') + '</strong>'
      + '<div class="inbox-diag">Pattern: ' + esc(typeof diag === 'string' ? diag : '—') + (constitution ? ' · ' + esc(constitution) : '') + '</div>'
      + '<div class="inbox-diag">→ Requested ' + esc(doc.name || 'any doctor') + '  ·  ' + esc(fmtDT(req.created_at)) + '</div></div>'
      + '<div class="inbox-badges">' + flagBadge + '<span class="consult-badge ' + (reviewed ? 'reviewed' : 'pending') + '">' + (reviewed ? 'Reviewed ✓' : 'Pending ⏳') + '</span></div></div>'
      + (summary ? '<div class="inbox-summary">' + esc(summary.slice(0, 260)) + (summary.length > 260 ? '…' : '') + '</div>' : '')
      + (msgs.length ? '<div class="consult-feedback">Your reply: ' + esc(msgs[msgs.length - 1].content) + '</div>' : '')
      + (hasReport ? '<div class="inbox-actions" style="margin:.4rem 0"><button class="btn btn-ghost btn-sm" data-print="' + esc(req.id) + '">🖨 Print / Save PDF 打印报告</button></div>' : '')
      + '<div class="inbox-reply">'
      + '<textarea class="form-input" id="reply-' + esc(req.id) + '" rows="2" placeholder="Write clinical feedback to the patient…"></textarea>'
      + '<button class="btn btn-blue btn-sm" data-reply="' + esc(req.id) + '">Send Feedback 发送反馈</button>'
      + '</div>'
      + '<div class="inbox-flagrow">Priority 优先级: <select class="flag-select" data-flag="' + esc(req.id) + '">'
      + '<option value="normal"' + (flag === 'normal' ? ' selected' : '') + '>Normal 普通</option>'
      + '<option value="watch"' + (flag === 'watch' ? ' selected' : '') + '>Watch 关注</option>'
      + '<option value="critical"' + (flag === 'critical' ? ' selected' : '') + '>Critical 紧急</option>'
      + '</select></div>'
      + '<div class="reply-status" id="reply-status-' + esc(req.id) + '"></div></div>';
  }

  function doctorReply(id) {
    var ta = document.getElementById('reply-' + id);
    var st = document.getElementById('reply-status-' + id);
    var msg = (ta.value || '').trim();
    if (!msg) { st.textContent = 'Please write feedback first.'; st.style.color = '#b45309'; return; }
    st.textContent = 'Sending…';
    st.style.color = 'var(--color-muted)';
    fetch('/api/doctor/reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token() },
      body: JSON.stringify({ requestId: id, message: msg, targetTable: 'inquiries' }),
    })
      .then(function (r) { if (!r.ok) throw new Error('status ' + r.status); return r.json(); })
      .then(function () { st.textContent = 'Feedback sent ✓'; st.style.color = 'var(--emerald-600)'; setTimeout(loadInbox, 900); })
      .catch(function (e) { st.textContent = 'Could not send: ' + e.message; st.style.color = '#dc2626'; });
  }

  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function fmtDT(iso) { if (!iso) return ''; try { return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch (e) { return String(iso); } }
  function getCookie(n) { var m = document.cookie.match('(^|;)\\s*' + n + '\\s*=\\s*([^;]+)'); return m ? m.pop() : ''; }
})();
