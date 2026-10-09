import { useEffect, useRef, useState } from "react";
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
import { decodeArt } from "../image-generation/art-preview";
import { artImage } from "../image-generation/visuals/art-image";
import { usePageTransition } from "../../../src/features/navigation/page-transition-provider";
import { AppBrand } from "../../../src/features/shared/app-brand";
import { ordinal, relativeDateLabel } from "../shared/format";
import { GridBackdrop } from "../../../src/features/shared/visuals/grid-backdrop";
import { accountPalette } from "./account-appearance";
import {
  saveAccount,
  signOut,
  useAccountPreview,
  useResultsPreview,
  type AccountPreview,
} from "./account-preview";
import { IconEditor } from "./icon-editor";
import { ProviderIcon } from "../../../src/features/account/visuals/provider-icon";
export function MyPage() {
  const account = useAccountPreview(),
    results = useResultsPreview();
  const [openedAt] = useState(Date.now);
  const profile = account;
  const history = results;
  const [editing, setEditing] = useState(false),
    [name, setName] = useState(""),
    [iconOpen, setIconOpen] = useState(false),
    [filter, setFilter] = useState("all");
  const nameInput = useRef<HTMLInputElement>(null),
    editButton = useRef<HTMLButtonElement>(null);
  const toast = useToast();
  const { navigate } = usePageTransition();
  useEffect(() => {
    if (editing) {
      nameInput.current?.focus();
      nameInput.current?.select();
    }
  }, [editing]);
  function update(value: AccountPreview) {
    try {
      saveAccount(value);
      return true;
    } catch {
      toast.show({ title: "変更を保存できませんでした" });
      return false;
    }
  }
  function closeName() {
    setEditing(false);
    requestAnimationFrame(() => editButton.current?.focus());
  }
  const wins = history.filter((entry) => entry.rank === 1).length,
    played = history.filter((entry) => entry.total !== null);
  const best = Math.max(0, ...played.map((entry) => entry.total ?? 0));
  const average = played.length
    ? played.reduce((sum, entry) => sum + (entry.sim ?? 0), 0) / played.length
    : 0;
  const list = history.filter((entry) => filter === "all" || entry.rank === 1);
  return (
    <Page decoration={<GridBackdrop />}>
      <AppFrame
        brand={<AppBrand />}
        compactContext={null}
        compactActions={
          <Button shape="pill" size="sm" onClick={() => navigate("/login?next=create")}>
            ▶ スタート
          </Button>
        }
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
          <Button shape="pill" size="sm" onClick={() => navigate("/login?next=create")}>
            ▶ 対戦をはじめる
          </Button>
        }
        width="content"
      >
        {profile ? (
          <Stack space="section">
            <Surface appearance="tinted" padding="lg">
              <MediaObject
                media={
                  <AvatarButton
                    label="アイコンを変更"
                    indicator={
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        aria-hidden="true"
                      >
                        <path d="M4 6h4l2-3h4l2 3h4v14H4z" />
                        <circle cx="12" cy="13" r="4" />
                      </svg>
                    }
                    onClick={() => setIconOpen(true)}
                    name={profile.name}
                    fallback={Array.from(profile.name)[0]}
                    src={profile.image}
                    palette={accountPalette(profile.color)}
                    size="fluid"
                    badge={<ProviderIcon provider={profile.provider} />}
                    ring
                  />
                }
                actions={
                  <Button
                    appearance="quiet"
                    size="sm"
                    onClick={() => {
                      try {
                        signOut();
                        toast.show({ title: "ログアウトしました" });
                      } catch {
                        toast.show({ title: "ログアウトできませんでした" });
                      }
                    }}
                  >
                    ログアウト
                  </Button>
                }
              >
                {editing ? (
                  <form
                    onSubmit={(event) => {
                      event.preventDefault();
                      if (name.trim() && update({ ...profile, name: name.trim() })) {
                        closeName();
                        toast.show({ title: "表示名を変更しました" });
                      }
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Escape") closeName();
                    }}
                  >
                    <Stack space="compact">
                      <Field label="表示名">
                        <Input
                          ref={nameInput}
                          value={name}
                          onChange={(event) => setName(event.target.value)}
                          maxLength={20}
                          required
                        />
                      </Field>
                      <ActionGroup>
                        <Button type="submit" size="sm" shape="pill" disabled={!name.trim()}>
                          保存
                        </Button>
                        <Button appearance="quiet" size="sm" onClick={closeName}>
                          やめる
                        </Button>
                      </ActionGroup>
                    </Stack>
                  </form>
                ) : (
                  <Stack space="compact">
                    <Cluster>
                      <Heading level={2} size="title">
                        {profile.name}
                      </Heading>
                      <IconButton
                        ref={editButton}
                        label="表示名を変更"
                        size="sm"
                        shape="circle"
                        onClick={() => {
                          setName(profile.name);
                          setEditing(true);
                        }}
                      >
                        ✎
                      </IconButton>
                    </Cluster>
                    <Cluster>
                      <ProviderIcon provider={profile.provider} />
                      <Text variant="body.sm" tone="muted">
                        {profile.provider}でログイン中
                      </Text>
                    </Cluster>
                  </Stack>
                )}
              </MediaObject>
            </Surface>
            <StatGroup
              items={[
                { label: "1位", value: wins, unit: "回", accent: true },
                { label: "対戦", value: history.length, unit: "回" },
                {
                  label: "勝率",
                  value: history.length ? Math.round((wins / history.length) * 100) : 0,
                  unit: "%",
                },
                {
                  label: "ベストスコア",
                  value: best ? best.toFixed(1) : "—",
                  unit: best ? "pt" : "",
                },
                {
                  label: "平均の再現度",
                  value: average ? average.toFixed(1) : "—",
                  unit: average ? "%" : "",
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
              <RecordList label="戦績">
                {list.map((entry) => (
                  <RecordItem
                    imagePosition="start"
                    key={entry.key}
                    href={`/match?${new URLSearchParams({ key: entry.key })}`}
                    label={`${entry.level}・${entry.players}人対戦（${entry.rank ? `${entry.rank}位` : "未提出"}）の詳細`}
                    emphasis={entry.rank === 1}
                    leading={
                      <Text variant="numeric.rank" tone={entry.rank === 1 ? "accent" : "muted"}>
                        {ordinal(entry.rank)}
                      </Text>
                    }
                    image={entry.art ? artImage(decodeArt(entry.art)) : null}
                    supplement={
                      entry.sim === null ? (
                        <Text variant="caption" tone="muted">
                          提出なし
                        </Text>
                      ) : (
                        <Stack space="tight">
                          <Meter label="再現度" presentation="track" value={entry.sim} />
                          <Text variant="caption" tone="muted">
                            再現度 {entry.sim.toFixed(1)}
                          </Text>
                        </Stack>
                      )
                    }
                    value={
                      <Text variant="numeric.supporting">
                        {entry.total?.toFixed(1) ?? "—"}
                        <Text variant="caption">{entry.total !== null && "pt"}</Text>
                      </Text>
                    }
                  >
                    <Text variant="label.supporting">
                      {entry.level}・{entry.players}人対戦
                    </Text>
                    <Text variant="caption" tone="muted">
                      {relativeDateLabel(entry.at, openedAt)}
                    </Text>
                  </RecordItem>
                ))}
              </RecordList>
              {!list.length && (
                <Surface appearance="card" padding="section">
                  <Stack align="center">
                    <Heading level={3} size="sm">
                      {history.length ? "1位になった対戦はまだありません" : "まだ戦績がありません"}
                    </Heading>
                    <Text tone="muted">
                      {history.length
                        ? "次の対戦で狙ってみよう！"
                        : "対戦すると、順位とスコアがここに残ります。"}
                    </Text>
                    <Button shape="pill" onClick={() => navigate("/login?next=create")}>
                      対戦をはじめる
                    </Button>
                  </Stack>
                </Surface>
              )}
            </Stack>
            {iconOpen && (
              <IconEditor
                account={profile}
                onClose={() => setIconOpen(false)}
                onSave={(value) => {
                  if (update(value)) {
                    setIconOpen(false);
                    toast.show({ title: "アイコンを変更しました" });
                  }
                }}
              />
            )}
          </Stack>
        ) : (
          <Surface appearance="card" padding="section">
            <Stack align="center" space="section">
              <Heading level={2} size="lg">
                ログインして戦績を残そう
              </Heading>
              <Text align="center" tone="muted">
                ログインすると、順位やスコア、提出した画像をあとから見返せます。
              </Text>
              <Button shape="pill" onClick={() => navigate("/login?next=login&back=%2Fmypage")}>
                ログインする
              </Button>
              <Text variant="body.sm" tone="muted">
                ログインしなくても遊べます。
              </Text>
            </Stack>
          </Surface>
        )}
      </AppFrame>
    </Page>
  );
}
