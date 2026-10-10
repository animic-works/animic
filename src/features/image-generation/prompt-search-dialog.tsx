import type { ReactNode } from "react";
import { Badge } from "@animic/react/badge";
import { Button } from "@animic/react/button";
import { ChoiceCard } from "@animic/react/choice-card";
import { Cluster } from "@animic/react/cluster";
import { CollectionBrowser } from "@animic/react/collection-browser";
import { Dialog } from "@animic/react/dialog";
import { Input } from "@animic/react/input";
import { SegmentedControl } from "@animic/react/segmented-control";
import { Text } from "@animic/react/text";
import type { DictionaryTone } from "./prompt-dictionary";
import { Highlight } from "./prompt-field";
/** 左のジャンル。keyがnullは「すべて」、pickedは欄に入っている数 */
export type SearchGenre = {
  key: string | null;
  label: string;
  tone: DictionaryTone;
  count: number;
  picked: number;
};

/** 右のカード。pressedは欄に入っているか */
export type SearchCard = {
  id: string;
  label: string;
  tag: string;
  genre: string;
  pressed: boolean;
  labelMatch: [number, number] | null;
  tagMatch: [number, number] | null;
};

export type PromptSearchDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 見出し（例: キャラ1プロンプトを検索） */
  title: string;
  query: string;
  onQueryChange: (value: string) => void;
  genres: SearchGenre[];
  genre: string | null;
  onGenreChange: (key: string | null) => void;
  /** 件数の文（例: 「smile」の結果 3件） */
  summary: ReactNode;
  cards: SearchCard[];
  onToggle: (id: string) => void;
  /** 入れる先の欄（例: キャラ1） */
  target: string;
  /** 入っている語数（例: プロンプト 合計3語） */
  pickedText: string;
  disabled: boolean;
};

export function PromptSearchDialog(props: PromptSearchDialogProps) {
  return (
    <Dialog
      open={props.open}
      onOpenChange={props.onOpenChange}
      title={props.title}
      size="expanded"
      headerActions={
        <Input
          type="search"
          aria-label="プロンプトを検索"
          placeholder="日本語・タグで検索（例：ツインテール、smile）"
          value={props.query}
          onChange={(event) => props.onQueryChange(event.target.value)}
        />
      }
      footer={
        <Cluster justify="between">
          <Text variant="body.sm">カードを押すと{props.target}に入り、もう一度押すと外れます</Text>
          <Text variant="label.supporting">{props.pickedText}</Text>
          <Button shape="pill" onClick={() => props.onOpenChange(false)}>
            決定
          </Button>
        </Cluster>
      }
    >
      <CollectionBrowser
        label="検索結果"
        filters={
          <SegmentedControl
            label="ジャンル"
            appearance="list"
            value={props.genre ?? "all"}
            options={props.genres.map((genre) => ({
              value: genre.key ?? "all",
              label: genre.label,
              markerTone: genre.tone,
              detail: (
                <>
                  {genre.picked > 0 && <Badge size="sm">{genre.picked}</Badge>}
                  <span>{genre.count}</span>
                </>
              ),
            }))}
            onValueChange={(value) => {
              props.onGenreChange(value === "all" ? null : value);
              props.onQueryChange("");
            }}
          />
        }
        heading={
          <Text variant="body.sm" tone="muted" aria-live="polite">
            {props.summary}
          </Text>
        }
        empty={
          <Text tone="muted">見つかりませんでした。プロンプト欄にそのまま書くこともできます</Text>
        }
      >
        {props.cards.map((card) => (
          <ChoiceCard
            key={card.id}
            label={`${card.label}を${props.target}に${card.pressed ? "入れない" : "入れる"}`}
            media={
              <>
                <svg
                  width="36"
                  height="36"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  aria-hidden="true"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8" cy="8" r="1.5" />
                  <path d="m4 18 5-5 4 3 4-6 4 8" />
                </svg>
                <Text variant="caption" tone="muted">
                  No Image
                </Text>
              </>
            }
            selected={card.pressed}
            disabled={props.disabled}
            onSelect={() => props.onToggle(card.id)}
          >
            <Text variant="caption" tone="muted">
              {card.genre}
            </Text>
            <Text variant="label.supporting">
              <Highlight text={card.label} range={card.labelMatch} />
            </Text>
            <Text variant="caption" tone="muted">
              <Highlight text={card.tag} range={card.tagMatch} />
            </Text>
          </ChoiceCard>
        ))}
      </CollectionBrowser>
    </Dialog>
  );
}
