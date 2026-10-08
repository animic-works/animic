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
