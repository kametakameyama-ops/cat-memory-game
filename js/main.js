// ゲーム全体のつなぎ役。
// データの読み込み → ルール（rules.js）で状態を更新 → 画面（ui/）に反映、の流れをここで管理する。

import { DEFAULT_MODE_ID, MISMATCH_DELAY_MS, MODES } from './config.js';
import { loadDailyCats, preloadImages } from './data/dailyCats.js';
import { loadSetting, saveSetting } from './data/storage.js';
import {
  createGame,
  flipCard,
  hideMismatched,
  isWaitingForMismatch,
  setRemainingTime,
} from './game/rules.js';
import { Countdown } from './game/timer.js';
import { shareCat } from './share/shareCat.js';
import { renderAlbum } from './ui/album.js';
import { BoardView } from './ui/board.js';
import { showChallenge, updateHud } from './ui/hud.js';
import { Lightbox } from './ui/lightbox.js';
import { SharePanel } from './ui/sharePanel.js';
import { fillResult, getSelectedMode, setSelectedMode, showSheet } from './ui/sheets.js';
import { showToast } from './ui/toast.js';

/** @typedef {import('./types.js').Cat} Cat */
/** @typedef {import('./types.js').DailyCats} DailyCats */
/** @typedef {import('./types.js').GameState} GameState */

/** 終わってから結果の画面を出すまでの間（最後の1枚を見られるように） */
const RESULT_DELAY_MS = 900;

// ---- アプリの状態 ----
const app = {
  /** @type {DailyCats | null} */
  daily: null,
  /** @type {Map<string, Cat>} */
  catsById: new Map(),
  /** @type {GameState | null} */
  game: null,
  /** 何回目のゲームか（古いゲームの予約処理を無視するため） */
  gameSerial: 0,
  /** @type {number | null} 外れたカードを戻す予約 */
  mismatchTimer: null,
};

// ---- 画面の部品 ----
const board = new BoardView(document.getElementById('board'), document.getElementById('board-area'), {
  onCardClick: handleCardClick,
});
const countdown = new Countdown(handleTick);
const sharePanel = new SharePanel();
const lightbox = new Lightbox({
  // 写真を見ている間はタイマーを止める（眺めるのが主目的なので）
  onOpen: () => countdown.pause(),
  onClose: () => {
    if (app.game?.status === 'playing') countdown.resume();
  },
  onShare: handleShare,
});

// ---- ボタン ----
document.getElementById('start-button').addEventListener('click', () => {
  const modeId = getSelectedMode() ?? DEFAULT_MODE_ID;
  saveSetting('mode', modeId);
  startGame(modeId);
});
document.getElementById('replay-button').addEventListener('click', showStart);
document.getElementById('album-replay-button').addEventListener('click', showStart);
document.getElementById('open-album-button').addEventListener('click', openAlbum);

// タブを切り替えている間は時間を止める
document.addEventListener('visibilitychange', () => {
  if (document.hidden) countdown.pause();
  else if (app.game?.status === 'playing' && !lightbox.isOpen) countdown.resume();
});

init();

// ---- 流れ ----

async function init() {
  const loading = document.getElementById('loading-message');
  try {
    const daily = await loadDailyCats();
    app.daily = daily;
    app.catsById = new Map(daily.cats.map((cat) => [cat.id, cat]));
    showChallenge(daily);
    await preloadImages(daily, (loaded, total) => {
      loading.textContent = `今日の猫を呼んでいます… ${loaded}/${total}`;
    });
    loading.hidden = true;
    showStart();
  } catch (error) {
    console.error(error);
    loading.textContent = '猫たちを呼べませんでした。時間をおいて開き直してください。';
  }
}

function showStart() {
  lightbox.close();
  sharePanel.close();
  const saved = loadSetting('mode', DEFAULT_MODE_ID);
  setSelectedMode(MODES[saved] ? saved : DEFAULT_MODE_ID);
  // 後ろに新しい盤面を並べておく（めくるまでタイマーは動かない）
  startGame(getSelectedMode() ?? DEFAULT_MODE_ID);
  showSheet('start-sheet');
}

/** @param {string} modeId */
function startGame(modeId) {
  if (!app.daily) return;
  countdown.stop();
  clearMismatchTimer();
  app.gameSerial += 1;
  app.game = createGame(app.daily.cats, modeId);
  board.build(app.game, app.catsById);
  updateHud(app.game);
  showSheet(null);
}

/** @param {string} cardId */
function handleCardClick(cardId) {
  const game = app.game;
  if (!game) return;

  // そろったカード → 大きく見る
  const card = game.cards.find((c) => c.cardId === cardId);
  if (card?.state === 'matched') {
    lightbox.open(app.catsById.get(card.catId), { shareable: false });
    return;
  }

  const next = flipCard(game, cardId);
  if (next === game) return; // めくれないカードだった
  app.game = next;

  if (game.status === 'ready') countdown.start(next.remainingMs); // 1枚目でタイマー開始

  const justMatched =
    next.matchedCatIds.length > game.matchedCatIds.length ? next.matchedCatIds.at(-1) : null;
  board.update(next, justMatched);
  updateHud(next);

  if (isWaitingForMismatch(next)) {
    const serial = app.gameSerial;
    app.mismatchTimer = setTimeout(() => {
      app.mismatchTimer = null;
      if (serial !== app.gameSerial || !app.game) return;
      app.game = hideMismatched(app.game);
      board.update(app.game);
    }, MISMATCH_DELAY_MS);
  }

  if (next.status === 'finished') finishGame();
}

/** @param {number} remainingMs */
function handleTick(remainingMs) {
  if (!app.game) return;
  const before = app.game;
  app.game = setRemainingTime(before, remainingMs);
  updateHud(app.game);
  if (before.status !== 'finished' && app.game.status === 'finished') {
    clearMismatchTimer();
    board.update(app.game);
    finishGame();
  }
}

function finishGame() {
  countdown.stop();
  const serial = app.gameSerial;
  setTimeout(() => {
    if (serial !== app.gameSerial || !app.game) return;
    lightbox.close();
    fillResult(app.game);
    showSheet('result-sheet');
  }, RESULT_DELAY_MS);
}

function openAlbum() {
  if (!app.daily || !app.game) return;
  renderAlbum(
    document.getElementById('album-grid'),
    app.daily.cats,
    new Set(app.game.matchedCatIds),
    (cat) => lightbox.open(cat, { shareable: true }),
  );
  showSheet('album-sheet');
}

/** @param {Cat} cat */
async function handleShare(cat) {
  if (!app.daily) return;
  const button = /** @type {HTMLButtonElement} */ (document.getElementById('lightbox-share-button'));
  button.disabled = true;
  try {
    const result = await shareCat(cat, app.daily, {
      openPanel: (payload) => {
        lightbox.close();
        sharePanel.open(payload);
      },
    });
    if (result === 'shared') showToast('シェアしました');
  } catch (error) {
    console.error(error);
    showToast('シェアの準備ができませんでした');
  } finally {
    button.disabled = false;
  }
}

function clearMismatchTimer() {
  if (app.mismatchTimer !== null) clearTimeout(app.mismatchTimer);
  app.mismatchTimer = null;
}
