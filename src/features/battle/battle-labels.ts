import type { BattleSettings } from "./battle-state";

type Difficulty = BattleSettings["difficulty"];

export const DIFFICULTIES: {
  value: Difficulty;
  label: string;
  description: string;
  extra: boolean;
}[] = [
  { value: "easy", label: "かんたん", description: "白背景・1キャラクター", extra: false },
  { value: "normal", label: "ふつう", description: "背景あり・1キャラクター", extra: false },
  { value: "hard", label: "むずかしい", description: "背景あり・2キャラクター", extra: true },
];

export function getDifficulty(value: Difficulty) {
  const found = DIFFICULTIES.find((item) => item.value === value);
  if (!found) throw new Error("未対応の難易度です。");
  return found;
}
