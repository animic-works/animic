import { BackLink, DocPage, PageDeco } from "@animic/react/page";
import type { DocSection } from "@animic/react/page";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";

export type LegalPageProps = {
  variant: "terms" | "privacy";
  eyebrow: string;
  title: string;
  meta: string;
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
  intro,
  sections,
  footLink,
}: LegalPageProps) {
  const navigate = useNavigate();
  const [showToTop, setShowToTop] = useState(false);
  useEffect(() => {
    const onScroll = () => setShowToTop(scrollY >= 600);
    onScroll();
    addEventListener("scroll", onScroll, { passive: true });
    return () => removeEventListener("scroll", onScroll);
  }, []);
  // 履歴があれば戻り、なければトップへ
  function back() {
    if (history.length > 1) history.back();
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
