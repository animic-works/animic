import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "../features/legal/legal-page";
import { termsContent } from "../features/legal/terms-content";
export const Route = createFileRoute("/terms")({
  head: () => ({ meta: [{ title: "利用規約 | Animic" }] }),
  component: () => <LegalPage document={termsContent} other="privacy" />,
});
