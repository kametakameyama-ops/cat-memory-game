// ゲーム全体の設定値。数値を変えたいときはここだけを触る。

/** 1ゲームのペア数（カード枚数はこの2倍） */
export const PAIR_COUNT = 20;

/**
 * 遊び方のモード。
 * id はプログラム内で使う名前、label は画面に出す名前。
 */
export const MODES = {
  beginner: { id: 'beginner', label: '初心者モード', timeLimitSec: 10 * 60 },
  normal: { id: 'normal', label: '通常モード', timeLimitSec: 5 * 60 },
};

/** 最初に選ばれているモード */
export const DEFAULT_MODE_ID = 'beginner';

/**
 * 盤面の並べ方。画面が縦長か横長かで自動で切り替える。
 * cols × rows は PAIR_COUNT × 2 と一致させること。
 */
export const BOARD_LAYOUTS = {
  portrait: { cols: 5, rows: 8 },
  landscape: { cols: 8, rows: 5 },
};

/** 2枚めくって外れたとき、裏に戻すまでの待ち時間（ミリ秒） */
export const MISMATCH_DELAY_MS = 900;

/** 今日の猫リストの置き場所 */
export const DAILY_DATA_URL = './data/today.json';

/** 今日のリストが読めなかったときに使う予備のリスト */
export const FALLBACK_DATA_URL = './data/fallback.json';

/** シェア文面に入れる名前とハッシュタグ */
export const GAME_TITLE = '今日の猫チャレンジ';
export const SHARE_HASHTAG = '今日の猫チャレンジ';
