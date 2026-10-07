import type { HTMLAttributes, ReactNode, Ref } from "react";

import { variant } from "../../components/cx";
import landingScreenStyles from "./landing-screen.module.css";
import sectionHeadStyles from "./section-head.module.css";

type RevealDelay = "0" | "1" | "2" | "3" | "4" | "5";

export type LandingScreenProps = Omit<HTMLAttributes<HTMLElement>, "className" | "style"> & {
  id: string;
  /** 画面の種類。背景やレイアウトの決め方が変わる */
  kind: "hero" | "how" | "score" | "gallery";
  /** 画面に入った（または通り過ぎた）あとか。中身が順に現れる */
  active: boolean;
  /** 画面の要素（スクロール位置の判定に使う） */
  ref?: Ref<HTMLElement>;
  children: ReactNode;
};

// トップの1画面。縦に並べ、スクロールすると画面ごとに吸い付く
export function LandingScreen({ id, kind, active, ref, children, ...rest }: LandingScreenProps) {
  return (
    <section
      {...rest}
      ref={ref}
      id={id}
      className={landingScreenStyles.root}
      data-kind={kind}
      data-active={active || undefined}
    >
      {children}
    </section>
  );
}

export type RevealProps = {
  /** 現れる順番（0から） */
  delay?: RevealDelay;
  as?: "div" | "p" | "li";
  children: ReactNode;
};

// 画面の中身のうち、順に入ってくるまとまり
export function Reveal({ delay, as: Element = "div", children }: RevealProps) {
  return (
    <Element className={variant(landingScreenStyles, "reveal", { delay })}>{children}</Element>
  );
}

export type SectionHeadProps = {
  eyebrow: string;
  title: string;
  titleId: string;
  description?: string;
  /** 見本の内容であることなどの小さな注記。説明の下に置き、狭い画面でも出す */
  note?: string;
};

// 節の見出し（英字の小見出し・見出し・説明・注記）
export function SectionHead({ eyebrow, title, titleId, description, note }: SectionHeadProps) {
  return (
    <div className={sectionHeadStyles.root}>
      <p className={sectionHeadStyles.eyebrow} data-part="eyebrow">
        {eyebrow}
      </p>
      <h2 className={sectionHeadStyles.title} id={titleId} data-part="title">
        {title}
      </h2>
      {description ? (
        <p className={sectionHeadStyles.description} data-part="description">
          {description}
        </p>
      ) : null}
      {note ? <p className={sectionHeadStyles.note}>{note}</p> : null}
    </div>
  );
}
