import { useEffect } from "react";
import { Badge } from "@animic/react/badge";
import { Button } from "@animic/react/button";
import { Cluster } from "@animic/react/cluster";
import { Dialog } from "@animic/react/dialog";
import { Grid } from "@animic/react/grid";
import { Heading } from "@animic/react/heading";
import { IconButton } from "@animic/react/icon-button";
import { Media, MediaPlaceholder } from "@animic/react/media";
import { Stack } from "@animic/react/stack";
import { Text } from "@animic/react/text";
import { ThumbnailList } from "@animic/react/thumbnail-list";
import { ArrowIcon, PictureIcon } from "../shared/icons";
import type { SearchCard } from "./prompt-search-dialog";

export type PhraseImageDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 今の検索結果（前後の移動と、下に並べる表現） */
  cards: SearchCard[];
  /** 下の並びの見出し（例: 髪型のほかの表現）。検索の絞り込みに合わせる */
  othersLabel: string;
  /** 見ている表現のID */
  cardId: string | null;
  onCardChange: (id: string) => void;
  /** 入れる先の欄（例: キャラ1） */
  target: string;
  onToggle: (id: string) => void;
  disabled: boolean;
};

/** 検索のカードの挿絵の全体と表現の説明を出し、そのまま欄へ出し入れする。検索のダイアログの上に重ねる。 */
export function PhraseImageDialog(props: PhraseImageDialogProps) {
  const { cards, onCardChange } = props;
  const index = cards.findIndex((card) => card.id === props.cardId);
  const card = cards[index];
  const previous = cards[index - 1];
  const next = cards[index + 1];
  const open = props.open && card !== undefined;

  // ←→で前後の表現へ移る（開いている間だけ）。
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        !open ||
        event.defaultPrevented ||
        event.isComposing ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey
      )
        return;
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      const rtl = getComputedStyle(document.documentElement).direction === "rtl";
      const to = (event.key === "ArrowRight") !== rtl ? next : previous;
      if (!to) return;
      event.preventDefault();
      onCardChange(to.id);
    };
    addEventListener("keydown", onKeyDown);
    return () => removeEventListener("keydown", onKeyDown);
  }, [open, previous, next, onCardChange]);

  if (!card) return null;
  return (
    <Dialog
      open={open}
      onOpenChange={props.onOpenChange}
      title={card.label}
      size="standard"
      presentation="centered"
      footer={
        <Cluster justify="between">
          <Cluster layout="nowrap" space="compact">
            <IconButton
              shape="circle"
              size="sm"
              label="前の表現"
              disabled={!previous}
              onClick={() => previous && onCardChange(previous.id)}
            >
              <ArrowIcon direction="left" />
            </IconButton>
            <Text variant="label.supporting">
              {index + 1} / {cards.length}
            </Text>
            <IconButton
              shape="circle"
              size="sm"
              label="次の表現"
              disabled={!next}
              onClick={() => next && onCardChange(next.id)}
            >
              <ArrowIcon />
            </IconButton>
          </Cluster>
          <Button
            shape="pill"
            appearance={card.pressed ? "secondary" : "primary"}
            disabled={props.disabled}
            onClick={() => props.onToggle(card.id)}
          >
            {card.pressed ? `${props.target}から外す` : `${props.target}に入れる`}
          </Button>
        </Cluster>
      }
    >
      <Stack>
        <Grid columns={2} aria-live="polite" aria-atomic="true">
          {card.image ? (
            <Media src={card.image} alt={`${card.label}の挿絵`} aspect="square" fit="contain" />
          ) : (
            <MediaPlaceholder aspect="square" label={`${card.label}の挿絵なし`}>
              <Text variant="caption" tone="muted">
                No Image
              </Text>
            </MediaPlaceholder>
          )}
          <Stack space="compact">
            <Text variant="caption" tone="muted">
              {card.genre}
            </Text>
            <Text variant="code.compact">{card.tag}</Text>
            {card.note && <Text variant="body.sm">{card.note}</Text>}
            {card.pressed && (
              <Cluster>
                <Badge size="sm" tone="primary">
                  {props.target}に入っています
                </Badge>
              </Cluster>
            )}
          </Stack>
        </Grid>
        <Stack space="compact">
          <Heading level={3} size="sm">
            {props.othersLabel}
          </Heading>
          <ThumbnailList
            label={props.othersLabel}
            layout="strip"
            items={cards.map((item) => ({
              id: item.id,
              ...(item.image ? { src: item.image } : { content: <PictureIcon /> }),
              label: item.pressed ? `${item.label}（${props.target}に入っています）` : item.label,
              badge: item.label,
              checked: item.pressed,
            }))}
            current={card.id}
            onValueChange={onCardChange}
            empty=""
          />
        </Stack>
      </Stack>
    </Dialog>
  );
}
