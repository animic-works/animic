import { useEffect, useState } from "react";

import { playerColor } from "../../components/avatar";
import { Button } from "../../components/button";
import { Dialog, DialogClose } from "../../components/dialog";
import { PanelHead } from "../../components/panel-head";
import { Switch } from "../../components/switch";
import { toast } from "../../components/toast";
import { PromptComposer } from "../image-generation/prompt-composer";
import {
  ArtFrame,
  ArtImage,
  BattleLayout,
  BattlePanel,
  CompareItem,
  CompareNote,
  CompareStage,
  ComposePhase,
  ConfirmOption,
  GenMini,
  HistoryFailed,
  HistoryPending,
  HistoryRail,
  HistoryShot,
  HudBar,
  HudChip,
  HudEdge,
  HudLevelChip,
  HudRoster,
  HudTimer,
  HudTrack,
  KickoffBand,
  LevelBadge,
  OverlayCard,
  OverlayWaitRow,
  RosterMember,
  ScreenOverlay,
  StageEmpty,
  StageGenerating,
  StageHint,
  StageImage,
  SubmitBox,
  TopicItem,
} from "./battle-parts";
import type { HudTone, RosterState, TopicReveal } from "./battle-parts";
import { submitBattleImage } from "./battle.functions";
import { getDifficulty } from "./battle-labels";
import { useModifierKey, useQuickSubmit, useReducedMotion } from "./battle-preferences";
import { hasNoImageToSubmit } from "./battle-screen";
import type { BattleStage } from "./battle-screen";
import type { BattleSnapshot } from "./battle-state";
import { useRemainingMs } from "./use-remaining-ms";

type MyGeneration = BattleSnapshot["myGenerations"][number];
type SucceededGeneration = Extract<MyGeneration, { status: "succeeded" }>;

/** 対戦の開始からこの時間内に画面を開いたときだけ、お題を伏せてから裏返す（再接続・再読み込みでは出さない） */
const REVEAL_WINDOW_MS = 10_000;
/** 画面遷移の帯が抜けるのを待ってから、開始の合図を出す */
const REVEAL_DELAY_MS = 1200;
/** 合図の帯が出てから、お題を裏返すまで */
const FLIP_AT_MS = 1100;
/** 合図の帯を出しておく時間 */
const KICKOFF_MS = 1600;

const STATE_TEXT: Record<RosterState, string> = {
  idle: "考え中",
  working: "生成中",
  done: "提出済み",
};

/** 開始から間もない対戦は、お題を伏せた札から始める */
function initialReveal(battle: BattleSnapshot): TopicReveal {
  return battle.serverTime - battle.startedAt < REVEAL_WINDOW_MS ? "veiled" : "none";
}

/** 残りミリ秒を m:ss にする。 */
function formatClock(ms: number): string {
  const seconds = Math.ceil(ms / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

/** 左にプロンプト入力、右にお題とあなたの画像の比較・履歴・提出を置く対戦画面。 */
export function BattleView({
  code,
  battle,
  stage,
  participantId,
  names,
}: {
  code: string;
  battle: BattleSnapshot;
  stage: BattleStage;
  participantId: string;
  names: Map<string, string>;
}) {
  // 履歴で選んだ1枚と、選んだときの成功数。成功数が増えたら新しい画像を自動で出す
  const [pick, setPick] = useState<{ id: string; after: number } | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [reveal, setReveal] = useState<TopicReveal>(() => initialReveal(battle));
  const [kickoff, setKickoff] = useState(false);
  const [quick, setQuick] = useQuickSubmit();
  const modifierKey = useModifierKey();

  const difficulty = getDifficulty(battle.settings.difficulty);

  // 生成は受付順（古い順）。番号は受付順の1始まり、表示は新しい順。
  const ordered = battle.myGenerations.toSorted((a, b) => a.acceptedAt - b.acceptedAt);
  const numberOf = (id: string) => ordered.findIndex((generation) => generation.id === id) + 1;
  const succeeded = ordered.filter(
    (generation): generation is SucceededGeneration => generation.status === "succeeded",
  );
  const pendings = ordered.filter((generation) => generation.status === "pending");
  const successCount = succeeded.length;
  const newest = succeeded.at(-1) ?? null;
  const autoPick = !pick || successCount > pick.after;
  const selected = autoPick
    ? newest
    : (succeeded.find((generation) => generation.id === pick.id) ?? newest);
  const confirmed = succeeded.find((generation) => generation.id === confirmId);

  // 新しくできた1枚は、3色の帯が駆け抜けて現れる
  const [seenCount, setSeenCount] = useState(successCount);
  const [freshId, setFreshId] = useState<string | null>(null);
  if (seenCount !== successCount) {
    setSeenCount(successCount);
    setFreshId(successCount > seenCount ? (newest?.id ?? null) : null);
  }

  const submitted = stage === "waiting" || stage === "scoring";
  const generationOpen = stage === "generating";
  // 時間切れで提出できる画像がなければ、生成や提出を促さずにそのことを伝える
  const noImage = hasNoImageToSubmit(stage, battle.myGenerations);
  const mySubmission = battle.mySubmission;
  const submittedImage =
    mySubmission?.status === "submitted"
      ? (succeeded.find((generation) => generation.id === mySubmission.generationId) ?? null)
      : null;

  // 完成待ち（finishing）は期限が決まっていないため残り時間を出さない。
  const deadline =
    stage === "generating"
      ? battle.generationEndsAt
      : stage === "selecting"
        ? battle.selectionEndsAt
        : null;
  const totalMs =
    (stage === "generating" ? battle.settings.durationSeconds : battle.settings.selectionSeconds) *
    1000;
  const remainingMs = useRemainingMs(battle.serverTime, deadline);
  // 生成中の残り10秒は強調する。画像選択の間は黄色にする。
  const hurry = stage === "generating" && remainingMs !== null && remainingMs <= 10_000;
  const tone: HudTone = stage === "selecting" ? "select" : hurry ? "hurry" : "normal";
  // 期限がない間（完成待ち・待機・採点中）は帯を空にする。
  const progress = remainingMs !== null ? remainingMs / totalMs : 0;

  const opponentId = battle.participantIds.find((id) => id !== participantId);
  const opponentName = (opponentId && names.get(opponentId)) || "相手";
  const myState: RosterState =
    mySubmission?.status === "submitted" ? "done" : pendings.length > 0 ? "working" : "idle";

  // 対戦の開始直後に開いたときだけ、伏せたお題を合図のあとに裏返す（再接続・再読み込みでは出さない）。
  // 配信された時刻から決めるため、サーバーの描画と水和で同じ状態になる。動きを減らす設定では最初から表にする
  const reducedMotion = useReducedMotion();
  const [revealBattleId, setRevealBattleId] = useState(battle.id);
  if (revealBattleId !== battle.id) {
    setRevealBattleId(battle.id);
    setReveal(initialReveal(battle));
    setKickoff(false);
  }
  const shownReveal: TopicReveal = reducedMotion ? "none" : reveal;
  const veiled = shownReveal === "veiled";
  useEffect(() => {
    if (!veiled) return undefined;
    const timers = [
      setTimeout(() => setKickoff(true), REVEAL_DELAY_MS),
      setTimeout(() => setReveal("flip"), REVEAL_DELAY_MS + FLIP_AT_MS),
    ];
    return () => {
      for (const timer of timers) clearTimeout(timer);
    };
  }, [veiled]);
  useEffect(() => {
    if (!kickoff) return undefined;
    const timer = setTimeout(() => setKickoff(false), KICKOFF_MS);
    return () => clearTimeout(timer);
  }, [kickoff]);

  async function submit(generationId: string) {
    if (submitted || submitting) return;
    setSubmitting(true);
    try {
      await submitBattleImage({ data: { code, battleId: battle.id, generationId } });
    } catch {
      toast("提出できませんでした。もう一度お試しください。");
    } finally {
      setConfirmId(null);
      setSubmitting(false);
    }
  }

  const hint =
    mySubmission?.status === "submitted" && submittedImage
      ? `#${numberOf(submittedImage.id)} を提出しました`
      : selected && !submitted
        ? `#${numberOf(selected.id)} を提出候補にしています`
        : noImage
          ? "時間切れのため提出できません"
          : "画像を1枚選んでください";

  const newestPending = pendings.at(-1);
  const mineView = selected ? (
    <>
      <StageImage
        key={selected.id}
        src={selected.imageUrl}
        alt={`${numberOf(selected.id)}回目の画像`}
        fresh={freshId === selected.id}
      />
      {newestPending && !submitted ? (
        <GenMini>
          #{numberOf(newestPending.id)} 生成中
          {pendings.length > 1 ? ` ほか${pendings.length - 1}枚` : ""}
        </GenMini>
      ) : null}
    </>
  ) : newestPending ? (
    <StageGenerating number={numberOf(newestPending.id)} />
  ) : noImage ? (
    <StageEmpty title="提出できる画像がありません" sub="時間内に完成した画像はありませんでした" />
  ) : (
    <StageEmpty title="まだ画像がありません" sub="プロンプトを書いて「生成する」を押そう" />
  );

  return (
    <>
      {hurry && !submitted ? <HudEdge /> : null}
      <HudBar
        logoSrc="/animic-logo.svg"
        left={
          <>
            <HudChip>
              ルーム <code>{code}</code>
            </HudChip>
            <HudLevelChip>
              <HudChip level>
                {difficulty.label}・{battle.settings.durationSeconds}秒
              </HudChip>
            </HudLevelChip>
          </>
        }
        timer={
          remainingMs !== null ? (
            <HudTimer
              label={stage === "generating" ? "TIME LEFT" : "SELECT"}
              value={formatClock(remainingMs)}
              tone={tone}
            />
          ) : null
        }
        right={
          <HudRoster>
            {battle.participantIds.map((id, index) =>
              id === participantId ? (
                <RosterMember
                  key={id}
                  name={names.get(id) ?? "あなた"}
                  player={playerColor(index)}
                  me
                  state={myState}
                  stateText={STATE_TEXT[myState]}
                  count={successCount}
                />
              ) : (
                <RosterMember
                  key={id}
                  name={names.get(id) || "相手"}
                  player={playerColor(index)}
                  me={false}
                />
              ),
            )}
          </HudRoster>
        }
      />
      <HudTrack progress={progress} tone={tone} />

      <BattleLayout>
        <PromptComposer
          // 対戦が変わったら入力を初期状態に戻す
          key={battle.id}
          maxCharacters={battle.settings.difficulty === "hard" ? 2 : 1}
          successCount={successCount}
          pending={pendings.length > 0}
          locked={!generationOpen || submitted}
          cover={
            noImage ? (
              <ComposePhase empty />
            ) : stage === "selecting" ? (
              <ComposePhase seconds={Math.max(0, Math.ceil((remainingMs ?? 0) / 1000))} />
            ) : stage === "finishing" ? (
              <ComposePhase />
            ) : null
          }
          // 生成の処理（Issue #12の残り）をつなぐまでは渡さず、「生成する」を押せない理由を出す。
          // つなぐときは次の関数を渡すだけで動く:
          // async (prompt) => { await generateImage({ data: { code, battleId: battle.id, generationId: crypto.randomUUID(), prompt } }); }
          onGenerate={undefined}
          modifierKey={modifierKey}
        />

        <BattlePanel area="stage" labelledBy="stage-title">
          <PanelHead eyebrow="02 — Compare" title="お題とあなたの画像" titleId="stage-title">
            <StageHint ready={Boolean(selected) && !submitted}>{hint}</StageHint>
          </PanelHead>
          <CompareStage>
            <TopicItem
              src={battle.topic.imageUrl}
              alt="お題のイラスト"
              label={
                <>
                  お題
                  <LevelBadge>{battle.settings.difficulty.toUpperCase()}</LevelBadge>
                  <CompareNote>{difficulty.description}</CompareNote>
                </>
              }
              reveal={shownReveal}
              onZoom={() => setZoomOpen(true)}
              onRevealEnd={() => setReveal("none")}
            />
            <CompareItem
              label={
                <>
                  あなたの画像
                  {selected ? <CompareNote>#{numberOf(selected.id)}</CompareNote> : null}
                </>
              }
            >
              {mineView}
            </CompareItem>
          </CompareStage>
          <HistoryRail
            empty={ordered.length === 0}
            submit={
              noImage ? null : (
                <SubmitBox
                  quick={quick}
                  onQuickChange={setQuick}
                  disabled={!selected || submitted}
                  loading={submitting}
                  onSubmit={() => {
                    if (!selected) return;
                    if (quick) void submit(selected.id);
                    else setConfirmId(selected.id);
                  }}
                />
              )
            }
          >
            {ordered.toReversed().map((generation) => {
              const number = numberOf(generation.id);
              if (generation.status === "pending")
                return <HistoryPending key={generation.id} number={number} />;
              if (generation.status === "failed")
                return <HistoryFailed key={generation.id} number={number} />;
              return (
                <HistoryShot
                  key={generation.id}
                  number={number}
                  src={generation.imageUrl}
                  selected={selected?.id === generation.id}
                  disabled={submitted}
                  onSelect={() => setPick({ id: generation.id, after: successCount })}
                />
              );
            })}
          </HistoryRail>
        </BattlePanel>
      </BattleLayout>

      <Dialog
        open={Boolean(confirmed) && !submitted}
        onOpenChange={(open) => {
          if (!open) setConfirmId(null);
        }}
        title="提出してもよろしいですか？"
        description="提出したあとは変更できません。"
        descriptionPlacement="bottom"
        footer={
          <>
            <DialogClose>
              <Button variant="secondary" size="lg">
                選び直す
              </Button>
            </DialogClose>
            <Button
              size="lg"
              loading={submitting}
              loadingText="提出しています…"
              disabled={!confirmed || submitted}
              onClick={() => {
                if (confirmed) void submit(confirmed.id);
              }}
            >
              提出する
            </Button>
          </>
        }
      >
        {confirmed ? (
          <ArtFrame variant="confirm">
            <ArtImage src={confirmed.imageUrl} alt="提出する画像" />
          </ArtFrame>
        ) : null}
        <ConfirmOption>
          <Switch
            label="次からは確認せずにすぐ提出する"
            tone="accent"
            checked={quick}
            onCheckedChange={setQuick}
          />
        </ConfirmOption>
      </Dialog>

      <Dialog open={zoomOpen} onOpenChange={setZoomOpen} title="お題" size="sm">
        <ArtFrame variant="zoom">
          <ArtImage src={battle.topic.imageUrl} alt="お題のイラスト（全体）" />
        </ArtFrame>
        <DialogClose>
          <Button variant="secondary" size="lg" fullWidth>
            閉じる
          </Button>
        </DialogClose>
      </Dialog>

      {kickoff && !reducedMotion ? <KickoffBand /> : null}

      {/* 採点中も提出後と同じ表示のまま待つ（採点の様子は画面に出さない） */}
      {submitted ? (
        mySubmission?.status === "not-submitted" ? (
          <ScreenOverlay title="時間内に提出できませんでした" sub="結果を待っています" />
        ) : (
          <ScreenOverlay
            eyebrow={submittedImage ? `Submitted #${numberOf(submittedImage.id)}` : "Submitted"}
            title="提出しました！"
            sub="あとは結果を待つだけ"
            footer={
              opponentId ? (
                <OverlayWaitRow
                  members={[
                    {
                      id: opponentId,
                      name: opponentName,
                      player: playerColor(battle.participantIds.indexOf(opponentId)),
                      done: battle.submissionsClosed,
                    },
                  ]}
                >
                  {battle.submissionsClosed
                    ? `${opponentName} さんも提出しました！`
                    : `${opponentName} さんの提出を待っています`}
                </OverlayWaitRow>
              ) : null
            }
          >
            {submittedImage ? <OverlayCard src={submittedImage.imageUrl} stamp="提出済み" /> : null}
          </ScreenOverlay>
        )
      ) : null}
    </>
  );
}
