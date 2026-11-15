"use client";

import { useEffect, useRef } from "react";
import { useI18n } from "@/lib/i18n";
import styles from "./Door.module.css";

/**
 * 入口の扉。
 *
 * 初めて来た人に「これから館に入る」という一度きりの体験を渡すための蓋で、
 * 関門ではない。中身（ヒーロー以降）は最初から DOM にあり、
 * 扉はその手前に被さっているだけ。だから検索エンジンも中身を読めるし、
 * 扉を開けずに戻ってきた人を毎回止めることもない。
 *
 * 表示は毎回。来館の記録（localStorage）は残すが、扉を出すかどうかの判断には
 * 使わない。夜の館に入る合図として、訪問のたびに一度だけ通してもらう。
 * なお、閉じた状態は data-open="off" で表し、開いたら CSS で透過・無効化する。
 */
export default function Door({ open, onOpen }) {
  const { t } = useI18n();
  const btnRef = useRef(null);

  // 閉じているあいだは扉にフォーカスを置く（Tab が奥の本文へ抜けないように）
  useEffect(() => {
    if (!open) btnRef.current?.focus();
  }, [open]);

  return (
    <div className={styles.wrap} data-open={open ? "on" : "off"} aria-hidden={open || undefined}>
      <button
        type="button"
        className={styles.hit}
        onClick={onOpen}
        ref={btnRef}
        aria-label={t("door.open")}
      >
        <span className={styles.lamp} aria-hidden="true" />

        <span className={styles.arch} aria-hidden="true">
          <span className={styles.ajar} />
          <span className={`${styles.panel} ${styles.panelL}`}>
            <span className={styles.grain} />
          </span>
          <span className={`${styles.panel} ${styles.panelR}`}>
            <span className={styles.grain} />
          </span>
          <span className={styles.handles}>
            <span className={styles.handle} />
            <span className={styles.handle} />
          </span>
        </span>

        <span className={styles.caption}>
          <span className={styles.eyebrow}>{t("brandEn")}</span>
          <span className={styles.title}>{t("brand")}</span>
          <span className={styles.cta}>
            {t("door.open")}
            <span className={styles.ctaRule} aria-hidden="true" />
          </span>
          <span className={styles.hint}>{t("door.hint")}</span>
        </span>
      </button>
    </div>
  );
}
