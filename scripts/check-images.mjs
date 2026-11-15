#!/usr/bin/env node
/**
 * 書庫の画像URLが生きているかを検査する。
 *
 * Met は画像ファイル名を後から差し替えるため、取得時点のダンプには
 * 404 になるURLが混ざっている。書庫に「切れた額」が並ぶのは避けたいので、
 * ここで全件を叩いて、表示できないものを data/broken-images.json に記録する。
 * build-data.mjs がこれを読み、書庫から除外する。
 *
 *   node scripts/check-images.mjs             # 全件（初回・更新時）
 *   node scripts/check-images.mjs --limit 50  # 試し撃ち
 *   node scripts/check-images.mjs --library   # 書庫の分だけ（既定）
 *   node scripts/check-images.mjs --exhibitions  # 展示会で使う分だけ
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { exhibitions } from "./curation.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const LIBRARY = path.join(ROOT, "public/data/library.json");
const OUT = path.join(ROOT, "data/broken-images.json");

const args = process.argv.slice(2);
const limitArg = args.indexOf("--limit");
const limit = limitArg >= 0 ? Number(args[limitArg + 1]) : Infinity;
const onlyExhibitions = args.includes("--exhibitions");

const CONCURRENCY = 24;
const TIMEOUT_MS = 15000;

/* ---------------- 対象のURLを集める ---------------- */

function targets() {
  if (onlyExhibitions) {
    // 展示会で使う作品だけ（curation の objectID から library を引く）
    const lib = JSON.parse(fs.readFileSync(LIBRARY, "utf8"));
    const byId = new Map(lib.map(w => [w.i, w]));
    const ids = new Set();
    for (const ex of exhibitions) for (const ch of ex.chapters) for (const id of ch.works) ids.add(id);
    return [...ids].map(id => {
      const w = byId.get(id);
      return w ? { id: w.i, url: w.im, title: w.t } : null;
    }).filter(Boolean);
  }
  const lib = JSON.parse(fs.readFileSync(LIBRARY, "utf8"));
  return lib.map(w => ({ id: w.i, url: w.im, title: w.t }));
}

/* ---------------- 1本ずつ叩く ---------------- */

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function probe(url, attempt = 0) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: ctrl.signal,
      headers: { "User-Agent": "night-museum-image-check/1.0" },
    });
    clearTimeout(timer);

    // 429 / 5xx はサーバー側の都合なので、時間を置いてやり直す
    if ((res.status === 429 || res.status >= 500) && attempt < 3) {
      await sleep(1500 * (attempt + 1));
      return probe(url, attempt + 1);
    }
    if (res.status === 405) {
      // HEAD を拒む場合があるので GET で確かめる
      return probeGet(url, attempt);
    }
    return { ok: res.ok, status: res.status };
  } catch (e) {
    clearTimeout(timer);
    if (attempt < 2) {
      await sleep(1200 * (attempt + 1));
      return probe(url, attempt + 1);
    }
    return { ok: false, status: 0, error: String(e.message || e).slice(0, 60) };
  }
}

async function probeGet(url, attempt = 0) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { Range: "bytes=0-0" } });
    clearTimeout(timer);
    if ((res.status === 429 || res.status >= 500) && attempt < 3) {
      await sleep(1500 * (attempt + 1));
      return probeGet(url, attempt + 1);
    }
    return { ok: res.ok, status: res.status };
  } catch (e) {
    clearTimeout(timer);
    if (attempt < 2) {
      await sleep(1200 * (attempt + 1));
      return probeGet(url, attempt + 1);
    }
    return { ok: false, status: 0, error: String(e.message || e).slice(0, 60) };
  }
}

/* ---------------- 本体 ---------------- */

const list = targets().filter(t => t.url).slice(0, limit);
const byUrl = new Map();

// 同じURLを使う作品は1回だけ叩く
const unique = [...new Map(list.map(t => [t.url, t])).values()];
console.log(`[check-images] 対象 ${list.length} 点 / ユニークURL ${unique.length} 本 / 並列 ${CONCURRENCY}`);

let done = 0;
let broken = 0;
const queue = [...unique];

async function worker() {
  while (queue.length) {
    const item = queue.shift();
    if (!item) break;
    const r = await probe(item.url);
    byUrl.set(item.url, r);
    done++;
    if (!r.ok) broken++;
    if (done % 100 === 0) process.stdout.write(`\r[check-images] ${done}/${unique.length}  (>${broken} 切れ)   `);
  }
}

await Promise.all(Array.from({ length: CONCURRENCY }, worker));

const brokenWorks = list
  .filter(t => {
    const r = byUrl.get(t.url);
    return r && !r.ok;
  })
  .map(t => ({
    id: t.id,
    title: t.title,
    url: t.url,
    status: byUrl.get(t.url).status,
    error: byUrl.get(t.url).error || null,
  }));

// 既存の記録は残しつつ更新（展示会だけ検査したときに書庫の記録を消さない）
let prev = { broken: [] };
if (fs.existsSync(OUT)) {
  try {
    prev = JSON.parse(fs.readFileSync(OUT, "utf8"));
  } catch {
    prev = { broken: [] };
  }
}
const merged = onlyExhibitions
  ? [...(prev.broken || []).filter(b => !brokenWorks.some(n => n.id === b.id)), ...brokenWorks]
  : brokenWorks;

fs.writeFileSync(
  OUT,
  JSON.stringify(
    {
      checkedAt: new Date().toISOString(),
      scope: onlyExhibitions ? "exhibitions" : "library",
      checked: list.length,
      broken: merged,
    },
    null,
    2
  ) + "\n"
);

console.log(`\n[check-images] 完了: ${list.length} 点中 ${brokenWorks.length} 点が表示不可`);
if (brokenWorks.length) {
  brokenWorks.slice(0, 15).forEach(b => console.log(`  - ${b.id} [${b.status}] ${String(b.title).slice(0, 50)}`));
  if (brokenWorks.length > 15) console.log(`  … 他 ${brokenWorks.length - 15} 点`);
}
