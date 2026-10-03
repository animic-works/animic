import { logo } from "@animic/styled-system/recipes";
import type { LogoVariantProps } from "@animic/styled-system/recipes";

export type LogoProps = LogoVariantProps & {
  /** ロゴ画像のURL（アプリの public/ に置く） */
  src: string;
  /** 読み上げる名前。リンクの中に置くときは「Animic トップ」のように行き先を含める */
  alt?: string;
};

// Animicのロゴ。画像の比率（2078×607）を保つ
export function Logo({ src, alt = "Animic", size }: LogoProps) {
  return <img className={logo({ size })} src={src} alt={alt} width="2078" height="607" />;
}
