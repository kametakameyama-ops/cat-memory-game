// お気に入りの1匹をシェアする流れを決める。
//   スマホなど: 共有メニュー（LINE、X など）に画像ごと渡す
//   PCなど    : シェア用パネルを開く（画像をコピー／保存 → Xで投稿）
// どちらが使えるかは端末の種類ではなく、ブラウザが実際に対応しているかで判定する。

import { GAME_TITLE, SHARE_HASHTAG } from '../config.js';
import { createShareImage } from './shareImage.js';

/** @typedef {import('../types.js').Cat} Cat */
/** @typedef {import('../types.js').DailyCats} DailyCats */

/**
 * シェアに使う中身。
 * @typedef {Object} SharePayload
 * @property {string} text          投稿文（URLは含まない）
 * @property {string} url           ゲームのURL
 * @property {Blob | null} imageBlob シェア用画像（作れなかったら null）
 * @property {string} fileName      保存するときのファイル名
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
    url: gameUrl(),
    imageBlob: image?.blob ?? null,
    fileName: `neko-challenge-${daily.date}${extensionOf(image?.blob)}`,
  };

  if (payload.imageBlob) {
    const file = new File([payload.imageBlob], payload.fileName, { type: payload.imageBlob.type });
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], text: `${payload.text}\n${payload.url}` });
        return 'shared';
      } catch (error) {
        if (error?.name === 'AbortError') return 'cancelled'; // 共有メニューを閉じただけ
        console.info('共有メニューが使えなかったので、パネルを開きます', error);
      }
    }
  }

  ui.openPanel(payload);
  return 'panel';
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

/** 今開いているゲームのURL（?や#は付けない） */
function gameUrl() {
  return `${location.origin}${location.pathname}`;
}

/** @param {Blob | undefined} blob */
function extensionOf(blob) {
  if (!blob) return '';
  if (blob.type === 'image/png') return '.png';
  if (blob.type === 'image/jpeg') return '.jpg';
  if (blob.type === 'image/svg+xml') return '.svg';
  if (blob.type === 'image/gif') return '.gif';
  return '';
}
