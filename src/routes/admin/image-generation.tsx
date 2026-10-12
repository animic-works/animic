import { createFileRoute, useRouter } from "@tanstack/react-router";

import { ImageGenerationScreen } from "../../features/admin/image-generation-screen";
import { getImageModel } from "../../features/image-generation/image-generation-admin.functions";

// NovelAIで画像を生成するモデル。
export const Route = createFileRoute("/admin/image-generation")({
  loader: ({ context }) => (context.admin.authenticated ? getImageModel() : null),
  head: () => ({ meta: [{ title: "画像生成 | 管理画面 | Animic" }] }),
  component: ImageGeneration,
});

function ImageGeneration() {
  const model = Route.useLoaderData();
  const router = useRouter();
  if (!model) return null;
  return <ImageGenerationScreen key={model} model={model} onSaved={() => router.invalidate()} />;
}
