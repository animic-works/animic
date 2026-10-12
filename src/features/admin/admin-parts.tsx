import type { MouseEvent, ReactNode } from "react";
import { ActionGroup } from "@animic/react/action-group";
import { Cluster } from "@animic/react/cluster";
import { Heading } from "@animic/react/heading";
import { Link } from "@animic/react/link";
import { Stack } from "@animic/react/stack";
import { Surface } from "@animic/react/surface";
import { Text } from "@animic/react/text";

export function AdminHead({
  crumbs,
  onCrumbClick,
  eyebrow,
  title,
  titleAside,
  description,
  actions,
}: {
  crumbs?: { label: string; href?: string }[];
  onCrumbClick?: (href: string, event: MouseEvent<HTMLAnchorElement>) => void;
  eyebrow: string;
  title: string;
  titleAside?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <Stack>
      {crumbs?.length ? (
        <nav aria-label="パンくず">
          <Cluster>
            {crumbs.map((crumb, index) =>
              crumb.href && index < crumbs.length - 1 ? (
                <Link
                  key={crumb.label}
                  href={crumb.href}
                  onClick={(event) => onCrumbClick?.(crumb.href!, event)}
                >
                  {crumb.label}
                </Link>
              ) : (
                <Text key={crumb.label} aria-current="page">
                  {crumb.label}
                </Text>
              ),
            )}
          </Cluster>
        </nav>
      ) : null}
      <Cluster justify="between">
        <Stack space="tight">
          <Text variant="eyebrow">{eyebrow}</Text>
          <Cluster>
            <Heading level={1} size="section">
              {title}
            </Heading>
            {titleAside}
          </Cluster>
        </Stack>
        {actions && <ActionGroup>{actions}</ActionGroup>}
      </Cluster>
      {description && (
        <Text as="p" tone="muted">
          {description}
        </Text>
      )}
    </Stack>
  );
}
export function AdminGuide({ items }: { items: readonly { term: string; body: ReactNode }[] }) {
  return (
    <aside aria-label="案内">
      <Surface appearance="subtle">
        <Stack>
          <Text variant="eyebrow">Guide</Text>
          {items.map((item) => (
            <Stack key={item.term} space="tight">
              <Heading level={2} size="sm">
                {item.term}
              </Heading>
              <Text as="p">{item.body}</Text>
            </Stack>
          ))}
        </Stack>
      </Surface>
    </aside>
  );
}
export function AdminError({ children }: { children: string | null | undefined }) {
  return children ? (
    <div role="alert">
      <Text tone="danger">{children}</Text>
    </div>
  ) : null;
}
