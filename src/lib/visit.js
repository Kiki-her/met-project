"use client";

/**
 * 「このタブで館に入ったか」の記録。
 *
 * 扉を出すかどうかの判定にだけ使う。localStorage ではなく sessionStorage なのは、
 * 欲しい粒度が「訪問」ではなく「このタブでの滞在」だから。
 *
 * - 新しくタブを開く／前回から時間をおいて来る → 記録なし → 扉を出す
 * - 展示を終えて別の展示へ移る、作品から受付へ戻る → 記録あり → 扉は出さない
 * - 同じタブでの再読み込み → 記録あり → 扉は出さない
 *
 * サイトから離れたら（タブを閉じたら）記録は消えるので、次の訪問ではまた扉が出る。
 *
 * なお、初回描画のちらつきを避けるため、同じキーを layout.js のインラインスクリプトが
 * 読んで html[data-entered="1"] を立てる。キー文字列を変えるときは両方そろえること。
 */
export const SESSION_KEY = "night-museum.session";

/** このタブではもう入館済みか（プライベートモード等で失敗したら「未入館」扱い） */
export function hasEntered() {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

/** 入館したことを記録する（扉を開けたとき／展示室に直接来たとき） */
export function markEntered() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(SESSION_KEY, "1");
  } catch {
    /* プライベートモードなどで書けない場合は扉が毎回出るだけなので害はない */
  }
}
