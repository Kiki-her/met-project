"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export const LANGS = ["ja", "en"];
const STORAGE_KEY = "night-museum.lang";

const ja = {
  meta: {
    title: "夜の美術館",
    description:
      "メトロポリタン美術館のオープンアクセス作品を、夜の展示室で。灯りを落とした館内を歩き、作品に近づいてください。",
  },
  brand: "夜の美術館",
  brandEn: "THE NIGHT MUSEUM",
  door: {
    open: "扉をひらく",
    hint: "お好きなときに、どうぞ。音は切り替えられます。",
  },
  entry: {
    lede: "灯りを落とした展示室を、あなたのペースで。",
    sub: "The Metropolitan Museum of Art のオープンアクセス作品による、5つの小展覧会。",
    today: "本日の展示",
    all: "すべての展覧会",
    begin: "入館する",
    resume: "前回の続きから",
    resumeAt: "「{title}」の{chapter}",
    settings: "館内の設定",
    sound: "環境音",
    soundHint: "展示室の空気音（ブラウザ内で生成）",
    volume: "音量",
    volumeQuiet: "静か",
    volumeFull: "ひびく",
    motion: "動き",
    motionFull: "標準",
    motionReduced: "控えめ",
    textSize: "文字サイズ",
    lang: "言語",
    credit: "作品画像・メタデータ: The Metropolitan Museum of Art, Open Access (CC0)",
    enterExhibition: "展示室へ",
    chapters: "章",
    works: "点",
    minutes: "分",
    autoTour: "自動スライド",
    autoTourHint: "触れずにいると、次の作品へ静かに移ります",
    autoTourWait: "待ち時間",
    seconds: "{n}秒",
  },
  library: {
    eyebrow: "THE STOREROOM",
    title: "書庫",
    lede: "展示室で紹介していない作品も、館の奥にしまわれています。3,000点あまりを、ここから引き出せます。",
    open: "書庫をひらく",
    search: "題名・作者で探す",
    clear: "消す",
    dept: "部門",
    allDepts: "すべて",
    sort: "並び",
    sortArtist: "作者名",
    sortTitle: "題名",
    sortDate: "制作年",
    count: "{n}点",
    countOf: "{n} / {total}点",
    empty: "条件に合う作品がありません。",
    more: "さらに表示",
    back: "受付へ戻る",
    highlightOnly: "名品のみ",
    detailArtist: "作者",
    detailDate: "制作年",
    detailMedium: "素材",
    detailDept: "部門",
    detailCredit: "所蔵",
    detailGallery: "展示室番号",
    detailSource: "The Met で見る",
    noArtist: "作者不詳",
    noDate: "制作年不詳",
    loading: "書庫を開けています…",
    loadFailed: "書庫を読み込めませんでした。",
  },
  room: {
    chapter: "第{n}章",
    of: "{a} / {b}",
    walkHint: "スクロール・スワイプで歩く",
    step: "歩く",
    prev: "前の作品",
    next: "次の作品",
    approach: "近づく",
    back: "戻る",
    exit: "受付へ戻る",
    exhibition: "展覧会",
    shareCta: "共有",
    soundOn: "音を消す",
    soundOff: "音を出す",
    soundPromptTitle: "館内の環境音",
    soundPromptBody:
      "展示室の空気音を流します。音量は控えめです。いつでも右上から切り替えられます。",
    soundPromptYes: "音を出す",
    soundPromptNo: "静かに見る",
    chapterTitle: "章",
    endOfRoom: "展示室の終わり",
    seeNext: "次の展覧会へ",
    zoomIn: "拡大する",
    zoomOut: "縮小する",
  },
  work: {
    artist: "作者",
    date: "制作年",
    medium: "素材",
    dims: "寸法",
    credit: "所蔵",
    dept: "部門",
    tags: "タグ",
    source: "The Met で見る",
    audio: "音声ガイド",
    audioPlay: "再生",
    audioPause: "一時停止",
    audioStop: "停止",
    audioUnsupported: "この端末は読み上げに対応していません。",
    zoomIn: "拡大",
    close: "閉じる",
    share: "この作品を共有",
    untitled: "無題",
    unknownArtist: "作者不詳",
    openFull: "高精細で見る",
    loadingHi: "高精細画像を読み込み中…",
    scaleShow: "実寸で見る",
    scaleHide: "実寸をとじる",
    scaleNote: "約 {h} × {w} cm（人の背丈は約170cm）",
  },
  share: {
    title: "この展示室を共有",
    workTitle: "この作品を共有",
    body: "リンクを受け取った人は、同じ展示室を最初から見ることができます。",
    workBody: "リンクを開くと、この作品の前に立った状態から始まります。",
    lang: "送る言語",
    workBy: "夜の美術館",
    galleryBy: "夜の美術館",
    x: "X で共有",
    line: "LINE で送る",
    copy: "リンクをコピー",
    copied: "コピーしました",
    qr: "QRコード",
    close: "閉じる",
  },
  common: {
    close: "閉じる",
    loading: "展示室を準備しています…",
    error: "展示室を開けませんでした。",
    backToEntry: "受付へ戻る",
    notFound: "この展示室は存在しません。",
  },
  nf: {
    code: "404",
    eyebrow: "NOT ON VIEW",
    title: "この展示室は、ありません。",
    body: "リンクが古いか、展示が入れ替わったようです。受付へ戻れば、今夜開いている展示室から選べます。",
    home: "受付へ戻る",
    hint: "展示室の一覧は受付にあります。",
  },
};

const en = {
  meta: {
    title: "The Night Museum",
    description:
      "Open-access works from The Metropolitan Museum of Art, in a gallery after dark. Walk the dim halls and step close to the paintings.",
  },
  brand: "The Night Museum",
  brandEn: "THE NIGHT MUSEUM",
  door: {
    open: "Open the door",
    hint: "Whenever you are ready. Sound can be turned off at any time.",
  },
  entry: {
    lede: "A gallery after dark, at your own pace.",
    sub: "Five small exhibitions drawn from the open-access collection of The Metropolitan Museum of Art.",
    today: "On view today",
    all: "All exhibitions",
    begin: "Enter",
    resume: "Continue where you left off",
    resumeAt: "{title}, {chapter}",
    settings: "House settings",
    sound: "Ambience",
    soundHint: "Room tone, generated in your browser",
    volume: "Volume",
    volumeQuiet: "Quiet",
    volumeFull: "Present",
    motion: "Motion",
    motionFull: "Standard",
    motionReduced: "Reduced",
    textSize: "Text size",
    lang: "Language",
    credit: "Images and metadata: The Metropolitan Museum of Art, Open Access (CC0)",
    enterExhibition: "Enter gallery",
    chapters: "chapters",
    works: "works",
    minutes: "min",
    autoTour: "Auto tour",
    autoTourHint: "Left untouched, the gallery moves on by itself",
    autoTourWait: "Waiting time",
    seconds: "{n}s",
  },
  library: {
    eyebrow: "THE STOREROOM",
    title: "The Storeroom",
    lede: "Not every work is on the walls. Some three thousand more are kept in the dark, and you may call any of them up.",
    open: "Open the storeroom",
    search: "Search by title or artist",
    clear: "Clear",
    dept: "Department",
    allDepts: "All",
    sort: "Sort",
    sortArtist: "Artist",
    sortTitle: "Title",
    sortDate: "Date",
    count: "{n} works",
    countOf: "{n} of {total}",
    empty: "No works match that.",
    more: "Show more",
    back: "Back to entrance",
    highlightOnly: "Highlights only",
    detailArtist: "Artist",
    detailDate: "Date",
    detailMedium: "Medium",
    detailDept: "Department",
    detailCredit: "Credit line",
    detailGallery: "Gallery",
    detailSource: "View at The Met",
    noArtist: "Unknown artist",
    noDate: "Date unknown",
    loading: "Fetching from the storeroom…",
    loadFailed: "The storeroom could not be opened.",
  },
  room: {
    chapter: "Chapter {n}",
    of: "{a} / {b}",
    walkHint: "Scroll or swipe to walk",
    step: "Walk",
    prev: "Previous work",
    next: "Next work",
    approach: "Step closer",
    back: "Back",
    exit: "Back to entrance",
    exhibition: "Exhibition",
    shareCta: "Share",
    soundOn: "Mute",
    soundOff: "Sound on",
    soundPromptTitle: "Room ambience",
    soundPromptBody:
      "The room tone of the gallery. It is quiet by default and can be turned off any time from the top right.",
    soundPromptYes: "Play sound",
    soundPromptNo: "View in silence",
    chapterTitle: "Chapter",
    endOfRoom: "End of the gallery",
    seeNext: "Next exhibition",
    zoomIn: "Zoom in",
    zoomOut: "Zoom out",
  },
  work: {
    artist: "Artist",
    date: "Date",
    medium: "Medium",
    dims: "Dimensions",
    credit: "Credit",
    dept: "Department",
    tags: "Tags",
    source: "View at The Met",
    audio: "Audio guide",
    audioPlay: "Play",
    audioPause: "Pause",
    audioStop: "Stop",
    audioUnsupported: "Speech is not available on this device.",
    zoomIn: "Zoom",
    close: "Close",
    share: "Share this work",
    untitled: "Untitled",
    unknownArtist: "Unknown artist",
    openFull: "View in high resolution",
    loadingHi: "Loading high-resolution image…",
    scaleShow: "See actual size",
    scaleHide: "Hide scale",
    scaleNote: "About {h} × {w} cm (a person is roughly 170 cm)",
  },
  share: {
    title: "Share this gallery",
    workTitle: "Share this work",
    body: "Anyone with the link can walk the same gallery from the beginning.",
    workBody: "The link opens with this work already in front of you.",
    lang: "Language for the link",
    workBy: "The Night Museum",
    galleryBy: "The Night Museum",
    x: "Share on X",
    line: "Send via LINE",
    copy: "Copy link",
    copied: "Copied",
    qr: "QR code",
    close: "Close",
  },
  common: {
    close: "Close",
    loading: "Preparing the gallery…",
    error: "The gallery could not be opened.",
    backToEntry: "Back to entrance",
    notFound: "This gallery does not exist.",
  },
  nf: {
    code: "404",
    eyebrow: "NOT ON VIEW",
    title: "This gallery is not on view.",
    body: "The link may be old, or the exhibition may have changed since. Return to the entrance and choose a room that is open tonight.",
    home: "Back to the entrance",
    hint: "The list of galleries is at the entrance.",
  },
};

export const dict = { ja, en };

const I18nContext = createContext(null);

function readStoredLang() {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return LANGS.includes(v) ? v : null;
  } catch {
    return null;
  }
}

/**
 * URL の ?lang= を読む。
 * 共有リンクは ?lang=en を持っているので、受け取った人は
 * 自分の保存設定に関係なく、送り主が選んだ言語で読める。
 * 保存設定より優先する（リンクを開いた意図のほうが強い）。
 */
function readUrlLang() {
  if (typeof window === "undefined") return null;
  try {
    const v = new URLSearchParams(window.location.search).get("lang");
    return LANGS.includes(v) ? v : null;
  } catch {
    return null;
  }
}

/** 端末の言語から初期値を推定（ブラウザのja以外は英語） */
function detectLang() {
  if (typeof navigator === "undefined") return "ja";
  const l = (navigator.language || "").toLowerCase();
  return l.startsWith("ja") ? "ja" : "en";
}

export function I18nProvider({ children }) {
  // SSR とクライアントでマークアップを一致させるため ja から開始し、
  // マウント後に保存値／端末言語へ寄せる。
  const [lang, setLang] = useState("ja");

  useEffect(() => {
    // 共有リンクの ?lang= が最優先。無ければ保存値、それも無ければ端末言語
    const next = readUrlLang() || readStoredLang() || detectLang();
    if (next !== lang) setLang(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    try {
      window.localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      /* private mode */
    }
  }, [lang]);

  const value = useMemo(() => {
    const t = (path, vars) => {
      const parts = path.split(".");
      let cur = dict[lang];
      for (const p of parts) {
        if (cur == null) return path;
        cur = cur[p];
      }
      if (typeof cur !== "string") return path;
      if (!vars) return cur;
      return cur.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? `{${k}}`));
    };
    const L = obj => {
      if (obj == null) return "";
      if (typeof obj === "string") return obj;
      return obj[lang] ?? obj.ja ?? obj.en ?? "";
    };
    /**
     * 作品の題。日本語表示のときだけ titleJa を使い、
     * 訳が無い作品は英語のまま出す（空欄にはしない）。
     */
    const T = work => {
      if (!work) return "";
      if (lang === "ja" && work.titleJa) return work.titleJa;
      return work.title || "";
    };
    return { lang, setLang, t, L, T };
  }, [lang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
