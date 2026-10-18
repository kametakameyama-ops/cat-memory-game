# 今日の猫チャレンジ

毎日20匹の猫に会える、写真の神経衰弱。ブラウザで遊ぶWebアプリ

## 遊び方の仕様

- 同じ写真のカードを2枚そろえる。盤面は20ペア（40枚）
- 画面が縦長なら5列×8行、横長なら8列×5行に自動で並べる
- 初心者モード10分／通常モード5分。タイマーは1枚目をめくったときに動き出す
- そろったカードはタップで拡大（見ている間はタイマー停止）
- 何度でも遊べる。毎回カードの配置はシャッフル
- 終了後は「今日の猫アルバム」で20匹全員を見られる（会えなかった猫も）
- お気に入りの1匹を写真付きでシェアできる
- スコアは競わない。かわいい猫を眺めるのが目的

## 動かし方（自分のパソコンで確認するとき）

JavaScriptを分割したファイル（モジュール）で読み込んでいるので、`index.html` をダブルクリックで開くと動きません。簡易サーバーを立てて開きます。

```sh
python3 -m http.server 8000
# ブラウザで http://localhost:8000 を開く
```

## フォルダ構成

```
index.html              画面の骨組み
css/style.css           見た目（色・大きさはファイル先頭の :root にまとめてある）
data/
  today.json            今日の猫リスト（手元確認用の仮データ。公開サイトでは毎日自動で差し替わる）
  fallback.json         today.json が読めないときの予備
images/
  placeholder/          試作用の仮の猫画像
  paw.svg               カード裏の肉球マーク
  og-image.png          Xにリンクを貼ったときのプレビュー画像
js/
  main.js               全体のつなぎ役（読み込み → ルール → 画面）
  config.js             設定値（ペア数、制限時間、並べ方など）
  types.js              データの形の説明書
  data/
    dailyCats.js        今日の猫リストの読み込みと確認
    storage.js          ブラウザ内への小さな保存（前回のモード）
  game/
    rules.js            神経衰弱のルール（状態を受け取って新しい状態を返すだけ）
    deck.js             カードの山を作る・シャッフル
    timer.js            カウントダウン
  ui/
    board.js            盤面の表示と自動レイアウト
    hud.js              上部バー
    sheets.js           はじめ・おわり・アルバム画面の切り替え
    album.js            今日の猫アルバム
    lightbox.js         写真の拡大表示
    sharePanel.js       PC向けのシェア画面
    toast.js            短いお知らせ
  share/
    shareImage.js       シェア用のカード画像を作る（写真がサイトと同じ場所にあるときだけ）
    shareCat.js         シェアの流れ（共有メニュー or シェア画面）
scripts/
  fetch-daily-cats.mjs      今日の猫を The Cat API から選ぶ（毎日自動で実行）
  build-share-pages.mjs     猫ごとのシェア用ページを作る（毎日自動で実行）
  make_placeholder_cats.py  仮の猫画像と仮のリストを作る
.github/workflows/
  daily-cats.yml            毎日の取得と公開の自動実行
```

## データの形

詳しくは `js/types.js`。

### 今日の猫リスト（data/today.json）

```json
{
  "version": 1,
  "date": "2026-10-17",
  "challengeNumber": 1,
  "source": "thecatapi",
  "cats": [
    { "id": "abc123", "imageUrl": "https://cdn2.thecatapi.com/images/abc123.jpg", "width": 800, "height": 600, "breed": "Bengal" }
  ]
}
```

- `cats` はちょうど20匹（`config.js` の `PAIR_COUNT`）。形がおかしいと予備のリストに切り替わる
- `breed`（猫種）はわかるときだけ。アルバムと拡大表示に出る

### ゲームの状態（GameState）

画面はこの値だけを見て描き直す。書き換えは `js/game/rules.js` の関数（`flipCard`、`hideMismatched`、`setRemainingTime`）を通して行う。

| 項目 | 内容 |
|---|---|
| `modeId` | `"beginner"` / `"normal"` |
| `status` | `"ready"`（まだめくっていない）/ `"playing"` / `"finished"` |
| `cards` | カードの並び。1枚は `{ cardId, catId, state }`、`state` は `"hidden"` / `"revealed"` / `"matched"` |
| `revealedIds` | めくられていて未判定のカード（0〜2枚） |
| `matchedCatIds` | そろった猫のID（そろった順） |
| `moves` | めくった回数（2枚で1回） |
| `timeLimitMs` / `remainingMs` | 制限時間と残り時間 |
| `result` | `null` / `"cleared"` / `"timeup"` |

## シェアのしくみ

シェアするのは、えらんだ猫の**シェア用ページ**（`share/<猫のID>.html`）のリンク。Xなどに貼ると、その猫の写真がリンクのプレビューとして大きく表示される。シェア用ページは毎日の公開のときに `scripts/build-share-pages.mjs` が20匹分作る。

- スマホなど共有メニューが使えるブラウザでは、共有メニューにリンクを渡す
- PCなどではシェア画面を開き、「Xで投稿」「リンクをコピー」を出す
- 写真がサイトと同じ場所にあるとき（仮の猫）だけは、写真にタイトルと日付を重ねたカード画像も作って添付できる。The Cat API の写真はブラウザでの加工が許可されていないので、リンクだけになる

## 写真の出典と掲載停止の窓口

写真は The Cat API のもの。はじめの画面とアルバムに出典を表示し、掲載をやめてほしい写真はこのリポジトリの Issues で受け付ける。

## 今日の猫の更新と公開（自動）

`.github/workflows/daily-cats.yml` が次のタイミングで動き、サイトを公開し直す。

- 毎日0時ごろ（日本時間）
- main ブランチのファイルを更新したとき
- Actions の画面から手動で「Run workflow」したとき

流れ:

1. `scripts/fetch-daily-cats.mjs` が The Cat API から条件に合う写真を20枚えらび、猫リスト（写真のURL）を `data/today.json` に書き出す（小さすぎる写真・細長すぎる写真は除く）
2. `scripts/build-share-pages.mjs` が猫ごとのシェア用ページを作る
3. それをゲームのファイルと合わせて GitHub Pages に公開する

- 写真は保存しない。ゲームもシェア用ページも、The Cat API の画像サーバーの写真を直接表示する
- リポジトリの `data/today.json` は手元確認用の仮データ
- 同じ日に何度動いても、その日の猫は変わらない（その日の猫リストを Actions のキャッシュにとっておいて使い回す。写真は含まない）
- 取得に失敗した日は、仮の猫で公開される

### The Cat API のAPIキー（任意）

キーなしでも動くが、キーがあると1回の問い合わせで取れる枚数が増える。
入れる場合は、リポジトリの Settings → Secrets and variables → Actions で `CAT_API_KEY` という名前で登録する。

### 手元で取得を試す

```sh
node scripts/fetch-daily-cats.mjs .daily-cats
```

## これから

- [ ] Xアプリ内ブラウザでの動作確認
