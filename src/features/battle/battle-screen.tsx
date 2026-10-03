import { playerColor } from "@animic/react/avatar";
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
  PromptChips,
  PromptFoot,
  PromptTextarea,
  ScreenOverlay,
  ShotButton,
  ShotEmpty,
  ShotFailed,
  ShotGrid,
  ShotImage,
  ShotPending,
  SubmitRow,
  VersusList,
  VersusRow,
} from "@animic/react/battle";
import { Button } from "@animic/react/button";
import { ART_FEATURES } from "@animic/react/character-art";
import { Dialog, DialogClose } from "@animic/react/dialog";
import { Icon } from "@animic/react/icon";
import { Stack } from "@animic/react/layout/stack";
import { SegmentedControl } from "@animic/react/lobby/segmented-control";
import { Surface } from "@animic/react/surface";
import { Text } from "@animic/react/text";
import { toast } from "@animic/react/toast";
import { Entrance } from "@animic/react/transition";
import { useRef, useState } from "react";

import { requestGeneration } from "../image-generation/generation.functions";
import type { RoomSnapshot } from "../room/room-state";
import { submitBattleImage } from "./battle.functions";
import { formatSeconds, useServerNow } from "./battle-clock";
import { DIFFICULTY_RULES, describeSettings } from "./battle-labels";
import type { BattleSnapshot } from "./battle-state";

const GROUPS = [
  ["髪の色", "hair"],
  ["髪型", "style"],
  ["目", "eyes"],
  ["服", "outfit"],
  ["表情", "face"],
  ["背景", "bg"],
] as const;
const PLACEHOLDER = {
  text: "例：ピンクの髪でツインテールの女の子、青い目、セーラー服、笑顔、白背景",
  tag: "例：1girl, pink hair, twintails, blue eyes, sailor uniform, smile, white background",
};
const MAX_PENDING = 3;

const errorMessage = (error: unknown) =>
  error instanceof Error && error.message ? error.message : "うまくいきませんでした。";

// 対戦中: お題・プロンプト入力・生成履歴・提出。残り時間はサーバー時刻を基準にする
export function BattleScreen({
  room,
  battle,
  meId,
  scoring,
}: {
  room: RoomSnapshot;
  battle: BattleSnapshot;
  meId: string | null;
  scoring: boolean;
}) {
  const now = useServerNow(battle.serverTime);
  const total = battle.settings.durationSeconds;
  const grace = battle.settings.selectionSeconds;
  const remain = (battle.generationEndsAt - now) / 1000;
  const mine = battle.mySubmission;
  const submitted = mine?.status === "submitted";
  const done =
    mine !== null ||
    battle.submissionsClosed ||
    (battle.selectionEndsAt !== null && now >= battle.selectionEndsAt);
  const phase: "play" | "select" | "done" = done ? "done" : remain > 0 ? "play" : "select";
  // 生成終了後の猶予。生成中の画像が残っている間は期限が決まらないため、猶予いっぱいで見せる
  const left =
    phase === "play"
      ? 0
      : battle.selectionEndsAt === null
        ? grace
        : (battle.selectionEndsAt - now) / 1000;

  const nameOf = (id: string) =>
    room.members.find((member) => member.id === id)?.name ?? "対戦相手";
  const colorOf = (id: string) => playerColor(room.members.findIndex((member) => member.id === id));
  const others = battle.participants.filter((item) => item.participantId !== meId);
  const opponent = others[0];
  const opponentName = opponent ? nameOf(opponent.participantId) : "対戦相手";

  const generations = battle.myGenerations.toSorted((a, b) => a.acceptedAt - b.acceptedAt);
  const success = generations.filter((item) => item.status === "succeeded").length;
  const pending = generations.filter((item) => item.status === "pending").length;
  const [inflight, setInflight] = useState<string[]>([]);
  const inflightCount = inflight.filter((id) => !generations.some((item) => item.id === id)).length;
  const canGenerate = phase === "play" && !submitted && !battle.generationClosed;

  const [mode, setMode] = useState<"text" | "tag">("text");
  const [prompt, setPrompt] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const selectedItem = generations.find((item) => item.id === selected);
  const selection = selectedItem?.status === "succeeded" ? selectedItem : undefined;

  function pick(word: string) {
    const sep = mode === "tag" ? ", " : "、";
    const current = prompt.trim();
    setPrompt(current ? `${current.replace(/[、,]\s*$/, "")}${sep}${word}` : word);
    textarea.current?.focus();
  }

  async function generate() {
    const text = prompt.trim();
    if (!text) {
      toast("プロンプトを入力してください");
      textarea.current?.focus();
      return;
    }
    const requestId = crypto.randomUUID();
    setInflight((list) => [...list, requestId]);
    try {
      await requestGeneration({
        data: { code: room.code, battleId: battle.id, requestId, prompt: text },
      });
    } catch (error) {
      toast(errorMessage(error));
    } finally {
      setInflight((list) => list.filter((id) => id !== requestId));
    }
  }

  async function submit() {
    if (!selection) return;
    setSubmitting(true);
    try {
      await submitBattleImage({
        data: { code: room.code, battleId: battle.id, generationId: selection.id },
      });
    } catch (error) {
      toast(errorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  const myState = submitted
    ? (["done", "提出済み"] as const)
    : pending + inflightCount > 0
      ? (["working", "生成中"] as const)
      : (["idle", "考え中"] as const);
  const chips = GROUPS.map(([label, key]) => ({
    label,
    words: ART_FEATURES[key].map((option) => (mode === "tag" ? option.tag : option.label)),
  }));

  return (
    <>
      <HudBar
        logoSrc="/animic-logo.svg"
        left={
          <>
            <HudChip>
              ルーム <code>{room.code}</code>
            </HudChip>
            <HudLevelChip>
              <HudChip level>{describeSettings(battle.settings)}</HudChip>
            </HudLevelChip>
          </>
        }
        timer={
          <HudTimer
            label={phase === "play" ? "TIME LEFT" : "SELECT"}
            value={formatSeconds(phase === "play" ? remain : left)}
            hurry={phase !== "play" || remain <= 10}
          />
        }
        right={
          <HudChip>
            {opponentName}：
            {opponent?.submitted ? "提出済み" : `生成 ${opponent?.generationCount ?? 0}回`}
          </HudChip>
        }
      />
      <HudTrack
        progress={phase === "play" ? remain / total : phase === "select" ? left / grace : 0}
      />
      {phase === "select" && !submitted ? (
        <HudPhase>
          生成終了！<span>生成中の画像も完成すれば選べます。</span>
          <span>
            残り <HudPhaseStrong>{Math.max(0, Math.ceil(left))}</HudPhaseStrong> 秒で1枚選んで提出
          </span>
        </HudPhase>
      ) : battle.submissionsClosed && !battle.result && !scoring ? (
        <HudPhase>
          <HudPhaseStrong>全員が提出しました</HudPhaseStrong>
          <span>採点機能は準備中のため、この対戦の結果はまだ出ません。</span>
          <Button variant="link" asChild>
            <a href="/">トップへ戻る</a>
          </Button>
        </HudPhase>
      ) : null}

      <BattleLayout>
        <BattleColumn side>
          <Entrance as="section" order="0" aria-labelledby="topic-title">
            <Surface variant="sticker" padding="fluid">
              <Stack gap="4">
                <PanelHead
                  title="お題"
                  titleId="topic-title"
                  note={DIFFICULTY_RULES[battle.settings.difficulty]}
                />
                <ArtFrame variant="topic" tag="THEME">
                  <ArtImage src={battle.topic.imageUrl} alt="お題のイラスト" />
                </ArtFrame>
                <Text variant="note" tone="muted">
                  このイラストにいちばん近い1枚を作ろう。
                </Text>
              </Stack>
            </Surface>
          </Entrance>
          <Entrance as="section" order="1" aria-labelledby="versus-title">
            <Surface variant="sticker" padding="fluid">
              <Stack gap="4">
                <PanelHead title="対戦状況" titleId="versus-title" />
                <VersusList>
                  {meId ? (
                    <VersusRow
                      name={nameOf(meId)}
                      player={colorOf(meId)}
                      note={`あなた・成功した生成 ${success}回`}
                      state={myState[0]}
                      stateText={myState[1]}
                    />
                  ) : null}
                  {others.map((item) => (
                    <VersusRow
                      key={item.participantId}
                      name={nameOf(item.participantId)}
                      player={colorOf(item.participantId)}
                      note={`成功した生成 ${item.generationCount}回`}
                      state={item.submitted ? "done" : item.generating ? "working" : "idle"}
                      stateText={
                        item.submitted ? "提出済み" : item.generating ? "生成中" : "考え中"
                      }
                    />
                  ))}
                </VersusList>
              </Stack>
            </Surface>
          </Entrance>
        </BattleColumn>

        <BattleColumn>
          <Entrance as="section" order="2" aria-labelledby="prompt-title">
            <Surface variant="sticker" padding="fluid">
              <Stack gap="4">
                <PanelHead title="プロンプト" titleId="prompt-title">
                  <SegmentedControl
                    label="入力方法"
                    variant="lift"
                    options={[
                      { value: "text", label: "文章" },
                      { value: "tag", label: "タグ" },
                    ]}
                    value={mode}
                    onValueChange={(value) => setMode(value === "tag" ? "tag" : "text")}
                  />
                </PanelHead>
                <PromptTextarea
                  ref={textarea}
                  aria-label="プロンプト"
                  placeholder={PLACEHOLDER[mode]}
                  tags={mode === "tag"}
                  value={prompt}
                  disabled={!canGenerate}
                  onChange={(event) => setPrompt(event.target.value)}
                />
                <PromptChips rows={chips} disabled={!canGenerate} onPick={pick} />
                <PromptFoot count={success}>
                  <Button
                    size="lg"
                    leadingIcon={<Icon name="sparkle" size="lg" />}
                    disabled={!canGenerate || pending + inflightCount >= MAX_PENDING}
                    onClick={() => void generate()}
                  >
                    生成する
                  </Button>
                </PromptFoot>
              </Stack>
            </Surface>
          </Entrance>

          <Entrance as="section" order="3" aria-labelledby="shots-title">
            <Surface variant="sticker" padding="fluid">
              <Stack gap="4">
                <PanelHead title="生成した画像" titleId="shots-title" note="1枚選んで提出" />
                <ShotGrid>
                  {generations.length === 0 && inflightCount === 0 ? (
                    <ShotEmpty>
                      まだ画像がありません。プロンプトを入力して「生成する」を押そう。
                    </ShotEmpty>
                  ) : null}
                  {Array.from({ length: inflightCount }, (_, index) => (
                    <ShotPending key={`inflight-${index}`} />
                  ))}
                  {generations.toReversed().map((item, index) => {
                    const number = generations.length - index;
                    const imageUrl = item.status === "succeeded" ? item.imageUrl : null;
                    if (item.status === "pending") return <ShotPending key={item.id} />;
                    if (!imageUrl) return <ShotFailed key={item.id} />;
                    return (
                      <ShotButton
                        key={item.id}
                        number={number}
                        selected={selected === item.id}
                        disabled={submitted || phase === "done"}
                        onSelect={() => setSelected(item.id)}
                      >
                        <ShotImage src={imageUrl} alt={`${number}回目の画像`} />
                      </ShotButton>
                    );
                  })}
                </ShotGrid>
                <SubmitRow note="提出後は変更できません。">
                  <Button
                    size="lg"
                    disabled={!selection || submitted || phase === "done"}
                    onClick={() => setConfirm(true)}
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
        open={confirm}
        onOpenChange={setConfirm}
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
              onClick={() => void submit().then(() => setConfirm(false))}
            >
              提出する
            </Button>
          </>
        }
      >
        {selection ? (
          <ArtFrame variant="confirm">
            <ArtImage src={selection.imageUrl} alt="提出する画像" />
          </ArtFrame>
        ) : null}
      </Dialog>

      {/* 結果が確定したときだけ、採点中の表示を少し見せてから結果へ移る（room-screen）。
          全員が提出しても採点機能ができるまで結果は確定しないため、画面を覆わずに上の帯で伝える */}
      {scoring ? (
        <ScreenOverlay title="採点中…" sub="AIが再現度を評価しています" />
      ) : submitted && !battle.submissionsClosed ? (
        <ScreenOverlay title="提出しました！" sub={`${opponentName} さんの提出を待っています`} />
      ) : null}
    </>
  );
}
