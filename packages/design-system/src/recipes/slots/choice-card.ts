import { defineSlotRecipe } from "@pandacss/dev";
import { focus } from "../control";
export const choiceCard = defineSlotRecipe({
  className: "choice-card",
  slots: ["root", "media", "body"],
  base: {
    root: {
      display: "grid",
      width: "100%",
      minWidth: 0,
      padding: "0",
      border: "2px solid token(colors.border.default)",
      borderRadius: "1rem",
      overflow: "hidden",
      background: "bg.surface",
      color: "fg.default",
      textAlign: "start",
      cursor: "pointer",
      _focusVisible: focus,
      _hover: { borderColor: "accent.primary" },
      _pressed: {
        borderColor: "accent.primary",
        boxShadow: "0 0 0 2px color-mix(in srgb, token(colors.accent.primary) 16%, transparent)",
      },
      _disabled: { opacity: "0.5", cursor: "not-allowed" },
    },
    media: {
      width: "100%",
      aspectRatio: "4 / 3",
      objectFit: "cover",
      display: "block",
      background: "bg.subtle",
    },
    body: { display: "grid", gap: "1", padding: "3", textStyle: "label.supporting" },
  },
});
