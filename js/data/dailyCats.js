// 今日の猫リストを読み込む。
// 遊ぶ人のブラウザは The Cat API を直接呼ばず、毎日自動で更新される data/today.json を読むだけ。

import { DAILY_DATA_URL, FALLBACK_DATA_URL, PAIR_COUNT } from '../config.js';

/** @typedef {import('../types.js').DailyCats} DailyCats */

/**
 * 今日の猫リストを取得する。読めなければ予備のリストを使う。
 * @returns {Promise<DailyCats>}
 */
export async function loadDailyCats() {
  try {
    return await fetchDailyCats(DAILY_DATA_URL);
  } catch (error) {
    console.warn('今日の猫リストを読めなかったので、予備のリストを使います', error);
    return fetchDailyCats(FALLBACK_DATA_URL);
  }
}

/**
 * @param {string} url
 * @returns {Promise<DailyCats>}
 */
async function fetchDailyCats(url) {
  // 毎日中身が変わるファイルなので、古いものをキャッシュから使わないようにする
  const response = await fetch(url, { cache: 'no-cache' });
  if (!response.ok) throw new Error(`${url} を読めませんでした（${response.status}）`);
  const data = await response.json();
  validate(data, url);
  return data;
}

/**
 * 形が正しいかを確かめる。おかしければ例外を出す。
 * @param {any} data
 * @param {string} url
 */
function validate(data, url) {
  const problems = [];
  if (typeof data?.date !== 'string') problems.push('date がない');
  if (typeof data?.challengeNumber !== 'number') problems.push('challengeNumber がない');
  if (!Array.isArray(data?.cats)) problems.push('cats が配列ではない');
  else {
    if (data.cats.length !== PAIR_COUNT) {
      problems.push(`猫が ${data.cats.length} 匹（${PAIR_COUNT} 匹必要）`);
    }
    const ids = new Set();
    data.cats.forEach((cat, i) => {
      if (typeof cat?.id !== 'string' || !cat.id) problems.push(`cats[${i}] に id がない`);
      if (typeof cat?.imageUrl !== 'string') problems.push(`cats[${i}] に imageUrl がない`);
      if (ids.has(cat?.id)) problems.push(`id が重複: ${cat.id}`);
      ids.add(cat?.id);
    });
  }
  if (problems.length > 0) {
    throw new Error(`${url} の形が正しくありません: ${problems.join(' / ')}`);
  }
}

/**
 * 写真を先に読み込んでおく（めくった瞬間に表示が遅れないように）。
 * 1枚読めなくてもゲームは続ける。
 * @param {DailyCats} daily
 * @param {(loaded: number, total: number) => void} [onProgress]
 */
export async function preloadImages(daily, onProgress) {
  let loaded = 0;
  const total = daily.cats.length;
  await Promise.all(
    daily.cats.map(async (cat) => {
      const img = new Image();
      img.src = cat.imageUrl;
      try {
        await img.decode();
      } catch {
        console.warn('写真を読めませんでした', cat.imageUrl);
      }
      loaded += 1;
      onProgress?.(loaded, total);
    }),
  );
}
