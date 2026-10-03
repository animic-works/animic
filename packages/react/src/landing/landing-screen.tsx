import { landingScreen, sectionHead } from "@animic/styled-system/recipes";
import type { LandingScreenVariantProps } from "@animic/styled-system/recipes";
import type { HTMLAttributes, ReactNode, Ref } from "react";

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
  const classes = landingScreen();
  return (
    <section
      {...rest}
      ref={ref}
      id={id}
      className={classes.root}
      data-kind={kind}
      data-active={active || undefined}
    >
      {children}
    </section>
  );
}

export type RevealProps = {
  /** 現れる順番（0から） */
  delay?: LandingScreenVariantProps["delay"];
  as?: "div" | "p" | "li";
  children: ReactNode;
};

// 画面の中身のうち、順に入ってくるまとまり
export function Reveal({ delay, as: Element = "div", children }: RevealProps) {
  const classes = landingScreen({ delay });
  return <Element className={classes.reveal}>{children}</Element>;
}

export type SectionHeadProps = {
  eyebrow: string;
  title: string;
  titleId: string;
  description?: string;
};

// 節の見出し（英字の小見出し・見出し・説明）
export function SectionHead({ eyebrow, title, titleId, description }: SectionHeadProps) {
  const classes = sectionHead();
  return (
    <div className={classes.root}>
      <p className={classes.eyebrow} data-part="eyebrow">
        {eyebrow}
      </p>
      <h2 className={classes.title} id={titleId} data-part="title">
        {title}
      </h2>
      {description ? (
        <p className={classes.description} data-part="description">
          {description}
        </p>
      ) : null}
    </div>
  );
}
