// 神経衰弱のルール。
// どの関数も「今の状態」を受け取って「新しい状態」を返すだけで、画面やタイマーには触らない。
// そのため、ルールだけを単独で読んだり確認したりできる。

import { MODES } from '../config.js';
import { createDeck } from './deck.js';

/** @typedef {import('../types.js').Cat} Cat */
/** @typedef {import('../types.js').Card} Card */
/** @typedef {import('../types.js').GameState} GameState */

/**
 * 新しいゲームを作る。カードは毎回シャッフルされる。
 * @param {Cat[]} cats
 * @param {string} modeId
 * @param {() => number} [random]
 * @returns {GameState}
 */
export function createGame(cats, modeId, random = Math.random) {
  const mode = MODES[modeId];
  if (!mode) throw new Error(`知らないモードです: ${modeId}`);
  const timeLimitMs = mode.timeLimitSec * 1000;
  return {
    modeId,
    status: 'ready',
    cards: createDeck(cats, random),
    revealedIds: [],
    matchedCatIds: [],
    moves: 0,
    timeLimitMs,
    remainingMs: timeLimitMs,
    result: null,
  };
}

/**
 * 外れた2枚が表向きのまま待っている状態か（この間は次のカードをめくれない）。
 * @param {GameState} state
 */
export function isWaitingForMismatch(state) {
  return state.revealedIds.length === 2;
}

/**
 * そのカードを今めくれるか。
 * @param {GameState} state
 * @param {string} cardId
 */
export function canFlip(state, cardId) {
  if (state.status === 'finished') return false;
  if (isWaitingForMismatch(state)) return false;
  const card = state.cards.find((c) => c.cardId === cardId);
  return Boolean(card) && card.state === 'hidden';
}

/**
 * カードを1枚めくる。
 * 2枚目なら、揃ったかどうかの判定までここで行う。
 * 外れた場合は2枚とも表向きのまま返すので、少し待ってから hideMismatched() を呼ぶ。
 * @param {GameState} state
 * @param {string} cardId
 * @returns {GameState}
 */
export function flipCard(state, cardId) {
  if (!canFlip(state, cardId)) return state;

  const cards = updateCards(state.cards, [cardId], 'revealed');
  const revealedIds = [...state.revealedIds, cardId];
  /** @type {GameState} */
  let next = {
    ...state,
    status: 'playing',
    cards,
    revealedIds,
  };

  if (revealedIds.length < 2) return next;

  // 2枚目をめくった → 判定
  next = { ...next, moves: state.moves + 1 };
  const [first, second] = revealedIds.map((id) => findCard(cards, id));
  if (first.catId !== second.catId) return next; // 外れ（表向きのまま待つ）

  const matchedCatIds = [...state.matchedCatIds, first.catId];
  next = {
    ...next,
    cards: updateCards(cards, revealedIds, 'matched'),
    revealedIds: [],
    matchedCatIds,
  };
  if (matchedCatIds.length * 2 === cards.length) {
    next = { ...next, status: 'finished', result: 'cleared' };
  }
  return next;
}

/**
 * 外れた2枚を裏に戻す。
 * @param {GameState} state
 * @returns {GameState}
 */
export function hideMismatched(state) {
  if (!isWaitingForMismatch(state)) return state;
  return {
    ...state,
    cards: updateCards(state.cards, state.revealedIds, 'hidden'),
    revealedIds: [],
  };
}

/**
 * 残り時間を更新する。0になったら時間切れで終了。
 * @param {GameState} state
 * @param {number} remainingMs
 * @returns {GameState}
 */
export function setRemainingTime(state, remainingMs) {
  if (state.status !== 'playing') return state;
  const clamped = Math.max(0, remainingMs);
  if (clamped > 0) return { ...state, remainingMs: clamped };
  return {
    ...state,
    remainingMs: 0,
    status: 'finished',
    result: 'timeup',
    // 時間切れの瞬間にめくっていた（未判定の）カードは裏に戻す
    cards: updateCards(state.cards, state.revealedIds, 'hidden'),
    revealedIds: [],
  };
}

// ---- 内部で使う小さな関数 ----

/**
 * @param {Card[]} cards
 * @param {string} cardId
 */
function findCard(cards, cardId) {
  return cards.find((c) => c.cardId === cardId);
}

/**
 * 指定したカードだけ state を変えた新しい配列を返す。
 * @param {Card[]} cards
 * @param {string[]} cardIds
 * @param {import('../types.js').CardState} newState
 * @returns {Card[]}
 */
function updateCards(cards, cardIds, newState) {
  const targets = new Set(cardIds);
  return cards.map((c) => (targets.has(c.cardId) ? { ...c, state: newState } : c));
}
