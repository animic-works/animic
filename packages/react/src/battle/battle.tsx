import {
  actionRow,
  artFrame,
  battleLayout,
  hud,
  panelHead,
  promptComposer,
  screenOverlay,
  shotGrid,
  spinner,
  topBar,
  versusList,
} from "@animic/styled-system/recipes";
import type { ArtFrameVariantProps } from "@animic/styled-system/recipes";
import type { ReactNode, Ref, TextareaHTMLAttributes } from "react";

import { Avatar } from "../avatar/avatar";
import type { AvatarPlayer } from "../avatar/avatar";
import { Icon } from "../icon/icon";

export type HudBarProps = {
  logoSrc: string;
  /** ロゴの右に置くルームの情報 */
  left: ReactNode;
  timer: ReactNode;
  /** 右端の相手の状況 */
  right: ReactNode;
};

// 対戦中の上部バー: 左にロゴとルームの情報、中央に残り時間、右に相手の状況。上に貼り付く
export function HudBar({ logoSrc, left, timer, right }: HudBarProps) {
  const bar = topBar({ variant: "sticky" });
  const classes = hud();
  return (
    <header className={bar.root}>
      <div className={classes.left}>
        <img className={bar.logo} src={logoSrc} alt="Animic" width="2078" height="607" />
        {left}
      </div>
      {timer}
      <div className={classes.right}>{right}</div>
    </header>
  );
}

export type HudTimerProps = { label: string; value: string; hurry?: boolean };

// 中央の残り時間
export function HudTimer({ label, value, hurry = false }: HudTimerProps) {
  const classes = hud();
  return (
    <div className={classes.timer} role="timer" aria-live="off">
      <span className={classes.timerLabel}>{label}</span>
      <span className={classes.timerNumber} data-hurry={hurry || undefined}>
        {value}
      </span>
    </div>
  );
}

// 難易度と制限時間（狭い画面では出さない）
export function HudLevelChip({ children }: { children: ReactNode }) {
  return <span className={hud().levelChip}>{children}</span>;
}

// 上部バーの札（ルームコード・条件・相手の状況）。level は難易度と制限時間の水色の札
export function HudChip({ level = false, children }: { level?: boolean; children: ReactNode }) {
  return (
    <span className={hud().chip} data-level={level || undefined}>
      {children}
    </span>
  );
}

// 時間の帯（0〜1）
export function HudTrack({ progress }: { progress: number }) {
  const classes = hud();
  const clamped = Math.max(0, Math.min(1, progress));
  return (
    <div className={classes.track} aria-hidden="true">
      <span className={classes.trackBar} style={{ "--progress": String(clamped) }} />
    </div>
  );
}

// 生成終了後の案内
export function HudPhase({ children }: { children: ReactNode }) {
  return (
    <p className={hud().phase} role="status">
      {children}
    </p>
  );
}

export function HudPhaseStrong({ children }: { children: ReactNode }) {
  return <b className={hud().phaseStrong}>{children}</b>;
}

export function BattleLayout({ children }: { children: ReactNode }) {
  return <main className={battleLayout().root}>{children}</main>;
}

// 列。side は狭い画面でお題と状況を横に並べる
export function BattleColumn({ side = false, children }: { side?: boolean; children: ReactNode }) {
  return (
    <div className={battleLayout().column} data-side={side || undefined}>
      {children}
    </div>
  );
}

export type PanelHeadProps = {
  title: string;
  titleId: string;
  note?: string;
  children?: ReactNode;
};

// パネルの見出しと、右端の補足や操作
export function PanelHead({ title, titleId, note, children }: PanelHeadProps) {
  const classes = panelHead();
  return (
    <div className={classes.root}>
      <h2 id={titleId} className={classes.title}>
        {title}
      </h2>
      {note ? <small className={classes.note}>{note}</small> : children}
    </div>
  );
}

export type ArtFrameProps = ArtFrameVariantProps & {
  /** 左上の札（THEME など） */
  tag?: string;
  children: ReactNode;
};

// お題・提出画像の額縁
export function ArtFrame({ variant, tag, children }: ArtFrameProps) {
  const classes = artFrame({ variant });
  return (
    <figure className={classes.figure}>
      {children}
      {tag ? <span className={classes.tag}>{tag}</span> : null}
    </figure>
  );
}

export function ArtImage({ src, alt }: { src: string; alt: string }) {
  return <img className={artFrame().image} src={src} alt={alt} />;
}

export function ArtMissing({ children }: { children: ReactNode }) {
  return <span className={artFrame().missing}>{children}</span>;
}

export function VersusList({ children }: { children: ReactNode }) {
  return <ul className={versusList().list}>{children}</ul>;
}

export type VersusRowProps = {
  name: string;
  player: AvatarPlayer;
  note: string;
  state: "idle" | "working" | "done";
  stateText: string;
};

// 対戦状況の1行
export function VersusRow({ name, player, note, state, stateText }: VersusRowProps) {
  const classes = versusList();
  return (
    <li className={classes.row}>
      <Avatar name={name} player={player} size="row" decorative />
      <span className={classes.name}>
        {name}
        <small className={classes.note}>{note}</small>
      </span>
      <span className={classes.state} data-state={state}>
        {stateText}
      </span>
    </li>
  );
}

export type PromptTextareaProps = Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  "className" | "style"
> & {
  /** Danbooruタグの入力（等幅にする） */
  tags?: boolean;
  ref?: Ref<HTMLTextAreaElement>;
};

export function PromptTextarea({ tags = false, ref, ...rest }: PromptTextareaProps) {
  return (
    <textarea
      {...rest}
      ref={ref}
      className={promptComposer().textarea}
      data-tags={tags || undefined}
    />
  );
}

export type ChipRow = { label: string; words: string[] };

export type PromptChipsProps = {
  rows: ChipRow[];
  disabled?: boolean;
  onPick: (word: string) => void;
};

// よく使う表現
export function PromptChips({ rows, disabled = false, onPick }: PromptChipsProps) {
  const classes = promptComposer();
  return (
    <div className={classes.chips} role="group" aria-label="よく使う表現">
      {rows.map((row) => (
        <div key={row.label} className={classes.chipRow}>
          <span className={classes.chipLabel}>{row.label}</span>
          {row.words.map((word) => (
            <button
              key={word}
              type="button"
              className={classes.chip}
              disabled={disabled}
              onClick={() => onPick(word)}
            >
              {word}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

export type PromptFootProps = { count: number; limit?: number | null; children: ReactNode };

// 生成回数と生成ボタン
export function PromptFoot({ count, limit, children }: PromptFootProps) {
  const classes = promptComposer();
  return (
    <div className={classes.foot}>
      <span className={classes.count}>
        生成 <b className={classes.countNumber}>{count}</b>
        {limit ? ` / ${limit}` : ""} 回
      </span>
      {children}
    </div>
  );
}

export function ShotGrid({ children }: { children: ReactNode }) {
  return <ol className={shotGrid().grid}>{children}</ol>;
}

export function ShotEmpty({ children }: { children: ReactNode }) {
  return <li className={shotGrid().empty}>{children}</li>;
}

export type ShotButtonProps = {
  number: number;
  selected: boolean;
  disabled?: boolean;
  onSelect: () => void;
  children: ReactNode;
};

// 生成した1枚。押すと提出する候補として選ぶ
export function ShotButton({
  number,
  selected,
  disabled = false,
  onSelect,
  children,
}: ShotButtonProps) {
  const classes = shotGrid();
  return (
    <li>
      <button
        type="button"
        className={classes.shot}
        aria-pressed={selected}
        aria-label={`${number}回目の画像`}
        disabled={disabled}
        onClick={onSelect}
      >
        {children}
        <span className={classes.number} aria-hidden="true">
          #{number}
        </span>
        <span className={classes.check} aria-hidden="true">
          <Icon name="check" size="sm" />
        </span>
      </button>
    </li>
  );
}

export function ShotImage({ src, alt }: { src: string; alt: string }) {
  return <img className={shotGrid().image} src={src} alt={alt} />;
}

export function ShotPending() {
  const classes = shotGrid();
  return (
    <li>
      <div className={classes.pending} role="status">
        <span className={spinner()} aria-hidden="true" />
        生成中…
      </div>
    </li>
  );
}

export function ShotFailed() {
  return (
    <li>
      <div className={shotGrid().failed}>生成に失敗しました</div>
    </li>
  );
}

export function SubmitRow({ note, children }: { note: string; children: ReactNode }) {
  const classes = shotGrid();
  return (
    <div className={classes.submitRow}>
      <p className={classes.submitNote}>{note}</p>
      {children}
    </div>
  );
}

export type ScreenOverlayProps = { title: string; sub: string; busy?: boolean };

// 提出後・採点中など、操作を止めて待つ間の表示
export function ScreenOverlay({ title, sub, busy = true }: ScreenOverlayProps) {
  const classes = screenOverlay();
  return (
    <div className={classes.root} role="status" aria-live="polite">
      {busy ? (
        <span className={classes.spinner + " " + spinner({ size: "md" })} aria-hidden="true" />
      ) : null}
      <h2 className={classes.title}>{title}</h2>
      <p className={classes.sub}>{sub}</p>
    </div>
  );
}

// 主な操作と副次的な操作を中央に横に並べる
export function ActionRow({ children }: { children: ReactNode }) {
  return <div className={actionRow()}>{children}</div>;
}
