/**
 * wizard.js — Sihat TCM Diagnosis Wizard
 * Vanilla JS, no dependencies. Handles all 8 steps.
 */
(function () {
  'use strict';

  /* ------------------------------------------------------------------ */
  /*  State                                                               */
  /* ------------------------------------------------------------------ */
  var STORAGE_KEY = 'tcm-wizard-state';
  var TOTAL_STEPS = 8;

  var state = {
    currentStep: 0,
    basicInfo: { name: '', age: '', gender: '', height: '', weight: '', symptoms: [] },
    chatHistory: [],
    inquirySummary: '',
    tongueObs: '',
    tongueImageDataURL: '',
    faceObs: '',
    faceImageDataURL: '',
    audioObs: '',
    audioDataURL: '',
    bpm: '',
    pulseQualities: [],
    deviceVitals: [],   // readings from a linked device (Bluetooth / synced account data): [{metric,value,unit,measured_at,device,source}]
    report: null,
  };

  // MediaRecorder state
  var mediaRecorder = null;
  var audioChunks = [];
  var recInterval = null;
  var recSeconds = 0;

  /* ------------------------------------------------------------------ */
  /*  i18n helper                                                         */
  /* ------------------------------------------------------------------ */
  // T('wiz.next', 'Next →') -> the string for the selected language (en/zh/ms) via i18n.js; the English
  // fallback keeps the wizard usable if i18n.js is missing.
  function T(key, fallback, vars) {
    if (typeof window.tcmT === 'function') return window.tcmT(key, fallback, vars);
    var s = fallback;
    if (vars) Object.keys(vars).forEach(function (k) { s = String(s).split('{' + k + '}').join(vars[k]); });
    return s;
  }

  /* ------------------------------------------------------------------ */
  /*  Persistence                                                         */
  /* ------------------------------------------------------------------ */
  function saveState() {
    try {
      // Don't persist large data URLs — just observations & text
      var slim = JSON.parse(JSON.stringify(state));
      slim.tongueImageDataURL = '';
      slim.faceImageDataURL = '';
      slim.audioDataURL = '';
      localStorage.setItem(STORAGE_KEY, JSON.stringify(slim));
    } catch (e) { /* quota exceeded — ignore */ }
  }

  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var saved = JSON.parse(raw);
        Object.assign(state, saved);
      }
    } catch (e) { /* corrupt — ignore */ }
  }

  /* ------------------------------------------------------------------ */
  /*  Init                                                                */
  /* ------------------------------------------------------------------ */
  function init() {
    loadState();
    bindSymptomChips();
    bindPulseChips();
    bindDeviceLink();
    renderStep(state.currentStep);
    document.addEventListener('tcm:langchange', function () { renderNavLabels(state.currentStep); });
    // If there's saved state beyond step 0, show wizard immediately
    if (state.currentStep > 0 || state.basicInfo.name) {
      showWizard();
      populateBasicInfoFields();
      if (state.chatHistory.length) renderChatHistory();
      if (state.tongueObs) showObservation('tongue', state.tongueObs, '');
      if (state.faceObs) showObservation('face', state.faceObs, '');
      if (state.audioObs) showObservationSimple('audio', state.audioObs);
      if (state.bpm) {
        document.getElementById('bpm-input').value = state.bpm;
        document.getElementById('bpm-display').textContent = state.bpm;
      }
      document.querySelectorAll('#pulse-quality-grid .quality-chip').forEach(function (c) {
        setChipActive(c, (state.pulseQualities || []).indexOf(c.dataset.value) !== -1);
      });
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Hero → Wizard transition                                           */
  /* ------------------------------------------------------------------ */
  window.startWizard = function () {
    showWizard();
    state.currentStep = 0;
    renderStep(0);
    startChat();
  };

  function showWizard() {
    document.getElementById('home-hero').classList.add('hidden');
    document.getElementById('home-features').classList.add('hidden');
    var wiz = document.getElementById('wizard-section');
    wiz.classList.remove('hidden');
    wiz.scrollIntoView({ behavior: 'smooth' });
  }

  /* ------------------------------------------------------------------ */
  /*  Step Rendering                                                      */
  /* ------------------------------------------------------------------ */
  function renderStep(idx) {
    // Update step panels
    var steps = document.querySelectorAll('.wizard-step');
    steps.forEach(function (el, i) {
      el.classList.toggle('active', i === idx);
    });

    // Update stepper dots
    var items = document.querySelectorAll('.step-item');
    items.forEach(function (el, i) {
      el.classList.remove('active', 'done');
      if (i === idx) el.classList.add('active');
      else if (i < idx) el.classList.add('done');
    });

    // Update dot contents (checkmark for done)
    items.forEach(function (el, i) {
      var dot = el.querySelector('.step-dot');
      if (i < idx) dot.textContent = '✓';
      else dot.textContent = String(i + 1);
    });

    // Back button
    var backBtn = document.getElementById('wiz-back-btn');
    backBtn.style.display = idx === 0 ? 'none' : '';

    // Skip button (steps 4,5 are skippable)
    var skipBtn = document.getElementById('wiz-skip-btn');
    skipBtn.style.display = (idx === 4 || idx === 5) ? '' : 'none';

    // Next button label + step counter (translated; also refreshed on tcm:langchange)
    renderNavLabels(idx);

    // Step-specific init
    if (idx === 6) renderSummary();
    if (idx === 7) {
      if (state.report) {
        // A report already exists (page reload, or Back then Next): show it. Previously only generateReport()
        // ran when there was NO report and nothing ever rendered state.report, so the "Generating…" card
        // spun forever after a refresh.
        stopReportProgress(true);
        document.getElementById('report-loading').classList.add('hidden');
        hideEl(document.getElementById('report-error'));
        renderReport(state.report);
      } else {
        generateReport();
      }
    }

    state.currentStep = idx;
    saveState();
  }

  function renderNavLabels(idx) {
    var nextBtn = document.getElementById('wiz-next-btn');
    if (nextBtn) {
      if (idx === 6) {
        nextBtn.style.display = '';
        nextBtn.textContent = T('wiz.generate', 'Generate Report →');
      } else if (idx === 7) {
        nextBtn.style.display = 'none';
      } else {
        nextBtn.style.display = '';
        nextBtn.textContent = T('wiz.next', 'Next →');
      }
    }
    var counter = document.getElementById('wiz-step-counter');
    if (counter) counter.textContent = T('wiz.stepof', 'Step {n} of {total}', { n: idx + 1, total: TOTAL_STEPS });
  }

  /* ------------------------------------------------------------------ */
  /*  Navigation                                                          */
  /* ------------------------------------------------------------------ */
  window.wizardNext = function () {
    var idx = state.currentStep;
    if (idx === 0) {
      if (!validateBasicInfo()) return;
      collectBasicInfo();
    }
    if (idx < TOTAL_STEPS - 1) renderStep(idx + 1);
  };

  window.wizardBack = function () {
    if (state.currentStep > 0) renderStep(state.currentStep - 1);
  };

  window.wizardSkip = function () {
    renderStep(state.currentStep + 1);
  };

  window.wizardReset = function () {
    if (!window.confirm('Start a new assessment? This clears all current answers and results.')) return;
    localStorage.removeItem(STORAGE_KEY);
    state = {
      currentStep: 0,
      basicInfo: { name: '', age: '', gender: '', height: '', weight: '', symptoms: [] },
      chatHistory: [],
      inquirySummary: '',
      tongueObs: '',
      tongueImageDataURL: '',
      faceObs: '',
      faceImageDataURL: '',
      audioObs: '',
      audioDataURL: '',
      bpm: '',
      pulseQualities: [],
      deviceVitals: [],
      report: null,
    };
    window.location.reload();
  };

  /* ------------------------------------------------------------------ */
  /*  Test helper — one-click fill (mirrors web mockTestData.ts)          */
  /* ------------------------------------------------------------------ */
  window.wizardFillTest = function () {
    var mock = {
      basicInfo: { name: '张伟', age: '35', gender: 'male', height: '175', weight: '72', symptoms: ['headache', 'fatigue'] },
      chatHistory: [
        { role: 'assistant', content: '您好！我看您有头痛和疲劳的症状。能详细告诉我这些症状是什么时候开始的吗？' },
        { role: 'user', content: '大约一周前开始的。头痛主要在额头部位，下午会加重。' },
        { role: 'assistant', content: '明白了。您最近的睡眠质量如何？' },
        { role: 'user', content: '不太好。我晚上会醒来2-3次，即使睡了7-8小时还是感觉很累。' },
        { role: 'assistant', content: '您还有其他症状吗，比如颈部僵硬、恶心或对光敏感？' },
        { role: 'user', content: '颈部有些紧张，但没有恶心。不过我确实感觉对亮屏幕比较敏感。' }
      ],
      inquirySummary: '患者表现为过去一周反复头痛和全身疲劳。报告称偶尔感到头晕，尤其是早上。睡眠质量差，夜间醒来2-3次。颈部紧张、畏光。无重大病史。目前服用复合维生素和欧米茄-3补充剂。血液检查在正常范围内，低密度脂蛋白（LDL）轻微升高。',
      tongueObs: '舌体略胖，舌质淡白，舌边有齿痕。苔薄白分布均匀。整体提示脾气虚弱，湿气内停。',
      faceObs: '面色略显苍白，缺乏光泽。眼下有明显黑眼圈，伴有眼袋。印堂区域略显暗淡。颧骨处微红，嘴唇颜色偏淡。整体面相提示脾胃虚弱、肝肾不足，伴有心血亏虚的征象。',
      audioObs: '声音清晰但略显底气不足。语速中等。对话中偶尔有叹气声。提示轻度气虚，与报告的疲劳症状一致。',
      bpm: '72',
      pulseQualities: ['wiry', 'slippery']
    };

    showWizard();

    state.basicInfo     = mock.basicInfo;
    state.chatHistory   = mock.chatHistory;
    state.inquirySummary = mock.inquirySummary;
    state.tongueObs     = mock.tongueObs;
    state.faceObs       = mock.faceObs;
    state.audioObs      = mock.audioObs;
    state.bpm           = mock.bpm;
    state.pulseQualities = mock.pulseQualities.slice();
    state.report        = null;
    saveState();

    // Reflect into the DOM so re-collection on the Summary step keeps values.
    populateBasicInfoFields();
    var bpmInput = document.getElementById('bpm-input');
    if (bpmInput) bpmInput.value = mock.bpm;
    var bpmDisp = document.getElementById('bpm-display');
    if (bpmDisp) bpmDisp.textContent = mock.bpm;
    document.querySelectorAll('#pulse-quality-grid .quality-chip').forEach(function (c) {
      setChipActive(c, mock.pulseQualities.indexOf(c.dataset.value) !== -1);
    });
    renderChatHistory();
    showObservation('tongue', mock.tongueObs, '');
    showObservation('face', mock.faceObs, '');
    showObservationSimple('audio', mock.audioObs);
    var audioBox = document.getElementById('audio-observation');
    if (audioBox) audioBox.classList.remove('hidden');

    // Jump straight to the summary for quick verification.
    renderStep(6);
  };

  /* ------------------------------------------------------------------ */
  /*  Step 0 — Basic Info                                                 */
  /* ------------------------------------------------------------------ */
  // Whole number within [min, max]; '' is "not given". <input min/max> is not enforced (there is no <form>), so check here.
  function numInRange(raw, min, max) {
    var s = String(raw == null ? '' : raw).trim();
    if (!/^-?\d+(\.\d+)?$/.test(s)) return false;
    var n = Number(s);
    return isFinite(n) && n >= min && n <= max;
  }

  function validateBasicInfo() {
    var nameEl = document.getElementById('bi-name');
    var ageEl  = document.getElementById('bi-age');
    var name = nameEl.value.trim();
    var age  = ageEl.value.trim();
    var errEl = document.getElementById('step0-error');
    function fail(el, key, fallback) {
      showEl(errEl, T(key, fallback), 'alert-error');
      if (el && el.focus) el.focus(); // keyboard / screen-reader users land on the field that needs fixing
      return false;
    }
    if (!name) return fail(nameEl, 'wiz.err.name', 'Please enter your name.');
    if (!age || !/^\d{1,3}$/.test(age) || Number(age) < 1 || Number(age) > 120) {
      return fail(ageEl, 'wiz.err.age', 'Please enter a valid age (1–120).');
    }
    var hEl = document.getElementById('bi-height'), wEl = document.getElementById('bi-weight');
    var h = hEl ? String(hEl.value || '').trim() : '', w = wEl ? String(wEl.value || '').trim() : '';
    if (h && !numInRange(h, 50, 250)) return fail(hEl, 'wiz.err.height', 'Height must be between 50 and 250 cm.');
    if (w && !numInRange(w, 20, 300)) return fail(wEl, 'wiz.err.weight', 'Weight must be between 20 and 300 kg.');
    hideEl(errEl);
    return true;
  }

  function collectBasicInfo() {
    state.basicInfo.name    = document.getElementById('bi-name').value.trim();
    state.basicInfo.age     = document.getElementById('bi-age').value.trim();
    state.basicInfo.gender  = document.getElementById('bi-gender').value;
    state.basicInfo.height  = document.getElementById('bi-height').value.trim();
    state.basicInfo.weight  = document.getElementById('bi-weight').value.trim();
    // symptoms collected live via chip clicks
    saveState();
  }

  function populateBasicInfoFields() {
    var bi = state.basicInfo;
    if (bi.name)   document.getElementById('bi-name').value   = bi.name;
    if (bi.age)    document.getElementById('bi-age').value    = bi.age;
    if (bi.gender) document.getElementById('bi-gender').value = bi.gender;
    if (bi.height) document.getElementById('bi-height').value = bi.height;
    if (bi.weight) document.getElementById('bi-weight').value = bi.weight;
    // re-activate chips; a CUSTOM symptom has no chip in the HTML after a reload, so re-create it
    // (otherwise it stays in state and is sent to the model but can never be un-selected)
    var chips = Array.prototype.slice.call(document.querySelectorAll('#symptom-chips .chip[data-value]'));
    var seen = {};
    chips.forEach(function (c) {
      var on = state.basicInfo.symptoms.indexOf(c.dataset.value) !== -1;
      if (on) seen[c.dataset.value] = true;
      setChipActive(c, on);
    });
    var box = document.getElementById('symptom-chips');
    (state.basicInfo.symptoms || []).forEach(function (sym) {
      if (seen[sym]) return;
      seen[sym] = true;
      if (box) box.appendChild(makeSymptomChip(sym, true));
    });
  }

  // Chips are role=checkbox elements: keep aria-checked in step with the .active class.
  function setChipActive(chip, on) {
    chip.classList.toggle('active', !!on);
    if (typeof chip.setAttribute === 'function') chip.setAttribute('aria-checked', on ? 'true' : 'false');
  }

  function makeSymptomChip(val, active) {
    var chip = document.createElement('span');
    chip.className = 'chip' + (active ? ' active' : '');
    chip.dataset.value = val;
    chip.textContent = val;
    chip.setAttribute('role', 'checkbox');
    chip.setAttribute('tabindex', '0');
    chip.setAttribute('aria-checked', active ? 'true' : 'false');
    return chip;
  }

  function toggleSymptomChip(chip) {
    var val = chip.dataset.value;
    var idx = state.basicInfo.symptoms.indexOf(val);
    var on = idx === -1;
    setChipActive(chip, on);
    if (on) state.basicInfo.symptoms.push(val);
    else state.basicInfo.symptoms.splice(idx, 1);
    saveState();
  }

  function bindSymptomChips() {
    var container = document.getElementById('symptom-chips');
    container.addEventListener('click', function (e) {
      var chip = e.target.closest('.chip[data-value]');
      if (!chip) return;
      toggleSymptomChip(chip);
    });
    // keyboard: Space / Enter toggles the focused chip
    container.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ' && e.key !== 'Spacebar') return;
      var chip = e.target.closest && e.target.closest('.chip[data-value]');
      if (!chip) return;
      e.preventDefault();
      toggleSymptomChip(chip);
    });
  }

  window.wizardAddCustomSymptom = function () {
    var inp = document.getElementById('symptom-custom-input');
    var val = inp.value.trim();
    if (!val) return;
    var container = document.getElementById('symptom-chips');
    var syms = state.basicInfo.symptoms;
    var key = val.toLowerCase();
    var already = syms.some(function (s) { return String(s).toLowerCase() === key; });
    // an existing chip with that value (preset or custom): select it instead of creating a duplicate
    var existing = Array.prototype.slice.call(document.querySelectorAll('#symptom-chips .chip[data-value]')).filter(function (c) {
      return String(c.dataset.value).toLowerCase() === key;
    })[0];
    if (existing) {
      if (!already) { syms.push(existing.dataset.value); }
      setChipActive(existing, true);
    } else if (!already) {
      container.appendChild(makeSymptomChip(val, true));
      syms.push(val);
    }
    inp.value = '';
    saveState();
  };

  // Allow Enter on custom symptom input
  document.addEventListener('DOMContentLoaded', function () {
    var inp = document.getElementById('symptom-custom-input');
    if (inp) {
      inp.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); window.wizardAddCustomSymptom(); }
      });
    }
  });

  /* ------------------------------------------------------------------ */
  /*  Step 1 — Inquiry Chat                                               */
  /* ------------------------------------------------------------------ */
  var chatExchanges = 0; // count of user messages sent
  var chatBusy = false;  // true while an assistant answer is streaming: Enter / quick-reply chips must not start a second request

  function startChat() {
    if (state.chatHistory.length > 0) {
      renderChatHistory();
      return;
    }
    var greeting = 'Hello! I am your AI TCM assistant (中医助手). I will ask you a few questions to better understand your health. To start — what is your main concern or symptom today?';
    appendChatMsg('assistant', greeting);
    state.chatHistory.push({ role: 'assistant', content: greeting });
    saveState();
  }

  function renderChatHistory() {
    var box = document.getElementById('chat-messages');
    box.innerHTML = '';
    state.chatHistory.forEach(function (m) {
      var el = createMsgEl(m.role, m.content);
      box.appendChild(el);
    });
    box.scrollTop = box.scrollHeight;
    chatExchanges = state.chatHistory.filter(function (m) { return m.role === 'user'; }).length;
    updateChatProgress();
    renderOptionChips();
    if (state.inquirySummary) {
      document.getElementById('inquiry-summary-text').textContent = state.inquirySummary;
      document.getElementById('inquiry-summary-box').classList.remove('hidden');
    }
  }

  window.wizardChatSend = function () {
    if (chatBusy) return; // keep what the user typed; it can be sent once the answer has finished
    var inp = document.getElementById('chat-input');
    var text = inp.value.trim();
    if (!text) return;
    inp.value = '';
    inp.style.height = 'auto';
    sendChatMessage(text);
  };

  // sendChatMessage is shared by the text input and the quick-reply option chips.
  function sendChatMessage(text) {
    text = (text || '').trim();
    if (!text || chatBusy) return;
    chatBusy = true;
    clearOptionChips();

    appendChatMsg('user', text);
    state.chatHistory.push({ role: 'user', content: text });
    chatExchanges++;
    updateChatProgress();
    saveState();

    // Fetch AI response (streamed)
    streamChat(text);

    // After 4+ exchanges, auto-summarise
    if (chatExchanges >= 4 && !state.inquirySummary) {
      summariseInquiry();
    }
  }

  /* ---- <OPTIONS> quick-reply parsing (mirrors web chatMessageParser.ts) ---- */
  function extractOptions(content) {
    var c = String(content || '')
      .replace(/\\</g, '<').replace(/\\>/g, '>')
      .replace(/&lt;/gi, '<').replace(/&gt;/gi, '>')
      .replace(/\\u003c/gi, '<').replace(/\\u003e/gi, '>');
    var m = c.match(/<\s*options\s*>([\s\S]*?)<\s*\/\s*options\s*>/i);
    var optionsStr = m ? m[1] : '';
    var clean = c.replace(/<\s*options\s*>[\s\S]*?<\s*\/\s*options\s*>/gi, '').trim();
    var options = optionsStr.split(',').map(function (o) { return o.trim(); }).filter(function (o) { return o; });
    return { cleanContent: clean, options: options };
  }

  function clearOptionChips() {
    var box = document.getElementById('chat-options');
    if (box) box.innerHTML = '';
  }

  // Render quick-reply chips for the LAST assistant message (auto-submit on click).
  function renderOptionChips() {
    var box = document.getElementById('chat-options');
    if (!box) return;
    box.innerHTML = '';
    if (!state.chatHistory.length) return;
    var last = state.chatHistory[state.chatHistory.length - 1];
    if (!last || last.role !== 'assistant') return;
    var opts = extractOptions(last.content).options;
    opts.forEach(function (opt) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'chat-option-chip';
      b.textContent = opt;
      b.addEventListener('click', function () { sendChatMessage(opt); });
      box.appendChild(b);
    });
  }

  // Allow Enter (Shift+Enter for newline) in chat textarea
  document.addEventListener('DOMContentLoaded', function () {
    var inp = document.getElementById('chat-input');
    if (!inp) return;
    inp.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        window.wizardChatSend();
      }
    });
    inp.addEventListener('input', function () {
      this.style.height = 'auto';
      this.style.height = Math.min(this.scrollHeight, 120) + 'px';
    });
  });

  function updateChatProgress() {
    var pct = Math.min(chatExchanges / 4 * 100, 100);
    document.getElementById('chat-progress').style.width = pct + '%';
  }

  function streamChat(userText) {
    var sendBtn = document.getElementById('chat-send-btn');
    sendBtn.disabled = true;
    chatBusy = true;

    var lang = (window.tcmLang && window.tcmLang.get()) || localStorage.getItem('tcm-lang') || 'en';
    var msgEl = appendChatMsg('assistant', '');
    msgEl.classList.add('streaming');

    fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: state.chatHistory.slice(-20),
        basicInfo: state.basicInfo,
        language: lang,
      }),
    })
      .then(function (res) {
        if (!res.ok) throw new Error('API error ' + res.status);
        if (!res.body) throw new Error('No streaming body');
        var reader = res.body.getReader();
        var decoder = new TextDecoder();
        var full = '';

        function pump() {
          return reader.read().then(function (chunk) {
            if (chunk.done) {
              msgEl.classList.remove('streaming');
              msgEl.textContent = extractOptions(full).cleanContent;
              state.chatHistory.push({ role: 'assistant', content: full });
              saveState();
              sendBtn.disabled = false;
              chatBusy = false;
              scrollChatToBottom();
              renderOptionChips();
              return;
            }
            var text = decoder.decode(chunk.value, { stream: true });
            full += text;
            msgEl.textContent = extractOptions(full).cleanContent;
            scrollChatToBottom();
            return pump();
          });
        }
        return pump();
      })
      .catch(function (err) {
        msgEl.textContent = 'Sorry, I encountered an error. Please try again. (' + err.message + ')';
        msgEl.classList.remove('streaming');
        sendBtn.disabled = false;
        chatBusy = false;
      });
  }

  function summariseInquiry() {
    var lang = (window.tcmLang && window.tcmLang.get()) || 'en';
    fetch('/api/summarize-inquiry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatHistory: state.chatHistory, basicInfo: state.basicInfo, language: lang }),
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data.summary) {
          state.inquirySummary = data.summary;
          saveState();
          document.getElementById('inquiry-summary-text').textContent = data.summary;
          document.getElementById('inquiry-summary-box').classList.remove('hidden');
        }
      })
      .catch(function () { /* silent — summary is optional */ });
  }

  function appendChatMsg(role, text) {
    var box = document.getElementById('chat-messages');
    var el = createMsgEl(role, text);
    box.appendChild(el);
    scrollChatToBottom();
    return el;
  }

  function createMsgEl(role, text) {
    var el = document.createElement('div');
    el.className = 'chat-msg ' + role;
    // Never show the raw <OPTIONS> tag — strip it from assistant messages.
    el.textContent = (role === 'assistant') ? extractOptions(text).cleanContent : text;
    return el;
  }

  function scrollChatToBottom() {
    var box = document.getElementById('chat-messages');
    box.scrollTop = box.scrollHeight;
  }

  /* ------------------------------------------------------------------ */
  /*  Steps 2 & 3 — Image Analysis (Tongue / Face)                       */
  /* ------------------------------------------------------------------ */
  window.wizardHandleImage = function (type, input) {
    var file = input.files && input.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function (e) {
      var dataURL = e.target.result;
      if (type === 'tongue') {
        state.tongueImageDataURL = dataURL;
        document.getElementById('tongue-img').src = dataURL;
        document.getElementById('tongue-preview').classList.remove('hidden');
        document.getElementById('tongue-upload-zone').classList.add('hidden');
      } else {
        state.faceImageDataURL = dataURL;
        document.getElementById('face-img').src = dataURL;
        document.getElementById('face-preview').classList.remove('hidden');
        document.getElementById('face-upload-zone').classList.add('hidden');
      }
      analyseImage(type, dataURL);
    };
    reader.readAsDataURL(file);
  };

  window.wizardClearImage = function (type) {
    if (type === 'tongue') {
      state.tongueImageDataURL = '';
      state.tongueObs = '';
      document.getElementById('tongue-preview').classList.add('hidden');
      document.getElementById('tongue-observation').classList.add('hidden');
      document.getElementById('tongue-upload-zone').classList.remove('hidden');
      document.getElementById('tongue-file').value = '';
    } else {
      state.faceImageDataURL = '';
      state.faceObs = '';
      document.getElementById('face-preview').classList.add('hidden');
      document.getElementById('face-observation').classList.add('hidden');
      document.getElementById('face-upload-zone').classList.remove('hidden');
      document.getElementById('face-file').value = '';
    }
    saveState();
  };

  function analyseImage(type, dataURL) {
    var loadingEl = document.getElementById(type + '-loading');
    var errEl     = document.getElementById(type + '-error');
    hideEl(errEl);
    loadingEl.classList.remove('hidden');

    fetch('/api/analyze-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: dataURL, type: type }),
    })
      .then(function (r) {
        if (!r.ok) throw new Error('API error ' + r.status);
        return r.json();
      })
      .then(function (data) {
        loadingEl.classList.add('hidden');
        var obs = data.observation || data.overall_observation || '';
        // confidence may arrive as 0-100 (e.g. 90) or 0-1 (e.g. 0.9).
        var confNum = typeof data.confidence === 'number' ? data.confidence : parseFloat(data.confidence);
        var conf = isNaN(confNum) ? '' : Math.round(confNum > 1 ? confNum : confNum * 100) + '%';
        if (type === 'tongue') {
          state.tongueObs = obs;
          showObservation('tongue', obs, conf);
        } else {
          state.faceObs = obs;
          showObservation('face', obs, conf);
        }
        saveState();
      })
      .catch(function (err) {
        loadingEl.classList.add('hidden');
        showEl(errEl, 'Analysis failed: ' + err.message + '. You may continue without this step.', 'alert-error');
      });
  }

  function showObservation(type, obs, conf) {
    var box     = document.getElementById(type + '-observation');
    var textarea = document.getElementById(type + '-obs-text');
    var confEl  = document.getElementById(type + '-obs-confidence');
    textarea.value = obs;
    if (confEl && conf) confEl.textContent = conf;
    box.classList.remove('hidden');

    // Sync edits back to state
    textarea.addEventListener('input', function () {
      if (type === 'tongue') state.tongueObs = this.value;
      else state.faceObs = this.value;
      saveState();
    });
  }

  function showObservationSimple(type, obs) {
    var textarea = document.getElementById(type + '-obs-text');
    var box      = document.getElementById(type + '-observation');
    if (textarea) textarea.value = obs;
    if (box) box.classList.remove('hidden');
  }

  /* ------------------------------------------------------------------ */
  /*  Step 4 — Audio Recording                                            */
  /* ------------------------------------------------------------------ */
  var isRecording = false;

  window.wizardToggleRecording = function () {
    if (!isRecording) startRecording();
    else stopRecording();
  };

  function startRecording() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      showEl(document.getElementById('audio-error'), 'Microphone not supported on this device.', 'alert-error');
      return;
    }
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(function (stream) {
        audioChunks = [];
        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.ondataavailable = function (e) { if (e.data.size > 0) audioChunks.push(e.data); };
        mediaRecorder.onstop = function () {
          var blob = new Blob(audioChunks, { type: 'audio/webm' });
          var url  = URL.createObjectURL(blob);
          var audioEl = document.getElementById('audio-preview');
          audioEl.src = url;
          audioEl.classList.remove('hidden');
          // Convert to dataURL for API
          var fr = new FileReader();
          fr.onload = function (ev) {
            state.audioDataURL = ev.target.result;
            saveState();
            analyseAudio(state.audioDataURL);
          };
          fr.readAsDataURL(blob);
          // Stop all tracks
          stream.getTracks().forEach(function (t) { t.stop(); });
        };
        mediaRecorder.start();
        isRecording = true;
        recSeconds = 0;
        document.getElementById('rec-btn').classList.add('recording');
        document.getElementById('rec-btn').textContent = '⏹';
        document.getElementById('rec-status').textContent = 'Recording… speak naturally';
        recInterval = setInterval(function () {
          recSeconds++;
          var m = Math.floor(recSeconds / 60);
          var s = recSeconds % 60;
          document.getElementById('rec-timer').textContent = m + ':' + (s < 10 ? '0' : '') + s;
          if (recSeconds >= 60) stopRecording(); // auto-stop at 60s
        }, 1000);
      })
      .catch(function (err) {
        showEl(document.getElementById('audio-error'), 'Could not access microphone: ' + err.message, 'alert-error');
      });
  }

  function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    clearInterval(recInterval);
    isRecording = false;
    document.getElementById('rec-btn').classList.remove('recording');
    document.getElementById('rec-btn').textContent = '🎙️';
    document.getElementById('rec-status').textContent = 'Recording complete';
  }

  function analyseAudio(dataURL) {
    var loadingEl = document.getElementById('audio-loading');
    var errEl     = document.getElementById('audio-error');
    hideEl(errEl);
    loadingEl.classList.remove('hidden');

    fetch('/api/analyze-audio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audio: dataURL }),
    })
      .then(function (r) {
        if (!r.ok) throw new Error('API error ' + r.status);
        return r.json();
      })
      .then(function (data) {
        loadingEl.classList.add('hidden');
        var obs = data.overall_observation || data.observation || '';
        state.audioObs = obs;
        saveState();
        showObservationSimple('audio', obs);
        document.getElementById('audio-observation').classList.remove('hidden');
        var ta = document.getElementById('audio-obs-text');
        if (ta) ta.addEventListener('input', function () { state.audioObs = this.value; saveState(); });
      })
      .catch(function (err) {
        loadingEl.classList.add('hidden');
        showEl(errEl, 'Audio analysis failed: ' + err.message, 'alert-error');
      });
  }

  /* ------------------------------------------------------------------ */
  /*  Step 5 — Pulse                                                      */
  /* ------------------------------------------------------------------ */
  function bindPulseChips() {
    var grid = document.getElementById('pulse-quality-grid');
    if (!grid) return;
    function toggle(chip) {
      var val = chip.dataset.value;
      var idx = state.pulseQualities.indexOf(val);
      setChipActive(chip, idx === -1);
      if (idx === -1) state.pulseQualities.push(val);
      else state.pulseQualities.splice(idx, 1);
      saveState();
    }
    grid.addEventListener('click', function (e) {
      var chip = e.target.closest('.quality-chip');
      if (chip) toggle(chip);
    });
    grid.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ' && e.key !== 'Spacebar') return;
      var chip = e.target.closest && e.target.closest('.quality-chip');
      if (!chip) return;
      e.preventDefault();
      toggle(chip);
    });
  }

  function collectPulse() {
    state.bpm = document.getElementById('bpm-input').value.trim();
    // pulseQualities already updated by chip clicks
    saveState();
  }

  /* ------------------------------------------------------------------ */
  /*  Step 5 - link a device (static/js/health-connect.js)                */
  /* ------------------------------------------------------------------ */
  // Web Bluetooth straps / cuffs / oximeters / thermometers fill the pulse step and the vitals that go to the AI;
  // a signed-in user can also pull the latest readings synced from Google Health, an Apple export or a Shortcut.
  var hcHandle = null;

  function hcEl(id) { return document.getElementById(id); }

  function hcStatus(msg, cls) {
    var e = hcEl('hc-status');
    if (!e) return;
    e.textContent = msg || '';
    e.className = 'hc-status' + (cls ? ' ' + cls : '');
  }

  function hcBar(frac) {
    var bar = hcEl('hc-bar'), fill = hcEl('hc-bar-fill');
    if (!bar || !fill) return;
    if (frac === null) { bar.classList.add('hidden'); fill.style.width = '0'; return; }
    bar.classList.remove('hidden');
    fill.style.width = Math.max(0, Math.min(100, Math.round(frac * 100))) + '%';
  }

  var HC_METRIC_KEYS = {
    heart_rate: 'health.m.heart_rate',
    resting_heart_rate: 'health.m.resting_heart_rate',
    hrv_rmssd: 'health.m.hrv_rmssd',
    hrv_sdnn: 'health.m.hrv_sdnn',
    spo2: 'health.m.spo2',
    systolic_bp: 'health.m.systolic_bp',
    diastolic_bp: 'health.m.diastolic_bp',
    body_temperature: 'health.m.body_temperature',
    respiratory_rate: 'health.m.respiratory_rate',
    steps: 'health.m.steps',
    weight_kg: 'health.m.weight_kg',
    sleep_hours: 'health.m.sleep_hours'
  };
  var HC_SOURCE_KEYS = {
    manual: 'health.src.manual',
    bluetooth: 'health.src.bluetooth',
    google_health: 'health.src.google_health',
    apple_export: 'health.src.apple_export',
    ingest: 'health.src.ingest'
  };
  function hcMetricLabel(m) { return HC_METRIC_KEYS[m] ? T(HC_METRIC_KEYS[m], m.replace(/_/g, ' ')) : m; }
  function hcSourceLabel(s) { return HC_SOURCE_KEYS[s] ? T(HC_SOURCE_KEYS[s], s) : (s || ''); }

  function hcFormat(v) {
    var n = Number(v.value);
    var txt = Math.abs(n) >= 100 || Math.round(n) === n ? String(Math.round(n * 10) / 10) : String(Math.round(n * 100) / 100);
    var unit = v.unit === 'degC' ? '\u00b0C' : v.unit === 'brpm' ? '/min' : (v.unit || '');
    return txt + ' ' + unit;
  }

  function addDeviceVital(r, device, source) {
    state.deviceVitals = (state.deviceVitals || []).filter(function (v) { return v.metric !== r.metric; });
    state.deviceVitals.push({ metric: r.metric, value: r.value, unit: r.unit, measured_at: r.measured_at, device: device || '', source: source || 'bluetooth' });
  }

  function renderDeviceVitals() {
    var wrap = hcEl('hc-vitals');
    if (!wrap) return;
    wrap.innerHTML = (state.deviceVitals || []).map(function (v) {
      return '<span class="hc-chip">' + escHtml(hcMetricLabel(v.metric)) + ': <b>' + escHtml(hcFormat(v)) + '</b>' + (v.device ? ' \u00b7 ' + escHtml(v.device) : '') + '</span>';
    }).join('');
  }

  // what travels to the AI (and into the saved report): numbers + where they came from, nothing else
  function compactVitals() {
    return (state.deviceVitals || []).map(function (v) {
      return { metric: v.metric, value: v.value, unit: v.unit, measured_at: v.measured_at, device: v.device || '', source: v.source || '' };
    });
  }

  function setBpmFromDevice(bpm) {
    var input = hcEl('bpm-input');
    if (!input) return;
    input.value = String(bpm);
    var disp = hcEl('bpm-display');
    if (disp) disp.textContent = String(bpm);
    state.bpm = String(bpm);
  }

  function hcSetBusy(busy) {
    document.querySelectorAll('#hc-buttons button').forEach(function (b) { b.disabled = !!busy; });
    var stop = hcEl('hc-stop');
    if (stop) stop.classList.toggle('hidden', !busy);
  }

  function hcExplainUnsupported(why) {
    var key = why === 'ios' ? 'health.bt.ios' : why === 'insecure' ? 'health.bt.insecure' : 'health.bt.noapi';
    hcStatus(T(key, 'Web Bluetooth is not available in this browser.'), 'is-error');
  }

  function startDeviceCapture(kind) {
    if (hcHandle) return;
    var HC = window.HealthConnect;
    var why = HC ? HC.notSupportedReason() : 'no-api';
    if (why) { hcExplainUnsupported(why); return; }
    hcStatus(T('health.bt.connecting', 'Choose your device in the pop-up\u2026'));
    hcBar(null);
    var token = localStorage.getItem('tcm-token') || getCookie('sb-access-token');
    var h;
    try {
      h = HC.capture(kind, {
        seconds: 30,
        onStatus: function (code, detail) {
          if (code === 'connected') hcStatus(T('health.bt.connected', 'Connected to {name}. Waiting for data\u2026', { name: detail || '' }));
          else if (code === 'reconnecting') hcStatus(T('health.bt.reconnecting', 'Connection lost - reconnecting ({n}/3)\u2026', { n: detail }), 'is-error');
        },
        onProgress: function (p) {
          if (kind !== 'heart_rate') return;
          if (p.contact === 'no-contact') { hcStatus(T('health.bt.nocontact', 'No skin contact.'), 'is-error'); return; }
          hcBar(p.elapsed / p.seconds);
          hcStatus(T('health.bt.measuring', 'Measuring\u2026 {s} s left. Keep still.', { s: Math.max(0, Math.ceil(p.seconds - p.elapsed)) }) + (p.bpm ? '  \u2764 ' + p.bpm + ' bpm' : ''));
        },
        onData: function (parsed) {
          if (kind === 'heart_rate' && parsed && parsed.bpm) { var d = hcEl('bpm-display'); if (d) d.textContent = String(parsed.bpm); }
        },
      });
    } catch (e) { hcStatus(T('health.bt.err', 'Could not use that device: {err}', { err: e.message }), 'is-error'); return; }
    hcHandle = h;
    hcSetBusy(true);
    h.promise.then(function (res) {
      res.readings.forEach(function (r) { addDeviceVital(r, res.device, 'bluetooth'); });
      if (kind === 'heart_rate' && res.summary) {
        setBpmFromDevice(res.summary.bpm);
        var msg = T('health.bt.result.hr', 'Average {bpm} bpm over {n} readings.', { bpm: res.summary.bpm, n: res.summary.n });
        if (res.summary.hrv) msg += ' ' + T('health.bt.result.hrv', 'HRV (RMSSD) {ms} ms.', { ms: res.summary.hrv.rmssd });
        hcStatus(msg, 'is-ok');
      } else {
        var bpmR = res.readings.filter(function (r) { return r.metric === 'heart_rate'; })[0];
        if (bpmR && !state.bpm) setBpmFromDevice(Math.round(bpmR.value));
        hcStatus(T('health.bt.captured', 'Captured: {what}', { what: res.readings.map(function (r) { return hcMetricLabel(r.metric) + ' ' + hcFormat(r); }).join(', ') }), 'is-ok');
      }
      renderDeviceVitals();
      saveState();
      if (token && window.HealthConnect) {
        window.HealthConnect.saveReadings(token, res.readings, res.device).then(function (saved) {
          if (saved && saved.inserted !== undefined) hcStatus(hcEl('hc-status').textContent + ' ' + T('health.bt.saved', 'Saved to your account.'), 'is-ok');
        });
      }
    }).catch(function (e) {
      if (e && e.message === 'cancelled') return;
      if (e && e.name === 'NotFoundError') hcStatus(T('health.bt.cancel', 'No device was chosen.'));
      else if (e && e.code && /^(ios|insecure|no-api)$/.test(e.code)) hcExplainUnsupported(e.code);
      else hcStatus(T('health.bt.err', 'Could not use that device: {err}', { err: (e && e.message) || String(e) }), 'is-error');
    }).then(function () {
      hcHandle = null;
      hcSetBusy(false);
      hcBar(null);
    });
  }

  // readings synced to the signed-in account (Google Health / Apple export / Shortcut / earlier Bluetooth sessions)
  var LINKED_METRICS = ['heart_rate', 'resting_heart_rate', 'hrv_rmssd', 'hrv_sdnn', 'spo2', 'systolic_bp', 'diastolic_bp', 'body_temperature', 'respiratory_rate', 'sleep_hours', 'steps'];
  var LINKED_MAX_AGE_MS = 7 * 86400000;
  function loadLinkedVitals() {
    var token = localStorage.getItem('tcm-token') || getCookie('sb-access-token');
    if (!token) { hcStatus(T('health.wiz.linked.signin', 'Sign in to use data from linked devices.'), 'is-error'); return; }
    fetch('/api/health/summary', { headers: { 'Authorization': 'Bearer ' + token } })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (d) {
        var latest = (d && d.latest) || {}, n = 0, now = Date.now();
        LINKED_METRICS.forEach(function (m) {
          var r = latest[m];
          if (!r || now - Date.parse(r.measured_at) > LINKED_MAX_AGE_MS) return;
          addDeviceVital(r, r.device || hcSourceLabel(r.source), 'linked');
          n++;
        });
        var bpm = latest.heart_rate && now - Date.parse(latest.heart_rate.measured_at) <= 86400000 ? latest.heart_rate : latest.resting_heart_rate;
        if (bpm && now - Date.parse(bpm.measured_at) <= LINKED_MAX_AGE_MS && !state.bpm) setBpmFromDevice(Math.round(bpm.value));
        renderDeviceVitals();
        saveState();
        hcStatus(n ? T('health.wiz.linked.ok', 'Loaded {n} recent readings from your linked devices.', { n: n }) : T('health.wiz.linked.none', 'No recent readings found. Link a device on your dashboard first.'), n ? 'is-ok' : '');
      })
      .catch(function (e) { hcStatus(T('health.bt.err', 'Could not use that device: {err}', { err: e.message }), 'is-error'); });
  }

  function bindDeviceLink() {
    var wrap = hcEl('hc-buttons');
    if (!wrap) return;
    wrap.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('button');
      if (!b) return;
      if (b.id === 'hc-load-linked') { loadLinkedVitals(); return; }
      if (b.dataset.hcKind) startDeviceCapture(b.dataset.hcKind);
    });
    var stop = hcEl('hc-stop');
    if (stop) stop.addEventListener('click', function () { if (hcHandle) hcHandle.stop(); });
    // say up front, in plain words, when this browser cannot do Bluetooth at all
    var why = window.HealthConnect ? window.HealthConnect.notSupportedReason() : 'no-api';
    if (why) {
      wrap.querySelectorAll('[data-hc-kind]').forEach(function (b) { b.setAttribute('aria-disabled', 'true'); b.classList.add('btn-ghost'); });
      hcExplainUnsupported(why);
    }
    renderDeviceVitals();
    document.addEventListener('tcm:langchange', renderDeviceVitals);
  }

  /* ------------------------------------------------------------------ */
  /*  Step 6 — Summary                                                    */
  /* ------------------------------------------------------------------ */
  function renderSummary() {
    collectBasicInfo();
    collectPulse();
    var bi = state.basicInfo;
    var items = [
      { label: 'Name 姓名',       value: bi.name || '—' },
      { label: 'Age / Gender',    value: [bi.age, bi.gender].filter(Boolean).join(' / ') || '—' },
      { label: 'Height / Weight', value: [bi.height ? bi.height + 'cm' : '', bi.weight ? bi.weight + 'kg' : ''].filter(Boolean).join(' / ') || '—' },
      { label: 'Symptoms 症状',   value: (bi.symptoms || []).join(', ') || '—' },
      { label: 'Inquiry 问诊',    value: state.inquirySummary || (state.chatHistory.length > 1 ? state.chatHistory.length + ' messages' : '—') },
      { label: 'Tongue 舌',       value: state.tongueObs ? state.tongueObs.slice(0, 100) + (state.tongueObs.length > 100 ? '…' : '') : '—' },
      { label: 'Face 面',         value: state.faceObs ? state.faceObs.slice(0, 100) + (state.faceObs.length > 100 ? '…' : '') : '—' },
      { label: 'Audio 闻',        value: state.audioObs ? state.audioObs.slice(0, 80) + (state.audioObs.length > 80 ? '…' : '') : 'Skipped' },
      { label: 'Pulse 切诊',      value: [state.bpm ? state.bpm + ' BPM' : '', state.pulseQualities.join(', ')].filter(Boolean).join(' · ') || 'Skipped' },
    ];
    if ((state.deviceVitals || []).length) {
      items.push({ label: T('health.wiz.dev', 'Device readings'), value: state.deviceVitals.map(function (v) { return hcMetricLabel(v.metric) + ' ' + hcFormat(v); }).join(', ') });
    }
    var grid = document.getElementById('summary-grid');
    grid.innerHTML = items.map(function (it) {
      return '<div class="summary-item"><div class="summary-item-label">' + escHtml(it.label) + '</div><div class="summary-item-value">' + escHtml(it.value) + '</div></div>';
    }).join('');
  }

  /* ------------------------------------------------------------------ */
  /*  Step 7 — Generate Report                                            */
  /* ------------------------------------------------------------------ */
  var reportAttempts = 0;
  var reportProgressTimer = null;

  // Animated progress while the report generates so the user feels it working.
  function startReportProgress() {
    var msgs = [
      'Reviewing your basic information 基本信息…',
      'Analysing inquiry responses 问诊…',
      'Interpreting tongue & face 望诊…',
      'Listening & pulse findings 闻诊 · 切诊…',
      'Differentiating TCM patterns 辨证…',
      'Formulating treatment principles 治则治法…',
      'Preparing personalised recommendations 调理建议…',
      'Finalising your report 整理报告…',
    ];
    var i = 0, pct = 8;
    var msgEl = document.getElementById('report-progress-msg');
    var fill = document.getElementById('report-progress-fill');
    if (msgEl) msgEl.textContent = msgs[0];
    if (fill) fill.style.width = pct + '%';
    clearInterval(reportProgressTimer);
    reportProgressTimer = setInterval(function () {
      i = Math.min(i + 1, msgs.length - 1);
      pct = Math.min(pct + 11 + Math.random() * 6, 92);
      if (msgEl) msgEl.textContent = msgs[i];
      if (fill) fill.style.width = pct + '%';
    }, 1700);
  }
  function stopReportProgress(complete) {
    clearInterval(reportProgressTimer);
    reportProgressTimer = null;
    var fill = document.getElementById('report-progress-fill');
    if (fill && complete) fill.style.width = '100%';
  }

  function generateReport(isRetry) {
    if (!isRetry) reportAttempts = 0;
    reportAttempts++;
    var lang = (window.tcmLang && window.tcmLang.get()) || localStorage.getItem('tcm-lang') || 'en';
    var bi = state.basicInfo;

    var payload = {
      data: {
        basic_info: {
          name: bi.name, age: bi.age, gender: bi.gender,
          height: bi.height, weight: bi.weight, symptoms: bi.symptoms,
        },
        wen_inquiry:  state.inquirySummary || '',
        wang_tongue:  state.tongueObs  || '',
        wang_face:    state.faceObs    || '',
        wen_audio:    state.audioObs   || '',
        qie: (function () {
          var q = { bpm: state.bpm || '', qualities: state.pulseQualities };
          // measured by a device, not typed in: lets the AI weigh them as objective values and name their source
          if ((state.deviceVitals || []).length) q.device_vitals = compactVitals();
          return q;
        })(),
      },
      language: lang,
    };

    document.getElementById('report-loading').classList.remove('hidden');
    document.getElementById('report-content').classList.add('hidden');
    hideEl(document.getElementById('report-error'));
    startReportProgress();

    fetch('/api/consult', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(function (res) {
        if (!res.ok) throw new Error('API error ' + res.status);
        if (!res.body) throw new Error('No streaming body');
        var reader = res.body.getReader();
        var decoder = new TextDecoder();
        var raw = '';

        function pump() {
          return reader.read().then(function (chunk) {
            if (chunk.done) {
              stopReportProgress(true);
              document.getElementById('report-loading').classList.add('hidden');
              parseAndRenderReport(raw);
              return;
            }
            raw += decoder.decode(chunk.value, { stream: true });
            return pump();
          });
        }
        return pump();
      })
      .catch(function (err) {
        stopReportProgress(false);
        document.getElementById('report-loading').classList.add('hidden');
        showEl(document.getElementById('report-error'), 'Failed to generate report: ' + err.message + '. Please try again.', 'alert-error');
      });
  }

  function parseAndRenderReport(raw) {
    // Strip markdown code fences if present
    var json = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
    var report;
    try {
      report = JSON.parse(json);
    } catch (e) {
      // The model occasionally emits invalid JSON — regenerate automatically
      // (up to 3 total attempts) before surfacing an error to the user.
      if (reportAttempts < 3) {
        generateReport(true);
        return;
      }
      showEl(document.getElementById('report-error'),
        'Could not generate a valid report after several tries. Please tap "Generate Report" again.', 'alert-error');
      return;
    }
    state.report = report;
    saveState();
    renderReport(report);
  }

  // Small helpers — the report JSON is AI-generated, so every field must be
  // defensively typed (arrays may arrive as objects/strings and vice-versa).
  function rptArr(v) { return Array.isArray(v) ? v : []; }
  function rptTxt(v) { return (v === null || v === undefined) ? '' : String(v); }
  function rptShow(id, show) { var el = document.getElementById(id); if (el) el.style.display = show ? '' : 'none'; }
  function rptLi(items) {
    return rptArr(items).map(function (i) {
      return '<li>' + escHtml(typeof i === 'string' ? i : JSON.stringify(i)) + '</li>';
    }).join('');
  }

  function renderReport(r) {
    r = r || {};

    // ---- Constitution ----
    var c = r.constitution || {};
    var cType = (typeof c === 'string') ? c : (c.type || '');
    var cDesc = (typeof c === 'object') ? (c.description || c.characteristics || '') : '';
    if (c && c.tendencies) cDesc += (cDesc ? '\n\n' : '') + 'Tendencies 倾向: ' + c.tendencies;
    document.getElementById('rpt-constitution-type').textContent = cType || '—';
    document.getElementById('rpt-constitution-desc').textContent = cDesc || '';

    // ---- Five Elements (only shown if the model returned real scores) ----
    var scores = ((r.analysis || {}).five_elements || {}).scores || null;
    if (scores && typeof scores === 'object') {
      var elements = [
        { key: 'liver',  label: 'Liver 肝',   cls: 'liver'  },
        { key: 'heart',  label: 'Heart 心',   cls: 'heart'  },
        { key: 'spleen', label: 'Spleen 脾',  cls: 'spleen' },
        { key: 'lung',   label: 'Lung 肺',    cls: 'lung'   },
        { key: 'kidney', label: 'Kidney 肾',  cls: 'kidney' },
      ];
      var feHtml = '';
      elements.forEach(function (el) {
        var val = typeof scores[el.key] === 'number' ? scores[el.key] : 50;
        feHtml += '<div class="element-row">'
          + '<div class="element-label">' + el.label + '</div>'
          + '<div class="element-bar-track"><div class="element-bar-fill ' + el.cls + '" style="width:0%" data-target="' + val + '%"></div></div>'
          + '<div class="element-score">' + val + '</div></div>';
      });
      document.getElementById('rpt-five-elements').innerHTML = feHtml;
      rptShow('rpt-five-elements-section', true);
      requestAnimationFrame(function () {
        document.querySelectorAll('.element-bar-fill[data-target]').forEach(function (bar) {
          bar.style.width = bar.dataset.target;
        });
      });
    } else {
      rptShow('rpt-five-elements-section', false);
    }

    // ---- Diagnosis ----
    var diag = r.diagnosis || {};
    if (typeof diag === 'string') diag = { primary_pattern: diag };
    var diagHtml = '';
    if (diag.primary_pattern) diagHtml += renderDiagItem('Primary Pattern 主证', diag.primary_pattern);
    rptArr(diag.secondary_patterns).forEach(function (p) { diagHtml += renderDiagItem('Secondary Pattern 兼证', p); });
    if (rptArr(diag.affected_organs).length) {
      diagHtml += '<div class="diagnosis-item"><h4>Affected Organs 受累脏腑</h4><p>' + escHtml(diag.affected_organs.join('、')) + '</p></div>';
    }
    if (diag.pathomechanism) diagHtml += '<div class="diagnosis-item"><h4>Pathomechanism 病机</h4><p>' + escHtml(rptTxt(diag.pathomechanism)) + '</p></div>';
    if (diag.disease_cause) diagHtml += '<div class="diagnosis-item"><h4>Cause 病因</h4><p>' + escHtml(rptTxt(diag.disease_cause)) + '</p></div>';
    document.getElementById('rpt-diagnosis').innerHTML = diagHtml || '<p class="text-muted">No diagnosis data returned.</p>';

    // ---- Recommendations ----
    var rec = r.recommendations || {};
    var ft = rec.food_therapy || {};
    var beneficial = rptArr(ft.beneficial).length ? ft.beneficial : rptArr(rec.food);
    var avoid = rptArr(ft.avoid).length ? ft.avoid : (rptArr(rec.foods_to_avoid).length ? rec.foods_to_avoid : rptArr(rec.avoid));
    var cats = [
      { icon: '🥗', label: 'Beneficial Foods 宜食', items: beneficial },
      { icon: '🚫', label: 'Foods to Avoid 忌口',   items: avoid },
      { icon: '🍲', label: 'Recipes 食疗方',        items: ft.recipes },
      { icon: '🧘', label: 'Lifestyle 生活',        items: rec.lifestyle },
      { icon: '📍', label: 'Acupoints 穴位',        items: rec.acupoints },
      { icon: '🏃', label: 'Exercise 运动',         items: rec.exercise },
    ];
    var recHtml = '';
    cats.forEach(function (cat) {
      var items = rptArr(cat.items);
      if (!items.length) return;
      recHtml += '<div class="rec-card"><div class="rec-card-icon">' + cat.icon + '</div><h4>' + cat.label + '</h4><ul>' + rptLi(items) + '</ul></div>';
    });
    if (rec.emotional_care) recHtml += '<div class="rec-card"><div class="rec-card-icon">💚</div><h4>Emotional Care 情志</h4><p>' + escHtml(rptTxt(rec.emotional_care)) + '</p></div>';
    if (rec.sleep_guidance) recHtml += '<div class="rec-card"><div class="rec-card-icon">😴</div><h4>Sleep 睡眠</h4><p>' + escHtml(rptTxt(rec.sleep_guidance)) + '</p></div>';
    rptArr(rec.herbal_formulas).forEach(function (f) {
      if (!f) return;
      var name = (typeof f === 'string') ? f : (f.name || 'Herbal Formula 方剂');
      var ing = (f && rptArr(f.ingredients).length)
        ? rptArr(f.ingredients).map(function (x) { return typeof x === 'string' ? x : (x.name || JSON.stringify(x)); }).join('、')
        : '';
      var body = '';
      if (ing) body += '<div style="font-size:.8rem;color:var(--stone-600)">' + escHtml(ing) + '</div>';
      if (f && f.dosage) body += '<div style="font-size:.8rem"><strong>用法 Dosage:</strong> ' + escHtml(rptTxt(f.dosage)) + '</div>';
      if (f && f.purpose) body += '<div style="font-size:.8rem"><strong>功效 Purpose:</strong> ' + escHtml(rptTxt(f.purpose)) + '</div>';
      recHtml += '<div class="rec-card"><div class="rec-card-icon">🌿</div><h4>' + escHtml(name) + '</h4>' + body + '</div>';
    });
    document.getElementById('rpt-recommendations').innerHTML = recHtml || '<p class="text-muted">No recommendations returned.</p>';

    // ---- Analysis Summary + key findings (key_findings is an OBJECT) ----
    var analysis = (typeof r.analysis === 'object' && r.analysis) ? r.analysis : {};
    var summaryText = (typeof r.analysis === 'string') ? r.analysis : (analysis.summary || r.patient_summary || '');
    document.getElementById('rpt-summary').textContent = rptTxt(summaryText).replace(/\\n/g, '\n');
    var kf = analysis.key_findings;
    var kfHtml = '';
    if (kf && typeof kf === 'object' && !Array.isArray(kf)) {
      [['from_inquiry', '问诊 Inquiry'], ['from_visual', '望诊 Visual'], ['from_pulse', '切诊 Pulse'], ['from_other', '其他 Other']].forEach(function (pair) {
        if (kf[pair[0]]) kfHtml += '<li><strong>' + pair[1] + ':</strong> ' + escHtml(rptTxt(kf[pair[0]])) + '</li>';
      });
    } else if (Array.isArray(kf)) {
      kfHtml = rptLi(kf);
    }
    if (analysis.pattern_rationale) kfHtml += '<li><strong>辨证依据 Rationale:</strong> ' + escHtml(rptTxt(analysis.pattern_rationale)) + '</li>';
    document.getElementById('rpt-key-findings').innerHTML = kfHtml;

    // ---- Treatment ----
    var tr = r.treatment || {};
    var trHtml = '';
    if (tr.therapeutic_principle) trHtml += '<div class="diagnosis-item"><h4>治则 Principle</h4><p>' + escHtml(rptTxt(tr.therapeutic_principle)) + '</p></div>';
    if (tr.treatment_method) trHtml += '<div class="diagnosis-item"><h4>治法 Method</h4><p>' + escHtml(rptTxt(tr.treatment_method)) + '</p></div>';
    document.getElementById('rpt-treatment').innerHTML = trHtml;
    rptShow('rpt-treatment-section', !!trHtml);

    // ---- Precautions ----
    var prec = r.precautions || {};
    var precHtml = '';
    if (rptArr(prec.warning_signs).length) precHtml += '<h4 style="color:#b91c1c">⚠️ Warning Signs 警示症状</h4><ul>' + rptLi(prec.warning_signs) + '</ul>';
    if (rptArr(prec.contraindications).length) precHtml += '<h4>Contraindications 禁忌</h4><ul>' + rptLi(prec.contraindications) + '</ul>';
    if (prec.special_notes) precHtml += '<p style="font-size:.85rem">' + escHtml(rptTxt(prec.special_notes)) + '</p>';
    document.getElementById('rpt-precautions').innerHTML = precHtml;
    rptShow('rpt-precautions-section', !!precHtml);

    // ---- Follow-up ----
    var fu = r.follow_up || {};
    var fuHtml = '';
    if (fu.timeline) fuHtml += '<div class="diagnosis-item"><h4>Timeline 时间</h4><p>' + escHtml(rptTxt(fu.timeline)) + '</p></div>';
    if (fu.expected_improvement) fuHtml += '<div class="diagnosis-item"><h4>Expected Improvement 预期改善</h4><p>' + escHtml(rptTxt(fu.expected_improvement)) + '</p></div>';
    if (fu.next_steps) fuHtml += '<div class="diagnosis-item"><h4>Next Steps 下一步</h4><p>' + escHtml(rptTxt(fu.next_steps)) + '</p></div>';
    document.getElementById('rpt-followup').innerHTML = fuHtml;
    rptShow('rpt-followup-section', !!fuHtml);

    // ---- Disclaimer ----
    document.getElementById('rpt-disclaimer').textContent = r.disclaimer || 'This AI assessment is for educational purposes only and is not a substitute for professional medical advice. Please consult a qualified TCM practitioner or healthcare provider before making health decisions.';

    // Show content
    document.getElementById('report-content').classList.remove('hidden');
  }

  function renderDiagItem(label, pattern) {
    var name = typeof pattern === 'string' ? pattern : (pattern.name || pattern.pattern || JSON.stringify(pattern));
    var desc = typeof pattern === 'object' ? (pattern.description || pattern.symptoms || '') : '';
    return '<div class="diagnosis-item"><h4>' + escHtml(label) + ': ' + escHtml(name) + '</h4>'
      + (desc ? '<p>' + escHtml(String(desc)) + '</p>' : '')
      + '</div>';
  }

  /* ------------------------------------------------------------------ */
  /*  Print / Save-PDF the freshly generated report                       */
  /* ------------------------------------------------------------------ */
  window.wizardPrintReport = function () {
    if (!state.report) { alert('Please generate your report first.'); return; }
    if (!window.TCMPrintReport) return;
    window.TCMPrintReport({
      full_report: state.report,
      symptoms: (state.basicInfo.symptoms || []).join(', '),
      created_at: new Date().toISOString(),
    });
  };

  /* ------------------------------------------------------------------ */
  /*  Guest tokens                                                        */
  /* ------------------------------------------------------------------ */
  // 'tcm-guest-tokens' = JSON list of every guest report token not migrated yet (auth.js migrates them all after login/signup);
  // 'tcm-guest-token' = the latest one, kept for older clients and scripts.
  function rememberGuestToken(tok) {
    var list = [];
    try { list = JSON.parse(localStorage.getItem('tcm-guest-tokens') || '[]'); } catch (e) { list = []; }
    if (!Array.isArray(list)) list = [];
    var legacy = localStorage.getItem('tcm-guest-token');
    if (legacy && list.indexOf(legacy) === -1) list.push(legacy);
    if (list.indexOf(tok) === -1) list.push(tok);
    localStorage.setItem('tcm-guest-tokens', JSON.stringify(list));
    localStorage.setItem('tcm-guest-token', tok);
  }

  /* ------------------------------------------------------------------ */
  /*  Save Session                                                        */
  /* ------------------------------------------------------------------ */
  window.wizardSaveSession = function () {
    var token = localStorage.getItem('tcm-token') || getCookie('sb-access-token');
    var statusEl = document.getElementById('rpt-save-status');
    // constitution / diagnosis may be an object ({type}, {primary_pattern}) or a plain string
    var rc = (state.report || {}).constitution, rd = (state.report || {}).diagnosis;
    var payload = {
      full_report: state.report,
      symptoms: (state.basicInfo.symptoms || []).join(', '),
      constitution: typeof rc === 'string' ? rc : ((rc || {}).type || ''),
      primary_diagnosis: typeof rd === 'string' ? rd : ((rd || {}).primary_pattern || ''),
    };
    if (state.bpm || (state.pulseQualities || []).length || (state.deviceVitals || []).length) {
      payload.pulse_data = { bpm: state.bpm || '', qualities: state.pulseQualities || [], device_vitals: compactVitals() };
    }

    if (!token) {
      // Guest: persist server-side and remember the token; it is migrated to the
      // account automatically after the user registers / signs in.
      statusEl.textContent = T('wiz.saving', 'Saving your report…');
      statusEl.style.color = 'var(--color-muted)';
      var guestPayload = JSON.parse(JSON.stringify(payload));
      guestPayload.guest_name = state.basicInfo.name || '';
      fetch('/api/guest/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(guestPayload),
      })
        .then(function (r) {
          // A non-2xx used to be treated as success ("Report saved!" + redirect) with no token stored: the report was lost silently.
          if (!r.ok) throw new Error('Save failed: ' + r.status);
          return r.json();
        })
        .then(function (d) {
          if (!d || !d.session_token) throw new Error('Save failed: no session token');
          rememberGuestToken(d.session_token);
          statusEl.textContent = T('wiz.saved.guest', 'Report saved! Create an account to keep it in your history…');
          statusEl.style.color = 'var(--emerald-700)';
          setTimeout(function () { window.location.href = '/login#signup'; }, 1400);
        })
        .catch(function () {
          statusEl.textContent = T('wiz.save.fail', 'Could not save your report. Please try again.');
          statusEl.style.color = '#dc2626';
        });
      return;
    }

    statusEl.textContent = 'Saving…';
    fetch('/api/patient/sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token,
      },
      body: JSON.stringify(payload),
    })
      .then(function (r) {
        if (!r.ok) throw new Error('Save failed: ' + r.status);
        return r.json();
      })
      .then(function () {
        statusEl.textContent = 'Saved! View in your dashboard.';
        statusEl.style.color = 'var(--emerald-700)';
      })
      .catch(function (err) {
        statusEl.textContent = 'Could not save: ' + err.message;
        statusEl.style.color = '#dc2626';
      });
  };

  /* ------------------------------------------------------------------ */
  /*  Stepper click-to-navigate (only to visited steps)                   */
  /* ------------------------------------------------------------------ */
  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.step-item').forEach(function (el) {
      el.addEventListener('click', function () {
        var target = parseInt(el.dataset.step);
        if (target <= state.currentStep) renderStep(target);
      });
    });
  });

  /* ------------------------------------------------------------------ */
  /*  Utilities                                                           */
  /* ------------------------------------------------------------------ */
  function showEl(el, msg, cls) {
    if (!el) return;
    el.textContent = msg || '';
    el.className = 'alert ' + (cls || '');
    el.classList.remove('hidden');
  }

  function hideEl(el) {
    if (el) el.classList.add('hidden');
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

  /* ------------------------------------------------------------------ */
  /*  Bootstrap                                                           */
  /* ------------------------------------------------------------------ */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
