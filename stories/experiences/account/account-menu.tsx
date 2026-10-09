import { useEffect, useRef, useState } from "react";
import { ActionGroup } from "@animic/react/action-group";
import { Surface } from "@animic/react/surface";
import { Avatar } from "@animic/react/avatar";
import { Heading } from "@animic/react/heading";
import { Center } from "@animic/react/center";
import { Button } from "@animic/react/button";
import { Cluster } from "@animic/react/cluster";
import { Link } from "@animic/react/link";
import { Popover } from "@animic/react/popover";
import { NavigationBarLabel } from "@animic/react/navigation-bar";
import { Separator } from "@animic/react/separator";
import { Stack } from "@animic/react/stack";
import { Text } from "@animic/react/text";
import { useToast } from "@animic/react/toast";
import { AccountIcon } from "../shared/icons";
import { ProviderIcon } from "../../../src/features/account/visuals/provider-icon";
import { useAccountPreview, useResultsPreview, signOut } from "./account-preview";

import { accountPalette } from "./account-appearance";
import { ordinal } from "../shared/format";

export function AccountMenu() {
  const account = useAccountPreview();
  const results = useResultsPreview();
  const [open, setOpen] = useState(false);
  const login = useRef<HTMLAnchorElement>(null);
  const restoreLoginFocus = useRef(false);
  const toast = useToast();
  useEffect(() => {
    if (!account && restoreLoginFocus.current) {
      login.current?.focus();
      restoreLoginFocus.current = false;
    }
  }, [account]);

  if (!account)
    return (
      <Link ref={login} appearance="subtle" aria-label="ログイン" href="/login?next=login">
        <AccountIcon />
        <NavigationBarLabel>ログイン</NavigationBarLabel>
      </Link>
    );
  const fallback =
    Array.from(new Intl.Segmenter("ja", { granularity: "grapheme" }).segment(account.name))[0]
      ?.segment ?? "?";
  const palette = accountPalette(account.color);
  return (
    <Popover
      label={`アカウント（${account.name}）`}
      title="アカウント"
      titleVisibility="hidden"
      open={open}
      onOpenChange={setOpen}
      trigger={
        <Avatar
          name={account.name}
          src={account.image}
          fallback={fallback}
          palette={palette}
          ring
          size="compact"
          badge={<ProviderIcon provider={account.provider} />}
        />
      }
    >
      <Stack space="compact">
        <Cluster>
          <Avatar name={account.name} src={account.image} fallback={fallback} palette={palette} />
          <Stack space="tight">
            <Heading level={2} size="sm">
              {account.name}
            </Heading>
            <Cluster space="compact">
              <ProviderIcon provider={account.provider} />
              <Text variant="caption" tone="muted">
                {account.provider}でログイン中
              </Text>
            </Cluster>
          </Stack>
        </Cluster>
        <ActionGroup layout="fill">
          <Surface appearance="subtle" padding="xs">
            <Center>
              <Text variant="label.supporting" tone="muted">
                <Text variant="numeric.supporting" tone="default">
                  {results.length}
                </Text>
                対戦
              </Text>
            </Center>
          </Surface>
          <Surface appearance="subtle" padding="xs">
            <Center>
              <Text variant="label.supporting" tone="muted">
                <Text variant="numeric.supporting" tone="default">
                  {results.filter((result) => result.rank === 1).length}
                </Text>
                勝
              </Text>
            </Center>
          </Surface>
        </ActionGroup>
        <Text variant="eyebrow" tone="accent">
          RECENT
        </Text>
        {results.length ? (
          <div role="list">
            <Stack space="tight">
              {results.slice(0, 3).map((result) => (
                <div key={result.key} role="listitem">
                  <Surface appearance="subtle" padding="xs">
                    <Cluster justify="between" space="compact">
                      <Text
                        variant="label.supporting"
                        tone={result.rank === 1 ? "accent" : "muted"}
                      >
                        {ordinal(result.rank)}
                      </Text>
                      <Stack space="tight">
                        <Text variant="caption" emphasis="strong">
                          {result.level}・{result.players}人
                        </Text>
                        <Text variant="caption" tone="muted">
                          {new Date(result.at).toLocaleDateString("ja-JP", {
                            month: "numeric",
                            day: "numeric",
                          })}
                        </Text>
                      </Stack>
                      <Text variant="label.supporting">
                        {result.total === null ? "未提出" : `${result.total.toFixed(1)}pt`}
                      </Text>
                    </Cluster>
                  </Surface>
                </div>
              ))}
            </Stack>
          </div>
        ) : (
          <Text as="p" variant="body.sm" tone="muted">
            まだ戦績がありません。
            <br />
            対戦すると、ここに残ります。
          </Text>
        )}
        <Separator appearance="dashed" />
        <Cluster justify="between">
          <Link appearance="inverse" href="/mypage">
            マイページ
            <svg width="8" height="12" viewBox="0 0 12 20" aria-hidden="true">
              <path
                d="M2 2 10 10 2 18"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
          <Button
            appearance="quiet"
            size="sm"
            onClick={() => {
              try {
                restoreLoginFocus.current = true;
                signOut();
              } catch {
                toast.show({
                  title: "ログアウトできませんでした",
                  description: "この端末に保存されたアカウント情報を削除できませんでした。",
                });
                return;
              }
              setOpen(false);

              toast.show({ title: "ログアウトしました" });
            }}
          >
            ログアウト
          </Button>
        </Cluster>
      </Stack>
    </Popover>
  );
}
