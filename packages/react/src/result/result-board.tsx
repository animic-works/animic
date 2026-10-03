import { resultBoard } from "@animic/styled-system/recipes";
import type { ResultBoardVariantProps } from "@animic/styled-system/recipes";
import type { ReactNode } from "react";

import { Avatar } from "../avatar/avatar";
import type { AvatarPlayer } from "../avatar/avatar";
import { Icon } from "../icon/icon";
import { Text } from "../text/text";

// 背景の3色の帯（勝敗の見出しの後ろ）
export function ResultBurst() {
  const classes = resultBoard();
  return (
    <div className={classes.burst} aria-hidden="true">
      {(["cyanLeft", "yellowLeft", "pinkRight", "yellowRight"] as const).map((band) => (
        <span key={band} className={resultBoard({ band }).burstBand} />
      ))}
    </div>
  );
}

export function ResultMain({ children }: { children: ReactNode }) {
  return <main className={resultBoard().main}>{children}</main>;
}

export type VerdictProps = {
  eyebrow: string;
  title: string;
  sub: string;
  /** 勝ちはピンク、それ以外は水色の影 */
  tone: "win" | "lose";
};

// 勝敗の見出し
export function Verdict({ eyebrow, title, sub, tone }: VerdictProps) {
  const classes = resultBoard();
  return (
    <section className={classes.verdict} aria-label="結果">
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
      <p className={classes.verdictSub}>{sub}</p>
    </section>
  );
}

export function ResultBoardGrid({ children }: { children: ReactNode }) {
  return (
    <section className={resultBoard().board} aria-label="対戦結果">
      {children}
    </section>
  );
}

// お題（中央）
export function ResultTopic({ meta, children }: { meta: string; children: ReactNode }) {
  const classes = resultBoard();
  return (
    <div className={classes.topic}>
      {children}
      <small className={classes.topicMeta}>{meta}</small>
      <span className={classes.vs} aria-hidden="true">
        VS
      </span>
    </div>
  );
}

export type PlayerCardProps = { winner?: boolean; children: ReactNode };

// 参加者1人の結果
export function PlayerCard({ winner = false, children }: PlayerCardProps) {
  const classes = resultBoard();
  return (
    <article className={classes.player} data-winner={winner || undefined}>
      {winner ? (
        <span className={classes.crown}>
          <Icon name="crown" size="xl" />
          WINNER
        </span>
      ) : null}
      {children}
    </article>
  );
}

export type PlayerWhoProps = { name: string; role: string; player: AvatarPlayer };

export function PlayerWho({ name, role, player }: PlayerWhoProps) {
  const classes = resultBoard();
  return (
    <div className={classes.who}>
      <Avatar name={name} player={player} size="who" decorative />
      <b className={classes.name}>{name}</b>
      <small className={classes.role}>{role}</small>
    </div>
  );
}

export function PlayerTotal({ label, value }: { label: string; value: string }) {
  const classes = resultBoard();
  return (
    <div className={classes.total}>
      <span className={classes.totalLabel}>{label}</span>
      <b className={classes.totalValue}>{value}</b>
    </div>
  );
}

export type BreakdownRow = {
  term: string;
  /** 0〜100 */
  percent: number;
  value: string;
  note?: string;
  tone: ResultBoardVariantProps["meterTone"];
};

// スコアの内訳（棒グラフ）
export function Breakdown({ rows }: { rows: BreakdownRow[] }) {
  const classes = resultBoard();
  return (
    <dl className={classes.breakdown}>
      {rows.map((row) => (
        <div key={row.term} className={classes.row}>
          <dt className={classes.term}>{row.term}</dt>
          <span className={classes.meter} data-part="meter" aria-hidden="true">
            <span
              className={resultBoard({ meterTone: row.tone }).meterBar}
              style={{ "--meter": `${Math.max(0, Math.min(100, row.percent))}%` }}
            />
          </span>
          <dd className={classes.value}>
            {row.value}
            {row.note ? <small className={classes.valueNote}>{row.note}</small> : null}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function MissingNote({ children }: { children: ReactNode }) {
  return <p className={resultBoard().missingNote}>{children}</p>;
}

export function ResultNote({ children }: { children: ReactNode }) {
  return <p className={resultBoard().note}>{children}</p>;
}
