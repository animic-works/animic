import { createFileRoute, useRouter } from "@tanstack/react-router";

import { ImageGenerationScreen } from "../../features/admin/image-generation-screen";
import {
  getImageModel,
  getImageSteps,
} from "../../features/image-generation/image-generation-admin.functions";

// NovelAIで画像を生成するモデルとステップ数。
export const Route = createFileRoute("/admin/image-generation")({
  loader: async ({ context }) => {
    if (!context.admin.authenticated) return null;
    const [model, steps] = await Promise.all([getImageModel(), getImageSteps()]);
    return { model, steps };
  },
  head: () => ({ meta: [{ title: "画像生成 | 管理画面 | Animic" }] }),
  component: ImageGeneration,
});

function ImageGeneration() {
  const settings = Route.useLoaderData();
  const router = useRouter();
  if (!settings) return null;
  return (
    <ImageGenerationScreen
      key={`${settings.model}:${settings.steps}`}
      model={settings.model}
      steps={settings.steps}
      onSaved={() => router.invalidate()}
    />
  );
}
