"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useSettings } from "@/components/Providers";
import { buildRoom, centerOf, clampCam, frameKind, nearestWork } from "@/lib/room";
import { DEFAULTS, saveProgress } from "@/lib/settings";
import { setAmbienceVolume, startAmbience, stopAmbience } from "@/lib/sound";
import { markEntered } from "@/lib/visit";
import WorkPanel from "./WorkPanel";
import ShareSheet from "./ShareSheet";
import SoundPrompt from "./SoundPrompt";
import styles from "./RoomShell.module.css";

const SOUND_KEY = "night-museum.soundAsked";

export default function RoomShell({ room, neighbours }) {
  const { t, L, T, lang } = useI18n();
  const { settings, update } = useSettings();
  const router = useRouter();

  const stageRef = useRef(null);
  const worldRef = useRef(null);
  const tiltRef = useRef(null);
  /** 自動スライドまでの残り時間を塗る細い線 */
  const autoBarRef = useRef(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  /** 画面の高さに応じて作品の実寸スケールを変える（狭い画面では壁を広く見せる） */
  const layout = useMemo(() => {
    if (!size.w || !size.h) return null;
    const pxPerCm = Math.min(2.3, Math.max(1.15, 2 * (size.h / 820)));
    return buildRoom(room, { pxPerCm, maxH: Math.round(size.h * 0.6) });
  }, [room, size.w, size.h]);

  const works = useMemo(() => (layout ? layout.works : []), [layout]);
  const totalWidth = layout ? layout.totalWidth : 0;

  /** カメラ（React state にせず、rAF で直接 transform を書く） */
  const cam = useRef({
    x: 0,
    tx: 0,
    z: 1,
    tz: 1,
    oy: 0,
    toy: 0,
    dragging: false,
    startX: 0,
    startCam: 0,
    startY: 0,
    moved: 0,
    ready: false,
  });

  const [focus, setFocus] = useState(null);
  const [hud, setHud] = useState({ index: 0, chapter: 0 });
  const [soundOn, setSoundOn] = useState(false);
  const [askSound, setAskSound] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  /** 共有シートが作品1点を指しているか（false なら展示室まるごと） */
  const [shareWork, setShareWork] = useState(false);
  const [hiRes, setHiRes] = useState(false);
  /** 展示室を移るときの暗転 — entering | off | leaving */
  const [veil, setVeil] = useState("entering");

  /** 触れている指（ピンチ用）。pointerId → 位置 */
  const pointers = useRef(new Map());
  /** 2本指の拡大開始時の状態 */
  const pinch = useRef(null);
  /** URL の ?work= を一度だけ処理するための番人 */
  const openedFromUrl = useRef(false);

  const lastIndex = useRef(-1);
  const totalRef = useRef(0);
  totalRef.current = totalWidth;

  /* ---------- 自動スライド（放置検知） ----------
     展示室は「開いたまま眺める」場所でもある。何秒か触られなければ
     静かに次の作品へ移る。少しでも操作があれば最初から数え直す。 */
  const autoAt = useRef(0); // 最後に手が触れた時刻
  const autoRef = useRef({ on: false, sec: DEFAULTS.autoTourSec });
  /** rAF ループは毎フレーム走るので、状態は ref 経由で読む（再生成を避ける） */
  const stepRef = useRef(() => {});
  const indexRef = useRef(0);
  const lenRef = useRef(0);
  const blockRef = useRef(false);
  const veilRef = useRef("off");
  indexRef.current = hud.index;
  lenRef.current = works.length;
  blockRef.current = shareOpen || askSound;
  veilRef.current = veil;

  /** 何か操作があったら計り直す */
  const bump = useCallback(() => {
    autoAt.current = performance.now();
  }, []);

  /* ---------- 計測 ---------- */
  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      setSize({ w: Math.round(r.width), h: Math.round(r.height) });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("orientationchange", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("orientationchange", measure);
    };
  }, []);

  const clampX = useCallback((v, z) => clampCam(v, size.w, totalRef.current, z || 1), [size.w]);

  /* ---------- 変形 ---------- */
  const apply = useCallback(() => {
    const w = worldRef.current;
    if (!w || !size.w) return;
    const s = cam.current;
    const tx = size.w / 2 - s.x * s.z;
    const ty = (size.h / 2) * (1 - s.z) + s.oy;
    w.style.transform = `translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, 0) scale(${s.z.toFixed(4)})`;
  }, [size.w, size.h]);

  /* ---------- 初期位置 ---------- */
  useEffect(() => {
    if (!layout || !works.length) return;
    // 展示室を移ると同じコンポーネントが再利用されるため、
    // 「まだ初期化していない」ではなく「前の部屋と違う」で判定する。
    // 画面サイズは判定に入れない（リサイズのたびに先頭へ戻ってしまう）。
    if (cam.current.roomId === room.id) return;
    const fresh = cam.current.roomId === undefined;
    cam.current.roomId = room.id;
    const first = works[0];
    cam.current.x = centerOf(first);
    cam.current.tx = cam.current.x;
    cam.current.z = 1;
    cam.current.tz = 1;
    cam.current.oy = 0;
    cam.current.toy = 0;
    cam.current.ready = true;
    lastIndex.current = 0;
    setHud({ index: 0, chapter: first.chapterIndex });
    setFocus(null);
    setHiRes(false);
    apply();
    // 部屋が変わったときだけ幕を開ける（初回はマウント時の effect が担当）
    if (!fresh) {
      const t = window.setTimeout(() => setVeil("off"), 60);
      return () => window.clearTimeout(t);
    }
    return undefined;
  }, [layout, works, apply, room.id]);

  /* ---------- 共有された作品（?work=<id>）から開く ---------- */
  useEffect(() => {
    if (!works.length || openedFromUrl.current) return;
    let id = null;
    try {
      id = new URLSearchParams(window.location.search).get("work");
    } catch {
      id = null;
    }
    openedFromUrl.current = true;
    if (!id) return;
    const item = works.find(w => String(w.work.id) === String(id));
    if (item) {
      // 幕が上がるのを待ってから、その作品の前に立つ
      const timer = window.setTimeout(() => openWork(item), 420);
      return () => window.clearTimeout(timer);
    }
    return undefined;
    // openWork は毎回作り直されるが、URL の処理は一度きりなので依存に入れない
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [works]);

  /* 画面サイズが変わったら、視点があらぬ方向を向かないよう壁の中に収め直す */
  useEffect(() => {
    if (!cam.current.ready || !size.w) return;
    cam.current.x = clampX(cam.current.x, cam.current.z);
    cam.current.tx = clampX(cam.current.tx, cam.current.tz);
    apply();
  }, [size.w, size.h, apply, clampX]);

  /* ---------- ループ ---------- */
  useEffect(() => {
    let raf = 0;
    let lastHud = 0;
    let lastAuto = 0;
    const tick = now => {
      const s = cam.current;
      if (!s.ready) {
        raf = requestAnimationFrame(tick);
        return;
      }
      s.x += (s.tx - s.x) * 0.14;
      s.z += (s.tz - s.z) * 0.12;
      s.oy += (s.toy - s.oy) * 0.12;
      apply();

      if (now - lastHud > 100) {
        lastHud = now;
        const near = nearestWork(works, s.x);
        if (near) {
          const idx = works.indexOf(near);
          if (idx !== lastIndex.current) {
            lastIndex.current = idx;
            setHud({ index: idx, chapter: near.chapterIndex });
          }
        }
      }

      /* 自動スライド — 無操作のまま一定時間が過ぎたら次の作品へ */
      if (now - lastAuto > 200) {
        lastAuto = now;
        const a = autoRef.current;
        const gated =
          !a.on ||
          blockRef.current || // 共有シート・音の確認中は止める
          veilRef.current !== "off" || // 暗転中は動かさない
          s.dragging;
        if (gated) {
          autoAt.current = now; // 止まっている間は数えない
        } else if (indexRef.current >= lenRef.current - 1) {
          autoAt.current = now; // 最後の作品で止まる
        } else if (!autoAt.current) {
          autoAt.current = now; // 初回はここから数えはじめる
        } else {
          const elapsed = now - autoAt.current;
          const p = Math.min(1, elapsed / (a.sec * 1000));
          // 残り時間を細い線で示す（触れば 0 に戻る）
          const bar = autoBarRef.current;
          if (bar) bar.style.transform = `scaleX(${p.toFixed(3)})`;
          if (elapsed >= a.sec * 1000) {
            autoAt.current = now;
            stepRef.current(1);
          }
        }
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [apply, works]);

  /* ---------- 入館の記録 ---------- */
  // 共有リンクから展示室へ直接来た場合も「もう館の中にいる」とみなす。
  // そうしないと、受付へ戻ったときに扉が出てしまう。
  useEffect(() => {
    markEntered();
  }, []);

  /* ---------- 進捗 ---------- */
  useEffect(() => {
    if (!works.length) return;
    saveProgress({
      exhibitionId: room.id,
      index: hud.index,
      chapter: hud.chapter,
      at: Date.now(),
    });
  }, [room.id, hud.index, hud.chapter, works.length]);

  /* ---------- 環境音 ---------- */
  useEffect(() => {
    let asked = false;
    try {
      asked = window.localStorage.getItem(SOUND_KEY) === "1";
    } catch {
      asked = false;
    }
    if (settings.sound && !asked) setAskSound(true);
    return () => stopAmbience(0.4);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const volume = typeof settings.volume === "number" ? settings.volume : 0.6;

  const enableSound = useCallback(async () => {
    const ok = await startAmbience(volume);
    setSoundOn(ok);
    try {
      window.localStorage.setItem(SOUND_KEY, "1");
    } catch {
      /* noop */
    }
    return ok;
  }, [volume]);

  const toggleSound = useCallback(async () => {
    if (soundOn) {
      stopAmbience(0.5);
      setSoundOn(false);
      return;
    }
    await enableSound();
  }, [enableSound, soundOn]);

  useEffect(() => {
    if (!soundOn) return;
    setAmbienceVolume(settings.sound ? volume : 0, 0.45);
  }, [settings.sound, volume, soundOn]);

  /* ---------- 自動スライドの設定を反映 ---------- */
  useEffect(() => {
    const on = settings.autoTour !== false;
    const sec = Math.max(4, Number(settings.autoTourSec) || DEFAULTS.autoTourSec);
    autoRef.current = { on, sec };
    bump(); // 設定を変えた時点から数え直す
    const bar = autoBarRef.current;
    if (bar) bar.style.transform = "scaleX(0)";
  }, [settings.autoTour, settings.autoTourSec, bump]);

  // 部屋が変わったら、また最初から
  useEffect(() => {
    bump();
  }, [room.id, bump]);

  /* ---------- 寄る／戻る ---------- */
  const geometry = useCallback(
    item => {
      const { w, h } = size;
      const narrow = w < 900;
      const panelW = narrow ? 0 : Math.min(440, w * 0.44);
      const panelH = narrow ? Math.min(h * 0.5, 440) : 0;
      const availW = w - panelW;
      const availH = h - panelH;
      let z = Math.min((availW * 0.9) / item.w, (availH * 0.8) / item.h);
      z = Math.min(6, Math.max(1.1, z));
      return {
        z,
        x: centerOf(item) + panelW / (2 * z),
        oy: -panelH / 2,
        panelW,
        panelH,
      };
    },
    [size]
  );

  const snapTo = useCallback(
    index => {
      const item = works[Math.max(0, Math.min(works.length - 1, index))];
      if (!item) return;
      cam.current.tx = clampX(centerOf(item), 1);
      cam.current.tz = 1;
      cam.current.toy = 0;
      lastIndex.current = index;
      setHud({ index, chapter: item.chapterIndex });
      setHiRes(false);
    },
    [works, clampX]
  );

  const openWork = useCallback(
    (item, { keepHiRes = false } = {}) => {
      const idx = works.indexOf(item);
      if (idx >= 0) {
        lastIndex.current = idx;
        setHud({ index: idx, chapter: item.chapterIndex });
      }
      const g = geometry(item);
      cam.current.tx = clampX(g.x, g.z);
      cam.current.tz = g.z;
      cam.current.toy = g.oy;
      if (!keepHiRes) setHiRes(false);
      setFocus(item);
    },
    [works, geometry, clampX]
  );

  const closeWork = useCallback(() => {
    setFocus(null);
    cam.current.tz = 1;
    cam.current.toy = 0;
    setHiRes(false);
  }, []);

  const step = useCallback(
    dir => {
      const next = Math.max(0, Math.min(works.length - 1, hud.index + dir));
      if (focus) {
        const item = works[next];
        if (item) openWork(item);
      } else {
        snapTo(next);
      }
    },
    [focus, hud.index, works, openWork, snapTo]
  );

  // rAF ループ（依存を持たない effect）から最新の step を呼ぶための橋渡し
  stepRef.current = step;

  /**
   * 拡大／縮小。
   *
   * ピンチでも拡大できるが、指を離した瞬間に詳細が開くのが邪魔だったので
   * 拡大だけを担うボタンを置いた。1回あたり 1.35 倍。
   * 壁を見ているときは壁ごと、作品に寄っているときは作品をさらに寄る。
   * 縮小して等倍に戻ったら、寄った状態は解除する。
   */
  const zoomBy = useCallback(
    dir => {
      const s = cam.current;
      const maxZ = focus ? geometry(focus).z * 2.6 : 3.2;
      const next = Math.min(maxZ, Math.max(1, s.tz * (dir > 0 ? 1.35 : 1 / 1.35)));
      // 等倍まで戻したら、寄った状態は解除して壁に戻す。
      // そうしないと「縮小したのに作品の前から動けない」ように見える。
      if (next <= 1.02 && focus) {
        closeWork();
        bump();
        return;
      }
      s.tz = next;
      // 拡大すると見える範囲が狭まるので、壁の外を向かないよう収め直す
      s.tx = clampX(s.tx, next);
      if (next > 1.9) setHiRes(true);
      if (next <= 1.02) setHiRes(false);
      bump();
    },
    [focus, geometry, clampX, bump, closeWork]
  );

  /* ---------- 入力 ---------- */
  const settleTimer = useRef(null);

  const onWheel = useCallback(
    e => {
      e.preventDefault();
      bump();
      const s = cam.current;
      const d = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;

      if (focus) {
        // 寄ったあとは、ホイールでさらに拡大できる
        const g = geometry(focus);
        const maxZ = g.z * 2.6;
        s.tz = Math.min(maxZ, Math.max(1.05, s.tz * (1 - d * 0.0016)));
        if (s.tz > 1.9) setHiRes(true);
        return;
      }

      s.tx = clampX(s.tx + d * 1.05, s.z);
      if (settleTimer.current) window.clearTimeout(settleTimer.current);
      settleTimer.current = window.setTimeout(() => {
        const near = nearestWork(works, s.tx);
        if (near) s.tx = clampX(centerOf(near), 1);
      }, 260);
    },
    [focus, geometry, works, clampX, bump]
  );

  const onPointerDown = useCallback(e => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    bump();
    const s = cam.current;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // 2本目の指が触れたら、ドラッグをやめてピンチに切り替える
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      s.dragging = false;
      pinch.current = {
        dist: Math.hypot(a.x - b.x, a.y - b.y) || 1,
        z: s.tz,
        // 2本の指の中点を、画面上のどこで拡大するか
        midX: (a.x + b.x) / 2,
      };
      if (settleTimer.current) window.clearTimeout(settleTimer.current);
      return;
    }

    s.dragging = true;
    s.startX = e.clientX;
    s.startY = e.clientY;
    s.startCam = s.tx;
    s.moved = 0;
    if (settleTimer.current) window.clearTimeout(settleTimer.current);
  }, [bump]);

  const onPointerMove = useCallback(
    e => {
      const s = cam.current;
      const { w } = size;

      if (pointers.current.has(e.pointerId)) {
        pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      }

      // ---- ピンチ拡大（2本指）----
      if (pinch.current && pointers.current.size >= 2) {
        const [a, b] = [...pointers.current.values()];
        const dist = Math.hypot(a.x - b.x, a.y - b.y) || 1;
        const scale = dist / pinch.current.dist;
        const maxZ = focus ? geometry(focus).z * 2.6 : 3.2;
        s.tz = Math.min(maxZ, Math.max(1, pinch.current.z * scale));
        if (s.tz > 1.9) setHiRes(true);
        bump();
        return;
      }

      // 視点の傾き（マウスの位置でわずかに首を振る）
      if (!focus && tiltRef.current && w) {
        const nx = e.clientX / w - 0.5;
        const deg = settings.motion === "reduced" ? 0 : nx * -3.6;
        tiltRef.current.style.transform = `rotateY(${deg.toFixed(2)}deg)`;
      }

      if (!s.dragging) return;
      // 長く引きずっている間も「反応あり」とみなす（ホバーだけでは数え直さない）
      bump();
      const dx = e.clientX - s.startX;
      const dy = e.clientY - s.startY;
      s.moved = Math.max(s.moved, Math.abs(dx), Math.abs(dy));
      s.tx = clampX(s.startCam - dx, s.z);
    },
    [focus, size, settings.motion, clampX, bump, geometry]
  );

  const onPointerUp = useCallback(
    e => {
      bump();
      const s = cam.current;
      if (e && e.pointerId != null) pointers.current.delete(e.pointerId);

      // ピンチの指が離れたら、拡大率だけ確定して終わる。
      // ここで作品を開くと「拡大したら詳細が被さる」ことになり、せっかく寄った絵が
      // 隠れてしまう。拡大は拡大のまま、開くのは明示的なタップ／クリックに任せる。
      if (pinch.current && pointers.current.size < 2) {
        pinch.current = null;
        s.moved = 0;
        return;
      }

      if (!s.dragging) return;
      s.dragging = false;
      if (s.moved < 8) return;
      const near = nearestWork(works, s.tx);
      if (near) {
        const g = focus && focus.work.id === near.work.id ? geometry(near) : null;
        s.tx = clampX(g ? g.x : centerOf(near), g ? g.z : 1);
      }
    },
    [works, focus, geometry, clampX, bump]
  );

  const onPointerCancel = useCallback(
    e => {
      if (e && e.pointerId != null) pointers.current.delete(e.pointerId);
      pinch.current = null;
      cam.current.dragging = false;
    },
    []
  );

  /** ドラッグ直後のクリックで作品が開いてしまうのを防ぐ */
  const onClickCapture = useCallback(
    e => {
      bump();
      if (cam.current.moved > 8) {
        e.preventDefault();
        e.stopPropagation();
        cam.current.moved = 0;
      }
    },
    [bump]
  );

  /* 別のタブを見ているあいだは進めない。戻ってきたら数え直す */
  useEffect(() => {
    const onVis = () => {
      if (!document.hidden) bump();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [bump]);

  /* ---------- キーボード ---------- */
  const dismissSoundPrompt = useCallback(() => setAskSound(false), []);

  useEffect(() => {
    const onKey = e => {
      if (e.key === "Escape") {
        if (shareOpen) return setShareOpen(false);
        if (askSound) return dismissSoundPrompt();
        if (focus) return closeWork();
        return;
      }
      if (shareOpen || askSound) return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        step(1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        step(-1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focus, shareOpen, askSound, step, closeWork, dismissSoundPrompt]);

  const acceptSound = useCallback(async () => {
    setAskSound(false);
    update({ sound: true });
    await enableSound();
  }, [enableSound, update]);

  const declineSound = useCallback(() => {
    setAskSound(false);
    update({ sound: false });
    try {
      window.localStorage.setItem(SOUND_KEY, "1");
    } catch {
      /* noop */
    }
  }, [update]);

  /* ---------- 展示室の移動（暗転してから次の部屋へ）---------- */

  // 入館時：真っ暗な状態から明るくなるまで待つ
  useEffect(() => {
    const t = window.setTimeout(() => setVeil("off"), 60);
    return () => window.clearTimeout(t);
  }, []);

  const goTo = useCallback(
    href => {
      // 動きを控えめにしている場合は暗転を挟まず、そのまま移る
      if (settings.motion === "reduced") {
        router.push(href);
        return;
      }
      setFocus(null);
      setShareOpen(false);
      setVeil("leaving");
      // 幕が下りきるのを待ってから遷移する（CSS の transition と揃える）
      window.setTimeout(() => {
        router.push(href);
        setVeil("entering");
        // 何らかの理由で次の部屋が描画されなかった場合に、
        // 画面が真っ暗のまま固まらないよう必ず幕を開ける
        window.setTimeout(() => setVeil("off"), 1600);
      }, 620);
    },
    [router, settings.motion]
  );

  const chapter = room.chapters[hud.chapter] || room.chapters[0];
  const progress = works.length ? Math.round(((hud.index + 1) / works.length) * 100) : 0;
  const current = works[hud.index];
  /** 自動スライドが「いま働きうる状態か」。最後の作品では止まるので線も引かない */
  const autoOn = settings.autoTour !== false && hud.index < works.length - 1;

  return (
    <div className={styles.shell}>
      {/* 部屋の空気 */}
      <div className={styles.atmosphere} aria-hidden="true">
        <span className={styles.ceiling} />
        <span className={styles.floorGlow} />
        <span className={styles.vignette} />
      </div>

      {/* 展示室を移るときの暗転。幕が下りてから次の部屋へ */}
      <div className={styles.veil} data-state={veil} aria-hidden="true">
        <span className={styles.veilText}>
          {neighbours && neighbours.next && veil === "leaving"
            ? L(neighbours.next.title)
            : ""}
        </span>
      </div>

      <div
        className={styles.viewport}
        ref={stageRef}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onClickCapture={onClickCapture}
        data-focus={focus ? "on" : "off"}
      >
        <div className={styles.tilt} ref={tiltRef}>
          {layout ? (
            <div className={styles.world} ref={worldRef} style={{ width: totalWidth }}>
              <span className={styles.wall} aria-hidden="true" />
              <span className={styles.baseboard} aria-hidden="true" />

              {layout.items.map(item => {
                if (item.kind === "chapter") {
                  return (
                    <div
                      key={item.key}
                      className={styles.chapterMark}
                      style={{ left: item.x, width: item.w }}
                      data-lang={lang}
                    >
                      <span className={styles.chapterNum}>
                        {String(item.chapterIndex + 1).padStart(2, "0")}
                      </span>
                      <span
                        className={`${styles.chapterName} ${
                          lang === "en" ? styles.chapterNameLatin : ""
                        }`}
                      >
                        {L(item.chapter.title)}
                      </span>
                      <span className={styles.chapterRule} aria-hidden="true" />
                    </div>
                  );
                }
                if (item.kind === "end") {
                  return (
                    <div key={item.key} className={styles.endMark} style={{ left: item.x, width: item.w }}>
                      <span className={styles.endRule} aria-hidden="true" />
                      <p className={styles.endText}>{t("room.endOfRoom")}</p>
                      {neighbours && neighbours.next ? (
                        <Link
                          href={`/g/${neighbours.next.id}/`}
                          className={styles.endLink}
                          onClick={e => {
                            e.preventDefault();
                            goTo(`/g/${neighbours.next.id}/`);
                          }}
                        >
                          {t("room.seeNext")}
                          <span className={styles.endArrow} aria-hidden="true">
                            →
                          </span>
                        </Link>
                      ) : (
                        <Link
                          href="/"
                          className={styles.endLink}
                          onClick={e => {
                            e.preventDefault();
                            goTo("/");
                          }}
                        >
                          {t("room.exit")}
                          <span className={styles.endArrow} aria-hidden="true">
                            →
                          </span>
                        </Link>
                      )}
                    </div>
                  );
                }
                return (
                  <Frame
                    key={item.key}
                    item={item}
                    lang={lang}
                    title={T(item.work)}
                    active={!!focus && focus.work.id === item.work.id}
                    onOpen={() => openWork(item)}
                    onFocus={() => {
                      if (!focus) snapTo(works.indexOf(item));
                    }}
                  />
                );
              })}
            </div>
          ) : null}
        </div>
      </div>

      {/* ---------- HUD ---------- */}
      <header className={styles.hudTop}>
        <Link
          href="/"
          className={styles.iconLink}
          aria-label={t("room.exit")}
          onClick={e => {
            e.preventDefault();
            goTo("/");
          }}
        >
          <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true" fill="none">
            <path
              d="M10 2.5L4.5 8l5.5 5.5"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className={styles.iconLabel}>{t("room.exit")}</span>
        </Link>

        <div className={styles.hudCenter}>
          <span className={styles.hudEyebrow}>{t("room.exhibition")}</span>
          <h1 className={styles.hudTitle}>{L(room.title)}</h1>
        </div>

        <div className={styles.hudActions}>
          <button
            type="button"
            className={styles.iconBtn}
            onClick={toggleSound}
            aria-label={soundOn ? t("room.soundOn") : t("room.soundOff")}
            aria-pressed={soundOn}
          >
            {soundOn ? <IconSound /> : <IconMute />}
          </button>
          <button
            type="button"
            className={styles.iconBtn}
            onClick={() => {
              // ヘッダーの共有は展示室まるごと
              setShareWork(false);
              setShareOpen(true);
            }}
            aria-label={t("room.shareCta")}
          >
            <IconShare />
          </button>
        </div>
      </header>

      <div className={styles.chapterBadge} data-dim={focus ? "on" : "off"}>
        <span className={styles.chapterBadgeNum}>{t("room.chapter", { n: hud.chapter + 1 })}</span>
        <span className={styles.chapterBadgeName}>{L(chapter?.title)}</span>
      </div>

      {/*
        拡大／縮小。
        ピンチでも拡大できるが、指を離した瞬間に詳細が開くと、せっかく寄った絵が
        隠れてしまう。拡大だけを担う明示的なボタンを置いて、
        「寄る」と「開く」を別の操作に分ける。
      */}
      <div className={styles.zoomBtns} data-dim={focus ? "on" : "off"}>
        <button
          type="button"
          className={styles.zoomBtn}
          onClick={() => zoomBy(1)}
          aria-label={t("room.zoomIn")}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true" fill="none">
            <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </button>
        <button
          type="button"
          className={styles.zoomBtn}
          onClick={() => zoomBy(-1)}
          aria-label={t("room.zoomOut")}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true" fill="none">
            <path d="M3 8h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div className={styles.stepBtns} data-dim={focus ? "on" : "off"}>
        <button type="button" className={styles.stepBtn} onClick={() => step(-1)} aria-label={t("room.prev")}>
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" fill="none">
            <path
              d="M9.5 3L5 8l4.5 5"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <button type="button" className={styles.stepBtn} onClick={() => step(1)} aria-label={t("room.next")}>
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" fill="none">
            <path
              d="M6.5 3L11 8l-4.5 5"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      <footer className={styles.hudBottom} data-dim={focus ? "on" : "off"}>
        <div className={styles.rail}>
          <span className={styles.railFill} style={{ width: `${progress}%` }} />
        </div>
        {/* 自動スライドまでの残り。触れると伸びきって、また縮みはじめる */}
        <div className={styles.autoRail} aria-hidden="true" data-on={autoOn ? "on" : "off"}>
          <span className={styles.autoFill} ref={autoBarRef} />
        </div>
        <div className={styles.railMeta}>
          <span className={styles.railHint}>{t("room.walkHint")}</span>
          <span className={styles.railCount}>
            {t("room.of", { a: hud.index + 1, b: works.length })}
          </span>
        </div>
      </footer>

      {/* スクリーンリーダー向けの現在位置 */}
      <p className="sr-only" aria-live="polite">
        {current ? `${T(current.work)} — ${current.work.artist}` : ""}
      </p>

      <WorkPanel
        work={focus ? focus.work : null}
        open={!!focus}
        hiRes={hiRes}
        onClose={closeWork}
        onPrev={() => step(-1)}
        onNext={() => step(1)}
        onShare={() => {
          setShareWork(true);
          setShareOpen(true);
        }}
        chapterTitle={focus ? L(focus.chapter.title) : ""}
        chapterNote={focus ? L(focus.chapter.note) : ""}
        hasPrev={hud.index > 0}
        hasNext={hud.index < works.length - 1}
      />

      <ShareSheet
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        exhibition={room}
        work={shareWork && focus ? focus.work : null}
      />

      {askSound ? <SoundPrompt onAccept={acceptSound} onDecline={declineSound} /> : null}
    </div>
  );
}

/* ============================================================
   壁に掛かった作品
   ============================================================ */
function Frame({ item, active, onOpen, onFocus, lang, title }) {
  const [failed, setFailed] = useState(false);
  const kind = frameKind(item.work);

  return (
    <div
      className={styles.frameSlot}
      style={{ left: item.x, width: item.w, ["--h"]: `${item.h}px` }}
      data-kind={kind}
      data-active={active ? "on" : "off"}
    >
      <span className={styles.spot} aria-hidden="true" />
      <button
        type="button"
        className={styles.frame}
        onClick={onOpen}
        onFocus={onFocus}
        style={{ width: item.w, height: item.h }}
        aria-label={`${title}${item.work.artist ? ` — ${item.work.artist}` : ""}`}
      >
        <span className={styles.frameInner}>
          {failed ? (
            <span className={styles.noImage} aria-hidden="true" />
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={item.work.img}
              alt={title}
              className={styles.frameImg}
              loading="lazy"
              decoding="async"
              draggable="false"
              onError={() => setFailed(true)}
            />
          )}
          <span className={styles.glass} aria-hidden="true" />
        </span>
      </button>
      <span className={styles.label}>
        <span className={styles.labelTitle} lang={lang}>
          {title}
        </span>
        <span className={styles.labelMeta}>
          {[item.work.artist, item.work.date].filter(Boolean).join(", ")}
        </span>
      </span>
    </div>
  );
}

/* ---------- アイコン ---------- */
function IconSound() {
  return (
    <svg width="17" height="17" viewBox="0 0 20 20" aria-hidden="true" fill="none">
      <path d="M4 7.5h2.5L10 4.5v11L6.5 12.5H4z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M13 7c1.2 1.1 1.2 4.9 0 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M15.4 5c2 2 2 8 0 10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity="0.55" />
    </svg>
  );
}

function IconMute() {
  return (
    <svg width="17" height="17" viewBox="0 0 20 20" aria-hidden="true" fill="none">
      <path d="M4 7.5h2.5L10 4.5v11L6.5 12.5H4z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M13.4 7.8l3.8 4.4M17.2 7.8l-3.8 4.4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function IconShare() {
  return (
    <svg width="17" height="17" viewBox="0 0 20 20" aria-hidden="true" fill="none">
      <circle cx="15" cy="5" r="2.1" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="5" cy="10" r="2.1" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="15" cy="15" r="2.1" stroke="currentColor" strokeWidth="1.3" />
      <path d="M7 9l6-3M7 11l6 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
