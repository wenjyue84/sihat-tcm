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

  function loadInbox() {
    var box = document.getElementById('doctor-inbox');
    var countEl = document.getElementById('inbox-count');
    fetch('/api/doctor/requests', { headers: { 'Authorization': 'Bearer ' + token() } })
      .then(function (r) {
        if (r.status === 401 || r.status === 403) { box.innerHTML = '<p class="alert alert-error">Doctor access required. Please sign in as a doctor.</p>'; return null; }
        return r.json();
      })
      .then(function (d) {
        if (!d) return;
        var reqs = d.requests || [];
        if (countEl) countEl.textContent = reqs.length;
        var pending = reqs.filter(function (x) { return x.status !== 'reviewed'; }).length;
        var pendEl = document.getElementById('inbox-pending');
        if (pendEl) pendEl.textContent = pending;
        if (!reqs.length) { box.innerHTML = '<p class="text-muted">No patient requests yet. When a patient selects you, their report appears here.</p>'; return; }
        box.innerHTML = reqs.map(renderRequest).join('');
        box.querySelectorAll('button[data-reply]').forEach(function (b) {
          b.addEventListener('click', function () { doctorReply(b.getAttribute('data-reply')); });
        });
      })
      .catch(function () { box.innerHTML = '<p class="alert alert-error">Could not load requests.</p>'; });
  }

  function renderRequest(req) {
    var rep = req.diagnosis_report || {};
    var pp = rep.patient_profile || {};
    var doc = rep.selected_doctor || {};
    var report = rep.full_report || {};
    var diag = (report.diagnosis && report.diagnosis.primary_pattern) || rep.ai_diagnosis || '—';
    if (diag && typeof diag === 'object') diag = diag.primary_pattern || '—';
    var constitution = (report.constitution && report.constitution.type) || '';
    var summary = (report.analysis && report.analysis.summary) || '';
    var msgs = (rep.messages || []).filter(function (m) { return m.role === 'doctor'; });
    var reviewed = req.status === 'reviewed' || msgs.length > 0;

    return '<div class="inbox-item">'
      + '<div class="inbox-head"><div><strong>' + esc(pp.name || 'Patient') + '</strong>'
      + '<div class="inbox-diag">Pattern: ' + esc(typeof diag === 'string' ? diag : '—') + (constitution ? ' · ' + esc(constitution) : '') + '</div>'
      + '<div class="inbox-diag">→ Requested ' + esc(doc.name || 'any doctor') + '  ·  ' + esc(fmtDT(req.created_at)) + '</div></div>'
      + '<span class="consult-badge ' + (reviewed ? 'reviewed' : 'pending') + '">' + (reviewed ? 'Reviewed ✓' : 'Pending ⏳') + '</span></div>'
      + (summary ? '<div class="inbox-summary">' + esc(summary.slice(0, 260)) + (summary.length > 260 ? '…' : '') + '</div>' : '')
      + (msgs.length ? '<div class="consult-feedback">Your reply: ' + esc(msgs[msgs.length - 1].content) + '</div>' : '')
      + '<div class="inbox-reply">'
      + '<textarea class="form-input" id="reply-' + esc(req.id) + '" rows="2" placeholder="Write clinical feedback to the patient…"></textarea>'
      + '<button class="btn btn-blue btn-sm" data-reply="' + esc(req.id) + '">Send Feedback 发送反馈</button>'
      + '</div><div class="reply-status" id="reply-status-' + esc(req.id) + '"></div></div>';
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
