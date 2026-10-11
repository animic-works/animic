import type { ReactNode } from "react";
import { useEffect, useId, useRef, useState } from "react";
import { ActionGroup } from "@animic/react/action-group";
import { AccountIcon, ChevronUpIcon, PictureIcon, SearchIcon } from "../shared/icons";
import { Button } from "@animic/react/button";
import { Cluster } from "@animic/react/cluster";
import { Composer } from "@animic/react/composer";
import { Dialog } from "@animic/react/dialog";
import { Heading } from "@animic/react/heading";
import { SegmentedControl } from "@animic/react/segmented-control";
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
import type { GenerationInput } from "./generation-input";
import {
  browseDictionary,
  convertBlocks,
  groupsForBlock,
  matchRange,
  normalizeQuery,
  phraseName,
  searchDictionary,
  wordOf,
} from "./prompt-dictionary";
import type { DictionaryHit } from "./prompt-dictionary";
import { phraseImagePath } from "./phrase-images";
import { PromptField } from "./prompt-field";
import type { PromptGroup, PromptPhrase } from "./prompt-phrases";
import { PromptSearchDialog } from "./prompt-search-dialog";
import { savePrompt, useSavedPrompt } from "./prompt-storage";
import type { SearchCard, SearchGenre } from "./prompt-search-dialog";

export type PromptComposerProps = {
  /** 入力をこのタブに保存する単位。別の対戦の保存は使わない */
  battleId: string;
  summary?: ReactNode;
  /** 入力候補と検索に使う表現の辞書 */
  dictionary: readonly PromptGroup[];
  /** キャラの欄の上限（むずかしいは2） */
  maxCharacters: 1 | 2;
  /** 成功した生成の回数（Generationsの表示） */
  successCount: number;
  /** 自分の生成が未完了（「生成する」だけ押せない。入力はできる） */
  pending: boolean;
  /** 受付終了・提出済み（入力・切り替え・検索も止める） */
  locked: boolean;
  /** 生成の要求。受付を拒否されたか通信に失敗したら例外を投げる（入力は残してエラーを表示する） */
  onGenerate: (input: GenerationInput) => Promise<void>;
  /** ショートカットの案内に出す修飾キー */
  modifierKey: "⌘" | "Ctrl";
  /** 狭い画面で下端に畳んでいる（入力の要約と生成の操作だけを出す） */
  collapsed?: boolean;
  /** 畳んだ要約から入力欄を開く */
  onExpand?: () => void;
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

/** キャラの欄はお題のキャラクターの数に固定する（むずかしいは2人）。足りなければ空の欄を足す。 */
function withCharacters(state: ComposerState, maxCharacters: 1 | 2): ComposerState {
  const count = maxCharacters + 1;
  if (state.blocks.length >= count) return state;
  return {
    ...state,
    blocks: [...state.blocks, ...Array.from({ length: count - state.blocks.length }, () => [])],
  };
}

// 入力欄の例。添字は欄（0: ベース, 1: キャラ1, 2: キャラ2）
// ベースには画像全体（人数・背景・画風）、キャラにはそのキャラクターの見た目・表情・構図を書くことを伝える。
const PLACEHOLDERS: Record<PromptMode, string[]> = {
  text: [
    "人数・背景・画風を「、」で区切って入力（例：1人の女の子、白背景、アニメ塗り）",
    "このキャラの見た目・表情・構図を「、」で区切って入力（例：ピンクの髪、ツインテール、笑顔）",
    "このキャラの見た目・表情・構図を「、」で区切って入力（例：銀髪、ロングヘア、赤い目）",
  ],
  tag: [
    "人数・背景・画風を「,」で区切って入力（例：1girl, white background, anime coloring）",
    "このキャラの見た目・表情・構図を「,」で区切って入力（例：pink hair, twintails, smile）",
    "このキャラの見た目・表情・構図を「,」で区切って入力（例：silver hair, long hair, red eyes）",
  ],
};

const MODE_OPTIONS = [
  { value: "text", label: "文章", leadingIcon: "☰" },
  { value: "tag", label: "タグ", leadingIcon: "＃" },
] as const;

const TAB_TONES = ["green", "yellow", "cyan"] as const;

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
  battleId,
  summary: generationSummary,
  dictionary,
  maxCharacters,
  successCount,
  pending,
  locked,
  onGenerate,
  modifierKey,
  collapsed = false,
  onExpand,
}: PromptComposerProps) {
  const baseId = useId();
  // 入力していない間は、この対戦の保存（再接続・再読み込みで作り直す前の入力）を出す
  const saved = useSavedPrompt(battleId, maxCharacters);
  const [edited, setEdited] = useState<ComposerState | null>(null);
  const state = withCharacters(edited ?? saved ?? INITIAL_STATE, maxCharacters);
  const toast = useToast();
  const [requesting, setRequesting] = useState(false);
  const [search, setSearch] = useState<SearchState>({ open: false, genre: null, query: "" });
  const [clearing, setClearing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (edited) savePrompt(battleId, edited);
  }, [battleId, edited]);

  const { mode, blocks, active, draft } = state;
  const tokens = blocks[active] ?? [];
  const labelOf = (index: number) => blockLabel(index, maxCharacters);
  const activeLabel = labelOf(active);
  const preview = previewBlocks(blocks, active, draft);
  const prompt = assemblePrompt(preview, mode);
  const blocker = getGenerateBlocker({
    locked,
    pending: pending || requesting,
    prompt,
  });
  const total = countTokens(blocks);
  // 入力候補と検索には、開いている欄に入れるグループだけを出す。
  const groups = groupsForBlock(dictionary, active);
  const allHits = browseDictionary(groups, null, "");
  const hitsById = new Map(allHits.map((hit) => [hit.id, hit]));
  const words = preview.flat().map((token) => token.text);
  const query = draftQuery(draft);
  const suggestions = locked
    ? []
    : searchDictionary(groups, query).map((hit) => ({
        id: hit.id,
        label: phraseName(hit),
        tag: hit.tag,
        genre: hit.group.label,
        labelMatch: matchRange(phraseName(hit), query),
        tagMatch: matchRange(hit.tag, query),
      }));
  const reasonId = `${baseId}-reason`;

  const focusInput = () => inputRef.current?.focus();
  const update = (change: (current: ComposerState) => ComposerState) =>
    setEdited((current) =>
      change(withCharacters(current ?? saved ?? INITIAL_STATE, maxCharacters)),
    );

  function switchTo(index: number) {
    update((current) => ({ ...commitActive(current), active: index }));
  }

  function toggleEntry(phrase: PromptPhrase) {
    update((current) => {
      const committed = commitActive(current);
      const list = committed.blocks[committed.active] ?? [];
      return withTokens(committed, togglePhrase(list, wordOf(phrase, committed.mode)));
    });
  }

  function openSearch(target: number) {
    if (locked) return;
    update((current) => ({ ...commitActive(current), active: target }));
    setSearch({ open: true, genre: null, query: "" });
  }

  async function generate() {
    if (blocker.disabled) {
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
  }, [shortcutRef]);

  // 検索の窓に出すジャンル・カード
  // 欄を切り替えて、選んでいたジャンルが出せなくなったら「すべて」に戻す。
  const genre = groups.some((group) => group.id === search.genre) ? search.genre : null;
  const searchHits = browseDictionary(groups, genre, search.query);
  const inPrompt = (hit: DictionaryHit) => hasToken(tokens, wordOf(hit, mode));
  const genres: SearchGenre[] = [
    {
      key: null,
      label: "すべて",
      tone: "ink",
      count: allHits.length,
      picked: allHits.filter(inPrompt).length,
    },
    ...groups.map((group) => {
      const hits = allHits.filter((hit) => hit.group.id === group.id);
      return {
        key: group.id,
        label: group.label,
        tone: group.tone,
        count: hits.length,
        picked: hits.filter(inPrompt).length,
      };
    }),
  ];
  const cards: SearchCard[] = searchHits.map((hit) => ({
    id: hit.id,
    label: phraseName(hit),
    tag: hit.tag,
    image: hit.imageId ? phraseImagePath({ phraseId: hit.id, imageId: hit.imageId }) : null,
    note: hit.note,
    genre: hit.group.label,
    pressed: inPrompt(hit),
    labelMatch: matchRange(phraseName(hit), search.query),
    tagMatch: matchRange(hit.tag, search.query),
  }));
  const trimmedQuery = search.query.trim();
  const genreLabel = genres.find((item) => item.key === genre)?.label ?? "すべて";
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
        collapsed={collapsed}
        peek={
          onExpand && (
            <Button
              appearance="soft"
              shape="pill"
              size="sm"
              aria-expanded={false}
              trailingIcon={<ChevronUpIcon />}
              onClick={onExpand}
            >
              プロンプト {words.length}語{words.length > 0 && ` — ${words.join("、")}`}
            </Button>
          )
        }
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
              if (!isMode(value)) return;
              update((current) => ({
                ...current,
                mode: value,
                blocks: convertBlocks(current.blocks, dictionary, current.mode, value),
              }));
            }}
          />
        }
        tabs={
          <Cluster layout="nowrap">
            <SegmentedControl
              label="プロンプトの種類"
              appearance="chips"
              value={String(active)}
              disabled={locked}
              options={blocks.map((_, index) => ({
                value: String(index),
                label: labelOf(index),
                leadingIcon: index === 0 ? <PictureIcon /> : <AccountIcon />,
                tone: TAB_TONES[index],
              }))}
              onValueChange={(value) => switchTo(Number(value))}
            />
          </Cluster>
        }
        tools={
          <>
            <Button
              appearance="soft"
              tone="green"
              shape="pill"
              size="sm"
              leadingIcon={<SearchIcon />}
              aria-haspopup="dialog"
              disabled={locked}
              onClick={() => openSearch(0)}
            >
              ベースを検索
            </Button>
            <Button
              appearance="soft"
              tone="yellow"
              shape="pill"
              size="sm"
              leadingIcon={<SearchIcon />}
              aria-haspopup="dialog"
              disabled={locked}
              onClick={() => openSearch(active === 0 ? 1 : active)}
            >
              キャラを検索
            </Button>
          </>
        }
        summary={
          // 生成できない理由と生成回数を1行に並べる。
          <Cluster layout="nowrap" justify="between" space="compact">
            {blocker.reason ? (
              <Text id={reasonId} variant="caption" tone="muted">
                {blocker.reason}
              </Text>
            ) : (
              <Text variant="eyebrow">Generations</Text>
            )}
            {generationSummary ?? (
              <Text variant="label.supporting">
                生成 <strong>{successCount}</strong> 回
              </Text>
            )}
          </Cluster>
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
            const hit = hitsById.get(id);
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
          onClear={() => setClearing(true)}
          onSubmitShortcut={() => void generate()}
          inputRef={inputRef}
        />
      </Composer>
      <Dialog
        open={clearing && !locked}
        onOpenChange={(open) => !open && setClearing(false)}
        title={`${activeLabel}のプロンプトを空にしますか？`}
        description={`${activeLabel}の語句と書きかけを消します。ほかの欄は消しません。`}
        closeButton={false}
        presentation="centered"
        size="compact"
      >
        <ActionGroup layout="confirm">
          <Button appearance="secondary" shape="pill" size="lg" onClick={() => setClearing(false)}>
            やめる
          </Button>
          <Button
            shape="pill"
            size="lg"
            onClick={() => {
              update((current) => ({ ...withTokens(current, []), draft: "" }));
              setClearing(false);
              // 閉じた確認の窓がフォーカスを戻した後に、入力欄へ移す
              requestAnimationFrame(focusInput);
            }}
          >
            空にする
          </Button>
        </ActionGroup>
      </Dialog>
      <PromptSearchDialog
        open={search.open && !locked}
        onOpenChange={(open) => setSearch((current) => ({ ...current, open }))}
        title={`${activeLabel}プロンプトを検索`}
        query={search.query}
        onQueryChange={(value) => setSearch((current) => ({ ...current, query: value }))}
        genres={genres}
        genre={genre}
        onGenreChange={(key) => setSearch((current) => ({ ...current, genre: key }))}
        summary={summary}
        cards={cards}
        onToggle={(id) => {
          const hit = hitsById.get(id);
          if (hit) toggleEntry(hit);
        }}
        target={activeLabel}
        pickedText={`プロンプト 合計${total}語`}
        disabled={locked}
      />
    </>
  );
}
