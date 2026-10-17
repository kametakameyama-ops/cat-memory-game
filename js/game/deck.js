// 猫のリストから、シャッフル済みのカードの山を作る。

/** @typedef {import('../types.js').Cat} Cat */
/** @typedef {import('../types.js').Card} Card */

/**
 * 配列をシャッフルした新しい配列を返す（元の配列は変えない）。
 * フィッシャー–イェーツ法。
 * @template T
 * @param {T[]} items
 * @param {() => number} [random] 0以上1未満の乱数を返す関数（テスト用に差し替え可）
 * @returns {T[]}
 */
export function shuffle(items, random = Math.random) {
  const result = items.slice();
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * 猫1匹につき2枚のカードを作り、シャッフルして返す。
 * @param {Cat[]} cats
 * @param {() => number} [random]
 * @returns {Card[]}
 */
export function createDeck(cats, random = Math.random) {
  const cards = cats.flatMap((cat) => [
    { cardId: `${cat.id}#1`, catId: cat.id, state: 'hidden' },
    { cardId: `${cat.id}#2`, catId: cat.id, state: 'hidden' },
  ]);
  return shuffle(cards, random);
}
