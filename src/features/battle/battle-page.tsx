import { useEffect, useState } from "react";
import { Badge } from "@animic/react/badge";
import { Heading } from "@animic/react/heading";
import { Page } from "@animic/react/page";
import { Stack } from "@animic/react/stack";
import { Text } from "@animic/react/text";
import { Workspace } from "@animic/react/workspace";
import type { AccountIcon } from "../account/account-icon";
import { PromptComposer } from "../image-generation/prompt-composer";
import type { PromptGroup } from "../image-generation/prompt-phrases";
import { GridBackdrop } from "../shared/visuals/grid-backdrop";
import { getBattleClock, getBattleDeadline, getWaitingClock, isScoringSlow } from "./battle-clock";
import { BattlePlayers, BattleProgress, BattleRoomLabel, BattleTimer } from "./battle-header";
import { getBattleImages, type BattleImagePick } from "./battle-images";
import { BattleImagesPanel } from "./battle-images-panel";
import { useModifierKey, useQuickSubmit } from "./battle-preferences";
import { characterCount } from "./battle-state";
import type { BattleSnapshot } from "./battle-state";
import { hasNoImageToSubmit } from "./battle-screen";
import type { BattleStage } from "./battle-screen";
import { SubmissionWaitDialog, SubmitConfirmDialog, TopicZoomDialog } from "./submission-dialogs";
import { useBattleEntrance } from "./use-battle-entrance";
import { useBattleGeneration } from "./use-battle-generation";
import { useBattleSubmission } from "./use-battle-submission";
import { useImageArrival } from "./use-image-arrival";
import { useRemainingMs } from "./use-remaining-ms";
import { HurryEdge } from "./visuals/battle-motion";
import { BattleKickoff } from "./visuals/battle-entrance";

/**
 * 生成時間が終わり、履歴から1枚を選ぶ段階でプロンプト欄の代わりに出す案内。
 * `empty`は提出できる画像がないときの表示。
 */
function SelectionNotice({
  stage,
  seconds,
  empty,
}: {
  stage: BattleStage;
  seconds: number;
  empty: boolean;
}) {
  return (
    <Stack align="center" justify="center" fill>
      <Text variant="eyebrow.strong">TIME UP</Text>
      <Heading level={2} size="title">
        {empty ? "時間切れ" : "生成終了！"}
      </Heading>
      {empty ? (
        <Text variant="label">提出できる画像がありません</Text>
      ) : (
        <>
          {stage === "finishing" ? (
            <Text variant="label">生成の完了を待っています</Text>
          ) : (
            <Badge tone="inverse" size="md">
              残り{" "}
              <Text variant="numeric.display" tone="highlight">
                {seconds}
              </Text>{" "}
              秒で1枚提出
            </Badge>
          )}
          <Text variant="body.sm" align="center">
            履歴から選んで「この1枚で提出」
            <br />
            生成中の画像も、完成すれば選べます
            <br />
            選ばなければ最後に完成した1枚を提出
          </Text>
        </>
      )}
    </Stack>
  );
}

export function BattlePage({
  code,
  battle,
  stage,
  names,
  icons,
  participantId,
  promptGroups,
  receivedAt,
  entering = false,
}: {
  code: string;
  battle: BattleSnapshot;
  stage: BattleStage;
  names: Map<string, string>;
  icons: Map<string, AccountIcon | null>;
  participantId: string;
  promptGroups: PromptGroup[];
  receivedAt: number | null;
  entering?: boolean;
}) {
  const [pick, setPick] = useState<BattleImagePick | null>(null);
  // 提出するまでは、タブを閉じる・再読み込みする前にブラウザの確認を出す。
  const leaving = stage === "generating" || stage === "finishing" || stage === "selecting";
  useEffect(() => {
    const confirmLeave = (event: BeforeUnloadEvent) => {
      if (leaving) event.preventDefault();
    };
    addEventListener("beforeunload", confirmLeave);
    return () => removeEventListener("beforeunload", confirmLeave);
  }, [leaving]);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [quick, setQuick] = useQuickSubmit();
  const modifierKey = useModifierKey();
  const entrance = useBattleEntrance(entering);
  const arrival = useImageArrival(battle.myGenerations);
  const mySubmission = battle.mySubmission;
  const images = getBattleImages(
    battle.myGenerations,
    pick,
    mySubmission?.status === "submitted" ? mySubmission.generationId : null,
  );
  const locked = Boolean(mySubmission) || battle.submissionsClosed;
  const waiting = stage === "waiting" || stage === "scoring";
  // 時間切れで提出できる画像がなければ、生成や提出を促さずにそのことを伝える
  const noImage = hasNoImageToSubmit(stage, battle.myGenerations);
  const remaining = useRemainingMs(battle.serverTime, getBattleDeadline(battle, stage), receivedAt);
  const clock = getBattleClock(battle, stage, remaining);
  // 提出した後も、ほかの人が使える残り時間（生成、終わっていれば画像選択の猶予）を待機の表示に出す。
  const generationLeft = useRemainingMs(
    battle.serverTime,
    stage === "waiting" ? battle.generationEndsAt : null,
    receivedAt,
  );
  const selectionLeft = useRemainingMs(
    battle.serverTime,
    stage === "waiting" ? battle.selectionEndsAt : null,
    receivedAt,
  );
  const waitingClock = getWaitingClock(battle, generationLeft, selectionLeft);
  // 採点の期限までの残り時間は出さず、時間がかかっていることだけを伝える。
  const scoringRemaining = useRemainingMs(
    battle.serverTime,
    stage === "scoring" ? battle.scoringEndsAt : null,
    receivedAt,
  );
  const generate = useBattleGeneration({ code, battleId: battle.id });
  const submission = useBattleSubmission({ code, battleId: battle.id, locked });
  const confirmed = images.succeeded.find((item) => item.id === submission.confirmId);
  const opponentId =
    battle.participantIds.length === 2
      ? battle.participantIds.find((id) => id !== participantId)
      : undefined;

  return (
    <Page decoration={<GridBackdrop />}>
      <Workspace
        headerStart={<BattleRoomLabel code={code} settings={battle.settings} />}
        headerCenter={remaining !== null && <BattleTimer stage={stage} clock={clock} />}
        headerEnd={
          <BattlePlayers
            participantIds={battle.participantIds}
            participantId={participantId}
            names={names}
            icons={icons}
            submitted={mySubmission?.status === "submitted"}
            generating={images.pendings.length > 0}
            successCount={images.succeeded.length}
          />
        }
        progress={<BattleProgress clock={clock} />}
        expanded={expanded}
        onExpandedChange={setExpanded}
        editorLabel="プロンプト欄"
        editorTone={stage === "finishing" || stage === "selecting" ? "caution" : "default"}
        editor={
          stage === "finishing" || stage === "selecting" ? (
            <SelectionNotice stage={stage} seconds={clock.seconds} empty={noImage} />
          ) : (
            <PromptComposer
              key={battle.id}
              battleId={battle.id}
              dictionary={promptGroups}
              maxCharacters={characterCount(battle.settings.difficulty)}
              successCount={images.succeeded.length}
              pending={images.pendings.length > 0}
              locked={stage !== "generating" || locked}
              onGenerate={generate}
              modifierKey={modifierKey}
              collapsed={!expanded}
              onExpand={() => setExpanded(true)}
            />
          )
        }
      >
        <BattleImagesPanel
          battle={battle}
          images={images}
          entrance={entrance}
          arrival={arrival}
          locked={locked}
          noImage={noImage}
          pending={submission.pending}
          error={submission.error}
          quick={quick}
          onQuickChange={setQuick}
          onPick={(id) => setPick({ id, after: images.succeeded.length })}
          onZoom={() => setZoomOpen(true)}
          onSubmit={(id) => (quick ? void submission.submit(id) : submission.setConfirmId(id))}
        />
      </Workspace>
      {(entrance === "kickoff" || entrance === "revealing") && <BattleKickoff />}
      {clock.urgent && !waiting && <HurryEdge />}
      <TopicZoomDialog
        open={zoomOpen && !waiting}
        onOpenChange={setZoomOpen}
        imageUrl={battle.topic.imageUrl}
        compareUrl={images.selected?.imageUrl}
      />
      <SubmitConfirmDialog
        image={confirmed}
        open={Boolean(confirmed) && !locked}
        pending={submission.pending}
        error={submission.error}
        quick={quick}
        onQuickChange={setQuick}
        onCancel={() => submission.setConfirmId(null)}
        onSubmit={(id) => void submission.submit(id)}
      />
      <SubmissionWaitDialog
        open={waiting}
        battle={battle}
        scoring={stage === "scoring"}
        slow={isScoringSlow(scoringRemaining)}
        timer={
          waitingClock && <BattleTimer stage={waitingClock.stage} clock={waitingClock.clock} />
        }
        submitted={images.submitted}
        submittedNumber={images.submitted ? images.numberOf(images.submitted.id) : 0}
        opponentName={opponentId === undefined ? null : (names.get(opponentId) ?? "相手")}
      />
    </Page>
  );
}
