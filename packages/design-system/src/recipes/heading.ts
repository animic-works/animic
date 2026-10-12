import { defineRecipe } from "@pandacss/dev";
export const heading = defineRecipe({
  className: "heading",
  base: {
    margin: "0",
    color: "fg.default",
    "& > :is(svg, img):only-child": { display: "block" },
  },
  variants: {
    emphasis: { plain: {}, offset: { textShadow: "text.offset" } },
    size: {
      statement: { textStyle: "display.statement" },
      panel: { textStyle: "heading.panel" },
      ordinal: { textStyle: "numeric.ordinal" },
      title: { textStyle: "display.title" },
      sm: { textStyle: "heading.sm" },
      md: { textStyle: "heading.md" },
      lg: { textStyle: "heading.lg" },
      display: { textStyle: "display" },
      hero: { textStyle: "display.hero" },
      fluid: { textStyle: "display.fluid" },
      card: { textStyle: "heading.card" },
      illustrated: { textStyle: "heading.illustrated" },
      section: { textStyle: "display.section" },
    },
    outlined: {
      true: {
        // 輪郭の内側を塗りで覆い、字の太さを保ったまま外側に2pxの縁を描く。
        WebkitTextStroke: "4px token(colors.bg.surface)",
        paintOrder: "stroke fill",
        "@media (forced-colors: active)": { WebkitTextStroke: "0" },
      },
      false: {},
    },
  },
});
