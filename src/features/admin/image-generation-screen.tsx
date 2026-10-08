import { useState } from "react";

import { Button } from "../../components/button";
import { Icon } from "../../components/icon";
import { Stack } from "../../components/layout";
import { SegmentedControl } from "../../components/segmented-control";
import { Surface } from "../../components/surface";
import { Heading, Text } from "../../components/text";
import { toast } from "../../components/toast";
import { saveImageModel } from "../image-generation/image-generation-admin.functions";
import { IMAGE_MODEL_LABELS, imageModels } from "../image-generation/image-models";
import type { ImageModel } from "../image-generation/image-models";
import { AdminColumns, AdminGuide, AdminHead, InfoList } from "./admin-parts";
import { errorMessage } from "./admin-format";

// 画像生成: NovelAIで生成するモデルの切り替え
export function ImageGenerationScreen({
  model,
  onSaved,
}: {
  model: ImageModel;
  onSaved: () => Promise<void>;
}) {
  const [selected, setSelected] = useState(model);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    setError(null);
    setSaving(true);
    try {
      await saveImageModel({ data: { model: selected } });
      toast("保存しました");
      await onSaved();
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <AdminHead
        eyebrow="Admin"
        title="画像生成"
        description="NovelAIで画像を生成するモデルです。"
      />
      <AdminColumns
        layout="form"
        primary={
          <Stack gap="4">
            <Surface as="section" variant="soft" padding="lg">
              <Stack gap="4">
                <Heading variant="heading-sm">モデル</Heading>
                <InfoList
                  rows={[
                    { term: "使用中のモデル", value: IMAGE_MODEL_LABELS[model] },
                    { term: "NovelAIでの名前", value: model, code: true },
                  ]}
                />
                <SegmentedControl
                  label="切り替えるモデル"
                  options={imageModels.map((item) => ({
                    value: item,
                    label: IMAGE_MODEL_LABELS[item],
                  }))}
                  value={selected}
                  onValueChange={(value) => {
                    const next = imageModels.find((item) => item === value);
                    if (next) setSelected(next);
                  }}
                />
              </Stack>
            </Surface>
            {error ? (
              <Text tone="danger" variant="note" role="alert">
                {error}
              </Text>
            ) : null}
            <Stack direction="row">
              <Button
                leadingIcon={<Icon name="check" size="sm" />}
                loading={saving}
                loadingText="保存しています…"
                onClick={() => void save()}
              >
                保存する
              </Button>
            </Stack>
          </Stack>
        }
        secondary={
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
        }
      />
    </>
  );
}
