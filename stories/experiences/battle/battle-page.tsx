import { CodeDisplay } from "@animic/react/code-display";
import { useImageArrival } from "./use-image-arrival";
import {
  ApproximationMark,
  EmptyImageArtwork,
} from "../../../src/features/battle/visuals/generation-artwork";
import { GenerationPips } from "./visuals/generation-artwork";
import { ImageArrival } from "../../../src/features/battle/visuals/image-arrival";
import { SubmissionDialog } from "./submission-dialog";
import { useBattleEntrance } from "../../../src/features/battle/use-battle-entrance";
import { useEffect, useRef, useState } from "react";
import { ActionGroup } from "@animic/react/action-group";
import { Avatar } from "@animic/react/avatar";
import { AvatarGroup } from "@animic/react/avatar-group";
import { Badge } from "@animic/react/badge";
import { Button } from "@animic/react/button";
import { Cluster } from "@animic/react/cluster";
import { Comparison } from "@animic/react/comparison";
import { Dialog } from "@animic/react/dialog";
import { Heading } from "@animic/react/heading";
import { Media, MediaPlaceholder } from "@animic/react/media";
import { Progress } from "@animic/react/progress";
import { Readout } from "@animic/react/readout";
import { Page } from "@animic/react/page";
import { Spinner } from "@animic/react/spinner";
import { Stack } from "@animic/react/stack";
import { Switch } from "@animic/react/switch";
import { Text } from "@animic/react/text";
import { ThumbnailList } from "@animic/react/thumbnail-list";
import { useToast } from "@animic/react/toast";
import { Workspace } from "@animic/react/workspace";
import { artImage } from "../image-generation/visuals/art-image";
import { PromptComposer } from "../../../src/features/image-generation/prompt-composer";
import { useModifierKey } from "../../../src/features/battle/battle-preferences";
import { levels, playerPalettes } from "../../../src/features/room/room-presentation";
import { AppBrand } from "../../../src/features/shared/app-brand";
import { CheckIcon } from "../shared/icons";
import { GridBackdrop } from "../../../src/features/shared/visuals/grid-backdrop";
import { useQuickSubmit } from "./use-quick-submit";
import { HurryEdge } from "../../../src/features/battle/visuals/battle-motion";
import { BattleKickoff, TopicReveal } from "../../../src/features/battle/visuals/battle-entrance";
import type { BattleActions, BattleModel } from "./battle-presentation";
export function BattlePage({
  model,
  actions,
  entering = false,
}: {
  model: BattleModel;
  actions: BattleActions;
  entering?: boolean;
}) {
  const entrance = useBattleEntrance(entering);
  const modifierKey = useModifierKey();
  const arrival = useImageArrival(model.images);
  const [confirmedId, setConfirmedId] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(true);
  const [dialog, setDialog] = useState<"confirm" | "topic" | null>(null);
  const [quick, changeQuick] = useQuickSubmit();
  const reportedFailures = useRef(new Set<number>());
  const toast = useToast();
  function setQuick(value: boolean) {
    try {
      changeQuick(value);
    } catch {
      toast.show({ title: "設定を保存できませんでした" });
    }
  }
  useEffect(() => {
    for (const image of model.images) {
      if (image.status !== "failed" || reportedFailures.current.has(image.id)) continue;
      reportedFailures.current.add(image.id);
      toast.show({
        title: "生成に失敗しました",
        description: "回数には数えません。もう一度生成してください。",
      });
    }
  }, [model.images, toast]);
  const level = levels[model.rules.level];
  const selected = model.selected;
  const locked = model.phase !== "play";
  const selecting = model.clock.stage === "selection";
  const urgent = model.phase === "play" && model.clock.remaining <= 10;
  const clockTone = selecting ? "highlight" : urgent ? "primary" : "neutral";
  const roster = (
    <AvatarGroup
      label="プレイヤーの様子"
      summary={
        <>
          <Text variant="eyebrow.strong" tone="supporting">
            SUBMITTED
          </Text>
          <Text variant="label.supporting">
            {model.players.filter((player) => player.submitted).length} / {model.players.length}人
          </Text>
        </>
      }
      members={model.players.map((player, i) => ({
        id: player.id,
        name: player.name,
        current: player.isMe,
        detail: `${player.submitted ? "提出済み" : player.working ? "生成中" : "考え中"}・${player.generations}回`,
        avatar: (
          <Avatar
            size="small"
            status={player.submitted ? "complete" : player.working ? "busy" : "idle"}
            name={player.name}
            fallback={Array.from(player.name)[0]}
            palette={playerPalettes[i % playerPalettes.length]}
          />
        ),
      }))}
    />
  );
  const selectedImage = selected ? artImage(selected.features) : undefined;
  return (
    <Page decoration={<GridBackdrop />}>
      <Workspace
        headerStart={
          <>
            <AppBrand />
            <Badge>
              ルーム <CodeDisplay value={model.code} presentation="inline" size="sm" />
            </Badge>
          </>
        }
        headerDetail={
          <Badge>
            {level.label}・{model.rules.duration}秒
            {model.rules.limit ? `・${model.rules.limit}回まで` : ""}
          </Badge>
        }
        headerCenter={
          <Readout
            role="timer"
            label={selecting ? "SELECT" : "TIME LEFT"}
            format="clock"
            value={`${Math.floor(model.clock.remaining / 60)}:${String(model.clock.remaining % 60).padStart(2, "0")}`}
            tone={clockTone}
            emphasis={urgent ? "urgent" : "normal"}
          />
        }
        headerEnd={roster}
        progress={
          <Progress
            striped
            tone={clockTone === "neutral" ? "gradient" : clockTone}
            emphasis={urgent ? "urgent" : "normal"}
            presentation="track"
            label="残り時間"
            value={model.clock.progress}
          />
        }
        expanded={expanded}
        onExpandedChange={setExpanded}
        editorLabel="プロンプト欄"
        collapsedEditor={
          <Stack space="compact">
            <Button appearance="soft" shape="pill" size="sm" onClick={() => setExpanded(true)}>
              プロンプトを開く ⌃
            </Button>
          </Stack>
        }
        editor={
          model.phase === "select" ? (
            <Stack align="center" justify="center" fill>
              <Text variant="eyebrow.strong" tone="accent">
                TIME UP
              </Text>
              <Heading level={2} size="title">
                生成終了！
              </Heading>
              <Text variant="label">
                {model.selectionPending ? (
                  "生成の完了を待っています"
                ) : (
                  <>
                    残り <Text variant="numeric.display">{model.clock.remaining}</Text> 秒で1枚提出
                  </>
                )}
              </Text>
              <Text variant="body.sm" align="center" tone="supporting">
                履歴から選んで「この1枚で提出」
                <br />
                生成中の画像も、完成すれば選べます
              </Text>
            </Stack>
          ) : (
            <PromptComposer
              key={model.id}
              maxCharacters={model.rules.level === "hard" ? 2 : 1}
              successCount={model.generationCount}
              pending={model.pendingCount > 0}
              locked={locked || !model.canGenerate}
              modifierKey={modifierKey}
              onGenerate={async (prompt) => actions.generate(prompt)}
              summary={
                <Cluster justify="between" space="compact">
                  <GenerationPips
                    used={model.generationCount}
                    pending={model.pendingCount}
                    limit={model.rules.limit}
                  />
                  <Text variant="label.supporting">
                    生成 <Text variant="numeric.supporting">{model.generationCount}</Text>
                    {model.rules.limit ? `/${model.rules.limit}` : ""}回
                  </Text>
                </Cluster>
              }
            />
          )
        }
      >
        <Comparison
          decoration={<ApproximationMark />}
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
                {model.submitted
                  ? `#${model.submitted.image.id} を提出しました`
                  : selected
                    ? `#${selected.id} を提出候補にしています`
                    : "画像を1枚選んでください"}
              </Badge>
            </Cluster>
          }
          firstCaption={
            <Text variant="label.supporting">
              お題 <Badge tone="inverse">{level.word}</Badge>
            </Text>
          }
          secondCaption={
            <Text variant="label.supporting">あなたの画像{selected && ` #${selected.id}`}</Text>
          }
          description={
            <Text variant="caption" tone="supporting">
              {level.description}
            </Text>
          }
          first={
            <>
              <TopicReveal phase={entrance}>
                <Media
                  src={level.image}
                  alt="お題の画像"
                  aspect="portrait"
                  onOpen={() => setDialog("topic")}
                />
              </TopicReveal>
            </>
          }
          second={
            <>
              {selectedImage ? (
                <Media
                  src={selectedImage}
                  alt="あなたの画像"
                  aspect="portrait"
                  entering={arrival === selected?.id}
                  decoration={arrival === selected?.id ? <ImageArrival key={arrival} /> : undefined}
                  label={
                    model.pendingCount ? (
                      <Badge appearance="glass">
                        #{model.pendingGeneration?.id} 生成中
                        {model.pendingCount > 1 && ` ほか${model.pendingCount - 1}枚`}
                      </Badge>
                    ) : undefined
                  }
                />
              ) : (
                <MediaPlaceholder
                  label={model.pendingCount ? "生成中の画像" : "まだ画像がありません"}
                  description={
                    model.pendingCount ? undefined : "プロンプトを書いて「生成する」を押そう"
                  }
                  footer={
                    model.pendingGeneration && (
                      <>
                        <Cluster justify="between" space="compact">
                          <Text variant="code.compact" tone="accent-secondary">
                            GENERATING
                          </Text>
                          <Text variant="code.compact" tone="inverse">
                            STEP{" "}
                            {String(
                              Math.round((model.pendingGeneration.progress / 100) * 28),
                            ).padStart(2, "0")}
                            /28
                          </Text>
                        </Cluster>
                        <Progress
                          label="画像の生成"
                          value={model.pendingGeneration.progress}
                          presentation="track"
                          tone="gradient"
                        />
                      </>
                    )
                  }
                >
                  {model.pendingCount ? (
                    <>
                      <Spinner label="生成中" labelVisibility="hidden" size="lg" tone="gradient" />
                    </>
                  ) : (
                    <>
                      <EmptyImageArtwork />
                      <Text variant="caption" align="center" tone="muted">
                        まだ画像がありません
                      </Text>
                    </>
                  )}
                </MediaPlaceholder>
              )}
            </>
          }
          historyHeading={
            <Text variant="label.supporting">
              履歴 <Text variant="eyebrow.strong">HISTORY</Text>
            </Text>
          }
          history={
            <ThumbnailList
              label="生成履歴"
              items={model.images.toReversed().map((image) => ({
                id: String(image.id),
                entering: image.id === arrival,
                src: image.status === "ready" ? artImage(image.features) : undefined,
                label: image.status === "failed" ? "失敗" : `#${image.id}`,
                content:
                  image.status === "pending" ? (
                    <Spinner
                      label={`${image.id}回目を生成中`}
                      labelVisibility="hidden"
                      tone="gradient"
                    />
                  ) : (
                    "失敗"
                  ),
                disabled: image.status !== "ready",
              }))}
              value={selected ? String(selected.id) : undefined}
              onValueChange={(id) => actions.select(Number(id))}
              disabled={locked && model.phase !== "select"}
              empty="生成した画像がここに並びます"
              compactEmpty="履歴"
            />
          }
          preferences={
            <Switch checked={quick} onCheckedChange={setQuick} label="確認なしですぐ提出" />
          }
          actions={
            <>
              <Button
                shape="pill"
                prominence="lifted"
                size="sm"
                disabled={!selected || Boolean(model.submitted) || model.phase === "judging"}
                onClick={() => {
                  if (!selected) return;
                  if (quick) actions.submit(selected.id);
                  else {
                    setConfirmedId(selected.id);
                    setDialog("confirm");
                  }
                }}
              >
                <CheckIcon /> この1枚で提出
              </Button>
            </>
          }
        />
      </Workspace>
      {(entrance === "kickoff" || entrance === "revealing") && <BattleKickoff />}
      {urgent && <HurryEdge />}
      <Dialog
        open={dialog === "topic" && (model.phase === "play" || model.phase === "select")}
        onOpenChange={(open) => !open && setDialog(null)}
        title="お題"
        closeButton={false}
        size="compact"
      >
        <Stack>
          <Media src={level.image} alt="お題の画像（全体）" aspect="portrait" fit="contain" />
          <Button appearance="secondary" shape="pill" onClick={() => setDialog(null)}>
            閉じる
          </Button>
        </Stack>
      </Dialog>
      <Dialog
        open={dialog === "confirm" && (model.phase === "play" || model.phase === "select")}
        onOpenChange={(open) => !open && setDialog(null)}
        title="提出してもよろしいですか？"
        titleVisibility="hidden"
        closeButton={false}
        size="compact"
      >
        <Stack>
          {model.images.find((image) => image.id === confirmedId)?.features && (
            <Media
              src={artImage(model.images.find((image) => image.id === confirmedId)!.features)}
              alt="提出する画像"
              size="preview"
            />
          )}
          <Text variant="body.sm" align="center" tone="supporting">
            提出したあとは変更できません。
          </Text>
          <Switch
            checked={quick}
            onCheckedChange={setQuick}
            label="次からは確認せずにすぐ提出する"
          />
          <ActionGroup layout="confirm">
            <Button appearance="secondary" shape="pill" size="lg" onClick={() => setDialog(null)}>
              選び直す
            </Button>
            <Button
              shape="pill"
              size="lg"
              onClick={() => {
                setDialog(null);
                if (confirmedId !== null) actions.submit(confirmedId);
              }}
            >
              提出する
            </Button>
          </ActionGroup>
        </Stack>
      </Dialog>
      <SubmissionDialog model={model} />
    </Page>
  );
}
