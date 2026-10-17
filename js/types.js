// このゲームで使うデータの形をまとめた説明書。
// 実行される処理はなく、エディタの補完と、読む人のための定義だけを置いている。

/**
 * 1匹の猫。data/today.json の cats 配列の1要素。
 * @typedef {Object} Cat
 * @property {string} id         猫ごとに一意なID（例: "abc123"）。The Cat API の画像IDをそのまま使う
 * @property {string} imageUrl   写真のURL
 * @property {number} [width]    写真の幅（px）。わかれば入れる
 * @property {number} [height]   写真の高さ（px）。わかれば入れる
 * @property {string} [breed]    猫種名。わかれば入れる（アルバムに表示）
 */

/**
 * 今日の猫リスト。data/today.json の中身そのもの。
 * 毎日0時（日本時間）に自動で書き換わる。
 * @typedef {Object} DailyCats
 * @property {number} version          データ形式のバージョン。形を変えたら上げる
 * @property {string} date             日付（日本時間, "YYYY-MM-DD"）
 * @property {number} challengeNumber  第何回か（#1, #2, ...）
 * @property {string} source           画像の出どころ（"thecatapi" / "placeholder" など）
 * @property {Cat[]}  cats             今日の猫。PAIR_COUNT 匹ちょうど
 */

/**
 * カードの状態。
 *  - "hidden"   裏向き
 *  - "revealed" めくられて表向き（まだ揃っていない）
 *  - "matched"  ペアが揃った
 * @typedef {"hidden" | "revealed" | "matched"} CardState
 */

/**
 * 盤面のカード1枚。同じ猫のカードが2枚ずつある。
 * @typedef {Object} Card
 * @property {string}    cardId  カードごとに一意なID（例: "abc123#1"）
 * @property {string}    catId   どの猫の写真か（Cat.id）
 * @property {CardState} state
 */

/**
 * ゲームの進み具合。
 *  - "ready"    盤面は並んだが、まだ1枚もめくっていない（タイマー停止中）
 *  - "playing"  プレイ中
 *  - "finished" 終了（全部揃った or 時間切れ）
 * @typedef {"ready" | "playing" | "finished"} GameStatus
 */

/**
 * 1回のプレイの状態すべて。画面はこの値だけを見て描き直す。
 * 書き換えは js/game/rules.js の関数を通して行う（直接いじらない）。
 * @typedef {Object} GameState
 * @property {string}      modeId          MODES のキー
 * @property {GameStatus}  status
 * @property {Card[]}      cards           盤面の並び順どおり
 * @property {string[]}    revealedIds     今めくられていて未判定のカードID（0〜2枚）
 * @property {string[]}    matchedCatIds   揃った猫のID（揃った順）
 * @property {number}      moves           めくった回数（2枚で1回）
 * @property {number}      timeLimitMs     制限時間
 * @property {number}      remainingMs     残り時間
 * @property {null | "cleared" | "timeup"} result  終わり方
 */

export {};
