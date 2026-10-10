import { describe, expect, it } from "vite-plus/test";
import * as v from "valibot";
import {
  acceptGeneration,
  applyScoringJobs,
  battleStateSchema,
  createBattle,
  finishGeneration,
  getBattleSnapshot,
  generationTimeoutMs,
  getScoringRequests,
  reconcileBattle,
  submitImage,
  serializeBattleResult,
  startNextBattle,
} from "./battle-state";
import type { BattleState, ScoringJobOutcome } from "./battle-state";

function battle(durationSeconds = 10) {
  return createBattle(
    { difficulty: "easy", durationSeconds, selectionSeconds: 5 },
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
function failure(state: BattleState, id: string, now = 2000) {
  return finishGeneration(state, id, { status: "failed" }, now);
}
function submissionOf(state: BattleState, participantId: string) {
  return state.submissions.find((item) => item.participantId === participantId);
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
    expect(submissionOf(submitted, "a")).toMatchObject({
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

describe("生成のタイムアウトと生成中の上限", () => {
  it("本人の生成が終わるまで次の生成を受け付けず、同じIDの再送には受付時刻を返す", () => {
    const first = acceptGeneration(
      battle(),
      { id: "one", participantId: "a", inputHash: "prompt-one" },
      1000,
    );
    expect(first).toMatchObject({ accepted: true, acceptedAt: 1000 });
    expect(() => accept(first.battle, "two", "a", 2000)).toThrow("生成が終わるまで");
    expect(accept(first.battle, "other", "b", 2000).generations).toHaveLength(2);
    expect(
      acceptGeneration(
        first.battle,
        { id: "one", participantId: "a", inputHash: "prompt-one" },
        3000,
      ),
    ).toMatchObject({ accepted: false, acceptedAt: 1000 });
    expect(accept(success(first.battle, "one", 2000), "two", "a", 3000).generations).toHaveLength(
      2,
    );
  });
  it("受付から1分で失敗にし、タイムアウトした生成は次の受付を塞がない", () => {
    const state = accept(battle(120), "one", "a", 1000);
    const expiresAt = 1000 + generationTimeoutMs;
    expect(reconcileBattle(state, expiresAt - 1).generations[0]?.status).toBe("pending");
    expect(reconcileBattle(state, expiresAt).generations[0]).toMatchObject({
      status: "failed",
      finishedAt: expiresAt,
    });
    expect(accept(state, "two", "a", expiresAt).generations.map((item) => item.status)).toEqual([
      "failed",
      "pending",
    ]);
  });
  it("タイムアウトの後に届いた完了を無視する", () => {
    const state = accept(battle(120), "one", "a", 1000);
    const expiresAt = 1000 + generationTimeoutMs;
    expect(success(state, "one", expiresAt - 1).generations[0]?.status).toBe("succeeded");
    expect(success(state, "one", expiresAt).generations[0]).toMatchObject({
      status: "failed",
      finishedAt: expiresAt,
    });
    expect(success(state, "one", expiresAt + 5000).generations[0]).toMatchObject({
      status: "failed",
      finishedAt: expiresAt,
    });
  });
  it("生成終了後のタイムアウトを最後の完了として画像選択の期限を決め、Alarmの遅れで延ばさない", () => {
    const state = accept(battle(), "one", "a", 9000);
    const expiresAt = 9000 + generationTimeoutMs;
    expect(reconcileBattle(state, 30_000).selectionEndsAt).toBeNull();
    expect(reconcileBattle(state, expiresAt).selectionEndsAt).toBe(expiresAt + 5000);
    // aの生成がタイムアウトで失敗すると提出できる画像がなくなるため、猶予を待たずに確定する。
    expect(reconcileBattle(state, expiresAt + 30_000)).toMatchObject({
      selectionEndsAt: expiresAt + 5000,
      result: { kind: "no-contest", reason: "no-submissions", decidedAt: expiresAt },
    });
  });
  it("結果の確定後もタイムアウトを反映し、結果は変えない", () => {
    let state = success(success(accept(accept(battle(), "one"), "other", "b"), "one"), "other");
    state = accept(state, "two", "a", 3000);
    state = submitImage(submitImage(state, "a", "one", 4000), "b", "other", 4000);
    const scored = applyScoringJobs(state, jobs(state, { a: 71.4, b: 60 }), 5000);
    expect(scored.result?.kind).toBe("win");
    const expired = reconcileBattle(scored, 3000 + generationTimeoutMs);
    expect(expired.generations.find((item) => item.id === "two")).toMatchObject({
      status: "failed",
      finishedAt: 3000 + generationTimeoutMs,
    });
    expect(expired.result).toEqual(scored.result);
    expect(expired.submissions).toEqual(scored.submissions);
  });
});

describe("提出と期限", () => {
  it("他人・未完成・失敗・存在しない画像は提出できない", () => {
    let state = accept(accept(battle(), "other", "b"), "failed");
    state = finishGeneration(state, "failed", { status: "failed" }, 2000);
    state = success(accept(state, "pending", "a", 2000), "other");
    for (const id of ["other", "pending", "failed", "unknown"]) {
      expect(() => submitImage(state, "a", id, 3000)).toThrow();
    }
    expect(() => submitImage(state, "late", "other", 3000)).toThrow();
  });
  it("選んだ画像の順番ではなく提出までの成功回数を固定する", () => {
    let state = battle();
    for (let i = 1; i <= 5; i += 1) state = success(accept(state, `image-${i}`), `image-${i}`);
    state = finishGeneration(accept(state, "failed"), "failed", { status: "failed" }, 2000);
    state = accept(state, "late", "a", 2000);
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
  it("生成処理が終わっていれば生成終了時刻から数え、Alarmが遅れても期限を延長しない", () => {
    const state = reconcileBattle(bothGenerated(), 20_000);
    expect(state.selectionEndsAt).toBe(15_000);
    expect(state.submissions).toEqual([
      { participantId: "a", status: "not-submitted", decidedAt: 15_000 },
      { participantId: "b", status: "not-submitted", decidedAt: 15_000 },
    ]);
    expect(reconcileBattle(state, 30_000)).toEqual(state);
  });
  it("選択期限ちょうどは提出を拒否し、自動で画像を選ばない", () => {
    const state = success(accept(battle(), "one"), "one");
    expect(submissionOf(submitImage(state, "a", "one", 14_999), "a")?.status).toBe("submitted");
    expect(() => submitImage(state, "a", "one", 15_000)).toThrow();
    expect(submissionOf(reconcileBattle(state, 15_000), "a")).toEqual({
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
  it("このアプリが配信する画像は、記録したオリジンによらず同じオリジンのパスで配信する", () => {
    const imageId = "3f2b4c1e-8a7d-4e6f-9b0a-1c2d3e4f5a6b";
    const topicUrl = `https://old.trycloudflare.com/topic-images/t1/${imageId}`;
    const generatedUrl = `http://localhost:3000/generated-images/battle/${imageId}`;
    const started = createBattle(
      { difficulty: "easy", durationSeconds: 10, selectionSeconds: 5 },
      { id: "t1", difficulty: "easy", imageUrl: topicUrl },
      ["a", "b"],
      0,
    );
    const state = finishGeneration(
      accept(started, "one"),
      "one",
      { status: "succeeded", imageUrl: generatedUrl },
      2000,
    );
    const snapshot = getBattleSnapshot(state, "a", 3000);
    expect(snapshot.topic.imageUrl).toBe(`/topic-images/t1/${imageId}`);
    expect(snapshot.myGenerations[0]).toMatchObject({
      imageUrl: `/generated-images/battle/${imageId}`,
    });
    // 採点ジョブに渡すURLは、記録した絶対URLのまま。
    expect(state.topic.imageUrl).toBe(topicUrl);
  });
});

describe("提出できる画像がない参加者", () => {
  it("生成しなかった人は生成終了時刻に未提出として確定し、Alarmが遅れても確定時刻を変えない", () => {
    const state = success(accept(battle(), "one"), "one");
    expect(submissionOf(reconcileBattle(state, 9999), "b")).toBeUndefined();
    const ended = reconcileBattle(state, 10_000);
    expect(submissionOf(ended, "b")).toEqual({
      participantId: "b",
      status: "not-submitted",
      decidedAt: 10_000,
    });
    expect(submissionOf(ended, "a")).toBeUndefined();
    expect(submissionOf(reconcileBattle(state, 14_000), "b")).toEqual(submissionOf(ended, "b"));
  });
  it("失敗だけの人も確定し、生成中の画像がある人は確定しない", () => {
    const state = reconcileBattle(
      accept(failure(accept(battle(), "failed"), "failed"), "two", "b"),
      10_000,
    );
    expect(submissionOf(state, "a")).toEqual({
      participantId: "a",
      status: "not-submitted",
      decidedAt: 10_000,
    });
    expect(submissionOf(state, "b")).toBeUndefined();
  });
  it("生成終了時刻に生成中だった画像が失敗したら、失敗した時刻に確定する", () => {
    const state = accept(success(accept(battle(), "one"), "one"), "late", "b", 9000);
    expect(submissionOf(reconcileBattle(state, 11_000), "b")).toBeUndefined();
    const failed = failure(state, "late", 12_000);
    expect(submissionOf(failed, "b")).toEqual({
      participantId: "b",
      status: "not-submitted",
      decidedAt: 12_000,
    });
    expect(failed.selectionEndsAt).toBe(17_000);
  });
  it("相手が提出済みなら、猶予の終わりを待たずに相手の勝ちにする", () => {
    const state = submitImage(success(accept(battle(), "one"), "one"), "a", "one", 3000);
    expect(reconcileBattle(state, 9999).result).toBeNull();
    expect(reconcileBattle(state, 10_000).result).toEqual({
      kind: "win",
      reason: "opponent-not-submitted",
      winnerId: "a",
      decidedAt: 10_000,
    });
  });
  it("相手も画像がなければ、生成終了時刻で勝負不成立にする", () => {
    expect(reconcileBattle(battle(), 20_000).result).toEqual({
      kind: "no-contest",
      reason: "no-submissions",
      decidedAt: 10_000,
    });
  });
  it("相手が猶予中なら、相手の提出か猶予の終わりで勝敗を決める", () => {
    const state = reconcileBattle(success(accept(battle(), "one"), "one"), 10_000);
    expect(state.result).toBeNull();
    expect(submitImage(state, "a", "one", 12_000).result).toEqual({
      kind: "win",
      reason: "opponent-not-submitted",
      winnerId: "a",
      decidedAt: 12_000,
    });
    expect(reconcileBattle(state, 15_000).result).toEqual({
      kind: "no-contest",
      reason: "no-submissions",
      decidedAt: 15_000,
    });
  });
});

describe("未提出による1対1の勝敗", () => {
  it("片方だけ提出した場合は提出者の勝ちとし、締切前には確定しない", () => {
    const state = submitImage(bothGenerated(), "a", "one", 3000);
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
    expect(reconcileBattle(bothGenerated(), 20_000).result).toEqual({
      kind: "no-contest",
      reason: "no-submissions",
      decidedAt: 15_000,
    });
  });
  it("両方提出しても採点結果がそろうまで勝敗を決めない", () => {
    expect(reconcileBattle(bothSubmitted(), 20_000).result).toBeNull();
  });
});

describe("3人以上の結果", () => {
  it("全員未提出なら勝負不成立、1人だけ提出したら採点を待たずにその人を1位にする", () => {
    // 画像がない人は生成終了時刻に未提出として確定する。
    expect(reconcileBattle(trio(), 20_000).result).toEqual({
      kind: "no-contest",
      reason: "no-submissions",
      decidedAt: 10_000,
    });
    const single = trioSubmitted("b");
    expect(reconcileBattle(single, 9999).result).toBeNull();
    expect(reconcileBattle(single, 10_000).result).toEqual({
      kind: "win",
      reason: "opponent-not-submitted",
      winnerId: "b",
      decidedAt: 10_000,
    });
  });
  it("全員の採点がそろうまで決めず、最高点の人を1位、同点なら引き分けにする", () => {
    const state = trioSubmitted("a", "b", "c");
    expect(applyScoringJobs(state, jobs(state, { a: 70, b: 90 }), 5000).result).toBeNull();
    expect(applyScoringJobs(state, jobs(state, { a: 70, b: 90, c: 80 }), 5000).result).toEqual({
      kind: "win",
      reason: "higher-score",
      winnerId: "b",
      decidedAt: 5000,
    });
    expect(applyScoringJobs(state, jobs(state, { a: 90, b: 90, c: 80 }), 5000).result).toEqual({
      kind: "draw",
      reason: "same-score",
      decidedAt: 5000,
    });
  });
  it("採点に失敗した人と期限までにそろわなかった人は順位なしにし、残りで決める", () => {
    const state = trioSubmitted("a", "b", "c");
    expect(
      applyScoringJobs(state, jobs(state, { a: 70, b: "failed", c: 80 }), 5000).result,
    ).toEqual({ kind: "win", reason: "higher-score", winnerId: "c", decidedAt: 5000 });
    const endsAt = reconcileBattle(state, 5000).scoring.endsAt ?? 0;
    const late = applyScoringJobs(state, jobs(state, { a: 70 }), endsAt - 1);
    expect(late.result).toBeNull();
    expect(reconcileBattle(late, endsAt).result).toEqual({
      kind: "win",
      reason: "higher-score",
      winnerId: "a",
      decidedAt: endsAt,
    });
    const failed = { a: "failed", b: "failed", c: "failed" } as const;
    expect(applyScoringJobs(state, jobs(state, failed), 5000).result).toEqual({
      kind: "no-contest",
      reason: "scoring-failed",
      decidedAt: 5000,
    });
  });
});

function bothGenerated() {
  return success(success(accept(accept(battle(), "one"), "two", "b"), "one"), "two");
}
function trio() {
  return createBattle(
    { difficulty: "easy", durationSeconds: 10, selectionSeconds: 5 },
    { id: "topic", difficulty: "easy", imageUrl: "https://example.invalid/topic.png" },
    ["a", "b", "c"],
    0,
  );
}
function trioSubmitted(...ids: string[]) {
  let state = trio();
  for (const id of ids) state = success(accept(state, `image-${id}`, id), `image-${id}`);
  for (const [index, id] of ids.entries())
    state = submitImage(state, id, `image-${id}`, 3000 + index);
  return state;
}
function bothSubmitted() {
  return submitImage(submitImage(bothGenerated(), "a", "one", 3000), "b", "two", 4000);
}
function jobs(state: BattleState, outcomes: Record<string, number | "failed" | "running">) {
  return state.scoring.entries.map((entry): ScoringJobOutcome => {
    const outcome = outcomes[entry.participantId] ?? "running";
    return typeof outcome === "number"
      ? {
          id: entry.jobId,
          state: "succeeded",
          totals: [{ participantId: entry.participantId, total: outcome }],
        }
      : { id: entry.jobId, state: outcome, totals: [] };
  });
}

describe("採点による1対1の勝敗", () => {
  it("提出ごとに採点を依頼し、再送では依頼を増やさない", () => {
    const state = submitImage(success(accept(battle(), "one"), "one"), "a", "one", 3000);
    expect(getScoringRequests(state)).toEqual([
      {
        jobId: state.scoring.entries[0]?.jobId,
        participantId: "a",
        topicImageUrl: "https://example.invalid/topic.png",
        submissionImageUrl: "https://example.invalid/one.png",
      },
    ]);
    expect(submitImage(state, "a", "one", 4000).scoring.entries).toEqual(state.scoring.entries);
  });
  it("全員の提出確定から採点期限を数え、制限時間の前でも採点結果で勝敗を決める", () => {
    const state = bothSubmitted();
    expect(state.scoring.endsAt).toBe(304_000);
    expect(getBattleSnapshot(state, "a", 5000).scoringEndsAt).toBe(304_000);
    const scored = applyScoringJobs(state, jobs(state, { a: 71.4, b: 60 }), 6000);
    expect(scored.result).toEqual({
      kind: "win",
      reason: "higher-score",
      winnerId: "a",
      decidedAt: 6000,
    });
    expect(getScoringRequests(scored)).toEqual([]);
  });
  it("totalが等しければ引き分けにする", () => {
    const state = bothSubmitted();
    expect(applyScoringJobs(state, jobs(state, { a: 50, b: 50 }), 6000).result).toEqual({
      kind: "draw",
      reason: "same-score",
      decidedAt: 6000,
    });
  });
  it("採点ジョブの失敗や採点期限の超過は勝負不成立にする", () => {
    const state = bothSubmitted();
    const failed = applyScoringJobs(state, jobs(state, { a: 71.4, b: "failed" }), 6000);
    expect(failed.result).toEqual({
      kind: "no-contest",
      reason: "scoring-failed",
      decidedAt: 6000,
    });
    const missingTotal = jobs(state, { a: 71.4, b: 60 }).map((job) =>
      job.totals[0]?.participantId === "b" ? { ...job, totals: [] } : job,
    );
    expect(applyScoringJobs(state, missingTotal, 6000).result?.kind).toBe("no-contest");
    const waiting = applyScoringJobs(state, jobs(state, { a: 71.4 }), 6000);
    expect(reconcileBattle(waiting, 303_999).result).toBeNull();
    expect(reconcileBattle(waiting, 400_000).result).toEqual({
      kind: "no-contest",
      reason: "scoring-failed",
      decidedAt: 304_000,
    });
  });
  it("別の対戦のジョブや結果確定後の採点結果を反映しない", () => {
    const state = bothSubmitted();
    const unrelated = jobs(state, { a: 90, b: 10 }).map((job) => ({ ...job, id: `old-${job.id}` }));
    expect(applyScoringJobs(state, unrelated, 6000)).toEqual(reconcileBattle(state, 6000));
    const scored = applyScoringJobs(state, jobs(state, { a: 71.4, b: 60 }), 6000);
    expect(applyScoringJobs(scored, jobs(state, { a: 10, b: 90 }), 7000)).toEqual(scored);
  });
  it("勝敗の確定前は相手の採点結果と画像を配信せず、確定後に全員分を公開して保存する", () => {
    const state = bothSubmitted();
    const partial = applyScoringJobs(state, jobs(state, { b: 60 }), 6000);
    const before = getBattleSnapshot(partial, "a", 6000);
    expect(before.scores).toBeNull();
    expect(JSON.stringify(before)).not.toContain("two.png");
    const scored = applyScoringJobs(partial, jobs(state, { a: 71.4, b: 60 }), 7000);
    expect(getBattleSnapshot(scored, "a", 7000).scores).toEqual([
      { participantId: "a", total: 71.4, imageUrl: "https://example.invalid/one.png" },
      { participantId: "b", total: 60, imageUrl: "https://example.invalid/two.png" },
    ]);
    const names = new Map([
      ["a", "エー"],
      ["c", "対戦にいない人"],
    ]);
    expect(JSON.parse(serializeBattleResult(scored, "ABCDEFGH", names))).toMatchObject({
      names: { a: "エー" },
      result: { kind: "win", winnerId: "a" },
      scores: [
        { participantId: "a", total: 71.4 },
        { participantId: "b", total: 60 },
      ],
    });
  });
  it("採点の項目がない保存済みの状態も読み込める", () => {
    const { scoring: _scoring, ...saved } = battle();
    expect(v.parse(battleStateSchema, saved).scoring).toEqual({ endsAt: null, entries: [] });
  });
});

it("結果保存には提出画像だけを含め、入力ハッシュや未提出の履歴を含めない", () => {
  let state = success(
    accept(success(accept(battle(), "selected"), "selected"), "unused"),
    "unused",
  );
  expect(() => serializeBattleResult(state, "ABCDEFGH", new Map())).toThrow();
  state = reconcileBattle(submitImage(state, "a", "selected", 3000), 15_000);
  const record = serializeBattleResult(state, "ABCDEFGH", new Map());
  expect(record).toContain("selected.png");
  expect(record).not.toContain("unused.png");
  expect(record).not.toContain("inputHash");
  expect(record).not.toContain("prompt-");
});

describe("同じルームでの再戦", () => {
  it("対戦ID・履歴・締切を新しくし、前の提出と結果は変更しない", () => {
    const ended = reconcileBattle(battle(), 15_000);
    const saved = serializeBattleResult(ended, "ABCDEFGH", new Map());
    const next = startNextBattle(ended, ended.id, ended.settings, ended.topic, ["a", "c"], 20_000);
    expect(next.id).not.toBe(ended.id);
    expect(next.previousBattleId).toBe(ended.id);
    expect(next.generationEndsAt).toBe(30_000);
    expect(next.participantIds).toEqual(["a", "c"]);
    expect(next.generations).toEqual([]);
    expect(next.submissions).toEqual([]);
    expect(next.result).toBeNull();
    expect(next.selectionEndsAt).toBeNull();
    expect(serializeBattleResult(ended, "ABCDEFGH", new Map())).toBe(saved);
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
