/**
 * health-connect.js - direct device link for Sihat TCM over Web Bluetooth (GATT), plus the pure parsers behind it.
 *
 * WHAT WORKS (standard Bluetooth SIG health profiles, Chrome / Edge on desktop and Android; HTTPS or localhost):
 *   Heart Rate            service 0x180D  characteristic 0x2A37  (8/16-bit bpm, sensor contact, energy, RR intervals -> HRV RMSSD)
 *   Pulse Oximeter        service 0x1822  characteristics 0x2A5E (spot-check) / 0x2A5F (continuous)  IEEE-11073 SFLOAT
 *   Blood Pressure        service 0x1810  characteristic 0x2A35  (indications, SFLOAT, mmHg or kPa, pulse rate)
 *   Health Thermometer    service 0x1809  characteristic 0x2A1C  (indications, 32-bit FLOAT, degC or degF)
 *
 * WHAT DOES NOT (be honest in the UI, see notSupportedReason()):
 *   - Safari and every browser on iPhone/iPad: Apple does not ship Web Bluetooth.
 *   - Apple Watch and most Fitbit / Pixel watches: they do not expose the standard heart-rate service to a browser.
 *     Chest straps (Polar, Garmin HRM, Wahoo ...), watches with "broadcast heart rate" (Garmin, Polar, Coros, Amazfit,
 *     Huawei ...), BLE blood-pressure cuffs, oximeters and thermometers do. For the rest use the online / export channels.
 *
 * The parsers (parseHeartRate, parseSpo2, parseBloodPressure, parseTemperature, sfloat, float32, rmssd, MeasureSession)
 * are pure functions over a DataView and are unit-tested in node: regress/health-connect.test.mjs (node --test).
 * No dependencies; works as a <script> (window.HealthConnect) and as a CommonJS module.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.HealthConnect = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var SVC = { heart_rate: 0x180d, spo2: 0x1822, blood_pressure: 0x1810, thermometer: 0x1809, battery: 0x180f, device_info: 0x180a };
  var CHR = { hr: 0x2a37, spo2_spot: 0x2a5e, spo2_cont: 0x2a5f, bp: 0x2a35, temp: 0x2a1c, battery: 0x2a19, manufacturer: 0x2a29, model: 0x2a24 };
  var KPA_TO_MMHG = 7.50062;

  /* ---------------------------------------------------------------- */
  /*  IEEE-11073 floats                                                */
  /* ---------------------------------------------------------------- */
  function pow10(e) { return e >= 0 ? Math.pow(10, e) : 1 / Math.pow(10, -e); }

  /** 16-bit SFLOAT: 4-bit signed exponent, 12-bit signed mantissa. Special values (NaN, NRes, +-INF, reserved) give NaN / +-Infinity. */
  function sfloat(u16) {
    var m = u16 & 0x0fff, e = u16 >> 12;
    if (m === 0x7ff || m === 0x800 || m === 0x801) return NaN;
    if (m === 0x7fe) return Infinity;
    if (m === 0x802) return -Infinity;
    if (m >= 0x800) m -= 0x1000;
    if (e >= 8) e -= 16;
    // divide for negative exponents: 986 / 10 is exactly 98.6, 986 * 0.1 is not
    return e < 0 ? m / pow10(-e) : m * pow10(e);
  }

  /** 32-bit FLOAT: 8-bit signed exponent, 24-bit signed mantissa. */
  function float32(u32) {
    var m = u32 & 0xffffff, e = (u32 >>> 24) & 0xff;
    if (m === 0x7fffff || m === 0x800000 || m === 0x800001) return NaN;
    if (m === 0x7ffffe) return Infinity;
    if (m === 0x800002) return -Infinity;
    if (m >= 0x800000) m -= 0x1000000;
    if (e >= 128) e -= 256;
    return e < 0 ? m / pow10(-e) : m * pow10(e);
  }

  function finiteOrNull(v) { return typeof v === 'number' && isFinite(v) ? v : null; }

  /** Bluetooth date_time (7 bytes: year u16, month, day, hour, minute, second) -> Date in the browser's local zone, or null. */
  function readDateTime(dv, o) {
    if (o + 7 > dv.byteLength) return null;
    var y = dv.getUint16(o, true), mo = dv.getUint8(o + 2), d = dv.getUint8(o + 3), h = dv.getUint8(o + 4), mi = dv.getUint8(o + 5), s = dv.getUint8(o + 6);
    if (!y || !mo || !d) return null; // 0 = "not set"
    var dt = new Date(y, mo - 1, d, h, mi, s);
    return isNaN(dt.getTime()) ? null : dt;
  }

  /* ---------------------------------------------------------------- */
  /*  Characteristic parsers (DataView in, plain object out)           */
  /* ---------------------------------------------------------------- */

  /** Heart Rate Measurement (0x2A37). */
  function parseHeartRate(dv) {
    if (!dv || dv.byteLength < 2) return null;
    var flags = dv.getUint8(0), o = 1, bpm;
    if (flags & 0x01) { if (dv.byteLength < 3) return null; bpm = dv.getUint16(o, true); o += 2; } else { bpm = dv.getUint8(o); o += 1; }
    var contactBits = (flags >> 1) & 0x03;
    var sensorContact = contactBits === 3 ? 'contact' : contactBits === 2 ? 'no-contact' : 'unsupported';
    var energy = null;
    if (flags & 0x08) { if (o + 2 <= dv.byteLength) energy = dv.getUint16(o, true); o += 2; }
    var rr = [];
    if (flags & 0x10) { for (; o + 2 <= dv.byteLength; o += 2) rr.push(Math.round(dv.getUint16(o, true) * 1000 / 1024 * 10) / 10); } // 1/1024 s -> ms
    return { bpm: bpm, sensorContact: sensorContact, energyKJ: energy, rrMs: rr };
  }

  /** PLX Spot-check (0x2A5E) and Continuous (0x2A5F) measurement. kind: 'spot' | 'continuous'. */
  function parseSpo2(dv, kind) {
    if (!dv || dv.byteLength < 5) return null;
    var flags = dv.getUint8(0), o = 1;
    var spo2 = sfloat(dv.getUint16(o, true)), pr = sfloat(dv.getUint16(o + 2, true));
    o += 4;
    var out = { kind: kind || 'spot', spo2: finiteOrNull(spo2), pulseRate: finiteOrNull(pr), timestamp: null };
    if (kind === 'continuous') {
      if (flags & 0x01) o += 4; // fast
      if (flags & 0x02) o += 4; // slow
      // measurement status / sensor status / PAI follow; not needed
    } else {
      if (flags & 0x01) { out.timestamp = readDateTime(dv, o); o += 7; }
    }
    return out;
  }

  /** Blood Pressure Measurement (0x2A35). Pressures are returned in mmHg (kPa input is converted). */
  function parseBloodPressure(dv) {
    if (!dv || dv.byteLength < 7) return null;
    var flags = dv.getUint8(0), o = 1, kpa = !!(flags & 0x01);
    var sys = sfloat(dv.getUint16(o, true)), dia = sfloat(dv.getUint16(o + 2, true)), map = sfloat(dv.getUint16(o + 4, true));
    o += 6;
    var conv = function (v) { v = finiteOrNull(v); return v === null ? null : (kpa ? Math.round(v * KPA_TO_MMHG * 10) / 10 : v); };
    var out = { systolic: conv(sys), diastolic: conv(dia), meanArterial: conv(map), pulseRate: null, timestamp: null, unit: kpa ? 'kPa' : 'mmHg' };
    if (flags & 0x02) { out.timestamp = readDateTime(dv, o); o += 7; }
    if ((flags & 0x04) && o + 2 <= dv.byteLength) { out.pulseRate = finiteOrNull(sfloat(dv.getUint16(o, true))); o += 2; }
    return out;
  }

  var TEMP_TYPES = { 1: 'armpit', 2: 'body', 3: 'ear', 4: 'finger', 5: 'gastro-intestinal', 6: 'mouth', 7: 'rectum', 8: 'toe', 9: 'tympanum' };

  /** Temperature Measurement (0x2A1C). Returned in degrees Celsius (Fahrenheit input is converted). */
  function parseTemperature(dv) {
    if (!dv || dv.byteLength < 5) return null;
    var flags = dv.getUint8(0), o = 1, f = !!(flags & 0x01);
    var t = finiteOrNull(float32(dv.getUint32(o, true)));
    o += 4;
    if (t === null) return null;
    var out = { celsius: Math.round((f ? (t - 32) * 5 / 9 : t) * 100) / 100, unit: f ? 'degF' : 'degC', timestamp: null, site: null };
    if (flags & 0x02) { out.timestamp = readDateTime(dv, o); o += 7; }
    if ((flags & 0x04) && o + 1 <= dv.byteLength) out.site = TEMP_TYPES[dv.getUint8(o)] || null;
    return out;
  }

  /* ---------------------------------------------------------------- */
  /*  HRV from RR intervals                                            */
  /* ---------------------------------------------------------------- */

  /**
   * Time-domain HRV of a list of RR intervals (ms). Artefact rule (standard "20 % rule"): an interval outside 300-2000 ms,
   * or more than 20 % away from the previously accepted one, is dropped. Needs >= minBeats accepted intervals.
   * RMSSD = sqrt(mean(successive differences^2)); SDNN = standard deviation of the intervals.
   */
  function hrv(rrMs, minBeats) {
    var need = minBeats || 10, kept = [], prev = null;
    for (var i = 0; i < rrMs.length; i++) {
      var r = rrMs[i];
      if (!(r >= 300 && r <= 2000)) continue;
      if (prev !== null && Math.abs(r - prev) > 0.2 * prev) continue;
      kept.push(r); prev = r;
    }
    if (kept.length < need) return null;
    var sumSq = 0, n = 0, mean = 0, k;
    for (k = 1; k < kept.length; k++) { var d = kept[k] - kept[k - 1]; sumSq += d * d; n++; }
    for (k = 0; k < kept.length; k++) mean += kept[k];
    mean /= kept.length;
    var varSum = 0;
    for (k = 0; k < kept.length; k++) varSum += (kept[k] - mean) * (kept[k] - mean);
    return {
      rmssd: Math.round(Math.sqrt(sumSq / n) * 10) / 10,
      sdnn: Math.round(Math.sqrt(varSum / (kept.length - 1)) * 10) / 10,
      meanRR: Math.round(mean * 10) / 10,
      beats: kept.length,
    };
  }

  /* ---------------------------------------------------------------- */
  /*  MeasureSession: turns a stream of heart-rate samples into one     */
  /*  reading (mean bpm + HRV) after a fixed window                     */
  /* ---------------------------------------------------------------- */
  function MeasureSession(opts) {
    opts = opts || {};
    this.seconds = opts.seconds || 30;
    this.samples = [];
    this.rr = [];
    this.startedAt = null;
  }
  MeasureSession.prototype.add = function (parsed, nowMs) {
    if (!parsed || !(parsed.bpm >= 20 && parsed.bpm <= 250)) return false;
    if (parsed.sensorContact === 'no-contact') return false; // strap not on the skin: do not average noise
    var t = typeof nowMs === 'number' ? nowMs : Date.now();
    if (this.startedAt === null) this.startedAt = t;
    this.samples.push(parsed.bpm);
    for (var i = 0; i < (parsed.rrMs || []).length; i++) this.rr.push(parsed.rrMs[i]);
    this.lastAt = t;
    return true;
  };
  MeasureSession.prototype.elapsed = function (nowMs) { return this.startedAt === null ? 0 : ((typeof nowMs === 'number' ? nowMs : Date.now()) - this.startedAt) / 1000; };
  MeasureSession.prototype.done = function (nowMs) { return this.elapsed(nowMs) >= this.seconds && this.samples.length >= 5; };
  /** {bpm (mean, rounded), min, max, n, hrv: {...}|null} or null when nothing usable was received. */
  MeasureSession.prototype.summary = function () {
    if (!this.samples.length) return null;
    var s = this.samples, sum = 0, mn = Infinity, mx = -Infinity;
    for (var i = 0; i < s.length; i++) { sum += s[i]; if (s[i] < mn) mn = s[i]; if (s[i] > mx) mx = s[i]; }
    return { bpm: Math.round(sum / s.length), min: mn, max: mx, n: s.length, hrv: hrv(this.rr) };
  };

  /* ---------------------------------------------------------------- */
  /*  Environment checks (honest messages)                              */
  /* ---------------------------------------------------------------- */
  function isIOS() {
    if (typeof navigator === 'undefined') return false;
    var ua = navigator.userAgent || '';
    return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }

  /** null when Web Bluetooth can be used here, otherwise a reason code: 'ios' | 'insecure' | 'no-api'. */
  function notSupportedReason() {
    if (typeof navigator !== 'undefined' && navigator.bluetooth && (typeof isSecureContext === 'undefined' || isSecureContext)) return null;
    if (isIOS()) return 'ios';
    if (typeof isSecureContext !== 'undefined' && !isSecureContext) return 'insecure';
    return 'no-api';
  }

  /* ---------------------------------------------------------------- */
  /*  Device client                                                     */
  /* ---------------------------------------------------------------- */

  var KINDS = {
    heart_rate: { service: SVC.heart_rate },
    spo2: { service: SVC.spo2 },
    blood_pressure: { service: SVC.blood_pressure },
    thermometer: { service: SVC.thermometer },
  };

  function toISO(d) { return new Date(d).toISOString().replace(/\.\d{3}Z$/, 'Z'); }

  /** A device timestamp is trusted only if it is not in the future and not older than 7 days (clocks on cheap cuffs are often unset). */
  function trustedTime(ts, now) {
    now = now || new Date();
    if (ts && ts.getTime() <= now.getTime() + 60000 && now.getTime() - ts.getTime() <= 7 * 86400000) return ts;
    return now;
  }

  /** Normalised readings ({metric,value,unit,measured_at}) for a parsed characteristic value. */
  function toReadings(kind, parsed, now) {
    now = now || new Date();
    var out = [];
    if (!parsed) return out;
    if (kind === 'heart_rate') {
      out.push({ metric: 'heart_rate', value: parsed.bpm, unit: 'bpm', measured_at: toISO(now) });
    } else if (kind === 'spo2') {
      var at = toISO(trustedTime(parsed.timestamp, now));
      if (parsed.spo2 !== null) out.push({ metric: 'spo2', value: parsed.spo2, unit: '%', measured_at: at });
      if (parsed.pulseRate !== null && parsed.pulseRate >= 20 && parsed.pulseRate <= 250) out.push({ metric: 'heart_rate', value: parsed.pulseRate, unit: 'bpm', measured_at: at });
    } else if (kind === 'blood_pressure') {
      var bt = toISO(trustedTime(parsed.timestamp, now));
      if (parsed.systolic !== null) out.push({ metric: 'systolic_bp', value: parsed.systolic, unit: 'mmHg', measured_at: bt });
      if (parsed.diastolic !== null) out.push({ metric: 'diastolic_bp', value: parsed.diastolic, unit: 'mmHg', measured_at: bt });
      if (parsed.pulseRate !== null && parsed.pulseRate >= 20 && parsed.pulseRate <= 250) out.push({ metric: 'heart_rate', value: parsed.pulseRate, unit: 'bpm', measured_at: bt });
    } else if (kind === 'thermometer') {
      out.push({ metric: 'body_temperature', value: parsed.celsius, unit: 'degC', measured_at: toISO(trustedTime(parsed.timestamp, now)) });
    }
    return out;
  }

  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  /**
   * Pair with a nearby device and stream it.
   *   connect('heart_rate', { onData(parsed, readings), onStatus(code, detail), onError(err) }) -> Promise<controller>
   * Must be called from a user gesture (a click). controller = { name, kind, disconnect() }.
   * onStatus codes: 'connecting' | 'connected' | 'subscribed' | 'reconnecting' | 'disconnected'.
   */
  function connect(kind, handlers) {
    handlers = handlers || {};
    var spec = KINDS[kind];
    if (!spec) return Promise.reject(new Error('unknown device kind'));
    var why = notSupportedReason();
    if (why) { var e = new Error('Web Bluetooth is not available (' + why + ')'); e.code = why; return Promise.reject(e); }
    var status = function (c, d) { if (handlers.onStatus) handlers.onStatus(c, d); };
    var stopped = false, server = null, device = null, listeners = [];

    function emit(parsed) {
      if (!parsed) return;
      var rds = toReadings(kind, parsed, new Date());
      if (handlers.onData) handlers.onData(parsed, rds);
    }

    async function subscribe(srv) {
      var service = await srv.getPrimaryService(spec.service);
      var chars = [];
      if (kind === 'heart_rate') chars.push([await service.getCharacteristic(CHR.hr), function (dv) { return parseHeartRate(dv); }]);
      else if (kind === 'blood_pressure') chars.push([await service.getCharacteristic(CHR.bp), parseBloodPressure]);
      else if (kind === 'thermometer') chars.push([await service.getCharacteristic(CHR.temp), parseTemperature]);
      else if (kind === 'spo2') {
        try { chars.push([await service.getCharacteristic(CHR.spo2_cont), function (dv) { return parseSpo2(dv, 'continuous'); }]); } catch (e) { /* continuous not offered */ }
        try { chars.push([await service.getCharacteristic(CHR.spo2_spot), function (dv) { return parseSpo2(dv, 'spot'); }]); } catch (e) { /* spot-check not offered */ }
        if (!chars.length) throw new Error('this oximeter exposes neither the continuous nor the spot-check measurement characteristic');
      }
      var pending = [];
      for (var i = 0; i < chars.length; i++) {
        (function (ch, parser) {
          var fn = function (ev) { try { emit(parser(ev.target.value)); } catch (err) { if (handlers.onError) handlers.onError(err); } };
          ch.addEventListener('characteristicvaluechanged', fn);
          listeners.push([ch, fn]);
          pending.push(ch.startNotifications()); // enables notifications or indications, whichever the characteristic supports
        })(chars[i][0], chars[i][1]);
      }
      await Promise.all(pending); // the CCCD writes settled: the caller can tell the user "now measuring"
      status('subscribed');
    }

    async function open() {
      status('connecting');
      server = await device.gatt.connect();
      status('connected', device.name || '');
      await subscribe(server);
    }

    function onDrop() {
      if (stopped) { status('disconnected'); return; }
      (async function () {
        for (var attempt = 1; attempt <= 3 && !stopped; attempt++) {
          status('reconnecting', attempt);
          await sleep(1000 * attempt);
          try { await open(); return; } catch (e) { /* try again */ }
        }
        status('disconnected');
      })();
    }

    return navigator.bluetooth.requestDevice({
      filters: [{ services: [spec.service] }],
      optionalServices: [SVC.battery, SVC.device_info],
    }).then(function (dev) {
      device = dev;
      dev.addEventListener('gattserverdisconnected', onDrop);
      return open().then(function () {
        return {
          name: dev.name || '',
          kind: kind,
          disconnect: function () {
            stopped = true;
            listeners.forEach(function (p) { try { p[0].removeEventListener('characteristicvaluechanged', p[1]); } catch (e) { /* gone */ } });
            try { if (dev.gatt && dev.gatt.connected) dev.gatt.disconnect(); } catch (e) { /* already closed */ }
          },
        };
      });
    });
  }

  /* ---------------------------------------------------------------- */
  /*  capture(): one user-visible measurement                           */
  /* ---------------------------------------------------------------- */

  /**
   * Pair, measure, disconnect. Call it directly from a click handler (Web Bluetooth needs the user gesture).
   *   var h = HealthConnect.capture('heart_rate', { seconds: 30, onStatus(code, detail), onProgress({elapsed, seconds, bpm, contact}), onError(err) });
   *   h.promise -> { kind, device, readings: [{metric,value,unit,measured_at}], summary }   (summary only for heart_rate: {bpm,min,max,n,hrv})
   *   h.stop()   finish now with what has been received;   h.cancel()   abort.
   * heart_rate: averages bpm for `seconds` (HRV RMSSD too if the strap sends RR intervals); spo2: spot-check finishes at once, a
   * continuous clip is averaged; blood_pressure / thermometer: finish on the first measurement the device indicates.
   */
  function capture(kind, opts) {
    opts = opts || {};
    var seconds = opts.seconds || (kind === 'heart_rate' ? 30 : 15);
    var waitMax = (opts.timeoutSeconds || 120) * 1000;
    var session = new MeasureSession({ seconds: seconds });
    var acc = { spo2: [], pulse: [], oneShot: null };
    var st = { ctl: null, finished: false, ticker: null, t0: Date.now(), contact: 'unsupported', bpm: null };
    var resolveP, rejectP;
    var promise = new Promise(function (res, rej) { resolveP = res; rejectP = rej; });

    function cleanup() { st.finished = true; clearInterval(st.ticker); if (st.ctl) st.ctl.disconnect(); }
    function fail(err) { if (st.finished) return; cleanup(); rejectP(err); }
    function mean(a) { var s = 0; for (var i = 0; i < a.length; i++) s += a[i]; return s / a.length; }
    function finish() {
      if (st.finished) return;
      var now = new Date(), at = toISO(now), readings = [], summary = null;
      if (kind === 'heart_rate') {
        summary = session.summary();
        if (!summary) return fail(new Error('no heart-rate data was received'));
        readings.push({ metric: 'heart_rate', value: summary.bpm, unit: 'bpm', measured_at: at });
        if (summary.hrv) readings.push({ metric: 'hrv_rmssd', value: summary.hrv.rmssd, unit: 'ms', measured_at: at });
      } else if (kind === 'spo2') {
        if (!acc.spo2.length) return fail(new Error('no oxygen reading was received'));
        readings.push({ metric: 'spo2', value: Math.round(mean(acc.spo2) * 10) / 10, unit: '%', measured_at: at });
        if (acc.pulse.length) readings.push({ metric: 'heart_rate', value: Math.round(mean(acc.pulse)), unit: 'bpm', measured_at: at });
      } else {
        readings = acc.oneShot || [];
        if (!readings.length) return fail(new Error('no measurement was received'));
      }
      var name = st.ctl ? st.ctl.name : '';
      cleanup();
      resolveP({ kind: kind, device: name, readings: readings, summary: summary });
    }
    var handlers = {
      onStatus: function (c, d) { if (opts.onStatus) opts.onStatus(c, d); },
      onError: function (e) { if (opts.onError) opts.onError(e); },
      onData: function (parsed, rds) {
        if (st.finished) return;
        if (kind === 'heart_rate') {
          session.add(parsed);
          st.contact = parsed.sensorContact; st.bpm = parsed.bpm;
        } else if (kind === 'spo2') {
          if (parsed.spo2 !== null && parsed.spo2 >= 50 && parsed.spo2 <= 100) acc.spo2.push(parsed.spo2);
          if (parsed.pulseRate !== null && parsed.pulseRate >= 20 && parsed.pulseRate <= 250) acc.pulse.push(parsed.pulseRate);
          if (opts.onData) opts.onData(parsed, rds);
          if (parsed.kind === 'spot' && acc.spo2.length) finish();
          return;
        } else {
          acc.oneShot = rds;
          if (opts.onData) opts.onData(parsed, rds);
          finish();
          return;
        }
        if (opts.onData) opts.onData(parsed, rds);
      },
    };
    try {
      connect(kind, handlers).then(function (ctl) {
        if (st.finished) { ctl.disconnect(); return; }
        st.ctl = ctl;
        st.ticker = setInterval(function () {
          if (st.finished) return;
          var elapsed = kind === 'heart_rate' ? session.elapsed() : (Date.now() - st.t0) / 1000;
          if (opts.onProgress) opts.onProgress({ elapsed: elapsed, seconds: seconds, bpm: st.bpm, contact: st.contact });
          if (kind === 'heart_rate' && session.done()) finish();
          else if (kind === 'spo2' && acc.spo2.length >= 3 && elapsed >= seconds) finish();
          else if (Date.now() - st.t0 > waitMax) fail(new Error('timeout: no measurement received'));
        }, 500);
      }, fail);
    } catch (e) { fail(e); }
    return { promise: promise, stop: finish, cancel: function () { fail(new Error('cancelled')); } };
  }

  /* ---------------------------------------------------------------- */
  /*  Saving readings to the signed-in user's account                   */
  /* ---------------------------------------------------------------- */
  function saveReadings(token, readings, device) {
    if (!token || !readings || !readings.length || typeof fetch !== 'function') return Promise.resolve(null);
    var rows = readings.map(function (r) { return { metric: r.metric, value: r.value, unit: r.unit, measured_at: r.measured_at, device: device || r.device || '' }; });
    return fetch('/api/health/readings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ source: 'bluetooth', readings: rows }),
    }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
  }

  return {
    SERVICES: SVC, CHARACTERISTICS: CHR,
    sfloat: sfloat, float32: float32,
    parseHeartRate: parseHeartRate, parseSpo2: parseSpo2, parseBloodPressure: parseBloodPressure, parseTemperature: parseTemperature,
    hrv: hrv, rmssd: function (rr) { var h = hrv(rr, 2); return h ? h.rmssd : null; },
    MeasureSession: MeasureSession,
    toReadings: toReadings, trustedTime: trustedTime,
    isIOS: isIOS, notSupportedReason: notSupportedReason, isSupported: function () { return notSupportedReason() === null; },
    connect: connect, capture: capture, saveReadings: saveReadings,
  };
});
