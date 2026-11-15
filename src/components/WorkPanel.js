"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";
import styles from "./WorkPanel.module.css";

export default function WorkPanel({
  work,
  open,
  hiRes,
  onClose,
  onPrev,
  onNext,
  onShare,
  chapterTitle,
  chapterNote,
  hasPrev = true,
  hasNext = true,
}) {
  const { t, L, T } = useI18n();
  const [loadedFull, setLoadedFull] = useState(false);
  const [fullFailed, setFullFailed] = useState(false);
  /** 背丈のシルエットを並べて、実寸を感じる表示 */
  const [showScale, setShowScale] = useState(false);
  const panelRef = useRef(null);
  const closeRef = useRef(null);

  // 作品が変わったら、高精細画像と実寸表示の状態を戻す
  useEffect(() => {
    setLoadedFull(false);
    setFullFailed(false);
    setShowScale(false);
  }, [work?.id]);

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

  /**
   * 実寸くらべ用の換算。
   * 背丈 170cm が 190px に収まるように縮尺を決め、作品も同じ比率で並べる。
   * 同じ縮尺で並べないと「絵のほうが大きい」という比較の意味が無くなる。
   */
  const PERSON_CM = 170;
  const STAGE_PX = 190;
  const hasSize = !!(work.h && work.h > 3);
  const scaleRatio = hasSize ? Math.min(STAGE_PX / Math.max(PERSON_CM, work.h), 0.62) : 1;


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
      aria-label={T(work)}
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
              alt={T(work)}
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

        {/*
          実寸くらべ。
          数字だけでは「思ったより大きい」が伝わらないので、人の背丈（約170cm）と
          並べて見せる。図版はモバイルでは隠しているが、この比較は寸法の話なので
          図版の外に出して、どの画面幅でも使えるようにしている。
        */}
        {hasSize ? (
          <div className={styles.scaleSection}>
            <button
              type="button"
              className={styles.scaleBtn}
              onClick={() => setShowScale(v => !v)}
              aria-expanded={showScale}
              tabIndex={open ? 0 : -1}
            >
              {showScale ? t("work.scaleHide") : t("work.scaleShow")}
              <span className={styles.scaleChevron} data-open={showScale ? "on" : "off"} aria-hidden="true">
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4">
                  <path d="M2.5 4.5L6 8l3.5-3.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </button>

            {showScale ? (
              <figure className={styles.scaleBox}>
                <div className={styles.scaleStage}>
                  <span
                    className={styles.scaleWork}
                    style={{
                      height: `${Math.round(work.h * scaleRatio)}px`,
                      width: work.w ? `${Math.round(work.w * scaleRatio)}px` : undefined,
                    }}
                  >
                    {work.w ? null : <span className={styles.scaleWorkBlank} />}
                  </span>
                  <span className={styles.scalePerson} style={{ height: `${Math.round(170 * scaleRatio)}px` }}>
                    {/*
                      人物は「頭のてっぺん＝viewBox の上端」「足の裏＝下端」に
                      ぴったり合わせて描く。ここが揃っていないと、作品の下端と
                      人の足元がずれて、実寸の比較として意味をなさない。
                      高さの合計が 96 になるよう座標を置いている。
                    */}
                    <svg viewBox="0 0 20 96" preserveAspectRatio="xMidYMax meet" fill="currentColor" aria-hidden="true">
                      <circle cx="10" cy="6.6" r="6.6" />
                      <rect x="4.4" y="13.2" width="11.2" height="29.8" rx="3.2" />
                      <rect x="6.1" y="43" width="3.5" height="53" />
                      <rect x="10.4" y="43" width="3.5" height="53" />
                    </svg>
                  </span>
                </div>
                <figcaption className={styles.scaleNote}>
                  {t("work.scaleNote", {
                    h: Math.round(work.h),
                    w: Math.round(work.w || 0),
                  })}
                </figcaption>
              </figure>
            ) : null}
          </div>
        ) : null}

        <h2 className={styles.title}>{T(work) || t("work.untitled")}</h2>
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

          {onShare ? (
            <button
              type="button"
              className={styles.shareBtn}
              onClick={() => onShare(work)}
              tabIndex={open ? 0 : -1}
            >
              <span aria-hidden="true">
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.3">
                  <circle cx="15" cy="5" r="2.1" />
                  <circle cx="5" cy="10" r="2.1" />
                  <circle cx="15" cy="15" r="2.1" />
                  <path d="M7 9l6-3M7 11l6 3" strokeLinecap="round" />
                </svg>
              </span>
              {t("work.share")}
            </button>
          ) : null}
        </div>
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
