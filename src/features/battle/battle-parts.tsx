import type { ReactNode } from "react";

import { configVariant, cx, variant } from "../../components/cx";
import { Icon } from "../../components/icon";
import spinnerStyles from "../../components/spinner.module.css";
import topBarStyles from "../../components/top-bar.module.css";
import actionRowStyles from "./action-row.module.css";
import artFrameStyles from "./art-frame.module.css";
import battleLayoutStyles from "./battle-layout.module.css";
import hudStyles from "./hud.module.css";
import panelHeadStyles from "./panel-head.module.css";
import screenOverlayStyles from "./screen-overlay.module.css";
import shotGridStyles from "./shot-grid.module.css";

// 対戦中の上部バー: 左にロゴとルームの情報、中央に残り時間。上に貼り付く
export function HudBar({
  logoSrc,
  left,
  timer,
}: {
  logoSrc: string;
  /** ロゴの右に置くルームの情報 */
  left: ReactNode;
  timer: ReactNode;
}) {
  return (
    <header className={variant(topBarStyles, "root", { variant: "sticky" })}>
      <div className={hudStyles.left}>
        <img
          className={variant(topBarStyles, "logo", { variant: "sticky" })}
          src={logoSrc}
          alt="Animic"
          width="2078"
          height="607"
        />
        {left}
      </div>
      {timer}
    </header>
  );
}

// 中央の残り時間
export function HudTimer({
  label,
  value,
  hurry = false,
}: {
  label: string;
  value: string;
  hurry?: boolean;
}) {
  return (
    <div className={hudStyles.timer} role="timer" aria-live="off">
      <span className={hudStyles.timerLabel}>{label}</span>
      <span className={hudStyles.timerNumber} data-hurry={hurry || undefined}>
        {value}
      </span>
    </div>
  );
}

// 難易度と制限時間（狭い画面では出さない）
export function HudLevelChip({ children }: { children: ReactNode }) {
  return <span className={hudStyles.levelChip}>{children}</span>;
}

// 上部バーの札（ルームコード・条件）。level は難易度と制限時間の水色の札
export function HudChip({ level = false, children }: { level?: boolean; children: ReactNode }) {
  return (
    <span className={hudStyles.chip} data-level={level || undefined}>
      {children}
    </span>
  );
}

// 時間の帯（0〜1）
export function HudTrack({ progress }: { progress: number }) {
  const clamped = Math.max(0, Math.min(1, progress));
  return (
    <div className={hudStyles.track} aria-hidden="true">
      <span className={hudStyles.trackBar} style={{ "--progress": String(clamped) }} />
    </div>
  );
}

// 生成終了後の案内
export function HudPhase({ children }: { children: ReactNode }) {
  return (
    <p className={hudStyles.phase} role="status">
      {children}
    </p>
  );
}

export function HudPhaseStrong({ children }: { children: ReactNode }) {
  return <b className={hudStyles.phaseStrong}>{children}</b>;
}

export function BattleLayout({ children }: { children: ReactNode }) {
  return <main className={battleLayoutStyles.root}>{children}</main>;
}

// 列。side は狭い画面でお題と状況を横に並べる
export function BattleColumn({ side = false, children }: { side?: boolean; children: ReactNode }) {
  return (
    <div className={battleLayoutStyles.column} data-side={side || undefined}>
      {children}
    </div>
  );
}

// パネルの見出しと、右端の補足や操作
export function PanelHead({
  title,
  titleId,
  note,
  children,
}: {
  title: string;
  titleId: string;
  note?: string;
  children?: ReactNode;
}) {
  return (
    <div className={panelHeadStyles.root}>
      <h2 id={titleId} className={panelHeadStyles.title}>
        {title}
      </h2>
      {note ? <small className={panelHeadStyles.note}>{note}</small> : children}
    </div>
  );
}

type ArtFrameVariant = "topic" | "topicResult" | "submission" | "missing" | "confirm";

// お題・提出画像の額縁
export function ArtFrame({
  variant: frameVariant = "topic",
  tag,
  children,
}: {
  variant?: ArtFrameVariant;
  /** 左上の札（THEME など） */
  tag?: string;
  children: ReactNode;
}) {
  return (
    <figure className={variant(artFrameStyles, "figure", { variant: frameVariant })}>
      {children}
      {tag ? <span className={artFrameStyles.tag}>{tag}</span> : null}
    </figure>
  );
}

export function ArtImage({ src, alt }: { src: string; alt: string }) {
  return <img className={artFrameStyles.image} src={src} alt={alt} />;
}

export function ArtMissing({ children }: { children: ReactNode }) {
  return <span className={artFrameStyles.missing}>{children}</span>;
}

export function ShotGrid({ children }: { children: ReactNode }) {
  return <ol className={shotGridStyles.grid}>{children}</ol>;
}

export function ShotEmpty({ children }: { children: ReactNode }) {
  return <li className={shotGridStyles.empty}>{children}</li>;
}

// 生成した1枚。押すと提出する候補として選ぶ
export function ShotButton({
  number,
  selected,
  disabled = false,
  onSelect,
  children,
}: {
  number: number;
  selected: boolean;
  disabled?: boolean;
  onSelect: () => void;
  children: ReactNode;
}) {
  return (
    <li>
      <button
        type="button"
        className={shotGridStyles.shot}
        aria-pressed={selected}
        aria-label={`${number}回目の画像`}
        disabled={disabled}
        onClick={onSelect}
      >
        {children}
        <span className={shotGridStyles.number} aria-hidden="true">
          #{number}
        </span>
        <span className={shotGridStyles.check} aria-hidden="true">
          <Icon name="check" size="sm" />
        </span>
      </button>
    </li>
  );
}

export function ShotImage({ src, alt }: { src: string; alt: string }) {
  return <img className={shotGridStyles.image} src={src} alt={alt} />;
}

export function ShotPending() {
  return (
    <li>
      <div className={shotGridStyles.pending} role="status">
        <span className={configVariant(spinnerStyles, { size: "sm" })} aria-hidden="true" />
        生成中…
      </div>
    </li>
  );
}

export function ShotFailed() {
  return (
    <li>
      <div className={shotGridStyles.failed}>生成に失敗しました</div>
    </li>
  );
}

export function SubmitRow({ note, children }: { note: string; children: ReactNode }) {
  return (
    <div className={shotGridStyles.submitRow}>
      <p className={shotGridStyles.submitNote}>{note}</p>
      {children}
    </div>
  );
}

// 提出後・採点中など、操作を止めて待つ間の表示
export function ScreenOverlay({ title, sub }: { title: string; sub: string }) {
  return (
    <div className={screenOverlayStyles.root} role="status" aria-live="polite">
      <span
        className={cx(screenOverlayStyles.spinner, configVariant(spinnerStyles, { size: "md" }))}
        aria-hidden="true"
      />
      <h2 className={screenOverlayStyles.title}>{title}</h2>
      <p className={screenOverlayStyles.sub}>{sub}</p>
    </div>
  );
}

// 主な操作と副次的な操作を中央に横に並べる
export function ActionRow({ children }: { children: ReactNode }) {
  return <div className={actionRowStyles.root}>{children}</div>;
}
