import { Tabs } from "@ark-ui/react/tabs";
import { useEffect, useId, useRef, useState } from "react";
import type { ReactNode } from "react";

import { Button } from "../../components/button";
import { Icon } from "../../components/icon";
import { PanelHead } from "../../components/panel-head";
import { SegmentedControl } from "../../components/segmented-control";
import { toast } from "../../components/toast";
import {
  assemblePrompt,
  blockLabel,
  commitDraft,
  countTokens,
  draftQuery,
  getGenerateBlocker,
  hasToken,
  pickSuggestion,
  previewBlocks,
  stepWeight,
  takeToken,
  togglePhrase,
} from "./prompt-blocks";
import type { PromptBlocks, PromptMode } from "./prompt-blocks";
import composerStyles from "./prompt-composer.module.css";
import {
  browseDictionary,
  hitId,
  matchRange,
  normalizeQuery,
  promptDictionary,
  quickPhraseGroups,
  searchDictionary,
  wordOf,
} from "./prompt-dictionary";
import type { DictionaryEntry, DictionaryHit } from "./prompt-dictionary";
import { PromptField } from "./prompt-field";
import { PromptSearchDialog } from "./prompt-search-dialog";
import type { SearchCard, SearchGenre } from "./prompt-search-dialog";

export type PromptComposerProps = {
  /** キャラの欄の上限（むずかしいは2） */
  maxCharacters: 1 | 2;
  /** 成功した生成の回数（Generationsの表示） */
  successCount: number;
  /** 自分の生成が未完了（「生成する」だけ押せない。入力はできる） */
  pending: boolean;
  /** 受付終了・提出済み（入力・切り替え・検索・よく使う表現も止める） */
  locked: boolean;
  /** パネルを覆う案内（生成終了の黄色いカード） */
  cover?: ReactNode;
  /** 生成の要求。未定義なら「生成する」と⌘/Ctrl+Enterは動かず、理由を表示する */
  onGenerate?: (prompt: string) => Promise<void>;
  /** ショートカットの案内に出す修飾キー */
  modifierKey: "⌘" | "Ctrl";
};

type ComposerState = {
  mode: PromptMode;
  /** [0]がベース、[1]以降がキャラ */
  blocks: PromptBlocks;
  /** 選んでいる欄 */
  active: number;
  /** 区切りのない書きかけ */
  draft: string;
};

type SearchState = { open: boolean; genre: string | null; query: string };

const INITIAL_STATE: ComposerState = { mode: "text", blocks: [[], []], active: 1, draft: "" };

// 入力欄の例。添字は欄（0: ベース, 1: キャラ1, 2: キャラ2）
const PLACEHOLDERS: Record<PromptMode, string[]> = {
  text: [
    "「、」で区切って入力（例：白背景、アニメ塗り）",
    "「、」で区切って入力（例：ピンクの髪、ツインテール、笑顔）",
    "「、」で区切って入力（例：銀髪、ロングヘア、赤い目）",
  ],
  tag: [
    "「,」で区切って入力（例：white background, anime coloring）",
    "「,」で区切って入力（例：pink hair, twintails, smile）",
    "「,」で区切って入力（例：silver hair, long hair, red eyes）",
  ],
};

const MODE_OPTIONS = [
  { value: "text", label: "文章", icon: "textLines", title: "日本語の文章で書く" },
  { value: "tag", label: "タグ", icon: "hash", title: "英語のタグ（Danbooru形式）で書く" },
] as const;

const TAB_TONES = ["base", "char1", "char2"] as const;

const ALL_HITS = browseDictionary(promptDictionary, null, "");
const HITS_BY_ID = new Map(ALL_HITS.map((hit) => [hitId(hit), hit]));

/** 書きかけを確定してから、選んでいる欄を変える */
function commitActive(state: ComposerState): ComposerState {
  const current = state.blocks[state.active];
  if (!current || !state.draft) return state;
  const committed = commitDraft(current, state.draft, true);
  return {
    ...state,
    blocks: state.blocks.map((block, index) => (index === state.active ? committed.tokens : block)),
    draft: committed.draft,
  };
}

/** 選んでいる欄の語句を差し替える */
function withTokens(state: ComposerState, tokens: PromptBlocks[number]): ComposerState {
  return {
    ...state,
    blocks: state.blocks.map((block, index) => (index === state.active ? tokens : block)),
  };
}

const isMode = (value: string): value is PromptMode => value === "text" || value === "tag";

// 左のパネル: 入力方法の切り替え、ベース／キャラのタブ、プロンプト欄、検索、よく使う表現、生成の回数とボタン
export function PromptComposer({
  maxCharacters,
  successCount,
  pending,
  locked,
  cover,
  onGenerate,
  modifierKey,
}: PromptComposerProps) {
  const baseId = useId();
  const [state, setState] = useState(INITIAL_STATE);
  const [shakeKey, setShakeKey] = useState(0);
  const [requesting, setRequesting] = useState(false);
  const [search, setSearch] = useState<SearchState>({ open: false, genre: null, query: "" });
  const inputRef = useRef<HTMLInputElement>(null);

  const { mode, blocks, active, draft } = state;
  const tokens = blocks[active] ?? [];
  const labelOf = (index: number) => blockLabel(index, maxCharacters);
  const activeLabel = labelOf(active);
  const preview = previewBlocks(blocks, active, draft);
  const prompt = assemblePrompt(preview, mode);
  const blocker = getGenerateBlocker({
    available: Boolean(onGenerate),
    locked,
    pending: pending || requesting,
    prompt,
  });
  const total = countTokens(blocks);
  const query = draftQuery(draft);
  const suggestions = locked
    ? []
    : searchDictionary(promptDictionary, query).map((hit) => ({
        id: hitId(hit),
        label: hit.ja,
        tag: hit.tag,
        genre: hit.group.label,
        labelMatch: matchRange(hit.ja, query),
        tagMatch: matchRange(hit.tag, query),
      }));
  const triggerId = (value: string) => `${baseId}-tab-${value}`;
  const panelId = `${baseId}-panel`;
  const reasonId = `${baseId}-reason`;

  const focusInput = () => inputRef.current?.focus();
  const update = (change: (current: ComposerState) => ComposerState) =>
    setState((current) => change(current));

  function switchTo(index: number) {
    update((current) => ({ ...commitActive(current), active: index }));
  }

  function addCharacter() {
    update((current) => {
      const committed = commitActive(current);
      return { ...committed, blocks: [...committed.blocks, []], active: committed.blocks.length };
    });
    focusInput();
  }

  function removeCharacter() {
    update((current) => {
      const committed = commitActive(current);
      return {
        ...committed,
        blocks: committed.blocks.slice(0, 2),
        active: committed.active >= 2 ? 1 : committed.active,
      };
    });
  }

  function toggleEntry(entry: DictionaryEntry) {
    update((current) => {
      const committed = commitActive(current);
      const list = committed.blocks[committed.active] ?? [];
      return withTokens(committed, togglePhrase(list, wordOf(entry, committed.mode)));
    });
  }

  function openSearch(target: number) {
    if (locked) return;
    update((current) => ({ ...commitActive(current), active: target }));
    setSearch({ open: true, genre: null, query: "" });
  }

  async function generate() {
    if (blocker.disabled || !onGenerate) {
      toast(blocker.reason ?? "いまは画像を生成できません");
      setShakeKey((key) => key + 1);
      return;
    }
    // 書きかけも語句にしてから送る（送った内容と欄の表示をそろえる）
    update((current) => ({ ...current, blocks: preview, draft: "" }));
    setRequesting(true);
    try {
      await onGenerate(prompt);
    } catch {
      toast("画像を生成できませんでした。もう一度お試しください。");
    } finally {
      setRequesting(false);
    }
  }

  // ⌘/Ctrl+Kで検索を開く。最新の状態で判断するため、処理は描画のたびに差し替える
  const shortcutRef = useRef<(event: KeyboardEvent) => void>(() => {});
  useEffect(() => {
    shortcutRef.current = (event) => {
      if (event.key.toLowerCase() !== "k" || !(event.metaKey || event.ctrlKey)) return;
      // 検索・確認などのダイアログが開いている間は開かない
      if (locked || search.open || document.activeElement?.closest("[role='dialog']")) return;
      event.preventDefault();
      openSearch(active);
    };
  });
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => shortcutRef.current(event);
    addEventListener("keydown", onKeyDown);
    return () => removeEventListener("keydown", onKeyDown);
  }, []);

  // 検索の窓に出すジャンル・カード
  const searchHits = browseDictionary(promptDictionary, search.genre, search.query);
  const inPrompt = (hit: DictionaryHit) => hasToken(tokens, wordOf(hit, mode));
  const genres: SearchGenre[] = [
    {
      key: null,
      label: "すべて",
      tone: "ink",
      count: ALL_HITS.length,
      picked: ALL_HITS.filter(inPrompt).length,
    },
    ...promptDictionary.map((group) => {
      const hits = ALL_HITS.filter((hit) => hit.group.key === group.key);
      return {
        key: group.key,
        label: group.label,
        tone: group.tone,
        count: hits.length,
        picked: hits.filter(inPrompt).length,
      };
    }),
  ];
  const cards: SearchCard[] = searchHits.map((hit) => ({
    id: hitId(hit),
    label: hit.ja,
    tag: hit.tag,
    genre: hit.group.label,
    pressed: inPrompt(hit),
    labelMatch: matchRange(hit.ja, search.query),
    tagMatch: matchRange(hit.tag, search.query),
  }));
  const trimmedQuery = search.query.trim();
  const genreLabel = genres.find((item) => item.key === search.genre)?.label ?? "すべて";
  const summary = normalizeQuery(search.query) ? (
    <>
      「<b>{trimmedQuery}</b>」の結果 {cards.length}件
    </>
  ) : (
    <>
      {genreLabel} <b>{cards.length}</b>件
    </>
  );

  return (
    <section
      className={composerStyles.root}
      aria-labelledby="prompt-title"
      // 生成終了のカードで覆っている間は、下の操作に触れさせない
      data-covered={cover ? "" : undefined}
    >
      <div className={composerStyles.body} inert={Boolean(cover)}>
        <PanelHead eyebrow="01 — Prompt" title="プロンプト" titleId="prompt-title">
          <SegmentedControl
            label="入力方法"
            variant="mode"
            options={[...MODE_OPTIONS]}
            value={mode}
            onValueChange={(value) => {
              if (isMode(value)) update((current) => ({ ...current, mode: value }));
            }}
            disabled={locked}
          />
        </PanelHead>

        <div className={composerStyles.tabsBar}>
          <Tabs.Root
            className={composerStyles.tabs}
            value={String(active)}
            onValueChange={(details) => switchTo(Number(details.value))}
            activationMode="automatic"
            ids={{ trigger: triggerId, content: () => panelId }}
          >
            <Tabs.List className={composerStyles.tabList} aria-label="プロンプトの種類">
              {blocks.map((_, index) => (
                <Tabs.Trigger
                  // 欄は末尾にだけ足し・消すため、添字で見分けられる
                  key={index}
                  value={String(index)}
                  className={composerStyles.tab}
                  data-tone={TAB_TONES[index]}
                >
                  <i className={composerStyles.tabMark} aria-hidden="true" />
                  {labelOf(index)}
                </Tabs.Trigger>
              ))}
            </Tabs.List>
          </Tabs.Root>
          {blocks.length > 2 && !locked ? (
            <button
              type="button"
              className={composerStyles.tabRemove}
              aria-label={`${labelOf(2)}を消す`}
              onClick={removeCharacter}
            >
              <Icon name="cross" size="2xs" />
            </button>
          ) : null}
          {blocks.length - 1 < maxCharacters ? (
            <button
              type="button"
              className={composerStyles.tabAdd}
              disabled={locked}
              onClick={addCharacter}
            >
              ＋ {labelOf(blocks.length)}
            </button>
          ) : null}
        </div>

        <PromptField
          label={`プロンプト（${activeLabel}）`}
          tokens={tokens}
          draft={draft}
          onDraftChange={(value) =>
            update((current) => {
              const list = current.blocks[current.active] ?? [];
              const committed = commitDraft(list, value);
              return { ...withTokens(current, committed.tokens), draft: committed.draft };
            })
          }
          onCommit={() => update(commitActive)}
          placeholder={
            tokens.length > 0
              ? mode === "tag"
                ? "「,」で区切って追加"
                : "「、」で区切って追加"
              : (PLACEHOLDERS[mode][Math.min(active, 2)] ?? "")
          }
          tags={mode === "tag"}
          disabled={locked}
          lengthText={`${tokens.length}語（合計 ${total}語）`}
          suggestions={suggestions}
          onPick={(id) => {
            const hit = HITS_BY_ID.get(id);
            if (!hit) return;
            update((current) => {
              const list = current.blocks[current.active] ?? [];
              const picked = pickSuggestion(list, current.draft, wordOf(hit, current.mode));
              return { ...withTokens(current, picked.tokens), draft: picked.draft };
            });
          }}
          onEditToken={(index) => {
            update((current) => {
              const committed = commitActive(current);
              const taken = takeToken(committed.blocks[committed.active] ?? [], index);
              return { ...withTokens(committed, taken.tokens), draft: taken.draft };
            });
            focusInput();
          }}
          onEditLast={() =>
            update((current) => {
              const list = current.blocks[current.active] ?? [];
              const taken = takeToken(list, list.length - 1);
              return { ...withTokens(current, taken.tokens), draft: taken.draft };
            })
          }
          onStepWeight={(index, direction) =>
            update((current) =>
              withTokens(
                current,
                stepWeight(current.blocks[current.active] ?? [], index, direction),
              ),
            )
          }
          onClear={() => {
            update((current) => ({ ...withTokens(current, []), draft: "" }));
            focusInput();
          }}
          onSubmitShortcut={() => void generate()}
          shakeKey={shakeKey}
          inputRef={inputRef}
          panel={{ id: panelId, labelledBy: triggerId(String(active)) }}
        />

        <div className={composerStyles.search}>
          <button
            type="button"
            className={composerStyles.searchButton}
            data-tone="base"
            aria-haspopup="dialog"
            aria-label="ベースプロンプトを検索"
            disabled={locked}
            onClick={() => openSearch(0)}
          >
            <span className={composerStyles.searchIcon} aria-hidden="true">
              <Icon name="frame" size="md" />
            </span>
            <span className={composerStyles.searchText}>
              <b>ベース</b>
              <span className={composerStyles.searchMid}>プロンプト</span>を検索
            </span>
          </button>
          <button
            type="button"
            className={composerStyles.searchButton}
            data-tone="char"
            aria-haspopup="dialog"
            aria-label="キャラプロンプトを検索"
            disabled={locked}
            onClick={() => openSearch(active === 0 ? 1 : active)}
          >
            <span className={composerStyles.searchIcon} aria-hidden="true">
              <Icon name="user" size="md" />
            </span>
            <span className={composerStyles.searchText}>
              <b>キャラ</b>
              <span className={composerStyles.searchMid}>プロンプト</span>を検索
            </span>
          </button>
        </div>

        <div className={composerStyles.chips} role="group" aria-label="よく使う表現">
          {quickPhraseGroups.map((group) => {
            const tone = promptDictionary.find((item) => item.key === group.key)?.tone;
            return (
              <div key={group.key} className={composerStyles.chipRow} data-tone={tone}>
                <span className={composerStyles.chipLabel}>{group.label}</span>
                <div className={composerStyles.chipOptions}>
                  {group.entries.map((entry) => {
                    const word = wordOf(entry, mode);
                    return (
                      <button
                        key={entry.tag}
                        type="button"
                        className={composerStyles.chip}
                        aria-pressed={hasToken(tokens, word)}
                        disabled={locked}
                        onClick={() => {
                          toggleEntry(entry);
                          // スマホでは押すたびにキーボードが出ないよう、入力欄へ移らない
                          if (matchMedia("(hover: hover)").matches) focusInput();
                        }}
                      >
                        {word}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
          <p className={composerStyles.tip}>
            <Icon name="bulb" size="md" />
            <span>
              <b>コツ</b>　お題を<b>髪・目・服・表情・背景</b>
              に分けて、ひとつずつ言葉にしてみよう。
            </span>
          </p>
        </div>

        <div className={composerStyles.foot}>
          <div className={composerStyles.meter}>
            {blocker.reason ? (
              <span id={reasonId} className={composerStyles.reason}>
                {blocker.reason}
              </span>
            ) : (
              <span className={composerStyles.eyebrow}>Generations</span>
            )}
            <span className={composerStyles.count}>
              生成 <b>{successCount}</b> 回
            </span>
          </div>
          <div className={composerStyles.generate}>
            <Button
              size="lg"
              fullWidth
              disabled={blocker.disabled}
              aria-describedby={blocker.reason ? reasonId : undefined}
              leadingIcon={<Icon name="sparkle" size="xl" />}
              trailingIcon={
                <span className={composerStyles.kbd}>
                  <kbd>{modifierKey}</kbd>
                  <kbd>↵</kbd>
                </span>
              }
              onClick={() => void generate()}
            >
              生成する
            </Button>
          </div>
        </div>
      </div>

      <PromptSearchDialog
        open={search.open}
        onOpenChange={(open) => setSearch((current) => ({ ...current, open }))}
        title={`${activeLabel}プロンプトを検索`}
        query={search.query}
        onQueryChange={(value) => setSearch((current) => ({ ...current, query: value }))}
        genres={genres}
        genre={search.genre}
        onGenreChange={(key) => setSearch((current) => ({ ...current, genre: key }))}
        summary={summary}
        cards={cards}
        onToggle={(id) => {
          const hit = HITS_BY_ID.get(id);
          if (hit) toggleEntry(hit);
        }}
        target={activeLabel}
        pickedText={`プロンプト 合計${total}語`}
        disabled={locked}
      />

      {cover ? <div className={composerStyles.cover}>{cover}</div> : null}
    </section>
  );
}
