import { scoreCards } from "@animic/styled-system/recipes";
import type { ScoreCardsVariantProps } from "@animic/styled-system/recipes";
import type { ReactNode } from "react";

import { Icon } from "../icon/icon";
import type { IconName } from "../icon/icon";

export type ScoreCard = {
  title: string;
  description: string;
  icon: IconName;
  tint: ScoreCardsVariantProps["tint"];
};

// 採点方法の画面の外枠
export function ScoreSection({ children }: { children: ReactNode }) {
  const classes = scoreCards();
  return <div className={classes.section}>{children}</div>;
}

// 見出しの置き場（画面に吸い付いたときの上の余白を取る）
export function ScoreHead({ children }: { children: ReactNode }) {
  const classes = scoreCards();
  return <div className={classes.head}>{children}</div>;
}

export function ScoreCardList({ children }: { children: ReactNode }) {
  const classes = scoreCards();
  return <ul className={classes.list}>{children}</ul>;
}

export function ScoreCardItem({ card, children }: { card: ScoreCard; children?: ReactNode }) {
  const classes = scoreCards({ tint: card.tint });
  const content = (
    <>
      <span className={classes.icon}>
        <Icon name={card.icon} size="4xl" />
      </span>
      <h3 className={classes.title}>{card.title}</h3>
      <p className={classes.description}>{card.description}</p>
    </>
  );
  // 中身を Reveal で包む場合は li を外に、そうでなければ li 自体をカードにする
  return children ? <li>{children}</li> : <li className={classes.card}>{content}</li>;
}

// カードの中身だけ（Reveal の中に置く）
export function ScoreCardBody({ card }: { card: ScoreCard }) {
  const classes = scoreCards({ tint: card.tint });
  return (
    <div className={classes.card}>
      <span className={classes.icon}>
        <Icon name={card.icon} size="4xl" />
      </span>
      <h3 className={classes.title}>{card.title}</h3>
      <p className={classes.description}>{card.description}</p>
    </div>
  );
}

// 合計の式（再現度 ＋ 提出速度 ＋ 生成回数 ＝ 最終スコア）
export function ScoreTotal({ terms, result }: { terms: string[]; result: string }) {
  const classes = scoreCards();
  return (
    <p className={classes.total}>
      {terms.join(" ＋ ")} ＝ <b className={classes.totalBadge}>{result}</b>
    </p>
  );
}
