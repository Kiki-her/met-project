"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import qrcode from "qrcode-generator";
import { useI18n } from "@/lib/i18n";
import styles from "./ShareSheet.module.css";

/** 現在のURL（静的ホスティングでも動くよう location から組み立てる） */
function useShareUrl(exhibitionId) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    if (typeof window === "undefined") return;
    const base = `${window.location.origin}${
      window.location.pathname.replace(/\/g\/[^/]*\/?$/, "")
    }`;
    setUrl(`${base.replace(/\/$/, "")}/g/${exhibitionId}/`);
  }, [exhibitionId]);
  return url;
}

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

export default function ShareSheet({ open, onClose, exhibition }) {
  const { t, L } = useI18n();
  const url = useShareUrl(exhibition?.id);
  const qr = useQrPath(url);
  const [copied, setCopied] = useState(false);
  const closeRef = useRef(null);
  const inputRef = useRef(null);

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

  if (!open || !exhibition) return null;

  const copy = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: L(exhibition.title), url });
        return;
      }
    } catch {
      /* ユーザーがキャンセルした場合など */
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      // クリップボードAPIが使えない環境では入力欄を選択してコピーしてもらう
      inputRef.current?.select();
    }
  };

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label={t("share.title")}>
      <button type="button" className={styles.backdrop} onClick={onClose} aria-hidden="true" tabIndex={-1} />
      <div className={styles.sheet}>
        <div className={styles.head}>
          <div>
            <p className={styles.eyebrow}>{L(exhibition.title)}</p>
            <h2 className={styles.title}>{t("share.title")}</h2>
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

        <p className={styles.body}>{t("share.body")}</p>

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
            aria-label={t("share.title")}
          />
          <button type="button" className={styles.copy} onClick={copy}>
            {copied ? t("share.copied") : t("share.copy")}
          </button>
        </div>
      </div>
    </div>
  );
}
