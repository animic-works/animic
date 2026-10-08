import { useId, useRef, useState } from "react";
import type { KeyboardEvent, ReactNode, RefObject } from "react";

import { cx } from "../../components/cx";
import { Icon } from "../../components/icon";
import { MAX_WEIGHT, MIN_WEIGHT, draftQuery } from "./prompt-blocks";
import type { PromptToken } from "./prompt-blocks";
import promptFieldStyles from "./prompt-field.module.css";

/** 入力候補の1件。labelMatch・tagMatchは強調する範囲 */
type PromptSuggestion = {
  id: string;
  label: string;
  tag: string;
  genre: string;
  labelMatch: [number, number] | null;
  tagMatch: [number, number] | null;
};

export type PromptFieldProps = {
  /** 入力欄の読み上げ名（例: プロンプト（キャラ1）） */
  label: string;
  tokens: readonly PromptToken[];
  /** 区切りのない書きかけ */
  draft: string;
  onDraftChange: (value: string) => void;
  /** 書きかけをすべて語句にする（Enter・欄を離れたとき） */
  onCommit: () => void;
  placeholder: string;
  /** タグの入力（等幅で出す） */
  tags: boolean;
  disabled: boolean;
  /** 語数（例: 3語（合計 5語）） */
  lengthText: string;
  suggestions: PromptSuggestion[];
  onPick: (id: string) => void;
  /** 語句を書き直しに戻す */
  onEditToken: (index: number) => void;
  /** 空のままBackspaceで、最後の語句を書き直しに戻す */
  onEditLast: () => void;
  onStepWeight: (index: number, direction: 1 | -1) => void;
  onClear: () => void;
  /** ⌘/Ctrl+Enter（生成する） */
  onSubmitShortcut: () => void;
  /** 増えるたびに枠を揺らす（押せない理由を知らせるとき） */
  shakeKey: number;
  inputRef: RefObject<HTMLInputElement | null>;
  /** タブの切り替えと結びつける（role="tabpanel"の属性） */
  panel?: { id: string; labelledBy: string };
};

/** 強調する範囲を<mark>で囲む */
export function Highlight({
  text,
  range,
}: {
  text: string;
  range: [number, number] | null;
}): ReactNode {
  if (!range) return text;
  return (
    <>
      {text.slice(0, range[0])}
      <mark>{text.slice(range[0], range[1])}</mark>
      {text.slice(range[1])}
    </>
  );
}

const formatWeight = (weight: number) => weight.toFixed(1);

// プロンプトの語句の並びと入力欄。書いて「、」で区切ると語句になり、入力候補から選ぶこともできる
export function PromptField({
  label,
  tokens,
  draft,
  onDraftChange,
  onCommit,
  placeholder,
  tags,
  disabled,
  lengthText,
  suggestions,
  onPick,
  onEditToken,
  onEditLast,
  onStepWeight,
  onClear,
  onSubmitShortcut,
  shakeKey,
  inputRef,
  panel,
}: PromptFieldProps) {
  const listId = useId();
  const [focused, setFocused] = useState(false);
  // Escで閉じた入力候補は、次に書くまで出さない
  const [dismissed, setDismissed] = useState(false);
  const [hot, setHot] = useState(0);
  // 日本語の変換中かどうかと、変換中にTabで選んだ候補（変換が終わってから入れる）
  const composing = useRef(false);
  const queued = useRef<string | null>(null);

  const open = focused && !disabled && !dismissed && draftQuery(draft).trim() !== "";
  const listed = open && suggestions.length > 0;
  const hotIndex = Math.min(hot, Math.max(0, suggestions.length - 1));
  const hotSuggestion = listed ? suggestions[hotIndex] : undefined;

  function pick(id: string) {
    setHot(0);
    onPick(id);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const isComposing = event.nativeEvent.isComposing || composing.current;
    if (event.key === "Tab" && hotSuggestion) {
      event.preventDefault();
      if (isComposing) {
        // 変換を終わらせてから候補を入れる。離れたときの確定（onBlur）は飛ばす
        queued.current = hotSuggestion.id;
        input.blur();
        input.focus();
      } else {
        pick(hotSuggestion.id);
      }
      return;
    }
    if (isComposing) return;
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      onSubmitShortcut();
      return;
    }
    if ((event.key === "ArrowDown" || event.key === "ArrowUp") && listed) {
      event.preventDefault();
      const step = event.key === "ArrowDown" ? 1 : suggestions.length - 1;
      setHot((hotIndex + step) % suggestions.length);
      return;
    }
    if (event.key === "Escape" && open) {
      event.preventDefault();
      setDismissed(true);
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      if (hotSuggestion) pick(hotSuggestion.id);
      else onCommit();
      return;
    }
    if (event.key === "Backspace" && !draft && tokens.length > 0) {
      event.preventDefault();
      onEditLast();
    }
  }

  return (
    <div
      className={cx(
        promptFieldStyles.root,
        shakeKey > 0 && (shakeKey % 2 ? promptFieldStyles.shake : promptFieldStyles.shakeAlt),
      )}
      data-tags={tags || undefined}
      data-disabled={disabled || undefined}
      role={panel ? "tabpanel" : undefined}
      id={panel?.id}
      aria-labelledby={panel?.labelledBy}
    >
      <div
        className={promptFieldStyles.tokens}
        onPointerDown={(event) => {
          // 語句の間の余白を押したら、入力欄に移る
          if (event.target !== event.currentTarget || disabled) return;
          event.preventDefault();
          inputRef.current?.focus();
        }}
      >
        {tokens.map((token, index) => {
          const weight = formatWeight(token.weight);
          return (
            <span
              key={token.text}
              className={promptFieldStyles.token}
              data-emphasis={token.weight > 1 ? "up" : token.weight < 1 ? "down" : undefined}
            >
              <button
                type="button"
                className={promptFieldStyles.tokenText}
                aria-label={`「${token.text}」を書き直す（重み ${weight}）`}
                title="押すと書き直せます"
                disabled={disabled}
                onClick={() => onEditToken(index)}
              >
                {token.text}
              </button>
              {token.weight === 1 ? null : (
                <span className={promptFieldStyles.tokenWeight} aria-hidden="true">
                  {weight}
                </span>
              )}
              <span className={promptFieldStyles.tokenControls}>
                <button
                  type="button"
                  aria-label={`「${token.text}」を強くする`}
                  disabled={disabled || token.weight >= MAX_WEIGHT}
                  onClick={() => onStepWeight(index, 1)}
                >
                  <Icon name="plus" size="2xs" />
                </button>
                <button
                  type="button"
                  aria-label={`「${token.text}」を弱くする`}
                  disabled={disabled || token.weight <= MIN_WEIGHT}
                  onClick={() => onStepWeight(index, -1)}
                >
                  <Icon name="minus" size="2xs" />
                </button>
              </span>
            </span>
          );
        })}
        <input
          ref={inputRef}
          className={promptFieldStyles.input}
          type="text"
          role="combobox"
          aria-label={label}
          aria-expanded={listed}
          aria-controls={listed ? listId : undefined}
          aria-autocomplete="list"
          aria-activedescendant={hotSuggestion ? `${listId}-${hotIndex}` : undefined}
          autoComplete="off"
          enterKeyHint="done"
          placeholder={placeholder}
          value={draft}
          disabled={disabled}
          onChange={(event) => {
            setHot(0);
            setDismissed(false);
            onDraftChange(event.target.value);
          }}
          onKeyDown={onKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            if (queued.current === null) onCommit();
          }}
          onCompositionStart={() => {
            composing.current = true;
          }}
          onCompositionEnd={() => {
            composing.current = false;
            const id = queued.current;
            if (id === null) return;
            setTimeout(() => {
              queued.current = null;
              pick(id);
            });
          }}
        />
      </div>
      <div className={promptFieldStyles.tools}>
        <span className={promptFieldStyles.length}>{lengthText}</span>
        <button
          type="button"
          className={promptFieldStyles.clear}
          aria-label="このプロンプトを空にする"
          title="このプロンプトを空にする"
          disabled={disabled || (tokens.length === 0 && !draft)}
          onClick={onClear}
        >
          <Icon name="cross" size="xs" />
        </button>
      </div>
      {open ? (
        <div className={promptFieldStyles.suggest}>
          {listed ? (
            // 候補を押しても入力欄からフォーカスを外さない
            <ul
              id={listId}
              className={promptFieldStyles.suggestList}
              role="listbox"
              aria-label="入力候補"
              onMouseDown={(event) => event.preventDefault()}
            >
              {suggestions.map((suggestion, index) => (
                <li
                  key={suggestion.id}
                  id={`${listId}-${index}`}
                  className={promptFieldStyles.option}
                  role="option"
                  aria-selected={index === hotIndex}
                  data-highlighted={index === hotIndex || undefined}
                  onClick={() => pick(suggestion.id)}
                >
                  <span>
                    <Highlight text={suggestion.label} range={suggestion.labelMatch} />
                  </span>
                  <small>
                    <Highlight text={suggestion.tag} range={suggestion.tagMatch} />
                  </small>
                  <em>{suggestion.genre}</em>
                  {index === hotIndex ? (
                    <kbd className={promptFieldStyles.optionKey}>Tab</kbd>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className={promptFieldStyles.none}>
              候補なし ─ {tags ? "「,」" : "「、」"}で区切ればそのまま入ります
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
