import { createFileRoute } from "@tanstack/react-router";

import { renderPlaceholderArt } from "../../features/image-generation/placeholder-art.server";

// 仮の生成画像（挿絵）を配信する。画像生成サービスをつないだら不要になる
export const Route = createFileRoute("/art/$spec")({
  server: {
    handlers: {
      GET: ({ params }) =>
        new Response(renderPlaceholderArt(params.spec), {
          headers: {
            "Content-Type": "image/svg+xml; charset=utf-8",
            "Cache-Control": "public, max-age=86400, immutable",
          },
        }),
    },
  },
});
