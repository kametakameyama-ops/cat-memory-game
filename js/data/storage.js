// ブラウザ内に小さな設定を保存する（前回選んだモードなど）。
// プライベートブラウズなどで保存できない環境でも、エラーにせず動き続ける。

const PREFIX = 'neko-challenge:';

/**
 * @param {string} key
 * @param {string} fallback 保存されていないときの値
 */
export function loadSetting(key, fallback) {
  try {
    return localStorage.getItem(PREFIX + key) ?? fallback;
  } catch {
    return fallback;
  }
}

/**
 * @param {string} key
 * @param {string} value
 */
export function saveSetting(key, value) {
  try {
    localStorage.setItem(PREFIX + key, value);
  } catch {
    // 保存できなくても困らない設定だけを扱うので、何もしない
  }
}
