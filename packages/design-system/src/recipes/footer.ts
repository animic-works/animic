import { defineRecipe } from "@pandacss/dev";
export const footer = defineRecipe({
  className: "footer",
  base: {
    paddingInline: "var(--animic-section-gutter, 1.25rem)",
    paddingBlock: "2rem 2.5rem",
    borderBlockStart: "1px solid token(colors.border.default)",
    background: "color-mix(in srgb, token(colors.bg.surface) 70%, transparent)",
    _footerCompact: { paddingBlock: "6" },
    _footerShort: { paddingBlock: "5" },
  },
});
