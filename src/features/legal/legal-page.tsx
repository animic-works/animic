import { useEffect, useState } from "react";
import {
  Article,
  ArticleList,
  ArticleParagraph,
  ArticleSection,
  ArticleTable,
  TableOfContents,
} from "@animic/react/article";
import { DocumentLayout } from "@animic/react/document-layout";
import { IconButton } from "@animic/react/icon-button";
import { Link } from "@animic/react/link";
import { Page } from "@animic/react/page";
import { Text } from "@animic/react/text";
import { useRouter } from "@tanstack/react-router";
import { DecoratedBackdrop } from "../shared/visuals/decorated-backdrop";
import { ArrowIcon } from "../shared/icons";
import { PageBackButton } from "../shared/page-back-button";
import type { LegalDocument } from "./legal-document";
export function LegalPage({
  document,
  other,
}: {
  document: LegalDocument;
  other: "terms" | "privacy";
}) {
  const router = useRouter();
  const [showTop, setShowTop] = useState(false);
  useEffect(() => {
    const onScroll = () => setShowTop(scrollY >= 600);
    addEventListener("scroll", onScroll, { passive: true });
    return () => removeEventListener("scroll", onScroll);
  }, []);
  function back() {
    if (router.history.canGoBack()) router.history.back();
    else void router.navigate({ href: "/" });
  }
  return (
    <Page decoration={<DecoratedBackdrop />}>
      <DocumentLayout
        title={document.title}
        compactBack={
          <IconButton label="戻る" appearance="quiet" onClick={back}>
            <ArrowIcon direction="left" />
          </IconButton>
        }
        back={<PageBackButton onClick={back} />}
        scrollToTop={
          showTop ? (
            <IconButton
              label="ページの先頭へ"
              shape="circle"
              onClick={() =>
                scrollTo({
                  top: 0,
                  behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
                    ? "instant"
                    : "smooth",
                })
              }
            >
              ↑
            </IconButton>
          ) : undefined
        }
      >
        <Article
          title={document.title}
          eyebrow={
            <Text variant="eyebrow" tone="accent">
              {document.eyebrow}
            </Text>
          }
          meta={
            <Text variant="body.md" tone="muted">
              {document.date}
            </Text>
          }
          footer={
            <>
              <Link appearance="quiet" href={`/${other}`}>
                {other === "terms" ? "利用規約" : "プライバシーポリシー"}を見る →
              </Link>
              <Text variant="body.sm" tone="muted">
                Animic運営
              </Text>
            </>
          }
        >
          <TableOfContents
            items={document.sections.map((section) => ({ id: section.id, title: section.toc }))}
          />
          <ArticleParagraph>{document.intro}</ArticleParagraph>
          {document.sections.map((section) => (
            <ArticleSection key={section.id} id={section.id} title={section.title}>
              {section.blocks.map((block, i) =>
                block.kind === "paragraph" ? (
                  <ArticleParagraph key={i}>{block.text}</ArticleParagraph>
                ) : block.kind === "list" ? (
                  <ArticleList key={i} items={block.items} ordered={block.ordered} />
                ) : (
                  <ArticleTable key={i} rows={block.rows} />
                ),
              )}
            </ArticleSection>
          ))}
        </Article>
      </DocumentLayout>
    </Page>
  );
}
