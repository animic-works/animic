import type { ReactNode } from "react";

import { variant } from "../../components/cx";
import { Icon } from "../../components/icon";
import type { IconName } from "../../components/icon";
import scoreCardsStyles from "./score-cards.module.css";

type ScoreTint = "pink" | "cyan" | "yellow";

export type ScoreCard = {
  title: string;
  description: string;
  icon: IconName;
  tint: ScoreTint;
};

// 採点方法の画面の外枠
export function ScoreSection({ children }: { children: ReactNode }) {
  return <div className={scoreCardsStyles.section}>{children}</div>;
}

// 見出しの置き場（画面に吸い付いたときの上の余白を取る）
export function ScoreHead({ children }: { children: ReactNode }) {
  return <div className={scoreCardsStyles.head}>{children}</div>;
}

export function ScoreCardList({ children }: { children: ReactNode }) {
  return <ul className={scoreCardsStyles.list}>{children}</ul>;
}

export function ScoreCardItem({ card, children }: { card: ScoreCard; children?: ReactNode }) {
  // 中身を Reveal で包む場合は li を外に、そうでなければ li 自体をカードにする
  return children ? (
    <li>{children}</li>
  ) : (
    <li className={variant(scoreCardsStyles, "card", { tint: card.tint })}>
      <ScoreCardContent card={card} />
    </li>
  );
}

// カードの中身だけ（Reveal の中に置く）
export function ScoreCardBody({ card }: { card: ScoreCard }) {
  return (
    <div className={variant(scoreCardsStyles, "card", { tint: card.tint })}>
      <ScoreCardContent card={card} />
    </div>
  );
}

function ScoreCardContent({ card }: { card: ScoreCard }) {
  return (
    <>
      <span className={variant(scoreCardsStyles, "icon", { tint: card.tint })}>
        <Icon name={card.icon} size="4xl" />
      </span>
      <h3 className={scoreCardsStyles.title}>{card.title}</h3>
      <p className={scoreCardsStyles.description}>{card.description}</p>
    </>
  );
}

// 合計の式（再現度 ＋ 提出速度 ＋ 生成回数 ＝ 最終スコア）
export function ScoreTotal({ terms, result }: { terms: string[]; result: string }) {
  return (
    <p className={scoreCardsStyles.total}>
      {terms.join(" ＋ ")} ＝ <b className={scoreCardsStyles.totalBadge}>{result}</b>
    </p>
  );
}
