import { useState } from "react";

import { Button } from "../../components/button";
import { Dialog, DialogClose } from "../../components/dialog";
import { Stack } from "../../components/layout";
import { Surface } from "../../components/surface";
import { Text } from "../../components/text";
import { Entrance } from "../../components/transition";
import {
  ArtFrame,
  ArtImage,
  BattleColumn,
  BattleLayout,
  HudBar,
  HudChip,
  HudLevelChip,
  HudPhase,
  HudPhaseStrong,
  HudTimer,
  HudTrack,
  PanelHead,
  ScreenOverlay,
  ShotButton,
  ShotEmpty,
  ShotFailed,
  ShotGrid,
  ShotImage,
  ShotPending,
  SubmitRow,
} from "./battle-parts";
import { submitBattleImage } from "./battle.functions";
import { getDifficulty } from "./battle-labels";
import type { BattleStage } from "./battle-screen";
import type { BattleSnapshot } from "./battle-state";
import { useRemainingMs } from "./use-remaining-ms";

type MyGeneration = BattleSnapshot["myGenerations"][number];
type SucceededGeneration = Extract<MyGeneration, { status: "succeeded" }>;

/** 残りミリ秒を m:ss にする。 */
function formatClock(ms: number): string {
  const seconds = Math.ceil(ms / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

/** お題・残り時間・生成した画像の選択と提出を行う対戦画面。 */
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
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const difficulty = getDifficulty(battle.settings.difficulty);
  const opponentId = battle.participantIds.find((id) => id !== participantId);
  const opponentName = (opponentId && names.get(opponentId)) || "相手";

  // 生成は受付順（古い順）。番号は受付順の1始まり、表示は新しい順。
  const ordered = battle.myGenerations.toSorted((a, b) => a.acceptedAt - b.acceptedAt);
  const numberOf = new Map(ordered.map((generation, index) => [generation.id, index + 1]));
  const succeeded = ordered.filter(
    (generation): generation is SucceededGeneration => generation.status === "succeeded",
  );
  // 既定は最後に成功した1枚。クリックで選び直せる。
  const selected = succeeded.find((item) => item.id === pickedId) ?? succeeded.at(-1) ?? null;

  const submitted = stage === "waiting" || stage === "scoring";

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
  // 画像選択の間は常に、生成中は残り10秒以下で強調する。
  const hurry = stage === "selecting" || (remainingMs !== null && remainingMs <= 10_000);
  // 期限がない間（完成待ち・待機・採点中）は帯を空にする。
  const progress = remainingMs !== null ? remainingMs / totalMs : 0;

  async function submit() {
    if (!selected || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await submitBattleImage({ data: { code, battleId: battle.id, generationId: selected.id } });
    } catch {
      setError("提出できませんでした。もう一度お試しください。");
    } finally {
      setConfirmOpen(false);
      setSubmitting(false);
    }
  }

  return (
    <>
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
              hurry={hurry}
            />
          ) : null
        }
      />
      <HudTrack progress={progress} />

      {stage === "selecting" ? (
        <HudPhase>
          生成終了！<span>生成中の画像も完成すれば選べます。</span>
          <span>
            残り{" "}
            <HudPhaseStrong>{Math.max(0, Math.ceil((remainingMs ?? 0) / 1000))}</HudPhaseStrong>{" "}
            秒で1枚選んで提出
          </span>
        </HudPhase>
      ) : stage === "finishing" ? (
        <HudPhase>
          <HudPhaseStrong>生成終了！</HudPhaseStrong>
          <span>生成中の画像の完成を待っています</span>
        </HudPhase>
      ) : null}

      <BattleLayout>
        <BattleColumn>
          <Entrance as="section" order={0} aria-labelledby="topic-title">
            <Surface variant="sticker" padding="fluid">
              <Stack gap="4">
                <PanelHead title="お題" titleId="topic-title" note={difficulty.description} />
                <ArtFrame variant="topic" tag="THEME">
                  <ArtImage src={battle.topic.imageUrl} alt="お題のイラスト" />
                </ArtFrame>
                <Text variant="note" tone="muted">
                  このイラストにいちばん近い1枚を作ろう。
                </Text>
              </Stack>
            </Surface>
          </Entrance>
        </BattleColumn>

        <BattleColumn>
          <Entrance as="section" order={1} aria-labelledby="shots-title">
            <Surface variant="sticker" padding="fluid">
              <Stack gap="4">
                <PanelHead title="生成した画像" titleId="shots-title" note="1枚選んで提出" />
                <ShotGrid>
                  {ordered.length === 0 ? (
                    <ShotEmpty>まだ画像がありません。</ShotEmpty>
                  ) : (
                    ordered.toReversed().map((item) => {
                      const number = numberOf.get(item.id) ?? 0;
                      if (item.status === "pending") return <ShotPending key={item.id} />;
                      if (item.status === "failed") return <ShotFailed key={item.id} />;
                      return (
                        <ShotButton
                          key={item.id}
                          number={number}
                          selected={selected?.id === item.id}
                          disabled={submitted}
                          onSelect={() => setPickedId(item.id)}
                        >
                          <ShotImage src={item.imageUrl} alt={`${number}回目の画像`} />
                        </ShotButton>
                      );
                    })
                  )}
                </ShotGrid>
                {error ? (
                  <Text as="p" variant="note" tone="danger">
                    {error}
                  </Text>
                ) : null}
                <SubmitRow note="提出後は変更できません。">
                  <Button
                    size="lg"
                    disabled={!selected || submitted}
                    onClick={() => setConfirmOpen(true)}
                  >
                    この1枚で提出
                  </Button>
                </SubmitRow>
              </Stack>
            </Surface>
          </Entrance>
        </BattleColumn>
      </BattleLayout>

      <Dialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="この1枚で提出しますか？"
        description="提出後は画像を変更できません。"
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
              onClick={() => void submit()}
            >
              提出する
            </Button>
          </>
        }
      >
        {selected ? (
          <ArtFrame variant="confirm">
            <ArtImage src={selected.imageUrl} alt="提出する画像" />
          </ArtFrame>
        ) : null}
      </Dialog>

      {stage === "scoring" ? (
        <ScreenOverlay title="採点中…" sub="AIが再現度を評価しています" />
      ) : stage === "waiting" ? (
        battle.mySubmission?.status === "not-submitted" ? (
          <ScreenOverlay title="時間内に提出できませんでした" sub="結果を待っています" />
        ) : (
          <ScreenOverlay title="提出しました！" sub={`${opponentName} さんの提出を待っています`} />
        )
      ) : null}
    </>
  );
}
