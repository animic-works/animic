import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "../features/legal/legal-page";
import { privacyContent } from "../features/legal/privacy-content";
export const Route = createFileRoute("/privacy")({
  head: () => ({ meta: [{ title: "プライバシーポリシー | Animic" }] }),
  component: () => <LegalPage document={privacyContent} other="terms" />,
});
