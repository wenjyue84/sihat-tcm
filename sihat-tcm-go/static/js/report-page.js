/**
 * report-page.js — standalone patient report view at /patient/report/{id}.
 *
 * A bookmarkable / shareable page for a single saved assessment. Fetches the
 * patient's sessions, finds the one named in the URL, and renders it inside an
 * isolated iframe (srcdoc = the exact print document from report-print.js) so
 * the report's own CSS can't leak into the app shell. Provides Print/Save-PDF
 * and a link back to the dashboard.
 */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    var host = document.getElementById('report-host');
    if (!host) return;

    var id = decodeURIComponent((location.pathname.split('/patient/report/')[1] || '').replace(/\/+$/, ''));
    // Auth is carried by the HttpOnly sb-access-token cookie (invisible to JS), so
    // don't pre-gate on a readable token — just fetch; a real 401 redirects to login.
    var token = localStorage.getItem('tcm-token') || getCookie('sb-access-token');

    fetch('/api/patient/sessions', { headers: token ? { 'Authorization': 'Bearer ' + token } : {} })
      .then(function (r) {
        if (r.status === 401) { location.href = '/login'; return null; }
        return r.ok ? r.json() : { sessions: [] };
      })
      .then(function (d) {
        if (!d) return;
        var sessions = d.sessions || [];
        var s = sessions.filter(function (x) { return String(x.id) === String(id); })[0] || (!id && sessions[0]);
        if (!s) {
          host.innerHTML = '<p class="alert alert-error">Report not found. It may have been removed, or belongs to another account.</p>'
            + '<p><a class="btn btn-ghost" href="/patient">← Back to dashboard</a></p>';
          return;
        }
        var session = { full_report: s.full_report, created_at: s.created_at, symptoms: s.symptoms };

        var frame = document.createElement('iframe');
        frame.setAttribute('title', 'TCM Assessment Report');
        frame.style.cssText = 'width:100%;border:1px solid var(--color-border,#e7e5e4);border-radius:12px;background:#fff;min-height:70vh';
        frame.srcdoc = window.TCMPrintHtml ? window.TCMPrintHtml(session) : '<p>Report renderer unavailable.</p>';
        frame.addEventListener('load', function () {
          try { frame.style.height = (frame.contentDocument.body.scrollHeight + 24) + 'px'; } catch (e) { /* keep min-height */ }
        });

        var actions = document.createElement('div');
        actions.style.cssText = 'margin-top:1rem;display:flex;gap:.5rem;flex-wrap:wrap';
        actions.innerHTML = '<button class="btn btn-primary" id="rp-print">🖨 Print / Save PDF 打印·存为 PDF</button>'
          + '<a class="btn btn-ghost" href="/patient">← Back to dashboard 返回</a>';

        host.innerHTML = '';
        host.appendChild(frame);
        host.appendChild(actions);
        var pb = document.getElementById('rp-print');
        if (pb) pb.addEventListener('click', function () { if (window.TCMPrintReport) window.TCMPrintReport(session); });
      })
      .catch(function () { host.innerHTML = '<p class="alert alert-error">Could not load the report. Please try again.</p>'; });
  });

  function getCookie(n) { var m = document.cookie.match('(^|;)\\s*' + n + '\\s*=\\s*([^;]+)'); return m ? m.pop() : ''; }
})();
