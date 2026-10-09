import { ActionGroup } from "@animic/react/action-group";
import { AppFrame } from "@animic/react/app-frame";
import { Badge } from "@animic/react/badge";
import { Button } from "@animic/react/button";
import { Cluster } from "@animic/react/cluster";
import { Heading } from "@animic/react/heading";
import { ImagePair, ImagePairItem } from "@animic/react/image-pair";
import { ButtonLink } from "@animic/react/link";
import { Media, MediaPlaceholder } from "@animic/react/media";
import { Page } from "@animic/react/page";
import { RecordItem, RecordList } from "@animic/react/record-list";
import { Split } from "@animic/react/split";
import { Stack } from "@animic/react/stack";
import { Surface } from "@animic/react/surface";
import { Text } from "@animic/react/text";
import { useToast } from "@animic/react/toast";
import { ScoreBreakdown } from "./score-breakdown";
import { artTags, decodeArt } from "../image-generation/art-preview";
import { artImage } from "../image-generation/visuals/art-image";
import { usePageTransition } from "../../../src/features/navigation/page-transition-provider";
import { levels } from "../../../src/features/room/room-presentation";
import { AppBrand } from "../../../src/features/shared/app-brand";
import { ordinal, dateLabel } from "../shared/format";
import { CopyIcon } from "../shared/icons";
import { GridBackdrop } from "../../../src/features/shared/visuals/grid-backdrop";
import { useAccountPreview, useResultsPreview } from "./account-preview";
import type { HistoryEntry } from "./history-entry";
export function MatchPage({ entryKey }: { entryKey: string }) {
  const account = useAccountPreview(),
    history = useResultsPreview();
  const entry: HistoryEntry | undefined = (account ? history : []).find(
    (item) => item.key === entryKey,
  );
  const { navigate } = usePageTransition();
  const toast = useToast();
  const back = "/mypage";
  const level = Object.values(levels).find((item) => item.label === entry?.level) ?? levels.easy;
  const features = entry?.art ? decodeArt(entry.art) : null;
  const tags = entry?.prompt
    ? entry.prompt
        .split(/[、,，]/)
        .map((word) => word.trim())
        .filter(Boolean)
    : features
      ? artTags(features)
      : [];
  async function copy(text: string, title: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.show({ title });
    } catch {
      toast.show({ title: "コピーできませんでした" });
    }
  }
  return (
    <Page decoration={<GridBackdrop />}>
      <AppFrame
        brand={<AppBrand />}
        context={
          <Stack space="tight">
            <Text variant="eyebrow.strong" tone="accent">
              MATCH DETAIL
            </Text>
            <Heading level={1} size="title">
              戦績の詳細
            </Heading>
          </Stack>
        }
        actions={
          <Button appearance="secondary" shape="pill" size="sm" onClick={() => navigate(back)}>
            〈 マイページ
          </Button>
        }
      >
        {!entry ? (
          <Surface appearance="card" padding="section">
            <Stack align="center">
              <Heading level={2} size="lg">
                戦績が見つかりません
              </Heading>
              <Text tone="muted">ログアウトしたか、この端末に保存されていない戦績です。</Text>
              <ButtonLink
                href={back}
                appearance="primary"
                size="hero"
                shape="pill"
                prominence="raised"
              >
                マイページへ戻る
              </ButtonLink>
            </Stack>
          </Surface>
        ) : (
          <Stack space="section">
            <Split layout="balanced" collapseOrder="reverse" align="start">
              <Surface appearance="card" padding="sm">
                <ImagePair
                  sizing="fill"
                  summary={
                    entry.sim !== null ? (
                      <>
                        <Text variant="caption" tone="inverse">
                          再現度
                        </Text>
                        <Text variant="numeric.supporting" tone="inverse">
                          {entry.sim.toFixed(1)}
                        </Text>
                      </>
                    ) : undefined
                  }
                >
                  <ImagePairItem
                    labelPlacement="above"
                    label={
                      <Stack space="tight">
                        <Text variant="eyebrow.strong" tone="accent">
                          TOPIC
                        </Text>
                        <Text variant="label.supporting">お題</Text>
                      </Stack>
                    }
                  >
                    <Media src={entry.topic ?? level.image} alt="お題の画像" aspect="portrait" />
                  </ImagePairItem>
                  <ImagePairItem
                    labelPlacement="above"
                    label={
                      <Stack space="tight">
                        <Text variant="eyebrow.strong" tone="accent">
                          SUBMITTED
                        </Text>
                        <Text variant="label.supporting">あなたの提出画像</Text>
                      </Stack>
                    }
                  >
                    {features ? (
                      <Media src={artImage(features)} alt="あなたの提出画像" aspect="portrait" />
                    ) : (
                      <MediaPlaceholder label="未提出">
                        <Text tone="muted">未提出</Text>
                      </MediaPlaceholder>
                    )}
                  </ImagePairItem>
                </ImagePair>
              </Surface>
              <Stack>
                <Surface appearance="inverse" padding="lg">
                  <Cluster justify="between">
                    <Text
                      variant="numeric.display"
                      tone={entry.rank === 1 ? "highlight" : "inverse"}
                    >
                      {entry.rank ? ordinal(entry.rank) : "NO ENTRY"}
                      <Text variant="caption" tone="inverse">
                        {" "}
                        / {entry.players}人
                      </Text>
                    </Text>
                    <Stack space="tight">
                      <Text variant="label" tone="inverse">
                        {entry.level}・{entry.players}人対戦
                      </Text>
                      <Text variant="caption" tone="inverse">
                        {dateLabel(entry.at)}・ルーム {entry.code}
                      </Text>
                    </Stack>
                    <Text variant="numeric.display" tone="inverse">
                      {entry.total?.toFixed(1) ?? "—"}
                      <Text variant="caption" tone="inverse">
                        pt
                      </Text>
                    </Text>
                  </Cluster>
                </Surface>
                {entry.total !== null && (
                  <Surface appearance="card" padding="content">
                    <ScoreBreakdown entry={entry} />
                  </Surface>
                )}
                {features && (
                  <Surface appearance="card" padding="content">
                    <Stack space="compact">
                      <Cluster justify="between">
                        <Heading level={2} size="sm">
                          提出したプロンプト
                        </Heading>
                        <Button
                          appearance="secondary"
                          shape="pill"
                          size="sm"
                          onClick={() =>
                            void copy(entry.prompt || tags.join(", "), "プロンプトをコピーしました")
                          }
                        >
                          <CopyIcon /> コピー
                        </Button>
                      </Cluster>
                      <Cluster>
                        {tags.map((tag, i) => (
                          <Badge key={`${tag}-${i}`} shape="rounded">
                            <Text variant="code.compact">{tag}</Text>
                          </Badge>
                        ))}
                      </Cluster>
                    </Stack>
                  </Surface>
                )}
              </Stack>
            </Split>
            <Surface appearance="card" padding="content">
              <Stack>
                <Heading level={2} size="sm">
                  この対戦の順位
                </Heading>
                <RecordList label="この対戦の順位" layout="grid">
                  {entry.ranking.map((player, i) => (
                    <RecordItem
                      key={i}
                      density="compact"
                      emphasis={player.isMe}
                      leading={
                        <Text
                          variant="numeric.supporting"
                          tone={player.rank === 1 ? "accent" : "default"}
                        >
                          {player.rank ?? "—"}
                        </Text>
                      }
                      image={player.art ? artImage(decodeArt(player.art)) : null}
                      value={
                        <Text variant="code">
                          {player.total === null ? "未提出" : `${player.total.toFixed(1)}pt`}
                        </Text>
                      }
                    >
                      <Text variant="label.supporting">
                        {player.name}
                        {player.isMe && "（あなた）"}
                      </Text>
                    </RecordItem>
                  ))}
                </RecordList>
              </Stack>
            </Surface>
            <ActionGroup align="center">
              <Button shape="pill" onClick={() => navigate("/login?next=create")}>
                もう一度あそぶ
              </Button>
              <Button
                appearance="secondary"
                shape="pill"
                onClick={() =>
                  void copy(
                    `Animic ${ordinal(entry.rank)}・${entry.total?.toFixed(1) ?? "未提出"}pt\n${window.location.origin}`,
                    "シェア用のテキストをコピーしました",
                  )
                }
              >
                結果をシェア
              </Button>
            </ActionGroup>
          </Stack>
        )}
      </AppFrame>
    </Page>
  );
}
