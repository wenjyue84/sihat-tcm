/**
 * consult.js — patient-side doctor directory + consultation requests.
 * Loads on patient.html: browse registered doctors, request a review of your
 * latest report, and view doctor feedback.
 */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    if (!document.getElementById('doctor-directory')) return; // patient page only
    loadDoctors();
    loadConsultations();
  });

  function token() { return localStorage.getItem('tcm-token') || getCookie('sb-access-token'); }
  function me() { try { return JSON.parse(localStorage.getItem('tcm-user') || '{}'); } catch (e) { return {}; } }

  var latestReport = null;
  var allDoctors = [];

  function initials(name) {
    var parts = String(name || '').replace(/[一-鿿]/g, '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '医';
    return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
  }

  function loadLatestReport(cb) {
    fetch('/api/patient/sessions', { headers: { 'Authorization': 'Bearer ' + token() } })
      .then(function (r) { return r.ok ? r.json() : { sessions: [] }; })
      .then(function (d) {
        var sessions = d.sessions || [];
        if (sessions.length) latestReport = sessions[0].full_report;
        cb();
      })
      .catch(function () { cb(); });
  }

  /* ---- Doctor directory ---- */
  function loadDoctors() {
    var box = document.getElementById('doctor-directory');
    fetch('/api/doctors')
      .then(function (r) { return r.json(); })
      .then(function (d) {
        allDoctors = d.doctors || [];
        if (!allDoctors.length) { box.innerHTML = '<p class="text-muted" style="font-size:.85rem">No doctors are available yet.</p>'; return; }
        box.innerHTML = allDoctors.map(function (doc) {
          var name = esc(doc.full_name || 'TCM Doctor');
          var yrs = doc.years_experience ? doc.years_experience + ' yrs exp' : '';
          var meta = [esc(doc.specialty || 'TCM Practitioner'), yrs, esc(doc.clinic || '')].filter(Boolean).join(' · ');
          return '<div class="doctor-card">'
            + '<div class="doctor-avatar">' + esc(initials(doc.full_name)) + '</div>'
            + '<div class="doctor-info">'
            + '<div class="doctor-name">' + name + '</div>'
            + '<div class="doctor-specialty">' + meta + '</div>'
            + (doc.bio ? '<div class="doctor-bio">' + esc(String(doc.bio).slice(0, 90)) + (String(doc.bio).length > 90 ? '…' : '') + '</div>' : '')
            + '</div>'
            + '<div class="doctor-actions">'
            + '<button class="btn btn-ghost btn-sm" data-view="' + esc(doc.id) + '">Details 详情</button>'
            + '<button class="btn btn-primary btn-sm" data-id="' + esc(doc.id) + '" data-name="' + name + '">Request 会诊</button>'
            + '</div>'
            + '</div>';
        }).join('');
        box.querySelectorAll('button[data-id]').forEach(function (b) {
          b.addEventListener('click', function () { consultRequest(b.getAttribute('data-id'), b.getAttribute('data-name')); });
        });
        box.querySelectorAll('button[data-view]').forEach(function (b) {
          b.addEventListener('click', function () { openDoctorModal(b.getAttribute('data-view')); });
        });
      })
      .catch(function () { box.innerHTML = '<p class="alert alert-error">Could not load doctors.</p>'; });
  }

  /* ---- Doctor detail modal ---- */
  function openDoctorModal(id) {
    var doc = allDoctors.filter(function (x) { return String(x.id) === String(id); })[0];
    if (!doc) return;
    var modal = document.getElementById('doctor-modal');
    var art = doc.avg_response_time ? (doc.avg_response_time >= 60 ? Math.round(doc.avg_response_time / 60) + 'h' : doc.avg_response_time + 'm') : '—';
    var rows = [
      ['Specialty 专长', doc.specialty],
      ['Experience 经验', doc.years_experience ? doc.years_experience + ' years' : ''],
      ['Qualification 资质', doc.qualification],
      ['Languages 语言', doc.languages],
      ['Clinic 诊所', doc.clinic],
      ['Typical response 回复时间', art !== '—' ? '~' + art : ''],
    ].filter(function (r) { return r[1]; });
    document.getElementById('doctor-modal-body').innerHTML =
      '<div class="dm-head"><div class="dm-avatar">' + esc(initials(doc.full_name)) + '</div>'
      + '<div><div class="dm-name">' + esc(doc.full_name) + ' <span class="dm-verified">✓ Verified</span></div>'
      + '<div class="dm-spec">' + esc(doc.specialty || 'TCM Practitioner') + '</div></div></div>'
      + (doc.bio ? '<p class="dm-bio">' + esc(doc.bio) + '</p>' : '')
      + '<div class="dm-rows">' + rows.map(function (r) { return '<div class="dm-row"><span>' + esc(r[0]) + '</span><strong>' + esc(String(r[1])) + '</strong></div>'; }).join('') + '</div>'
      + '<button class="btn btn-primary btn-full mt-2" id="dm-request">Request Review 请求会诊</button>';
    document.getElementById('dm-request').addEventListener('click', function () { closeDoctorModal(); consultRequest(doc.id, doc.full_name); });
    modal.classList.remove('hidden');
  }
  function closeDoctorModal() { var m = document.getElementById('doctor-modal'); if (m) m.classList.add('hidden'); }
  window.closeDoctorModal = closeDoctorModal;

  function consultRequest(doctorId, doctorName) {
    var status = document.getElementById('consult-status');
    status.style.color = 'var(--color-muted)';
    status.textContent = 'Preparing your latest report for ' + doctorName + '…';
    loadLatestReport(function () {
      if (!latestReport) {
        status.textContent = 'Please complete and save an assessment first, then request a review.';
        status.style.color = '#b45309';
        return;
      }
      var u = me();
      fetch('/api/verification-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: u.id, doctorId: doctorId, doctorName: doctorName,
          patientData: { name: u.email || 'Patient', email: u.email }, reportData: latestReport,
        }),
      })
        .then(function (r) { return r.json(); })
        .then(function (d) {
          if (!d || !d.success) throw new Error((d && d.error) || 'failed');
          status.textContent = '✓ Request sent to ' + doctorName + '. They will review your report and reply below.';
          status.style.color = 'var(--emerald-600)';
          loadConsultations();
        })
        .catch(function (err) { status.textContent = 'Could not send request: ' + err.message; status.style.color = '#dc2626'; });
    });
  }

  /* ---- My consultations (with details + doctor feedback + cancel) ---- */
  function loadConsultations() {
    var box = document.getElementById('consultations-list');
    if (!box) return;
    fetch('/api/patient/requests', { headers: { 'Authorization': 'Bearer ' + token() } })
      .then(function (r) { return r.ok ? r.json() : { requests: [] }; })
      .then(function (d) {
        var reqs = d.requests || [];
        if (!reqs.length) { box.innerHTML = '<p class="text-muted" style="font-size:.85rem">No consultation requests yet. Pick a doctor above to get expert feedback on your report.</p>'; return; }
        box.innerHTML = reqs.map(function (req) {
          var rep = req.diagnosis_report || {};
          var doc = rep.selected_doctor || {};
          var msgs = (rep.messages || []).filter(function (m) { return m.role === 'doctor'; });
          var reviewed = req.status === 'reviewed' || msgs.length > 0;
          var cancelled = req.status === 'cancelled';
          var badge = '<span class="consult-badge ' + (cancelled ? 'cancelled' : (reviewed ? 'reviewed' : 'pending')) + '">'
            + (cancelled ? 'Cancelled 已取消' : (reviewed ? 'Reviewed ✓ 已回复' : 'Pending ⏳ 等待中')) + '</span>';
          var report = rep.full_report || {};
          var diag = (report.diagnosis && report.diagnosis.primary_pattern) || rep.ai_diagnosis || '';
          if (diag && typeof diag === 'object') diag = diag.primary_pattern || '';
          var metaBits = ['Requested ' + fmtDateTime(req.created_at)];
          if (diag) metaBits.push('Pattern: ' + String(diag));
          var fb = msgs.length
            ? msgs.map(function (m) { return '<div class="consult-feedback">💬 ' + esc(m.content) + (m.timestamp ? '<div class="consult-ts">— ' + esc(fmtDateTime(m.timestamp)) + '</div>' : '') + '</div>'; }).join('')
            : '<div class="text-muted" style="font-size:.8rem">Awaiting doctor feedback…</div>';
          return '<div class="consult-item">'
            + '<div class="consult-head"><strong>' + esc(doc.name || 'Doctor') + '</strong> ' + badge + '</div>'
            + '<div class="consult-meta">' + esc(metaBits.join('  ·  ')) + '</div>'
            + fb
            + '<div class="consult-actions"><button class="btn btn-ghost btn-sm consult-cancel" data-cancel="' + esc(req.id) + '">🗑 Remove 取消</button></div>'
            + '</div>';
        }).join('');
        box.querySelectorAll('button[data-cancel]').forEach(function (b) {
          b.addEventListener('click', function () { cancelConsult(b.getAttribute('data-cancel')); });
        });
      })
      .catch(function () { box.innerHTML = '<p class="alert alert-error">Could not load consultations.</p>'; });
  }
  window.loadConsultations = loadConsultations;

  function cancelConsult(id) {
    if (!window.confirm('Remove this consultation request? This cannot be undone.')) return;
    fetch('/api/patient/requests/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token() },
      body: JSON.stringify({ id: id }),
    })
      .then(function (r) { return r.json(); })
      .then(function (d) { if (!d || !d.success) throw new Error((d && d.error) || 'failed'); loadConsultations(); })
      .catch(function () { alert('Could not remove the request. Please try again.'); });
  }

  function fmtDateTime(iso) {
    if (!iso) return '';
    try { return new Date(iso).toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); }
    catch (e) { return String(iso); }
  }

  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function getCookie(n) { var m = document.cookie.match('(^|;)\\s*' + n + '\\s*=\\s*([^;]+)'); return m ? m.pop() : ''; }
})();
