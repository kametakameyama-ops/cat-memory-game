// 上部バーの表示（第何回・日付・会えた猫の数・残り時間）。

import { formatTime } from '../game/timer.js';

/** @typedef {import('../types.js').DailyCats} DailyCats */
/** @typedef {import('../types.js').GameState} GameState */

/** 残りがこれ以下になったら、時間の文字をピンクにする */
const LOW_TIME_MS = 30 * 1000;

const els = {
  number: () => document.getElementById('challenge-number'),
  date: () => document.getElementById('challenge-date'),
  matched: () => document.getElementById('matched-count'),
  total: () => document.getElementById('total-count'),
  timer: () => document.getElementById('timer'),
};

/** @param {DailyCats} daily */
export function showChallenge(daily) {
  els.number().textContent = `#${daily.challengeNumber}`;
  els.date().textContent = daily.date.replaceAll('-', '.');
  els.total().textContent = String(daily.cats.length);
}

/** @param {GameState} state */
export function updateHud(state) {
  els.matched().textContent = String(state.matchedCatIds.length);
  const timer = els.timer();
  timer.textContent = formatTime(state.remainingMs);
  timer.parentElement.classList.toggle(
    'status__item--low',
    state.status === 'playing' && state.remainingMs <= LOW_TIME_MS,
  );
}
