import * as v from "valibot";
import { describe, expect, it } from "vite-plus/test";

import {
  DEFAULT_BATTLE_OPTIONS,
  battleOptionSetSchema,
  choicesWith,
  readBattleOptions,
  toBattleOptionRows,
} from "./battle-options";

function issue(input: unknown) {
  const result = v.safeParse(battleOptionSetSchema, input);
  return result.success ? null : result.issues[0].message;
}

describe("battleOptionSetSchema", () => {
  it("1〜5個の重複しない整数の候補と、候補に含まれる既定値を受け付ける", () => {
    expect(issue({ choices: [30], defaultSeconds: 30 })).toBeNull();
    expect(issue({ choices: [1, 60, 90, 120, 3600], defaultSeconds: 3600 })).toBeNull();
  });

  it("候補の数・範囲・重複・既定値が条件に合わなければ保存しない", () => {
    expect(issue({ choices: [], defaultSeconds: 30 })).toBe("候補を1つ以上入れてください。");
    expect(issue({ choices: [1, 2, 3, 4, 5, 6], defaultSeconds: 1 })).toBe(
      "候補は5個までにしてください。",
    );
    expect(issue({ choices: [0, 30], defaultSeconds: 30 })).toBe("秒数は1〜3600秒にしてください。");
    expect(issue({ choices: [3601], defaultSeconds: 3601 })).toBe(
      "秒数は1〜3600秒にしてください。",
    );
    expect(issue({ choices: [1.5], defaultSeconds: 1.5 })).toBe("秒数は整数で入力してください。");
    expect(issue({ choices: [30, 30], defaultSeconds: 30 })).toBe("同じ秒数の候補が2つあります。");
    expect(issue({ choices: [30, 60], defaultSeconds: 90 })).toBe(
      "既定値は候補から選んでください。",
    );
  });
});

describe("readBattleOptions", () => {
  it("行がない種類は既定の候補を使う", () => {
    expect(readBattleOptions([])).toEqual(DEFAULT_BATTLE_OPTIONS);
    expect(readBattleOptions([{ kind: "selection", seconds: 20, isDefault: true }])).toEqual({
      duration: DEFAULT_BATTLE_OPTIONS.duration,
      selection: { choices: [20], defaultSeconds: 20 },
    });
  });

  it("候補を短い順に並べ、既定値の印がなければ最初の候補を既定値にする", () => {
    expect(
      readBattleOptions([
        { kind: "duration", seconds: 120, isDefault: false },
        { kind: "duration", seconds: 45, isDefault: false },
      ]).duration,
    ).toEqual({ choices: [45, 120], defaultSeconds: 45 });
  });

  it("保存する行に変換して読み戻すと同じ候補になる", () => {
    const options = {
      duration: { choices: [30, 60], defaultSeconds: 60 },
      selection: { choices: [5], defaultSeconds: 5 },
    };
    expect(readBattleOptions(toBattleOptionRows(options))).toEqual(options);
  });
});

describe("choicesWith", () => {
  it("ルームに保存済みの値が候補になければ加えて並べる", () => {
    expect(choicesWith([60, 90, 120], 90)).toEqual([60, 90, 120]);
    expect(choicesWith([60, 90, 120], 3)).toEqual([3, 60, 90, 120]);
  });
});
