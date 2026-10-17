// 今日の猫を The Cat API から20匹えらんで、写真と猫リストを書き出す。
// GitHub Actions から1日1回（日本時間0時）実行される。手元でも実行できる:
//
//   node scripts/fetch-daily-cats.mjs .daily-cats
//
// 出力（引数のフォルダの中）:
//   data/today.json            今日の猫リスト
//   images/today/<id>.<拡張子>  今日の写真（サイトと同じ場所から配信するのでシェア画像も作れる）
//
// 環境変数:
//   CAT_API_KEY   The Cat API のAPIキー（なくても動く。あると1回の取得枚数が増える）
//   CAT_API_BASE  APIの場所（テスト用。ふだんは指定しない）

import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

// ---- 設定 ----
const PAIR_COUNT = 20;
/** 第1回の日付（日本時間）。ここから何日目かで #番号 を決める */
const FIRST_DAY = '2026-10-17';
/** 写真の条件: 短い辺の最小ピクセル数と、縦横比の範囲（極端に細長い写真を避ける） */
const MIN_SIDE = 300;
const MIN_ASPECT = 0.6;
const MAX_ASPECT = 1.7;
/** APIへ問い合わせる最大回数（条件に合う写真が集まらないとき用） */
const MAX_REQUESTS = 12;

const API_BASE = process.env.CAT_API_BASE ?? 'https://api.thecatapi.com/v1';
const API_KEY = process.env.CAT_API_KEY ?? '';

async function main() {
  const outDir = process.argv[2];
  if (!outDir) {
    console.error('使い方: node scripts/fetch-daily-cats.mjs <出力フォルダ>');
    process.exit(1);
  }

  const date = todayInJapan();
  const challengeNumber = daysBetween(FIRST_DAY, date) + 1;
  console.log(`${date}（#${challengeNumber}）の猫を集めます`);

  const picked = await pickCats();
  console.log(`${picked.length} 匹えらびました。写真を保存します`);

  const imageDir = path.join(outDir, 'images', 'today');
  await rm(imageDir, { recursive: true, force: true });
  await mkdir(imageDir, { recursive: true });
  await mkdir(path.join(outDir, 'data'), { recursive: true });

  const cats = [];
  for (const image of picked) {
    const fileName = `${image.id}${extensionOf(image.url)}`;
    await download(image.url, path.join(imageDir, fileName));
    cats.push({
      id: image.id,
      imageUrl: `./images/today/${fileName}`,
      width: image.width,
      height: image.height,
      ...(image.breeds?.[0]?.name ? { breed: image.breeds[0].name } : {}),
    });
  }

  const daily = { version: 1, date, challengeNumber, source: 'thecatapi', cats };
  await writeFile(path.join(outDir, 'data', 'today.json'), `${JSON.stringify(daily, null, 2)}\n`);
  console.log(`書き出しました: ${path.join(outDir, 'data', 'today.json')}`);
}

/**
 * 条件に合う写真が PAIR_COUNT 枚になるまでAPIに問い合わせる。
 * @returns {Promise<Array<{id:string,url:string,width:number,height:number,breeds?:Array<{name:string}>}>>}
 */
async function pickCats() {
  /** @type {Map<string, any>} */
  const picked = new Map();
  // APIキーなしだと1回10枚まで
  const limit = API_KEY ? 50 : 10;
  for (let i = 0; i < MAX_REQUESTS && picked.size < PAIR_COUNT; i++) {
    const params = new URLSearchParams({
      limit: String(limit),
      size: 'med',
      mime_types: 'jpg,png',
      order: 'RANDOM',
    });
    const images = await getJson(`${API_BASE}/images/search?${params}`);
    for (const image of images) {
      if (picked.size >= PAIR_COUNT) break;
      if (!picked.has(image.id) && isGoodPhoto(image)) picked.set(image.id, image);
    }
  }
  if (picked.size < PAIR_COUNT) {
    throw new Error(`条件に合う写真が ${picked.size} 枚しか集まりませんでした（${PAIR_COUNT} 枚必要）`);
  }
  return [...picked.values()];
}

/** @param {{id?:string,url?:string,width?:number,height?:number}} image */
function isGoodPhoto(image) {
  if (!image?.id || !image?.url || !image.width || !image.height) return false;
  if (!/\.(jpe?g|png)$/i.test(image.url)) return false;
  if (Math.min(image.width, image.height) < MIN_SIDE) return false;
  const aspect = image.width / image.height;
  return aspect >= MIN_ASPECT && aspect <= MAX_ASPECT;
}

/** @param {string} url */
async function getJson(url) {
  const response = await fetch(url, { headers: API_KEY ? { 'x-api-key': API_KEY } : {} });
  if (!response.ok) throw new Error(`APIの応答がエラーでした（${response.status}）: ${url}`);
  return response.json();
}

/**
 * @param {string} url
 * @param {string} filePath
 */
async function download(url, filePath) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`写真を取得できませんでした（${response.status}）: ${url}`);
  await writeFile(filePath, Buffer.from(await response.arrayBuffer()));
}

/** @param {string} url */
function extensionOf(url) {
  const ext = path.extname(new URL(url).pathname).toLowerCase();
  return ext === '.jpeg' ? '.jpg' : ext;
}

/** 日本時間の今日を "YYYY-MM-DD" で */
function todayInJapan() {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Tokyo' }).format(new Date());
}

/**
 * 2つの日付（"YYYY-MM-DD"）の差（日数）
 * @param {string} from
 * @param {string} to
 */
function daysBetween(from, to) {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
