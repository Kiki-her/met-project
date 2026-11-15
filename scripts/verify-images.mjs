#!/usr/bin/env node
/**
 * 画像URLの検証と更新
 *
 * The Met は作品画像のファイル名を後から差し替えることがある
 * （例: ep/web-large/DT4626.jpg → ep/web-large/DP-31997-001-NEW.jpg）。
 * ローカルのダンプは取得時点のURLを保持しているため、404 になる場合がある。
 *
 * このスクリプトは、指定した作品IDについて Met Collection API から
 * 現在の画像URLを取得し、data/image-overrides.json に差分を書き出す。
 * build-data.mjs はこのファイルを優先して使うので、ビルドはオフラインのまま。
 *
 *   node scripts/verify-images.mjs            # 展覧会で使用中の作品のみ
 *   node scripts/verify-images.mjs --check    # 現状のURLを叩いて404を報告するだけ
 *   node scripts/verify-images.mjs --all      # カタログ全件（時間がかかる）
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { exhibitions } from "./curation.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OVERRIDES = path.join(ROOT, "data/image-overrides.json");
const API = "https://collectionapi.metmuseum.org/public/collection/v1/objects";

const args = process.argv.slice(2);
const CHECK_ONLY = args.includes("--check");

function loadWorks() {
  const raw = fs.readFileSync(path.join(ROOT, "data/fetchedData.js"), "utf8");
  const body = raw
    .replace(/^const infomation =/, "var infomation =")
    .replace(/export default infomation/, "module.exports = infomation");
  const mod = { exports: {} };
  new Function("module", "exports", body)(mod, mod.exports);
  return mod.exports;
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function head(url) {
  try {
    const res = await fetch(url, { method: "HEAD", redirect: "follow" });
    return res.status;
  } catch {
    return 0;
  }
}

async function fetchObject(id) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(`${API}/${id}`);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch {
      await sleep(600 * (attempt + 1));
    }
  }
  return null;
}

async function main() {
  const works = loadWorks();
  const byId = new Map(works.map(o => [o.objectID, o]));

  const ids = CHECK_ONLY || !args.includes("--all")
    ? [...new Set(exhibitions.flatMap(ex => ex.chapters.flatMap(c => c.works)))]
    : works.map(o => o.objectID);

  console.log(`[verify-images] checking ${ids.length} ids${CHECK_ONLY ? " (dry run)" : ""}`);

  const overrides = fs.existsSync(OVERRIDES) ? JSON.parse(fs.readFileSync(OVERRIDES, "utf8")) : {};
  let broken = 0;
  let fixed = 0;
  let ok = 0;

  for (let i = 0; i < ids.length; i++) {
    const id = ids[i];
    const local = byId.get(id);
    if (!local || !local.primaryImageSmall) {
      console.log(`  ${id}: no local image, skipped`);
      continue;
    }

    const status = await head(local.primaryImageSmall);
    if (status === 200) {
      ok++;
      // 以前に上書きしていたが、ローカルURLが復活していた場合は解除する
      if (overrides[id]) {
        delete overrides[id];
        console.log(`  ${id}: OK (override removed)`);
      }
      continue;
    }

    broken++;
    if (CHECK_ONLY) {
      console.log(`  ${id}: ${status} ${local.primaryImageSmall}`);
      continue;
    }

    const fresh = await fetchObject(id);
    if (!fresh || !fresh.primaryImageSmall) {
      console.log(`  ${id}: ${status} → API に画像がありません`);
      continue;
    }

    overrides[id] = {
      img: fresh.primaryImageSmall,
      imgFull: fresh.primaryImage || fresh.primaryImageSmall,
    };
    const newStatus = await head(fresh.primaryImageSmall);
    if (newStatus === 200) fixed++;
    console.log(`  ${id}: ${status} → ${newStatus}  ${fresh.primaryImageSmall.split("/").pop()}`);
    await sleep(180);
  }

  console.log(`[verify-images] ok=${ok} broken=${broken} fixed=${fixed}`);

  if (!CHECK_ONLY) {
    fs.mkdirSync(path.dirname(OVERRIDES), { recursive: true });
    fs.writeFileSync(OVERRIDES, JSON.stringify(overrides, null, 2));
    console.log(`[verify-images] wrote ${Object.keys(overrides).length} overrides → data/image-overrides.json`);
  }

  if (CHECK_ONLY && broken) process.exitCode = 1;
}

main();
