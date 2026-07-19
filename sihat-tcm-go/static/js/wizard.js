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
    report: null,
  };

  // MediaRecorder state
  var mediaRecorder = null;
  var audioChunks = [];
  var recInterval = null;
  var recSeconds = 0;

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
    renderStep(state.currentStep);
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

    // Next button label
    var nextBtn = document.getElementById('wiz-next-btn');
    if (idx === 6) {
      nextBtn.textContent = 'Generate Report →';
    } else if (idx === 7) {
      nextBtn.style.display = 'none';
    } else {
      nextBtn.style.display = '';
      nextBtn.textContent = 'Next →';
    }

    // Step counter
    document.getElementById('wiz-step-counter').textContent =
      'Step ' + (idx + 1) + ' of ' + TOTAL_STEPS;

    // Step-specific init
    if (idx === 6) renderSummary();
    if (idx === 7 && !state.report) generateReport();

    state.currentStep = idx;
    saveState();
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
      c.classList.toggle('active', mock.pulseQualities.indexOf(c.dataset.value) !== -1);
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
  function validateBasicInfo() {
    var name = document.getElementById('bi-name').value.trim();
    var age  = document.getElementById('bi-age').value.trim();
    var errEl = document.getElementById('step0-error');
    if (!name) {
      showEl(errEl, 'Please enter your name.', 'alert-error');
      return false;
    }
    if (!age || isNaN(parseInt(age))) {
      showEl(errEl, 'Please enter a valid age.', 'alert-error');
      return false;
    }
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
    // re-activate chips
    var chips = document.querySelectorAll('#symptom-chips .chip[data-value]');
    chips.forEach(function (c) {
      if (state.basicInfo.symptoms.indexOf(c.dataset.value) !== -1) {
        c.classList.add('active');
      }
    });
  }

  function bindSymptomChips() {
    var container = document.getElementById('symptom-chips');
    container.addEventListener('click', function (e) {
      var chip = e.target.closest('.chip[data-value]');
      if (!chip) return;
      chip.classList.toggle('active');
      var val = chip.dataset.value;
      var idx = state.basicInfo.symptoms.indexOf(val);
      if (idx === -1) state.basicInfo.symptoms.push(val);
      else state.basicInfo.symptoms.splice(idx, 1);
      saveState();
    });
  }

  window.wizardAddCustomSymptom = function () {
    var inp = document.getElementById('symptom-custom-input');
    var val = inp.value.trim();
    if (!val) return;
    var container = document.getElementById('symptom-chips');
    var chip = document.createElement('span');
    chip.className = 'chip active';
    chip.dataset.value = val;
    chip.textContent = val;
    container.appendChild(chip);
    state.basicInfo.symptoms.push(val);
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
    if (!text) return;
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
    grid.addEventListener('click', function (e) {
      var chip = e.target.closest('.quality-chip');
      if (!chip) return;
      chip.classList.toggle('active');
      var val = chip.dataset.value;
      var idx = state.pulseQualities.indexOf(val);
      if (idx === -1) state.pulseQualities.push(val);
      else state.pulseQualities.splice(idx, 1);
      saveState();
    });
  }

  function collectPulse() {
    state.bpm = document.getElementById('bpm-input').value.trim();
    // pulseQualities already updated by chip clicks
    saveState();
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
        qie: {
          bpm: state.bpm || '',
          qualities: state.pulseQualities,
        },
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
  /*  Save Session                                                        */
  /* ------------------------------------------------------------------ */
  window.wizardSaveSession = function () {
    var token = localStorage.getItem('tcm-token') || getCookie('sb-access-token');
    var statusEl = document.getElementById('rpt-save-status');
    var payload = {
      full_report: state.report,
      symptoms: (state.basicInfo.symptoms || []).join(', '),
      constitution: ((state.report || {}).constitution || {}).type || '',
      primary_diagnosis: ((state.report || {}).diagnosis || {}).primary_pattern || '',
    };

    if (!token) {
      // Guest: persist server-side and remember the token; it is migrated to the
      // account automatically after the user registers / signs in.
      statusEl.textContent = 'Saving your report…';
      statusEl.style.color = 'var(--color-muted)';
      var guestPayload = JSON.parse(JSON.stringify(payload));
      guestPayload.guest_name = state.basicInfo.name || '';
      fetch('/api/guest/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(guestPayload),
      })
        .then(function (r) { return r.json(); })
        .then(function (d) {
          if (d && d.session_token) localStorage.setItem('tcm-guest-token', d.session_token);
          statusEl.textContent = 'Report saved! Create an account to keep it in your history…';
          statusEl.style.color = 'var(--emerald-600)';
          setTimeout(function () { window.location.href = '/login#signup'; }, 1400);
        })
        .catch(function () {
          statusEl.textContent = 'Please log in to save your session.';
          setTimeout(function () { window.location.href = '/login'; }, 1500);
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
        statusEl.style.color = 'var(--emerald-600)';
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
