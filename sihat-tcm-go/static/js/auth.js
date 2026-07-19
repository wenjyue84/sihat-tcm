/**
 * auth.js — Login / Signup logic for Sihat TCM
 * Vanilla JS, no dependencies.
 */
(function () {
  'use strict';

  var signupRole = 'patient';

  // authSetRole toggles the signup role (patient/doctor) + doctor-only fields.
  window.authSetRole = function (role) {
    signupRole = role === 'doctor' ? 'doctor' : 'patient';
    var pb = document.getElementById('role-patient');
    var db = document.getElementById('role-doctor');
    if (pb) pb.classList.toggle('active', signupRole === 'patient');
    if (db) db.classList.toggle('active', signupRole === 'doctor');
    var df = document.getElementById('doctor-fields');
    if (df) df.classList.toggle('hidden', signupRole !== 'doctor');
  };

  // afterAuth stores the session, migrates any pending GUEST report to the new
  // account, then redirects to the role dashboard.
  function afterAuth(data) {
    storeAuth(data);
    var role = data.role || (data.user && data.user.role) || 'patient';
    var guestToken = localStorage.getItem('tcm-guest-token');
    var go = function () { redirectByRole(role); };
    if (guestToken) {
      var token = (data.user && data.user.token) || data.token || getBearerFromCookie();
      fetch('/api/migrate-guest-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': token ? 'Bearer ' + token : '' },
        body: JSON.stringify({ sessionToken: guestToken }),
      }).finally(function () {
        localStorage.removeItem('tcm-guest-token');
        go();
      });
    } else {
      go();
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Tab switching                                                       */
  /* ------------------------------------------------------------------ */
  window.authSwitchTab = function (tab) {
    var tabs   = ['login', 'signup'];
    tabs.forEach(function (t) {
      document.getElementById('tab-' + t).classList.toggle('active', t === tab);
      document.getElementById('panel-' + t).classList.toggle('active', t === tab);
    });
    // Hide the forgot-password panel whenever a real tab is selected.
    var forgot = document.getElementById('panel-forgot');
    if (forgot) forgot.classList.remove('active');
    // Clear alerts when switching
    clearAlert('login-alert');
    clearAlert('signup-alert');
    clearAlert('forgot-alert');
  };

  /* ------------------------------------------------------------------ */
  /*  Forgot password                                                     */
  /* ------------------------------------------------------------------ */
  window.authShowForgot = function () {
    ['login', 'signup'].forEach(function (t) {
      document.getElementById('tab-' + t).classList.remove('active');
      document.getElementById('panel-' + t).classList.remove('active');
    });
    document.getElementById('panel-forgot').classList.add('active');
    clearAlert('forgot-alert');
    var pre = getValue('login-email');
    if (pre) document.getElementById('forgot-email').value = pre;
  };

  window.authSendReset = function () {
    var email   = getValue('forgot-email');
    var alertEl = document.getElementById('forgot-alert');
    if (!email) { showAlert(alertEl, 'Please enter your email.', 'alert-error'); return; }

    var btn = document.getElementById('forgot-btn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Sending…';

    var done = function (msg) {
      btn.disabled = false;
      btn.textContent = 'Send Reset Link 发送重置链接';
      // Uniform success message (server never reveals whether the email exists).
      showAlert(alertEl, msg || 'If an account exists for that email, a reset link has been sent. Please check your inbox.', 'alert-success');
    };

    fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email }),
    })
      .then(function (r) { return r.json().then(function (d) { return d; }); })
      .then(function (data) { done(data && data.message); })
      .catch(function () { done(); });
  };

  /* ------------------------------------------------------------------ */
  /*  Login                                                               */
  /* ------------------------------------------------------------------ */
  window.authLogin = function () {
    var email    = getValue('login-email');
    var password = getValue('login-password');
    var alertEl  = document.getElementById('login-alert');

    if (!email || !password) {
      showAlert(alertEl, 'Please enter your email and password.', 'alert-error');
      return;
    }

    var btn = document.getElementById('login-btn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Signing in…';
    clearAlert('login-alert');

    fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, password: password }),
    })
      .then(function (r) {
        if (!r.ok) return r.json().then(function (d) { throw new Error(d.error || 'Login failed'); });
        return r.json();
      })
      .then(function (data) {
        if (!data.success) throw new Error(data.error || 'Login failed');
        afterAuth(data);
      })
      .catch(function (err) {
        btn.disabled = false;
        btn.textContent = 'Sign In 登录';
        showAlert(alertEl, err.message, 'alert-error');
      });
  };

  /* ------------------------------------------------------------------ */
  /*  Quick test-role login (demo accounts)                               */
  /* ------------------------------------------------------------------ */
  window.authQuickLogin = function (role) {
    var email    = role + '@sihat.com';
    var password = 'password123';
    var alertEl  = document.getElementById('login-alert');
    var btns     = Array.prototype.slice.call(document.querySelectorAll('.quick-role'));
    var clicked  = document.querySelector('.quick-role[data-role="' + role + '"]');

    clearAlert('login-alert');
    btns.forEach(function (b) { b.disabled = true; });
    var original = clicked ? clicked.innerHTML : '';
    if (clicked) clicked.innerHTML = '<span class="spinner"></span> …';

    function restore() {
      btns.forEach(function (b) { b.disabled = false; });
      if (clicked) clicked.innerHTML = original;
    }

    function finish(data) {
      afterAuth(data);
    }

    // Login first; fall back to signup if the demo account isn't seeded yet.
    postJSON('/api/auth/login', { email: email, password: password })
      .then(finish)
      .catch(function () {
        var name = 'Test ' + role.charAt(0).toUpperCase() + role.slice(1);
        postJSON('/api/auth/signup', { email: email, password: password, name: name })
          .then(function (data) {
            if (data.user) finish(data);
            else throw new Error('Signup requires email confirmation');
          })
          .catch(function (err) {
            restore();
            showAlert(alertEl, 'Quick login failed: ' + err.message, 'alert-error');
          });
      });
  };

  // postJSON — POST json, resolve on {success:true}, reject with server error.
  function postJSON(url, payload) {
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(function (r) {
      return r.json().then(function (d) {
        if (!r.ok || d.success === false) {
          throw new Error(d.error || ('Request failed (' + r.status + ')'));
        }
        return d;
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /*  Sign Up                                                             */
  /* ------------------------------------------------------------------ */
  window.authSignup = function () {
    var name     = getValue('signup-name');
    var email    = getValue('signup-email');
    var password = getValue('signup-password');
    var alertEl  = document.getElementById('signup-alert');

    if (!name)  { showAlert(alertEl, 'Please enter your name.', 'alert-error'); return; }
    if (!email) { showAlert(alertEl, 'Please enter a valid email.', 'alert-error'); return; }
    if (!password || password.length < 8) {
      showAlert(alertEl, 'Password must be at least 8 characters.', 'alert-error');
      return;
    }

    var btn = document.getElementById('signup-btn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Creating account…';
    clearAlert('signup-alert');

    var payload = { email: email, password: password, name: name, role: signupRole };
    if (signupRole === 'doctor') {
      payload.specialty = getValue('signup-specialty');
      payload.bio = getValue('signup-bio');
      var yrs = getValue('signup-years');
      if (yrs) payload.yearsExperience = parseInt(yrs, 10);
    }

    fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(function (r) {
        if (!r.ok) return r.json().then(function (d) { throw new Error(d.error || 'Signup failed'); });
        return r.json();
      })
      .then(function (data) {
        if (data.success === false) throw new Error(data.error || 'Signup failed');
        // Some flows require email confirmation — handle both
        if (data.user) {
          afterAuth(data);
        } else {
          // Email confirmation required
          btn.disabled = false;
          btn.textContent = 'Create Account 创建账户';
          showAlert(alertEl,
            'Account created! Please check your email to confirm before logging in.',
            'alert-success');
        }
      })
      .catch(function (err) {
        btn.disabled = false;
        btn.textContent = 'Create Account 创建账户';
        showAlert(alertEl, err.message, 'alert-error');
      });
  };

  /* ------------------------------------------------------------------ */
  /*  Helpers                                                             */
  /* ------------------------------------------------------------------ */
  function storeAuth(data) {
    var user  = data.user  || {};
    var token = user.token || data.token || getBearerFromCookie();
    var role  = data.role  || user.role  || 'patient';
    if (token) localStorage.setItem('tcm-token', token);
    localStorage.setItem('tcm-role', role);
    localStorage.setItem('tcm-user', JSON.stringify({ id: user.id, email: user.email, role: role }));
  }

  function redirectByRole(role) {
    if (role === 'doctor') {
      window.location.href = '/doctor';
    } else {
      window.location.href = '/patient';
    }
  }

  function getValue(id) {
    var el = document.getElementById(id);
    return el ? el.value.trim() : '';
  }

  function showAlert(el, msg, cls) {
    if (!el) return;
    el.textContent = msg;
    el.className = 'alert ' + cls;
    el.classList.remove('hidden');
  }

  function clearAlert(id) {
    var el = document.getElementById(id);
    if (el) { el.className = 'alert hidden'; el.textContent = ''; }
  }

  function getBearerFromCookie() {
    var m = document.cookie.match('(^|;)\\s*sb-access-token\\s*=\\s*([^;]+)');
    return m ? m.pop() : '';
  }

  /* ------------------------------------------------------------------ */
  /*  Allow Enter to submit                                               */
  /* ------------------------------------------------------------------ */
  document.addEventListener('DOMContentLoaded', function () {
    ['login-email', 'login-password'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); window.authLogin(); }
      });
    });
    ['signup-name', 'signup-email', 'signup-password'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); window.authSignup(); }
      });
    });

    // Auto-detect tab from URL hash
    if (window.location.hash === '#signup') {
      window.authSwitchTab('signup');
    }

    // Populate the "log in as a specific doctor" dropdown.
    var docSel = document.getElementById('doctor-login-select');
    if (docSel) {
      fetch('/api/doctors')
        .then(function (r) { return r.json(); })
        .then(function (d) {
          (d.doctors || []).forEach(function (doc) {
            if (!doc.email) return;
            var o = document.createElement('option');
            o.value = doc.email;
            o.textContent = doc.full_name + (doc.specialty ? ' — ' + doc.specialty : '');
            docSel.appendChild(o);
          });
        })
        .catch(function () { /* directory optional */ });
      docSel.addEventListener('change', function () {
        if (docSel.value) window.authDoctorLogin(docSel.value);
      });
    }
  });

  // Log in as a chosen doctor (demo password) via the login-form flow.
  window.authDoctorLogin = function (email) {
    var el = document.getElementById('login-email');
    var pw = document.getElementById('login-password');
    if (el) el.value = email;
    if (pw) pw.value = 'password123';
    window.authLogin();
  };
})();
