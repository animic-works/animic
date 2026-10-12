import { useState } from "react";
import * as v from "valibot";
import { Button } from "@animic/react/button";
import { Cluster } from "@animic/react/cluster";
import { DataTable } from "@animic/react/data-table";
import { Field } from "@animic/react/field";
import { Heading } from "@animic/react/heading";
import { Input } from "@animic/react/input";
import { SegmentedControl } from "@animic/react/segmented-control";
import { Split } from "@animic/react/split";
import { Stack } from "@animic/react/stack";
import { Surface } from "@animic/react/surface";
import { Text } from "@animic/react/text";
import { useToast } from "@animic/react/toast";
import {
  saveImageModel,
  saveImageSteps,
} from "../image-generation/image-generation-admin.functions";
import {
  IMAGE_MODEL_LABELS,
  imageModels,
  imageStepsSchema,
  maxImageSteps,
  minImageSteps,
} from "../image-generation/image-models";
import type { ImageModel } from "../image-generation/image-models";
import { AdminGuide, AdminHead } from "./admin-parts";
import { errorMessage } from "./admin-format";

// 画像生成: NovelAIで生成するモデルとステップ数
export function ImageGenerationScreen({
  model,
  steps,
  onSaved,
}: {
  model: ImageModel;
  steps: number;
  onSaved: () => Promise<void>;
}) {
  const toast = useToast();
  const [selected, setSelected] = useState(model);
  const [stepsDraft, setStepsDraft] = useState(String(steps));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (saving) return;
    // 送る前に範囲と整数かどうかを確かめ、理由を出す。サーバーでも同じ検証をする。
    const parsed = v.safeParse(imageStepsSchema, Number(stepsDraft.trim()));
    if (!parsed.success) {
      setError(parsed.issues[0].message);
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await saveImageSteps({ data: { steps: parsed.output } });
      await saveImageModel({ data: { model: selected } });
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
        title="画像生成"
        description="NovelAIで画像を生成するモデルとステップ数です。"
      />
      <Split layout="main-aside">
        <Stack>
          <Surface appearance="subtle" padding="lg">
            <Stack>
              <Heading level={2} size="sm">
                モデル
              </Heading>
              <DataTable
                label="モデルの情報"
                empty="情報がありません"
                rows={[
                  { term: "使用中のモデル", value: IMAGE_MODEL_LABELS[model] },
                  { term: "NovelAIでの名前", value: model },
                ]}
                getRowKey={(row) => row.term}
                columns={[
                  { id: "term", header: "項目", rowHeader: true, cell: (row) => row.term },
                  { id: "value", header: "内容", cell: (row) => row.value },
                ]}
              />
              <SegmentedControl
                label="切り替えるモデル"
                options={imageModels.map((item) => ({
                  value: item,
                  label: IMAGE_MODEL_LABELS[item],
                }))}
                value={selected}
                disabled={saving}
                onValueChange={(value) => {
                  const next = imageModels.find((item) => item === value);
                  if (next) setSelected(next);
                }}
              />
            </Stack>
          </Surface>
          <Surface appearance="subtle" padding="lg">
            <Stack>
              <Heading level={2} size="sm">
                ステップ数
              </Heading>
              <Field
                label="ステップ数"
                labelVisibility="hidden"
                description={`${minImageSteps}〜${maxImageSteps}の整数。今は${steps}ステップで生成しています`}
              >
                <Input
                  inputMode="numeric"
                  maxLength={2}
                  value={stepsDraft}
                  disabled={saving}
                  onChange={(event) => setStepsDraft(event.target.value)}
                />
              </Field>
            </Stack>
          </Surface>
          {error && (
            <div role="alert">
              <Text tone="danger">{error}</Text>
            </div>
          )}
          <Cluster>
            <Button loading={saving} onClick={() => void save()}>
              {saving ? "保存しています…" : "保存する"}
            </Button>
          </Cluster>
        </Stack>
        <AdminGuide
          items={[
            {
              term: "反映",
              body: "保存した後にNovelAIへ送る生成から、選んだモデルを使います。順番待ちの生成と、進行中の対戦の生成も変わります。",
            },
            {
              term: "ステップ数",
              body: `${maxImageSteps}はNovelAIの無料枠（Opus）で生成できる最大のステップ数です。下げると利用枠の消費が減り、生成が速くなりますが、画質が落ちることがあります。モデルを切り替えても同じステップ数を使います。`,
            },
            {
              term: "使い分け",
              body: "ふだんはV5 Curatedを使います。V5 Curatedの使用料が足りなくなったら、V4.5 Curatedに切り替えます。",
            },
            {
              term: "絵柄",
              body: "全員の生成に付ける絵柄は、Workerの環境変数NOVELAI_STYLE_PROMPTで設定します。",
            },
          ]}
        />
      </Split>
    </Stack>
  );
}
