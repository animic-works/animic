import { useEffect, useRef, useState } from "react";
import { ActionGroup } from "@animic/react/action-group";
import { Avatar } from "@animic/react/avatar";
import { AvatarGroup } from "@animic/react/avatar-group";
import { Badge } from "@animic/react/badge";
import { Button } from "@animic/react/button";
import { Cluster } from "@animic/react/cluster";
import { CodeDisplay } from "@animic/react/code-display";
import { Comparison } from "@animic/react/comparison";
import { Dialog } from "@animic/react/dialog";
import { Heading } from "@animic/react/heading";
import { Media, MediaPlaceholder } from "@animic/react/media";
import { Page } from "@animic/react/page";
import { Progress } from "@animic/react/progress";
import { Readout } from "@animic/react/readout";
import { Spinner } from "@animic/react/spinner";
import { Stack } from "@animic/react/stack";
import { Switch } from "@animic/react/switch";
import { Text } from "@animic/react/text";
import { ThumbnailList } from "@animic/react/thumbnail-list";
import { Workspace } from "@animic/react/workspace";
import { PromptComposer } from "../image-generation/prompt-composer";
import { AppBrand } from "../shared/app-brand";
import { GridBackdrop } from "../shared/visuals/grid-backdrop";
import { levels, playerPalettes } from "../room/room-presentation";
import { submitBattleImage } from "./battle.functions";
import { useModifierKey, useQuickSubmit } from "./battle-preferences";
import type { BattleSnapshot } from "./battle-state";
import type { BattleStage } from "./battle-screen";
import { useRemainingMs } from "./use-remaining-ms";
import { useBattleEntrance } from "./use-battle-entrance";
import { HurryEdge } from "./visuals/battle-motion";
import { BattleKickoff, TopicReveal } from "./visuals/battle-entrance";
import { ImageArrival } from "./visuals/image-arrival";
import { ApproximationMark, EmptyImageArtwork } from "./visuals/generation-artwork";
import {
  SubmissionBackdrop,
  SubmissionContent,
  SubmissionHeading,
  SubmittedArtwork,
} from "./visuals/submission-scene";

type Generation = BattleSnapshot["myGenerations"][number];

function useImageArrival(images: readonly Generation[]) {
  const previous = useRef(
    new Set(images.filter((image) => image.status === "succeeded").map((image) => image.id)),
  );
  const [arrival, setArrival] = useState<string | null>(null);
  useEffect(() => {
    const ready = images.filter((image) => image.status === "succeeded");
    const added = ready.findLast((image) => !previous.current.has(image.id));
    previous.current = new Set(ready.map((image) => image.id));
    if (added) setArrival(added.id);
  }, [images]);
  useEffect(() => {
    if (arrival === null) return undefined;
    const timer = setTimeout(() => setArrival(null), 1000);
    return () => clearTimeout(timer);
  }, [arrival]);
  return arrival;
}

export function BattlePage({
  code,
  battle,
  stage,
  names,
  participantId,
  receivedAt,
  entering = false,
}: {
  code: string;
  battle: BattleSnapshot;
  stage: BattleStage;
  names: Map<string, string>;
  participantId: string;
  receivedAt: number | null;
  entering?: boolean;
}) {
  const [pick, setPick] = useState<{ id: string; after: number } | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const [zoomOpen, setZoomOpen] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [quick, setQuick] = useQuickSubmit();
  const modifierKey = useModifierKey();
  const entrance = useBattleEntrance(entering);
  const arrival = useImageArrival(battle.myGenerations);
  const ordered = battle.myGenerations.toSorted((a, b) => a.acceptedAt - b.acceptedAt);
  const succeeded = ordered.filter((item) => item.status === "succeeded");
  const pendings = ordered.filter((item) => item.status === "pending");
  const successCount = succeeded.length;
  const newest = succeeded.at(-1) ?? null;
  const selected =
    !pick || successCount > pick.after
      ? newest
      : (succeeded.find((item) => item.id === pick.id) ?? newest);
  const confirmed = succeeded.find((item) => item.id === confirmId);
  const numberOf = (id: string) => ordered.findIndex((item) => item.id === id) + 1;
  const locked = Boolean(battle.mySubmission) || battle.submissionsClosed;
  const waiting = stage === "waiting" || stage === "scoring";
  const deadline =
    stage === "generating"
      ? battle.generationEndsAt
      : stage === "selecting"
        ? battle.selectionEndsAt
        : null;
  const remaining = useRemainingMs(battle.serverTime, deadline, receivedAt);
  const total =
    (stage === "generating" ? battle.settings.durationSeconds : battle.settings.selectionSeconds) *
    1000;
  const seconds = Math.ceil((remaining ?? 0) / 1000);
  const urgent = stage === "generating" && remaining !== null && remaining <= 10000;
  const clockTone = stage === "selecting" ? "highlight" : urgent ? "primary" : "neutral";
  const level = levels[battle.settings.difficulty];
  const mySubmission = battle.mySubmission;
  const submittedImage =
    mySubmission?.status === "submitted"
      ? succeeded.find((item) => item.id === mySubmission.generationId)
      : undefined;
  const opponentId = battle.participantIds.find((id) => id !== participantId);
  const opponent = names.get(opponentId ?? "") ?? "相手";
  const newestPending = pendings.at(-1);

  async function submit(generationId: string) {
    if (pending || locked) return;
    setPending(true);
    setError(undefined);
    try {
      await submitBattleImage({ data: { code, battleId: battle.id, generationId } });
      setConfirmId(null);
    } catch {
      setError("提出できませんでした。もう一度お試しください。");
    } finally {
      setPending(false);
    }
  }

  const selectionNotice = (
    <Stack align="center" justify="center" fill>
      <Text variant="eyebrow.strong" tone="accent">
        TIME UP
      </Text>
      <Heading level={2} size="title">
        生成終了！
      </Heading>
      <Text variant="label">
        {stage === "finishing" ? (
          "生成の完了を待っています"
        ) : (
          <>
            残り <Text variant="numeric.display">{seconds}</Text> 秒で1枚提出
          </>
        )}
      </Text>
      <Text variant="body.sm" align="center" tone="supporting">
        履歴から選んで「この1枚で提出」
        <br />
        生成中の画像も、完成すれば選べます
      </Text>
    </Stack>
  );
  return (
    <Page decoration={<GridBackdrop />}>
      <Workspace
        headerStart={
          <>
            <AppBrand />
            <Badge>
              ルーム <CodeDisplay value={code} presentation="inline" size="sm" />
            </Badge>
          </>
        }
        headerDetail={
          <Badge>
            {level.label}・{battle.settings.durationSeconds}秒
          </Badge>
        }
        headerCenter={
          remaining !== null && (
            <Readout
              role="timer"
              label={stage === "generating" ? "TIME LEFT" : "SELECT"}
              value={`${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`}
              format="clock"
              tone={clockTone}
              emphasis={urgent ? "urgent" : "normal"}
            />
          )
        }
        headerEnd={
          <AvatarGroup
            label="プレイヤーの様子"
            members={battle.participantIds.map((id, index) => {
              const current = id === participantId;
              const name = names.get(id) ?? (current ? "あなた" : "相手");
              const status =
                mySubmission?.status === "submitted"
                  ? "complete"
                  : pendings.length
                    ? "busy"
                    : "idle";
              return {
                id,
                name: current ? `${name}（あなた）` : name,
                current,
                detail: current
                  ? `${status === "complete" ? "提出済み" : status === "busy" ? "生成中" : "考え中"}・生成 ${successCount}回`
                  : "",
                avatar: (
                  <Avatar
                    size="small"
                    name={name}
                    fallback={Array.from(name)[0]}
                    palette={playerPalettes[index % playerPalettes.length]}
                    status={current ? status : undefined}
                  />
                ),
              };
            })}
          />
        }
        progress={
          <Progress
            label="残り時間"
            value={remaining === null ? 0 : (remaining / total) * 100}
            tone={clockTone === "neutral" ? "gradient" : clockTone}
            emphasis={urgent ? "urgent" : "normal"}
            striped
            presentation="track"
          />
        }
        expanded={expanded}
        onExpandedChange={setExpanded}
        editorLabel="プロンプト欄"
        collapsedEditor={
          <Button appearance="soft" shape="pill" size="sm" onClick={() => setExpanded(true)}>
            プロンプト欄を開く
          </Button>
        }
        editor={
          stage === "finishing" || stage === "selecting" ? (
            selectionNotice
          ) : (
            <PromptComposer
              key={battle.id}
              maxCharacters={battle.settings.difficulty === "hard" ? 2 : 1}
              successCount={successCount}
              pending={pendings.length > 0}
              locked={stage !== "generating" || locked}
              modifierKey={modifierKey}
            />
          )
        }
      >
        <Comparison
          header={
            <Cluster justify="between">
              <Stack space="tight">
                <Text variant="eyebrow.strong" tone="accent">
                  02 — COMPARE
                </Text>
                <Heading level={2} size="panel">
                  お題とあなたの画像
                </Heading>
              </Stack>
              <Badge>
                {submittedImage
                  ? `#${numberOf(submittedImage.id)} を提出しました`
                  : selected
                    ? `#${numberOf(selected.id)} を提出候補にしています`
                    : "画像を1枚選んでください"}
              </Badge>
            </Cluster>
          }
          first={
            <TopicReveal phase={entrance}>
              <Media
                src={battle.topic.imageUrl}
                alt="お題のイラスト"
                aspect="portrait"
                onOpen={() => setZoomOpen(true)}
              />
            </TopicReveal>
          }
          firstCaption={
            <Text variant="label.supporting">
              お題 <Badge tone="inverse">{level.word}</Badge>
            </Text>
          }
          second={
            selected ? (
              <Media
                key={selected.id}
                src={selected.imageUrl}
                alt={`${numberOf(selected.id)}回目の画像`}
                aspect="portrait"
                entering={arrival === selected.id}
                decoration={arrival === selected.id ? <ImageArrival key={arrival} /> : undefined}
                label={
                  newestPending && !locked ? (
                    <Badge appearance="glass">
                      #{numberOf(newestPending.id)} 生成中
                      {pendings.length > 1 && ` ほか${pendings.length - 1}枚`}
                    </Badge>
                  ) : undefined
                }
              />
            ) : (
              <MediaPlaceholder
                label={pendings.length ? "生成中の画像" : "まだ画像がありません"}
                description={pendings.length ? undefined : "プロンプトを書いて「生成する」を押そう"}
              >
                {pendings.length ? (
                  <Spinner label="生成中" size="lg" tone="gradient" />
                ) : (
                  <>
                    <EmptyImageArtwork />
                    <Text variant="caption" align="center" tone="muted">
                      まだ画像がありません
                    </Text>
                  </>
                )}
              </MediaPlaceholder>
            )
          }
          secondCaption={
            <Text variant="label.supporting">
              あなたの画像{selected && ` #${numberOf(selected.id)}`}
            </Text>
          }
          decoration={<ApproximationMark />}
          description={
            <Text variant="caption" tone="supporting">
              {level.description}
            </Text>
          }
          historyHeading={
            <Text variant="label.supporting">
              履歴 <Text variant="eyebrow.strong">HISTORY</Text>
            </Text>
          }
          history={
            <ThumbnailList
              label="生成履歴"
              items={ordered.toReversed().map((item) => ({
                id: item.id,
                entering: arrival === item.id,
                label: `${numberOf(item.id)}回目${item.status === "pending" ? "・生成中" : item.status === "failed" ? "・失敗" : "の画像"}`,
                src: item.status === "succeeded" ? item.imageUrl : undefined,
                content:
                  item.status === "pending" ? (
                    <Spinner label="生成中" labelVisibility="hidden" tone="gradient" />
                  ) : (
                    "失敗"
                  ),
                disabled: item.status !== "succeeded",
              }))}
              value={selected?.id}
              onValueChange={(id) => setPick({ id, after: successCount })}
              disabled={locked || pending}
              empty="生成した画像がここに並びます"
              compactEmpty="履歴"
            />
          }
          preferences={
            <Switch checked={quick} onCheckedChange={setQuick} label="確認なしですぐ提出" />
          }
          actions={
            <Stack space="compact">
              {error && (
                <div role="alert">
                  <Text tone="danger">{error}</Text>
                </div>
              )}
              <Button
                shape="pill"
                size="sm"
                prominence="lifted"
                disabled={!selected || locked}
                loading={pending}
                onClick={() => {
                  if (!selected) return;
                  if (quick) void submit(selected.id);
                  else setConfirmId(selected.id);
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="m5 12 4 4L19 6" />
                </svg>
                {pending ? "提出しています…" : "この1枚で提出"}
              </Button>
            </Stack>
          }
        />
      </Workspace>
      {(entrance === "kickoff" || entrance === "revealing") && <BattleKickoff />}
      {urgent && !waiting && <HurryEdge />}
      <Dialog
        open={zoomOpen && !waiting}
        onOpenChange={setZoomOpen}
        title="お題"
        closeButton={false}
        size="compact"
      >
        <Stack>
          <Media
            src={battle.topic.imageUrl}
            alt="お題のイラスト（全体）"
            aspect="portrait"
            fit="contain"
          />
          <Button appearance="secondary" shape="pill" onClick={() => setZoomOpen(false)}>
            閉じる
          </Button>
        </Stack>
      </Dialog>
      <Dialog
        open={Boolean(confirmed) && !locked}
        onOpenChange={(open) => !open && !pending && setConfirmId(null)}
        title="提出してもよろしいですか？"
        size="compact"
        presentation="centered"
        closeButton={false}
      >
        <Stack>
          {confirmed && (
            <Media src={confirmed.imageUrl} alt="提出する画像" aspect="portrait" size="preview" />
          )}
          <Text variant="body.sm" align="center" tone="supporting">
            提出したあとは変更できません。
          </Text>
          <Switch
            checked={quick}
            onCheckedChange={setQuick}
            label="次からは確認せずにすぐ提出する"
          />
          {error && (
            <div role="alert">
              <Text tone="danger">{error}</Text>
            </div>
          )}
          <ActionGroup layout="confirm">
            <Button
              appearance="secondary"
              shape="pill"
              size="lg"
              loading={pending}
              onClick={() => setConfirmId(null)}
            >
              選び直す
            </Button>
            <Button
              shape="pill"
              size="lg"
              disabled={!confirmed}
              loading={pending}
              onClick={() => confirmed && void submit(confirmed.id)}
            >
              {pending ? "提出しています…" : "提出する"}
            </Button>
          </ActionGroup>
        </Stack>
      </Dialog>
      <Dialog
        open={waiting}
        onOpenChange={() => {}}
        title={
          mySubmission?.status === "not-submitted"
            ? "時間内に提出できませんでした"
            : "提出しました！"
        }
        titleVisibility="hidden"
        presentation="fullscreen"
        appearance="transparent"
        closeButton={false}
        dismissible={false}
      >
        <SubmissionBackdrop />
        <SubmissionContent>
          <Stack align="center" justify="center" fill>
            {submittedImage && (
              <>
                <Text variant="eyebrow.strong" tone="inverse">
                  SUBMITTED #{numberOf(submittedImage.id)}
                </Text>
                <SubmittedArtwork src={submittedImage.imageUrl} />
              </>
            )}
            <SubmissionHeading>
              <Text variant="display.feedback" tone="inverse" emphasis="accent-shadow">
                {mySubmission?.status === "not-submitted"
                  ? "時間内に提出できませんでした"
                  : "提出しました！"}
              </Text>
            </SubmissionHeading>
            <Text tone="inverse">
              {mySubmission?.status === "not-submitted"
                ? "結果を待っています"
                : "あとは結果を待つだけ"}
            </Text>
            {mySubmission?.status === "submitted" && opponentId && (
              <Text tone="inverse">
                {battle.submissionsClosed
                  ? `${opponent} さんも提出しました！`
                  : `${opponent} さんの提出を待っています`}
              </Text>
            )}
          </Stack>
        </SubmissionContent>
      </Dialog>
    </Page>
  );
}
