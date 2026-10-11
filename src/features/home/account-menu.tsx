import { useState } from "react";
import { createClientOnlyFn } from "@tanstack/react-start";
import { Avatar } from "@animic/react/avatar";
import { Button } from "@animic/react/button";
import { Center } from "@animic/react/center";
import { Cluster } from "@animic/react/cluster";
import { Grid } from "@animic/react/grid";
import { Heading } from "@animic/react/heading";
import { ButtonLink } from "@animic/react/link";
import { MediaObject } from "@animic/react/media-object";
import { Popover } from "@animic/react/popover";
import { Separator } from "@animic/react/separator";
import { Stack } from "@animic/react/stack";
import { Surface } from "@animic/react/surface";
import { Text } from "@animic/react/text";
import { useToast } from "@animic/react/toast";
import { accountIconAvatar, parseAccountIcon, providerPalette } from "../account/account-icon";
import { ProviderIcon } from "../account/visuals/provider-icon";
import { getDifficulty } from "../battle/battle-labels";
import { getMyBattleHistory } from "../battle/battle-history.functions";
import { ordinal } from "../battle/battle-outcome";
import { ArrowIcon } from "../shared/icons";
import { signOut } from "../../lib/auth.client";
import { loginProviderNames, type LoginProvider } from "../../lib/login-providers";

const signOutOnClient = createClientOnlyFn(signOut);

type Account = { name: string; provider: LoginProvider | null; icon: string | null };
type BattleHistory = NonNullable<Awaited<ReturnType<typeof getMyBattleHistory>>>;

/** メニューに出す最近の戦績の数。 */
const recentCount = 3;

function AccountAvatar({ account, size }: { account: Account; size: "navigation" | "compact" }) {
  return (
    <Avatar
      name={account.name}
      fallback={Array.from(account.name)[0]}
      // アイコンを選んでいなければ、ログインに使ったサービスの色にする。
      {...accountIconAvatar(parseAccountIcon(account.icon), providerPalette(account.provider))}
      size={size}
      ring={size === "navigation"}
      badge={
        size === "navigation" && account.provider ? (
          <ProviderIcon provider={account.provider === "google" ? "Google" : "Discord"} />
        ) : undefined
      }
    />
  );
}

/** ログイン中のトップのメニュー。アイコンを押すと、成績・最近の戦績・マイページ・ログアウトを開く。 */
export function AccountMenu({
  account,
  onMypage,
  onSignedOut,
}: {
  account: Account;
  onMypage: () => void;
  onSignedOut: () => void;
}) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState<BattleHistory | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  async function changeOpen(next: boolean) {
    setOpen(next);
    // 開くたびに読み直し、対戦から戻った後の戦績を出す。
    if (next) setHistory((await getMyBattleHistory().catch(() => null)) ?? null);
  }
  async function logout() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await signOutOnClient();
      setOpen(false);
      toast.show({ title: "ログアウトしました" });
      onSignedOut();
    } catch (cause) {
      toast.show({
        title: cause instanceof Error ? cause.message : "ログアウトできませんでした",
      });
    } finally {
      setSigningOut(false);
    }
  }
  const recent = history?.records.slice(0, recentCount) ?? [];
  return (
    <Popover
      open={open}
      onOpenChange={(next) => void changeOpen(next)}
      label={`アカウント（${account.name}）`}
      title="アカウント"
      titleVisibility="hidden"
      trigger={<AccountAvatar account={account} size="navigation" />}
    >
      <Stack space="compact">
        <MediaObject media={<AccountAvatar account={account} size="compact" />}>
          <Stack space="tight">
            <Heading level={2} size="sm">
              {account.name}
            </Heading>
            {account.provider && (
              <Cluster space="compact">
                <ProviderIcon provider={account.provider === "google" ? "Google" : "Discord"} />
                <Text variant="caption" tone="muted">
                  {loginProviderNames[account.provider]}でログイン中
                </Text>
              </Cluster>
            )}
          </Stack>
        </MediaObject>
        <Grid columns={2} space="compact" collapse="none">
          <Surface appearance="subtle" padding="xs">
            <Center>
              <Text variant="numeric.supporting">
                {history?.stats.matches ?? "—"}
                <Text variant="caption" tone="muted">
                  {" "}
                  対戦
                </Text>
              </Text>
            </Center>
          </Surface>
          <Surface appearance="subtle" padding="xs">
            <Center>
              <Text variant="numeric.supporting">
                {history?.stats.wins ?? "—"}
                <Text variant="caption" tone="muted">
                  {" "}
                  勝
                </Text>
              </Text>
            </Center>
          </Surface>
        </Grid>
        <Text variant="eyebrow" tone="accent">
          RECENT
        </Text>
        {history && recent.length === 0 ? (
          <Text as="p" variant="caption" tone="muted">
            まだ戦績がありません。対戦すると、ここに残ります。
          </Text>
        ) : (
          <div role="list" aria-label="最近の戦績">
            <Stack space="tight">
              {recent.map((record) => (
                <div key={record.battleId} role="listitem">
                  <Surface appearance="subtle" padding="xs">
                    <Cluster justify="between" space="compact">
                      <Cluster space="compact">
                        <Text variant="numeric.rank" tone={record.rank === 1 ? "accent" : "muted"}>
                          {record.rank === null ? "—" : ordinal(record.rank)}
                        </Text>
                        <Stack space="tight">
                          <Text variant="label.supporting">
                            {getDifficulty(record.difficulty).label}・{record.participantCount}人
                          </Text>
                          <Text variant="caption" tone="muted">
                            {new Date(record.startedAt).toLocaleDateString("ja-JP", {
                              month: "numeric",
                              day: "numeric",
                            })}
                          </Text>
                        </Stack>
                      </Cluster>
                      <Text variant="numeric.supporting">
                        {record.total === null ? (
                          <Text variant="caption" tone="muted">
                            {record.imageUrl ? "採点なし" : "未提出"}
                          </Text>
                        ) : (
                          <>
                            {record.total.toFixed(1)}
                            <Text variant="caption">pt</Text>
                          </>
                        )}
                      </Text>
                    </Cluster>
                  </Surface>
                </div>
              ))}
            </Stack>
          </div>
        )}
        <Separator appearance="dashed" />
        <Cluster justify="between" space="compact">
          <ButtonLink
            href="/mypage"
            appearance="inverse"
            shape="pill"
            size="sm"
            trailingIcon={<ArrowIcon />}
            onClick={(event) => {
              event.preventDefault();
              setOpen(false);
              onMypage();
            }}
          >
            マイページ
          </ButtonLink>
          <Button appearance="quiet" size="sm" loading={signingOut} onClick={() => void logout()}>
            ログアウト
          </Button>
        </Cluster>
      </Stack>
    </Popover>
  );
}
