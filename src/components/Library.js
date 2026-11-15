"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import styles from "./Library.module.css";

const PAGE = 48;

/** 数字だけを見やすく（3,116 → 3,116） */
const nf = new Intl.NumberFormat("en-US");

/** 検索用に文字列を正規化する（全角/半角・大文字小文字を吸収） */
function norm(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * 書庫 — 全収蔵品（3,116点）の一覧と検索。
 *
 * 展示室が「企画展」だとすると、こちらは収蔵庫。
 * データは静的JSON（public/data/library.json）を初回に一度だけ取得し、
 * 絞り込み・並べ替えはブラウザ内で行う。サーバーは不要。
 */
export default function Library() {
  const { t, L, lang } = useI18n();

  const [works, setWorks] = useState(null);
  const [failed, setFailed] = useState(false);
  const [query, setQuery] = useState("");
  const [dept, setDept] = useState("*");
  const [sort, setSort] = useState("artist");
  const [highlightOnly, setHighlightOnly] = useState(false);
  const [limit, setLimit] = useState(PAGE);
  const [selected, setSelected] = useState(null);

  const inputRef = useRef(null);

  // 書庫の取得（1回だけ）
  useEffect(() => {
    let alive = true;
    fetch("/data/library.json")
      .then(r => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      })
      .then(json => {
        if (alive) setWorks(json);
      })
      .catch(() => {
        if (alive) setFailed(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  /** 部門の一覧（作品数の多い順） */
  const depts = useMemo(() => {
    if (!works) return [];
    const count = new Map();
    for (const w of works) count.set(w.p, (count.get(w.p) || 0) + 1);
    return [...count.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([name, n]) => ({ name, n }));
  }, [works]);

  /** 絞り込み + 並べ替え */
  const filtered = useMemo(() => {
    if (!works) return null;
    const q = norm(query);
    let out = works;

    if (dept !== "*") out = out.filter(w => w.p === dept);
    if (highlightOnly) out = out.filter(w => w.hl === 1);

    if (q) {
      // 空白区切りの語をすべて含むもの（AND 検索）
      const terms = q.split(" ").filter(Boolean);
      out = out.filter(w => {
        const hay = norm(`${w.j} ${w.t} ${w.a}`);
        return terms.every(term => hay.includes(term));
      });
    }

    const collator = new Intl.Collator(lang === "ja" ? "ja" : "en", {
      numeric: true,
      sensitivity: "base",
    });

    const sorted = [...out];
    if (sort === "title") {
      sorted.sort((a, b) =>
        collator.compare(lang === "ja" && a.j ? a.j : a.t, lang === "ja" && b.j ? b.j : b.t)
      );
    } else if (sort === "date") {
      sorted.sort((a, b) => {
        const ya = Number(String(a.d).match(/\d{4}/)?.[0] || 9999);
        const yb = Number(String(b.d).match(/\d{4}/)?.[0] || 9999);
        return ya - yb;
      });
    } else {
      sorted.sort((a, b) => collator.compare(a.a || "zzz", b.a || "zzz"));
    }
    return sorted;
  }, [works, query, dept, sort, highlightOnly, lang]);

  // 条件が変わったら表示件数を戻す
  useEffect(() => {
    setLimit(PAGE);
  }, [query, dept, sort, highlightOnly]);

  const shown = filtered ? filtered.slice(0, limit) : [];

  const titleOf = w => (lang === "ja" && w.j ? w.j : w.t);
  const artistOf = w => w.a || t("library.noArtist");
  const dateOf = w => w.d || t("library.noDate");

  return (
    <div className={styles.page}>
      <div className={styles.glow} aria-hidden="true" />

      <header className={styles.topbar}>
        <Link href="/" className={styles.back}>
          <span aria-hidden="true">←</span>
          <span>{t("library.back")}</span>
        </Link>
        <span className={styles.brand}>{t("brand")}</span>
      </header>

      <main className={styles.main}>
        <section className={styles.head}>
          <p className={styles.eyebrow}>{t("library.eyebrow")}</p>
          <h1 className={styles.title}>{t("library.title")}</h1>
          <p className={styles.lede}>{t("library.lede")}</p>
        </section>

        {failed ? (
          <p className={styles.state}>{t("library.loadFailed")}</p>
        ) : !works ? (
          <p className={styles.state}>{t("library.loading")}</p>
        ) : (
          <>
            <section className={styles.controls} aria-label={t("library.search")}>
              <div className={styles.searchWrap}>
                <svg
                  className={styles.searchIcon}
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" strokeWidth="1.4" />
                  <path
                    d="M15.5 15.5 21 21"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                  />
                </svg>
                <input
                  ref={inputRef}
                  className={styles.search}
                  type="search"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder={t("library.search")}
                  aria-label={t("library.search")}
                />
                {query ? (
                  <button
                    type="button"
                    className={styles.clear}
                    onClick={() => {
                      setQuery("");
                      inputRef.current?.focus();
                    }}
                  >
                    {t("library.clear")}
                  </button>
                ) : null}
              </div>

              <div className={styles.filters}>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>{t("library.dept")}</span>
                  <select
                    className={styles.select}
                    value={dept}
                    onChange={e => setDept(e.target.value)}
                  >
                    <option value="*">{t("library.allDepts")}</option>
                    {depts.map(d => (
                      <option key={d.name} value={d.name}>
                        {d.name} ({nf.format(d.n)})
                      </option>
                    ))}
                  </select>
                </label>

                <label className={styles.field}>
                  <span className={styles.fieldLabel}>{t("library.sort")}</span>
                  <select
                    className={styles.select}
                    value={sort}
                    onChange={e => setSort(e.target.value)}
                  >
                    <option value="artist">{t("library.sortArtist")}</option>
                    <option value="title">{t("library.sortTitle")}</option>
                    <option value="date">{t("library.sortDate")}</option>
                  </select>
                </label>

                <button
                  type="button"
                  className={highlightOnly ? styles.toggleOn : styles.toggle}
                  onClick={() => setHighlightOnly(v => !v)}
                  aria-pressed={highlightOnly}
                >
                  {t("library.highlightOnly")}
                </button>
              </div>

              <p className={styles.count} aria-live="polite">
                {query || dept !== "*" || highlightOnly
                  ? t("library.countOf", {
                      n: nf.format(filtered.length),
                      total: nf.format(works.length),
                    })
                  : t("library.count", { n: nf.format(filtered.length) })}
              </p>
            </section>

            {filtered.length === 0 ? (
              <p className={styles.state}>{t("library.empty")}</p>
            ) : (
              <>
                <ul className={styles.grid}>
                  {shown.map(w => (
                    <li key={w.i}>
                      <button
                        type="button"
                        className={styles.card}
                        onClick={() => setSelected(w)}
                        aria-label={`${titleOf(w)} — ${artistOf(w)}`}
                      >
                        <span className={styles.thumb}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={w.im}
                            alt={titleOf(w)}
                            className={styles.thumbImg}
                            loading="lazy"
                            decoding="async"
                          />
                        </span>
                        <span className={styles.cardBody}>
                          <span className={styles.cardTitle} lang={lang}>
                            {titleOf(w)}
                          </span>
                          <span className={styles.cardArtist}>{artistOf(w)}</span>
                          <span className={styles.cardDate}>{dateOf(w)}</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>

                {limit < filtered.length ? (
                  <div className={styles.moreWrap}>
                    <button
                      type="button"
                      className={styles.more}
                      onClick={() => setLimit(v => v + PAGE)}
                    >
                      {t("library.more")}
                      <span className={styles.moreCount}>
                        {nf.format(Math.min(PAGE, filtered.length - limit))}
                      </span>
                    </button>
                  </div>
                ) : null}
              </>
            )}
          </>
        )}
      </main>

      {selected ? (
        <Detail work={selected} onClose={() => setSelected(null)} />
      ) : null}
    </div>
  );
}

/* ============================================================
   作品の詳細（書庫から一枚だけ引き出した状態）
   ============================================================ */
function Detail({ work, onClose }) {
  const { t, lang } = useI18n();
  const closeRef = useRef(null);

  const title = lang === "ja" && work.j ? work.j : work.t;

  // 開いたら閉じるボタンへ、Esc でも閉じられるように
  useEffect(() => {
    closeRef.current?.focus();
    const onKey = e => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const rows = [
    [t("library.detailArtist"), work.a || t("library.noArtist")],
    [t("library.detailDate"), work.d || t("library.noDate")],
    [t("library.detailMedium"), work.m],
    [t("library.detailDept"), work.p],
    [t("library.detailGallery"), work.g],
    [t("library.detailCredit"), work.s],
  ].filter(([, v]) => v);

  return (
    <div className={styles.sheetWrap} role="dialog" aria-modal="true" aria-label={title}>
      <button
        type="button"
        className={styles.sheetVeil}
        onClick={onClose}
        aria-label={t("common.close")}
        tabIndex={-1}
      />
      <div className={styles.sheet}>
        <button ref={closeRef} type="button" className={styles.sheetClose} onClick={onClose}>
          <span aria-hidden="true">×</span>
          <span className="sr-only">{t("common.close")}</span>
        </button>

        <div className={styles.sheetFigure}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={work.im} alt={title} className={styles.sheetImg} />
        </div>

        <div className={styles.sheetBody}>
          <h2 className={styles.sheetTitle} lang={lang}>
            {title}
          </h2>
          <p className={styles.sheetArtist}>{work.a || t("library.noArtist")}</p>

          <dl className={styles.meta}>
            {rows.map(([k, v]) => (
              <div key={k} className={styles.metaRow}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>

          {work.u ? (
            <a
              href={work.u}
              className={styles.source}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("library.detailSource")}
              <span aria-hidden="true">↗</span>
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}
