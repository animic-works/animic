import { describe, expect, it } from "vite-plus/test";

import {
  assemblePrompt,
  blockLabel,
  commitDraft,
  draftQuery,
  getGenerateBlocker,
  pickSuggestion,
  previewBlocks,
  renderToken,
  splitParts,
  stepWeight,
  takeToken,
  togglePhrase,
} from "./prompt-blocks";
import type { PromptToken } from "./prompt-blocks";

const token = (text: string, weight = 1): PromptToken => ({ text, weight });

describe("splitParts", () => {
  it("読点・カンマ・全角カンマで分け、空白と空の部分を除く", () => {
    expect(splitParts("ピンクの髪、ツインテール , smile，  ,blue eyes")).toEqual([
      "ピンクの髪",
      "ツインテール",
      "smile",
      "blue eyes",
    ]);
    expect(splitParts("   ")).toEqual([]);
  });
});

describe("commitDraft", () => {
  it("最後の区切りより前を確定し、同じ語句は足さない", () => {
    expect(commitDraft([token("Smile")], "ピンクの髪、smile、ツイン")).toEqual({
      tokens: [token("Smile"), token("ピンクの髪")],
      draft: "ツイン",
    });
  });

  it("区切りがなければ変えない", () => {
    expect(commitDraft([token("笑顔")], "ツイン")).toEqual({
      tokens: [token("笑顔")],
      draft: "ツイン",
    });
  });

  it("allなら残りも確定する", () => {
    expect(commitDraft([], "ピンクの髪、ツイン", true)).toEqual({
      tokens: [token("ピンクの髪"), token("ツイン")],
      draft: "",
    });
  });
});

describe("入力候補", () => {
  it("最後の区切りより後ろで探し、採用すると前を確定して候補の言葉を足す", () => {
    expect(draftQuery("ピンクの髪、ツイ")).toBe("ツイ");
    expect(pickSuggestion([token("笑顔")], "ピンクの髪、ツイ", "ツインテール")).toEqual({
      tokens: [token("笑顔"), token("ピンクの髪"), token("ツインテール")],
      draft: "",
    });
  });
});

describe("togglePhrase", () => {
  it("大文字小文字を区別せずに外し、なければ足す", () => {
    expect(togglePhrase([token("Smile"), token("笑顔")], "smile")).toEqual([token("笑顔")]);
    expect(togglePhrase([token("笑顔")], "smile")).toEqual([token("笑顔"), token("smile")]);
  });
});

describe("takeToken", () => {
  it("語句を外して書き直しの文字列にする", () => {
    expect(takeToken([token("笑顔"), token("白背景", 1.2)], 1)).toEqual({
      tokens: [token("笑顔")],
      draft: "白背景",
    });
  });

  it("範囲外なら変えない", () => {
    expect(takeToken([token("笑顔")], 3)).toEqual({ tokens: [token("笑顔")], draft: "" });
  });
});

describe("stepWeight", () => {
  it("0.1ずつ上げ下げし、0.1〜2.0で止める", () => {
    expect(stepWeight([token("a")], 0, 1)).toEqual([token("a", 1.1)]);
    expect(stepWeight([token("a", 2)], 0, 1)).toEqual([token("a", 2)]);
    expect(stepWeight([token("a", 0.1)], 0, -1)).toEqual([token("a", 0.1)]);
    expect(stepWeight([token("a", 0.3)], 0, -1)).toEqual([token("a", 0.2)]);
  });
});

describe("blockLabel", () => {
  it("ベースとキャラの名前を返す", () => {
    expect(blockLabel(0, 1)).toBe("ベース");
    expect(blockLabel(1, 1)).toBe("キャラ");
    expect(blockLabel(1, 2)).toBe("キャラ1");
    expect(blockLabel(2, 2)).toBe("キャラ2");
  });
});

describe("renderToken", () => {
  it("重み1はそのまま、それ以外はNovelAIの数値強調にする", () => {
    expect(renderToken(token("twintails"))).toBe("twintails");
    expect(renderToken(token("twintails", 1.2))).toBe("1.2::twintails::");
    expect(renderToken(token("twintails", 0.5))).toBe("0.5::twintails::");
  });
});

describe("assemblePrompt", () => {
  const blocks = [[token("白背景")], [token("ピンクの髪", 1.2), token("笑顔")]];

  it("入力方法に合わせた区切りで全欄をつなぐ", () => {
    expect(assemblePrompt(blocks, "text")).toBe("白背景、1.2::ピンクの髪::、笑顔");
    expect(assemblePrompt(blocks, "tag")).toBe("白背景, 1.2::ピンクの髪::, 笑顔");
  });

  it("空の欄は飛ばし、すべて空なら空文字にする", () => {
    expect(assemblePrompt([[], [token("smile")], []], "tag")).toBe("smile");
    expect(assemblePrompt([[], []], "text")).toBe("");
  });
});

describe("previewBlocks", () => {
  it("書きかけを選んでいる欄に確定したと仮定する", () => {
    expect(previewBlocks([[], [token("笑顔")]], 1, "白背景")).toEqual([
      [],
      [token("笑顔"), token("白背景")],
    ]);
  });
});

describe("getGenerateBlocker", () => {
  const ready = { locked: false, pending: false, prompt: "笑顔" };

  it("押せない理由を優先順に返す", () => {
    expect(getGenerateBlocker({ ...ready, locked: true, pending: true })).toEqual({
      disabled: true,
      reason: null,
    });
    expect(getGenerateBlocker({ ...ready, pending: true, prompt: "" })).toEqual({
      disabled: true,
      reason: "生成が終わるまでお待ちください",
    });
    expect(getGenerateBlocker({ ...ready, prompt: "" })).toEqual({
      disabled: true,
      reason: "プロンプトを入力してください",
    });
    expect(getGenerateBlocker({ ...ready, prompt: "あ".repeat(1001) })).toEqual({
      disabled: true,
      reason: "プロンプトが1000文字を超えています（1001文字）",
    });
  });

  it("理由がなければ押せる", () => {
    expect(getGenerateBlocker({ ...ready, prompt: "あ".repeat(1000) })).toEqual({
      disabled: false,
      reason: null,
    });
  });
});
