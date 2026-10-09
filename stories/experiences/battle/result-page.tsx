import { CodeDisplay } from "@animic/react/code-display";
import { judgingDuration, judgingMoment } from "./judging-timeline";
import { useEffect, useRef, useState } from "react";
import { ActionGroup } from "@animic/react/action-group";
import { AppFrame } from "@animic/react/app-frame";
import { Avatar } from "@animic/react/avatar";
import { AvatarGroup } from "@animic/react/avatar-group";
import { Badge } from "@animic/react/badge";
import { Button } from "@animic/react/button";
import { Cluster } from "@animic/react/cluster";
import { ComparisonStage } from "@animic/react/comparison-stage";
import { Container } from "@animic/react/container";
import { Heading } from "@animic/react/heading";
import { Layer, LayerItem } from "@animic/react/layer";
import { Link } from "@animic/react/link";
import { Media, MediaPlaceholder } from "@animic/react/media";
import { Notice } from "@animic/react/notice";
import { Progress } from "@animic/react/progress";
import { Podium } from "@animic/react/podium";
import { RecordItem, RecordList } from "@animic/react/record-list";
import { Stack } from "@animic/react/stack";
import { Text } from "@animic/react/text";
import { Page } from "@animic/react/page";
import { useToast } from "@animic/react/toast";
import {
  keepPendingResult,
  saveHistory,
  useAccountPreview,
  useResultsPreview,
} from "../account/account-preview";
import { AccountMenu } from "../account/account-menu";
import { ProviderIcons } from "../account/visuals/provider-icons";
import { artImage } from "../image-generation/visuals/art-image";
import { usePageTransition } from "../../../src/features/navigation/page-transition-provider";
import { levels, playerPalettes } from "../../../src/features/room/room-presentation";
import { AppBrand } from "../../../src/features/shared/app-brand";
import { SkipIcon } from "../../../src/features/shared/icons";
import { FastForwardIcon, TrophyIcon, CheckIcon } from "../shared/icons";
import { ordinal } from "../shared/format";
import { useReducedMotion } from "../shared/use-reduced-motion";
import { GridBackdrop } from "../../../src/features/shared/visuals/grid-backdrop";
import type { BattleResult } from "./battle-presentation";
import { keepBattleResult } from "./result-storage";
import { JudgingPanel } from "./judging-panel";
import { rankResults, resultHistory } from "./result-preview";
import {
  Crown,
  ResultBurst,
  ResultConfetti,
  ResultRankingReveal,
  VerdictReveal,
} from "../../../src/features/battle/visuals/result-artwork";
import {
  EntryCurtain,
  EvaluationOverlay,
  ResultFollowupReveal,
  SubmittedReveal,
} from "./visuals/result-artwork";

export function ResultPage({
  result,
  onRematch,
  canRematch,
  initiallyCompleted: restored = false,
}: {
  result: BattleResult;
  onRematch: () => void;
  canRematch: boolean;
  initiallyCompleted?: boolean;
}) {
  const [initiallyCompleted] = useState(restored);
  const ranked = rankResults(result),
    order = ranked.toReversed();
  const me = ranked.find((player) => player.isMe)!;
  const level = levels[result.rules.level];
  const [clock, setClock] = useState(0),
    [fast, setFast] = useState(false),
    [skipped, setSkipped] = useState(initiallyCompleted);
  const [recordedAt] = useState(() => Date.now());
  const reduced = useReducedMotion();
  const account = useAccountPreview(),
    history = useResultsPreview();
  const { navigate, transitioning } = usePageTransition();
  const toast = useToast();
  const timeline = order.map((player, i) => ({
    player,
    start: order.slice(0, i).reduce((sum, p) => sum + judgingDuration(Boolean(p.entry)), 0),
    duration: judgingDuration(Boolean(player.entry)),
  }));
  const total = timeline.reduce((sum, p) => sum + p.duration, 0);
  const completed = skipped || reduced || clock >= total;
  const currentIndex = Math.max(
    0,
    timeline.findIndex((item) => clock < item.start + item.duration),
  );
  const current = timeline[currentIndex];
  const local = clock - current.start;
  const moment = judgingMoment(local, Boolean(current.player.entry));
  const presented = moment.entering ? timeline[currentIndex - 1] : current;
  const presentedElapsed = moment.entering && presented ? presented.duration : local;
  const presentedMoment =
    presented && judgingMoment(presentedElapsed, Boolean(presented.player.entry));
  const historyEntry = resultHistory(result, recordedAt);
  const saved = history.some((entry) => entry.key === historyEntry.key);
  const accountName = account?.name;
  const saveAttempt = useRef<string | null>(null);
  useEffect(() => {
    if (completed || transitioning) return undefined;
    let last = performance.now(),
      frame = 0;
    const tick = (now: number) => {
      const delta = now - last;
      last = now;
      setClock((value) => value + delta * (fast ? 3 : 1));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [completed, fast, transitioning]);
  useEffect(() => {
    if (!completed || !accountName || saved || saveAttempt.current === result.id) return;
    saveAttempt.current = result.id;
    try {
      saveHistory(resultHistory(result, recordedAt));
    } catch {
      toast.show({
        title: "戦績を保存できませんでした",
        description: "この端末の保存領域を確認してください。",
      });
    }
  }, [completed, accountName, saved, result, recordedAt, toast]);
  useEffect(() => {
    if (completed && !initiallyCompleted) keepBattleResult(result, true);
  }, [completed, initiallyCompleted, result]);
  const status = completed ? "結果発表" : `${currentIndex + 1} / ${order.length}`;
  const playbackControls = !completed && (
    <>
      <Button
        appearance="outlined"
        shape="pill"
        size="xs"
        leadingIcon={<FastForwardIcon />}
        aria-label="採点の演出を3倍の速さで見る"
        aria-pressed={fast}
        onClick={() => setFast(!fast)}
      >
        ×3
      </Button>
      <Button
        appearance="outlined"
        shape="pill"
        size="xs"
        trailingIcon={<SkipIcon size={12} />}
        onClick={() => setSkipped(true)}
      >
        スキップ
      </Button>
    </>
  );
  async function share() {
    try {
      await navigator.clipboard.writeText(
        `Animicで${me.score ? `${ordinal(me.rank)}・${me.score.total.toFixed(1)}pt` : "対戦"}！\n${window.location.origin}`,
      );
      toast.show({ title: "シェア用のテキストをコピーしました" });
    } catch {
      toast.show({ title: "コピーできませんでした" });
    }
  }
  return (
    <Page decoration={<GridBackdrop />}>
      <AppFrame
        brand={<AppBrand />}
        context={
          <Cluster>
            <Badge>
              ルーム <CodeDisplay value={result.code} presentation="inline" />
            </Badge>
            <Badge>
              {level.word}・{level.description}
            </Badge>
          </Cluster>
        }
        actions={
          <>
            <Stack space="tight">
              <Text variant="eyebrow.strong" tone="accent">
                {completed ? "RESULT" : "JUDGING"}
              </Text>
              <Text variant={completed ? "label.supporting" : "numeric.inline"}>{status}</Text>
            </Stack>
            {playbackControls}
            <AccountMenu />
          </>
        }
        compactActions={
          <>
            {playbackControls}
            <AccountMenu />
          </>
        }
        progress={
          <Progress
            tone="gradient"
            label="採点の進行"
            value={completed ? 100 : (clock / total) * 100}
            presentation="track"
            striped
          />
        }
        width="full"
      >
        {completed ? (
          <Layer>
            <LayerItem placement="background">
              <ResultBurst animate={!initiallyCompleted} />
            </LayerItem>
            <LayerItem placement="content">
              <Stack space="section">
                <Stack align="center" space="compact">
                  <Text variant="eyebrow.strong" tone="accent">
                    FINAL RESULT
                  </Text>
                  <VerdictReveal animate={!initiallyCompleted}>
                    <Heading level={1} size="statement" emphasis="offset">
                      {!ranked.some((player) => player.entry)
                        ? "NO GAME"
                        : !me.entry
                          ? "NO ENTRY"
                          : `${ordinal(me.rank)}${me.rank <= 3 ? "!" : ""}`}
                    </Heading>
                  </VerdictReveal>
                  <Text as="p" align="center" wrap="balance" variant="label" tone="muted">
                    {!ranked.some((player) => player.entry)
                      ? "誰も提出しなかったため、勝負不成立です"
                      : !me.entry
                        ? `今回は提出できませんでした。1位は ${ranked[0].name} さん`
                        : me.rank === 1
                          ? `あなたが1位！ ${ranked.length}人の中でいちばんお題に近い1枚でした`
                          : `あなたは ${ranked.length}人中 ${me.rank}位。1位は ${ranked[0].name} さん（${ranked[0].score?.total.toFixed(1)}pt）`}
                  </Text>
                </Stack>
                <Podium
                  entering={!initiallyCompleted}
                  items={ranked
                    .filter((player) => player.entry)
                    .slice(0, 3)
                    .map((player, i) => ({
                      id: player.id,
                      src: artImage(player.entry!.image.features),
                      label: `${player.name}さんの提出画像`,
                      avatar: (
                        <Avatar
                          size="small"
                          name={player.name}
                          fallback={Array.from(player.name)[0]}
                          palette={playerPalettes[player.seat % playerPalettes.length]}
                        />
                      ),
                      name: (
                        <Text variant="inherit">
                          {player.name}
                          {player.isMe && (
                            <Text variant="inherit" tone="accent">
                              （あなた）
                            </Text>
                          )}
                        </Text>
                      ),
                      value: player.score!.total.toFixed(1),
                      rank: player.rank,
                      decoration: i === 0 ? <Crown animate={!initiallyCompleted} /> : undefined,
                    }))}
                />
                <Container size="summary" gutter="none">
                  <Stack space="section">
                    <ResultRankingReveal>
                      <RecordList label="順位" entering={!initiallyCompleted}>
                        {ranked.map((player) => (
                          <RecordItem
                            density="compact"
                            key={player.id}
                            emphasis={player.isMe}
                            leading={
                              <Text variant="numeric.supporting">
                                {player.score ? player.rank : "—"}
                              </Text>
                            }
                            image={player.entry ? artImage(player.entry.image.features) : null}
                            avatar={
                              <Avatar
                                size="small"
                                name={player.name}
                                fallback={Array.from(player.name)[0]}
                                palette={playerPalettes[player.seat % playerPalettes.length]}
                              />
                            }
                            value={
                              <Text variant="numeric.supporting">
                                {player.score?.total.toFixed(1) ?? "—"}
                              </Text>
                            }
                            supplement={
                              <Text variant="caption" tone="muted">
                                {player.score
                                  ? `再現度 ${player.score.sim.toFixed(1)}・速度 +${player.score.speed}・回数 +${player.score.bonus}`
                                  : "未提出"}
                              </Text>
                            }
                          >
                            <Text variant="label">
                              {player.name}
                              {player.isMe && "（あなた）"}
                            </Text>
                          </RecordItem>
                        ))}
                      </RecordList>
                    </ResultRankingReveal>
                    {ranked.some((player) => player.entry) && (
                      <ResultFollowupReveal animate={!initiallyCompleted} sequence="save">
                        <Notice
                          tone={saved ? "success" : "primary"}
                          title={saved ? "戦績に保存しました" : "この結果を戦績に残しませんか？"}
                          icon={saved ? <CheckIcon /> : <TrophyIcon />}
                          actions={
                            saved ? (
                              <Link href="/mypage" appearance="inverse">
                                マイページで見る
                              </Link>
                            ) : (
                              <Button
                                appearance="inverse"
                                shape="pill"
                                size="sm"
                                leadingIcon={<ProviderIcons />}
                                onClick={() => {
                                  try {
                                    keepPendingResult(historyEntry);
                                    keepBattleResult(result, true);
                                  } catch {
                                    toast.show({
                                      title: "保存の準備ができませんでした",
                                      description: "この端末の保存領域を確認してください。",
                                    });
                                    return;
                                  }
                                  navigate(
                                    `/login?${new URLSearchParams({ next: "save", back: `/rooms/${result.code}` })}`,
                                  );
                                }}
                              >
                                ログインして保存
                              </Button>
                            )
                          }
                        >
                          {saved
                            ? `${accountName}（${account?.provider}）の戦績に残っています`
                            : "ゲストのままだと、画面を閉じると消えてしまいます"}
                        </Notice>
                      </ResultFollowupReveal>
                    )}
                    <ResultFollowupReveal animate={!initiallyCompleted} sequence="actions">
                      <ActionGroup layout="responsive" align="center">
                        <Button
                          shape="pill"
                          size="lg"
                          prominence="raised"
                          disabled={!canRematch}
                          onClick={onRematch}
                        >
                          同じメンバーで再戦
                        </Button>
                        <Button
                          appearance="inverse"
                          size="lg"
                          shape="pill"
                          onClick={() => void share()}
                          leadingIcon={
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              aria-hidden="true"
                            >
                              <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
                            </svg>
                          }
                        >
                          結果をシェア
                        </Button>
                        <Button
                          appearance="secondary"
                          size="lg"
                          shape="pill"
                          onClick={() => navigate("/")}
                        >
                          トップへ戻る
                        </Button>
                      </ActionGroup>
                    </ResultFollowupReveal>
                  </Stack>
                </Container>
                {!initiallyCompleted && !reduced && ranked.some((player) => player.entry) && (
                  <ResultConfetti delayed={me.rank !== 1 || !me.entry} />
                )}
              </Stack>
            </LayerItem>
          </Layer>
        ) : (
          <Stack>
            <ComparisonStage
              first={
                <Stack space="compact">
                  <Text variant="label.supporting" align="center">
                    TOPIC お題
                  </Text>
                  <Media
                    src={level.image}
                    alt="お題の画像"
                    aspect="portrait"
                    decoration={
                      <EvaluationOverlay
                        mode={presentedMoment?.overlay ?? null}
                        modelElapsed={presentedMoment?.modelElapsed ?? 0}
                        scanning={Boolean(
                          presented &&
                          presented.player.entry &&
                          !presentedMoment?.scoreVisible &&
                          !moment.entering,
                        )}
                        scanElapsed={presentedMoment?.inference ?? 0}
                        image={level.image}
                        imageAspect="portrait"
                        faceLabel="face · topic"
                      />
                    }
                  />
                </Stack>
              }
              second={
                <Stack space="compact">
                  <Text variant="label.supporting" align="center">
                    SUBMITTED {presented?.player.name}
                  </Text>
                  <SubmittedReveal
                    key={presented?.player.id ?? "preparing"}
                    elapsed={presentedMoment?.inference ?? 0}
                  >
                    {presented?.player.entry ? (
                      <Media
                        src={artImage(presented.player.entry.image.features)}
                        alt={`${presented.player.name}さんの提出画像`}
                        aspect="portrait"
                        decoration={
                          <EvaluationOverlay
                            mode={presentedMoment?.overlay ?? null}
                            modelElapsed={presentedMoment?.modelElapsed ?? 0}
                            scanning={!moment.entering && !presentedMoment?.scoreVisible}
                            scanElapsed={presentedMoment?.inference ?? 0}
                            image={artImage(presented.player.entry.image.features)}
                            imageAspect="square"
                            faceLabel="face · submit"
                          />
                        }
                      />
                    ) : (
                      <MediaPlaceholder label={presented ? "未提出" : "提出画像"}>
                        <Text tone="muted">{presented ? "未提出" : ""}</Text>
                      </MediaPlaceholder>
                    )}
                  </SubmittedReveal>
                </Stack>
              }
            >
              {presented && (
                <JudgingPanel
                  key={presented.player.id}
                  player={presented.player}
                  index={timeline.indexOf(presented)}
                  count={order.length}
                  elapsed={presentedElapsed}
                  seed={`${result.id}-${presented.player.id}`}
                  level={result.rules.level}
                  rank={
                    1 +
                    order
                      .slice(0, timeline.indexOf(presented) + 1)
                      .filter(
                        (player) =>
                          (player.score?.total ?? -1) > (presented.player.score?.total ?? -1),
                      ).length
                  }
                />
              )}
            </ComparisonStage>
            <Container size="wide">
              <AvatarGroup
                label="採点の順番"
                presentation="expanded"
                members={order.map((player, i) => {
                  const rank =
                    1 +
                    order
                      .slice(0, currentIndex)
                      .filter((other) => (other.score?.total ?? -1) > (player.score?.total ?? -1))
                      .length;
                  return {
                    id: player.id,
                    name: player.isMe ? `${player.name}（あなた）` : player.name,
                    state:
                      i < currentIndex ? "complete" : i === currentIndex ? "active" : "pending",
                    value: i < currentIndex ? (player.score?.total.toFixed(1) ?? "—") : undefined,
                    marker:
                      i < currentIndex
                        ? {
                            value: player.entry ? String(rank) : "—",
                            label: player.entry ? `現在 ${rank}位` : "未提出",
                          }
                        : undefined,
                    detail:
                      i < currentIndex
                        ? player.score
                          ? "採点済み"
                          : "未提出"
                        : i === currentIndex
                          ? "採点中"
                          : "待機中",
                    avatar: (
                      <Avatar
                        size="compact"
                        name={player.name}
                        fallback={Array.from(player.name)[0]}
                        palette={playerPalettes[player.seat % playerPalettes.length]}
                      />
                    ),
                  };
                })}
              />
            </Container>
          </Stack>
        )}
      </AppFrame>
      {!completed && moment.entering && !transitioning && (
        <EntryCurtain
          key={current.player.id}
          name={current.player.name}
          last={currentIndex === order.length - 1}
          index={currentIndex + 1}
          elapsed={local}
        />
      )}
    </Page>
  );
}
