// 盤面の上に重なる画面（はじめ・おわり・アルバム）の出し入れ。

import { formatTime } from '../game/timer.js';

/** @typedef {import('../types.js').GameState} GameState */

const SHEET_IDS = ['start-sheet', 'result-sheet', 'album-sheet'];

/**
 * 指定した画面だけを表示する。null なら全部隠す。
 * @param {"start-sheet" | "result-sheet" | "album-sheet" | null} id
 */
export function showSheet(id) {
  for (const sheetId of SHEET_IDS) {
    document.getElementById(sheetId).hidden = sheetId !== id;
  }
}

/**
 * モード選択の初期値を入れる。
 * @param {string} modeId
 */
export function setSelectedMode(modeId) {
  const input = /** @type {HTMLInputElement | null} */ (document.getElementById(`mode-${modeId}`));
  if (input) input.checked = true;
}

/** 選ばれているモード */
export function getSelectedMode() {
  const checked = /** @type {HTMLInputElement | null} */ (
    document.querySelector('input[name="mode"]:checked')
  );
  return checked?.value ?? null;
}

/**
 * おわりの画面の文言を、終わり方に合わせて入れる。
 * @param {GameState} state
 */
export function fillResult(state) {
  const title = document.getElementById('result-title');
  const lead = document.getElementById('result-lead');
  const total = state.cards.length / 2;
  if (state.result === 'cleared') {
    title.textContent = `${total}匹ぜんぶに会えました`;
    lead.textContent = `のこり ${formatTime(state.remainingMs)} でそろいました。今日の猫たちを、アルバムでゆっくり見ていってください。`;
  } else {
    title.textContent = '時間になりました';
    lead.textContent = `今日は ${state.matchedCatIds.length}匹 に会えました。会えなかった子も、アルバムで見られます。`;
  }
}
