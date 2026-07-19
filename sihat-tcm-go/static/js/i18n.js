/**
 * i18n.js — live UI localisation for the marketing/landing surfaces.
 *
 * Works WITH the existing header language toggle (window.tcmLang, which cycles
 * en → zh → ms and dispatches `tcm:langchange`). This script listens for that
 * event and swaps the text of any element carrying:
 *   data-i18n       → textContent
 *   data-i18n-html  → innerHTML   (for strings with <br>/<span>)
 *   data-i18n-ph    → placeholder attribute
 *
 * GRACEFUL FALLBACK: a missing key falls back to the English string, and if
 * that is missing too, to the element's ORIGINAL rendered text. So an untagged
 * or unknown element can never go blank — worst case it stays English (today's
 * behaviour). This lets us localise incrementally without ever looking broken.
 */
(function () {
  'use strict';

  var DICT = {
    en: {
      'hero.badge': 'Traditional Chinese Medicine',
      'hero.title': 'Your Health,<br><span>Understood Holistically</span>',
      'hero.sub': 'AI-powered Four Examinations (四诊合参) — combining inquiry, visual, audio, and pulse analysis for a complete TCM constitutional assessment.',
      'hero.start': 'Start Free Assessment',
      'hero.signin': 'Sign In',
      'hero.filltest': '🧪 Fill Test Data',
      'feat.inquiry.t': 'Inquiry 问诊',
      'feat.inquiry.d': 'AI-guided symptom inquiry in your language. Natural conversation covering chief complaints, lifestyle, and history.',
      'feat.visual.t': 'Visual Analysis 望诊',
      'feat.visual.d': 'Tongue and facial analysis using computer vision — detecting coating, colour, and shape patterns.',
      'feat.audio.t': 'Audio 闻诊',
      'feat.audio.d': 'Voice and breathing pattern analysis to assess energy levels and organ vitality.',
      'feat.pulse.t': 'Pulse 切诊',
      'feat.pulse.d': 'Pulse rate and quality assessment — floating, wiry, slippery, deep and more traditional pulse types.',
      'footer.disclaimer': 'For educational purposes only. Not a substitute for professional medical advice.',
    },
    zh: {
      'hero.badge': '传统中医',
      'hero.title': '您的健康，<br><span>全面理解</span>',
      'hero.sub': 'AI 驱动的四诊合参 —— 结合问诊、望诊、闻诊、切诊，提供完整的中医体质评估。',
      'hero.start': '开始免费评估',
      'hero.signin': '登录',
      'hero.filltest': '🧪 填充测试数据',
      'feat.inquiry.t': '问诊',
      'feat.inquiry.d': 'AI 引导的症状问诊，用您的语言。自然对话涵盖主诉、生活方式和病史。',
      'feat.visual.t': '望诊',
      'feat.visual.d': '运用计算机视觉进行舌象和面部分析 —— 检测舌苔、颜色和形态。',
      'feat.audio.t': '闻诊',
      'feat.audio.d': '语音和呼吸模式分析，评估能量水平与脏腑活力。',
      'feat.pulse.t': '切诊',
      'feat.pulse.d': '脉率与脉质评估 —— 浮、弦、滑、沉等传统脉象。',
      'footer.disclaimer': '仅供教育参考，不替代专业医疗建议。',
    },
    ms: {
      'hero.badge': 'Perubatan Tradisional Cina',
      'hero.title': 'Kesihatan Anda,<br><span>Difahami Secara Holistik</span>',
      'hero.sub': 'Empat Pemeriksaan berkuasa AI (四诊合参) — menggabungkan soal selidik, visual, audio dan analisis nadi untuk penilaian perlembagaan TCM yang lengkap.',
      'hero.start': 'Mula Penilaian Percuma',
      'hero.signin': 'Log Masuk',
      'hero.filltest': '🧪 Isi Data Ujian',
      'feat.inquiry.t': 'Soal Selidik 问诊',
      'feat.inquiry.d': 'Soal selidik gejala berpandukan AI dalam bahasa anda. Perbualan semula jadi meliputi aduan utama, gaya hidup dan sejarah.',
      'feat.visual.t': 'Analisis Visual 望诊',
      'feat.visual.d': 'Analisis lidah dan wajah menggunakan penglihatan komputer — mengesan salutan, warna dan bentuk.',
      'feat.audio.t': 'Audio 闻诊',
      'feat.audio.d': 'Analisis corak suara dan pernafasan untuk menilai tahap tenaga dan vitaliti organ.',
      'feat.pulse.t': 'Nadi 切诊',
      'feat.pulse.d': 'Penilaian kadar dan kualiti nadi — terapung, tegang, licin, dalam dan jenis nadi tradisional lain.',
      'footer.disclaimer': 'Untuk tujuan pendidikan sahaja. Bukan pengganti nasihat perubatan profesional.',
    },
  };

  function cur() {
    if (window.tcmLang && window.tcmLang.get) return window.tcmLang.get();
    return localStorage.getItem('tcm-lang') || 'en';
  }

  function pick(lang, key, orig) {
    var d = DICT[lang] || DICT.en;
    if (d[key] != null) return d[key];
    if (DICT.en[key] != null) return DICT.en[key];
    return orig; // never blank — keep whatever was rendered
  }

  function apply(lang) {
    lang = lang || cur();
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      if (el.dataset.i18nOrig == null) el.dataset.i18nOrig = el.textContent;
      var v = pick(lang, el.getAttribute('data-i18n'), el.dataset.i18nOrig);
      if (v != null) el.textContent = v;
    });
    document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
      if (el.dataset.i18nOrig == null) el.dataset.i18nOrig = el.innerHTML;
      var v = pick(lang, el.getAttribute('data-i18n-html'), el.dataset.i18nOrig);
      if (v != null) el.innerHTML = v;
    });
    document.querySelectorAll('[data-i18n-ph]').forEach(function (el) {
      var v = pick(lang, el.getAttribute('data-i18n-ph'), el.getAttribute('placeholder'));
      if (v != null) el.setAttribute('placeholder', v);
    });
    document.documentElement.setAttribute('lang', lang === 'zh' ? 'zh' : (lang === 'ms' ? 'ms' : 'en'));
  }

  window.tcmApplyLang = apply;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { apply(); });
  } else {
    apply();
  }
  document.addEventListener('tcm:langchange', function (e) { apply(e.detail); });
})();
