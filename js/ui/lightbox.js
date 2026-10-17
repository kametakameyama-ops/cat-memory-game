// 猫の写真を大きく表示する。
// ゲーム中は「シェア」ボタンを隠し、アルバムからはシェアできるようにする。

/** @typedef {import('../types.js').Cat} Cat */

export class Lightbox {
  /**
   * @param {{
   *   onOpen?: () => void,
   *   onClose?: () => void,
   *   onShare?: (cat: Cat) => void,
   * }} handlers
   */
  constructor(handlers) {
    this.handlers = handlers;
    this.root = document.getElementById('lightbox');
    this.image = /** @type {HTMLImageElement} */ (document.getElementById('lightbox-image'));
    this.caption = document.getElementById('lightbox-caption');
    this.shareButton = document.getElementById('lightbox-share-button');
    /** @type {Cat | null} */
    this.cat = null;

    document.getElementById('lightbox-close-button').addEventListener('click', () => this.close());
    this.root.addEventListener('click', (event) => {
      if (event.target === this.root) this.close();
    });
    this.shareButton.addEventListener('click', () => {
      if (this.cat) this.handlers.onShare?.(this.cat);
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !this.root.hidden) this.close();
    });
  }

  get isOpen() {
    return !this.root.hidden;
  }

  /**
   * @param {Cat} cat
   * @param {{ shareable: boolean }} options
   */
  open(cat, { shareable }) {
    this.cat = cat;
    this.image.src = cat.imageUrl;
    this.image.alt = cat.breed ? `${cat.breed}の猫の写真` : '猫の写真';
    this.caption.textContent = cat.breed ?? '';
    this.shareButton.hidden = !shareable;
    this.root.hidden = false;
    this.handlers.onOpen?.();
    (shareable ? this.shareButton : document.getElementById('lightbox-close-button')).focus();
  }

  close() {
    if (this.root.hidden) return;
    this.root.hidden = true;
    this.cat = null;
    this.handlers.onClose?.();
  }
}
