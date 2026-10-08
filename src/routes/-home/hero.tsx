import type { ReactNode } from "react";

import { Button } from "../../components/button";
import { variant } from "../../components/cx";
import { Icon } from "../../components/icon";
import { Text } from "../../components/text";
import { HeroDeco } from "./hero-deco";
import heroStyles from "./hero.module.css";

export type HeroProps = {
  /** ロゴ画像のURL（アプリの public/ に置く） */
  logoSrc: string;
  /** キャラクターの絵のURL（アプリの public/ に置く） */
  characterSrc: string;
  /** キャッチコピー。行ごとに span、ピンクにする言葉を b、水色にする言葉を em にする */
  title: ReactNode;
  /** 説明文。文節ごとに span にする */
  lead: ReactNode;
  onStart: () => void;
  onJoin: () => void;
  /** 「SCROLL」を押したときに次の画面へ進む。省くと出さない */
  onNext?: () => void;
  /** 押した直後に一瞬つぶすボタン（画面遷移の演出の開始時） */
  pressed?: "start" | "join" | null;
};

// ホーム: 右側の帯と左上の平行線、帯の上に浮かぶキャラクター、ロゴ、キャッチコピー、説明、ボタン、「SCROLL」
export function Hero({
  logoSrc,
  characterSrc,
  title,
  lead,
  onStart,
  onJoin,
  onNext,
  pressed = null,
}: HeroProps) {
  return (
    <div className={heroStyles.root}>
      <HeroDeco />
      <HeroArt src={characterSrc} />
      <div className={heroStyles.copy}>
        <h1 className={heroStyles.logoHeading}>
          <img className={heroStyles.logo} src={logoSrc} alt="Animic" width="2078" height="607" />
        </h1>
        <Text variant="hero-title">{title}</Text>
        <Text variant="lead">{lead}</Text>
        <div className={heroStyles.actions}>
          <Button
            size="hero"
            leadingIcon={<Icon name="play" size="3xl" />}
            trailingIcon={<Icon name="chevronRight" size="xs" />}
            pressed={pressed === "start"}
            onClick={onStart}
          >
            スタート
          </Button>
          <Button
            variant="secondary"
            size="hero"
            labelAlign="start"
            leadingIcon={<Icon name="people" size="5xl" />}
            trailingIcon={<Icon name="chevronRight" size="xs" />}
            pressed={pressed === "join"}
            onClick={onJoin}
          >
            ロビーに参加する
          </Button>
        </div>
      </div>
      {onNext ? (
        <button type="button" className={heroStyles.scrollHint} onClick={onNext}>
          SCROLL
        </button>
      ) : null}
    </div>
  );
}

// ロゴと同じ4点のきらめき
const SPARK_PATH = "M70 0C74 44 96 66 140 70 96 74 74 96 70 140 66 96 44 74 0 70 44 66 66 44 70 0Z";
const SPARKS = ["topLeft", "topRight", "bottomLeft", "bottomRight"] as const;

// 帯の上に浮かぶキャラクター。外側の箱が位置・傾き・登場、中の画像が浮遊、きらめきはその周りに散らす
function HeroArt({ src }: { src: string }) {
  return (
    <div className={heroStyles.art} aria-hidden="true">
      <img
        className={heroStyles.artImage}
        src={src}
        alt=""
        width="2560"
        height="1677"
        fetchPriority="high"
      />
      {SPARKS.map((sparkAt) => (
        <svg
          key={sparkAt}
          className={variant(heroStyles, "spark", { sparkAt })}
          viewBox="0 0 140 140"
        >
          <path d={SPARK_PATH} fill="currentColor" />
        </svg>
      ))}
    </div>
  );
}
