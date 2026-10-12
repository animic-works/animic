import { createFileRoute } from "@tanstack/react-router";
import { shareMeta } from "../features/home/share-meta";
import { getOgImage } from "../features/home/home-content.functions";
import { LegalPage } from "../features/legal/legal-page";
import { privacyContent } from "../features/legal/privacy-content";
export const Route = createFileRoute("/privacy")({
  loader: () => getOgImage(),
  head: ({ loaderData }) => ({
    meta: [
      { title: "プライバシーポリシー | Animic" },
      ...(loaderData
        ? shareMeta({
            image: loaderData.ogImage,
            title: "プライバシーポリシー | Animic",
            path: "/privacy",
            description: "Animicの個人情報の取り扱いについて。",
          })
        : []),
    ],
  }),
  component: () => <LegalPage document={privacyContent} other="terms" />,
});
