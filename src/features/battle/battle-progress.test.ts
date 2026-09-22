import { describe, expect, it } from "vite-plus/test";
import * as v from "valibot";
import {
  acceptGeneration,
  battleStateSchema,
  createBattle,
  finishGeneration,
  getBattleSnapshot,
  reconcileBattle,
  submitImage,
  serializeBattleResult,
  startNextBattle,
} from "./battle-state";
import type { BattleState } from "./battle-state";

function battle() {
  return createBattle(
    { difficulty: "easy", durationSeconds: 10, selectionSeconds: 5 },
    { id: "topic", difficulty: "easy", imageUrl: "https://example.invalid/topic.png" },
    ["a", "b"],
    0,
  );
}
function accept(state: BattleState, id: string, participantId = "a", now = 1000) {
  return acceptGeneration(state, { id, participantId, inputHash: `prompt-${id}` }, now).battle;
}
function success(state: BattleState, id: string, now = 2000) {
  return finishGeneration(
    state,
    id,
    { status: "succeeded", imageUrl: `https://example.invalid/${id}.png` },
    now,
  );
}

describe("生成受付と完了", () => {
  it("締切ちょうどの新規受付と途中参加者の生成を拒否する", () => {
    expect(() => accept(battle(), "one", "a", 10_000)).toThrow();
    expect(() => accept(battle(), "one", "late")).toThrow();
    expect(accept(battle(), "one", "a", 9999).generations).toHaveLength(1);
  });
  it("同じ要求の再送は締切後も二重受付せず、別の内容や本人には流用できない", () => {
    const initial = accept(battle(), "one");
    const retried = acceptGeneration(
      initial,
      { id: "one", participantId: "a", inputHash: "prompt-one" },
      11_000,
    );
    expect(retried.accepted).toBe(false);
    expect(retried.battle.generations).toEqual(initial.generations);
    expect(() =>
      acceptGeneration(initial, { id: "one", participantId: "a", inputHash: "changed" }, 2000),
    ).toThrow();
    expect(() => accept(initial, "one", "b")).toThrow();
  });
  it("時間内に受け付けた画像は時間切れ後も完成・提出できる", () => {
    const pending = reconcileBattle(accept(battle(), "one"), 10_000);
    expect(pending.selectionEndsAt).toBeNull();
    const completed = success(pending, "one", 12_000);
    expect(completed.selectionEndsAt).toBe(17_000);
    const submitted = submitImage(completed, "a", "one", 16_999);
    expect(submitted.submissions[0]).toMatchObject({
      status: "submitted",
      eligibleForSpeedBonus: false,
    });
  });
  it("複数人の生成処理がすべて終わってから共通の選択猶予を数える", () => {
    let state = accept(accept(battle(), "one"), "two", "b");
    state = success(state, "one", 12_000);
    expect(state.selectionEndsAt).toBeNull();
    state = finishGeneration(state, "two", { status: "failed" }, 13_000);
    expect(state.selectionEndsAt).toBe(18_000);
    expect(success(state, "one", 20_000).selectionEndsAt).toBe(18_000);
    expect(success(state, "two", 20_000).generations[1]?.status).toBe("failed");
  });
  it("受付のない完了通知を反映しない", () => {
    expect(() => success(battle(), "unknown")).toThrow();
  });
});

describe("提出と期限", () => {
  it("他人・未完成・失敗・存在しない画像は提出できない", () => {
    let state = accept(accept(accept(battle(), "other", "b"), "pending"), "failed");
    state = success(state, "other");
    state = finishGeneration(state, "failed", { status: "failed" }, 2000);
    for (const id of ["other", "pending", "failed", "unknown"]) {
      expect(() => submitImage(state, "a", id, 3000)).toThrow();
    }
    expect(() => submitImage(state, "late", "other", 3000)).toThrow();
  });
  it("選んだ画像の順番ではなく提出までの成功回数を固定する", () => {
    let state = battle();
    for (let i = 1; i <= 5; i += 1) state = success(accept(state, `image-${i}`), `image-${i}`);
    state = accept(state, "late");
    state = finishGeneration(accept(state, "failed"), "failed", { status: "failed" }, 2000);
    const submitted = submitImage(state, "a", "image-2", 3000);
    expect(submitted.submissions[0]).toMatchObject({
      generationId: "image-2",
      successfulGenerationCount: 5,
      submittedAt: 3000,
      eligibleForSpeedBonus: true,
    });
    expect(success(submitted, "late", 4000).submissions).toEqual(submitted.submissions);
    expect(() => accept(submitted, "new", "a", 4000)).toThrow();
    expect(() => submitImage(submitted, "a", "image-3", 4000)).toThrow();
    expect(submitImage(submitted, "a", "image-2", 50_000).submissions[0]).toEqual(
      submitted.submissions[0],
    );
  });
  it("生成がなければ生成終了時刻から数え、Alarmが遅れても期限を延長しない", () => {
    const state = reconcileBattle(battle(), 20_000);
    expect(state.selectionEndsAt).toBe(15_000);
    expect(state.submissions).toEqual([
      { participantId: "a", status: "not-submitted", decidedAt: 15_000 },
      { participantId: "b", status: "not-submitted", decidedAt: 15_000 },
    ]);
    expect(reconcileBattle(state, 30_000)).toEqual(state);
  });
  it("選択期限ちょうどは提出を拒否し、自動で画像を選ばない", () => {
    const state = success(accept(battle(), "one"), "one");
    expect(submitImage(state, "a", "one", 14_999).submissions[0]?.status).toBe("submitted");
    expect(() => submitImage(state, "a", "one", 15_000)).toThrow();
    expect(reconcileBattle(state, 15_000).submissions[0]).toEqual({
      participantId: "a",
      status: "not-submitted",
      decidedAt: 15_000,
    });
  });
  it("保存した状態の復元で期限や提出をリセットしない", () => {
    const state = submitImage(success(accept(battle(), "one"), "one", 12_000), "a", "one", 13_000);
    const restored = v.parse(battleStateSchema, JSON.parse(JSON.stringify(state)));
    expect(reconcileBattle(restored, 16_000)).toEqual(state);
  });
  it("本人の履歴だけを配信し、他人の画像と入力照合用ハッシュを送らない", () => {
    const state = success(success(accept(accept(battle(), "one"), "other", "b"), "one"), "other");
    const own = getBattleSnapshot(state, "a", 3000);
    expect(own.myGenerations).toHaveLength(1);
    expect(own.myGenerations[0]?.id).toBe("one");
    expect(JSON.stringify(own)).not.toContain("prompt-");
    expect(JSON.stringify(own)).not.toContain("other.png");
    expect(getBattleSnapshot(state, "late", 3000).myGenerations).toEqual([]);
  });
});

describe("未提出による1対1の勝敗", () => {
  it("片方だけ提出した場合は提出者の勝ちとし、締切前には確定しない", () => {
    const state = submitImage(success(accept(battle(), "one"), "one"), "a", "one", 3000);
    expect(reconcileBattle(state, 14_999).result).toBeNull();
    const ended = reconcileBattle(state, 15_000);
    expect(ended.result).toEqual({
      kind: "win",
      reason: "opponent-not-submitted",
      winnerId: "a",
      decidedAt: 15_000,
    });
    expect(reconcileBattle(ended, 50_000).result).toEqual(ended.result);
    expect(getBattleSnapshot(ended, "b", 20_000).result).toEqual(ended.result);
  });
  it("両方未提出なら勝負不成立にする", () => {
    expect(reconcileBattle(battle(), 20_000).result).toEqual({
      kind: "no-contest",
      reason: "no-submissions",
      decidedAt: 15_000,
    });
  });
  it("両方提出していれば採点せず勝敗を決めない", () => {
    const generated = success(success(accept(accept(battle(), "one"), "two", "b"), "one"), "two");
    const submitted = submitImage(submitImage(generated, "a", "one", 3000), "b", "two", 4000);
    expect(reconcileBattle(submitted, 20_000).result).toBeNull();
  });
  it("複数人対戦へ未合意の順位ルールを適用しない", () => {
    const state = battle();
    state.participantIds.push("c");
    expect(reconcileBattle(state, 20_000).result).toBeNull();
  });
});

it("結果保存には提出画像だけを含め、入力ハッシュや未提出の履歴を含めない", () => {
  let state = success(
    success(accept(accept(battle(), "selected"), "unused"), "selected"),
    "unused",
  );
  expect(() => serializeBattleResult(state, "ABCDEFGH")).toThrow();
  state = reconcileBattle(submitImage(state, "a", "selected", 3000), 15_000);
  const record = serializeBattleResult(state, "ABCDEFGH");
  expect(record).toContain("selected.png");
  expect(record).not.toContain("unused.png");
  expect(record).not.toContain("inputHash");
  expect(record).not.toContain("prompt-");
});

describe("同じルームでの再戦", () => {
  it("対戦ID・履歴・締切を新しくし、前の提出と結果は変更しない", () => {
    const ended = reconcileBattle(battle(), 15_000);
    const saved = serializeBattleResult(ended, "ABCDEFGH");
    const next = startNextBattle(ended, ended.id, ended.settings, ended.topic, ["a", "c"], 20_000);
    expect(next.id).not.toBe(ended.id);
    expect(next.previousBattleId).toBe(ended.id);
    expect(next.generationEndsAt).toBe(30_000);
    expect(next.participantIds).toEqual(["a", "c"]);
    expect(next.generations).toEqual([]);
    expect(next.submissions).toEqual([]);
    expect(next.result).toBeNull();
    expect(next.selectionEndsAt).toBeNull();
    expect(serializeBattleResult(ended, "ABCDEFGH")).toBe(saved);
  });
  it("進行中の対戦を再戦操作で置き換えない", () => {
    const current = battle();
    expect(() =>
      startNextBattle(current, current.id, current.settings, current.topic, ["a", "b"], 1000),
    ).toThrow();
  });
  it("開始の再送で二重に作らず、古い対戦からの開始要求も拒否する", () => {
    const first = reconcileBattle(battle(), 15_000);
    const second = startNextBattle(
      first,
      first.id,
      first.settings,
      first.topic,
      ["a", "b"],
      20_000,
    );
    expect(
      startNextBattle(second, first.id, first.settings, first.topic, ["a", "b"], 21_000),
    ).toEqual(second);
    expect(() =>
      startNextBattle(second, null, first.settings, first.topic, ["a", "b"], 21_000),
    ).toThrow();
    const ended = reconcileBattle(second, 40_000);
    const third = startNextBattle(ended, ended.id, ended.settings, ended.topic, ["a", "b"], 50_000);
    expect(() =>
      startNextBattle(third, first.id, first.settings, first.topic, ["a", "b"], 51_000),
    ).toThrow();
  });
});
