import * as v from "valibot";

import type { BattleSettings } from "../battle/battle-state";

export const battleOptionKinds = ["duration", "selection"] as const;
export type BattleOptionKind = (typeof battleOptionKinds)[number];

export const BATTLE_OPTION_LABELS: Record<BattleOptionKind, string> = {
  duration: "制限時間",
  selection: "画像選択の猶予",
};

/** 候補の数の上限。ロビーで1行に並べられる数。 */
export const maxBattleChoices = 5;

const secondsSchema = v.pipe(
  v.number("秒数を入力してください。"),
  v.integer("秒数は整数で入力してください。"),
  v.minValue(1, "秒数は1〜3600秒にしてください。"),
  v.maxValue(3600, "秒数は1〜3600秒にしてください。"),
);

export const battleOptionSetSchema = v.pipe(
  v.object({
    choices: v.pipe(
      v.array(secondsSchema),
      v.minLength(1, "候補を1つ以上入れてください。"),
      v.maxLength(maxBattleChoices, `候補は${maxBattleChoices}個までにしてください。`),
    ),
    defaultSeconds: secondsSchema,
  }),
  v.check(
    (set) => new Set(set.choices).size === set.choices.length,
    "同じ秒数の候補が2つあります。",
  ),
  v.check((set) => set.choices.includes(set.defaultSeconds), "既定値は候補から選んでください。"),
);
type BattleOptionSet = v.InferOutput<typeof battleOptionSetSchema>;

export const battleOptionsSchema = v.object({
  duration: battleOptionSetSchema,
  selection: battleOptionSetSchema,
});
export type BattleOptions = v.InferOutput<typeof battleOptionsSchema>;

/** 運営者が保存していない種類に使う候補。 */
export const DEFAULT_BATTLE_OPTIONS: BattleOptions = {
  duration: { choices: [60, 90, 120], defaultSeconds: 90 },
  selection: { choices: [10, 15, 30], defaultSeconds: 15 },
};

export type BattleOptionRow = { kind: BattleOptionKind; seconds: number; isDefault: boolean };

/** D1の行を候補にする。行のない種類は既定の候補、既定値の印がなければ最初の候補を既定値にする。 */
export function readBattleOptions(rows: readonly BattleOptionRow[]): BattleOptions {
  const read = (kind: BattleOptionKind): BattleOptionSet => {
    const own = rows.filter((row) => row.kind === kind).toSorted((a, b) => a.seconds - b.seconds);
    const [first] = own;
    if (!first) return DEFAULT_BATTLE_OPTIONS[kind];
    return {
      choices: own.map((row) => row.seconds),
      defaultSeconds: (own.find((row) => row.isDefault) ?? first).seconds,
    };
  };
  return { duration: read("duration"), selection: read("selection") };
}

export function toBattleOptionRows(options: BattleOptions): BattleOptionRow[] {
  return battleOptionKinds.flatMap((kind) =>
    options[kind].choices.map((seconds) => ({
      kind,
      seconds,
      isDefault: seconds === options[kind].defaultSeconds,
    })),
  );
}

/** ロビーに出す候補。ルームに保存済みの値が候補になければ加え、短い順に並べる。 */
export function choicesWith(choices: readonly number[], current: number) {
  return [...new Set([...choices, current])].toSorted((a, b) => a - b);
}

/** ホストが選ぶ前の対戦条件。難易度は「かんたん」から始める。 */
export function defaultBattleSettings(options: BattleOptions): BattleSettings {
  return {
    difficulty: "easy",
    durationSeconds: options.duration.defaultSeconds,
    selectionSeconds: options.selection.defaultSeconds,
  };
}
