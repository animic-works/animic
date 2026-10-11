import { ActionGroup } from "@animic/react/action-group";
import { AppFrame } from "@animic/react/app-frame";
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
import { AccountLoginPrompt } from "../account/account-login-prompt";
import { ArrowIcon } from "../shared/icons";
import { usePageTransition } from "../navigation/page-transition-provider";
import { AppBrand } from "../shared/app-brand";
import { GridBackdrop } from "../shared/visuals/grid-backdrop";
import type { getMyBattleDetail } from "./battle-history.functions";
import { getDifficulty, playedAtLabel } from "./battle-labels";
import { ordinal } from "./battle-outcome";
import { ScoreBreakdown } from "./score-breakdown";

type Detail = NonNullable<Awaited<ReturnType<typeof getMyBattleDetail>>>;

function formatTotal(total: number | null) {
  return total === null ? "—" : total.toFixed(1);
}

function resultLabel(detail: Detail) {
  if (detail.rank !== null) return ordinal(detail.rank);
  if (detail.resultKind === "no-contest") return "NO GAME";
  return detail.imageUrl ? "NO SCORE" : "NO ENTRY";
}

function MatchDetail({ detail }: { detail: Detail }) {
  const level = getDifficulty(detail.settings.difficulty).label;
  return (
    <Stack space="section">
      <Split layout="balanced-aside" collapseOrder="reverse" align="stretch">
        <Surface appearance="card" padding="sm" fill>
          <Stack fill justify="center">
            <ImagePair
              sizing="fill"
              summary={
                detail.total === null ? undefined : (
                  <>
                    <Text variant="caption" tone="inverse">
                      再現度
                    </Text>
                    <Text variant="numeric.supporting" tone="inverse">
                      {detail.total.toFixed(1)}
                    </Text>
                  </>
                )
              }
            >
              <ImagePairItem
                labelPlacement="above"
                label={<Text variant="label.supporting">お題</Text>}
              >
                <Media src={detail.topicImageUrl} alt="お題の画像" aspect="portrait" />
              </ImagePairItem>
              <ImagePairItem
                labelPlacement="above"
                label={<Text variant="label.supporting">あなたの提出画像</Text>}
              >
                {detail.imageUrl ? (
                  <Media src={detail.imageUrl} alt="あなたの提出画像" aspect="portrait" />
                ) : (
                  <MediaPlaceholder label="未提出">
                    <Text tone="muted">未提出</Text>
                  </MediaPlaceholder>
                )}
              </ImagePairItem>
            </ImagePair>
          </Stack>
        </Surface>
        <Stack>
          <Surface appearance="inverse" padding="lg">
            <Cluster justify="between">
              <Text variant="numeric.display" tone={detail.rank === 1 ? "highlight" : "inverse"}>
                {resultLabel(detail)}
                <Text variant="caption" tone="inverse">
                  {" "}
                  / {detail.participantCount}人
                </Text>
              </Text>
              <Stack space="tight">
                <Text variant="label" tone="inverse">
                  {level}・{detail.participantCount}人対戦
                </Text>
                <Text variant="caption" tone="inverse">
                  {playedAtLabel(detail.startedAt)}・ルーム {detail.roomCode}
                </Text>
              </Stack>
              <Text variant="numeric.display" tone="inverse">
                {formatTotal(detail.total)}
                <Text variant="caption" tone="inverse">
                  pt
                </Text>
              </Text>
            </Cluster>
          </Surface>
          <Surface appearance="card" padding="content">
            <Stack space="compact">
              <Heading level={2} size="sm">
                スコアの内訳
              </Heading>
              <ScoreBreakdown
                total={detail.total}
                submission={detail.submission}
                metrics={detail.metrics}
              />
            </Stack>
          </Surface>
        </Stack>
      </Split>
      <Surface appearance="card" padding="content">
        <Stack>
          <Heading level={2} size="sm">
            この対戦の順位
          </Heading>
          <RecordList label="この対戦の順位" layout="grid">
            {detail.ranking.map((player) => (
              <RecordItem
                key={player.key}
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
                image={player.imageUrl}
                value={
                  <Text variant="code">
                    {player.total !== null
                      ? `${player.total.toFixed(1)}pt`
                      : player.submitted
                        ? "採点なし"
                        : "未提出"}
                  </Text>
                }
              >
                <Text variant="label.supporting">
                  {player.name ?? (player.isMe ? "あなた" : "参加者")}
                  {player.isMe && player.name !== null && "（あなた）"}
                </Text>
              </RecordItem>
            ))}
          </RecordList>
        </Stack>
      </Surface>
    </Stack>
  );
}

/** 1つの対戦の詳細。ログインしていなければログインを案内する。 */
export function MatchDetailPage({
  detail,
  returnTo,
  loginError,
}: {
  detail: Detail | null;
  returnTo: string;
  loginError?: string;
}) {
  const { navigate } = usePageTransition();
  const backToMypage = (
    <Button
      appearance="secondary"
      shape="pill"
      leadingIcon={<ArrowIcon direction="left" />}
      onClick={() => navigate("/mypage")}
    >
      マイページ
    </Button>
  );
  const title = (
    <Stack space="tight">
      <Text variant="eyebrow.strong" tone="accent">
        MATCH DETAIL
      </Text>
      <Heading level={1} size="title">
        戦績の詳細
      </Heading>
    </Stack>
  );
  return (
    <Page decoration={<GridBackdrop />}>
      <AppFrame brand={<AppBrand />} context={title}>
        {detail ? (
          <Stack space="section">
            <Stack space="compact">
              <div>{backToMypage}</div>
              <MatchDetail detail={detail} />
            </Stack>
            <ActionGroup align="center">
              {backToMypage}
              <ButtonLink href="/start" shape="pill">
                もう一度あそぶ
              </ButtonLink>
            </ActionGroup>
          </Stack>
        ) : (
          <AccountLoginPrompt returnTo={returnTo} loginError={loginError} />
        )}
      </AppFrame>
    </Page>
  );
}
