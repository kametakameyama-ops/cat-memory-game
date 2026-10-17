// カウントダウンタイマー。
// 時刻の差分で残り時間を計算するので、処理が遅れても時間がずれない。

export class Countdown {
  /**
   * @param {(remainingMs: number) => void} onTick 残り時間が変わるたびに呼ばれる
   */
  constructor(onTick) {
    this.onTick = onTick;
    this.remainingMs = 0;
    this.lastTime = 0;
    this.intervalId = null;
  }

  /** @param {number} remainingMs ここから数え始める */
  start(remainingMs) {
    this.stop();
    this.remainingMs = remainingMs;
    this.resume();
  }

  /** 一時停止（写真を拡大して見ている間など） */
  pause() {
    if (this.intervalId === null) return;
    this.#update();
    clearInterval(this.intervalId);
    this.intervalId = null;
  }

  resume() {
    if (this.intervalId !== null || this.remainingMs <= 0) return;
    this.lastTime = performance.now();
    this.intervalId = setInterval(() => this.#update(), 200);
  }

  stop() {
    if (this.intervalId !== null) clearInterval(this.intervalId);
    this.intervalId = null;
  }

  get isRunning() {
    return this.intervalId !== null;
  }

  #update() {
    const now = performance.now();
    this.remainingMs = Math.max(0, this.remainingMs - (now - this.lastTime));
    this.lastTime = now;
    this.onTick(this.remainingMs);
    if (this.remainingMs <= 0) this.stop();
  }
}

/**
 * ミリ秒を「4:59」の形にする。
 * @param {number} ms
 */
export function formatTime(ms) {
  const totalSec = Math.ceil(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = String(totalSec % 60).padStart(2, '0');
  return `${min}:${sec}`;
}
