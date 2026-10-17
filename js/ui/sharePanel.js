// シェア用パネル（共有メニューが使えないPCなどで表示）。

import { buildPostUrl } from '../share/shareCat.js';
import { showToast } from './toast.js';

/** @typedef {import('../share/shareCat.js').SharePayload} SharePayload */

export class SharePanel {
  constructor() {
    this.root = document.getElementById('share-panel');
    this.preview = /** @type {HTMLImageElement} */ (document.getElementById('share-preview'));
    this.steps = document.getElementById('share-steps');
    this.copyButton = document.getElementById('share-copy-button');
    this.linkButton = document.getElementById('share-link-button');
    this.saveButton = document.getElementById('share-save-button');
    this.postLink = /** @type {HTMLAnchorElement} */ (document.getElementById('share-post-link'));
    /** @type {SharePayload | null} */
    this.payload = null;
    this.objectUrl = null;

    document.getElementById('share-close-button').addEventListener('click', () => this.close());
    this.root.addEventListener('click', (event) => {
      if (event.target === this.root) this.close();
    });
    this.copyButton.addEventListener('click', () => this.copyImage());
    this.linkButton.addEventListener('click', () => this.copyLink());
    this.saveButton.addEventListener('click', () => this.saveImage());
  }

  /** @param {SharePayload} payload */
  open(payload) {
    this.payload = payload;
    this.releaseObjectUrl();
    const blob = payload.imageBlob;
    const canCopy = Boolean(blob) && blob.type === 'image/png' && canWriteImageToClipboard();

    // 見本: 添付できる画像があればそれを、なければ猫の写真を出す
    if (blob) {
      this.objectUrl = URL.createObjectURL(blob);
      this.preview.src = this.objectUrl;
    } else {
      this.preview.src = payload.previewUrl;
    }
    this.copyButton.hidden = !canCopy;
    this.saveButton.hidden = !blob;
    this.postLink.href = buildPostUrl(payload);
    this.steps.replaceChildren(...stepsFor(Boolean(blob), canCopy).map(toListItem));
    this.root.hidden = false;
    this.postLink.focus();
  }

  close() {
    this.root.hidden = true;
    this.releaseObjectUrl();
  }

  async copyImage() {
    const blob = this.payload?.imageBlob;
    if (!blob) return;
    try {
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
      showToast('画像をコピーしました');
    } catch {
      showToast('コピーできませんでした。「画像を保存」を使ってください');
    }
  }

  async copyLink() {
    if (!this.payload) return;
    const text = `${this.payload.text}\n${this.payload.url}`;
    try {
      await navigator.clipboard.writeText(text);
      showToast('投稿文とリンクをコピーしました');
    } catch {
      showToast('コピーできませんでした');
    }
  }

  saveImage() {
    if (!this.objectUrl || !this.payload) return;
    const a = document.createElement('a');
    a.href = this.objectUrl;
    a.download = this.payload.fileName;
    document.body.append(a);
    a.click();
    a.remove();
  }

  releaseObjectUrl() {
    if (this.objectUrl) URL.revokeObjectURL(this.objectUrl);
    this.objectUrl = null;
  }
}

/** 画像をクリップボードに書けるブラウザか */
function canWriteImageToClipboard() {
  return typeof ClipboardItem !== 'undefined' && typeof navigator.clipboard?.write === 'function';
}

/**
 * 手順の説明文。
 * @param {boolean} hasImage
 * @param {boolean} canCopy
 */
function stepsFor(hasImage, canCopy) {
  if (!hasImage) {
    return [
      '「Xで投稿」を押すと、この子のページのリンク付きで投稿画面が開きます',
      '投稿すると、リンクのプレビューにこの子の写真が大きく表示されます',
    ];
  }
  return [
    canCopy ? '「画像をコピー」か「画像を保存」を押す' : '「画像を保存」を押す',
    canCopy
      ? '「Xで投稿」を押して、投稿画面に画像を貼り付けるか添付する'
      : '「Xで投稿」を押して、保存した画像を添付する',
  ];
}

/** @param {string} text */
function toListItem(text) {
  const li = document.createElement('li');
  li.textContent = text;
  return li;
}
