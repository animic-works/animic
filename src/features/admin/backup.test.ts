import { strToU8, zipSync } from "fflate";
import { describe, expect, it } from "vite-plus/test";

import { DEFAULT_BATTLE_OPTIONS } from "../room/battle-options";
import {
  backupFileName,
  backupFormat,
  buildBackupZip,
  chunks,
  readBackupZip,
  summarizeBackup,
} from "./backup";
import type { Backup } from "./backup";

const imageId = "8d6f3c1e-2b4a-4c5d-9e8f-0a1b2c3d4e5f";
const imageKey = `topics/t1/${imageId}`;
const imagePath = `topic-images/t1/${imageId}.webp`;

const backup: Backup = {
  format: backupFormat,
  exportedAt: "2026-10-08T00:00:00.000Z",
  topics: [
    {
      id: "t1",
      difficulty: "easy",
      imageUrl: `http://localhost:3000/topic-images/t1/${imageId}`,
      imageKey,
      title: "白背景の少女",
      note: "",
      status: "published",
      createdAt: 1,
      updatedAt: 2,
    },
    {
      id: "easy-001",
      difficulty: "easy",
      imageUrl: "https://example.com/topics/easy-001.webp",
      imageKey: null,
      title: "",
      note: "",
      status: "published",
      createdAt: 0,
      updatedAt: 0,
    },
  ],
  battleOptions: DEFAULT_BATTLE_OPTIONS,
  promptGroups: [
    {
      id: "hair",
      label: "髪の色",
      sortOrder: 0,
      phrases: [{ id: "pink", label: "ピンクの髪", tag: "pink hair", sortOrder: 0 }],
    },
  ],
};

describe("バックアップのZIP", () => {
  it("書き出したZIPを読み戻すと、同じ内容と画像になる", () => {
    const image = new Uint8Array([1, 2, 3]);
    const result = readBackupZip(buildBackupZip(backup, new Map([[imagePath, image]])));
    expect(result.error).toBeNull();
    expect(result.backup).toEqual(backup);
    expect(result.images?.get(imageKey)).toEqual(image);
  });

  it("壊れたZIP・形式の違うファイル・足りない画像を読み込まない", () => {
    expect(readBackupZip(new Uint8Array([1, 2, 3])).error).toBe("ZIPファイルを開けませんでした。");
    expect(readBackupZip(zipSync({ "a.txt": strToU8("a") })).error).toBe(
      "ZIPにbackup.jsonがありません。",
    );
    const other = zipSync({ "backup.json": strToU8(JSON.stringify({ format: "other/1" })) });
    expect(readBackupZip(other).error).toBe(
      "Animicのバックアップ（animic-backup/1）ではありません。（format）",
    );
    expect(readBackupZip(buildBackupZip(backup, new Map())).error).toBe(
      "お題「t1」の画像がZIPにありません。",
    );
    const moved = { ...backup, topics: [{ ...backup.topics[0], id: "t2" }] };
    expect(readBackupZip(buildBackupZip(moved, new Map())).error).toBe(
      "お題「t2」の画像のキーが正しくありません。",
    );
  });
});

describe("summarizeBackup", () => {
  it("IDが同じものを上書き、ないものを追加として数える", () => {
    const empty: Backup = { ...backup, topics: [], promptGroups: [] };
    expect(summarizeBackup(empty, backup)).toEqual({
      topics: { added: 2, updated: 0 },
      promptGroups: { added: 1, updated: 0 },
      promptPhrases: { added: 1, updated: 0 },
    });
    expect(summarizeBackup(backup, backup)).toEqual({
      topics: { added: 0, updated: 2 },
      promptGroups: { added: 0, updated: 1 },
      promptPhrases: { added: 0, updated: 1 },
    });
  });

  it("同じグループに同じ語がある表現は、IDが違っても上書きとして数える", () => {
    const current: Backup = {
      ...backup,
      promptGroups: [
        {
          ...backup.promptGroups[0],
          phrases: [{ id: "other", label: "桃色の髪", tag: "pink hair", sortOrder: 3 }],
        },
      ],
    };
    expect(summarizeBackup(current, backup).promptPhrases).toEqual({ added: 0, updated: 1 });
  });
});

describe("chunks・backupFileName", () => {
  it("決まった件数ずつに分ける", () => {
    expect(chunks([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(chunks([], 2)).toEqual([]);
  });

  it("日本時間の日時でファイル名を付ける", () => {
    expect(backupFileName(new Date("2026-10-07T15:04:05Z"))).toBe(
      "animic-backup-20261008-000405.zip",
    );
  });
});
