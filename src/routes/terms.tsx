import { createFileRoute } from "@tanstack/react-router";
import { shareMeta } from "../features/home/share-meta";
import { getOgImage } from "../features/home/home-content.functions";
import { LegalPage } from "../features/legal/legal-page";
import { termsContent } from "../features/legal/terms-content";
export const Route = createFileRoute("/terms")({
  loader: () => getOgImage(),
  head: ({ loaderData }) => ({
    meta: [
      { title: "利用規約 | Animic" },
      ...(loaderData
        ? shareMeta({
            image: loaderData.ogImage,
            title: "利用規約 | Animic",
            path: "/terms",
            description: "Animicの利用規約です。",
          })
        : []),
    ],
  }),
  component: () => <LegalPage document={termsContent} other="privacy" />,
});
