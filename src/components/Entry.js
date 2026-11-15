"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useSettings } from "@/components/Providers";
import { loadProgress } from "@/lib/settings";
import SettingsPanel from "./SettingsPanel";
import styles from "./Entry.module.css";

/** 日替わりの展示（日付から決まるので、同じ日は同じ展示になる） */
function todayIndex(count) {
  const d = new Date();
  const key = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  return key % count;
}

export default function Entry({ exhibitions }) {
  const { t, L, lang, setLang } = useI18n();
  const { settings, update } = useSettings();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [progress, setProgress] = useState(null);

  useEffect(() => {
    setProgress(loadProgress());
  }, []);

  const today = useMemo(
    () => (exhibitions.length ? exhibitions[todayIndex(exhibitions.length)] : null),
    [exhibitions]
  );

  const resume = useMemo(() => {
    if (!progress) return null;
    return exhibitions.find(e => e.id === progress.exhibitionId) || null;
  }, [progress, exhibitions]);

  const others = exhibitions.filter(e => !today || e.id !== today.id);

  return (
    <div className={styles.page}>
      <div className={styles.glow} aria-hidden="true" />

      <header className={styles.topbar}>
        <div className={styles.brand}>
          <span className={styles.brandMark} aria-hidden="true" />
          <span className={styles.brandName}>{t("brand")}</span>
        </div>
        <div className={styles.topActions}>
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
          <button
            type="button"
            className={styles.settingsBtn}
            onClick={() => setSettingsOpen(true)}
            aria-label={t("entry.settings")}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.3" />
              <path
                d="M12 3v2.2M12 18.8V21M3 12h2.2M18.8 12H21M5.6 5.6l1.6 1.6M16.8 16.8l1.6 1.6M18.4 5.6l-1.6 1.6M7.2 16.8l-1.6 1.6"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.hero}>
          <p className={styles.eyebrow}>{t("brandEn")}</p>
          <h1 className={styles.title}>{t("brand")}</h1>
          <p className={styles.lede}>{t("entry.lede")}</p>
          <p className={styles.sub}>{t("entry.sub")}</p>

          {resume ? (
            <Link href={`/g/${resume.id}/`} className={styles.resume}>
              <span className={styles.resumeLabel}>{t("entry.resume")}</span>
              <span className={styles.resumeTitle}>
                {L(resume.title)}
                <span className={styles.resumeArrow} aria-hidden="true">
                  →
                </span>
              </span>
            </Link>
          ) : null}
        </section>

        {today ? (
          <section className={styles.todaySection}>
            <div className={styles.sectionHead}>
              <span className={styles.eyebrow}>{t("entry.today")}</span>
              <span className={styles.sectionRule} aria-hidden="true" />
            </div>
            <Link href={`/g/${today.id}/`} className={styles.todayCard}>
              <div className={styles.todayImageWrap}>
                {today.cover ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={today.cover.img}
                    alt={today.cover.title}
                    className={styles.todayImage}
                    loading="eager"
                  />
                ) : null}
                <span className={styles.todaySpot} aria-hidden="true" />
              </div>
              <div className={styles.todayBody}>
                <h2 className={styles.todayTitle}>{L(today.title)}</h2>
                <p className={styles.todaySub}>{L(today.subtitle)}</p>
                <p className={styles.todayMeta}>
                  {today.chapters.length} {t("entry.chapters")} · {today.totalWorks}{" "}
                  {t("entry.works")}
                </p>
                <span className={styles.enterCta}>
                  {t("entry.enterExhibition")}
                  <span aria-hidden="true">→</span>
                </span>
              </div>
            </Link>
          </section>
        ) : null}

        <section className={styles.allSection}>
          <div className={styles.sectionHead}>
            <span className={styles.eyebrow}>{t("entry.all")}</span>
            <span className={styles.sectionRule} aria-hidden="true" />
          </div>
          <ul className={styles.grid}>
            {others.map(ex => (
              <li key={ex.id}>
                <Link href={`/g/${ex.id}/`} className={styles.card}>
                  <div className={styles.cardImageWrap}>
                    {ex.cover ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={ex.cover.img}
                        alt={ex.cover.title}
                        className={styles.cardImage}
                        loading="lazy"
                      />
                    ) : null}
                  </div>
                  <div className={styles.cardBody}>
                    <h3 className={styles.cardTitle}>{L(ex.title)}</h3>
                    <p className={styles.cardSub}>{L(ex.subtitle)}</p>
                    <p className={styles.cardMeta}>
                      {ex.totalWorks} {t("entry.works")} · {ex.chapters.length}{" "}
                      {t("entry.chapters")}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className={styles.footer}>
        <p className={styles.credit}>{t("entry.credit")}</p>
        <button type="button" className={styles.footerSettings} onClick={() => setSettingsOpen(true)}>
          {t("entry.settings")}
        </button>
      </footer>

      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        update={update}
      />
    </div>
  );
}
