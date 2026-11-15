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

/**
 * 音声ガイドの原稿を組み立てる。
 *
 * 目録の読み上げ（作者・素材・寸法）だけだと、展示室で耳にする案内にはならない。
 * そこで順番を「作品 → 誰が描いたか → なぜこの章にあるか → 目録」に組み替え、
 * キュレーターが書いた章の解説（chapterNote）を真ん中に置いている。
 * 寸法は最後に回す。数字は記憶に残りにくく、最初に置くと前口上が重くなるため。
 */
export function buildScript(work, { lang, chapterTitle, chapterNote, museumName }) {
  const L = (a, b) => (lang === "ja" ? a : b);
  const parts = [];

  const title = work.title || L("無題", "Untitled");
  const artist = work.artist || L("作者不詳", "Unknown artist");
  const clean = s => (typeof s === "string" ? s.trim().replace(/\s+/g, " ") : "");

  // 作品名・作者・制作年 — 最初に「何を見ているか」を確定させる
  if (lang === "ja") {
    parts.push(`${title}。`);
    if (work.artist) {
      // 「作者ca. 1825–30頃」と繋がらないよう、読点で区切る
      const dor = work.date ? `、${work.date}頃の作品です。` : "の作品です。";
      parts.push(`${work.artist}${dor}`);
    } else {
      parts.push("作者はわかっていません。");
    }
  } else {
    parts.push(`${title}.`);
    if (work.artist) {
      const when = work.date ? `, ${work.date}` : "";
      parts.push(`By ${work.artist}${when}.`);
    } else {
      parts.push("The artist is unknown.");
    }
  }

  // 章の解説 — ここが鑑賞の本体
  const note = clean(chapterNote);
  if (note) parts.push(note);

  // 章の位置づけ
  const chapter = clean(chapterTitle);
  if (chapter) {
    parts.push(
      lang === "ja"
        ? `「${chapter}」の章に掛かっています。`
        : `It hangs in the chapter "${chapter}".`
    );
  }

  // 目録情報（控えめに、最後に）
  const facts = [];
  if (work.medium) facts.push(clean(work.medium));
  if (work.dims) facts.push(lang === "ja" ? `${clean(work.dims)}` : clean(work.dims));
  if (facts.length) {
    parts.push(
      lang === "ja" ? `${facts.join("、")}。` : `${facts.join(". ")}.`
    );
  }

  if (museumName) {
    parts.push(
      lang === "ja"
        ? `${museumName}の所蔵です。`
        : `From the collection of ${museumName}.`
    );
  }

  return parts.join(lang === "ja" ? "" : " ");
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
