import { describe, expect, it } from "vite-plus/test";
import {
  buildScoringWorkflow,
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

describe("illust-similarity-v1", () => {
  it("お題画像を1枚目、提出画像を2枚目として読み込むワークフローを返す", () => {
    const workflow: unknown = JSON.parse(buildScoringWorkflow(scoringWorkflowVersion, inputs));
    expect(workflow).toMatchObject({
      "1": { inputs: { image: "__INPUT_IMAGE__" } },
      "2": { inputs: { image: "__INPUT_IMAGE_2__" } },
      "3": { class_type: "IllustSimilarityAll", _meta: { title: "similarity" } },
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
});
