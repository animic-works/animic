import { entryCard, providerButton } from "@animic/styled-system/recipes";
import type { ReactNode } from "react";

import { Button } from "../button/button";
import type { ButtonProps } from "../button/button";
import { Icon } from "../icon/icon";
import { MobileBar } from "../page/page";

export type EntryPageProps = {
  /** スマホだけ: 上のバーの戻る先とロゴ、上に置くキャラクターの絵。省くと方眼の背景だけ */
  mobile?: { backHref: string; backLabel: string; logoSrc: string; characterSrc: string };
  children: ReactNode;
};

const SPARK_PATH = "M70 0C74 44 96 66 140 70 96 74 74 96 70 140 66 96 44 74 0 70 44 66 66 44 70 0Z";
const SPARKS = ["topLeft", "topRight", "bottomLeft"] as const;

// 方眼の背景の中央にカードを置く画面。スマホでは上にキャラクター、下にボトムシート
export function EntryPage({ mobile, children }: EntryPageProps) {
  const classes = entryCard();
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
      <main className={classes.page}>
        {mobile ? (
          <div className={classes.stage} aria-hidden="true">
            <div className={classes.stageInner}>
              <div className={classes.char}>
                <img
                  className={classes.charImage}
                  src={mobile.characterSrc}
                  alt=""
                  width="2560"
                  height="1677"
                />
              </div>
              {SPARKS.map((sparkAt) => (
                <svg key={sparkAt} className={entryCard({ sparkAt }).spark} viewBox="0 0 140 140">
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
  const classes = entryCard();
  return (
    <section
      className={classes.card}
      aria-labelledby={titleId}
      data-step={step ?? undefined}
      data-back={back || undefined}
      onAnimationEnd={(event) => {
        if (event.target === event.currentTarget) onStepAnimationEnd?.();
      }}
    >
      <img className={classes.logo} src={logoSrc} alt="Animic" width="2078" height="607" />
      <h1 id={titleId} className={classes.title}>
        {title}
      </h1>
      {sub ? <p className={classes.sub}>{sub}</p> : null}
      {children}
    </section>
  );
}

// 参加するルームなど、この画面の前提を示す帯
export function EntryContext({ children }: { children: ReactNode }) {
  const classes = entryCard();
  return <p className={classes.context}>{children}</p>;
}

export function EntryProviders({ children }: { children: ReactNode }) {
  const classes = entryCard();
  return <div className={classes.providers}>{children}</div>;
}

export function EntryDivider({ children }: { children: ReactNode }) {
  const classes = entryCard();
  return <p className={classes.divider}>{children}</p>;
}

export function EntryTerms({ children }: { children: ReactNode }) {
  const classes = entryCard();
  return <p className={classes.terms}>{children}</p>;
}

export type ProviderButtonProps = Omit<
  ButtonProps,
  "children" | "variant" | "leadingIcon" | "trailingIcon"
> & {
  provider: "google" | "discord";
  children: ReactNode;
};

const PROVIDER_VARIANT = { google: "secondary", discord: "discord" } as const;

// ログイン連携先を選ぶボタン: 左にロゴ、中央に文言
export function ProviderButton({
  provider,
  children,
  loading,
  loadingText,
  ...rest
}: ProviderButtonProps) {
  const classes = providerButton();
  return (
    <Button
      {...rest}
      variant={PROVIDER_VARIANT[provider]}
      size="provider"
      fullWidth
      spread
      loading={loading}
      loadingText={loadingText}
      leadingIcon={
        <span className={classes.icon}>
          <Icon name={provider} size="2xl" />
        </span>
      }
      trailingIcon={<span className={classes.spacer} />}
    >
      {children}
    </Button>
  );
}
