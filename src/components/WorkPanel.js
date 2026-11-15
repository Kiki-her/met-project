"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { buildScript, pauseSpeaking, resumeSpeaking, speak, speechSupported, stopSpeaking } from "@/lib/speech";
import styles from "./WorkPanel.module.css";

export default function WorkPanel({
  work,
  open,
  hiRes,
  onClose,
  onPrev,
  onNext,
  chapterTitle,
  chapterNote,
  hasPrev = true,
  hasNext = true,
}) {
  const { t, L, lang } = useI18n();
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [speechErr, setSpeechErr] = useState(false);
  const [loadedFull, setLoadedFull] = useState(false);
  const [fullFailed, setFullFailed] = useState(false);
  const panelRef = useRef(null);
  const closeRef = useRef(null);

  // 作品が変わったら読み上げを止める
  useEffect(() => {
    stopSpeaking();
    setSpeaking(false);
    setPaused(false);
    setLoadedFull(false);
    setFullFailed(false);
  }, [work?.id]);

  useEffect(() => {
    if (!open) {
      stopSpeaking();
      setSpeaking(false);
      setPaused(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement;
    closeRef.current?.focus();
    const onKey = e => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
      if (e.key === "Tab") {
        const nodes = panelRef.current?.querySelectorAll(
          'button, [href], input, [tabindex]:not([tabindex="-1"])'
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
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      if (prev && typeof prev.focus === "function") prev.focus();
    };
  }, [open, onClose]);

  if (!work) return null;

  const hiSrc = loadedFull && !fullFailed ? work.imgFull : work.img;

  const toggleAudio = () => {
    if (!speechSupported()) {
      setSpeechErr(true);
      return;
    }
    if (speaking && !paused) {
      pauseSpeaking();
      setPaused(true);
      return;
    }
    if (speaking && paused) {
      resumeSpeaking();
      setPaused(false);
      return;
    }
    const script = buildScript(work, {
      lang,
      chapterTitle,
      museumName: "The Metropolitan Museum of Art",
    });
    const ok = speak(script, lang, {
      onEnd: () => {
        setSpeaking(false);
        setPaused(false);
      },
      onError: () => {
        setSpeaking(false);
        setPaused(false);
        setSpeechErr(true);
      },
    });
    if (ok) {
      setSpeaking(true);
      setPaused(false);
      setSpeechErr(false);
    }
  };

  const rows = [
    work.artist && [t("work.artist"), `${work.artist}`],
    work.bio && [null, work.bio],
    work.date && [t("work.date"), work.date],
    work.medium && [t("work.medium"), work.medium],
    work.dims && [t("work.dims"), work.dims],
    work.credit && [t("work.credit"), work.credit],
    work.dept && [t("work.dept"), work.dept],
  ].filter(Boolean);

  return (
    <aside
      className={styles.panel}
      data-open={open ? "on" : "off"}
      ref={panelRef}
      aria-hidden={!open}
      aria-label={work.title}
    >
      <div className={styles.scroll}>
        <div className={styles.head}>
          <span className={styles.eyebrow}>{chapterTitle}</span>
          <button
            type="button"
            className={styles.close}
            onClick={onClose}
            aria-label={t("work.close")}
            ref={closeRef}
            tabIndex={open ? 0 : -1}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
              <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <figure className={styles.figure}>
          <div className={styles.imageWrap}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={hiSrc}
              alt={work.title}
              className={styles.image}
              onError={() => {
                if (loadedFull) setFullFailed(true);
              }}
              onLoad={() => {
                if (hiRes && !loadedFull && work.imgFull) setLoadedFull(true);
              }}
              draggable="false"
            />
          </div>
          {hiRes && !loadedFull && work.imgFull ? (
            <figcaption className={styles.hintHi}>{t("work.loadingHi")}</figcaption>
          ) : null}
        </figure>

        <h2 className={styles.title}>{work.title || t("work.untitled")}</h2>
        <p className={styles.artist}>
          {work.artist || t("work.unknownArtist")}
          {work.nationality ? <span className={styles.nationality}> · {work.nationality}</span> : null}
        </p>

        {chapterNote ? <p className={styles.note}>{chapterNote}</p> : null}

        <dl className={styles.meta}>
          {rows.map(([label, value], i) =>
            label ? (
              <div className={styles.metaRow} key={i}>
                <dt className={styles.metaLabel}>{label}</dt>
                <dd className={styles.metaValue}>{value}</dd>
              </div>
            ) : (
              <p className={styles.bio} key={i}>
                {value}
              </p>
            )
          )}
        </dl>

        {work.tags && work.tags.length ? (
          <ul className={styles.tags}>
            {work.tags.map(tag => (
              <li className={styles.tag} key={tag}>
                {tag}
              </li>
            ))}
          </ul>
        ) : null}

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.audioBtn}
            onClick={toggleAudio}
            aria-pressed={speaking && !paused}
            tabIndex={open ? 0 : -1}
          >
            <span className={styles.audioIcon} aria-hidden="true">
              {speaking && !paused ? (
                <svg width="13" height="13" viewBox="0 0 14 14" fill="currentColor">
                  <rect x="2" y="1.5" width="3.4" height="11" rx="0.6" />
                  <rect x="8.6" y="1.5" width="3.4" height="11" rx="0.6" />
                </svg>
              ) : (
                <svg width="13" height="13" viewBox="0 0 14 14" fill="currentColor">
                  <path d="M3 1.6l9 5.4-9 5.4z" />
                </svg>
              )}
            </span>
            {speaking ? (paused ? t("work.audioPlay") : t("work.audioPause")) : t("work.audio")}
          </button>

          <a
            className={styles.sourceLink}
            href={work.url}
            target="_blank"
            rel="noopener noreferrer"
            tabIndex={open ? 0 : -1}
          >
            {t("work.source")}
            <span aria-hidden="true">↗</span>
          </a>
        </div>

        {speechErr ? <p className={styles.speechErr}>{t("work.audioUnsupported")}</p> : null}
      </div>

      <div className={styles.nav}>
        <button
          type="button"
          className={styles.navBtn}
          onClick={onPrev}
          disabled={!hasPrev}
          aria-label={t("room.prev")}
          tabIndex={open ? 0 : -1}
        >
          <span aria-hidden="true">←</span>
        </button>
        <span className={styles.navDot} aria-hidden="true" />
        <button
          type="button"
          className={styles.navBtn}
          onClick={onNext}
          disabled={!hasNext}
          aria-label={t("room.next")}
          tabIndex={open ? 0 : -1}
        >
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </aside>
  );
}
