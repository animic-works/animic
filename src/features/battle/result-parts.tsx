import type { ReactNode } from "react";

import { Avatar } from "../../components/avatar";
import type { AvatarPlayer } from "../../components/avatar";
import { variant } from "../../components/cx";
import { Icon } from "../../components/icon";
import { Text } from "../../components/text";
import resultBoardStyles from "./result-board.module.css";

// 背景の3色の帯（勝敗の見出しの後ろ）
export function ResultBurst() {
  return (
    <div className={resultBoardStyles.burst} aria-hidden="true">
      {(["cyanLeft", "yellowLeft", "pinkRight", "yellowRight"] as const).map((band) => (
        <span key={band} className={variant(resultBoardStyles, "burstBand", { band })} />
      ))}
    </div>
  );
}

export function ResultMain({ children }: { children: ReactNode }) {
  return <main className={resultBoardStyles.main}>{children}</main>;
}

// 勝敗の見出し
export function Verdict({
  eyebrow,
  title,
  sub,
  tone,
}: {
  eyebrow: string;
  title: string;
  sub: string;
  /** 勝ちはピンク、それ以外は水色の影 */
  tone: "win" | "lose";
}) {
  return (
    <section className={resultBoardStyles.verdict} aria-label="結果">
      <Text variant="eyebrow">{eyebrow}</Text>
      <Text
        as="div"
        role="heading"
        aria-level={1}
        variant="verdict"
        shadow={tone === "win" ? "pink" : "cyan"}
      >
        {title}
      </Text>
      <p className={resultBoardStyles.verdictSub}>{sub}</p>
    </section>
  );
}

export function ResultBoardGrid({ children }: { children: ReactNode }) {
  return (
    <section className={resultBoardStyles.board} aria-label="対戦結果">
      {children}
    </section>
  );
}

// お題（中央）
export function ResultTopic({ meta, children }: { meta: string; children: ReactNode }) {
  return (
    <div className={resultBoardStyles.topic}>
      {children}
      <small className={resultBoardStyles.topicMeta}>{meta}</small>
      <span className={resultBoardStyles.vs} aria-hidden="true">
        VS
      </span>
    </div>
  );
}

// 参加者1人の結果
export function PlayerCard({
  winner = false,
  children,
}: {
  winner?: boolean;
  children: ReactNode;
}) {
  return (
    <article className={resultBoardStyles.player} data-winner={winner || undefined}>
      {winner ? (
        <span className={resultBoardStyles.crown}>
          <Icon name="crown" size="xl" />
          WINNER
        </span>
      ) : null}
      {children}
    </article>
  );
}

export function PlayerWho({
  name,
  role,
  player,
}: {
  name: string;
  role: string;
  player: AvatarPlayer;
}) {
  return (
    <div className={resultBoardStyles.who}>
      <Avatar name={name} player={player} size="who" decorative />
      <b className={resultBoardStyles.name}>{name}</b>
      <small className={resultBoardStyles.role}>{role}</small>
    </div>
  );
}

export function PlayerTotal({ label, value }: { label: string; value: string }) {
  return (
    <div className={resultBoardStyles.total}>
      <span className={resultBoardStyles.totalLabel}>{label}</span>
      <b className={resultBoardStyles.totalValue}>{value}</b>
    </div>
  );
}

export function MissingNote({ children }: { children: ReactNode }) {
  return <p className={resultBoardStyles.missingNote}>{children}</p>;
}

export function ResultNote({ children }: { children: ReactNode }) {
  return <p className={resultBoardStyles.note}>{children}</p>;
}
