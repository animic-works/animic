import { QrCode } from "@ark-ui/react/qr-code";
import {
  countdownOverlay,
  goPanel,
  inviteCard,
  levelArt,
  lobbyLayout,
  playerBoard,
  readyStatus,
  rulesList,
  topBar,
  waitingList,
} from "@animic/styled-system/recipes";
import type { RulesListVariantProps } from "@animic/styled-system/recipes";
import type { ReactNode } from "react";

import { Avatar } from "../avatar/avatar";
import type { AvatarPlayer } from "../avatar/avatar";
import { Button } from "../button/button";
import { Icon } from "../icon/icon";

// ロビーの2列（プレイヤー・ルール）
export function LobbyLayout({ children }: { children: ReactNode }) {
  return <main className={lobbyLayout().root}>{children}</main>;
}

// 左の列: プレイヤーのカードと、広い画面ではその下の退出
export function LobbyColumn({ children }: { children: ReactNode }) {
  return <div className={lobbyLayout().column}>{children}</div>;
}

export type LeaveButtonProps = {
  /** bar: 上のバー（1列の画面では文字、スマホではアイコンだけ） / column: プレイヤーのカードの下（広い画面だけ） */
  placement: "bar" | "column";
  disabled?: boolean;
  onClick: () => void;
};

// 退出。置き場所ごとに見せ方が変わり、画面の幅に応じてどちらか一方だけが見える
export function LeaveButton({ placement, disabled, onClick }: LeaveButtonProps) {
  if (placement === "column") {
    return (
      <button type="button" className={lobbyLayout().leave} disabled={disabled} onClick={onClick}>
        退出
      </button>
    );
  }
  return (
    <button type="button" className={topBar().leave} disabled={disabled} onClick={onClick}>
      <span data-part="icon" aria-hidden="true">
        <Icon name="exit" size="xl" />
      </span>
      <span data-part="label">退出</span>
    </button>
  );
}

export type RoomChipProps = { code: string; onCopy: () => void };

// スマホの上のバーの中央: ルームコードのチップ（押すとコピー）
export function RoomChip({ code, onCopy }: RoomChipProps) {
  const classes = topBar();
  return (
    <button type="button" className={classes.room} onClick={onCopy}>
      <span className={classes.roomLabel}>ルーム</span>
      <span className={classes.roomCode}>{code}</span>
    </button>
  );
}

export type PlayerBoardHeadProps = {
  code: string;
  onInvite: () => void;
  /** スマホのチップを押したときにコードをコピーする */
  onCopy: () => void;
  /** 8マスのコード（CodeDisplay。スマホでは出さない） */
  children: ReactNode;
};

// プレイヤーのカードの上部: ルームコードと招待。スマホでは8マスの代わりに、タップでコピーできる1行のチップ
export function PlayerBoardHead({ code, onInvite, onCopy, children }: PlayerBoardHeadProps) {
  const classes = playerBoard();
  return (
    <div className={classes.head}>
      <div className={classes.roomCard}>
        <span className={classes.roomLabel}>ルームコード</span>
        <span className={classes.codeCells}>{children}</span>
        <button
          type="button"
          className={classes.codeChip}
          aria-label="ルームコードをコピー"
          onClick={onCopy}
        >
          <span className={classes.codeChipText}>{code}</span>
          <span className={classes.codeChipIcon} aria-hidden="true">
            <Icon name="copy" size="lg" />
          </span>
        </button>
        <Button
          size="sm"
          leadingIcon={<Icon name="userPlus" size="md" />}
          onClick={onInvite}
          aria-describedby={`room-code-${code}`}
        >
          招待する
        </Button>
      </div>
    </div>
  );
}

export type PlayerTitleRowProps = {
  count: number;
  max: number;
  titleId: string;
  children: ReactNode;
};

// 「プレイヤー 1 / 8」と準備の状況
export function PlayerTitleRow({ count, max, titleId, children }: PlayerTitleRowProps) {
  const classes = playerBoard();
  return (
    <div className={classes.titleRow}>
      <h2 id={titleId} className={classes.title}>
        プレイヤー{" "}
        <span className={classes.count} aria-live="polite">
          {count}
          <small className={classes.countTotal}> / {max}</small>
        </span>
      </h2>
      {children}
    </div>
  );
}

export type ReadyStatusProps = { ready: number; total: number };

// 準備OKの人数（全員そろったら緑）
export function ReadyStatus({ ready, total }: ReadyStatusProps) {
  return (
    <p className={readyStatus({ all: total >= 2 && ready === total })} aria-live="polite">
      準備OK{" "}
      <b>
        {ready} / {total}
      </b>
      人
    </p>
  );
}

export function PlayerGrid({ children }: { children: ReactNode }) {
  return <ul className={playerBoard().grid}>{children}</ul>;
}

export function PlayerSlot({ children }: { children: ReactNode }) {
  return <li className={playerBoard().slot}>{children}</li>;
}

export type PlayerTileProps = {
  name: string;
  player: AvatarPlayer;
  isMe?: boolean;
  isHost?: boolean;
  ready: boolean;
  /** 切断中（準備の代わりに出す） */
  disconnected?: boolean;
  /** 入ってきたばかり（弾ませる） */
  joined?: boolean;
  /** 自分の枠だけ: 「表示名を変更」を押したとき */
  onEdit?: () => void;
};

// 参加者1人の枠（スマホでは一覧の行）
export function PlayerTile({
  name,
  player,
  isMe = false,
  isHost = false,
  ready,
  disconnected = false,
  joined = false,
  onEdit,
}: PlayerTileProps) {
  const classes = playerBoard();
  return (
    <div
      className={classes.player}
      data-me={isMe || undefined}
      data-joined={joined || undefined}
      data-editable={onEdit ? "" : undefined}
    >
      {isHost ? (
        <span className={classes.tag}>ホスト</span>
      ) : isMe ? (
        <span className={classes.tag} data-me="">
          あなた
        </span>
      ) : null}
      <span className={classes.avatar}>
        <Avatar name={name} player={player} size="tile" decorative />
      </span>
      <b className={classes.name}>
        {name}
        {isMe && isHost ? <small className={classes.nameNote}>（あなた）</small> : null}
      </b>
      <span className={classes.ready} data-on={ready && !disconnected ? "" : undefined}>
        {disconnected ? "切断中" : ready ? "準備OK" : "準備中"}
      </span>
      {onEdit ? (
        <button type="button" className={classes.edit} aria-label="表示名を変更" onClick={onEdit}>
          <Icon name="edit" size="sm" />
        </button>
      ) : null}
    </div>
  );
}

// 空いている枠: 押すと招待の窓を開く
export function EmptySlot({ onClick }: { onClick: () => void }) {
  const classes = playerBoard();
  return (
    <button type="button" className={classes.empty} onClick={onClick}>
      <span className={classes.plus} aria-hidden="true">
        +
      </span>
      招待する
    </button>
  );
}

// ルールの見出しの行
export function RulesHead({ title, titleId }: { title: string; titleId: string }) {
  const classes = rulesList();
  return (
    <div className={classes.head}>
      <h2 id={titleId} className={classes.title}>
        {title}
      </h2>
    </div>
  );
}

export type RulesMode = NonNullable<RulesListVariantProps["mode"]>;

export function RulesList({ mode, children }: { mode: RulesMode; children: ReactNode }) {
  return <dl className={rulesList({ mode }).root}>{children}</dl>;
}

export type RuleProps = { mode: RulesMode; term?: string; wide?: boolean; children: ReactNode };

// 1つの条件（項目名と、選択肢または決まった内容）
export function Rule({ mode, term, wide = false, children }: RuleProps) {
  const classes = rulesList({ mode });
  return (
    <div className={classes.row} data-wide={wide || undefined}>
      {term ? <dt className={classes.term}>{term}</dt> : null}
      <dd className={classes.value}>{children}</dd>
    </div>
  );
}

// ゲストに見せる、決まった内容
export function RuleSummary({ children }: { children: ReactNode }) {
  return <span className={rulesList().summary}>{children}</span>;
}

export function RulesDivider() {
  return <div className={rulesList().divider} aria-hidden="true" />;
}

export type LevelArtImage = { key: string; src: string; alt: string; hidden: boolean };
export type LevelArtProps = {
  /** 難易度の英語（例: EASY） */
  word: string;
  /** EXTRA などの目印 */
  extra?: string;
  /** お題の条件（例: ["背景なし", "1キャラクター"]） */
  parts: readonly string[];
  /** 難易度ごとの挿絵。3枚とも置いておき、選んでいる難易度の絵だけを見せる（切り替えのたびに読み込み待ちにならないように） */
  images: LevelArtImage[];
};

// 難易度の挿絵。下端の帯に英語の見出しと条件を重ねる。
// 帯のぼかしは、見せている画像をCSS変数で帯に渡し、レシピ側でぼかしたコピーとして重ねる（levelArtの説明を参照）
export function LevelArt({ word, extra, parts, images }: LevelArtProps) {
  const classes = levelArt();
  const shown = images.find((image) => !image.hidden) ?? images[0];
  return (
    <figure className={classes.figure}>
      {images.map((image) => (
        <img
          key={image.key}
          className={classes.image}
          src={image.src}
          alt={image.alt}
          width="832"
          height="1216"
          decoding="async"
          hidden={image.hidden}
        />
      ))}
      <span className={classes.tag}>TOPIC IMAGE</span>
      <figcaption
        className={classes.cap}
        style={{ "--level-art-image": shown ? `url("${shown.src}")` : undefined }}
      >
        <span className={classes.word}>
          {word}
          {extra ? <b className={classes.extra}>{extra}</b> : null}
        </span>
        <p className={classes.desc}>
          {parts.map((part) => (
            <span key={part} className={classes.descPart}>
              {part}
            </span>
          ))}
        </p>
      </figcaption>
    </figure>
  );
}

export type GoPanelProps = {
  note?: string;
  /** スマホの下のバーに出す準備の状況 */
  status?: { ready: number; total: number };
  children: ReactNode;
};

// 開始の操作。狭い画面では画面の下に固定する
export function GoPanel({ note, status, children }: GoPanelProps) {
  const classes = goPanel();
  return (
    <div className={classes.root}>
      {status ? (
        <p
          className={classes.status}
          data-all={status.total >= 2 && status.ready === status.total ? "" : undefined}
          aria-hidden="true"
        >
          準備OK
          <b>
            {status.ready}/{status.total}
          </b>
        </p>
      ) : null}
      {children}
      <p className={classes.note}>{note ?? ""}</p>
    </div>
  );
}

export type WaitingListProps = { members: { id: string; name: string; player: AvatarPlayer }[] };

// 開始の確認: 準備中の人の一覧
export function WaitingList({ members }: WaitingListProps) {
  const classes = waitingList();
  return (
    <ul className={classes.list}>
      {members.map((member) => (
        <li key={member.id} className={classes.item}>
          <Avatar name={member.name} player={member.player} size="sm" decorative />
          <span>{member.name}</span>
          <small className={classes.note}>準備中</small>
        </li>
      ))}
    </ul>
  );
}

export type InviteRowProps = { url: string; copied: boolean; onCopy: () => void };

// 招待のURLとコピー
export function InviteRow({ url, copied, onCopy }: InviteRowProps) {
  const classes = inviteCard();
  return (
    <div className={classes.row}>
      <input className={classes.url} value={url} readOnly aria-label="ルームURL" />
      <Button size="sm" onClick={onCopy}>
        {copied ? "コピーしました" : "リンクをコピー"}
      </Button>
    </div>
  );
}

// ルームURLのQRコード
export function InviteQr({ url }: { url: string }) {
  const classes = inviteCard();
  return (
    <QrCode.Root value={url}>
      {/* 図として読み上げる名前はSVG（Frame）に付ける（外側のdivにaria-labelは置けない） */}
      <QrCode.Frame className={classes.qr} role="img" aria-label="ルームURLのQRコード">
        <QrCode.Pattern className={classes.qrPattern} />
      </QrCode.Frame>
    </QrCode.Root>
  );
}

export type CountdownOverlayProps = { label: string; count: number | "START!"; sub: string };

// 対戦開始までのカウントダウン
export function CountdownOverlay({ label, count, sub }: CountdownOverlayProps) {
  const classes = countdownOverlay();
  return (
    <div className={classes.root} role="status" aria-live="assertive">
      <p className={classes.label}>{label}</p>
      {/* key を変えて数字ごとに動きをやり直す */}
      <div
        key={String(count)}
        className={classes.number}
        data-start={count === "START!" ? "" : undefined}
      >
        {count}
      </div>
      <p className={classes.sub}>{sub}</p>
    </div>
  );
}
