import { Dialog } from "@ark-ui/react/dialog";
import { Portal } from "@ark-ui/react/portal";
import { useRef } from "react";
import type { ReactNode } from "react";

import { Button } from "../../components/button";
import { Icon } from "../../components/icon";
import type { DictionaryTone } from "./prompt-dictionary";
import { Highlight } from "./prompt-field";
import searchStyles from "./prompt-search-dialog.module.css";

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

// プロンプトの表現を探すダイアログ。左にジャンル、右にカード。カードを押すと欄に入り、もう一度押すと外れる。
// フォーカスの閉じ込め・Escで閉じる・背景のスクロール止めはArk UIのDialogが行う
export function PromptSearchDialog({
  open,
  onOpenChange,
  title,
  query,
  onQueryChange,
  genres,
  genre,
  onGenreChange,
  summary,
  cards,
  onToggle,
  target,
  pickedText,
  disabled,
}: PromptSearchDialogProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(details) => onOpenChange(details.open)}
      lazyMount
      unmountOnExit
    >
      <Portal>
        <Dialog.Backdrop className={searchStyles.backdrop} />
        <Dialog.Positioner className={searchStyles.positioner}>
          <Dialog.Content className={searchStyles.content}>
            <header className={searchStyles.head}>
              <Dialog.Title className={searchStyles.title}>{title}</Dialog.Title>
              <label className={searchStyles.field}>
                <Icon name="search" size="md" />
                <input
                  type="search"
                  aria-label="プロンプトを検索"
                  placeholder="日本語・タグで検索（例：ツインテール、smile）"
                  autoComplete="off"
                  value={query}
                  onChange={(event) => onQueryChange(event.target.value)}
                />
              </label>
              <Dialog.CloseTrigger className={searchStyles.close} aria-label="閉じる">
                <Icon name="close" size="sm" />
              </Dialog.CloseTrigger>
            </header>
            <nav className={searchStyles.nav} aria-label="ジャンル">
              <h3 className={searchStyles.navTitle}>Genre</h3>
              {genres.map((item) => (
                <button
                  key={item.key ?? "all"}
                  type="button"
                  className={searchStyles.genre}
                  aria-pressed={item.key === genre}
                  onClick={() => {
                    onGenreChange(item.key);
                    onQueryChange("");
                    if (gridRef.current) gridRef.current.scrollTop = 0;
                  }}
                >
                  <i className={searchStyles.dot} data-tone={item.tone} aria-hidden="true" />
                  {item.label}
                  {item.picked > 0 ? (
                    <span className={searchStyles.picked}>{item.picked}</span>
                  ) : null}
                  <small>{item.count}</small>
                </button>
              ))}
            </nav>
            <div className={searchStyles.main}>
              <p className={searchStyles.summary} aria-live="polite">
                {summary}
              </p>
              <div className={searchStyles.grid} ref={gridRef}>
                {cards.length === 0 ? (
                  <p className={searchStyles.empty}>
                    見つかりませんでした。プロンプト欄にそのまま書くこともできます
                  </p>
                ) : (
                  cards.map((card) => (
                    <button
                      key={card.id}
                      type="button"
                      className={searchStyles.card}
                      aria-pressed={card.pressed}
                      disabled={disabled}
                      onClick={() => onToggle(card.id)}
                    >
                      <span className={searchStyles.cardImage}>
                        <span className={searchStyles.noImage} aria-hidden="true">
                          <Icon name="frame" size="3xl" />
                          No Image
                        </span>
                        <span className={searchStyles.cardGenre}>{card.genre}</span>
                        <span className={searchStyles.check} aria-hidden="true">
                          <Icon name="check" size="xs" />
                        </span>
                      </span>
                      <span className={searchStyles.cardText}>
                        <b>
                          <Highlight text={card.label} range={card.labelMatch} />
                        </b>
                        <code>
                          <Highlight text={card.tag} range={card.tagMatch} />
                        </code>
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
            <footer className={searchStyles.foot}>
              <span className={searchStyles.footNote}>
                カードを押すと<b>{target}</b>に入り、もう一度押すと外れます
              </span>
              <span className={searchStyles.footPicked}>{pickedText}</span>
              <span className={searchStyles.done}>
                <Dialog.CloseTrigger asChild>
                  <Button size="sm">決定</Button>
                </Dialog.CloseTrigger>
              </span>
            </footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
