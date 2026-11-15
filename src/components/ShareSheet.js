"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import qrcode from "qrcode-generator";
import { useI18n } from "@/lib/i18n";
import { copyText, exhibitionUrl, lineShare, workUrl, xIntent } from "@/lib/shareUrl";
import styles from "./ShareSheet.module.css";

/** SVG path に変換したQRコード */
function useQrPath(text) {
  return useMemo(() => {
    if (!text) return null;
    try {
      const qr = qrcode(0, "M");
      qr.addData(text);
      qr.make();
      const n = qr.getModuleCount();
      let d = "";
      for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
          if (qr.isDark(r, c)) d += `M${c} ${r}h1v1h-1z`;
        }
      }
      return { d, n };
    } catch {
      return null;
    }
  }, [text]);
}

/**
 * 共有シート。展覧会（exhibition）でも作品1点（work）でも開ける。
 *
 * 作品を渡すと ?work=<id> 付きの URL を組み立てるので、
 * 受け取った人はその作品の前に立った状態から始められる。
 * 言語は URL に載せる（?lang=）。相手の端末に localStorage は無いため。
 */
export default function ShareSheet({ open, onClose, exhibition, work }) {
  const { t, T, lang } = useI18n();
  const [shareLang, setShareLang] = useState(lang);
  const [copied, setCopied] = useState(false);
  const closeRef = useRef(null);
  const inputRef = useRef(null);

  // 開くたびに、いま表示している言語を初期値にする
  useEffect(() => {
    if (open) setShareLang(lang);
  }, [open, lang]);

  useEffect(() => {
    if (!open) return;
    setCopied(false);
    closeRef.current?.focus();
    const onKey = e => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const url = useMemo(() => {
    if (!exhibition) return "";
    if (work) return workUrl(exhibition.id, work.id, shareLang);
    return exhibitionUrl(exhibition.id, shareLang);
  }, [exhibition, work, shareLang]);

  const qr = useQrPath(url);

  /** 共有文（題名と作者）。言語の選択に合わせる */
  const message = useMemo(() => {
    if (!exhibition) return "";
    if (work) {
      const title = shareLang === "ja" && work.titleJa ? work.titleJa : work.title;
      const artist = work.artist ? ` — ${work.artist}` : "";
      return shareLang === "ja"
        ? `${title}${artist}｜${t("share.workBy")}`
        : `${title}${artist} | ${t("share.workBy")}`;
    }
    const ex = shareLang === "ja" ? exhibition.title?.ja : exhibition.title?.en;
    return `${ex}｜${t("share.galleryBy")}`;
  }, [exhibition, work, shareLang, t]);

  // titleJa は WorkPanel と同じ規則で選ぶ
  const workTitle = work ? (shareLang === "ja" && work.titleJa ? work.titleJa : work.title) : "";

  if (!open || !exhibition) return null;

  const onCopy = async () => {
    const ok = await copyText(url);
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } else {
      inputRef.current?.select();
    }
  };

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label={work ? t("share.workTitle") : t("share.title")}
    >
      <button type="button" className={styles.backdrop} onClick={onClose} aria-hidden="true" tabIndex={-1} />
      <div className={styles.sheet}>
        <div className={styles.head}>
          <div className={styles.headText}>
            <p className={styles.eyebrow}>{work ? t("share.workTitle") : t("share.title")}</p>
            <h2 className={styles.title}>{work ? workTitle : exhibition.title?.[shareLang]}</h2>
            {work && work.artist ? <p className={styles.byline}>{work.artist}</p> : null}
          </div>
          <button
            type="button"
            className={styles.close}
            onClick={onClose}
            aria-label={t("share.close")}
            ref={closeRef}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
              <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* 送る言語。相手の端末には自分の設定が無いので、URL に載せて渡す */}
        <div className={styles.langRow}>
          <span className={styles.langLabel}>{t("share.lang")}</span>
          <div className={styles.langSeg} role="group" aria-label={t("share.lang")}>
            <button
              type="button"
              className={shareLang === "ja" ? styles.langOn : styles.langOff}
              onClick={() => setShareLang("ja")}
              aria-pressed={shareLang === "ja"}
            >
              日本語
            </button>
            <button
              type="button"
              className={shareLang === "en" ? styles.langOn : styles.langOff}
              onClick={() => setShareLang("en")}
              aria-pressed={shareLang === "en"}
            >
              English
            </button>
          </div>
        </div>

        <p className={styles.body}>{work ? t("share.workBody") : t("share.body")}</p>

        {/* X / LINE / URLコピー */}
        <div className={styles.targets}>
          <a
            className={styles.target}
            href={xIntent(url, message)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className={styles.targetIcon} aria-hidden="true">
              <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor">
                <path d="M12.6 1.5h2.4l-5.2 6 6.2 7h-4.9L7.4 9.9l-4.2 4.6H.8l5.6-6.4L.4 1.5h5l3.3 4.4zm-.9 11.7h1.4L4.4 2.9H2.9z" />
              </svg>
            </span>
            <span className={styles.targetLabel}>X</span>
          </a>

          <a
            className={styles.target}
            href={lineShare(url, message)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className={styles.targetIcon} aria-hidden="true">
              <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 1C3.9 1 .6 3.6.6 6.9c0 2.9 2.6 5.3 6.1 5.8.2 0 .6.2.7.4.1.2.1.5 0 .7l-.1.7c0 .2-.2.8.7.4 1-.4 5.3-3.1 6.4-5.3.5-1 .7-1.9.7-2.7C15.4 3.6 12.1 1 8 1zM4.5 8.8H3.2V5.4h.6v2.8h.7zm1.5 0H5.4V5.4h.6zm3.1 0h-.6L7.1 6.7v2.1h-.6V5.4h.6l1.4 2.1V5.4h.6zm2.6-2.8h-1.2v.6h1.2v.6h-1.2v.6h1.2v.6h-1.8V5.4h1.8z" />
              </svg>
            </span>
            <span className={styles.targetLabel}>LINE</span>
          </a>

          <button type="button" className={styles.target} onClick={onCopy}>
            <span className={styles.targetIcon} aria-hidden="true">
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
                <rect x="2" y="5.5" width="8" height="8.5" rx="1.2" />
                <path d="M5.4 3.4h7.2a1.2 1.2 0 0 1 1.2 1.2v6.6" strokeLinecap="round" />
              </svg>
            </span>
            <span className={styles.targetLabel}>{copied ? t("share.copied") : "URL"}</span>
          </button>
        </div>

        {qr ? (
          <div className={styles.qrWrap}>
            <svg
              className={styles.qr}
              viewBox={`0 0 ${qr.n} ${qr.n}`}
              role="img"
              aria-label={t("share.qr")}
              shapeRendering="crispEdges"
            >
              <rect width={qr.n} height={qr.n} fill="#f0e9dd" />
              <path d={qr.d} fill="#0a0908" />
            </svg>
            <span className={styles.qrLabel}>{t("share.qr")}</span>
          </div>
        ) : null}

        <div className={styles.urlRow}>
          <input
            ref={inputRef}
            className={styles.url}
            value={url}
            readOnly
            onFocus={e => e.target.select()}
            aria-label={t("share.copy")}
          />
          <button type="button" className={styles.copy} onClick={onCopy}>
            {copied ? t("share.copied") : t("share.copy")}
          </button>
        </div>
      </div>
    </div>
  );
}
