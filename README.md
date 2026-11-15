# 夜の美術館 — The Night Museum

自宅にいながら、灯りを落とした美術館の展示室を歩くブラウザアプリ。
[The Metropolitan Museum of Art](https://www.metmuseum.org/) の
[Open Access（CC0）](https://www.metmuseum.org/about-the-met/policies-and-documents/open-access) 作品を使用。

スマートフォン・タブレット・PC のすべてで動作する 2.5D 壁面ギャラリー。

---

## 体験

- **空間** — 壁・巾木・天井の光・スポットライト・額装。`perspective` による 2.5D で「壁の前に立つ」感覚を作る
- **順路** — キュレーションされた 5 つの展覧会。各 3 章、章題と小さな解説つき
- **深度** — 作品をタップすると寄る（カメラがズーム）。さらにスクロールで拡大、高精細画像を遅延取得
- **静けさ** — 環境音をブラウザ内で合成（音源ファイルなし）。3 秒無操作で HUD が消える
- **同行** — 展示室ごとの共有リンクと QR コード

日本語 / 英語の切り替え、動きの抑制、文字サイズ変更に対応。

## 展示

| 展覧会 | 章 | 作品 |
| --- | --- | --- |
| 夜想曲 / Nocturnes | 3 | 11 |
| 海と光 / Sea and Light | 3 | 9 |
| 室内の静けさ / Quiet Interiors | 3 | 8 |
| 静物という小宇宙 / Still Life, a Small Cosmos | 2 | 6 |
| 顔 / Faces | 3 | 8 |

---

## 開発

```bash
npm install
npm run data     # 展示データを生成（data/fetchedData.js → src/content, public/data）
npm run dev
npm run build    # data 生成 + 静的エクスポート（out/）
```

### 構成

```
data/
  fetchedData.js          The Met Open Access のダンプ（3,116件・ビルド入力）
  image-overrides.json    画像URLの差し替え（verify-images が生成）
scripts/
  curation.mjs            展覧会の定義（章・作品ID・解説文）← 編集するのはここ
  build-data.mjs          静的JSON生成とレジストリ自動生成
  verify-images.mjs       Met側で変わった画像URLの検出と修復
src/
  app/                    受付（/）と展示室（/g/[exhibitionId]）
  components/             Entry / RoomShell / WorkPanel / ShareSheet ほか
  content/                自動生成（registry.js, exhibitions/index.json）
  lib/                    i18n・設定・展示室のレイアウト計算・環境音・読み上げ
public/data/catalog.json  全作品カタログ（将来の検索用）
```

### 展示を追加する

`scripts/curation.mjs` に展覧会を追加し、`npm run data` するだけ。
壁の長さ・額縁の種類・作品サイズは実寸（cm）と制作年から自動で決まるため、
作品ごとの配置作業は不要。

### 画像URLの保守

The Met は画像ファイル名を後から差し替えることがある（例: `DT4626.jpg` → `DP-31997-001-NEW.jpg`）。

```bash
npm run verify-images -- --check   # 404 を報告
npm run verify-images              # API から最新URLを取得し data/image-overrides.json に保存
```

## 技術メモ

- Next.js 13 App Router / `output: "export"`（完全静的。Netlify・Cloudflare Pages・GitHub Pages に置ける）
- 作品データはページ単位のチャンクに分割。初期 JS は約 95KB、展示室 約 109KB
  （旧実装は 8.8MB のデータをクライアントで import していた）
- 環境音は Web Audio API で生成（ブラウン／帯域ノイズ＋コンボリューション残響＋時折の館のきしみ）
- 音声ガイドは SpeechSynthesis。原稿は作品メタデータから組み立てるため音声ファイル不要
- カメラは `requestAnimationFrame` で `transform` を直接更新（React の再描画を挟まない）
- 設定は localStorage、初回描画前にインラインスクリプトで適用（ちらつき防止）

## デプロイ

`npm run build` で `out/` が生成されるので、静的ホスティングにそのまま置ける。
`trailingSlash: true` のため、`/g/nocturnes/` のような末尾スラッシュ付きURLで配信すること。
Node は 20 以上（`.nvmrc` で固定）。

### Netlify（設定済み）

`netlify.toml` を置いてあるので、リポジトリを Netlify に接続するだけでよい。

- Build command: `npm run build`（自動）
- Publish directory: `out`（自動）
- 404 は `out/404.html` がそのまま使われる
- 無料枠で足りる（すべて静的、サーバー処理なし）

### Cloudflare Pages

同じ `out/` をそのまま使える。ビルド設定のみ指定する。

- Framework preset: `Next.js (Static HTML Export)`
- Build command: `npm run build`
- Build output directory: `out`
- 環境変数: `NODE_VERSION=20`

### GitHub Pages

`out/` を gh-pages ブランチに置けば動くが、リポジトリ名のパス配下
（`/met-project/`）になるため `next.config.js` に `basePath` と `assetPrefix` の追加が必要。
Netlify / Cloudflare Pages のほうが設定が少なくて済む。

### 公開前の確認

```bash
npm run build
npx serve out          # ローカルで本番ビルドを確認
npm run verify-images -- --check   # 画像URLの404がないか
```

## クレジット

Images and metadata: The Metropolitan Museum of Art, Open Access (CC0).
