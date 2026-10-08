import { createServerFn } from "@tanstack/react-start";
import * as v from "valibot";

import { requireAdmin } from "../../lib/admin.server";
import { imageModelSchema } from "./image-models";
import { getNovelAiQueue } from "./novelai.server";

export const getImageModel = createServerFn({ method: "GET" }).handler(() => {
  requireAdmin();
  return getNovelAiQueue().getModel();
});

/** 保存した後にNovelAIへ送る生成から、このモデルを使う。 */
export const saveImageModel = createServerFn({ method: "POST" })
  .validator(v.object({ model: imageModelSchema }))
  .handler(async ({ data }) => {
    requireAdmin();
    await getNovelAiQueue().setModel(data.model);
  });
