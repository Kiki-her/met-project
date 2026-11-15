"use client";

/**
 * 展示室の環境音をブラウザ内で合成する。
 * 音源ファイルを持たないので、読み込みも著作権処理も不要。
 *
 *   1. ブラウンノイズ（空気の質感）— 低域をゆっくり揺らす
 *   2. ごく弱い帯域ノイズ（照明の放電・空調のかすれ）
 *   3. 長い残響（石造の展示室を想定）
 *   4. ときどき鳴る「館のきしみ」
 *
 * 自動再生規制のため、必ずユーザー操作のあとに start() を呼ぶこと。
 */

let ctx = null;
let master = null;
let nodes = [];
let creakTimer = null;
let started = false;
let targetVolume = 0.5;

const MAX_GAIN = 0.14; // 全体の上限。控えめに鳴らす

function makeBrownNoise(context, seconds) {
  const len = Math.floor(context.sampleRate * seconds);
  const buf = context.createBuffer(1, len, context.sampleRate);
  const data = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    const white = Math.random() * 2 - 1;
    last = (last + 0.02 * white) / 1.02;
    data[i] = last * 3.2;
  }
  return buf;
}

function makeImpulse(context, seconds, decay) {
  const len = Math.floor(context.sampleRate * seconds);
  const buf = context.createBuffer(2, len, context.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) {
      const t = i / len;
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, decay);
    }
  }
  return buf;
}

function loopSource(context, buffer) {
  const src = context.createBufferSource();
  src.buffer = buffer;
  src.loop = true;
  src.start(0);
  return src;
}

function build() {
  const context = new (window.AudioContext || window.webkitAudioContext)();
  ctx = context;

  master = context.createGain();
  master.gain.value = 0;
  master.connect(context.destination);

  // 残響
  const verb = context.createConvolver();
  verb.buffer = makeImpulse(context, 3.4, 2.6);
  const verbGain = context.createGain();
  verbGain.gain.value = 0.42;
  verb.connect(verbGain).connect(master);

  const dry = context.createGain();
  dry.gain.value = 0.85;
  dry.connect(master);

  // 1. 空気：ブラウンノイズ + 低域フィルタ + ゆっくりしたLFO
  const air = loopSource(context, makeBrownNoise(context, 8));
  const airFilter = context.createBiquadFilter();
  airFilter.type = "lowpass";
  airFilter.frequency.value = 420;
  airFilter.Q.value = 0.6;
  const airGain = context.createGain();
  airGain.gain.value = 0.5;

  const lfo = context.createOscillator();
  lfo.frequency.value = 0.045; // 22秒周期
  const lfoGain = context.createGain();
  lfoGain.gain.value = 140;
  lfo.connect(lfoGain).connect(airFilter.frequency);
  lfo.start();

  air.connect(airFilter).connect(airGain);
  airGain.connect(dry);
  airGain.connect(verb);

  // 2. 空調のかすれ：高い帯域をごく小さく
  const hiss = loopSource(context, makeBrownNoise(context, 6));
  const hissFilter = context.createBiquadFilter();
  hissFilter.type = "bandpass";
  hissFilter.frequency.value = 1150;
  hissFilter.Q.value = 0.9;
  const hissGain = context.createGain();
  hissGain.gain.value = 0.055;
  hiss.connect(hissFilter).connect(hissGain);
  hissGain.connect(verb);

  // 3. 館の低い唸り（50Hz付近をごく僅かに）
  const hum = context.createOscillator();
  hum.type = "sine";
  hum.frequency.value = 54;
  const humGain = context.createGain();
  humGain.gain.value = 0.012;
  hum.connect(humGain).connect(master);
  hum.start();

  nodes = [air, lfo, hiss, hum, airFilter, hissFilter, airGain, hissGain, verb, verbGain, dry, humGain];
}

/** ときどき、遠くで木材がきしむ音 */
function scheduleCreak() {
  const delay = 14000 + Math.random() * 26000;
  creakTimer = window.setTimeout(() => {
    if (!ctx || ctx.state !== "running") {
      scheduleCreak();
      return;
    }
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = makeBrownNoise(ctx, 0.5);
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.setValueAtTime(220 + Math.random() * 180, t);
    bp.frequency.exponentialRampToValueAtTime(120 + Math.random() * 90, t + 0.45);
    bp.Q.value = 6;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.06, t + 0.06);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
    src.connect(bp).connect(g).connect(master);
    src.start(t);
    src.stop(t + 1);
    scheduleCreak();
  }, delay);
}

export function isStarted() {
  return started;
}

/** ユーザー操作のあとに呼ぶ */
export async function startAmbience(volume = targetVolume) {
  targetVolume = volume;
  if (typeof window === "undefined") return false;
  if (!ctx) {
    try {
      build();
    } catch {
      return false;
    }
  }
  try {
    if (ctx.state === "suspended") await ctx.resume();
  } catch {
    return false;
  }
  if (ctx.state !== "running") return false;
  started = true;
  const now = ctx.currentTime;
  master.gain.cancelScheduledValues(now);
  master.gain.setValueAtTime(master.gain.value || 0, now);
  master.gain.linearRampToValueAtTime(MAX_GAIN * targetVolume, now + 2.4);
  if (!creakTimer) scheduleCreak();
  return true;
}

export function setAmbienceVolume(v, seconds = 1.2) {
  targetVolume = v;
  if (!ctx || !master) return;
  const now = ctx.currentTime;
  master.gain.cancelScheduledValues(now);
  master.gain.setValueAtTime(master.gain.value, now);
  master.gain.linearRampToValueAtTime(MAX_GAIN * v, now + seconds);
}

/** フェードアウトして停止（ページ離脱時など） */
export function stopAmbience(seconds = 0.7) {
  if (!ctx || !master) return;
  started = false;
  const now = ctx.currentTime;
  master.gain.cancelScheduledValues(now);
  master.gain.setValueAtTime(master.gain.value, now);
  master.gain.linearRampToValueAtTime(0, now + seconds);
  if (creakTimer) {
    window.clearTimeout(creakTimer);
    creakTimer = null;
  }
}

/** 完全に破棄（アンマウント時） */
export function disposeAmbience() {
  if (creakTimer) {
    window.clearTimeout(creakTimer);
    creakTimer = null;
  }
  nodes.forEach(n => {
    try {
      if (typeof n.stop === "function") n.stop();
      if (typeof n.disconnect === "function") n.disconnect();
    } catch {
      /* noop */
    }
  });
  nodes = [];
  if (master) {
    try {
      master.disconnect();
    } catch {
      /* noop */
    }
    master = null;
  }
  if (ctx) {
    try {
      ctx.close();
    } catch {
      /* noop */
    }
    ctx = null;
  }
  started = false;
}
