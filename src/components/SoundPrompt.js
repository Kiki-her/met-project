"use client";

import { useEffect, useRef } from "react";
import { useI18n } from "@/lib/i18n";
import styles from "./SoundPrompt.module.css";

export default function SoundPrompt({ onAccept, onDecline }) {
  const { t } = useI18n();
  const acceptRef = useRef(null);

  useEffect(() => {
    acceptRef.current?.focus();
  }, []);

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label={t("room.soundPromptTitle")}>
      <div className={styles.card}>
        <span className={styles.wave} aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
          <i />
        </span>
        <h2 className={styles.title}>{t("room.soundPromptTitle")}</h2>
        <p className={styles.body}>{t("room.soundPromptBody")}</p>
        <div className={styles.actions}>
          <button type="button" className={styles.primary} onClick={onAccept} ref={acceptRef}>
            {t("room.soundPromptYes")}
          </button>
          <button type="button" className={styles.secondary} onClick={onDecline}>
            {t("room.soundPromptNo")}
          </button>
        </div>
      </div>
    </div>
  );
}
