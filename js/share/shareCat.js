// お気に入りの1匹をシェアする流れを決める。
//
// シェアするリンクは、その猫のシェア用ページ（share/<猫のID>.html）。
// Xなどに貼ると、その猫の写真がプレビューとして大きく表示される。
// （シェア用ページは毎日 scripts/build-share-pages.mjs が作る）
//
// 画像も一緒に渡せるのは、写真がサイトと同じ場所にあるとき（仮の猫など）だけ。
// The Cat API の写真はブラウザでの加工が許可されていないので、リンクだけを渡す。
//
//   共有メニューが使えるブラウザ（スマホなど）: 共有メニューを開く
//   使えないブラウザ（PCなど）               : シェア用パネルを開く

import { GAME_TITLE, SHARE_HASHTAG } from '../config.js';
import { createShareImage } from './shareImage.js';

/** @typedef {import('../types.js').Cat} Cat */
/** @typedef {import('../types.js').DailyCats} DailyCats */

/**
 * シェアに使う中身。
 * @typedef {Object} SharePayload
 * @property {string} text            投稿文（URLは含まない）
 * @property {string} url             シェアするURL（その猫のシェア用ページ）
 * @property {string} previewUrl      パネルに見本として出す写真
 * @property {Blob | null} imageBlob  添付できる画像（作れなかったら null）
 * @property {string} fileName        画像を保存するときのファイル名
 */

/**
 * @param {Cat} cat
 * @param {DailyCats} daily
 * @param {{ openPanel: (payload: SharePayload) => void }} ui
 * @returns {Promise<"shared" | "cancelled" | "panel">}
 */
export async function shareCat(cat, daily, ui) {
  const image = await createShareImage(cat, daily);
  /** @type {SharePayload} */
  const payload = {
    text: buildShareText(daily),
    url: sharePageUrl(cat),
    previewUrl: cat.imageUrl,
    imageBlob: image?.blob ?? null,
    fileName: `neko-challenge-${daily.date}.png`,
  };

  const shareData = buildShareData(payload);
  if (shareData && navigator.canShare?.(shareData)) {
    try {
      await navigator.share(shareData);
      return 'shared';
    } catch (error) {
      if (error?.name === 'AbortError') return 'cancelled'; // 共有メニューを閉じただけ
      console.info('共有メニューが使えなかったので、パネルを開きます', error);
    }
  }

  ui.openPanel(payload);
  return 'panel';
}

/**
 * 共有メニューに渡す中身。共有メニューがないブラウザでは null。
 * @param {SharePayload} payload
 */
function buildShareData(payload) {
  if (typeof navigator.share !== 'function') return null;
  const text = `${payload.text}\n${payload.url}`;
  if (payload.imageBlob) {
    const file = new File([payload.imageBlob], payload.fileName, { type: payload.imageBlob.type });
    const withFile = { files: [file], text };
    if (navigator.canShare?.(withFile)) return withFile;
  }
  return { text: payload.text, url: payload.url };
}

/**
 * 投稿文。
 * @param {DailyCats} daily
 */
export function buildShareText(daily) {
  return `${GAME_TITLE} #${daily.challengeNumber}\n今日のお気に入りはこの子🐱\n#${SHARE_HASHTAG}`;
}

/**
 * Xの投稿画面を開くURL。
 * @param {SharePayload} payload
 */
export function buildPostUrl(payload) {
  const params = new URLSearchParams({ text: payload.text, url: payload.url });
  return `https://twitter.com/intent/tweet?${params}`;
}

/**
 * その猫のシェア用ページのURL。
 * @param {Cat} cat
 */
function sharePageUrl(cat) {
  const gameDir = new URL('./', location.href); // ゲームのある場所（?や#は付かない）
  const fileName = String(cat.id).replace(/[^A-Za-z0-9_-]/g, '_'); // build-share-pages.mjs と同じ規則
  return new URL(`share/${fileName}.html`, gameDir).href;
}
