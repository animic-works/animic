import { describe, expect, it } from "vite-plus/test";
import {
  buildScoringWorkflow,
  readScoringMetrics,
  readScoringTotals,
  scoringWorkflowVersion,
} from "./scoring-workflows";
import type { ScoringInputs } from "./scoring-workflows";

const inputs: ScoringInputs = [
  { role: "topic", imageUrl: "https://example.invalid/topic.png" },
  { role: "submission", participantId: "a", imageUrl: "https://example.invalid/a.png" },
];
function run(text: unknown) {
  return [{ nodeId: "3", label: "similarity", values: { text } }];
}

describe("illust-similarity-v2", () => {
  it("お題画像を1枚目、提出画像を2枚目として読み込むワークフローを返す", () => {
    const workflow: unknown = JSON.parse(buildScoringWorkflow(scoringWorkflowVersion, inputs));
    expect(workflow).toMatchObject({
      "1": { inputs: { image: "__INPUT_IMAGE__" } },
      "2": { inputs: { image: "__INPUT_IMAGE_2__" } },
      "3": { class_type: "IllustSimilarityAll", _meta: { title: "similarity" } },
    });
  });
  it("CCIP・PixAI Tagger・SigLIP 2・DINOv2・Depthの5つの指標を使う", () => {
    const workflow: unknown = JSON.parse(buildScoringWorkflow(scoringWorkflowVersion, inputs));
    expect(workflow).toMatchObject({
      "3": {
        inputs: {
          use_ccip: true,
          use_pixai: true,
          use_siglip2: true,
          use_dinov2: true,
          use_depth: true,
        },
      },
    });
  });
  it("お題画像と提出画像の組以外は受け付けない", () => {
    expect(() => buildScoringWorkflow(scoringWorkflowVersion, inputs.toReversed())).toThrow();
    expect(() => buildScoringWorkflow(scoringWorkflowVersion, inputs.slice(0, 1))).toThrow();
    expect(() => buildScoringWorkflow("unknown", inputs)).toThrow();
  });
  it("採点ノードが出力したJSON文字列から提出者のtotalを読み取る", () => {
    const text = JSON.stringify({ depth: { raw: 0.78, score: 67 }, total: 71.4 });
    expect(readScoringTotals(scoringWorkflowVersion, inputs, run([text]))).toEqual([
      { participantId: "a", total: 71.4 },
    ]);
  });
  it("totalを読み取れない出力はnullにする", () => {
    for (const data of [
      run([JSON.stringify({ total: null, band: null })]),
      run(['{"depth": {"raw": NaN}, "total": NaN}']),
      run(["not json"]),
      run([]),
      [{ nodeId: "9", label: "other", values: { text: ['{"total": 50}'] } }],
      [],
      "unexpected",
    ])
      expect(readScoringTotals(scoringWorkflowVersion, inputs, data)).toBeNull();
  });
  it("指標ごとの点を読み、点のない指標はnullにする", () => {
    const text = JSON.stringify({
      total: 65.95,
      ccip: { skipped: "no person in one of the images", raw: 0.17 },
      pixai: { raw: 0.78, score: 74.8, tags_a: ["1girl"] },
      siglip2: { raw: 0.91, score: 71 },
      dinov2: { error: "RuntimeError: download failed" },
      depth: { raw: 0.78, score: 67, mirrored: false },
    });
    expect(readScoringMetrics(scoringWorkflowVersion, run([text]))).toEqual({
      ccip: null,
      pixai: 74.8,
      siglip2: 71,
      dinov2: null,
      depth: 67,
    });
    expect(readScoringMetrics(scoringWorkflowVersion, run(["not json"]))).toBeNull();
  });
});
