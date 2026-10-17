// 画面下に短いお知らせを出す。

let current = null;

/**
 * @param {string} message
 * @param {number} [durationMs]
 */
export function showToast(message, durationMs = 2400) {
  current?.remove();
  const el = document.createElement('div');
  el.className = 'toast';
  el.setAttribute('role', 'status');
  el.textContent = message;
  document.body.append(el);
  current = el;
  setTimeout(() => {
    if (current === el) current = null;
    el.remove();
  }, durationMs);
}
