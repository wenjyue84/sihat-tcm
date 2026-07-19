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
      'wiz.step.info': 'Info', 'wiz.step.inquiry': 'Inquiry', 'wiz.step.tongue': 'Tongue', 'wiz.step.face': 'Face',
      'wiz.step.audio': 'Audio', 'wiz.step.pulse': 'Pulse', 'wiz.step.review': 'Review', 'wiz.step.report': 'Report',
      'wiz.reset': '🔄 Reset', 'wiz.save': '💾 Save to My Account', 'wiz.print': '🖨 Print / Save PDF', 'wiz.startnew': 'Start New Assessment',
      'login.welcome': 'Welcome Back', 'login.sub': 'Sign in to view your health journey or create a new account.',
      'login.tablogin': 'Login', 'login.tabsignup': 'Sign Up', 'login.email': 'Email', 'login.password': 'Password',
      'login.forgot': 'Forgot password?', 'login.quicktitle': 'Quick Test Login', 'login.docselect': 'Or log in as a specific doctor',
      'login.registeras': 'Register as', 'login.fullname': 'Full Name', 'login.specialty': 'Specialty', 'login.bio': 'Short Bio',
      'login.years': 'Years of Experience', 'login.pwhint': 'Minimum 8 characters', 'login.forgottext': "Enter your account email and we'll send you a password reset link.",
      'pt.journey': 'Your Health Journey', 'pt.ov.assessments': 'Assessments', 'pt.ov.constitution': 'Constitution', 'pt.ov.journey': 'Journey', 'pt.ov.pattern': 'Top Pattern',
      'pt.profile': 'My Profile', 'pt.age': 'Age', 'pt.gender': 'Gender', 'pt.height': 'Height (cm)', 'pt.weight': 'Weight (kg)', 'pt.history': 'Medical History',
      'pt.saveprofile': 'Save Profile', 'pt.historytitle': 'Assessment History', 'pt.noassess': 'No assessments yet', 'pt.consult': 'Consult a Doctor',
      'pt.dietary': 'Ask about Diet & Food', 'pt.ask': 'Ask', 'pt.consultations': 'My Consultations',
      'pt.dietary.ph': 'e.g. Can I eat cold fruit? Is coffee okay for me?', 'pt.reporttitle': 'Assessment Report',
      'dr.title': 'Doctor Dashboard', 'dr.subtitle': 'Review patient AI assessments, generate tailored inquiry sets, and guide consultations.', 'dr.openwizard': 'Open Diagnosis Wizard',
      'dr.stat.total': 'Total Sessions', 'dr.stat.today': 'Today', 'dr.stat.constitution': 'Top Constitution', 'dr.stat.pending': 'Pending Reviews',
      'dr.inbox': 'Patient Requests', 'dr.tab.requests': '📋 Requests', 'dr.tab.patients': '👥 Patients', 'dr.quickactions': 'Quick Actions',
      'dr.qa.new': 'New Patient Assessment', 'dr.qa.newbtn': 'Start Wizard →', 'dr.qa.sessions': 'Patient Sessions', 'dr.qa.sessionsbtn': 'View Sessions →', 'dr.qa.inquiry': 'Generate Inquiry Set', 'dr.qa.inquirybtn': 'Generate Questions →',
      'wiz.t.info': 'Basic Information', 'wiz.t.inquiry': 'Inquiry', 'wiz.t.tongue': 'Tongue Analysis', 'wiz.t.face': 'Face Analysis', 'wiz.t.audio': 'Audio Analysis', 'wiz.t.pulse': 'Pulse Assessment', 'wiz.t.review': 'Review Summary', 'wiz.t.report': 'Your TCM Report',
      'wiz.s.info': 'Tell us a little about yourself so we can personalise your assessment.', 'wiz.s.inquiry': 'Chat with our AI TCM assistant. Answer at least 4 questions for an accurate assessment.', 'wiz.s.tongue': 'Take a clear photo of your tongue in natural light. Stick out your tongue fully.', 'wiz.s.face': 'Take a clear photo of your face without makeup. Natural lighting preferred.', 'wiz.s.audio': 'Record 10–30 seconds of normal speech or breathing. This step is optional.', 'wiz.s.pulse': 'Measure your heart rate (BPM) and select your pulse quality. This step is optional.', 'wiz.s.review': 'Check the information collected before generating your TCM report.',
      'wiz.f.symptoms': 'Main Symptoms', 'wiz.f.bpm': 'Heart Rate (BPM)', 'wiz.f.pulsequality': 'Pulse Quality',
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
      'wiz.step.info': '基本', 'wiz.step.inquiry': '问诊', 'wiz.step.tongue': '舌诊', 'wiz.step.face': '面诊',
      'wiz.step.audio': '闻诊', 'wiz.step.pulse': '切诊', 'wiz.step.review': '总结', 'wiz.step.report': '报告',
      'wiz.reset': '🔄 重新开始', 'wiz.save': '💾 保存到我的账户', 'wiz.print': '🖨 打印·存为 PDF', 'wiz.startnew': '重新开始评估',
      'login.welcome': '欢迎回来', 'login.sub': '登录以查看您的健康历程，或创建新账户。',
      'login.tablogin': '登录', 'login.tabsignup': '注册', 'login.email': '邮箱', 'login.password': '密码',
      'login.forgot': '忘记密码？', 'login.quicktitle': '测试快捷登录', 'login.docselect': '或以特定医生身份登录',
      'login.registeras': '注册身份', 'login.fullname': '姓名', 'login.specialty': '专长', 'login.bio': '简介',
      'login.years': '从业年限', 'login.pwhint': '至少 8 个字符', 'login.forgottext': '输入邮箱，我们将发送重置密码链接。',
      'pt.journey': '健康旅程', 'pt.ov.assessments': '评估', 'pt.ov.constitution': '体质', 'pt.ov.journey': '旅程', 'pt.ov.pattern': '主证',
      'pt.profile': '我的资料', 'pt.age': '年龄', 'pt.gender': '性别', 'pt.height': '身高 (cm)', 'pt.weight': '体重 (kg)', 'pt.history': '病史',
      'pt.saveprofile': '保存资料', 'pt.historytitle': '评估记录', 'pt.noassess': '暂无记录', 'pt.consult': '咨询医生',
      'pt.dietary': '食疗问答', 'pt.ask': '提问', 'pt.consultations': '我的咨询',
      'pt.dietary.ph': '例如：我能吃凉性水果吗？咖啡适合我吗？', 'pt.reporttitle': '评估报告',
      'dr.title': '医生控制台', 'dr.subtitle': '查看患者 AI 评估，生成定制问诊题，指导咨询。', 'dr.openwizard': '打开诊断向导',
      'dr.stat.total': '总诊断数', 'dr.stat.today': '今日', 'dr.stat.constitution': '最常见体质', 'dr.stat.pending': '待审阅',
      'dr.inbox': '患者请求', 'dr.tab.requests': '📋 请求', 'dr.tab.patients': '👥 患者', 'dr.quickactions': '快捷操作',
      'dr.qa.new': '新患者评估', 'dr.qa.newbtn': '开始向导 →', 'dr.qa.sessions': '患者记录', 'dr.qa.sessionsbtn': '查看记录 →', 'dr.qa.inquiry': '生成问诊题', 'dr.qa.inquirybtn': '生成问题 →',
      'wiz.t.info': '基本信息', 'wiz.t.inquiry': '问诊', 'wiz.t.tongue': '舌诊', 'wiz.t.face': '面诊', 'wiz.t.audio': '闻诊', 'wiz.t.pulse': '切诊', 'wiz.t.review': '总结回顾', 'wiz.t.report': '中医报告',
      'wiz.s.info': '简单介绍一下您自己，以便我们为您定制评估。', 'wiz.s.inquiry': '与 AI 中医助手对话。至少回答 4 个问题以获得准确评估。', 'wiz.s.tongue': '在自然光下拍摄清晰的舌头照片，请完全伸出舌头。', 'wiz.s.face': '拍摄不化妆的清晰面部照片，建议使用自然光。', 'wiz.s.audio': '录制 10–30 秒的正常说话或呼吸声。此步骤为可选。', 'wiz.s.pulse': '测量心率（BPM）并选择脉象。此步骤为可选。', 'wiz.s.review': '在生成中医报告前检查已收集的信息。',
      'wiz.f.symptoms': '主要症状', 'wiz.f.bpm': '心率 (BPM)', 'wiz.f.pulsequality': '脉质',
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
      'wiz.step.info': 'Maklumat', 'wiz.step.inquiry': 'Soal Selidik', 'wiz.step.tongue': 'Lidah', 'wiz.step.face': 'Wajah',
      'wiz.step.audio': 'Audio', 'wiz.step.pulse': 'Nadi', 'wiz.step.review': 'Semakan', 'wiz.step.report': 'Laporan',
      'wiz.reset': '🔄 Set Semula', 'wiz.save': '💾 Simpan ke Akaun Saya', 'wiz.print': '🖨 Cetak / Simpan PDF', 'wiz.startnew': 'Mula Penilaian Baharu',
      'login.welcome': 'Selamat Kembali', 'login.sub': 'Log masuk untuk melihat perjalanan kesihatan anda atau cipta akaun baharu.',
      'login.tablogin': 'Log Masuk', 'login.tabsignup': 'Daftar', 'login.email': 'E-mel', 'login.password': 'Kata Laluan',
      'login.forgot': 'Lupa kata laluan?', 'login.quicktitle': 'Log Masuk Ujian Pantas', 'login.docselect': 'Atau log masuk sebagai doktor tertentu',
      'login.registeras': 'Daftar sebagai', 'login.fullname': 'Nama Penuh', 'login.specialty': 'Kepakaran', 'login.bio': 'Bio Ringkas',
      'login.years': 'Tahun Pengalaman', 'login.pwhint': 'Minimum 8 aksara', 'login.forgottext': 'Masukkan e-mel akaun anda dan kami akan hantar pautan set semula kata laluan.',
      'pt.journey': 'Perjalanan Kesihatan Anda', 'pt.ov.assessments': 'Penilaian', 'pt.ov.constitution': 'Perlembagaan', 'pt.ov.journey': 'Perjalanan', 'pt.ov.pattern': 'Corak Utama',
      'pt.profile': 'Profil Saya', 'pt.age': 'Umur', 'pt.gender': 'Jantina', 'pt.height': 'Tinggi (cm)', 'pt.weight': 'Berat (kg)', 'pt.history': 'Sejarah Perubatan',
      'pt.saveprofile': 'Simpan Profil', 'pt.historytitle': 'Sejarah Penilaian', 'pt.noassess': 'Tiada penilaian lagi', 'pt.consult': 'Rujuk Doktor',
      'pt.dietary': 'Tanya tentang Diet & Makanan', 'pt.ask': 'Tanya', 'pt.consultations': 'Perundingan Saya',
      'pt.dietary.ph': 'cth. Bolehkah saya makan buah sejuk? Kopi sesuai untuk saya?', 'pt.reporttitle': 'Laporan Penilaian',
      'dr.title': 'Papan Pemuka Doktor', 'dr.subtitle': 'Semak penilaian AI pesakit, jana set soal selidik tersuai, dan pandu perundingan.', 'dr.openwizard': 'Buka Wizard Diagnosis',
      'dr.stat.total': 'Jumlah Sesi', 'dr.stat.today': 'Hari Ini', 'dr.stat.constitution': 'Perlembagaan Teratas', 'dr.stat.pending': 'Semakan Tertunda',
      'dr.inbox': 'Permintaan Pesakit', 'dr.tab.requests': '📋 Permintaan', 'dr.tab.patients': '👥 Pesakit', 'dr.quickactions': 'Tindakan Pantas',
      'dr.qa.new': 'Penilaian Pesakit Baharu', 'dr.qa.newbtn': 'Mula Wizard →', 'dr.qa.sessions': 'Sesi Pesakit', 'dr.qa.sessionsbtn': 'Lihat Sesi →', 'dr.qa.inquiry': 'Jana Set Soal Selidik', 'dr.qa.inquirybtn': 'Jana Soalan →',
      'wiz.t.info': 'Maklumat Asas', 'wiz.t.inquiry': 'Soal Selidik', 'wiz.t.tongue': 'Analisis Lidah', 'wiz.t.face': 'Analisis Wajah', 'wiz.t.audio': 'Analisis Audio', 'wiz.t.pulse': 'Penilaian Nadi', 'wiz.t.review': 'Ringkasan Semakan', 'wiz.t.report': 'Laporan TCM Anda',
      'wiz.s.info': 'Beritahu kami sedikit tentang diri anda supaya kami boleh memperibadikan penilaian.', 'wiz.s.inquiry': 'Berbual dengan pembantu TCM AI kami. Jawab sekurang-kurangnya 4 soalan untuk penilaian tepat.', 'wiz.s.tongue': 'Ambil foto lidah anda yang jelas dalam cahaya semula jadi. Julurkan lidah sepenuhnya.', 'wiz.s.face': 'Ambil foto wajah anda tanpa solekan. Cahaya semula jadi diutamakan.', 'wiz.s.audio': 'Rakam 10–30 saat pertuturan atau pernafasan biasa. Langkah ini pilihan.', 'wiz.s.pulse': 'Ukur kadar jantung (BPM) dan pilih kualiti nadi anda. Langkah ini pilihan.', 'wiz.s.review': 'Semak maklumat yang dikumpul sebelum menjana laporan TCM anda.',
      'wiz.f.symptoms': 'Gejala Utama', 'wiz.f.bpm': 'Kadar Jantung (BPM)', 'wiz.f.pulsequality': 'Kualiti Nadi',
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
