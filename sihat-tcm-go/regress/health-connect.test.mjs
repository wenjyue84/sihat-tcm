/**
 * Unit tests for static/js/health-connect.js (the Web Bluetooth parsers and the device client).
 *   node --test regress/health-connect.test.mjs
 * Byte vectors are written out by hand from the Bluetooth SIG specs (GATT Specification Supplement: Heart Rate Measurement,
 * PLX Spot-check / Continuous Measurement, Blood Pressure Measurement, Temperature Measurement; IEEE 11073-20601 SFLOAT / FLOAT).
 */
import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const HC = require(join(dirname(fileURLToPath(import.meta.url)), "..", "static", "js", "health-connect.js"));
const dv = (...bytes) => new DataView(new Uint8Array(bytes).buffer);
const u16 = (v) => [v & 255, v >> 8];

test("SFLOAT decoding incl. negative exponent, negative mantissa and special values", () => {
  assert.equal(HC.sfloat(0x0078), 120);
  assert.equal(HC.sfloat(0xf3da), 98.6);       // 986 x 10^-1: exact, not 98.60000000000001
  assert.equal(HC.sfloat(0xe019), 0.25);       // 25 x 10^-2
  assert.equal(HC.sfloat(0x0ffb), -5);         // negative mantissa
  assert.equal(HC.sfloat(0x1005), 50);         // 5 x 10^1
  assert.ok(Number.isNaN(HC.sfloat(0x07ff)));  // NaN
  assert.ok(Number.isNaN(HC.sfloat(0x0800)));  // NRes
  assert.ok(Number.isNaN(HC.sfloat(0x0801)));  // reserved
  assert.equal(HC.sfloat(0x07fe), Infinity);
  assert.equal(HC.sfloat(0x0802), -Infinity);
});

test("FLOAT32 decoding", () => {
  assert.equal(HC.float32(0xff00016d), 36.5);  // 365 x 10^-1
  assert.equal(HC.float32(0xff0003da), 98.6);
  assert.equal(HC.float32(0x00000025), 37);
  assert.equal(HC.float32(0xfe000fa0), 40);    // 4000 x 10^-2
  assert.ok(Number.isNaN(HC.float32(0x007fffff)));
  assert.ok(Number.isNaN(HC.float32(0x00800000)));
  assert.equal(HC.float32(0x007ffffe), Infinity);
});

test("Heart Rate Measurement: 8-bit and 16-bit values", () => {
  assert.deepEqual(HC.parseHeartRate(dv(0x00, 72)), { bpm: 72, sensorContact: "unsupported", energyKJ: null, rrMs: [] });
  assert.equal(HC.parseHeartRate(dv(0x01, 0x96, 0x00)).bpm, 150);
  assert.equal(HC.parseHeartRate(dv(0x01, 0x2c, 0x01)).bpm, 300);   // 16-bit format really reads two bytes
});

test("Heart Rate Measurement: sensor contact, energy expended and RR intervals (1/1024 s -> ms)", () => {
  const p = HC.parseHeartRate(dv(0x16, 60, ...u16(1024), ...u16(512)));
  assert.equal(p.bpm, 60);
  assert.equal(p.sensorContact, "contact");
  assert.deepEqual(p.rrMs, [1000, 500]);
  const e = HC.parseHeartRate(dv(0x18, 70, 0x02, 0x01, ...u16(1024)));
  assert.equal(e.energyKJ, 0x0102);
  assert.deepEqual(e.rrMs, [1000]);
  assert.equal(HC.parseHeartRate(dv(0x04, 70)).sensorContact, "no-contact");
  assert.equal(HC.parseHeartRate(dv(0x0e, 70)).sensorContact, "contact");
});

test("Heart Rate Measurement: truncated input is rejected, not misread", () => {
  assert.equal(HC.parseHeartRate(dv(0x00)), null);
  assert.equal(HC.parseHeartRate(dv(0x01, 0x10)), null);          // flags say 16-bit, only one byte follows
  assert.equal(HC.parseHeartRate(null), null);
  const odd = HC.parseHeartRate(dv(0x10, 70, 0x00));              // dangling half RR interval is ignored
  assert.deepEqual(odd.rrMs, []);
});

test("PLX spot-check: SpO2 + pulse, optional timestamp, NaN when the device has no reading", () => {
  const s = HC.parseSpo2(dv(0x00, ...u16(0x0062), ...u16(0x0048)), "spot");
  assert.equal(s.spo2, 98); assert.equal(s.pulseRate, 72); assert.equal(s.timestamp, null);
  const t = HC.parseSpo2(dv(0x01, ...u16(0x0061), ...u16(0x0050), ...u16(2026), 10, 12, 8, 30, 15), "spot");
  assert.equal(t.spo2, 97);
  assert.equal(t.timestamp.getFullYear(), 2026); assert.equal(t.timestamp.getMonth(), 9); assert.equal(t.timestamp.getDate(), 12); assert.equal(t.timestamp.getHours(), 8);
  const none = HC.parseSpo2(dv(0x00, ...u16(0x07ff), ...u16(0x07ff)), "spot");
  assert.equal(none.spo2, null); assert.equal(none.pulseRate, null);
  assert.equal(HC.parseSpo2(dv(0x00, 1, 2), "spot"), null);
});

test("PLX continuous: normal block read, fast/slow blocks skipped", () => {
  const c = HC.parseSpo2(dv(0x03, ...u16(0x005f), ...u16(0x0041), ...u16(0x0060), ...u16(0x0042), ...u16(0x0061), ...u16(0x0043)), "continuous");
  assert.equal(c.kind, "continuous"); assert.equal(c.spo2, 95); assert.equal(c.pulseRate, 65);
});

test("Blood Pressure Measurement: mmHg with pulse rate", () => {
  const b = HC.parseBloodPressure(dv(0x04, ...u16(0x0078), ...u16(0x0050), ...u16(0x005d), ...u16(0x0046)));
  assert.equal(b.systolic, 120); assert.equal(b.diastolic, 80); assert.equal(b.meanArterial, 93); assert.equal(b.pulseRate, 70); assert.equal(b.unit, "mmHg");
});

test("Blood Pressure Measurement: kPa is converted to mmHg; timestamp precedes pulse rate", () => {
  const b = HC.parseBloodPressure(dv(0x07, ...u16(0x0010), ...u16(0xf06b), ...u16(0xf07f), ...u16(2026), 10, 12, 7, 5, 0, ...u16(0x0048)));
  assert.equal(b.unit, "kPa");
  assert.equal(b.systolic, 120);            // 16 kPa
  assert.equal(b.diastolic, 80.3);          // 10.7 kPa
  assert.equal(b.pulseRate, 72);
  assert.equal(b.timestamp.getMinutes(), 5);
});

test("Blood Pressure Measurement: invalid SFLOAT values become null, not 0", () => {
  const b = HC.parseBloodPressure(dv(0x00, ...u16(0x07ff), ...u16(0x0050), ...u16(0x07ff)));
  assert.equal(b.systolic, null); assert.equal(b.diastolic, 80);
});

test("Temperature Measurement: Celsius, Fahrenheit conversion, site", () => {
  assert.equal(HC.parseTemperature(dv(0x00, 0x6d, 0x01, 0x00, 0xff)).celsius, 36.5);
  const f = HC.parseTemperature(dv(0x05, 0xda, 0x03, 0x00, 0xff, 3));        // 98.6 degF, type present, type = ear
  assert.equal(f.celsius, 37); assert.equal(f.unit, "degF"); assert.equal(f.site, "ear");
  const ts = HC.parseTemperature(dv(0x02, 0x6d, 0x01, 0x00, 0xff, ...u16(2026), 10, 12, 6, 0, 0));
  assert.equal(ts.timestamp.getHours(), 6);
  assert.equal(HC.parseTemperature(dv(0x00, 0xff, 0xff, 0x7f, 0x00)), null);   // FLOAT NaN
  assert.equal(HC.parseTemperature(dv(0x00, 1)), null);
});

test("HRV: RMSSD / SDNN on a known series", () => {
  const rr = [800, 810, 790, 805, 795, 800, 810, 790, 805, 795];
  const h = HC.hrv(rr);
  assert.equal(h.rmssd, 13.6);              // sqrt(1675 / 9)
  assert.equal(h.beats, 10);
  assert.equal(h.meanRR, 800);
  assert.equal(HC.hrv(new Array(12).fill(800)).rmssd, 0);
});

test("HRV: artefacts (>20 % jumps, out-of-range) are dropped; too few beats gives null", () => {
  const rr = [800, 800, 400, 800, 3000, 800, 810, 800, 810, 800, 810, 800, 810];
  const h = HC.hrv(rr);
  assert.ok(h && h.beats === 11, JSON.stringify(h));
  assert.ok(h.rmssd < 15);
  assert.equal(HC.hrv([800, 810, 790]), null);
  assert.equal(HC.rmssd([800, 820]), 20);
});

test("MeasureSession averages, ignores strap-off samples, reports HRV when RR is present", () => {
  const s = new HC.MeasureSession({ seconds: 30 });
  for (let i = 0; i < 40; i++) assert.ok(s.add({ bpm: 70 + (i % 3), sensorContact: "contact", rrMs: [800 + (i % 2) * 10] }, 1000 + i * 1000));
  assert.equal(s.add({ bpm: 200, sensorContact: "no-contact", rrMs: [] }, 50000), false);
  assert.equal(s.add({ bpm: 5, sensorContact: "contact", rrMs: [] }, 50000), false);
  assert.equal(s.done(20000), false);
  assert.equal(s.done(31000), true);
  const sum = s.summary();
  assert.equal(sum.n, 40); assert.equal(sum.min, 70); assert.equal(sum.max, 72); assert.equal(sum.bpm, 71);
  assert.ok(sum.hrv && sum.hrv.rmssd === 10, JSON.stringify(sum.hrv));
  assert.equal(new HC.MeasureSession().summary(), null);
});

test("toReadings: normalised metric / unit names, trusted device clocks only", () => {
  const now = new Date("2026-10-12T10:00:00Z");
  assert.deepEqual(HC.toReadings("heart_rate", { bpm: 64 }, now), [{ metric: "heart_rate", value: 64, unit: "bpm", measured_at: "2026-10-12T10:00:00Z" }]);
  const bp = HC.toReadings("blood_pressure", { systolic: 118, diastolic: 76, pulseRate: 66, timestamp: new Date("2026-10-12T09:50:00Z") }, now);
  assert.deepEqual(bp.map((r) => [r.metric, r.value, r.measured_at]), [["systolic_bp", 118, "2026-10-12T09:50:00Z"], ["diastolic_bp", 76, "2026-10-12T09:50:00Z"], ["heart_rate", 66, "2026-10-12T09:50:00Z"]]);
  const future = HC.toReadings("thermometer", { celsius: 36.8, timestamp: new Date("2030-01-01T00:00:00Z") }, now);
  assert.equal(future[0].measured_at, "2026-10-12T10:00:00Z");           // unset/garbage cuff clock -> receipt time
  const stale = HC.toReadings("thermometer", { celsius: 36.8, timestamp: new Date("2026-09-01T00:00:00Z") }, now);
  assert.equal(stale[0].measured_at, "2026-10-12T10:00:00Z");
  const ox = HC.toReadings("spo2", { spo2: 97, pulseRate: 300, timestamp: null }, now);
  assert.deepEqual(ox.map((r) => r.metric), ["spo2"]);                    // implausible pulse is not forwarded
});

test("environment detection: iOS and missing API give honest reason codes", () => {
  const set = (nav) => Object.defineProperty(globalThis, "navigator", { value: nav, configurable: true, writable: true });
  const orig = Object.getOwnPropertyDescriptor(globalThis, "navigator");
  try {
    set({ userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)", platform: "iPhone", maxTouchPoints: 5 });
    assert.equal(HC.notSupportedReason(), "ios"); assert.equal(HC.isSupported(), false);
    set({ userAgent: "Mozilla/5.0 (Macintosh)", platform: "MacIntel", maxTouchPoints: 5 });   // iPadOS pretends to be a Mac
    assert.equal(HC.notSupportedReason(), "ios");
    set({ userAgent: "Mozilla/5.0 (X11; Linux) Firefox/130", platform: "Linux", maxTouchPoints: 0 });
    assert.equal(HC.notSupportedReason(), "no-api");
    set({ userAgent: "Chrome", platform: "Win32", maxTouchPoints: 0, bluetooth: {} });
    assert.equal(HC.notSupportedReason(), null); assert.equal(HC.isSupported(), true);
  } finally {
    if (orig) Object.defineProperty(globalThis, "navigator", orig); else delete globalThis.navigator;
  }
});

// ------- fake GATT stack: connect() subscribes to the right service/characteristic and forwards parsed values -------
function fakeChar(id) {
  const listeners = [];
  return { id, started: 0, startNotifications() { this.started++; return Promise.resolve(this); }, addEventListener(t, fn) { listeners.push(fn); }, removeEventListener(t, fn) { const i = listeners.indexOf(fn); if (i >= 0) listeners.splice(i, 1); },
    push(view) { listeners.slice().forEach((fn) => fn({ target: { value: view } })); }, count: () => listeners.length };
}
function fakeBluetooth(chars) {
  const asked = { services: [], chars: [] };
  const dev = { name: "Polar H10 TEST", gatt: { connected: false, connect() { this.connected = true; return Promise.resolve({ getPrimaryService: (s) => { asked.services.push(s); return Promise.resolve({ getCharacteristic: (c) => { asked.chars.push(c); return chars[c] ? Promise.resolve(chars[c]) : Promise.reject(new Error("no such characteristic")); } }); } }); }, disconnect() { this.connected = false; } },
    _l: {}, addEventListener(t, fn) { this._l[t] = fn; } };
  return { asked, dev, api: { requestDevice: async (opts) => { asked.opts = opts; return dev; } } };
}

test("connect(heart_rate) filters on 0x180D, subscribes to 0x2A37, forwards parsed samples, disconnects cleanly", async () => {
  const hr = fakeChar(0x2a37), fb = fakeBluetooth({ [0x2a37]: hr });
  Object.defineProperty(globalThis, "navigator", { value: { userAgent: "Chrome", platform: "Win32", maxTouchPoints: 0, bluetooth: fb.api }, configurable: true, writable: true });
  try {
    const got = [], status = [];
    const ctl = await HC.connect("heart_rate", { onData: (p, r) => got.push([p, r]), onStatus: (c) => status.push(c) });
    assert.deepEqual(fb.asked.opts.filters, [{ services: [0x180d] }]);
    assert.deepEqual(fb.asked.services, [0x180d]); assert.deepEqual(fb.asked.chars, [0x2a37]);
    assert.equal(hr.started, 1); assert.deepEqual(status, ["connecting", "connected", "subscribed"]);
    hr.push(dv(0x10, 66, ...u16(1024)));
    assert.equal(got.length, 1); assert.equal(got[0][0].bpm, 66); assert.equal(got[0][1][0].metric, "heart_rate");
    assert.equal(ctl.name, "Polar H10 TEST");
    ctl.disconnect();
    assert.equal(fb.dev.gatt.connected, false); assert.equal(hr.count(), 0);
    fb.dev._l.gattserverdisconnected(); // a deliberate disconnect does not trigger the reconnect loop
    assert.ok(status.includes("disconnected"));
  } finally { delete globalThis.navigator; }
});

test("connect(spo2) falls back to the spot-check characteristic; fails clearly when neither exists", async () => {
  const spot = fakeChar(0x2a5e), fb = fakeBluetooth({ [0x2a5e]: spot });
  Object.defineProperty(globalThis, "navigator", { value: { userAgent: "Chrome", platform: "Win32", maxTouchPoints: 0, bluetooth: fb.api }, configurable: true, writable: true });
  try {
    const got = [];
    await HC.connect("spo2", { onData: (p, r) => got.push(r) });
    assert.deepEqual(fb.asked.chars, [0x2a5f, 0x2a5e]);
    spot.push(dv(0x00, ...u16(0x0061), ...u16(0x0050)));
    assert.deepEqual(got[0].map((r) => [r.metric, r.value]), [["spo2", 97], ["heart_rate", 80]]);
    const none = fakeBluetooth({});
    globalThis.navigator.bluetooth = none.api;
    await assert.rejects(HC.connect("spo2", {}), /neither/);
  } finally { delete globalThis.navigator; }
});

test("connect() refuses cleanly without Web Bluetooth", async () => {
  Object.defineProperty(globalThis, "navigator", { value: { userAgent: "Mozilla/5.0 (iPhone)", platform: "iPhone", maxTouchPoints: 5 }, configurable: true, writable: true });
  try {
    await assert.rejects(HC.connect("heart_rate", {}), (e) => e.code === "ios");
    await assert.rejects(HC.connect("glucose", {}), /unknown device kind/);
  } finally { delete globalThis.navigator; }
});

// ------- capture(): the one-call measurement used by the wizard and the dashboard -------
const withBT = async (chars, fn) => {
  const fb = fakeBluetooth(chars);
  Object.defineProperty(globalThis, "navigator", { value: { userAgent: "Chrome", platform: "Win32", maxTouchPoints: 0, bluetooth: fb.api }, configurable: true, writable: true });
  try { return await fn(fb); } finally { delete globalThis.navigator; }
};
const settle = () => new Promise((r) => setTimeout(r, 20));

test("capture(heart_rate): averages samples (strap-off ignored), adds RMSSD, stop() finishes early, device is disconnected", () =>
  withBT({ [0x2a37]: fakeChar(0x2a37) }, async (fb) => {
    const hr = fb.dev.gatt; // keep a handle for the connected flag
    const char = fakeChar(0x2a37);
    fb.api.requestDevice = async () => fb.dev;
    const bt = fakeBluetooth({ [0x2a37]: char });
    globalThis.navigator.bluetooth = bt.api;
    const seen = [];
    const h = HC.capture("heart_rate", { seconds: 30, onData: (p) => seen.push(p.bpm) });
    await settle();
    for (let i = 0; i < 12; i++) char.push(dv(0x16, 60 + (i % 2) * 2, ...u16(Math.round((800 + (i % 2) * 10) * 1.024))));
    char.push(dv(0x04, 200));                 // strap lost contact: shown live but never averaged
    h.stop();
    const r = await h.promise;
    assert.equal(r.kind, "heart_rate"); assert.equal(r.device, "Polar H10 TEST");
    assert.equal(r.readings[0].metric, "heart_rate"); assert.equal(r.readings[0].value, 61);
    assert.equal(r.summary.n, 12); assert.equal(r.summary.max, 62);
    assert.ok(r.readings.some((x) => x.metric === "hrv_rmssd"), "RR intervals present, so HRV is reported");
    assert.ok(seen.includes(200), "live callback still sees every sample");
    assert.equal(bt.dev.gatt.connected, false); assert.equal(char.count(), 0);
    assert.equal(hr.connected, false);
  }));

test("capture(heart_rate) with no usable data rejects instead of inventing a number", () =>
  withBT({ [0x2a37]: fakeChar(0x2a37) }, async (fb) => {
    const char = fakeChar(0x2a37);
    globalThis.navigator.bluetooth = fakeBluetooth({ [0x2a37]: char }).api;
    const h = HC.capture("heart_rate", {});
    await settle();
    char.push(dv(0x04, 90)); // strap not on skin
    h.stop();
    await assert.rejects(h.promise, /no heart-rate data/);
  }));

test("capture(blood_pressure) finishes on the first indication with systolic / diastolic / pulse", () =>
  withBT({}, async () => {
    const char = fakeChar(0x2a35);
    globalThis.navigator.bluetooth = fakeBluetooth({ [0x2a35]: char }).api;
    const h = HC.capture("blood_pressure", {});
    await settle();
    char.push(dv(0x04, ...u16(0x0078), ...u16(0x0050), ...u16(0x005d), ...u16(0x0046)));
    const r = await h.promise;
    assert.deepEqual(r.readings.map((x) => [x.metric, x.value]), [["systolic_bp", 120], ["diastolic_bp", 80], ["heart_rate", 70]]);
    assert.equal(r.summary, null);
  }));

test("capture(thermometer) and capture(spo2 spot) finish at once; cancel() and timeouts reject", () =>
  withBT({}, async () => {
    const tc = fakeChar(0x2a1c);
    globalThis.navigator.bluetooth = fakeBluetooth({ [0x2a1c]: tc }).api;
    const t1 = HC.capture("thermometer", {});
    await settle(); tc.push(dv(0x00, 0x6d, 0x01, 0x00, 0xff));
    assert.equal((await t1.promise).readings[0].value, 36.5);

    const sp = fakeChar(0x2a5e);
    globalThis.navigator.bluetooth = fakeBluetooth({ [0x2a5e]: sp }).api;
    const o = HC.capture("spo2", {});
    await settle(); sp.push(dv(0x00, ...u16(0x0062), ...u16(0x0048)));
    assert.deepEqual((await o.promise).readings.map((x) => [x.metric, x.value]), [["spo2", 98], ["heart_rate", 72]]);

    globalThis.navigator.bluetooth = fakeBluetooth({ [0x2a1c]: fakeChar(0x2a1c) }).api;
    const c = HC.capture("thermometer", {});
    await settle(); c.cancel();
    await assert.rejects(c.promise, /cancelled/);

    globalThis.navigator.bluetooth = fakeBluetooth({ [0x2a1c]: fakeChar(0x2a1c) }).api;
    const to = HC.capture("thermometer", { timeoutSeconds: 0.1 });
    await assert.rejects(to.promise, /timeout/);
  }));

test("capture() surfaces 'no device chosen' (user closed the chooser) as a rejection", () =>
  withBT({}, async () => {
    globalThis.navigator.bluetooth = { requestDevice: async () => { const e = new Error("User cancelled the requestDevice() chooser."); e.name = "NotFoundError"; throw e; } };
    await assert.rejects(HC.capture("heart_rate", {}).promise, (e) => e.name === "NotFoundError");
  }));
