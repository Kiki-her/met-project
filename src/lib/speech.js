"use client";

/**
 * 音声ガイド（ブラウザの読み上げ機能を使用）
 * 作品のメタデータから読み上げ原稿を組み立てる。音声ファイルは持たない。
 */

let current = null;

export function speechSupported() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/** 日本語・英語それぞれで自然な声を選ぶ */
function pickVoice(lang) {
  if (!speechSupported()) return null;
  const voices = window.speechSynthesis.getVoices() || [];
  if (!voices.length) return null;
  const want = lang === "ja" ? "ja" : "en";
  const exact = voices.filter(v => (v.lang || "").toLowerCase().startsWith(want));
  if (!exact.length) return null;
  // ローカル音声を優先（オフラインでも動く）
  const local = exact.filter(v => v.localService);
  const pool = local.length ? local : exact;
  // 名前で好みのものを優先
  const prefer = lang === "ja" ? /kyoko|otoya|haruka|nanami|google/i : /samantha|daniel|serena|google us|google uk/i;
  return pool.find(v => prefer.test(v.name || "")) || pool[0];
}

export function buildScript(work, { lang, chapterTitle, museumName }) {
  const L = (a, b) => (lang === "ja" ? a : b);
  const parts = [];

  const title = work.title || L("無題", "Untitled");
  const artist = work.artist || L("作者不詳", "Unknown artist");

  if (lang === "ja") {
    parts.push(`${title}。${artist}。`);
    if (work.date) parts.push(`${work.date}。`);
    if (work.medium) parts.push(`${work.medium}。`);
    if (work.dims) parts.push(`寸法は${work.dims}。`);
    if (museumName) parts.push(`${museumName}の所蔵です。`);
    if (chapterTitle) parts.push(`「${chapterTitle}」の章に展示されています。`);
  } else {
    parts.push(`${title}. By ${artist}.`);
    if (work.date) parts.push(`${work.date}.`);
    if (work.medium) parts.push(`${work.medium}.`);
    if (work.dims) parts.push(`Dimensions: ${work.dims}.`);
    if (museumName) parts.push(`From the collection of ${museumName}.`);
    if (chapterTitle) parts.push(`Shown in the chapter "${chapterTitle}".`);
  }
  return parts.join(" ");
}

export function speak(text, lang, { onEnd, onError } = {}) {
  if (!speechSupported()) {
    onError && onError("unsupported");
    return false;
  }
  stopSpeaking();
  const u = new SpeechSynthesisUtterance(text);
  const voice = pickVoice(lang);
  if (voice) u.voice = voice;
  u.lang = lang === "ja" ? "ja-JP" : "en-US";
  u.rate = lang === "ja" ? 0.94 : 0.95;
  u.pitch = 1;
  u.volume = 1;
  u.onend = () => {
    if (current === u) current = null;
    onEnd && onEnd();
  };
  u.onerror = e => {
    if (current === u) current = null;
    onError && onError(e && e.error);
  };
  current = u;
  window.speechSynthesis.speak(u);
  return true;
}

export function pauseSpeaking() {
  if (!speechSupported()) return;
  window.speechSynthesis.pause();
}

export function resumeSpeaking() {
  if (!speechSupported()) return;
  window.speechSynthesis.resume();
}

export function stopSpeaking() {
  if (!speechSupported()) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    /* noop */
  }
  current = null;
}

export function isSpeaking() {
  return speechSupported() && (window.speechSynthesis.speaking || window.speechSynthesis.pending);
}
