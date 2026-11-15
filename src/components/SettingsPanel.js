"use client";

import { useEffect, useRef } from "react";
import { useI18n } from "@/lib/i18n";
import styles from "./SettingsPanel.module.css";

export default function SettingsPanel({ open, onClose, settings, update }) {
  const { t, lang, setLang } = useI18n();
  const panelRef = useRef(null);
  const closeRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement;
    closeRef.current?.focus();

    const onKey = e => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      // フォーカスをパネル内に閉じ込める
      const nodes = panelRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!nodes || !nodes.length) return;
      const list = Array.from(nodes).filter(n => !n.disabled);
      const first = list[0];
      const last = list[list.length - 1];
      if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      if (prev && typeof prev.focus === "function") prev.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label={t("entry.settings")}>
      <button type="button" className={styles.backdrop} onClick={onClose} tabIndex={-1} aria-hidden="true" />
      <div className={styles.panel} ref={panelRef}>
        <div className={styles.head}>
          <h2 className={styles.title}>{t("entry.settings")}</h2>
          <button
            type="button"
            className={styles.close}
            onClick={onClose}
            ref={closeRef}
            aria-label={t("common.close")}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
              <path
                d="M3 3l10 10M13 3L3 13"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className={styles.row}>
          <div className={styles.rowLabel}>
            <span className={styles.label}>{t("entry.sound")}</span>
            <span className={styles.hint}>{t("entry.soundHint")}</span>
          </div>
          <div className={styles.segmented} role="group" aria-label={t("entry.sound")}>
            <button
              type="button"
              className={settings.sound ? styles.segOn : styles.seg}
              onClick={() => update({ sound: true })}
              aria-pressed={settings.sound}
            >
              ON
            </button>
            <button
              type="button"
              className={!settings.sound ? styles.segOn : styles.seg}
              onClick={() => update({ sound: false })}
              aria-pressed={!settings.sound}
            >
              OFF
            </button>
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.rowLabel}>
            <span className={styles.label}>{t("entry.motion")}</span>
          </div>
          <div className={styles.segmented} role="group" aria-label={t("entry.motion")}>
            <button
              type="button"
              className={settings.motion === "full" ? styles.segOn : styles.seg}
              onClick={() => update({ motion: "full" })}
              aria-pressed={settings.motion === "full"}
            >
              {t("entry.motionFull")}
            </button>
            <button
              type="button"
              className={settings.motion === "reduced" ? styles.segOn : styles.seg}
              onClick={() => update({ motion: "reduced" })}
              aria-pressed={settings.motion === "reduced"}
            >
              {t("entry.motionReduced")}
            </button>
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.rowLabel}>
            <span className={styles.label}>{t("entry.textSize")}</span>
          </div>
          <div className={styles.segmented} role="group" aria-label={t("entry.textSize")}>
            {[
              ["s", "A"],
              ["m", "A"],
              ["l", "A"],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={settings.textSize === key ? styles.segOn : styles.seg}
                onClick={() => update({ textSize: key })}
                aria-pressed={settings.textSize === key}
                aria-label={key.toUpperCase()}
                style={{ fontSize: key === "s" ? "0.72rem" : key === "l" ? "1rem" : "0.86rem" }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.rowLabel}>
            <span className={styles.label}>{t("entry.lang")}</span>
          </div>
          <div className={styles.segmented} role="group" aria-label={t("entry.lang")}>
            <button
              type="button"
              className={lang === "ja" ? styles.segOn : styles.seg}
              onClick={() => setLang("ja")}
              aria-pressed={lang === "ja"}
            >
              日本語
            </button>
            <button
              type="button"
              className={lang === "en" ? styles.segOn : styles.seg}
              onClick={() => setLang("en")}
              aria-pressed={lang === "en"}
            >
              English
            </button>
          </div>
        </div>

        <p className={styles.credit}>{t("entry.credit")}</p>
      </div>
    </div>
  );
}
