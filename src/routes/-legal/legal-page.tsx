import { useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";

import { BackLink, DocPage, PageDeco } from "../../components/page";
import type { DocSection } from "../../components/page";

export type LegalPageProps = {
  variant: "terms" | "privacy";
  eyebrow: string;
  title: string;
  meta: string;
  /** 文面が確定するまで「現在は仮の文面です」と注記する */
  draft?: boolean;
  intro: ReactNode;
  sections: DocSection[];
  footLink: { href: string; label: string };
};

// 利用規約・プライバシーポリシーの共通の組み立て。文面は呼び出し側が持つ
export function LegalPage({
  variant,
  eyebrow,
  title,
  meta,
  draft = false,
  intro,
  sections,
  footLink,
}: LegalPageProps) {
  const router = useRouter();
  const navigate = useNavigate();
  const [showToTop, setShowToTop] = useState(false);
  useEffect(() => {
    const onScroll = () => setShowToTop(scrollY >= 600);
    onScroll();
    addEventListener("scroll", onScroll, { passive: true });
    return () => removeEventListener("scroll", onScroll);
  }, []);
  // アプリ内の履歴があれば戻り、なければトップへ
  function back() {
    if (router.history.canGoBack()) router.history.back();
    else void navigate({ to: "/" });
  }
  return (
    <>
      <PageDeco variant={variant} />
      <BackLink onClick={back}>戻る</BackLink>
      <DocPage
        eyebrow={eyebrow}
        title={title}
        meta={meta}
        draftNote={draft ? "現在は仮の文面です" : undefined}
        intro={intro}
        sections={sections}
        footLink={footLink}
        footNote="Animic運営"
        showToTop={showToTop}
        onToTop={() => scrollTo({ top: 0, behavior: "smooth" })}
        onBack={back}
      />
    </>
  );
}
