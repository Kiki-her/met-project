#!/usr/bin/env node
/**
 * データパイプライン
 *
 * data/fetchedData.js（The Met Open Access のダンプ・3,116件）を読み、
 * アプリが使う JSON を生成する。
 *
 *   src/content/exhibitions/index.json   展覧会一覧（受付ページ用・軽量）
 *   src/content/exhibitions/<id>.json    展覧会の全データ（作品メタ込み）
 *   src/content/registry.js              上記を静的に import する登録モジュール（自動生成）
 *   public/data/catalog.json             全作品の軽量カタログ（将来の検索・抽選用）
 *
 * 作品データはページ単位のチャンクに分かれるため、初期バンドルには含まれない。
 * 旧実装は 8.8MB の fetchedData.js をクライアントで import していた。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { exhibitions } from "./curation.mjs";
import { titlesJa } from "./titles-ja.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const SRC = path.join(ROOT, "data/fetchedData.js");
const CONTENT = path.join(ROOT, "src/content");
const EXDIR = path.join(CONTENT, "exhibitions");
const PUBLIC_DATA = path.join(ROOT, "public/data");
const OVERRIDES_PATH = path.join(ROOT, "data/image-overrides.json");
const AUTO_TITLES_PATH = path.join(ROOT, "data/titles-ja-auto.json");

/**
 * 自動翻訳（英語タイトル → 日本語）のキャッシュ。
 * scripts/translate-ja.mjs が生成する。まだ無ければ空で動く。
 */
function loadAutoTitles() {
  if (!fs.existsSync(AUTO_TITLES_PATH)) {
    console.warn("[build-data] data/titles-ja-auto.json がありません（自動訳なしで続行）");
    return {};
  }
  try {
    return JSON.parse(fs.readFileSync(AUTO_TITLES_PATH, "utf8"));
  } catch {
    return {};
  }
}

const autoTitles = loadAutoTitles();

/**
 * 作品の日本語題を決める。
 *   1. 手書きの訳（scripts/titles-ja.mjs）— 展示会で使う作品はこちらが優先
 *   2. 自動訳（英語タイトルをキーにしたキャッシュ）
 *   3. 空文字 → 表示側で英語へフォールバック
 */
function titleJaOf(o) {
  return titlesJa[o.objectID] || autoTitles[o.title] || "";
}

/**
 * Met は画像ファイル名を後から差し替えることがある。
 * scripts/verify-images.mjs が検出した最新URLをここで優先適用する。
 */
function loadOverrides() {
  if (!fs.existsSync(OVERRIDES_PATH)) return {};
  try {
    return JSON.parse(fs.readFileSync(OVERRIDES_PATH, "utf8"));
  } catch {
    return {};
  }
}

/** fetchedData.js は ESM だが巨大なので、実行せず評価して取り出す */
function loadWorks() {
  const raw = fs.readFileSync(SRC, "utf8");
  const body = raw
    .replace(/^const infomation =/, "var infomation =")
    .replace(/export default infomation/, "module.exports = infomation");
  const mod = { exports: {} };
  new Function("module", "exports", body)(mod, mod.exports);
  return mod.exports;
}

const num = v => (typeof v === "number" && Number.isFinite(v) ? v : null);

/** 実寸（cm）から額装サイズを決めるための数値 */
function physical(o) {
  const m =
    Array.isArray(o.measurements) && o.measurements[0] && o.measurements[0].elementMeasurements;
  if (!m) return null;
  const h = num(m.Height) ?? num(m.Diameter) ?? null;
  const w = num(m.Width) ?? num(m.Diameter) ?? null;
  if (!h || !w) return null;
  return { h, w, ratio: +(h / w).toFixed(4) };
}

function tagList(o) {
  if (!Array.isArray(o.tags)) return [];
  return o.tags.map(t => t && t.term).filter(Boolean).slice(0, 8);
}

/** クライアントに渡す最小限の形に削る（57フィールド → 20フィールド） */
function slim(o, overrides = {}) {
  const p = physical(o);
  const ov = overrides[o.objectID];
  const img = (ov && ov.img) || o.primaryImageSmall || "";
  const imgFull = (ov && ov.imgFull) || o.primaryImage || img;
  return {
    id: o.objectID,
    title: o.title || "",
    // 日本語の題。訳が無ければ空文字にして、表示側で英語へフォールバックさせる
    titleJa: titleJaOf(o),
    artist: o.artistDisplayName || "",
    bio: o.artistDisplayBio || "",
    nationality: o.artistNationality || "",
    role: o.artistRole || "",
    date: o.objectDate || "",
    medium: o.medium || "",
    dims: o.dimensions || "",
    dept: o.department || "",
    credit: o.creditLine || "",
    gallery: o.GalleryNumber || "",
    url: o.objectURL || `https://www.metmuseum.org/art/collection/search/${o.objectID}`,
    // web-large（約100KB）と original（約1MB・寄ったときだけ取得）
    img,
    imgFull,
    // 高さ・幅（cm）。実寸比で壁に掛けるために使う
    h: p ? p.h : null,
    w: p ? p.w : null,
    ratio: p ? p.ratio : 0.8,
    tags: tagList(o),
    highlight: !!o.isHighlight,
  };
}

/** "sea-and-light" -> seaAndLight */
const ident = id => id.replace(/-([a-z])/g, (_, c) => c.toUpperCase());

function main() {
  const all = loadWorks();
  const byId = new Map(all.map(o => [o.objectID, o]));
  const overrides = loadOverrides();
  const overrideCount = Object.keys(overrides).length;
  console.log(`[build-data] source works: ${all.length}`);
  if (overrideCount) console.log(`[build-data] image overrides applied: ${overrideCount}`);

  fs.mkdirSync(EXDIR, { recursive: true });
  fs.mkdirSync(PUBLIC_DATA, { recursive: true });

  // 全作品カタログ（画像のあるものだけ）
  const catalog = all.filter(o => o.primaryImageSmall).map(o => slim(o, overrides));
  const catalogPath = path.join(PUBLIC_DATA, "catalog.json");
  fs.writeFileSync(catalogPath, JSON.stringify(catalog));
  console.log(
    `[build-data] catalog.json: ${catalog.length} works, ${(fs.statSync(catalogPath).size / 1024).toFixed(0)}KB`
  );

  // 書庫（全収蔵品の一覧・検索）用の軽量インデックス。
  // キー名は1文字にして、3,000件でも転送量を抑える（gzip 後 約260KB）。
  const library = catalog.map(o => ({
    i: o.id,
    t: o.title,
    j: o.titleJa || "",
    a: o.artist,
    d: o.date,
    m: o.medium,
    p: o.dept,
    w: o.w,
    h: o.h,
    s: o.credit,
    g: o.gallery,
    u: o.url,
    im: o.img,
    hl: o.highlight ? 1 : 0,
  }));
  const libraryPath = path.join(PUBLIC_DATA, "library.json");
  fs.writeFileSync(libraryPath, JSON.stringify(library));
  console.log(
    `[build-data] library.json: ${library.length} works, ${(fs.statSync(libraryPath).size / 1024).toFixed(0)}KB`
  );

  const errors = [];
  const index = [];

  for (const ex of exhibitions) {
    const chapters = ex.chapters.map(ch => {
      const works = ch.works
        .map(id => {
          const src = byId.get(id);
          if (!src) {
            errors.push(`exhibition "${ex.id}": objectID ${id} not found`);
            return null;
          }
          if (!src.primaryImageSmall) {
            errors.push(`exhibition "${ex.id}": objectID ${id} has no image`);
            return null;
          }
          return slim(src, overrides);
        })
        .filter(Boolean);
      return { title: ch.title, note: ch.note, works };
    });

    const total = chapters.reduce((n, c) => n + c.works.length, 0);
    if (!total) errors.push(`exhibition "${ex.id}" has no works`);

    const payload = {
      id: ex.id,
      title: ex.title,
      subtitle: ex.subtitle,
      curator: ex.curator,
      chapters,
      totalWorks: total,
    };
    const file = path.join(EXDIR, `${ex.id}.json`);
    fs.writeFileSync(file, JSON.stringify(payload, null, 2));
    console.log(
      `[build-data] ${ex.id}.json: ${total} works, ${(fs.statSync(file).size / 1024).toFixed(0)}KB`
    );

    const coverWork = byId.get(ex.cover);
    const coverPhys = coverWork ? physical(coverWork) : null;
    const coverImg = coverWork
      ? (overrides[coverWork.objectID]?.img || coverWork.primaryImageSmall || "")
      : "";
    index.push({
      id: ex.id,
      title: ex.title,
      subtitle: ex.subtitle,
      totalWorks: total,
      chapters: chapters.map(c => ({ title: c.title, count: c.works.length })),
      cover:
        coverWork && coverImg
          ? {
              id: coverWork.objectID,
              title: coverWork.title,
              titleJa: titleJaOf(coverWork),
              artist: coverWork.artistDisplayName || "",
              date: coverWork.objectDate || "",
              img: coverImg,
              ratio: coverPhys ? coverPhys.ratio : 0.8,
            }
          : null,
    });
  }

  fs.writeFileSync(path.join(EXDIR, "index.json"), JSON.stringify(index, null, 2));

  // registry.js（ビルド時に静的 import する。展示室ごとにチャンク分割される）
  const lines = [
    "// このファイルは scripts/build-data.mjs が自動生成します。手で編集しないでください。",
    ...index.map(e => `import ${ident(e.id)} from "./exhibitions/${e.id}.json";`),
    'import index from "./exhibitions/index.json";',
    "",
    "/** 受付ページ用（表紙・章立てのみ） */",
    "export const exhibitions = index;",
    "",
    "export const exhibitionIds = index.map(e => e.id);",
    "",
    "/** 展示室の全データ（作品メタ込み） */",
    "export const rooms = {",
    ...index.map(e => `  "${e.id}": ${ident(e.id)},`),
    "};",
    "",
    "export function getRoom(id) {",
    "  return rooms[id] || null;",
    "}",
    "",
    "export function getExhibition(id) {",
    "  return index.find(e => e.id === id) || null;",
    "}",
    "",
    "export function getNeighbours(id) {",
    "  const i = index.findIndex(e => e.id === id);",
    "  if (i < 0) return { prev: null, next: null };",
    "  return { prev: index[i - 1] || null, next: index[i + 1] || null };",
    "}",
    "",
  ];
  fs.writeFileSync(path.join(CONTENT, "registry.js"), lines.join("\n"));
  console.log(`[build-data] index: ${index.length} exhibitions, registry.js written`);

  if (errors.length) {
    console.error("\n[build-data] FAILED");
    errors.forEach(e => console.error("  - " + e));
    process.exit(1);
  }
  console.log("[build-data] OK");
}

main();
