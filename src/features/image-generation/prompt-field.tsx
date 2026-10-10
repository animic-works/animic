import type { ReactNode, RefObject } from "react";
import { IconButton } from "@animic/react/icon-button";
import { Text } from "@animic/react/text";
import { AdjustableToken, TokenInput } from "@animic/react/token-input";
import { MAX_WEIGHT, MIN_WEIGHT } from "./prompt-blocks";
import type { PromptToken } from "./prompt-blocks";
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
  onDraftChange: (value: string, composing: boolean) => void;
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
  inputRef: RefObject<HTMLInputElement | null>;
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

export function PromptField(props: PromptFieldProps) {
  return (
    <TokenInput
      label={props.label}
      value={props.draft}
      inputRef={props.inputRef}
      disabled={props.disabled}
      placeholder={props.placeholder}
      font={props.tags ? "code" : "body"}
      onValueChange={props.onDraftChange}
      onCommit={props.onCommit}
      commitOnBlur
      onEmptyBackspace={props.onEditLast}
      onSubmitShortcut={props.onSubmitShortcut}
      onSuggestion={props.onPick}
      suggestions={props.suggestions.map((suggestion) => ({
        value: suggestion.id,
        label: suggestion.label,
        labelContent: <Highlight text={suggestion.label} range={suggestion.labelMatch} />,
        description: <Highlight text={suggestion.tag} range={suggestion.tagMatch} />,
        detail: suggestion.genre,
      }))}
      empty={`候補なし ─ ${props.tags ? "「,」" : "「、」"}で区切ればそのまま入ります`}
      footer={
        <>
          <Text variant="caption" tone="muted">
            {props.lengthText}
          </Text>
          <IconButton
            size="xs"
            appearance="quiet"
            label="このプロンプトを空にする"
            disabled={props.disabled || (!props.tokens.length && !props.draft)}
            onClick={props.onClear}
          >
            ×
          </IconButton>
        </>
      }
    >
      {props.tokens.map((token, index) => (
        <AdjustableToken
          key={token.text}
          label={token.text}
          valueLabel={`重み ${token.weight.toFixed(1)}`}
          font={props.tags ? "code" : "body"}
          value={token.weight !== 1 ? token.weight.toFixed(1) : undefined}
          emphasis={token.weight > 1 ? "strong" : token.weight < 1 ? "weak" : "normal"}
          disabled={props.disabled}
          increaseDisabled={token.weight >= MAX_WEIGHT}
          decreaseDisabled={token.weight <= MIN_WEIGHT}
          onIncrease={() => props.onStepWeight(index, 1)}
          onDecrease={() => props.onStepWeight(index, -1)}
          onEdit={() => props.onEditToken(index)}
        />
      ))}
    </TokenInput>
  );
}
