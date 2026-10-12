import * as v from "valibot";

/** 運営者が管理画面で切り替えられるNovelAIのモデル。 */
export const imageModels = ["nai-diffusion-5-curated", "nai-diffusion-4-5-curated"] as const;
export type ImageModel = (typeof imageModels)[number];
export const defaultImageModel: ImageModel = "nai-diffusion-5-curated";

export const IMAGE_MODEL_LABELS: Record<ImageModel, string> = {
  "nai-diffusion-5-curated": "V5 Curated",
  "nai-diffusion-4-5-curated": "V4.5 Curated",
};

export const imageModelSchema = v.picklist(imageModels, "対応していないモデルです。");

/**
 * 生成のステップ数の範囲。28はOpusの無料枠で生成できる最大のステップ数。
 * 下げるとNovelAIの利用枠の消費が減り、画質が落ちることがある。
 */
export const minImageSteps = 15;
export const maxImageSteps = 28;
/** 管理画面で決めていないときのステップ数。無料枠の最大と同じ。 */
export const defaultImageSteps: number = 28;

export const imageStepsSchema = v.pipe(
  v.number("ステップ数は数で指定してください。"),
  v.integer("ステップ数は整数で指定してください。"),
  v.minValue(minImageSteps, `ステップ数は${minImageSteps}以上にしてください。`),
  v.maxValue(maxImageSteps, `ステップ数は${maxImageSteps}以下にしてください。`),
);
