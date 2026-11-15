/**
 * 作品タイトルの日本語訳を自動生成する。
 *
 * 手で書いた scripts/titles-ja.mjs（42点・品質重視）を土台に、
 * 残りの全作品を LLM で翻訳して data/titles-ja-auto.json に貯める。
 * 表示側は「手書き → 自動訳 → 英語」の順にフォールバックする。
 *
 *   ・英語タイトルをキーにする（同じ題の作品が46点あるため、重複を1回で済ませる）
 *   ・バッチごとにキャッシュへ書き出すので、途中で落ちても再実行で続きから進む
 *   ・--force で全件やり直し、--limit N で試し翻訳
 *
 * 使い方: node scripts/translate-ja.mjs [--force] [--limit N] [--concurrency N]
 */
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const CATALOG = path.join(ROOT, "public/data/catalog.json");
const CACHE = path.join(ROOT, "data/titles-ja-auto.json");

const args = process.argv.slice(2);
const force = args.includes("--force");
const limitArg = args.indexOf("--limit");
const limit = limitArg >= 0 ? Number(args[limitArg + 1]) : Infinity;
const concArg = args.indexOf("--concurrency");
const concurrency = concArg >= 0 ? Number(args[concArg + 1]) : 4;

const BATCH = 50;

/* ---------------- 設定の読み込み ---------------- */

function llmConfig() {
  let apiKey = process.env.OPENAI_API_KEY;
  let baseURL = process.env.OPENAI_BASE_URL;
  const yamlPath = path.join(os.homedir(), ".genspark_llm.yaml");
  if ((!apiKey || !baseURL) && fs.existsSync(yamlPath)) {
    const raw = fs.readFileSync(yamlPath, "utf8");
    apiKey = apiKey || (raw.match(/api_key:\s*(\S+)/) || [])[1];
    baseURL = baseURL || (raw.match(/base_url:\s*(\S+)/) || [])[1];
  }
  if (!apiKey || !baseURL) {
    throw new Error(
      "LLM API の設定が見つかりません。OPENAI_API_KEY / OPENAI_BASE_URL を設定するか、~/.genspark_llm.yaml を用意してください。"
    );
  }
  return { apiKey, baseURL };
}

/* ---------------- 翻訳 ---------------- */

const SYSTEM_PROMPT = `You are a senior translator for a Japanese art museum, preparing catalogue entries for The Metropolitan Museum of Art's collection.

Translate each English artwork title into Japanese as it would appear in a Japanese exhibition catalogue.

Rules:
1. Use the established Japanese art-historical rendering when one exists. For example "The Gulf Stream" → 「メキシコ湾流」, "Madonna and Child" → 「聖母子」, "The Annunciation" → 「受胎告知」, "Still Life with Apples" → 「リンゴのある静物」.
2. Transliterate ALL proper names — people, places, institutions, ships, buildings — into katakana, following Japanese usage where it exists. "Portrait of George Washington" → 「ジョージ・ワシントンの肖像」, "Janet Halleck Drake" → 「ジャネット・ハレック・ドレイク」, "Leete Farm, West Claremont, New Hampshire" → 「リート農場、ウェスト・クレアモント（ニューハンプシャー州）」. Do NOT leave a Latin-script word inside a Japanese title unless it is an untranslatable brand or a Roman numeral.
3. Drop leading articles naturally. Japanese titles should read as nouns, not sentences.
4. Keep conventional title elements: "No. 5" → 「第5番」, "Study for..." → 「…のための習作」, "Sketch of..." → 「…のスケッチ」, "Copy after..." → 「…による模写」, "Panel of..." → 「…の板絵」 if the work is a panel painting.
5. Never add explanation or parentheses that are not in the original (the 州 for a US state is the one allowed exception).
6. If a title is already Japanese or is a non-Latin string, return it unchanged.
7. If a word is genuinely unidentifiable, transliterate it phonetically into katakana rather than leaving it in Latin script. Do not invent information.

Return ONLY a JSON array of Japanese strings, in the same order and with exactly the same length as the input array. No prose, no code fences.`;

async function translateBatch(cfg, titles) {
  const res = await fetch(`${cfg.baseURL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cfg.apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-5-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content:
            `Translate these ${titles.length} titles.\n\n` + JSON.stringify(titles, null, 0),
        },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${res.status}: ${body.slice(0, 300)}`);
  }

  const json = await res.json();
  let text = json.choices?.[0]?.message?.content ?? "";

  // コードフェンスが付いてきた場合に備えて剥がす
  text = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();

  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start < 0 || end < 0) throw new Error(`JSON が見つかりません: ${text.slice(0, 200)}`);

  const arr = JSON.parse(text.slice(start, end + 1));
  if (!Array.isArray(arr) || arr.length !== titles.length) {
    throw new Error(`件数が合いません: 期待 ${titles.length} / 実際 ${arr.length}`);
  }
  return arr.map((v, i) => (typeof v === "string" && v.trim() ? v.trim() : titles[i]));
}

/* ---------------- 本体 ---------------- */

async function main() {
  const cfg = llmConfig();
  const catalog = JSON.parse(fs.readFileSync(CATALOG, "utf8"));

  const allTitles = [...new Set(catalog.map(o => o.title).filter(Boolean))];
  const cache = !force && fs.existsSync(CACHE) ? JSON.parse(fs.readFileSync(CACHE, "utf8")) : {};

  // ラテン文字を含まない題は翻訳不要
  const needsLatin = t => /[A-Za-z]/.test(t);
  const todo = allTitles.filter(t => needsLatin(t) && !cache[t]).slice(0, limit);

  console.log(`[translate] 全タイトル ${allTitles.length} / 翻訳済み ${Object.keys(cache).length} / 今回 ${todo.length}`);

  if (!todo.length) {
    console.log("[translate] 翻訳はすべて完了しています。");
    return;
  }

  const batches = [];
  for (let i = 0; i < todo.length; i += BATCH) batches.push(todo.slice(i, i + BATCH));
  console.log(`[translate] ${batches.length} バッチ × 最大 ${concurrency} 並列`);

  let done = 0;
  let failed = 0;

  const save = () =>
    fs.writeFileSync(CACHE, JSON.stringify(cache, null, 2) + "\n");

  async function worker(queue) {
    while (queue.length) {
      const batch = queue.shift();
      if (!batch) break;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const out = await translateBatch(cfg, batch);
          batch.forEach((en, i) => {
            cache[en] = out[i];
          });
          done += batch.length;
          save();
          process.stdout.write(`\r[translate] ${done}/${todo.length} 完了 (失敗 ${failed})   `);
          break;
        } catch (e) {
          if (attempt === 2) {
            failed += batch.length;
            console.error(`\n[translate] 失敗: ${batch[0].slice(0, 40)}… — ${e.message}`);
          } else {
            await new Promise(r => setTimeout(r, 1200 * (attempt + 1)));
          }
        }
      }
    }
  }

  const queue = [...batches];
  await Promise.all(Array.from({ length: concurrency }, () => worker(queue)));

  save();
  console.log(`\n[translate] 完了: ${done} 件翻訳 / ${failed} 件失敗 / キャッシュ ${Object.keys(cache).length} 件`);
}

await main();
