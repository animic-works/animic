import type { ReactNode } from "react";

import { variant } from "./cx";
import { MobileBar } from "./page";
import entryCardStyles from "./entry-card.module.css";

export type EntryPageProps = {
  /** スマホだけ: 上のバーの戻る先とロゴ、上に置くキャラクターの絵。省くと方眼の背景だけ */
  mobile?: { backHref: string; backLabel: string; logoSrc: string; characterSrc: string };
  children: ReactNode;
};

const SPARK_PATH = "M70 0C74 44 96 66 140 70 96 74 74 96 70 140 66 96 44 74 0 70 44 66 66 44 70 0Z";
const SPARKS = ["topLeft", "topRight", "bottomLeft"] as const;

// 方眼の背景の中央にカードを置く画面。スマホでは上にキャラクター、下にボトムシート
export function EntryPage({ mobile, children }: EntryPageProps) {
  return (
    <>
      {mobile ? (
        <MobileBar
          variant="float"
          backHref={mobile.backHref}
          backLabel={mobile.backLabel}
          logoSrc={mobile.logoSrc}
        />
      ) : null}
      <main className={entryCardStyles.page}>
        {mobile ? (
          <div className={entryCardStyles.stage} aria-hidden="true">
            <div className={entryCardStyles.stageInner}>
              <div className={entryCardStyles.char}>
                <img
                  className={entryCardStyles.charImage}
                  src={mobile.characterSrc}
                  alt=""
                  width="2560"
                  height="1677"
                />
              </div>
              {SPARKS.map((sparkAt) => (
                <svg
                  key={sparkAt}
                  className={variant(entryCardStyles, "spark", { sparkAt })}
                  viewBox="0 0 140 140"
                >
                  <path d={SPARK_PATH} fill="currentColor" />
                </svg>
              ))}
            </div>
          </div>
        ) : null}
        {children}
      </main>
    </>
  );
}

export type EntryCardProps = {
  logoSrc: string;
  title: string;
  titleId: string;
  sub?: ReactNode;
  /** 手順の切り替えの状態（out: 抜ける / in: 入る）と向き */
  step?: "in" | "out" | null;
  back?: boolean;
  onStepAnimationEnd?: () => void;
  children: ReactNode;
};

// ロゴ付きの白いカード
export function EntryCard({
  logoSrc,
  title,
  titleId,
  sub,
  step = null,
  back = false,
  onStepAnimationEnd,
  children,
}: EntryCardProps) {
  return (
    <section
      className={entryCardStyles.card}
      aria-labelledby={titleId}
      data-step={step ?? undefined}
      data-back={back || undefined}
      onAnimationEnd={(event) => {
        if (event.target === event.currentTarget) onStepAnimationEnd?.();
      }}
    >
      <img className={entryCardStyles.logo} src={logoSrc} alt="Animic" width="2078" height="607" />
      <h1 id={titleId} className={entryCardStyles.title}>
        {title}
      </h1>
      {sub ? <p className={entryCardStyles.sub}>{sub}</p> : null}
      {children}
    </section>
  );
}

// 参加するルームなど、この画面の前提を示す帯
export function EntryContext({ children }: { children: ReactNode }) {
  return <p className={entryCardStyles.context}>{children}</p>;
}

// 操作の結果を知らせる帯（読み上げでもすぐに伝える）
export function EntryAlert({ children }: { children: ReactNode }) {
  return (
    <p className={entryCardStyles.alert} role="alert">
      {children}
    </p>
  );
}

// 補足の文（この環境では〜、など）
export function EntryNote({ children }: { children: ReactNode }) {
  return <p className={entryCardStyles.note}>{children}</p>;
}
