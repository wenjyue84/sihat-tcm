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
        renderPatients();
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
    box.querySelectorAll('button[data-tp]').forEach(function (b) { b.addEventListener('click', function () { doctorSaveTreatmentPlan(b.getAttribute('data-tp')); }); });
  }

  function doctorSaveTreatmentPlan(id) {
    var plan = {
      pattern: val('tp-pattern-' + id),
      treatment: val('tp-treat-' + id),
      lifestyle: val('tp-life-' + id),
      follow_up: val('tp-follow-' + id),
    };
    var st = document.getElementById('tp-status-' + id);
    if (!plan.pattern && !plan.treatment && !plan.lifestyle) { st.textContent = 'Add at least one field. 请至少填一项。'; st.style.color = '#b45309'; return; }
    st.textContent = 'Saving… 保存中…'; st.style.color = 'var(--color-muted)';
    fetch('/api/doctor/treatment-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token() },
      body: JSON.stringify({ requestId: id, plan: plan }),
    })
      .then(function (r) { return r.json(); })
      .then(function (d) { if (!d || !d.success) throw new Error(); st.textContent = 'Saved ✓ 已保存'; st.style.color = 'var(--emerald-600)'; setTimeout(loadInbox, 900); })
      .catch(function () { st.textContent = 'Could not save. 保存失败。'; st.style.color = '#dc2626'; });
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

  /* ---- Patients view: group the master inbox by patient ---- */
  var FLAG_RANK = { critical: 3, watch: 2, normal: 1 };

  function renderPatients() {
    var box = document.getElementById('doctor-patients');
    if (!box) return;
    var groups = {};
    allRequests.forEach(function (req) {
      var pp = (req.diagnosis_report || {}).patient_profile || {};
      var key = req.user_id || pp.name || ('req-' + req.id);
      if (!groups[key]) groups[key] = { name: pp.name || 'Patient', reqs: [] };
      if (pp.name && groups[key].name === 'Patient') groups[key].name = pp.name;
      groups[key].reqs.push(req);
    });

    var rows = Object.keys(groups).map(function (k) {
      var reqs = groups[k].reqs.slice().sort(function (a, b) { return new Date(b.created_at) - new Date(a.created_at); });
      var latest = reqs[0];
      var report = (latest.diagnosis_report || {}).full_report || {};
      var pattern = (report.diagnosis && report.diagnosis.primary_pattern) || (latest.diagnosis_report || {}).ai_diagnosis || '—';
      if (pattern && typeof pattern === 'object') pattern = pattern.primary_pattern || pattern.name || '—';
      var topFlag = reqs.reduce(function (acc, r) { var f = r.flag || 'normal'; return FLAG_RANK[f] > FLAG_RANK[acc] ? f : acc; }, 'normal');
      var pending = reqs.filter(function (r) { return (r.status || 'pending') !== 'reviewed'; }).length;
      return { name: groups[k].name, count: reqs.length, pattern: typeof pattern === 'string' ? pattern : '—', flag: topFlag, pending: pending, last: latest.created_at };
    }).sort(function (a, b) {
      if (FLAG_RANK[b.flag] !== FLAG_RANK[a.flag]) return FLAG_RANK[b.flag] - FLAG_RANK[a.flag];
      return new Date(b.last) - new Date(a.last);
    });

    var pc = document.getElementById('patients-count'); if (pc) pc.textContent = rows.length;
    if (!rows.length) { box.innerHTML = '<p class="text-muted">No patients yet.</p>'; return; }
    box.innerHTML = '<table class="patients-table"><thead><tr>'
      + '<th>Patient 患者</th><th>Assessments 评估</th><th>Latest Pattern 最新证型</th><th>Priority 优先级</th><th>Pending 待办</th><th>Last Activity 最近</th><th></th>'
      + '</tr></thead><tbody>'
      + rows.map(function (r) {
          var flagLabel = r.flag === 'critical' ? '🔴 Critical' : (r.flag === 'watch' ? '🟡 Watch' : 'Normal');
          return '<tr>'
            + '<td class="pt-name">' + esc(r.name) + '</td>'
            + '<td>' + r.count + '</td>'
            + '<td>' + esc(r.pattern) + '</td>'
            + '<td><span class="pt-pill ' + r.flag + '">' + flagLabel + '</span></td>'
            + '<td>' + (r.pending ? '<strong style="color:#b45309">' + r.pending + '</strong>' : '0') + '</td>'
            + '<td>' + esc(fmtDT(r.last)) + '</td>'
            + '<td><button class="btn btn-ghost btn-sm" data-patient="' + esc(r.name) + '">View 查看</button></td>'
            + '</tr>';
        }).join('')
      + '</tbody></table>';
    box.querySelectorAll('button[data-patient]').forEach(function (b) {
      b.addEventListener('click', function () {
        var s = document.getElementById('inbox-search'); if (s) s.value = b.getAttribute('data-patient');
        doctorShowTab('requests');
        applyFilters();
      });
    });
  }

  function doctorShowTab(tab) {
    var reqPanel = document.getElementById('tab-requests');
    var patPanel = document.getElementById('tab-patients');
    if (!reqPanel || !patPanel) return;
    var showReq = tab !== 'patients';
    reqPanel.classList.toggle('hidden', !showReq);
    patPanel.classList.toggle('hidden', showReq);
    var rb = document.getElementById('tabbtn-requests'); if (rb) rb.classList.toggle('active', showReq);
    var pb = document.getElementById('tabbtn-patients'); if (pb) pb.classList.toggle('active', !showReq);
    if (!showReq) renderPatients();
  }
  window.doctorShowTab = doctorShowTab;

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
    var reviewed = req.status === 'reviewed' && msgs.length > 0;
    var flag = req.flag || 'normal';
    var flagBadge = flag !== 'normal' ? '<span class="flag-badge flag-' + flag + '">' + (flag === 'critical' ? '🔴 Critical' : '🟡 Watch') + '</span> ' : '';

    return '<div class="inbox-item flag-border-' + flag + '">'
      + '<div class="inbox-head"><div><strong>' + esc(pp.name || 'Patient') + '</strong>'
      + '<div class="inbox-diag">Pattern: ' + esc(typeof diag === 'string' ? diag : '—') + (constitution ? ' · ' + esc(constitution) : '') + '</div>'
      + '<div class="inbox-diag">→ Requested ' + esc(doc.name || 'any doctor') + '  ·  ' + esc(fmtDT(req.created_at)) + '</div></div>'
      + '<div class="inbox-badges">' + flagBadge + '<span class="consult-badge ' + (reviewed ? 'reviewed' : 'pending') + '">' + (reviewed ? 'Reviewed ✓' : 'Pending ⏳') + '</span></div></div>'
      + (summary ? '<div class="inbox-summary">' + esc(summary.slice(0, 260)) + (summary.length > 260 ? '…' : '') + '</div>' : '')
      + (function () {
          var all = rep.messages || [];
          if (!all.length) return '';
          return '<div class="consult-thread" style="margin:.4rem 0">' + all.map(function (m) {
            var isDoc = m.role === 'doctor';
            return '<div style="margin:.3rem 0;padding:.45rem .65rem;border-radius:.5rem;font-size:.82rem;'
              + (isDoc ? 'background:#eff6ff;border-left:3px solid #3b82f6' : 'background:#f0fdf4;border-left:3px solid #22c55e') + '">'
              + '<strong style="font-size:.74rem;color:var(--slate-500,#64748b)">' + (isDoc ? '🩺 You 我' : '🧑 ' + esc(pp.name || 'Patient')) + '</strong><br>' + esc(m.content)
              + (m.timestamp ? '<div style="font-size:.72rem;color:var(--slate-400,#94a3b8);margin-top:.15rem">' + esc(fmtDT(m.timestamp)) + '</div>' : '')
              + '</div>';
          }).join('') + '</div>';
        })()
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
      + '<div class="reply-status" id="reply-status-' + esc(req.id) + '"></div>'
      + '<details style="margin-top:.5rem"><summary style="cursor:pointer;font-size:.82rem;font-weight:600;color:var(--blue-700,#1d4ed8)">📋 Treatment Plan 治疗方案' + (rep.treatment_plan ? ' ✓' : '') + '</summary>'
      + '<div style="margin-top:.5rem;display:flex;flex-direction:column;gap:.4rem">'
      + '<input class="form-input" id="tp-pattern-' + esc(req.id) + '" placeholder="Confirmed pattern 证型" value="' + esc(planVal(rep, 'pattern')) + '">'
      + '<textarea class="form-input" id="tp-treat-' + esc(req.id) + '" rows="2" placeholder="Herbs / formula 方药">' + esc(planVal(rep, 'treatment')) + '</textarea>'
      + '<textarea class="form-input" id="tp-life-' + esc(req.id) + '" rows="2" placeholder="Lifestyle advice 生活建议">' + esc(planVal(rep, 'lifestyle')) + '</textarea>'
      + '<input class="form-input" id="tp-follow-' + esc(req.id) + '" type="date" value="' + esc(planVal(rep, 'follow_up')) + '">'
      + '<button class="btn btn-blue btn-sm" data-tp="' + esc(req.id) + '">Save Plan 保存方案</button>'
      + '<div class="reply-status" id="tp-status-' + esc(req.id) + '" style="font-size:.76rem;min-height:.9rem"></div>'
      + '</div></details>'
      + '</div>';
  }

  function planVal(rep, key) { var tp = (rep && rep.treatment_plan) || {}; return tp[key] != null ? String(tp[key]) : ''; }

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
