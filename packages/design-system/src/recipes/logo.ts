import { defineRecipe } from "@pandacss/dev";

// ロゴの大きさ。比率は画像のまま保ち、幅だけを段階で選ぶ
export const logo = defineRecipe({
  className: "logo",
  description: "Animicのロゴ。トップでは大きく、画面の上のバーでは小さく置く",
  base: { display: "block", height: "auto", maxWidth: "full" },
  variants: {
    size: {
      sm: { width: "28" },
      md: { width: "52" },
      lg: { width: "full", maxWidth: "lg" },
    },
  },
  defaultVariants: { size: "md" },
});
