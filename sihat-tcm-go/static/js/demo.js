/**
 * demo.js — behaviour of the /demo guided tour. No dependencies, no network except the quick-login POST.
 *
 *   ?autoplay=1     sections auto-advance with a progress bar and large captions (used to record the video)
 *   ?act=N          jump to act N (0 hero … 8 summary); with autoplay the tour starts there
 *   ?step=N-M       jump to one step (autoplay starts there)
 *   ?dwell=ms       base dwell per step (default 6500); extra 3000 ms per additional screenshot of a step
 *   ?lang=zh|en     language (also remembered in localStorage 'tcm-demo-lang')
 *   ?loop=1         restart instead of finishing
 *
 * Recorder hooks (stable): body[data-demo-state] = idle | playing | paused | done; window.demoTour
 * ({items, index, durations(), total(), goto(i), next(), prev(), play(), pause()}); CustomEvents
 * 'demo:step' {index,total,id,act,step,duration} and 'demo:done' on document; window.__demoDone = true at the end.
 */
(function () {
  'use strict';
  var doc = document, root = doc.documentElement, body = doc.body;
  var qs = new URLSearchParams(location.search);
  function $(s, c) { return (c || doc).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); }
  var reduce = false;
  try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { /* ignore */ }

  /* ------------------------------ language ------------------------------ */
  function lang() { return root.getAttribute('data-dlang') === 'en' ? 'en' : 'zh'; }
  function setLang(l) {
    root.setAttribute('data-dlang', l);
    root.setAttribute('lang', l === 'en' ? 'en' : 'zh-CN');
    try { localStorage.setItem('tcm-demo-lang', l); } catch (e) { /* private mode */ }
  }
  var langBtn = $('#demo-lang');
  if (langBtn) langBtn.addEventListener('click', function () { setLang(lang() === 'zh' ? 'en' : 'zh'); });

  /* ------------------------------ act nav + scroll progress ------------------------------ */
  var acts = $$('.act');
  var navLinks = $$('[data-act-link]');
  function markAct(n) {
    navLinks.forEach(function (a) { a.classList.toggle('on', a.getAttribute('data-act-link') === String(n)); });
    var on = $('.act-nav a.on');
    var nav = $('.act-nav');
    if (on && nav && nav.scrollWidth > nav.clientWidth) { try { nav.scrollTo({ left: on.offsetLeft - 40, behavior: 'auto' }); } catch (e) { /* old browsers */ } }
  }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) markAct(en.target.getAttribute('data-act')); });
    }, { rootMargin: '-40% 0px -55% 0px' });
    acts.forEach(function (a) { io.observe(a); });
  }
  var bar = $('#demo-progress'), barI = bar && $('i', bar);
  function setBar(pct, ms) {
    if (!barI) return;
    barI.style.transition = ms ? 'width ' + ms + 'ms linear' : 'width .3s ease';
    barI.style.width = pct + '%';
    bar.setAttribute('aria-valuenow', String(Math.round(pct)));
  }
  window.addEventListener('scroll', function () {
    if (tour.playing) return;
    var h = doc.documentElement.scrollHeight - window.innerHeight;
    setBar(h > 0 ? Math.min(100, (window.scrollY / h) * 100) : 0);
  }, { passive: true });

  /* ------------------------------ screenshot galleries ------------------------------ */
  function showThumb(btn) {
    var step = btn.closest('.step');
    if (!step) return;
    var fig = $('[data-main]', step);
    var img = fig && $('img', fig);
    if (!img) return;
    $$('.thumb', step).forEach(function (t) { t.classList.toggle('on', t === btn); });
    img.src = btn.getAttribute('data-src');
    var w = btn.getAttribute('data-w'), h = btn.getAttribute('data-h');
    if (w && h) { img.setAttribute('width', w); img.setAttribute('height', h); }
    fig.classList.toggle('mobile', btn.getAttribute('data-mobile') === '1');
    var cap = $('figcaption', fig);
    if (cap) {
      var z = cap.querySelector('.zh'), e = cap.querySelector('.en');
      if (z) z.textContent = btn.getAttribute('data-cap-zh') || '';
      if (e) e.textContent = btn.getAttribute('data-cap-en') || '';
    }
    img.alt = (btn.getAttribute('data-cap-zh') || '') + ' / ' + (btn.getAttribute('data-cap-en') || '');
  }
  $$('.thumb').forEach(function (b) { b.addEventListener('click', function () { showThumb(b); }); });

  /* ------------------------------ quick login (demo accounts) ------------------------------ */
  var quickMsg = $('#quick-msg');
  $$('[data-quick]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var role = btn.getAttribute('data-quick');
      $$('[data-quick]').forEach(function (b) { b.disabled = true; });
      if (quickMsg) quickMsg.textContent = '';
      fetch('/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: role + '@sihat.com', password: 'password123' })
      }).then(function (r) { return r.json().then(function (d) { if (!r.ok) throw new Error((d && d.error) || ('HTTP ' + r.status)); return d; }); })
        .then(function (d) {
          var user = d.user || {}, token = user.token || d.token, r2 = d.role || user.role || role;
          try {
            if (token) localStorage.setItem('tcm-token', token);
            localStorage.setItem('tcm-role', r2);
            localStorage.setItem('tcm-user', JSON.stringify({ id: user.id, email: user.email, role: r2 }));
          } catch (e) { /* storage blocked: the HttpOnly cookie still authenticates */ }
          location.href = r2 === 'doctor' ? '/doctor' : (r2 === 'admin' || r2 === 'developer' ? '/admin' : '/patient');
        })
        .catch(function (err) {
          $$('[data-quick]').forEach(function (b) { b.disabled = false; });
          if (quickMsg) quickMsg.textContent = (lang() === 'en' ? 'Quick login failed: ' : '快速登录失败:') + err.message;
        });
    });
  });

  /* ------------------------------ the tour (autoplay) ------------------------------ */
  var items = $$('[data-tour]');
  var tour = {
    items: items, index: -1, playing: false, done: false, timer: null, thumbTimers: [],
    dwell: Math.max(1500, parseInt(qs.get('dwell'), 10) || 6500),
    extra: 3000,
    loop: qs.get('loop') === '1'
  };
  function shotsOf(el) { return $$('.thumb', el); }
  tour.duration = function (i) { var n = Math.max(1, shotsOf(items[i]).length); return tour.dwell + (n - 1) * tour.extra; };
  tour.durations = function () { return items.map(function (_, i) { return tour.duration(i); }); };
  tour.total = function () { return tour.durations().reduce(function (a, b) { return a + b; }, 0); };

  function setState(s) { body.setAttribute('data-demo-state', s); window.__demoState = { state: s, index: tour.index, total: items.length }; }
  setState('idle');

  function capFill(el) {
    var actN = el.getAttribute('data-cap-act');
    var actEl = actN != null ? $('#act-' + actN + ' .eyebrow') : null;
    var titleEl = $('[data-cap]', el) || $('h3', el) || $('h1', el) || el;
    var seeEl = $('[data-cap-see]', el) || $('.adv-body', el) || (actN === '0' ? $('#act-0 .lede') : null);
    $('#cap-act').innerHTML = actEl ? actEl.innerHTML : '';
    $('#cap-title').innerHTML = titleEl.id === 'hero-title' || titleEl.tagName === 'H1' ? titleEl.innerHTML : titleEl.innerHTML;
    var see = seeEl ? seeEl.cloneNode(true) : null;
    if (see) { var b = see.querySelector('b'); if (b && see.hasAttribute('data-cap-see') && !see.classList.contains('adv-body')) b.remove(); }
    $('#cap-see').innerHTML = see ? see.innerHTML : '';
  }

  function clearTimers() {
    if (tour.timer) { clearTimeout(tour.timer); tour.timer = null; }
    tour.thumbTimers.forEach(clearTimeout); tour.thumbTimers = [];
  }

  /* centre the element in the part of the viewport not covered by the sticky header and the caption bar */
  function scrollFocus(el, smooth) {
    var head = $('.demo-head'), cap = $('#demo-caption');
    var hh = head ? head.offsetHeight : 0;
    var ch = cap && !cap.hidden ? cap.offsetHeight : 0;
    var r = el.getBoundingClientRect();
    var spare = Math.max(0, (window.innerHeight - hh - ch - r.height) / 2);
    window.scrollTo({ top: Math.max(0, r.top + window.scrollY - hh - spare), behavior: smooth ? 'smooth' : 'instant' });
  }

  function show(i) {
    if (i < 0) i = 0;
    clearTimers();
    items.forEach(function (it) { it.classList.remove('active'); });
    tour.index = i;
    var el = items[i];
    el.classList.add('active');
    var dur = tour.duration(i);
    var capturing = tour.playing || body.classList.contains('autoplay');
    if (capturing) { capFill(el); $('#demo-caption').hidden = false; }
    scrollFocus(el, tour.playing && !reduce);
    markAct(el.getAttribute('data-cap-act'));
    if (capturing) setBar(((i + 1) / items.length) * 100, tour.playing ? dur : 0);
    // rotate through the screenshots of a multi-image step
    var thumbs = shotsOf(el);
    if (thumbs.length > 1) {
      showThumb(thumbs[0]);
      if (tour.playing) thumbs.forEach(function (t, k) { if (k > 0) tour.thumbTimers.push(setTimeout(function () { showThumb(t); }, (dur / thumbs.length) * k)); });
    }
    var d = { index: i, total: items.length, id: el.id, act: el.getAttribute('data-cap-act'), step: el.getAttribute('data-step'), duration: dur };
    doc.dispatchEvent(new CustomEvent('demo:step', { detail: d }));
    setState(tour.playing ? 'playing' : (tour.done ? 'done' : 'paused'));
    if (tour.playing) tour.timer = setTimeout(tour.next, dur);
  }
  tour.goto = show;
  tour.next = function () {
    if (tour.index + 1 >= items.length) {
      if (tour.loop) { show(0); return; }
      tour.finish();
      return;
    }
    show(tour.index + 1);
  };
  tour.prev = function () { show(Math.max(0, tour.index - 1)); };
  tour.finish = function () {
    clearTimers();
    tour.playing = false; tour.done = true;
    setBar(100, 0);
    setState('done');
    window.__demoDone = true;
    var d = $('#demo-done'); if (d) d.hidden = false;
    doc.dispatchEvent(new CustomEvent('demo:done', { detail: { total: items.length } }));
  };
  tour.play = function (from) {
    root.classList.add('autoplay'); body.classList.add('autoplay');
    var btn = $('#demo-autoplay'); if (btn) { btn.setAttribute('aria-pressed', 'true'); }
    tour.playing = true; tour.done = false; window.__demoDone = false;
    var d = $('#demo-done'); if (d) d.hidden = true;
    show(typeof from === 'number' ? from : Math.max(0, tour.index));
  };
  tour.pause = function () { clearTimers(); tour.playing = false; setState('paused'); };
  tour.stop = function () {
    clearTimers(); tour.playing = false; tour.done = false;
    root.classList.remove('autoplay'); body.classList.remove('autoplay');
    items.forEach(function (it) { it.classList.remove('active'); });
    var c = $('#demo-caption'); if (c) c.hidden = true;
    var d = $('#demo-done'); if (d) d.hidden = true;
    var btn = $('#demo-autoplay'); if (btn) btn.setAttribute('aria-pressed', 'false');
    setBar(0, 0); setState('idle');
  };
  window.demoTour = tour;

  function indexForAct(n) {
    for (var i = 0; i < items.length; i++) if (items[i].getAttribute('data-cap-act') === String(n)) return i;
    return 0;
  }
  function indexForStep(id) { for (var i = 0; i < items.length; i++) if (items[i].id === 'step-' + id) return i; return -1; }

  var btn = $('#demo-autoplay');
  if (btn) btn.addEventListener('click', function () { if (tour.playing) tour.pause(); else if (body.classList.contains('autoplay')) tour.play(); else tour.play(0); });
  var heroBtn = $('#hero-autoplay');
  if (heroBtn) heroBtn.addEventListener('click', function (e) { e.preventDefault(); tour.play(0); });
  var doneEl = $('#demo-done');
  if (doneEl) doneEl.addEventListener('click', function () { tour.stop(); window.scrollTo(0, 0); });

  doc.addEventListener('keydown', function (e) {
    if (!body.classList.contains('autoplay')) return;
    if (e.key === ' ' || e.key === 'Spacebar') { e.preventDefault(); if (tour.playing) tour.pause(); else tour.play(); }
    else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); var p = tour.playing; tour.pause(); show(Math.min(items.length - 1, tour.index + 1)); if (p) tour.play(tour.index); }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); var p2 = tour.playing; tour.pause(); show(Math.max(0, tour.index - 1)); if (p2) tour.play(tour.index); }
    else if (e.key === 'Escape') { tour.stop(); }
  });

  /* ------------------------------ boot: ?act= ?step= ?autoplay= ------------------------------ */
  var startAct = parseInt(body.getAttribute('data-start-act'), 10) || 0;
  var stepParam = qs.get('step');
  var auto = qs.get('autoplay') === '1';
  var startIdx = 0;
  if (stepParam && indexForStep(stepParam) >= 0) startIdx = indexForStep(stepParam);
  else if (qs.get('act') != null) startIdx = indexForAct(startAct);
  var hash = location.hash && /^#step-\d+-\d+$/.test(location.hash) ? indexForStep(location.hash.slice(6)) : -1;
  if (hash >= 0 && !stepParam && qs.get('act') == null) startIdx = hash;

  function boot() {
    if (auto) { tour.play(startIdx); return; }
    if (stepParam || qs.get('act') != null || hash >= 0) {
      var target = items[startIdx];
      if (target) { try { target.scrollIntoView({ behavior: 'instant', block: 'start' }); } catch (e) { /* ignore */ } window.scrollBy({ top: -80, behavior: 'instant' }); }
    }
  }
  if (doc.readyState === 'complete') boot(); else window.addEventListener('load', boot);
})();
