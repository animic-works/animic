import { useState } from "react";
import * as v from "valibot";
import { Button } from "@animic/react/button";
import { Cluster } from "@animic/react/cluster";
import { Field } from "@animic/react/field";
import { Heading } from "@animic/react/heading";
import { Input } from "@animic/react/input";
import { Split } from "@animic/react/split";
import { Stack } from "@animic/react/stack";
import { Surface } from "@animic/react/surface";
import { Text } from "@animic/react/text";
import { useToast } from "@animic/react/toast";
import {
  defaultScoringWeights,
  scoringMetrics,
  scoringWeightsSchema,
} from "../scoring/scoring-metrics";
import type { ScoringWeights } from "../scoring/scoring-metrics";
import { updateScoringWeights } from "../scoring/scoring-weights.functions";
import { errorMessage, formatDateTime } from "./admin-format";
import { AdminError, AdminGuide, AdminHead } from "./admin-parts";

type Draft = Record<keyof ScoringWeights, string>;

const toDraft = (weights: ScoringWeights): Draft => ({
  ccip: String(weights.ccip),
  pixai: String(weights.pixai),
  siglip2: String(weights.siglip2),
  dinov2: String(weights.dinov2),
  depth: String(weights.depth),
});

/** 入力を数にする。数字以外を含む欄は`NaN`にして、検証で理由を出す。 */
const toNumber = (value: string) => (/^\d+$/.test(value.trim()) ? Number(value) : Number.NaN);

// 採点の重み: 再現度の指標ごとの重みの変更
export function ScoringWeightsScreen({
  weights,
  savedAt,
  onSaved,
}: {
  weights: ScoringWeights;
  savedAt: number | null;
  onSaved: () => Promise<void>;
}) {
  const toast = useToast();
  const [draft, setDraft] = useState(() => toDraft(weights));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const values = scoringMetrics.map(({ key }) => toNumber(draft[key]));
  const sum = values.every(Number.isFinite)
    ? values.reduce((total, value) => total + value, 0)
    : null;

  async function save() {
    if (saving) return;
    const parsed = v.safeParse(scoringWeightsSchema, {
      ccip: toNumber(draft.ccip),
      pixai: toNumber(draft.pixai),
      siglip2: toNumber(draft.siglip2),
      dinov2: toNumber(draft.dinov2),
      depth: toNumber(draft.depth),
    });
    if (!parsed.success) {
      setError(parsed.issues[0].message);
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await updateScoringWeights({ data: parsed.output });
      toast.show({ title: "保存しました" });
      await onSaved();
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Stack space="section">
      <AdminHead
        eyebrow="Admin"
        title="採点の重み"
        description="再現度の指標ごとの重みです。保存した後に始まる対戦から使います。"
      />
      <Split layout="main-aside">
        <Stack>
          <Surface appearance="subtle" padding="lg">
            <Stack>
              <Heading level={2} size="sm">
                重み（合計100）
              </Heading>
              <Text variant="body.sm" tone="muted">
                {savedAt === null
                  ? "既定の重みを使っています。"
                  : `${formatDateTime(savedAt)}に保存した重みを使っています。`}
              </Text>
              {scoringMetrics.map((metric) => (
                <Field
                  key={metric.key}
                  label={`${metric.label}（${metric.name}）`}
                  description={
                    metric.key === "ccip" ? "人物のいない画像では、この指標を除きます" : undefined
                  }
                >
                  <Input
                    inputMode="numeric"
                    maxLength={3}
                    value={draft[metric.key]}
                    disabled={saving}
                    onChange={(event) => setDraft({ ...draft, [metric.key]: event.target.value })}
                  />
                </Field>
              ))}
              <div role="status">
                <Text variant="label">合計 {sum ?? "－"}</Text>
              </div>
            </Stack>
          </Surface>
          <AdminError>{error}</AdminError>
          <Cluster>
            <Button loading={saving} onClick={() => void save()}>
              保存する
            </Button>
            <Button
              appearance="secondary"
              loading={saving}
              onClick={() => setDraft(toDraft(defaultScoringWeights))}
            >
              既定の重みに戻す
            </Button>
          </Cluster>
        </Stack>
        <AdminGuide
          items={[
            {
              term: "計算",
              body: "採点ワーカーが出す指標ごとの0〜100点を、この重みで平均して再現度にします。人物のいない画像ではCCIPを除き、残りの重みで割り直します。",
            },
            {
              term: "反映",
              body: "保存した後に始まる対戦から使います。進行中の対戦と、保存済みの結果は変わりません。",
            },
            {
              term: "既定の重み",
              body: "キャラクター35・タグ25・内容20・画像の特徴10・構図10です。「既定の重みに戻す」を押して保存すると戻ります。",
            },
          ]}
        />
      </Split>
    </Stack>
  );
}
