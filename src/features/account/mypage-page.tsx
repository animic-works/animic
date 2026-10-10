import { useEffect, useRef, useState } from "react";
import { createClientOnlyFn } from "@tanstack/react-start";
import { useRouter } from "@tanstack/react-router";
import { ActionGroup } from "@animic/react/action-group";
import { AppFrame } from "@animic/react/app-frame";
import { AvatarButton } from "@animic/react/avatar";
import { Button } from "@animic/react/button";
import { Cluster } from "@animic/react/cluster";
import { Field } from "@animic/react/field";
import { Heading } from "@animic/react/heading";
import { IconButton } from "@animic/react/icon-button";
import { Input } from "@animic/react/input";
import { MediaObject } from "@animic/react/media-object";
import { Meter } from "@animic/react/meter";
import { Page } from "@animic/react/page";
import { RecordItem, RecordList } from "@animic/react/record-list";
import { SegmentedControl } from "@animic/react/segmented-control";
import { Stack } from "@animic/react/stack";
import { StatGroup } from "@animic/react/stat-group";
import { Surface } from "@animic/react/surface";
import { Text } from "@animic/react/text";
import { useToast } from "@animic/react/toast";
import { getDifficulty, playedAtLabel } from "../battle/battle-labels";
import type { getMyBattleHistory } from "../battle/battle-history.functions";
import { ordinal } from "../battle/battle-outcome";
import { usePageTransition } from "../navigation/page-transition-provider";
import { AppBrand } from "../shared/app-brand";
import { GridBackdrop } from "../shared/visuals/grid-backdrop";
import { signOut } from "../../lib/auth.client";
import { loginProviderNames, type LoginProvider } from "../../lib/login-providers";
import { ProviderIcon } from "./visuals/provider-icon";
import { accountIconAvatar, parseAccountIcon, type AccountIcon } from "./account-icon";
import { AccountLoginPrompt } from "./account-login-prompt";
import { updateAccountIcon, updateDisplayName } from "./account.functions";
import { IconDialog } from "./icon-dialog";

const signOutOnClient = createClientOnlyFn(signOut);

type Account = { name: string; provider: LoginProvider | null; icon: string | null };
type BattleHistory = NonNullable<Awaited<ReturnType<typeof getMyBattleHistory>>>;

function CameraIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M4 6h4l2-3h4l2 3h4v14H4z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function ProviderMark({ provider }: { provider: LoginProvider }) {
  return (
    <ProviderIcon
      provider={provider === "google" ? "Google" : "Discord"}
      inverse={provider === "discord"}
    />
  );
}

/** 表示名とログインに使ったサービス。表示名はその場で編集する。 */
function Profile({ account, onChanged }: { account: Account; onChanged: () => Promise<void> }) {
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [iconOpen, setIconOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState<string>();
  const nameInput = useRef<HTMLInputElement>(null);
  const editButton = useRef<HTMLButtonElement>(null);
  const icon = parseAccountIcon(account.icon);
  useEffect(() => {
    if (!editing) return;
    nameInput.current?.focus();
    nameInput.current?.select();
  }, [editing]);

  function closeName() {
    setEditing(false);
    setError(undefined);
    requestAnimationFrame(() => editButton.current?.focus());
  }
  async function saveName() {
    const value = name.trim();
    if (saving || !value) return;
    setSaving(true);
    try {
      await updateDisplayName({ data: { name: value } });
      await onChanged();
      closeName();
      toast.show({ title: "表示名を変更しました" });
    } catch {
      setError("表示名を変更できませんでした。もう一度お試しください。");
    } finally {
      setSaving(false);
    }
  }
  async function saveIcon(next: AccountIcon) {
    setSaving(true);
    try {
      await updateAccountIcon({ data: { icon: next } });
      await onChanged();
      setIconOpen(false);
      toast.show({ title: "アイコンを変更しました" });
    } catch {
      toast.show({ title: "アイコンを変更できませんでした" });
    } finally {
      setSaving(false);
    }
  }
  async function logout() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await signOutOnClient();
      toast.show({ title: "ログアウトしました" });
      await onChanged();
    } catch (cause) {
      toast.show({
        title: cause instanceof Error ? cause.message : "ログアウトできませんでした",
      });
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <Surface appearance="tinted" padding="lg">
      <MediaObject
        media={
          <AvatarButton
            label="アイコンを変更"
            indicator={<CameraIcon />}
            onClick={() => setIconOpen(true)}
            name={account.name}
            fallback={Array.from(account.name)[0]}
            {...accountIconAvatar(icon, "pink")}
            size="fluid"
            badge={account.provider ? <ProviderMark provider={account.provider} /> : undefined}
            ring
          />
        }
        actions={
          <Button appearance="quiet" size="sm" loading={signingOut} onClick={() => void logout()}>
            ログアウト
          </Button>
        }
      >
        {editing ? (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void saveName();
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") closeName();
            }}
          >
            <Stack space="compact">
              <Field
                label="表示名"
                description="次に作成・参加するルームから使います。20文字まで入力できます。"
                error={error}
              >
                <Input
                  ref={nameInput}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  maxLength={20}
                  autoComplete="nickname"
                  required
                  disabled={saving}
                />
              </Field>
              <ActionGroup>
                <Button
                  type="submit"
                  size="sm"
                  shape="pill"
                  loading={saving}
                  disabled={!name.trim()}
                >
                  保存
                </Button>
                <Button appearance="quiet" size="sm" disabled={saving} onClick={closeName}>
                  やめる
                </Button>
              </ActionGroup>
            </Stack>
          </form>
        ) : (
          <Stack space="compact">
            <Cluster>
              <Heading level={2} size="title">
                {account.name}
              </Heading>
              <IconButton
                ref={editButton}
                label="表示名を変更"
                size="sm"
                shape="circle"
                onClick={() => {
                  setName(account.name);
                  setEditing(true);
                }}
              >
                ✎
              </IconButton>
            </Cluster>
            {account.provider && (
              <Cluster>
                <ProviderMark provider={account.provider} />
                <Text variant="body.sm" tone="muted">
                  {loginProviderNames[account.provider]}でログイン中
                </Text>
              </Cluster>
            )}
          </Stack>
        )}
      </MediaObject>
      {iconOpen && (
        <IconDialog
          name={account.name}
          icon={icon}
          saving={saving}
          onClose={() => setIconOpen(false)}
          onSave={(next) => void saveIcon(next)}
        />
      )}
    </Surface>
  );
}

function formatTotal(total: number | null) {
  return total === null ? "—" : total.toFixed(1);
}

/** 成績と、1位だけに絞り込める戦績の一覧。 */
function MatchHistory({ history, onStart }: { history: BattleHistory; onStart: () => void }) {
  const [filter, setFilter] = useState("all");
  const { stats, records } = history;
  const list = records.filter((record) => filter === "all" || record.rank === 1);
  return (
    <>
      <StatGroup
        items={[
          { label: "1位", value: stats.wins, unit: "回", accent: true },
          { label: "対戦", value: stats.matches, unit: "回" },
          { label: "勝率", value: stats.winRate, unit: "%" },
          {
            label: "ベストスコア",
            value: formatTotal(stats.bestTotal),
            unit: stats.bestTotal === null ? "" : "pt",
          },
          {
            label: "平均の再現度",
            value: formatTotal(stats.averageTotal),
            unit: stats.averageTotal === null ? "" : "%",
          },
        ]}
      />
      <Stack>
        <Cluster justify="between">
          <Stack space="tight">
            <Text variant="eyebrow.strong" tone="accent">
              MATCHES
            </Text>
            <Heading level={2} size="title">
              戦績
            </Heading>
          </Stack>
          <SegmentedControl
            label="戦績の絞り込み"
            appearance="pill"
            enclosure="outlined"
            density="compact"
            value={filter}
            options={[
              { value: "all", label: "すべて" },
              { value: "win", label: "1位だけ" },
            ]}
            onValueChange={setFilter}
          />
        </Cluster>
        {list.length > 0 && (
          <RecordList label="戦績">
            {list.map((record) => {
              const level = getDifficulty(record.difficulty).label;
              return (
                <RecordItem
                  key={record.battleId}
                  imagePosition="start"
                  href={`/mypage/matches/${record.battleId}`}
                  label={`${level}・${record.participantCount}人対戦（${record.rank ? `${record.rank}位` : "順位なし"}）の詳細`}
                  emphasis={record.rank === 1}
                  leading={
                    <Text variant="numeric.rank" tone={record.rank === 1 ? "accent" : "muted"}>
                      {record.rank === null ? "—" : ordinal(record.rank)}
                    </Text>
                  }
                  image={record.imageUrl}
                  supplement={
                    record.total === null ? (
                      <Text variant="caption" tone="muted">
                        {record.imageUrl ? "採点なし" : "未提出"}
                      </Text>
                    ) : (
                      <Stack space="tight">
                        <Meter label="再現度" presentation="track" value={record.total} />
                        <Text variant="caption" tone="muted">
                          再現度 {record.total.toFixed(1)}
                        </Text>
                      </Stack>
                    )
                  }
                  value={
                    <Text variant="numeric.supporting">
                      {formatTotal(record.total)}
                      {record.total !== null && <Text variant="caption">pt</Text>}
                    </Text>
                  }
                >
                  <Text variant="label.supporting">
                    {level}・{record.participantCount}人対戦
                  </Text>
                  <Text variant="caption" tone="muted">
                    {playedAtLabel(record.startedAt)}
                  </Text>
                </RecordItem>
              );
            })}
          </RecordList>
        )}
        {records.length < stats.matches && (
          <Text as="p" variant="caption" tone="muted" align="center">
            新しい順に{records.length}件まで表示しています。
          </Text>
        )}
        {!list.length && (
          <Surface appearance="card" padding="section">
            <Stack align="center">
              <Heading level={3} size="sm">
                {records.length ? "1位になった対戦はまだありません" : "まだ戦績がありません"}
              </Heading>
              <Text as="p" align="center" tone="muted">
                {records.length
                  ? "次の対戦で狙ってみよう！"
                  : "ログインして対戦すると、順位とスコアがここに残ります。"}
              </Text>
              <Button shape="pill" onClick={onStart}>
                対戦をはじめる
              </Button>
            </Stack>
          </Surface>
        )}
      </Stack>
    </>
  );
}

/** ログインした参加者のプロフィール・成績・戦績。ログインしていなければログインを案内する。 */
export function MyPage({
  account,
  history,
  loginError,
}: {
  account: Account | null;
  history: BattleHistory | null;
  loginError?: string;
}) {
  const router = useRouter();
  const { navigate } = usePageTransition();
  const start = () => navigate("/start");
  return (
    <Page decoration={<GridBackdrop />}>
      <AppFrame
        brand={<AppBrand />}
        context={
          <Stack space="tight">
            <Text variant="eyebrow.strong" tone="accent">
              MY PAGE
            </Text>
            <Heading level={1} size="title">
              マイページ
            </Heading>
          </Stack>
        }
        actions={
          <Button shape="pill" size="sm" onClick={start}>
            ▶ 対戦をはじめる
          </Button>
        }
        width="content"
      >
        {account && history ? (
          <Stack space="section">
            <Profile account={account} onChanged={() => router.invalidate()} />
            <MatchHistory history={history} onStart={start} />
          </Stack>
        ) : (
          <AccountLoginPrompt returnTo="/mypage" loginError={loginError} />
        )}
      </AppFrame>
    </Page>
  );
}
