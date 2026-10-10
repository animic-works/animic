import type { ReactNode } from "react";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@animic/react/button";
import { Cluster } from "@animic/react/cluster";
import { Composer } from "@animic/react/composer";
import { Heading } from "@animic/react/heading";
import { IconButton } from "@animic/react/icon-button";
import { SegmentedControl } from "@animic/react/segmented-control";
import { Stack } from "@animic/react/stack";
import { Text } from "@animic/react/text";
import { useToast } from "@animic/react/toast";
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
import {
  browseDictionary,
  hitId,
  matchRange,
  normalizeQuery,
  promptDictionary,
  searchDictionary,
  wordOf,
} from "./prompt-dictionary";
import type { DictionaryEntry, DictionaryHit } from "./prompt-dictionary";
import { PromptField } from "./prompt-field";
import { PromptSearchDialog } from "./prompt-search-dialog";
import type { SearchCard, SearchGenre } from "./prompt-search-dialog";

export type PromptComposerProps = {
  summary?: ReactNode;
  /** キャラの欄の上限（むずかしいは2） */
  maxCharacters: 1 | 2;
  /** 成功した生成の回数（Generationsの表示） */
  successCount: number;
  /** 自分の生成が未完了（「生成する」だけ押せない。入力はできる） */
  pending: boolean;
  /** 受付終了・提出済み（入力・切り替え・検索も止める） */
  locked: boolean;
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
  { value: "text", label: "文章", leadingIcon: "☰" },
  { value: "tag", label: "タグ", leadingIcon: "＃" },
] as const;

const TAB_TONES = ["green", "yellow", "cyan"] as const;

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

// 左のパネル: 入力方法の切り替え、ベース／キャラのタブ、プロンプト欄、検索、生成の回数とボタン
export function PromptComposer({
  summary: generationSummary,
  maxCharacters,
  successCount,
  pending,
  locked,
  onGenerate,
  modifierKey,
}: PromptComposerProps) {
  const baseId = useId();
  const [state, setState] = useState(INITIAL_STATE);
  const toast = useToast();
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
      toast.show({ title: blocker.reason ?? "いまは画像を生成できません" });
      return;
    }
    // 書きかけも語句にしてから送る（送った内容と欄の表示をそろえる）
    update((current) => ({ ...current, blocks: preview, draft: "" }));
    setRequesting(true);
    try {
      await onGenerate(prompt);
    } catch {
      toast.show({ title: "画像を生成できませんでした。もう一度お試しください。" });
    } finally {
      setRequesting(false);
    }
  }

  // ⌘/Ctrl+Kで検索を開く。最新の状態で判断するため、処理は描画のたびに差し替える
  const shortcutRef = useRef<(event: KeyboardEvent) => void>(() => {});
  useEffect(() => {
    shortcutRef.current = (event) => {
      if (
        event.isComposing ||
        event.defaultPrevented ||
        event.key.toLowerCase() !== "k" ||
        !(event.metaKey || event.ctrlKey)
      )
        return;
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
    <>
      <Composer
        eyebrow="01 — PROMPT"
        title={
          <Heading level={1} size="panel">
            プロンプト
          </Heading>
        }
        controls={
          <SegmentedControl
            label="入力方法"
            appearance="pill"
            density="compact"
            tone="violet"
            options={MODE_OPTIONS}
            value={mode}
            disabled={locked}
            onValueChange={(value) => {
              if (isMode(value)) update((current) => ({ ...current, mode: value }));
            }}
          />
        }
        tabs={
          <Cluster>
            <SegmentedControl
              label="プロンプトの種類"
              appearance="chips"
              value={String(active)}
              disabled={locked}
              options={blocks.map((_, index) => ({
                value: String(index),
                label: labelOf(index),
                leadingIcon: index === 0 ? "■" : "●",
                tone: TAB_TONES[index],
              }))}
              onValueChange={(value) => switchTo(Number(value))}
            />
            {blocks.length > 2 && (
              <IconButton
                label={`${labelOf(2)}を消す`}
                size="sm"
                disabled={locked}
                onClick={removeCharacter}
              >
                ×
              </IconButton>
            )}
            {blocks.length - 1 < maxCharacters && (
              <Button appearance="quiet" size="sm" disabled={locked} onClick={addCharacter}>
                ＋ {labelOf(blocks.length)}
              </Button>
            )}
          </Cluster>
        }
        tools={
          <>
            <Button
              appearance="soft"
              tone="green"
              shape="pill"
              size="sm"
              compactLabel="ベースを検索"
              aria-haspopup="dialog"
              disabled={locked}
              onClick={() => openSearch(0)}
            >
              ベースプロンプトを検索
            </Button>
            <Button
              appearance="soft"
              tone="yellow"
              shape="pill"
              size="sm"
              compactLabel="キャラを検索"
              aria-haspopup="dialog"
              disabled={locked}
              onClick={() => openSearch(active === 0 ? 1 : active)}
            >
              キャラプロンプトを検索
            </Button>
          </>
        }
        summary={
          <Stack space="tight">
            {blocker.reason && (
              <Text id={reasonId} variant="caption" tone="muted">
                {blocker.reason}
              </Text>
            )}
            {generationSummary ?? (
              <>
                {!blocker.reason && <Text variant="eyebrow">Generations</Text>}
                <Text variant="label.supporting">
                  生成 <strong>{successCount}</strong> 回
                </Text>
              </>
            )}
          </Stack>
        }
        action={
          <Button
            size="lg"
            disabled={blocker.disabled}
            aria-describedby={blocker.reason ? reasonId : undefined}
            trailingIcon={<Text variant="caption">{modifierKey} ↵</Text>}
            onClick={() => void generate()}
          >
            生成する
          </Button>
        }
      >
        <PromptField
          label={`プロンプト（${activeLabel}）`}
          tokens={tokens}
          draft={draft}
          onDraftChange={(value, composing) =>
            update((current) => {
              if (composing) return { ...current, draft: value };
              const committed = commitDraft(current.blocks[current.active] ?? [], value);
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
              const picked = pickSuggestion(
                current.blocks[current.active] ?? [],
                current.draft,
                wordOf(hit, current.mode),
              );
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
          inputRef={inputRef}
        />
      </Composer>
      <PromptSearchDialog
        open={search.open && !locked}
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
    </>
  );
}
