import type { BattleSettings } from "./battle-state";

// 画面で使う条件の文言
export const DIFFICULTY_LABELS = {
  easy: "かんたん",
  normal: "ふつう",
  hard: "むずかしい",
} as const;
// お題の条件（挿絵の上では「・」ではなく線で区切る）
export const DIFFICULTY_RULE_PARTS = {
  easy: ["背景なし", "1キャラクター"],
  normal: ["背景あり", "1キャラクター"],
  hard: ["背景あり", "2キャラクター"],
} as const;
export const DIFFICULTY_RULES = {
  easy: DIFFICULTY_RULE_PARTS.easy.join("・"),
  normal: DIFFICULTY_RULE_PARTS.normal.join("・"),
  hard: DIFFICULTY_RULE_PARTS.hard.join("・"),
} as const;
// 挿絵の上に出す英語の見出し
export const DIFFICULTY_WORDS = { easy: "EASY", normal: "NORMAL", hard: "HARD" } as const;
// 難易度の挿絵（お題の条件に合わせたサンプル画像。public/ に置く）
export const DIFFICULTY_SAMPLES = {
  easy: "/topic-sample-easy.webp",
  normal: "/topic-sample-normal.webp",
  hard: "/topic-sample-hard.webp",
} as const;

export const DEFAULT_SETTINGS: BattleSettings = {
  difficulty: "easy",
  durationSeconds: 90,
  selectionSeconds: 30,
};

export const DURATION_OPTIONS = [60, 90, 120] as const;
export const SELECTION_OPTIONS = [15, 30, 60] as const;

export function describeSettings(settings: BattleSettings) {
  return `${DIFFICULTY_LABELS[settings.difficulty]}・${settings.durationSeconds}秒`;
}
