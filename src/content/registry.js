// このファイルは scripts/build-data.mjs が自動生成します。手で編集しないでください。
import nocturnes from "./exhibitions/nocturnes.json";
import seaAndLight from "./exhibitions/sea-and-light.json";
import quietInteriors from "./exhibitions/quiet-interiors.json";
import smallWorlds from "./exhibitions/small-worlds.json";
import faces from "./exhibitions/faces.json";
import index from "./exhibitions/index.json";

/** 受付ページ用（表紙・章立てのみ） */
export const exhibitions = index;

export const exhibitionIds = index.map(e => e.id);

/** 展示室の全データ（作品メタ込み） */
export const rooms = {
  "nocturnes": nocturnes,
  "sea-and-light": seaAndLight,
  "quiet-interiors": quietInteriors,
  "small-worlds": smallWorlds,
  "faces": faces,
};

export function getRoom(id) {
  return rooms[id] || null;
}

export function getExhibition(id) {
  return index.find(e => e.id === id) || null;
}

export function getNeighbours(id) {
  const i = index.findIndex(e => e.id === id);
  if (i < 0) return { prev: null, next: null };
  return { prev: index[i - 1] || null, next: index[i + 1] || null };
}
