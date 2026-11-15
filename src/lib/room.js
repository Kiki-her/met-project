/**
 * 展示室のレイアウト計算
 *
 * 作品の実寸（cm）× 係数で壁の上の大きさを決め、横一列に並べる。
 * 額装サイズを作品ごとに手で決めなくても、展示を JSON に足すだけで壁が伸びる。
 */

export const PX_PER_CM = 2.0;

const DEFAULTS = {
  pxPerCm: PX_PER_CM,
  /** 壁の左端の余白 */
  lead: 420,
  /** 壁の右端の余白 */
  tail: 420,
  /** 作品どうしの間隔 */
  gap: 190,
  /** 章と章のあいだ（壁の章題が入る） */
  chapterGap: 460,
  minW: 200,
  maxW: 560,
  /** 高さの上限（縦長の作品が画面を突き抜けないように） */
  maxH: 640,
};

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/**
 * @param {object} exhibition public/data/exhibitions/<id>.json
 * @returns {{items: Array, works: Array, totalWidth: number}}
 */
export function buildRoom(exhibition, options = {}) {
  const cfg = { ...DEFAULTS, ...options };
  const items = [];
  const works = [];
  let x = cfg.lead;

  (exhibition.chapters || []).forEach((chapter, ci) => {
    items.push({
      kind: "chapter",
      key: `ch-${ci}`,
      chapterIndex: ci,
      chapter,
      x,
      w: cfg.chapterGap,
    });
    x += cfg.chapterGap;

    (chapter.works || []).forEach(work => {
      const ratio = work.ratio && work.ratio > 0.2 ? work.ratio : 0.8;
      const realW = work.w && work.w > 5 ? work.w : null;

      // 実寸から幅を決め、上限で抑える。実寸が無い作品は中くらいの幅に。
      let w = realW ? clamp(realW * cfg.pxPerCm, cfg.minW, cfg.maxW) : 320;
      let h = w * ratio;
      if (h > cfg.maxH) {
        h = cfg.maxH;
        w = h / ratio;
      }

      const item = {
        kind: "work",
        key: `w-${work.id}`,
        work,
        chapterIndex: ci,
        chapter,
        x,
        w: Math.round(w),
        h: Math.round(h),
      };
      items.push(item);
      works.push(item);
      x += w + cfg.gap;
    });
  });

  // 壁の終端（次の展覧会への案内）
  let totalWidth;
  if (works.length) {
    const endW = cfg.tail + 320;
    items.push({ kind: "end", key: "end", x, w: endW });
    x += endW;
    totalWidth = Math.round(x);
  } else {
    totalWidth = Math.round(x + cfg.tail);
  }

  return { items, works, totalWidth, cfg };
}

/** 作品の中心 x 座標 */
export const centerOf = item => item.x + item.w / 2;

/** 指定した x にいるとき、いちばん近い作品 */
export function nearestWork(works, x) {
  if (!works.length) return null;
  let best = works[0];
  let bestD = Infinity;
  for (const w of works) {
    const d = Math.abs(centerOf(w) - x);
    if (d < bestD) {
      bestD = d;
      best = w;
    }
  }
  return best;
}

/** いま画面の中心にある章 */
export function chapterAt(works, x) {
  const w = nearestWork(works, x);
  return w ? w.chapterIndex : 0;
}

/**
 * 作品に「近づいた」ときの倍率。
 * 作品が画面の 84%（縦 78%）に収まる倍率を返す。
 */
export function focusZoom(item, viewW, viewH) {
  const targetW = viewW * 0.84;
  const targetH = viewH * 0.78;
  const z = Math.min(targetW / item.w, targetH / item.h);
  return clamp(z, 1.05, 6);
}

/**
 * 額装の種類を作品から推定する。
 * 制作年と部門だけで決めるので、作品ごとに指定しなくてよい。
 */
export function frameKind(work) {
  const year = Number(String(work.date || "").match(/\d{4}/)?.[0] || 0);
  const dept = work.dept || "";
  if (/Cloisters|Medieval|Islamic/i.test(dept)) return "gilt";
  if (/Modern/i.test(dept)) return "minimal";
  if (!year) return "gold";
  if (year < 1800) return "gilt"; // 金泥・濃い木
  if (year < 1880) return "walnut"; // 焦茶の木縁
  return "minimal"; // 白・細い縁
}

/** 章の見出し位置（章マーカーの中心） */
export const chapterCenter = item => item.x + item.w / 2;

/**
 * カメラ位置を壁の範囲内に収める。
 * 壁が画面より狭いときは中央に固定する。
 */
export function clampCam(v, viewW, totalW, z) {
  const half = viewW / (2 * z);
  if (totalW <= viewW / z) return totalW / 2;
  return Math.min(totalW - half, Math.max(half, v));
}
