import type { ReactNode } from "react";

import { Button } from "./button";
import type { ButtonProps } from "./button";
import { variant } from "./cx";
import { Icon } from "./icon";
import { MobileBar } from "./page";
import entryCardStyles from "./entry-card.module.css";
import providerButtonStyles from "./provider-button.module.css";

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

// カードの上のロゴ（ダイアログなど、EntryCard の外で同じロゴを置くとき）
export function EntryLogo({ src }: { src: string }) {
  return <img className={entryCardStyles.logo} src={src} alt="Animic" width="2078" height="607" />;
}

// 参加するルームなど、この画面の前提を示す帯
export function EntryContext({ children }: { children: ReactNode }) {
  return <p className={entryCardStyles.context}>{children}</p>;
}

// ログインのボタンを並べる欄
export function EntryProviders({ children }: { children: ReactNode }) {
  return <div className={entryCardStyles.providers}>{children}</div>;
}

// 「または」の区切り線
export function EntryDivider({ children }: { children: ReactNode }) {
  return <p className={entryCardStyles.divider}>{children}</p>;
}

// カードの下の、利用規約などへの同意の文
export function EntryTerms({ children }: { children: ReactNode }) {
  return <p className={entryCardStyles.terms}>{children}</p>;
}

// ログインできなかった理由など、操作の結果を知らせる帯（読み上げでもすぐに伝える）
export function EntryAlert({ children }: { children: ReactNode }) {
  return (
    <p className={entryCardStyles.alert} role="alert">
      {children}
    </p>
  );
}

export type EntryWelcomeProps = {
  /** ログインに使ったサービス。分からなければ印を出さない */
  provider: "google" | "discord" | null;
  /** 1行目（例: Googleでログインしました） */
  title: string;
  /** 右端に置く操作（ログアウトなど） */
  action?: ReactNode;
  children: ReactNode;
};

// ログイン中のアカウント。左にログインに使ったサービスの印
export function EntryWelcome({ provider, title, action, children }: EntryWelcomeProps) {
  return (
    <div className={entryCardStyles.welcome}>
      {provider ? (
        <span className={entryCardStyles.welcomeIcon}>
          <Icon name={provider} size="2xl" />
        </span>
      ) : null}
      <p>
        <b>{title}</b>
        {children}
      </p>
      {action}
    </div>
  );
}

export type ProviderButtonProps = Omit<
  ButtonProps,
  "children" | "variant" | "leadingIcon" | "trailingIcon"
> & {
  provider: "google" | "discord";
  children: ReactNode;
};

const PROVIDER_VARIANT = { google: "secondary", discord: "discord" } as const;

// ログインに使うサービスを選ぶボタン: 左にロゴ、中央に文言
export function ProviderButton({ provider, children, ...rest }: ProviderButtonProps) {
  return (
    <Button
      {...rest}
      variant={PROVIDER_VARIANT[provider]}
      size="provider"
      fullWidth
      spread
      leadingIcon={
        <span className={providerButtonStyles.icon}>
          <Icon name={provider} size="2xl" />
        </span>
      }
      trailingIcon={<span className={providerButtonStyles.spacer} />}
    >
      {children}
    </Button>
  );
}
