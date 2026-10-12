import { useState, type ReactNode } from "react";
import { ActionGroup } from "@animic/react/action-group";
import { AppFrame } from "@animic/react/app-frame";
import { Avatar } from "@animic/react/avatar";
import { Badge } from "@animic/react/badge";
import { Button } from "@animic/react/button";
import { Cluster } from "@animic/react/cluster";
import { ComparisonStage } from "@animic/react/comparison-stage";
import { Grid } from "@animic/react/grid";
import { Heading } from "@animic/react/heading";
import { Media, MediaPlaceholder } from "@animic/react/media";
import { Page } from "@animic/react/page";
import { Progress } from "@animic/react/progress";
import { Readout } from "@animic/react/readout";
import { Stack } from "@animic/react/stack";
import { Surface } from "@animic/react/surface";
import { Text } from "@animic/react/text";
import { AppBrand } from "../shared/app-brand";
import { GridBackdrop } from "../shared/visuals/grid-backdrop";
import { accountIconAvatar, type AccountIcon } from "../account/account-icon";
import { levels, playerPalettes } from "../room/room-presentation";
import { getScoreRank } from "../scoring/score-rank";
import {
  getPlacement,
  getResultEntries,
  getResultHeadline,
  type ResultEntry,
} from "./battle-outcome";
import { BattleRoomBadge } from "./battle-header";
import { useReducedMotion } from "./battle-preferences";
import type { BattleSnapshot } from "./battle-state";
import {
  ResultBreakdown,
  ScoringMetricsLoaderContext,
  useResultMetrics,
  type ScoringMetricsLoader,
} from "./result-breakdown";
import { getRevealOrder, getRevealStage, type RevealStage } from "./result-presentation";
import { RankingResult } from "./result-ranking";
import { ResultReveal, RevealCounter } from "./result-reveal";
import { ResultShareLink } from "./result-share";
import { useRevealElapsed } from "./use-reveal-clock";
import { ResultBurst, ResultConfetti, ResultShards, VerdictReveal } from "./visuals/result-artwork";
function ParticipantResult({
  entry,
  name,
  icon,
  mine,
  seat,
}: {
  entry: ResultEntry;
  name: string;
  icon: AccountIcon | null;
  mine: boolean;
  seat: number;
}) {
  return (
    <Surface appearance="card" padding="content">
      <Stack>
        <Cluster>
          <Avatar
            name={name}
            fallback={Array.from(name)[0]}
            {...accountIconAvatar(icon, playerPalettes[seat % playerPalettes.length])}
          />
          <Heading level={2} size="title">
            {name}
          </Heading>
          <Badge>{mine ? "あなた" : "対戦相手"}</Badge>
          {entry.winner && <Badge tone="highlight">WINNER</Badge>}
        </Cluster>
        {entry.imageUrl ? (
          <Media src={entry.imageUrl} alt={`${name}さんの提出画像`} aspect="portrait" />
        ) : (
          <MediaPlaceholder
            label={entry.submitted ? "提出済み" : "未提出"}
            // 1対1で提出した相手の画像がないのは、採点で勝敗が決まらなかった場合だけ。
            description={
              entry.submitted && !mine ? "採点できなかったため、画像は公開されません" : undefined
            }
          >
            <Text>{entry.submitted ? "提出済み" : "未提出"}</Text>
          </MediaPlaceholder>
        )}
        {entry.total !== null && (
          <Stack space="tight" align="center">
            <Text variant="caption">最終スコア</Text>
            <Text
              variant="numeric.display"
              tone={getScoreRank(entry.total).text}
              emphasis={getScoreRank(entry.total).emphasis}
            >
              {entry.total.toLocaleString("ja-JP", { maximumFractionDigits: 2 })}
              <Text variant="caption">pt</Text>
            </Text>
          </Stack>
        )}
        {!entry.submitted && (
          <Text variant="caption" tone="muted">
            時間内に提出されませんでした
          </Text>
        )}
      </Stack>
    </Surface>
  );
}
/** ヘッダーの下に横幅いっぱいに通す、発表の進み具合の線。 */
function RevealProgress({ value }: { value: number }) {
  return <Progress label="発表の進み具合" value={value} presentation="track" tone="gradient" />;
}

type ResultPageProps = {
  code: string;
  battle: BattleSnapshot;
  participantId: string;
  names: Map<string, string>;
  icons: Map<string, AccountIcon | null>;
  /** Snapshotを受信した時刻（`performance.now()`）。サーバーの描画では`null`。 */
  receivedAt: number | null;
  /** 同じルームの待機画面へ戻る。このルームでもう対戦できなければ省略し、再戦の操作を出さない。 */
  onRematch?: () => void;
  onTop: () => void;
  /**
   * 指標の読み方。省略すると、ルームの対戦について`getResultScoringMetrics`で読む。
   * ルームのない画面（開発用の確認画面など）だけが渡す。
   */
  loadMetrics?: ScoringMetricsLoader;
};

export function ResultPage({ loadMetrics, ...props }: ResultPageProps) {
  return (
    <ScoringMetricsLoaderContext value={loadMetrics ?? null}>
      <ResultScreen {...props} />
    </ScoringMetricsLoaderContext>
  );
}

function ResultScreen({
  code,
  battle,
  participantId,
  names,
  icons,
  receivedAt,
  onRematch,
  onTop,
}: Omit<ResultPageProps, "loadMetrics">) {
  const order = getRevealOrder(battle);
  const elapsed = useRevealElapsed(battle.serverTime, receivedAt, battle.result?.decidedAt ?? 0);
  const reduced = useReducedMotion();
  const live = getRevealStage(order.length, elapsed);
  // 動きを減らす設定では、発表の演出を省いて最初から最終の結果を出す。
  const stage: RevealStage = reduced ? { kind: "final" } : live;
  // 発表があるときだけ、採点の様子に出す指標の点を先に読む。
  const [revealing] = useState(live.kind === "reveal");
  const metrics = useResultMetrics(
    code,
    battle.id,
    revealing ? order.map((entry) => entry.participantId) : [],
  );
  // この画面で発表を見たか。発表が終わった後に開いた場合は、最終の結果の登場の演出を再生しない。
  const [watched, setWatched] = useState(false);
  if (stage.kind === "reveal" && !watched) setWatched(true);
  const animate = watched && !reduced;
  if (!battle.result) return null;
  const roomLabel = <BattleRoomBadge code={code} settings={battle.settings} />;
  if (stage.kind === "reveal")
    return (
      <Page decoration={<GridBackdrop />}>
        <AppFrame
          width="full"
          headerAppearance="surface"
          contentFit="viewport"
          brand={<AppBrand />}
          context={roomLabel}
          actions={<RevealCounter stage={stage} count={order.length} />}
          // 狭い画面では、何人目かを採点パネルで示し、ヘッダーはロゴだけにする。
          compactActions={null}
          progress={<RevealProgress value={stage.progress * 100} />}
        >
          <ResultReveal
            battle={battle}
            order={order}
            stage={stage}
            participantId={participantId}
            names={names}
            icons={icons}
            metrics={metrics}
          />
        </AppFrame>
      </Page>
    );
  // 最終の結果も発表中と同じヘッダーにし、右側には自分の結果を出す。
  // 発表があった結果では、ヘッダーの下に満ちた進み具合の線を残し、発表中から切り替わるときに高さを変えない。
  const frame = (content: ReactNode) => (
    <AppFrame
      headerAppearance="surface"
      brand={<AppBrand />}
      context={roomLabel}
      actions={<Readout label="RESULT" value={getPlacement(battle, participantId)} />}
      compactActions={null}
      progress={order.length > 0 && <RevealProgress value={100} />}
    >
      {content}
    </AppFrame>
  );
  // 3人以上は順位、2人は勝ち負けで表示する。
  if (battle.participantIds.length > 2)
    return (
      <Page
        decoration={
          <>
            <GridBackdrop />
            <ResultShards />
            {/* 見出しの左右の帯は、ページの上端（白いヘッダーの裏）から始め、ヘッダーの下に隙間を作らない。 */}
            <ResultBurst animate={animate} />
          </>
        }
      >
        {frame(
          <RankingResult
            code={code}
            battle={battle}
            participantId={participantId}
            names={names}
            icons={icons}
            animate={animate}
            onRematch={onRematch}
            onTop={onTop}
          />,
        )}
      </Page>
    );
  const opponentId = battle.participantIds.find((id) => id !== participantId);
  const headline = getResultHeadline(
    battle.result,
    participantId,
    names.get(opponentId ?? "") ?? "相手",
  );
  const [mine, theirs] = getResultEntries(battle, participantId);
  const name = (id: string) => names.get(id) ?? (id === participantId ? "あなた" : "相手");
  const participant = (entry: ResultEntry) => (
    <ParticipantResult
      entry={entry}
      name={name(entry.participantId)}
      icon={icons.get(entry.participantId) ?? null}
      mine={entry.participantId === participantId}
      seat={battle.participantIds.indexOf(entry.participantId)}
    />
  );
  return (
    <Page
      decoration={
        <>
          <GridBackdrop />
          <ResultShards />
          <ResultBurst animate={animate} />
          {animate && battle.result.kind === "win" && battle.result.winnerId === participantId && (
            <ResultConfetti />
          )}
        </>
      }
    >
      {frame(
        <Stack space="section">
          <Stack align="center" space="compact">
            <Text variant="eyebrow.display" tone="accent">
              RESULT
            </Text>
            <VerdictReveal animate={animate}>
              <Heading level={1} size="statement">
                {headline.title}
              </Heading>
            </VerdictReveal>
            <Text align="center">{headline.message}</Text>
          </Stack>
          <ComparisonStage first={mine && participant(mine)} second={theirs && participant(theirs)}>
            <Stack align="center">
              <Badge>
                お題・{levels[battle.settings.difficulty].label}・{battle.settings.durationSeconds}
                秒
              </Badge>
              <Media
                src={battle.topic.imageUrl}
                alt="お題のイラスト"
                aspect="portrait"
                size="preview"
              />
            </Stack>
          </ComparisonStage>
          {/* 操作は結果の札の下・内訳の上に置き、結果の種類によらず同じ位置にする。 */}
          <ActionGroup align="center">
            {onRematch && (
              <Button
                shape="pill"
                size="lg"
                compactLabel="再戦"
                aria-label="同じメンバーで再戦"
                onClick={onRematch}
              >
                同じメンバーで再戦
              </Button>
            )}
            <ResultShareLink battle={battle} participantId={participantId} />
            <Button
              shape="pill"
              size="lg"
              appearance="secondary"
              compactLabel="トップへ"
              aria-label="トップへ戻る"
              onClick={onTop}
            >
              トップへ戻る
            </Button>
          </ActionGroup>
          {battle.scores && (
            <Grid columns={2}>
              {battle.scores
                .toSorted(
                  (a, b) =>
                    Number(b.participantId === participantId) -
                    Number(a.participantId === participantId),
                )
                .map((score) => (
                  <ResultBreakdown
                    key={score.participantId}
                    code={code}
                    battle={battle}
                    score={score}
                    name={name(score.participantId)}
                    mine={score.participantId === participantId}
                  />
                ))}
            </Grid>
          )}
        </Stack>,
      )}
    </Page>
  );
}
