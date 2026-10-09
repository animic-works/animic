import * as v from "valibot";

import illustSimilarityV2 from "./illust-similarity-v2.workflow.json";
import type { ScoringMetricScores } from "./scoring-metrics";

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

// 除外された指標（人物のいない画像のCCIPなど）や失敗した指標は`score`を持たないため`null`にする。
const metricScoreSchema = v.fallback(
  v.nullable(
    v.pipe(
      v.object({ score: v.pipe(v.number(), v.finite()) }),
      v.transform((metric) => metric.score),
    ),
  ),
  null,
);
const metricsReportSchema = v.object({
  ccip: metricScoreSchema,
  pixai: metricScoreSchema,
  siglip2: metricScoreSchema,
  dinov2: metricScoreSchema,
  depth: metricScoreSchema,
});

type ScoringWorkflow = {
  build(inputs: ScoringInputs): string;
  readTotals(inputs: ScoringInputs, data: unknown): ScoringTotal[] | null;
  readMetrics(data: unknown): ScoringMetricScores | null;
};

/** 採点ノード（`similarity`）が出力したJSON文字列を読む。読めなければ`null`。 */
function readSimilarityReport(data: unknown): unknown {
  const run = v.safeParse(runDataSchema, data);
  const text = run.success
    ? v.safeParse(
        reportedTextSchema,
        run.output.find((item) => item.label === "similarity")?.values.text,
      )
    : null;
  if (!text?.success) return null;
  try {
    return JSON.parse(text.output[0]);
  } catch {
    return null;
  }
}

function topicAndSubmission(inputs: ScoringInputs) {
  const [topic, submission] = inputs;
  if (inputs.length !== 2 || topic?.role !== "topic" || submission?.role !== "submission")
    throw new Error("お題画像と提出画像を1枚ずつ指定してください。");
  return { topic, submission };
}

const workflows: Record<string, ScoringWorkflow> = {
  "illust-similarity-v2": {
    build(inputs) {
      topicAndSubmission(inputs);
      return JSON.stringify(illustSimilarityV2);
    },
    readTotals(inputs, data) {
      const { submission } = topicAndSubmission(inputs);
      const similarity = v.safeParse(similaritySchema, readSimilarityReport(data));
      return similarity.success
        ? [{ participantId: submission.participantId, total: similarity.output.total }]
        : null;
    },
    readMetrics(data) {
      const metrics = v.safeParse(metricsReportSchema, readSimilarityReport(data));
      return metrics.success ? metrics.output : null;
    },
  },
};

export const scoringWorkflowVersion = "illust-similarity-v2";

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

/** 採点ワーカーの出力から指標ごとの点を読む。今は使っていないワークフローの出力は`null`。 */
export function readScoringMetrics(version: string, data: unknown) {
  return workflows[version]?.readMetrics(data) ?? null;
}
