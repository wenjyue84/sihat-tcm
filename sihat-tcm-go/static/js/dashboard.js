/**
 * dashboard.js — Patient dashboard session list + inline report renderer.
 * Also shared by doctor.html for the session count stats.
 * Vanilla JS, no dependencies.
 */
(function () {
  'use strict';

  /* ------------------------------------------------------------------ */
  /*  Init — only runs on patient.html                                    */
  /* ------------------------------------------------------------------ */
  document.addEventListener('DOMContentLoaded', function () {
    var sessionsList = document.getElementById('sessions-list');
    if (!sessionsList) return; // not on patient page

    loadSessions();
    renderOrganClock();
    renderWellnessTip();
    initProfile();

    // Logout hook (patient header uses generic "Dashboard" link,
    // but we add a convenience logout to the header nav if a token exists)
    injectLogoutLink();
  });

  /* ------------------------------------------------------------------ */
  /*  Patient basic profile — view + save                                 */
  /* ------------------------------------------------------------------ */
  function initProfile() {
    var saveBtn = document.getElementById('pf-save');
    if (!saveBtn) return;
    var token = localStorage.getItem('tcm-token') || getCookie('sb-access-token');
    fetch('/api/patient/profile', { headers: { 'Authorization': 'Bearer ' + token } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (!d || !d.profile) return;
        var p = d.profile;
        pfSet('pf-name', p.full_name); pfSet('pf-age', p.age); pfSet('pf-gender', p.gender);
        pfSet('pf-height', p.height); pfSet('pf-weight', p.weight); pfSet('pf-history', p.medical_history);
        computeBMI();
      })
      .catch(function () { /* profile optional */ });
    ['pf-height', 'pf-weight'].forEach(function (id) {
      var e = document.getElementById(id); if (e) e.addEventListener('input', computeBMI);
    });
    saveBtn.addEventListener('click', saveProfile);
  }

  function computeBMI() {
    var h = parseFloat(pfVal('pf-height')), w = parseFloat(pfVal('pf-weight'));
    var el = document.getElementById('pf-bmi');
    if (!el) return;
    el.value = (h > 0 && w > 0) ? (w / Math.pow(h / 100, 2)).toFixed(1) : '';
  }

  function saveProfile() {
    var token = localStorage.getItem('tcm-token') || getCookie('sb-access-token');
    var status = document.getElementById('pf-status');
    var payload = { full_name: pfVal('pf-name'), gender: pfVal('pf-gender'), medical_history: pfVal('pf-history') };
    var age = parseInt(pfVal('pf-age'), 10); if (!isNaN(age)) payload.age = age;
    var h = parseFloat(pfVal('pf-height')); if (!isNaN(h)) payload.height = h;
    var w = parseFloat(pfVal('pf-weight')); if (!isNaN(w)) payload.weight = w;
    var bmi = parseFloat(pfVal('pf-bmi')); if (!isNaN(bmi)) payload.bmi = bmi;
    status.textContent = 'Saving…'; status.style.color = 'var(--color-muted)';
    fetch('/api/patient/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token }, body: JSON.stringify(payload) })
      .then(function (r) { return r.json(); })
      .then(function (d) { if (!d || !d.success) throw new Error(); status.textContent = 'Saved ✓ 已保存'; status.style.color = 'var(--emerald-600)'; })
      .catch(function () { status.textContent = 'Could not save.'; status.style.color = '#dc2626'; });
  }

  function pfSet(id, v) { var e = document.getElementById(id); if (e && v != null && v !== '') e.value = v; }
  function pfVal(id) { var e = document.getElementById(id); return e ? String(e.value).trim() : ''; }

  /* ------------------------------------------------------------------ */
  /*  Health overview — stats, TCM organ clock, daily wellness tip        */
  /* ------------------------------------------------------------------ */
  function renderHealthOverview(sessions) {
    // sessions arrive newest-first (API order=created_at.desc).
    var setV = function (id, v) { var e = document.getElementById(id); if (e) e.textContent = v; };
    setV('ov-sessions', sessions.length);

    var newest = sessions[0];
    var constitution = newest ? (((newest.full_report || {}).constitution || {}).type || newest.constitution || '—') : '—';
    setV('ov-constitution', trunc(constitution, 12));

    if (sessions.length) {
      var times = sessions.map(function (s) { return new Date(s.created_at).getTime(); }).filter(function (t) { return !isNaN(t); });
      var first = Math.min.apply(null, times);
      var days = Math.max(0, Math.round((Date.now() - first) / 86400000));
      setV('ov-journey', days < 1 ? 'Today' : (days < 60 ? days + 'd' : Math.round(days / 30) + 'mo'));
    } else setV('ov-journey', '—');

    var counts = {};
    sessions.forEach(function (s) {
      var pp = ((s.full_report || {}).diagnosis || {}).primary_pattern;
      if (pp && typeof pp === 'object') pp = pp.name || pp.pattern;
      pp = pp || s.constitution;
      if (pp) counts[pp] = (counts[pp] || 0) + 1;
    });
    var top = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; })[0] || '—';
    setV('ov-pattern', trunc(top, 14));
  }

  function renderOrganClock() {
    var box = document.getElementById('organ-clock');
    if (!box) return;
    var clock = [
      [23, 'Gallbladder 胆', 'Wind down and prepare for deep sleep.'],
      [1, 'Liver 肝', 'Deep sleep detoxifies the Liver — rest well.'],
      [3, 'Lung 肺', 'Breathing renews the body — stay asleep.'],
      [5, 'Large Intestine 大肠', 'A good time to wake and eliminate.'],
      [7, 'Stomach 胃', 'Eat a warm, nourishing breakfast.'],
      [9, 'Spleen 脾', 'Peak energy — do your focused work now.'],
      [11, 'Heart 心', 'Light lunch; a short rest helps the Heart.'],
      [13, 'Small Intestine 小肠', 'Absorption time — avoid overeating.'],
      [15, 'Bladder 膀胱', 'Hydrate and keep moving.'],
      [17, 'Kidney 肾', 'Ease off; conserve Kidney essence.'],
      [19, 'Pericardium 心包', 'Gentle social time; protect the Heart.'],
      [21, 'Triple Burner 三焦', 'Relax and balance — prepare for sleep.'],
    ];
    var h = new Date().getHours(), idx = 0;
    for (var i = 0; i < clock.length; i++) {
      var start = clock[i][0], end = (start + 2) % 24;
      if (start < end ? (h >= start && h < end) : (h >= start || h < end)) { idx = i; break; }
    }
    var c = clock[idx], s0 = c[0], e0 = (c[0] + 2) % 24;
    var fmt = function (x) { return (x < 10 ? '0' : '') + x + ':00'; };
    box.innerHTML = '<div class="organ-clock-title">🕐 Organ Clock 子午流注</div>'
      + '<div class="organ-now">' + c[1] + '</div>'
      + '<div class="organ-window">Active ' + fmt(s0) + '–' + fmt(e0) + '</div>'
      + '<div class="organ-advice">' + c[2] + '</div>';
  }

  function renderWellnessTip() {
    var box = document.getElementById('wellness-tip');
    if (!box) return;
    var tips = [
      'Sip warm water through the day — it supports Spleen & Stomach Qi.',
      'A 10-minute walk after meals aids digestion and moves Qi.',
      'Sleep before 11pm to nourish Liver Blood and Yin.',
      'Chew slowly and eat to 70% full to protect the Spleen.',
      'Keep your lower back and feet warm to protect Kidney Yang.',
      'Slow, deep breathing calms the Heart-Shen and eases stress.',
      'Favour cooked, warm foods over raw/cold to support digestion.',
    ];
    var day = Math.floor(Date.now() / 86400000) % tips.length;
    box.innerHTML = '<div class="wellness-tip-title">🌿 Daily Wellness 养生贴士</div><div class="wellness-tip-body">' + tips[day] + '</div>';
  }

  function trunc(s, n) { s = String(s == null ? '' : s); return s.length > n ? s.slice(0, n) + '…' : s; }

  /* ------------------------------------------------------------------ */
  /*  Load Sessions                                                       */
  /* ------------------------------------------------------------------ */
  function loadSessions() {
    var token   = localStorage.getItem('tcm-token') || getCookie('sb-access-token');
    var loadEl  = document.getElementById('sessions-loading');
    var errEl   = document.getElementById('sessions-error');
    var listEl  = document.getElementById('sessions-list');
    var emptyEl = document.getElementById('sessions-empty');

    fetch('/api/patient/sessions', {
      headers: token ? { 'Authorization': 'Bearer ' + token } : {},
    })
      .then(function (r) {
        if (r.status === 401) {
          // Redirect to login
          window.location.href = '/login';
          return null;
        }
        if (!r.ok) throw new Error('Failed to load sessions (' + r.status + ')');
        return r.json();
      })
      .then(function (data) {
        if (!data) return;
        loadEl.classList.add('hidden');
        renderHealthOverview(data.sessions || []); // raw = newest-first
        var sessions = (data.sessions || []).slice().reverse(); // newest first
        if (!sessions.length) {
          emptyEl.classList.remove('hidden');
          return;
        }
        listEl.classList.remove('hidden');
        listEl.innerHTML = '';
        sessions.forEach(function (session) {
          listEl.appendChild(buildSessionCard(session));
        });
      })
      .catch(function (err) {
        loadEl.classList.add('hidden');
        errEl.textContent = 'Could not load sessions: ' + err.message;
        errEl.classList.remove('hidden');
      });
  }

  /* ------------------------------------------------------------------ */
  /*  Session Card                                                        */
  /* ------------------------------------------------------------------ */
  function buildSessionCard(session) {
    var card = document.createElement('div');
    card.className = 'session-card';

    var date = formatDate(session.created_at);
    var constitution = ((session.full_report || {}).constitution || {}).type
      || session.constitution
      || '—';
    var symptoms = session.symptoms || '';

    card.innerHTML = '<div class="session-header">'
      + '<div>'
      +   '<div class="session-date">' + escHtml(date) + '</div>'
      +   '<span class="session-constitution">' + escHtml(constitution) + '</span>'
      +   (symptoms ? '<div class="session-symptoms">' + escHtml(symptoms.slice(0, 80)) + '</div>' : '')
      + '</div>'
      + '<span class="session-expand-icon">▼</span>'
      + '</div>'
      + '<div class="session-detail"></div>';

    // Toggle expand
    card.addEventListener('click', function () {
      var isExpanded = card.classList.toggle('expanded');
      var detail = card.querySelector('.session-detail');
      if (isExpanded && !detail.dataset.rendered) {
        detail.innerHTML = renderFullReport(session.full_report);
        detail.dataset.rendered = '1';
        // Print / Save-PDF action — a clean document a patient can bring to a clinic.
        var actions = document.createElement('div');
        actions.className = 'session-actions';
        actions.style.cssText = 'margin-top:.75rem;padding-top:.75rem;border-top:1px solid var(--color-border);text-align:right';
        var printBtn = document.createElement('button');
        printBtn.type = 'button';
        printBtn.className = 'btn btn-ghost btn-sm';
        printBtn.textContent = '🖨 Print / Save PDF 打印·存为 PDF';
        printBtn.addEventListener('click', function (e) {
          e.stopPropagation(); // don't collapse the card
          printReport(session);
        });
        actions.appendChild(printBtn);
        detail.appendChild(actions);
        // Animate bars
        requestAnimationFrame(function () {
          detail.querySelectorAll('.element-bar-fill[data-target]').forEach(function (bar) {
            bar.style.width = bar.dataset.target;
          });
        });
      }
    });

    return card;
  }

  /* ------------------------------------------------------------------ */
  /*  Full Report Renderer (mirrors wizard.js but inline)                 */
  /* ------------------------------------------------------------------ */
  function renderFullReport(report) {
    if (!report) return '<p class="text-muted" style="font-size:.85rem">No report data available.</p>';

    var html = '';

    // Constitution
    var c = report.constitution || {};
    if (c.type) {
      html += '<div class="constitution-card" style="margin-bottom:1rem">'
        + '<div class="constitution-type">' + escHtml(c.type) + '</div>'
        + '<p class="constitution-desc">' + escHtml(c.description || '') + '</p>'
        + '</div>';
    }

    // Five elements
    var scores = ((report.analysis || {}).five_elements || {}).scores || {};
    var elements = [
      { key: 'liver',  label: 'Liver 肝',  cls: 'liver'  },
      { key: 'heart',  label: 'Heart 心',  cls: 'heart'  },
      { key: 'spleen', label: 'Spleen 脾', cls: 'spleen' },
      { key: 'lung',   label: 'Lung 肺',   cls: 'lung'   },
      { key: 'kidney', label: 'Kidney 肾', cls: 'kidney' },
    ];
    var hasScores = elements.some(function (el) { return typeof scores[el.key] === 'number'; });
    if (hasScores) {
      html += '<div style="margin-bottom:1rem"><strong style="font-size:.85rem;color:var(--emerald-800)">Five Elements 五行</strong><div class="five-elements" style="margin-top:.5rem">';
      elements.forEach(function (el) {
        var val = typeof scores[el.key] === 'number' ? scores[el.key] : 50;
        html += '<div class="element-row">'
          + '<div class="element-label">' + el.label + '</div>'
          + '<div class="element-bar-track"><div class="element-bar-fill ' + el.cls + '" style="width:0%" data-target="' + val + '%"></div></div>'
          + '<div class="element-score">' + val + '</div>'
          + '</div>';
      });
      html += '</div></div>';
    }

    // Diagnosis
    var diag = report.diagnosis || {};
    if (diag.primary_pattern) {
      var p = diag.primary_pattern;
      var pName = typeof p === 'string' ? p : (p.name || p.pattern || '');
      var pDesc = typeof p === 'object' ? (p.description || p.symptoms || '') : '';
      html += '<div class="diagnosis-item" style="margin-bottom:.75rem">'
        + '<h4 style="font-size:.85rem">Primary Pattern: ' + escHtml(pName) + '</h4>'
        + (pDesc ? '<p style="font-size:.8rem">' + escHtml(String(pDesc)) + '</p>' : '')
        + '</div>';
    }

    // Analysis summary
    var analysis = report.analysis || {};
    if (analysis.summary || report.patient_summary) {
      html += '<p style="font-size:.83rem;color:var(--stone-600);margin-bottom:.75rem;line-height:1.6">'
        + escHtml(analysis.summary || report.patient_summary)
        + '</p>';
    }

    // Key findings (object with from_inquiry/from_visual/from_pulse)
    var kf = (report.analysis || {}).key_findings;
    if (kf && typeof kf === 'object' && !Array.isArray(kf)) {
      [['from_inquiry', '问诊'], ['from_visual', '望诊'], ['from_pulse', '切诊']].forEach(function (p) {
        if (kf[p[0]]) html += '<div style="font-size:.8rem;margin-bottom:.3rem;color:var(--stone-600)"><strong>' + p[1] + ':</strong> ' + escHtml(String(kf[p[0]])) + '</div>';
      });
    }

    // Recommendations — matches the doctor_final schema (food_therapy/acupoints/…)
    var rec = report.recommendations || {};
    var ft = rec.food_therapy || {};
    var recRows = [
      { icon: '🥗', label: 'Beneficial Foods 宜食', items: (ft.beneficial && ft.beneficial.length) ? ft.beneficial : rec.food },
      { icon: '🚫', label: 'Foods to Avoid 忌口', items: (ft.avoid && ft.avoid.length) ? ft.avoid : rec.foods_to_avoid },
      { icon: '🧘', label: 'Lifestyle 生活', items: rec.lifestyle },
      { icon: '📍', label: 'Acupoints 穴位', items: rec.acupoints },
      { icon: '🏃', label: 'Exercise 运动', items: rec.exercise },
    ];
    recRows.forEach(function (row) {
      var items = Array.isArray(row.items) ? row.items : [];
      if (!items.length) return;
      html += '<div style="margin-bottom:.4rem;font-size:.82rem"><strong>' + row.icon + ' ' + row.label + ':</strong> '
        + items.slice(0, 3).map(function (i) { return escHtml(String(i)); }).join(' · ')
        + (items.length > 3 ? ' …' : '') + '</div>';
    });
    if (Array.isArray(rec.herbal_formulas) && rec.herbal_formulas.length) {
      var names = rec.herbal_formulas.map(function (f) { return escHtml(typeof f === 'string' ? f : (f.name || '')); }).filter(Boolean);
      if (names.length) html += '<div style="margin-bottom:.4rem;font-size:.82rem"><strong>🌿 Herbal Formulas 方剂:</strong> ' + names.join(' · ') + '</div>';
    }

    // Disclaimer
    if (report.disclaimer) {
      html += '<p style="font-size:.75rem;color:var(--color-muted);margin-top:.75rem;padding-top:.75rem;border-top:1px solid var(--color-border)">'
        + escHtml(report.disclaimer) + '</p>';
    }

    return html;
  }

  /* ------------------------------------------------------------------ */
  /*  Print / Save-PDF — clean, document-style report for a real clinic   */
  /* ------------------------------------------------------------------ */
  var PRINT_CSS = [
    '*{box-sizing:border-box}',
    'body{font-family:-apple-system,Segoe UI,Roboto,"Noto Sans SC","Microsoft YaHei",sans-serif;color:#1c1917;margin:0;padding:32px 40px;line-height:1.55;font-size:13px}',
    '.rpt-head{border-bottom:3px solid #047857;padding-bottom:10px;margin-bottom:14px}',
    '.brand{font-size:22px;font-weight:800;color:#047857}',
    '.sub{font-size:12px;color:#57534e;margin-top:2px}',
    '.meta{background:#f5f5f4;border:1px solid #e7e5e4;border-radius:8px;padding:10px 14px;margin-bottom:16px;font-size:12px}',
    '.meta div{margin:2px 0}',
    '.sec{margin-bottom:16px;page-break-inside:avoid}',
    '.sec h2{font-size:14px;color:#065f46;border-left:4px solid #10b981;padding-left:8px;margin:0 0 6px}',
    '.sec p{margin:.25rem 0}',
    '.lead{font-weight:700;font-size:15px;color:#0f172a}',
    '.tbl{width:100%;border-collapse:collapse;margin:.25rem 0}',
    '.tbl th{text-align:left;width:34%;padding:5px 8px;background:#ecfdf5;border:1px solid #d1fae5;font-weight:600;vertical-align:top}',
    '.tbl td{padding:5px 8px;border:1px solid #d1fae5;vertical-align:top}',
    '.disclaimer{margin-top:20px;padding-top:10px;border-top:1px solid #e7e5e4;font-size:10.5px;color:#78716c}',
    '.rpt-foot{margin-top:8px;font-size:10.5px;color:#a8a29e;text-align:center}',
    '@media print{body{padding:0}@page{margin:16mm}}',
  ].join('');

  function printReport(session) {
    var w = window.open('', '_blank', 'width=820,height=1000');
    if (!w) { alert('Please allow pop-ups to print or save your report.'); return; }
    w.document.open();
    w.document.write(buildPrintHtml(session));
    w.document.close();
    w.focus();
    // Let the new document lay out, then open the print dialog (Save-as-PDF lives there).
    setTimeout(function () { try { w.print(); } catch (e) { /* user can print manually */ } }, 350);
  }

  function buildPrintHtml(session) {
    var r = session.full_report || {};
    var when = formatDate(session.created_at);
    var c = r.constitution || {};
    var diag = r.diagnosis || {};
    var analysis = r.analysis || {};
    var rec = r.recommendations || {};
    var parts = [];

    function section(title, inner) { return '<section class="sec"><h2>' + esc(title) + '</h2>' + inner + '</section>'; }
    function esc(s) { return escHtml(s == null ? '' : s); }

    if (c.type) {
      parts.push(section('Constitution 体质',
        '<p class="lead">' + esc(c.type) + '</p>' + (c.description ? '<p>' + esc(c.description) + '</p>' : '')));
    }

    var scores = (analysis.five_elements || {}).scores || {};
    var elMap = [['liver', 'Liver 肝'], ['heart', 'Heart 心'], ['spleen', 'Spleen 脾'], ['lung', 'Lung 肺'], ['kidney', 'Kidney 肾']];
    if (elMap.some(function (e) { return typeof scores[e[0]] === 'number'; })) {
      var eRows = elMap.map(function (e) {
        var v = typeof scores[e[0]] === 'number' ? scores[e[0]] : '—';
        return '<tr><th>' + e[1] + '</th><td>' + v + '</td></tr>';
      }).join('');
      parts.push(section('Five Elements 五行', '<table class="tbl">' + eRows + '</table>'));
    }

    if (diag.primary_pattern) {
      var p = diag.primary_pattern;
      var pName = typeof p === 'string' ? p : (p.name || p.pattern || '');
      var pDesc = typeof p === 'object' ? (p.description || p.symptoms || '') : '';
      var dBody = '<p class="lead">' + esc(pName) + '</p>' + (pDesc ? '<p>' + esc(String(pDesc)) + '</p>' : '');
      var sec = diag.secondary_patterns || diag.secondary;
      if (Array.isArray(sec) && sec.length) {
        dBody += '<p><strong>Secondary 次证:</strong> ' + sec.map(function (x) { return esc(typeof x === 'string' ? x : (x.name || x.pattern || '')); }).filter(Boolean).join(' · ') + '</p>';
      }
      parts.push(section('Diagnosis 辨证', dBody));
    }

    if (analysis.summary || r.patient_summary) {
      parts.push(section('Summary 总结', '<p>' + esc(analysis.summary || r.patient_summary) + '</p>'));
    }

    var kf = analysis.key_findings;
    if (kf && typeof kf === 'object' && !Array.isArray(kf)) {
      var kfRows = [['from_inquiry', '问诊 Inquiry'], ['from_visual', '望诊 Visual'], ['from_pulse', '切诊 Pulse']]
        .filter(function (k) { return kf[k[0]]; })
        .map(function (k) { return '<tr><th>' + k[1] + '</th><td>' + esc(String(kf[k[0]])) + '</td></tr>'; }).join('');
      if (kfRows) parts.push(section('Key Findings 四诊要点', '<table class="tbl">' + kfRows + '</table>'));
    }

    var ft = rec.food_therapy || {};
    var recBlocks = [];
    var addRec = function (label, items) {
      var arr = Array.isArray(items) ? items.filter(Boolean) : [];
      if (arr.length) recBlocks.push('<p><strong>' + label + ':</strong> ' + arr.map(function (i) { return esc(String(i)); }).join(' · ') + '</p>');
    };
    addRec('🥗 Beneficial Foods 宜食', (ft.beneficial && ft.beneficial.length) ? ft.beneficial : rec.food);
    addRec('🚫 Foods to Avoid 忌口', (ft.avoid && ft.avoid.length) ? ft.avoid : rec.foods_to_avoid);
    addRec('🧘 Lifestyle 生活', rec.lifestyle);
    addRec('📍 Acupoints 穴位', rec.acupoints);
    addRec('🏃 Exercise 运动', rec.exercise);
    if (Array.isArray(rec.herbal_formulas) && rec.herbal_formulas.length) {
      var hf = rec.herbal_formulas.map(function (f) {
        if (typeof f === 'string') return esc(f);
        var n = f.name || '';
        var ing = f.ingredients ? ' (' + (Array.isArray(f.ingredients) ? f.ingredients.join(', ') : f.ingredients) + ')' : '';
        return esc(n + ing);
      }).filter(Boolean);
      if (hf.length) recBlocks.push('<p><strong>🌿 Herbal Formulas 方剂:</strong> ' + hf.join('; ') + '</p>');
    }
    if (recBlocks.length) parts.push(section('Recommendations 调理建议', recBlocks.join('')));

    var disclaimer = r.disclaimer || 'This report is generated by an AI-assisted TCM system for educational and wellness reference only. It is not a medical diagnosis. Please consult a licensed practitioner before acting on any recommendation.';

    var meta = ['Assessment date 评估日期: ' + esc(when)];
    if (c.type) meta.push('Constitution 体质: ' + esc(c.type));
    if (session.symptoms) meta.push('Chief complaint 主诉: ' + esc(String(session.symptoms).slice(0, 120)));

    return '<!doctype html><html lang="en"><head><meta charset="utf-8">'
      + '<title>Sihat TCM Report — ' + esc(when) + '</title>'
      + '<style>' + PRINT_CSS + '</style></head><body>'
      + '<header class="rpt-head"><div class="brand">🌿 Sihat TCM</div>'
      + '<div class="sub">Traditional Chinese Medicine Assessment Report · 四诊合参报告</div></header>'
      + '<div class="meta">' + meta.map(function (m) { return '<div>' + m + '</div>'; }).join('') + '</div>'
      + (parts.length ? parts.join('') : '<p>No report data available.</p>')
      + '<div class="disclaimer">' + esc(disclaimer) + '</div>'
      + '<footer class="rpt-foot">Generated by Sihat TCM · tcm.wenjyue.com</footer>'
      + '</body></html>';
  }

  /* ------------------------------------------------------------------ */
  /*  Inject logout link into header nav                                  */
  /* ------------------------------------------------------------------ */
  function injectLogoutLink() {
    var navLink = document.getElementById('nav-login-link');
    if (!navLink) return;
    var token = localStorage.getItem('tcm-token') || getCookie('sb-access-token');
    if (!token) return;

    // Add a logout link next to the dashboard link
    var logoutLink = document.createElement('a');
    logoutLink.href = '#';
    logoutLink.textContent = 'Logout';
    logoutLink.style.marginLeft = '.5rem';
    logoutLink.addEventListener('click', function (e) {
      e.preventDefault();
      fetch('/api/auth/logout', { method: 'POST' }).finally(function () {
        localStorage.removeItem('tcm-token');
        localStorage.removeItem('tcm-role');
        localStorage.removeItem('tcm-user');
        window.location.href = '/login';
      });
    });
    if (navLink.parentNode) navLink.parentNode.appendChild(logoutLink);
  }

  /* ------------------------------------------------------------------ */
  /*  Utilities                                                           */
  /* ------------------------------------------------------------------ */
  function formatDate(iso) {
    if (!iso) return '—';
    try {
      var d = new Date(iso);
      return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) { return iso; }
  }

  function escHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function getCookie(n) {
    var m = document.cookie.match('(^|;)\\s*' + n + '\\s*=\\s*([^;]+)');
    return m ? m.pop() : '';
  }
})();
