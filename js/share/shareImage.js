// シェア用の画像を作る。
// 3段構え:
//   1. 猫の写真にタイトルと日付を重ねた「カード画像」を作る
//   2. それが無理なら（画像サーバーが加工を許可していない等）、写真そのものを使う
//   3. それも無理なら null を返す（呼び出し側はリンクだけのシェアにする）

import { GAME_TITLE } from '../config.js';

/** @typedef {import('../types.js').Cat} Cat */
/** @typedef {import('../types.js').DailyCats} DailyCats */

/**
 * @typedef {Object} ShareImage
 * @property {Blob} blob
 * @property {"card" | "photo"} kind  どの方法で作れたか
 */

// カード画像の見た目。画面のダークモードに関係なく、いつも同じ色で作る
const CARD = {
  size: 1200,
  margin: 64,
  photoRadius: 44,
  footerHeight: 210,
  colors: {
    paper: '#eef2ef',
    ink: '#2e2a3d',
    inkSoft: '#6b6680',
    pad: '#e07a86',
  },
  fonts: {
    display: '"Mochiy Pop One", "Zen Maru Gothic", sans-serif',
    body: '"Zen Maru Gothic", sans-serif',
  },
};

/**
 * @param {Cat} cat
 * @param {DailyCats} daily
 * @returns {Promise<ShareImage | null>}
 */
export async function createShareImage(cat, daily) {
  try {
    return { blob: await drawCard(cat, daily), kind: 'card' };
  } catch (error) {
    console.info('カード画像を作れなかったので、写真そのものを使います', error);
  }
  try {
    return { blob: await fetchPhoto(cat.imageUrl), kind: 'photo' };
  } catch (error) {
    console.info('写真も取得できなかったので、リンクだけでシェアします', error);
  }
  return null;
}

/**
 * 写真＋タイトル＋日付のカード画像（PNG）を作る。
 * 画像サーバーが加工を許可していないと、toBlob の時点で例外になる。
 * @param {Cat} cat
 * @param {DailyCats} daily
 * @returns {Promise<Blob>}
 */
async function drawCard(cat, daily) {
  const photo = await loadImage(cat.imageUrl);
  await loadFonts();

  const { size, margin, photoRadius, footerHeight, colors, fonts } = CARD;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  // 背景
  ctx.fillStyle = colors.paper;
  ctx.fillRect(0, 0, size, size);

  // 写真（角丸の枠に、はみ出す部分を切り取って入れる）
  const box = { x: margin, y: margin, w: size - margin * 2, h: size - margin - footerHeight };
  ctx.save();
  roundRectPath(ctx, box.x, box.y, box.w, box.h, photoRadius);
  ctx.clip();
  drawCover(ctx, photo, box);
  ctx.restore();

  // 下の帯: タイトル・回数・日付
  const baseY = size - footerHeight / 2 + 4;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = colors.ink;
  ctx.font = `64px ${fonts.display}`;
  ctx.fillText(GAME_TITLE, margin + 96, baseY - 26);
  ctx.fillStyle = colors.inkSoft;
  ctx.font = `700 40px ${fonts.body}`;
  ctx.fillText(`#${daily.challengeNumber}　${daily.date.replaceAll('-', '.')}`, margin + 96, baseY + 46);

  drawPaw(ctx, margin + 36, baseY, 38, colors.pad);

  return canvasToBlob(canvas);
}

/**
 * 写真そのものを取得する（加工なし）。
 * @param {string} url
 * @returns {Promise<Blob>}
 */
async function fetchPhoto(url) {
  const response = await fetch(url, { mode: 'cors' });
  if (!response.ok) throw new Error(`写真を取得できませんでした（${response.status}）`);
  return response.blob();
}

// ---- 描画の小さな道具 ----

/**
 * 加工できる形で画像を読み込む（crossOrigin を付ける）。
 * @param {string} url
 * @returns {Promise<HTMLImageElement>}
 */
function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`画像を読み込めませんでした: ${url}`));
    img.src = url;
  });
}

/** カードに使うフォントが読み込まれるのを待つ（失敗しても続ける） */
async function loadFonts() {
  try {
    await Promise.all([
      document.fonts.load(`64px ${CARD.fonts.display}`, GAME_TITLE),
      document.fonts.load(`700 40px ${CARD.fonts.body}`, '0123456789.#'),
    ]);
  } catch {
    // 代わりのフォントで描く
  }
}

/**
 * 枠いっぱいに、縦横比を保って写真を描く（はみ出しは切る）。
 * @param {CanvasRenderingContext2D} ctx
 * @param {HTMLImageElement} img
 * @param {{x:number, y:number, w:number, h:number}} box
 */
function drawCover(ctx, img, box) {
  const scale = Math.max(box.w / img.naturalWidth, box.h / img.naturalHeight);
  const w = img.naturalWidth * scale;
  const h = img.naturalHeight * scale;
  ctx.drawImage(img, box.x + (box.w - w) / 2, box.y + (box.h - h) / 2, w, h);
}

/** @param {CanvasRenderingContext2D} ctx */
function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/**
 * 肉球マーク（images/paw.svg と同じ形）。
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} cx 中心x
 * @param {number} cy 中心y
 * @param {number} r  大きさ（半径くらい）
 * @param {string} color
 */
function drawPaw(ctx, cx, cy, r, color) {
  const s = r / 50;
  const toes = [
    [22, 40, -18], [40, 24, -6], [60, 24, 6], [78, 40, 18],
  ];
  ctx.save();
  ctx.fillStyle = color;
  ctx.translate(cx - 50 * s, cy - 50 * s);
  ctx.beginPath();
  ctx.ellipse(50 * s, 66 * s, 24 * s, 20 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  for (const [x, y, deg] of toes) {
    ctx.beginPath();
    ctx.ellipse(x * s, y * s, 10 * s, 13 * s, (deg * Math.PI) / 180, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/**
 * @param {HTMLCanvasElement} canvas
 * @returns {Promise<Blob>}
 */
function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    // 加工が許可されていない画像を描いた場合、ここで SecurityError になる
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('画像に変換できませんでした'))), 'image/png');
  });
}
