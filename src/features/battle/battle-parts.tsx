import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

import { Avatar } from "../../components/avatar";
import type { AvatarPlayer } from "../../components/avatar";
import { Button } from "../../components/button";
import { variant } from "../../components/cx";
import { Icon } from "../../components/icon";
import { VisuallyHidden } from "../../components/layout";
import { Switch } from "../../components/switch";
import actionRowStyles from "./action-row.module.css";
import artFrameStyles from "./art-frame.module.css";
import battleLayoutStyles from "./battle-layout.module.css";
import compareStyles from "./compare-stage.module.css";
import composePhaseStyles from "./compose-phase.module.css";
import historyStyles from "./history-rail.module.css";
import hudStyles from "./hud.module.css";
import kickoffStyles from "./kickoff.module.css";
import screenOverlayStyles from "./screen-overlay.module.css";

/** 残り時間の見せ方。hurryは残り10秒、selectは生成終了後の画像選択 */
export type HudTone = "normal" | "hurry" | "select";

// 対戦中の上部バー: 左にロゴとルームの情報、中央に残り時間、右にプレイヤーの様子
export function HudBar({
  logoSrc,
  left,
  timer,
  right,
}: {
  logoSrc: string;
  /** ロゴの右に置くルームの情報 */
  left: ReactNode;
  timer: ReactNode;
  right?: ReactNode;
}) {
  return (
    <header className={hudStyles.bar}>
      <div className={hudStyles.left}>
        <img className={hudStyles.logo} src={logoSrc} alt="Animic" width="2078" height="607" />
        {left}
      </div>
      <div className={hudStyles.center}>{timer}</div>
      <div className={hudStyles.right}>{right}</div>
    </header>
  );
}

// 中央の残り時間。数字は1文字ずつ同じ幅の枠に入れる（表示の書体は数字の幅がそろっていないため）
export function HudTimer({ label, value, tone }: { label: string; value: string; tone: HudTone }) {
  return (
    <div className={hudStyles.timer} data-tone={tone} role="timer" aria-live="off">
      <span className={hudStyles.timerLabel}>{label}</span>
      {/* 1文字ずつの枠は読み上げず、残り時間はまとめて読み上げる */}
      <VisuallyHidden>{value}</VisuallyHidden>
      <span className={hudStyles.timerNumber} aria-hidden="true">
        {value.split("").map((char, index) => (
          <span
            // 桁の位置で見分ける（数字が変わっても枠は作り直さない）
            key={index}
            data-colon={char === ":" || undefined}
          >
            {char}
          </span>
        ))}
      </span>
    </div>
  );
}

// 難易度と制限時間（狭い画面では出さない）
export function HudLevelChip({ children }: { children: ReactNode }) {
  return <span className={hudStyles.levelChip}>{children}</span>;
}

// 上部バーの札（ルームコード・条件）。level は難易度と制限時間の札
export function HudChip({ level = false, children }: { level?: boolean; children: ReactNode }) {
  return (
    <span className={hudStyles.chip} data-level={level || undefined}>
      {children}
    </span>
  );
}

// 時間の帯（0〜1）。縞が流れ続け、残りの分だけ右から切り取る
export function HudTrack({ progress, tone }: { progress: number; tone: HudTone }) {
  const clamped = Math.max(0, Math.min(1, progress));
  return (
    <div className={hudStyles.track} data-tone={tone} aria-hidden="true">
      <span className={hudStyles.trackBar} style={{ "--progress": String(clamped) }} />
    </div>
  );
}

// 残り10秒: 画面の縁がピンクに脈打つ
export function HudEdge() {
  return <div className={hudStyles.edge} aria-hidden="true" />;
}

// 右上のプレイヤーの様子
export function HudRoster({ children }: { children: ReactNode }) {
  return (
    <ol className={hudStyles.roster} aria-label="プレイヤーの様子">
      {children}
    </ol>
  );
}

/** 自分の状態。idleは考え中、workingは生成中、doneは提出済み */
export type RosterState = "idle" | "working" | "done";

// ロスターの1人。自分だけ状態と生成回数を出す（相手の状態・回数は配信しないため出さない）
export function RosterMember({
  name,
  player,
  me,
  state,
  stateText,
  count,
}: {
  name: string;
  player: AvatarPlayer;
  me: boolean;
  state?: RosterState;
  stateText?: string;
  count?: number;
}) {
  const label = me ? `${name}（あなた）: ${stateText ?? ""}・生成 ${count ?? 0}回` : name;
  // 状態が変わった瞬間にアバターを弾ませる
  const [bump, setBump] = useState(false);
  const previous = useRef(state);
  useEffect(() => {
    if (previous.current === state) return undefined;
    previous.current = state;
    setBump(true);
    const timer = setTimeout(() => setBump(false), 450);
    return () => clearTimeout(timer);
  }, [state]);
  return (
    <li
      className={hudStyles.member}
      aria-label={label}
      title={label}
      data-me={me || undefined}
      data-state={state}
      data-bump={bump || undefined}
    >
      <span className={hudStyles.memberAvatar} aria-hidden="true">
        <Avatar name={name} player={player} size="sm" decorative />
        <i className={hudStyles.memberBadge} />
      </span>
      <span className={hudStyles.memberMeta} aria-hidden="true">
        <span className={hudStyles.memberName}>{name}</span>
        {state ? (
          <span className={hudStyles.memberState}>
            {stateText}
            {state === "working" ? (
              <span className={hudStyles.dots}>
                <i />
                <i />
                <i />
              </span>
            ) : null}
            ・{count ?? 0}回
          </span>
        ) : null}
      </span>
    </li>
  );
}

// 本体: 左にプロンプト、右に比較。PCでは1画面に収める
export function BattleLayout({ children }: { children: ReactNode }) {
  return <main className={battleLayoutStyles.root}>{children}</main>;
}

// 白いパネル（プロンプトのパネルは image-generation 側で同じ土台を持つ）
export function BattlePanel({
  area,
  labelledBy,
  children,
}: {
  area: "stage";
  labelledBy: string;
  children: ReactNode;
}) {
  return (
    <section className={battleLayoutStyles.panel} data-area={area} aria-labelledby={labelledBy}>
      {children}
    </section>
  );
}

// 見出しの右端の案内（提出候補を選ぶとピンク）
export function StageHint({ ready, children }: { ready: boolean; children: ReactNode }) {
  return (
    <span className={compareStyles.hint} data-ready={ready || undefined}>
      {children}
    </span>
  );
}

// お題とあなたの画像を横に並べる
export function CompareStage({ children }: { children: ReactNode }) {
  return <div className={compareStyles.compare}>{children}</div>;
}

// あなたの画像の枠（お題と同じ縦長）とラベル
export function CompareItem({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <figure className={compareStyles.item} data-kind="mine">
      <div className={compareStyles.frame}>{children}</div>
      <figcaption className={compareStyles.label}>{label}</figcaption>
    </figure>
  );
}

/** お題の見せ方。veiledは伏せた札、flipは裏返して表へ */
export type TopicReveal = "none" | "veiled" | "flip";

// お題の枠。押すと拡大して全体を見られる。対戦の開始直後は伏せた札から裏返す
export function TopicItem({
  src,
  alt,
  label,
  reveal,
  onZoom,
  onRevealEnd,
}: {
  src: string;
  alt: string;
  label: ReactNode;
  reveal: TopicReveal;
  onZoom: () => void;
  /** 裏返しが終わった */
  onRevealEnd: () => void;
}) {
  return (
    <figure className={compareStyles.item} data-kind="topic">
      <button
        type="button"
        className={compareStyles.frame}
        data-reveal={reveal}
        aria-label="お題を拡大して全体を見る"
        disabled={reveal === "veiled"}
        onClick={onZoom}
        onAnimationEnd={(event) => {
          if (event.target === event.currentTarget && reveal === "flip") onRevealEnd();
        }}
      >
        <img className={compareStyles.topicImage} src={src} alt={alt} />
        <span className={compareStyles.zoomHint} aria-hidden="true">
          <Icon name="search" size="md" />
        </span>
        {reveal === "veiled" ? (
          <span className={compareStyles.cardBack} aria-hidden="true">
            <img src="/favicon.svg" alt="" width="64" height="64" />
            <span className={compareStyles.cardBackLabel}>Topic image</span>
          </span>
        ) : null}
      </button>
      <figcaption className={compareStyles.label}>{label}</figcaption>
    </figure>
  );
}

// ラベルの補足（#3・白背景・1キャラクター）
export function CompareNote({ children }: { children: ReactNode }) {
  return <small className={compareStyles.note}>{children}</small>;
}

// 難易度の黒い札（EASY など）
export function LevelBadge({ children }: { children: ReactNode }) {
  return <span className={compareStyles.badge}>{children}</span>;
}

// 選んでいる画像。fresh はできあがった直後（3色の帯が駆け抜けて現れる）。key を画像ごとに変えて使う
export function StageImage({ src, alt, fresh }: { src: string; alt: string; fresh: boolean }) {
  const [sweeping, setSweeping] = useState(fresh);
  return (
    <>
      <img
        className={compareStyles.stageImage}
        data-motion={fresh ? "land" : "switch"}
        src={src}
        alt={alt}
      />
      {sweeping ? (
        <span
          className={compareStyles.reveal}
          aria-hidden="true"
          onAnimationEnd={(event) => {
            if (event.target === event.currentTarget.lastElementChild) setSweeping(false);
          }}
        >
          <span />
          <span />
          <span />
        </span>
      ) : null}
    </>
  );
}

// まだ画像がないとき: 点線の人影とメッセージ
export function StageEmpty({ title, sub }: { title: string; sub: string }) {
  return (
    <div className={compareStyles.empty}>
      <svg
        className={compareStyles.emptyFigure}
        viewBox="0 0 120 120"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeDasharray="7 6"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <circle cx="60" cy="46" r="24" />
        <path d="M20 112c3-24 20-36 40-36s37 12 40 36" />
      </svg>
      <p className={compareStyles.emptyText}>
        <span className={compareStyles.emptyTitle}>{title}</span>
        <span className={compareStyles.emptySub}>{sub}</span>
      </p>
    </div>
  );
}

// 生成中: 途中の絵は取得できないので、回るリングと番号だけを出す
export function StageGenerating({ number }: { number: number }) {
  return (
    <div className={compareStyles.generating} role="img" aria-label="生成中の画像">
      <span className={compareStyles.spinner} />
      <span className={compareStyles.generatingLabel} aria-hidden="true">
        <span>GENERATING</span>
        <span>#{number}</span>
      </span>
    </div>
  );
}

// 選んだ画像を出している間に、次の1枚を生成中であることを示す札
export function GenMini({ children }: { children: ReactNode }) {
  return (
    <span className={compareStyles.genMini} aria-hidden="true">
      <span className={compareStyles.genMiniRing} />
      {children}
    </span>
  );
}

// 右の列: 生成した画像の履歴（新しい順）と提出
export function HistoryRail({
  empty,
  submit,
  children,
}: {
  empty: boolean;
  submit: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className={historyStyles.rail}>
      <section className={historyStyles.history} aria-labelledby="history-title">
        <h3 id="history-title" className={historyStyles.title}>
          履歴 <span className={historyStyles.eyebrow}>History</span>
        </h3>
        {empty ? (
          <p className={historyStyles.empty}>生成した画像がここに並びます</p>
        ) : (
          <ol className={historyStyles.shots} aria-label="生成した画像">
            {children}
          </ol>
        )}
      </section>
      {submit}
    </div>
  );
}

// 生成した1枚。押すと提出する候補として選ぶ
export function HistoryShot({
  number,
  src,
  selected,
  disabled,
  onSelect,
}: {
  number: number;
  src: string;
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        className={historyStyles.shot}
        aria-pressed={selected}
        aria-label={`${number}回目の画像`}
        disabled={disabled}
        onClick={onSelect}
      >
        <img className={historyStyles.image} src={src} alt="" />
        <span className={historyStyles.number} aria-hidden="true">
          #{number}
        </span>
        <span className={historyStyles.check} aria-hidden="true">
          <Icon name="check" size="xs" />
        </span>
      </button>
    </li>
  );
}

export function HistoryPending({ number }: { number: number }) {
  return (
    <li>
      <div
        className={historyStyles.shot}
        data-state="pending"
        role="status"
        aria-label={`${number}回目を生成中`}
      >
        <span className={historyStyles.spinner} />
      </div>
    </li>
  );
}

export function HistoryFailed({ number }: { number: number }) {
  return (
    <li>
      <div
        className={historyStyles.shot}
        data-state="failed"
        role="img"
        aria-label={`${number}回目は生成に失敗しました`}
      >
        <Icon name="warning" size="lg" />
        <span aria-hidden="true">失敗</span>
      </div>
    </li>
  );
}

// 「確認なしですぐ提出」と「この1枚で提出」
export function SubmitBox({
  quick,
  onQuickChange,
  disabled,
  loading,
  onSubmit,
}: {
  quick: boolean;
  onQuickChange: (next: boolean) => void;
  disabled: boolean;
  loading: boolean;
  onSubmit: () => void;
}) {
  return (
    <div className={historyStyles.submitBox}>
      <Switch
        label="確認なしですぐ提出"
        tone="accent"
        title="オンにすると、確認を出さずにすぐ提出します"
        checked={quick}
        onCheckedChange={onQuickChange}
      />
      <div className={historyStyles.submitButton} data-ready={!disabled || undefined}>
        <Button
          size="lg"
          fullWidth
          disabled={disabled}
          loading={loading}
          loadingText="提出しています…"
          leadingIcon={<Icon name="check" size="md" />}
          onClick={onSubmit}
        >
          この1枚で提出
        </Button>
      </div>
    </div>
  );
}

// 提出の確認に置く「次からは確認せずにすぐ提出する」の行（中央に置く）
export function ConfirmOption({ children }: { children: ReactNode }) {
  return <div className={historyStyles.confirmOption}>{children}</div>;
}

// 生成終了後の案内: もう使わないプロンプトのパネルを、注意テープ柄の黄色いカードで覆う。
// seconds を省くと、生成中の画像の完成を待つ間の表示にする。empty は提出できる画像がないときの表示
export function ComposePhase({ seconds, empty = false }: { seconds?: number; empty?: boolean }) {
  return (
    <div className={composePhaseStyles.root} role="status">
      <span className={composePhaseStyles.eyebrow}>Time up</span>
      <span className={composePhaseStyles.title}>{empty ? "時間切れ" : "生成終了！"}</span>
      {empty ? (
        <span className={composePhaseStyles.note}>提出できる画像がありません</span>
      ) : seconds === undefined ? (
        <span className={composePhaseStyles.note}>生成中の画像の完成を待っています</span>
      ) : (
        <>
          {/* 残り秒数は上部のタイマーでも読めるため、毎秒の読み上げは避ける */}
          <span className={composePhaseStyles.count} aria-hidden="true">
            残り<b>{seconds}</b>秒で1枚提出
          </span>
          <span className={composePhaseStyles.note}>
            履歴から選んで「この1枚で提出」
            <span className={composePhaseStyles.arrow} aria-hidden="true">
              <Icon name="arrowRight" size="2xs" />
            </span>
            <br />
            生成中の画像も、完成すれば選べます
          </span>
        </>
      )}
    </div>
  );
}

// 開始の合図: 3色の帯とともに「START!」
export function KickoffBand() {
  return (
    <div className={kickoffStyles.root} aria-hidden="true">
      <span className={kickoffStyles.band} />
      <span className={kickoffStyles.text}>
        <b>START!</b>
        <span>お題にいちばん近い1枚を作ろう</span>
      </span>
    </div>
  );
}

// 提出後など、操作を止めて結果を待つ間の全面表示。children は見出しの上、footer は下に置く
export function ScreenOverlay({
  eyebrow,
  title,
  sub,
  children,
  footer,
}: {
  eyebrow?: string;
  title: string;
  sub: string;
  children?: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className={screenOverlayStyles.root} role="status" aria-live="polite">
      <div className={screenOverlayStyles.bands} aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className={screenOverlayStyles.body}>
        {children}
        {eyebrow ? <p className={screenOverlayStyles.eyebrow}>{eyebrow}</p> : null}
        <h2 className={screenOverlayStyles.title}>{title}</h2>
        <p className={screenOverlayStyles.sub}>{sub}</p>
        {footer}
      </div>
    </div>
  );
}

// 提出した画像のカードと「提出済み」のスタンプ
export function OverlayCard({ src, stamp }: { src: string; stamp?: string }) {
  return (
    <div className={screenOverlayStyles.card} aria-hidden="true">
      <img src={src} alt="" />
      {stamp ? <span className={screenOverlayStyles.stamp}>{stamp}</span> : null}
    </div>
  );
}

// 提出後: 相手の提出を待つ行（未提出の人は半透明）
export function OverlayWaitRow({
  members,
  children,
}: {
  members: { id: string; name: string; player: AvatarPlayer; done: boolean }[];
  children: ReactNode;
}) {
  return (
    <div className={screenOverlayStyles.waitRow}>
      <span className={screenOverlayStyles.waitAvatars} aria-hidden="true">
        {members.map((member) => (
          <span
            key={member.id}
            className={screenOverlayStyles.waitAvatar}
            data-done={member.done || undefined}
          >
            <Avatar name={member.name} player={member.player} size="sm" decorative />
          </span>
        ))}
      </span>
      <span>{children}</span>
    </div>
  );
}

type ArtFrameVariant = "topicResult" | "submission" | "missing" | "confirm" | "zoom";

// お題・提出画像の額縁
export function ArtFrame({
  variant: frameVariant,
  tag,
  children,
}: {
  variant: ArtFrameVariant;
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

// 主な操作と副次的な操作を中央に横に並べる
export function ActionRow({ children }: { children: ReactNode }) {
  return <div className={actionRowStyles.root}>{children}</div>;
}
