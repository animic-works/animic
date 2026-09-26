import * as v from "valibot";

import illustSimilarityV1 from "./illust-similarity-v1.workflow.json";

const imageUrlSchema = v.pipe(v.string(), v.url());
export const scoringInputsSchema = v.array(
  v.variant("role", [
    v.object({ role: v.literal("topic"), imageUrl: imageUrlSchema }),
    v.object({
      role: v.literal("submission"),
      participantId: v.string(),
      imageUrl: imageUrlSchema,
    }),
  ]),
);
export type ScoringInputs = v.InferOutput<typeof scoringInputsSchema>;
type ScoringTotal = { participantId: string; total: number };

// 採点ワーカーは出力ノードごとの値を、ComfyUIの記録どおり配列で返す。
const runDataSchema = v.array(
  v.object({ label: v.string(), values: v.record(v.string(), v.unknown()) }),
);
const reportedTextSchema = v.pipe(v.array(v.string()), v.minLength(1));
const similaritySchema = v.object({ total: v.pipe(v.number(), v.finite()) });

type ScoringWorkflow = {
  build(inputs: ScoringInputs): string;
  readTotals(inputs: ScoringInputs, data: unknown): ScoringTotal[] | null;
};

function topicAndSubmission(inputs: ScoringInputs) {
  const [topic, submission] = inputs;
  if (inputs.length !== 2 || topic?.role !== "topic" || submission?.role !== "submission")
    throw new Error("お題画像と提出画像を1枚ずつ指定してください。");
  return { topic, submission };
}

const workflows: Record<string, ScoringWorkflow> = {
  "illust-similarity-v1": {
    build(inputs) {
      topicAndSubmission(inputs);
      return JSON.stringify(illustSimilarityV1);
    },
    readTotals(inputs, data) {
      const { submission } = topicAndSubmission(inputs);
      const run = v.safeParse(runDataSchema, data);
      const text = run.success
        ? v.safeParse(
            reportedTextSchema,
            run.output.find((item) => item.label === "similarity")?.values.text,
          )
        : null;
      if (!text?.success) return null;
      let reported: unknown;
      try {
        reported = JSON.parse(text.output[0]);
      } catch {
        return null;
      }
      const similarity = v.safeParse(similaritySchema, reported);
      return similarity.success
        ? [{ participantId: submission.participantId, total: similarity.output.total }]
        : null;
    },
  },
};

export const scoringWorkflowVersion = "illust-similarity-v1";

function getWorkflow(version: string) {
  const workflow = workflows[version];
  if (!workflow) throw new Error(`未知のワークフローです: ${version}`);
  return workflow;
}

export function buildScoringWorkflow(version: string, inputs: ScoringInputs) {
  return getWorkflow(version).build(inputs);
}

export function readScoringTotals(version: string, inputs: ScoringInputs, data: unknown) {
  return getWorkflow(version).readTotals(inputs, data);
}
