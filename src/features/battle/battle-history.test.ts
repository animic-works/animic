import { describe, expect, it } from "vite-plus/test";
import * as v from "valibot";

import {
  getBattleDetail,
  getBattleHistoryStats,
  getBattleRecords,
  savedBattleResultSchema,
} from "./battle-history";
import type { SavedBattleResult } from "./battle-history";

const image = (id: string) => `https://example.invalid/${id}.webp`;

/** `ids`の順に参加し、`submitted`の人だけが提出した対戦の保存済み結果。 */
function saved(
  ids: string[],
  submitted: string[],
  result: SavedBattleResult["result"],
  scores: SavedBattleResult["scores"],
): SavedBattleResult {
  return v.parse(savedBattleResultSchema, {
    battleId: "battle",
    roomCode: "ABCDEFGH",
    names: { a: "エー", b: "ビー" },
    topic: { id: "topic", difficulty: "normal", imageUrl: image("topic") },
    settings: { difficulty: "normal", durationSeconds: 90, selectionSeconds: 15 },
    participantIds: ids,
    submissions: ids.map((id) =>
      submitted.includes(id)
        ? {
            participantId: id,
            status: "submitted",
            generationId: `generation-${id}`,
            submittedAt: 1_000_000 + 42_400,
            successfulGenerationCount: 3,
            eligibleForSpeedBonus: true,
          }
        : { participantId: id, status: "not-submitted", decidedAt: 1_105_000 },
    ),
    result,
    scores,
    startedAt: 1_000_000,
    submittedImages: submitted.map((id) => ({
      id: `generation-${id}`,
      participantId: id,
      imageUrl: image(id),
    })),
  });
}

describe("参加者ごとの戦績", () => {
  it("採点で決まった対戦は、スコアの高い順に順位を付ける", () => {
    const records = getBattleRecords(
      saved(
        ["a", "b"],
        ["a", "b"],
        { kind: "win", reason: "higher-score", winnerId: "b", decidedAt: 2 },
        [
          { participantId: "a", total: 61.2 },
          { participantId: "b", total: 80 },
        ],
      ),
    );
    expect(records).toEqual([
      {
        battleId: "battle",
        participantId: "a",
        startedAt: 1_000_000,
        difficulty: "normal",
        participantCount: 2,
        rank: 2,
        total: 61.2,
        imageUrl: image("a"),
      },
      expect.objectContaining({ participantId: "b", rank: 1, total: 80, imageUrl: image("b") }),
    ]);
  });
  it("引き分けは両方を1位にする", () => {
    const records = getBattleRecords(
      saved(["a", "b"], ["a", "b"], { kind: "draw", reason: "same-score", decidedAt: 2 }, [
        { participantId: "a", total: 70 },
        { participantId: "b", total: 70 },
      ]),
    );
    expect(records.map((record) => record.rank)).toEqual([1, 1]);
  });
  it("1人だけ提出した場合は採点を待たずに1位にし、未提出の人は順位なしにする", () => {
    const records = getBattleRecords(
      saved(
        ["a", "b"],
        ["a"],
        { kind: "win", reason: "opponent-not-submitted", winnerId: "a", decidedAt: 2 },
        null,
      ),
    );
    expect(records.map(({ rank, total, imageUrl }) => ({ rank, total, imageUrl }))).toEqual([
      { rank: 1, total: null, imageUrl: image("a") },
      { rank: null, total: null, imageUrl: null },
    ]);
  });
  it("勝負不成立は全員を順位なしにし、提出した画像は残す", () => {
    const records = getBattleRecords(
      saved(
        ["a", "b"],
        ["a", "b"],
        { kind: "no-contest", reason: "scoring-failed", decidedAt: 2 },
        null,
      ),
    );
    expect(records.map(({ rank, imageUrl }) => ({ rank, imageUrl }))).toEqual([
      { rank: null, imageUrl: image("a") },
      { rank: null, imageUrl: image("b") },
    ]);
  });
  it("3人以上では、採点できなかった人と未提出の人を順位なしにする", () => {
    const records = getBattleRecords(
      saved(
        ["a", "b", "c", "d"],
        ["a", "b", "c"],
        { kind: "win", reason: "higher-score", winnerId: "c", decidedAt: 2 },
        [
          { participantId: "a", total: 50 },
          { participantId: "c", total: 90 },
        ],
      ),
    );
    expect(records.map((record) => [record.participantId, record.rank])).toEqual([
      ["a", 2],
      ["b", null],
      ["c", 1],
      ["d", null],
    ]);
  });
});

describe("マイページの成績", () => {
  it("1位の回数・対戦数・勝率・ベストスコア・平均の再現度を求める", () => {
    expect(
      getBattleHistoryStats([
        { rank: 1, total: 80 },
        { rank: 2, total: 61 },
        { rank: null, total: null },
      ]),
    ).toEqual({ matches: 3, wins: 1, winRate: 33, bestTotal: 80, averageTotal: 70.5 });
  });
  it("戦績がなければ0と値なしにする", () => {
    expect(getBattleHistoryStats([])).toEqual({
      matches: 0,
      wins: 0,
      winRate: 0,
      bestTotal: null,
      averageTotal: null,
    });
  });
});

describe("戦績の詳細", () => {
  it("提出までの時間・生成回数と、全員の順位をスコアの高い順に返す", () => {
    const detail = getBattleDetail(
      saved(
        ["a", "b", "c"],
        ["a", "b", "c"],
        { kind: "win", reason: "higher-score", winnerId: "b", decidedAt: 2 },
        [
          { participantId: "a", total: 61.2 },
          { participantId: "b", total: 80 },
        ],
      ),
      "a",
    );
    expect(detail).toMatchObject({
      rank: 2,
      total: 61.2,
      imageUrl: image("a"),
      submission: { seconds: 42, withinTimeLimit: true, generationCount: 3 },
      participantCount: 3,
    });
    expect(detail.ranking).toEqual([
      {
        key: 1,
        name: "ビー",
        isMe: false,
        rank: 1,
        total: 80,
        submitted: true,
        imageUrl: image("b"),
      },
      {
        key: 0,
        name: "エー",
        isMe: true,
        rank: 2,
        total: 61.2,
        submitted: true,
        imageUrl: image("a"),
      },
      // 採点できなかった人の提出画像は、結果画面と同じく公開しない。
      { key: 2, name: null, isMe: false, rank: null, total: null, submitted: true, imageUrl: null },
    ]);
    expect(JSON.stringify(detail)).not.toContain('"b"');
  });
  it("勝負不成立でも自分の提出画像は返し、相手の画像は返さない", () => {
    const detail = getBattleDetail(
      saved(
        ["a", "b"],
        ["a", "b"],
        { kind: "no-contest", reason: "scoring-failed", decidedAt: 2 },
        null,
      ),
      "b",
    );
    expect(detail.imageUrl).toBe(image("b"));
    expect(detail.ranking.map((player) => player.imageUrl)).toEqual([null, image("b")]);
  });
  it("未提出なら提出の情報を返さない", () => {
    const detail = getBattleDetail(
      saved(
        ["a", "b"],
        ["a"],
        { kind: "win", reason: "opponent-not-submitted", winnerId: "a", decidedAt: 2 },
        null,
      ),
      "b",
    );
    expect(detail).toMatchObject({ rank: null, total: null, imageUrl: null, submission: null });
  });
  it("表示名を保存していない結果も読み込める", () => {
    const { names: _names, ...older } = saved(
      ["a", "b"],
      [],
      { kind: "no-contest", reason: "no-submissions", decidedAt: 2 },
      null,
    );
    expect(v.parse(savedBattleResultSchema, older).names).toEqual({});
  });
});
