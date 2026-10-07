import { QrCode } from "@ark-ui/react/qr-code";
import type { ReactNode } from "react";

import { Avatar } from "../../components/avatar";
import type { AvatarPlayer } from "../../components/avatar";
import { Button } from "../../components/button";
import { configVariant, variant } from "../../components/cx";
import { Icon } from "../../components/icon";
import topBarStyles from "../../components/top-bar.module.css";
import goPanelStyles from "./go-panel.module.css";
import inviteCardStyles from "./invite-card.module.css";
import levelArtStyles from "./level-art.module.css";
import lobbyLayoutStyles from "./lobby-layout.module.css";
import playerBoardStyles from "./player-board.module.css";
import readyStatusStyles from "./ready-status.module.css";
import rulesListStyles from "./rules-list.module.css";
import waitingListStyles from "./waiting-list.module.css";

// ロビーの2列（プレイヤー・ルール）
export function LobbyLayout({ children }: { children: ReactNode }) {
  return <main className={lobbyLayoutStyles.root}>{children}</main>;
}

// 左の列: プレイヤーのカードと、広い画面ではその下の退出
export function LobbyColumn({ children }: { children: ReactNode }) {
  return <div className={lobbyLayoutStyles.column}>{children}</div>;
}

type LeaveButtonProps = {
  /** bar: 上のバー（1列の画面では文字、スマホではアイコンだけ） / column: プレイヤーのカードの下（広い画面だけ） */
  placement: "bar" | "column";
  disabled?: boolean;
  onClick: () => void;
};

// 退出。置き場所ごとに見せ方が変わり、画面の幅に応じてどちらか一方だけが見える
export function LeaveButton({ placement, disabled, onClick }: LeaveButtonProps) {
  if (placement === "column") {
    return (
      <button
        type="button"
        className={lobbyLayoutStyles.leave}
        disabled={disabled}
        onClick={onClick}
      >
        退出
      </button>
    );
  }
  return (
    <button type="button" className={topBarStyles.leave} disabled={disabled} onClick={onClick}>
      <span data-part="icon" aria-hidden="true">
        <Icon name="exit" size="xl" />
      </span>
      <span data-part="label">退出</span>
    </button>
  );
}

type RoomChipProps = { code: string; onCopy: () => void };

// スマホの上のバーの中央: ルームコードのチップ（押すとコピー）
export function RoomChip({ code, onCopy }: RoomChipProps) {
  return (
    <button type="button" className={topBarStyles.room} onClick={onCopy}>
      <span className={topBarStyles.roomLabel}>ルーム</span>
      <span className={topBarStyles.roomCode}>{code}</span>
    </button>
  );
}

type PlayerBoardHeadProps = {
  code: string;
  onInvite: () => void;
  /** スマホのチップを押したときにコードをコピーする */
  onCopy: () => void;
  /** 8マスのコード（CodeDisplay。スマホでは出さない） */
  children: ReactNode;
};

// プレイヤーのカードの上部: ルームコードと招待。スマホでは8マスの代わりに、タップでコピーできる1行のチップ
export function PlayerBoardHead({ code, onInvite, onCopy, children }: PlayerBoardHeadProps) {
  return (
    <div className={playerBoardStyles.head}>
      <div className={playerBoardStyles.roomCard}>
        <span className={playerBoardStyles.roomLabel}>ルームコード</span>
        <span className={playerBoardStyles.codeCells}>{children}</span>
        <button
          type="button"
          className={playerBoardStyles.codeChip}
          aria-label="ルームコードをコピー"
          onClick={onCopy}
        >
          <span className={playerBoardStyles.codeChipText}>{code}</span>
          <span className={playerBoardStyles.codeChipIcon} aria-hidden="true">
            <Icon name="copy" size="lg" />
          </span>
        </button>
        <Button size="sm" leadingIcon={<Icon name="userPlus" size="md" />} onClick={onInvite}>
          招待する
        </Button>
      </div>
    </div>
  );
}

type PlayerTitleRowProps = {
  count: number;
  max: number;
  titleId: string;
  children: ReactNode;
};

// 「プレイヤー 1 / 8」と準備の状況
export function PlayerTitleRow({ count, max, titleId, children }: PlayerTitleRowProps) {
  return (
    <div className={playerBoardStyles.titleRow}>
      <h2 id={titleId} className={playerBoardStyles.title}>
        プレイヤー{" "}
        <span className={playerBoardStyles.count} aria-live="polite">
          {count}
          <small className={playerBoardStyles.countTotal}> / {max}</small>
        </span>
      </h2>
      {children}
    </div>
  );
}

type ReadyStatusProps = {
  ready: number;
  total: number;
  /** 全員の準備がそろったか（緑で見せる）。判定は画面側で行う */
  allReady: boolean;
};

// 準備OKの人数（全員そろったら緑）
export function ReadyStatus({ ready, total, allReady }: ReadyStatusProps) {
  return (
    <p className={configVariant(readyStatusStyles, { all: allReady })} aria-live="polite">
      準備OK{" "}
      <b>
        {ready} / {total}
      </b>
      人
    </p>
  );
}

export function PlayerGrid({ children }: { children: ReactNode }) {
  return <ul className={playerBoardStyles.grid}>{children}</ul>;
}

export function PlayerSlot({ children }: { children: ReactNode }) {
  return <li className={playerBoardStyles.slot}>{children}</li>;
}

type PlayerTileProps = {
  name: string;
  player: AvatarPlayer;
  isMe?: boolean;
  isHost?: boolean;
  ready: boolean;
  /** 切断中（準備の代わりに出す） */
  disconnected?: boolean;
  /** 入ってきたばかり（弾ませる） */
  joined?: boolean;
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
}: PlayerTileProps) {
  return (
    <div
      className={playerBoardStyles.player}
      data-me={isMe || undefined}
      data-joined={joined || undefined}
    >
      {isHost ? (
        <span className={playerBoardStyles.tag}>ホスト</span>
      ) : isMe ? (
        <span className={playerBoardStyles.tag} data-me="">
          あなた
        </span>
      ) : null}
      <span className={playerBoardStyles.avatar}>
        <Avatar name={name} player={player} size="tile" decorative />
      </span>
      <b className={playerBoardStyles.name}>
        {name}
        {isMe && isHost ? <small className={playerBoardStyles.nameNote}>（あなた）</small> : null}
      </b>
      <span className={playerBoardStyles.ready} data-on={ready && !disconnected ? "" : undefined}>
        {disconnected ? "切断中" : ready ? "準備OK" : "準備中"}
      </span>
    </div>
  );
}

// 空いている枠: 押すと招待の窓を開く
export function EmptySlot({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className={playerBoardStyles.empty} onClick={onClick}>
      <span className={playerBoardStyles.plus} aria-hidden="true">
        +
      </span>
      招待する
    </button>
  );
}

// ルールの見出しの行
export function RulesHead({ title, titleId }: { title: string; titleId: string }) {
  return (
    <div className={rulesListStyles.head}>
      <h2 id={titleId} className={rulesListStyles.title}>
        {title}
      </h2>
    </div>
  );
}

type RulesMode = "edit" | "view";

export function RulesList({ mode, children }: { mode: RulesMode; children: ReactNode }) {
  return <dl className={variant(rulesListStyles, "root", { mode })}>{children}</dl>;
}

type RuleProps = { mode: RulesMode; term?: string; wide?: boolean; children: ReactNode };

// 1つの条件（項目名と、選択肢または決まった内容）
export function Rule({ mode, term, wide = false, children }: RuleProps) {
  return (
    <div className={variant(rulesListStyles, "row", { mode })} data-wide={wide || undefined}>
      {term ? <dt className={variant(rulesListStyles, "term", { mode })}>{term}</dt> : null}
      <dd className={rulesListStyles.value}>{children}</dd>
    </div>
  );
}

// ゲストに見せる、決まった内容
export function RuleSummary({ children }: { children: ReactNode }) {
  return <span className={rulesListStyles.summary}>{children}</span>;
}

export function RulesDivider() {
  return <div className={rulesListStyles.divider} aria-hidden="true" />;
}

type LevelArtImage = { key: string; src: string; alt: string; hidden: boolean };
type LevelArtProps = {
  /** 難易度の英語（例: EASY） */
  word: string;
  /** EXTRA などの目印 */
  extra?: string;
  /** お題の条件（例: ["背景なし", "1キャラクター"]） */
  parts: readonly string[];
  /** 難易度ごとの挿絵。3枚とも置いておき、選んでいる難易度の絵だけを見せる */
  images: LevelArtImage[];
};

// 難易度の挿絵。下端の帯に英語の見出しと条件を重ねる。
// 帯のぼかしは、見せている画像をCSS変数で帯に渡し、ぼかしたコピーとして重ねる
export function LevelArt({ word, extra, parts, images }: LevelArtProps) {
  const shown = images.find((image) => !image.hidden) ?? images[0];
  return (
    <figure className={levelArtStyles.figure}>
      {images.map((image) => (
        <img
          key={image.key}
          className={levelArtStyles.image}
          src={image.src}
          alt={image.alt}
          width="832"
          height="1216"
          decoding="async"
          hidden={image.hidden}
        />
      ))}
      <span className={levelArtStyles.tag}>TOPIC IMAGE</span>
      <figcaption
        className={levelArtStyles.cap}
        style={{ "--level-art-image": shown ? `url("${shown.src}")` : undefined }}
      >
        <span className={levelArtStyles.word}>
          {word}
          {extra ? <b className={levelArtStyles.extra}>{extra}</b> : null}
        </span>
        <p className={levelArtStyles.desc}>
          {parts.map((part) => (
            <span key={part} className={levelArtStyles.descPart}>
              {part}
            </span>
          ))}
        </p>
      </figcaption>
    </figure>
  );
}

type GoPanelProps = {
  note?: string;
  /** スマホの下のバーに出す準備の状況 */
  status?: { ready: number; total: number; allReady: boolean };
  children: ReactNode;
};

// 開始の操作。狭い画面では画面の下に固定する
export function GoPanel({ note, status, children }: GoPanelProps) {
  return (
    <div className={goPanelStyles.root}>
      {status ? (
        <p
          className={goPanelStyles.status}
          data-all={status.allReady ? "" : undefined}
          aria-hidden="true"
        >
          準備OK
          <b>
            {status.ready}/{status.total}
          </b>
        </p>
      ) : null}
      {children}
      <p className={goPanelStyles.note}>{note ?? ""}</p>
    </div>
  );
}

type WaitingListProps = { members: { id: string; name: string; player: AvatarPlayer }[] };

// 開始の確認: 準備中の人の一覧
export function WaitingList({ members }: WaitingListProps) {
  return (
    <ul className={waitingListStyles.list}>
      {members.map((member) => (
        <li key={member.id} className={waitingListStyles.item}>
          <Avatar name={member.name} player={member.player} size="sm" decorative />
          <span>{member.name}</span>
          <small className={waitingListStyles.note}>準備中</small>
        </li>
      ))}
    </ul>
  );
}

type InviteRowProps = { url: string; copied: boolean; onCopy: () => void };

// 招待のURLとコピー
export function InviteRow({ url, copied, onCopy }: InviteRowProps) {
  return (
    <div className={inviteCardStyles.row}>
      <input className={inviteCardStyles.url} value={url} readOnly aria-label="ルームURL" />
      <Button size="sm" onClick={onCopy}>
        {copied ? "コピーしました" : "リンクをコピー"}
      </Button>
    </div>
  );
}

// ルームURLのQRコード
export function InviteQr({ url }: { url: string }) {
  return (
    <QrCode.Root value={url}>
      {/* 図として読み上げる名前はSVG（Frame）に付ける（外側のdivにaria-labelは置けない） */}
      <QrCode.Frame className={inviteCardStyles.qr} role="img" aria-label="ルームURLのQRコード">
        <QrCode.Pattern className={inviteCardStyles.qrPattern} />
      </QrCode.Frame>
    </QrCode.Root>
  );
}
