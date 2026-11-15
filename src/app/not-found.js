"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import styles from "./not-found.module.css";

/**
 * 404 — 消えた展示室。
 * 「作品が下ろされた壁」に見えるよう、スポットライトだけを残して額を空にする。
 */
export default function NotFound() {
  const { t, lang, setLang } = useI18n();

  return (
    <main className={styles.page}>
      <div className={styles.glow} aria-hidden="true" />

      <header className={styles.topbar}>
        <Link href="/" className={styles.brand}>
          <span className={styles.brandMark} aria-hidden="true" />
          <span className={styles.brandName}>{t("brand")}</span>
        </Link>
        <div className={styles.langSwitch} role="group" aria-label={t("entry.lang")}>
          <button
            type="button"
            className={lang === "ja" ? styles.langOn : styles.langOff}
            onClick={() => setLang("ja")}
            aria-pressed={lang === "ja"}
          >
            JA
          </button>
          <span className={styles.langSlash} aria-hidden="true">
            /
          </span>
          <button
            type="button"
            className={lang === "en" ? styles.langOn : styles.langOff}
            onClick={() => setLang("en")}
            aria-pressed={lang === "en"}
          >
            EN
          </button>
        </div>
      </header>

      <div className={styles.stage}>
        {/* 空いた壁 — フックだけが残る */}
        <div className={styles.emptyWall} aria-hidden="true">
          <span className={styles.spot} />
          <span className={styles.outline} />
          <span className={styles.hook} />
        </div>

        <div className={styles.copy}>
          <p className={styles.code} aria-hidden="true">
            {t("nf.code")}
          </p>
          <p className={styles.eyebrow}>{t("nf.eyebrow")}</p>
          <h1 className={styles.title}>{t("nf.title")}</h1>
          <p className={styles.body}>{t("nf.body")}</p>

          <Link href="/" className={styles.home}>
            {t("nf.home")}
            <span aria-hidden="true">→</span>
          </Link>
          <p className={styles.hint}>{t("nf.hint")}</p>
        </div>
      </div>
    </main>
  );
}
