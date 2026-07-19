/**
 * report-print.js — shared "Print / Save PDF" for a TCM assessment report.
 *
 * Exposes a single global: window.TCMPrintReport(session), where
 *   session = { full_report: <doctor_final report obj>, created_at?, symptoms? }.
 *
 * Self-contained (own print CSS + escaping/date helpers) so it can be loaded on
 * the patient dashboard, the wizard (home) page, and the doctor inbox without
 * depending on any page's internals. Opens a clean, document-style report in a
 * popup and triggers the print dialog (Save-as-PDF lives there).
 */
(function () {
  'use strict';

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

  function escHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function fmtDate(iso) {
    if (!iso) return '—';
    try { return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }); }
    catch (e) { return String(iso); }
  }

  function buildPrintHtml(session) {
    session = session || {};
    var r = session.full_report || {};
    var when = fmtDate(session.created_at);
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

  window.TCMPrintReport = printReport;
})();
