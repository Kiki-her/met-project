"use client";

/** 端末内に保存する設定（音・動き・文字サイズ）と、来館の記録 */

const KEY = "night-museum.settings";
const PROGRESS_KEY = "night-museum.progress";

export const DEFAULTS = {
  sound: true,
  motion: "full", // full | reduced
  textSize: "m", // s | m | l
};

const TEXT_SCALE = { s: 0.94, m: 1, l: 1.1 };

function safeParse(raw, fallback) {
  if (!raw) return fallback;
  try {
    const v = JSON.parse(raw);
    return v && typeof v === "object" ? { ...fallback, ...v } : fallback;
  } catch {
    return fallback;
  }
}

export function loadSettings() {
  if (typeof window === "undefined") return { ...DEFAULTS };
  try {
    return safeParse(window.localStorage.getItem(KEY), { ...DEFAULTS });
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveSettings(next) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* private mode では保存できない */
  }
}

/** 設定を <html> に反映する（動きの抑制・文字サイズ） */
export function applySettings(s) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.dataset.motion = s.motion === "reduced" ? "reduced" : "full";
  root.style.setProperty("--fs-scale", String(TEXT_SCALE[s.textSize] || 1));
}

export function loadProgress() {
  if (typeof window === "undefined") return null;
  try {
    const v = JSON.parse(window.localStorage.getItem(PROGRESS_KEY) || "null");
    if (!v || !v.exhibitionId) return null;
    return v;
  } catch {
    return null;
  }
}

export function saveProgress(p) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(p));
  } catch {
    /* noop */
  }
}
