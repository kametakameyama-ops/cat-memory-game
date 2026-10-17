# 今日の猫チャレンジ

毎日20匹の猫に会える、写真の神経衰弱。ブラウザで遊ぶWebアプリ（GitHub Pagesで公開する想定）。

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
  today.json            今日の猫リスト（毎日自動で書き換わる予定）
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
    shareImage.js       シェア用画像を作る（3段構え）
    shareCat.js         シェアの流れ（共有メニュー or シェア画面）
scripts/
  make_placeholder_cats.py  仮の猫画像と仮のリストを作る
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

1. 写真にタイトルと日付を重ねた画像を作る
2. 画像サーバーが加工を許可していなければ、写真そのものを使う
3. それも無理ならリンクだけ（Xのリンクプレビューに `og-image.png` が出る）

スマホなど共有メニューが使えるブラウザでは画像ごと共有メニューへ。PCなどではシェア画面を開き、「画像をコピー／保存 → Xで投稿」の手順を出す。

## これから

- [ ] The Cat API から毎日20匹を取得して `data/today.json` を更新するスクリプト
- [ ] GitHub Actions で毎日0時（日本時間）に自動実行
- [ ] GitHub Pages で公開、`og:image` を完全なURLに書き換え
- [ ] Xアプリ内ブラウザでの動作確認
