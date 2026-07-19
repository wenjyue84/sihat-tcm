/**
 * reset.js — Password reset completion page for Sihat TCM.
 * Reads the recovery token from the URL (supports both the ?token_hash=… query
 * form and the #access_token=… hash form that Supabase's default flow uses),
 * then submits the new password to /api/auth/reset-password.
 */
(function () {
  'use strict';

  // Parse params from BOTH the query string and the URL hash fragment.
  function parseParams() {
    var out = {};
    function add(qs) {
      if (!qs) return;
      qs.replace(/^[?#]/, '').split('&').forEach(function (kv) {
        if (!kv) return;
        var p = kv.split('=');
        out[decodeURIComponent(p[0])] = decodeURIComponent((p[1] || '').replace(/\+/g, ' '));
      });
    }
    add(window.location.search);
    add(window.location.hash);
    return out;
  }

  var params      = parseParams();
  var tokenHash   = params.token_hash || '';
  var accessToken = params.access_token || '';
  var errCode     = params.error || params.error_code || '';

  document.addEventListener('DOMContentLoaded', function () {
    if (errCode) {
      showAlert(params.error_description ||
        'This reset link is invalid or has expired. Please request a new one.', 'alert-error');
    } else if (!tokenHash && !accessToken) {
      showAlert('No reset token found. Please open the link from your password reset email.', 'alert-error');
    }
    ['reset-password', 'reset-password2'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); window.resetSubmit(); }
      });
    });
  });

  window.resetSubmit = function () {
    var pw  = val('reset-password');
    var pw2 = val('reset-password2');

    if (!pw || pw.length < 8) { showAlert('Password must be at least 8 characters.', 'alert-error'); return; }
    if (pw !== pw2)           { showAlert('Passwords do not match.', 'alert-error'); return; }
    if (!tokenHash && !accessToken) {
      showAlert('No reset token found. Please use the link from your email.', 'alert-error');
      return;
    }

    var btn = document.getElementById('reset-btn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Updating…';

    var payload = { password: pw };
    if (accessToken) payload.access_token = accessToken;
    else payload.token_hash = tokenHash;

    fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
      .then(function (res) {
        if (!res.ok || res.d.success === false) {
          throw new Error(res.d.error || 'Reset failed. The link may have expired.');
        }
        showAlert('Password updated! Redirecting to login…', 'alert-success');
        document.getElementById('reset-form').style.display = 'none';
        setTimeout(function () { window.location.href = '/login'; }, 1800);
      })
      .catch(function (err) {
        btn.disabled = false;
        btn.textContent = 'Update Password 更新密码';
        showAlert(err.message, 'alert-error');
      });
  };

  function val(id) { var e = document.getElementById(id); return e ? e.value.trim() : ''; }

  function showAlert(msg, cls) {
    var el = document.getElementById('reset-alert');
    if (!el) return;
    el.textContent = msg;
    el.className = 'alert ' + cls;
    el.classList.remove('hidden');
  }
})();
