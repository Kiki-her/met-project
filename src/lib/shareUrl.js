"use client";

/**
 * 共有リンクの組み立て。
 *
 * 言語は localStorage ではなく URL に載せる。localStorage は送った相手には
 * 存在しないので、英語の人にリンクを渡しても日本語で開いてしまう。
 * URL に ?lang= を持たせれば、受け取った人が意図した言語で読める。
 */

/** サイトの根（末尾スラッシュなし）。静的ホスティングでも動くよう location から作る */
export function siteBase() {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}`;
}

/** いまの言語を URL に載せる（対応言語のみ） */
export function withLang(url, lang) {
  if (!url) return url;
  const l = lang === "en" ? "en" : "ja";
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}lang=${l}`;
}

/** 展覧会の共有URL */
export function exhibitionUrl(id, lang) {
  return withLang(`${siteBase()}/g/${id}/`, lang);
}

/**
 * 作品1点の共有URL。
 * ?work=<id> を付けると、開いた人がその作品の前に立った状態から始まる。
 */
export function workUrl(exhibitionId, workId, lang) {
  const base = `${siteBase()}/g/${exhibitionId}/?work=${encodeURIComponent(workId)}`;
  const l = lang === "en" ? "en" : "ja";
  return `${base}&lang=${l}`;
}

/** X（旧Twitter）の投稿画面 */
export function xIntent(url, text) {
  const p = new URLSearchParams({ url, text });
  return `https://twitter.com/intent/tweet?${p.toString()}`;
}

/** LINE の共有画面 */
export function lineShare(url, text) {
  const p = new URLSearchParams({ url, text });
  return `https://social-plugins.line.me/lineit/share?${p.toString()}`;
}

/** クリップボードへ（失敗したら false を返す） */
export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
