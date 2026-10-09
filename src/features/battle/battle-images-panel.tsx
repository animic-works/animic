import { Badge } from "@animic/react/badge";
import { Button } from "@animic/react/button";
import { Cluster } from "@animic/react/cluster";
import { Comparison } from "@animic/react/comparison";
import { Heading } from "@animic/react/heading";
import { Media, MediaPlaceholder } from "@animic/react/media";
import { Spinner } from "@animic/react/spinner";
import { Stack } from "@animic/react/stack";
import { Switch } from "@animic/react/switch";
import { Text } from "@animic/react/text";
import { ThumbnailList } from "@animic/react/thumbnail-list";
import { levels } from "../room/room-presentation";
import type { getBattleImages } from "./battle-images";
import type { BattleSnapshot } from "./battle-state";
import type { useBattleEntrance } from "./use-battle-entrance";
import { TopicReveal } from "./visuals/battle-entrance";
import { ImageArrival } from "./visuals/image-arrival";
import { ApproximationMark, EmptyImageArtwork } from "./visuals/generation-artwork";

type BattleImages = ReturnType<typeof getBattleImages>;

/** お題と提出候補の画像の比較、生成履歴、提出の操作。 */
export function BattleImagesPanel({
  battle,
  images,
  entrance,
  arrival,
  locked,
  pending,
  error,
  quick,
  onQuickChange,
  onPick,
  onZoom,
  onSubmit,
}: {
  battle: BattleSnapshot;
  images: BattleImages;
  entrance: ReturnType<typeof useBattleEntrance>;
  arrival: string | null;
  locked: boolean;
  pending: boolean;
  error: string | undefined;
  quick: boolean;
  onQuickChange: (quick: boolean) => void;
  onPick: (id: string) => void;
  onZoom: () => void;
  onSubmit: (generationId: string) => void;
}) {
  const level = levels[battle.settings.difficulty];
  const { ordered, pendings, selected, submitted, numberOf } = images;
  const newestPending = pendings.at(-1);
  return (
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
            {submitted
              ? `#${numberOf(submitted.id)} を提出しました`
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
            onOpen={onZoom}
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
          onValueChange={onPick}
          disabled={locked || pending}
          empty="生成した画像がここに並びます"
          compactEmpty="履歴"
        />
      }
      preferences={
        <Switch checked={quick} onCheckedChange={onQuickChange} label="確認なしですぐ提出" />
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
            onClick={() => selected && onSubmit(selected.id)}
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
  );
}
