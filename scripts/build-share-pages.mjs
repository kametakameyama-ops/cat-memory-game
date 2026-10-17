// 今日の猫1匹ごとに、シェア用の小さなページを作る。
// Xなどにこのページのリンクを貼ると、その猫の写真がプレビューとして大きく表示される。
// 写真は保存せず、The Cat API の画像サーバーの写真を参照するだけ。
//
//   node scripts/build-share-pages.mjs <公開するフォルダ> <公開URL>
//   例: node scripts/build-share-pages.mjs _site https://kametakameyama-ops.github.io/cat-memory-game/
//
// 出力: <公開するフォルダ>/share/<猫のID>.html

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const GAME_TITLE = '今日の猫チャレンジ';
const CREDIT_URL = 'https://thecatapi.com/';

async function main() {
  const [siteDir, siteUrlArg] = process.argv.slice(2);
  if (!siteDir || !siteUrlArg) {
    console.error('使い方: node scripts/build-share-pages.mjs <公開するフォルダ> <公開URL>');
    process.exit(1);
  }
  const siteUrl = siteUrlArg.endsWith('/') ? siteUrlArg : `${siteUrlArg}/`;

  const daily = JSON.parse(await readFile(path.join(siteDir, 'data', 'today.json'), 'utf8'));
  const shareDir = path.join(siteDir, 'share');
  await mkdir(shareDir, { recursive: true });

  for (const cat of daily.cats) {
    const html = renderPage(cat, daily, siteUrl);
    await writeFile(path.join(shareDir, `${safeFileName(cat.id)}.html`), html);
  }
  console.log(`シェア用ページを ${daily.cats.length} 枚作りました: ${shareDir}`);
}

/**
 * @param {{id:string, imageUrl:string, width?:number, height?:number, breed?:string}} cat
 * @param {{date:string, challengeNumber:number}} daily
 * @param {string} siteUrl  末尾が / の公開URL
 */
function renderPage(cat, daily, siteUrl) {
  const imageUrl = new URL(cat.imageUrl, siteUrl).href; // 仮の猫（相対パス）でも完全なURLにする
  // XのプレビューはSVGを表示できないので、仮の猫（SVG）の日はゲーム全体の画像を使う
  const previewImageUrl = /\.svg$/i.test(imageUrl) ? new URL('images/og-image.png', siteUrl).href : imageUrl;
  const pageUrl = new URL(`share/${safeFileName(cat.id)}.html`, siteUrl).href;
  const dateLabel = daily.date.replaceAll('-', '.');
  const title = `${GAME_TITLE} #${daily.challengeNumber} のお気に入り`;
  const description = `${dateLabel} の今日の猫。毎日20匹の猫に会える、写真の神経衰弱。`;
  const sizeMeta =
    cat.width && cat.height
      ? `\n  <meta property="og:image:width" content="${cat.width}">\n  <meta property="og:image:height" content="${cat.height}">`
      : '';

  return `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${escapeHtml(pageUrl)}">
  <meta property="og:image" content="${escapeHtml(previewImageUrl)}">${previewImageUrl === imageUrl ? sizeMeta : ''}
  <meta name="twitter:card" content="summary_large_image">
  <style>
    :root { --paper: #eef2ef; --ink: #2e2a3d; --soft: #6b6680; --pad: #e07a86; }
    @media (prefers-color-scheme: dark) { :root { --paper: #1c1b23; --ink: #ece8f2; --soft: #aaa4bb; --pad: #ee97a1; } }
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: var(--paper); color: var(--ink);
           font-family: 'Hiragino Maru Gothic ProN', 'Hiragino Sans', 'Yu Gothic', sans-serif; }
    main { width: min(100% - 32px, 520px); display: grid; gap: 14px; text-align: center; padding-block: 24px; }
    img { width: 100%; max-height: 70vh; object-fit: contain; border-radius: 16px; }
    h1 { margin: 0; font-size: 1.2rem; }
    p { margin: 0; color: var(--soft); font-size: 0.9rem; }
    a.play { justify-self: center; padding: 12px 24px; border-radius: 999px; background: var(--pad); color: #fff; font-weight: 700; text-decoration: none; }
    small a { color: var(--soft); }
  </style>
</head>
<body>
  <main>
    <img src="${escapeHtml(imageUrl)}" alt="今日のお気に入りの猫">
    <h1>${escapeHtml(title)}</h1>
    <p>${escapeHtml(dateLabel)}</p>
    <a class="play" href="../">${GAME_TITLE}であそぶ</a>
    <small>写真：<a href="${CREDIT_URL}">The Cat API</a></small>
  </main>
</body>
</html>
`;
}

/** IDをファイル名に使える形にする（英数字・-・_ 以外は _ に） */
function safeFileName(id) {
  return String(id).replace(/[^A-Za-z0-9_-]/g, '_');
}

/** @param {string} text */
function escapeHtml(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
