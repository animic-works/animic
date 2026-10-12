import type { ReactNode } from "react";
import { article } from "@animic/styled-system/recipes";
export function Article({
  title,
  eyebrow,
  meta,
  footer,
  children,
}: {
  title: string;
  eyebrow?: ReactNode;
  meta?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}) {
  const c = article();
  return (
    <article className={c.root}>
      <header className={c.header}>
        {eyebrow}
        <h1 className={c.title}>{title}</h1>
        {meta}
      </header>
      {children}
      {footer && <footer className={c.footer}>{footer}</footer>}
    </article>
  );
}
export function ArticleSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  const c = article();
  return (
    <section id={id} aria-labelledby={`${id}-heading`} className={c.section}>
      <h2 id={`${id}-heading`} className={c.heading}>
        {title}
      </h2>
      {children}
    </section>
  );
}
export function ArticleParagraph({ children }: { children: ReactNode }) {
  return <p className={article().paragraph}>{children}</p>;
}
export function ArticleList({
  items,
  ordered = false,
}: {
  items: readonly ReactNode[];
  ordered?: boolean;
}) {
  const Tag = ordered ? "ol" : "ul";
  return (
    <Tag className={article().list} data-ordered={ordered || undefined}>
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </Tag>
  );
}
export function ArticleTable({ rows }: { rows: readonly { label: string; value: string }[] }) {
  const c = article();
  return (
    <table className={c.table}>
      <tbody>
        {rows.map((row) => (
          <tr key={row.label}>
            <th scope="row" className={c.tableLabel}>
              {row.label}
            </th>
            <td className={c.tableValue}>{row.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
export function TableOfContents({
  items,
  label = "目次",
}: {
  items: readonly { id: string; title: string }[];
  label?: string;
}) {
  const c = article();
  return (
    <details className={c.toc} open>
      <summary className={c.summary}>{label}</summary>
      <nav aria-label={label}>
        <ol className={c.tocList}>
          {items.map((item) => (
            <li key={item.id}>
              <a href={`#${item.id}`} className={c.tocLink}>
                {item.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>
    </details>
  );
}
