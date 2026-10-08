import { defineRecipe } from "@pandacss/dev";
export const lead = defineRecipe({
  className: "lead",
  base: {
    position: "relative",
    margin: "0",
    marginInlineStart: "0.6rem",
    maxWidth: "30em",
    textStyle: "body.lead",
    color: "fg.default",
    "& span": { display: "inline-block" },
    "& strong, & mark": { fontWeight: "inherit", color: "inherit", background: "transparent" },
    _headingCompact: {
      marginInlineStart: "0.2rem",
      paddingInlineStart: "0.9rem",
      fontSize: "0.875rem",
      lineHeight: "1.8",
      letterSpacing: "0.03em",
      color: "fg.supporting",
      "&::before": {
        content: '""',
        position: "absolute",
        insetBlock: "0.25rem",
        insetInlineStart: "0",
        width: "4px",
        borderRadius: "full",
        backgroundImage:
          "linear-gradient(token(colors.accent.primary), token(colors.accent.secondary))",
      },
      "& strong": { color: "accent.primary", fontWeight: "black" },
      "& [data-lead-conclusion]": {
        fontSize: "1rem",
        color: "fg.default",
        fontWeight: "black",
        marginBlockStart: "0.15rem",
      },
      "& mark": {
        backgroundImage:
          "linear-gradient(transparent 62%, color-mix(in srgb, token(colors.accent.highlight) 75%, transparent) 62% 92%, transparent 92%)",
      },
    },
  },
});
