// 盤面の表示。GameState を受け取って、カードの見た目を合わせるだけ。
// 画面の大きさと向きに合わせて、並べ方（5×8 / 8×5）とカードの大きさを自動で決める。

import { BOARD_LAYOUTS } from '../config.js';

/** @typedef {import('../types.js').Cat} Cat */
/** @typedef {import('../types.js').GameState} GameState */

export class BoardView {
  /**
   * @param {HTMLElement} boardEl  カードを並べる要素
   * @param {HTMLElement} areaEl   盤面が使える領域（この大きさに合わせる）
   * @param {{ onCardClick: (cardId: string) => void }} handlers
   */
  constructor(boardEl, areaEl, handlers) {
    this.boardEl = boardEl;
    this.areaEl = areaEl;
    this.handlers = handlers;
    /** @type {Map<string, HTMLButtonElement>} cardId → カードの要素 */
    this.cardEls = new Map();

    boardEl.addEventListener('click', (event) => {
      const cardEl = /** @type {HTMLElement} */ (event.target).closest('.card');
      if (cardEl) this.handlers.onCardClick(cardEl.dataset.cardId);
    });
    new ResizeObserver(() => this.fitToArea()).observe(areaEl);
  }

  /**
   * 新しいゲームのカードを並べ直す。
   * @param {GameState} state
   * @param {Map<string, Cat>} catsById
   */
  build(state, catsById) {
    this.boardEl.replaceChildren();
    this.cardEls.clear();
    for (const card of state.cards) {
      const cat = catsById.get(card.catId);
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'card';
      el.dataset.cardId = card.cardId;
      el.innerHTML = `
        <span class="card__inner">
          <span class="card__face card__back"></span>
          <span class="card__face card__front"><img alt="" draggable="false"></span>
        </span>`;
      el.querySelector('img').src = cat.imageUrl;
      this.boardEl.append(el);
      this.cardEls.set(card.cardId, el);
    }
    this.update(state);
    this.fitToArea();
  }

  /**
   * カードの表裏を今の状態に合わせる。
   * @param {GameState} state
   * @param {string | null} [justMatchedCatId] たった今そろった猫（跳ねる演出用）
   */
  update(state, justMatchedCatId = null) {
    state.cards.forEach((card, index) => {
      const el = this.cardEls.get(card.cardId);
      if (!el) return;
      el.dataset.state = card.state;
      el.setAttribute('aria-label', cardLabel(card.state, index));
      if (justMatchedCatId && card.catId === justMatchedCatId) {
        el.classList.remove('is-just-matched');
        void el.offsetWidth; // アニメーションをやり直すため
        el.classList.add('is-just-matched');
      }
    });
  }

  /** 領域の大きさから、並べ方とカードの大きさを決める */
  fitToArea() {
    const style = getComputedStyle(this.areaEl);
    const width = this.areaEl.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
    const height = this.areaEl.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
    if (width <= 0 || height <= 0) return;

    const layout = height >= width ? BOARD_LAYOUTS.portrait : BOARD_LAYOUTS.landscape;
    // すき間はカードの8%くらい（最小4px）。まず大まかに計算してから、すき間を入れて決め直す
    const rough = Math.min(width / layout.cols, height / layout.rows);
    const gap = Math.max(4, Math.round(rough * 0.08));
    const size = Math.floor(
      Math.min(
        (width - gap * (layout.cols - 1)) / layout.cols,
        (height - gap * (layout.rows - 1)) / layout.rows,
      ),
    );

    const board = this.boardEl.style;
    board.setProperty('--cols', String(layout.cols));
    board.setProperty('--card-size', `${Math.max(size, 20)}px`);
    board.setProperty('--card-gap', `${gap}px`);
  }
}

/**
 * 読み上げ用のカードの名前。
 * @param {import('../types.js').CardState} state
 * @param {number} index
 */
function cardLabel(state, index) {
  const position = `${index + 1}枚目`;
  if (state === 'hidden') return `${position}、裏向き`;
  if (state === 'matched') return `${position}、そろった猫。タップで大きく見る`;
  return `${position}、めくった猫`;
}
