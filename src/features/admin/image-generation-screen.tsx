import { useState } from "react";
import { Button } from "@animic/react/button";
import { Cluster } from "@animic/react/cluster";
import { DataTable } from "@animic/react/data-table";
import { Heading } from "@animic/react/heading";
import { SegmentedControl } from "@animic/react/segmented-control";
import { Split } from "@animic/react/split";
import { Stack } from "@animic/react/stack";
import { Surface } from "@animic/react/surface";
import { Text } from "@animic/react/text";
import { useToast } from "@animic/react/toast";
import { saveImageModel } from "../image-generation/image-generation-admin.functions";
import { IMAGE_MODEL_LABELS, imageModels } from "../image-generation/image-models";
import type { ImageModel } from "../image-generation/image-models";
import { AdminGuide, AdminHead } from "./admin-parts";
import { errorMessage } from "./admin-format";

// 画像生成: NovelAIで生成するモデルの切り替え
export function ImageGenerationScreen({
  model,
  onSaved,
}: {
  model: ImageModel;
  onSaved: () => Promise<void>;
}) {
  const toast = useToast();
  const [selected, setSelected] = useState(model);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (saving) return;
    setError(null);
    setSaving(true);
    try {
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
        description="NovelAIで画像を生成するモデルです。"
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
