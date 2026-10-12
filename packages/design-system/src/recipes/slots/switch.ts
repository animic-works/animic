import { defineSlotRecipe } from "@pandacss/dev";
import { focus } from "../control";
export const switchRecipe = defineSlotRecipe({
  className: "switch",
  slots: ["root", "control", "thumb", "label"],
  base: {
    root: {
      display: "inline-flex",
      gap: "2",
      alignItems: "center",
      cursor: "pointer",
      minHeight: "1.5rem",
      _focusWithinVisible: focus,
      _disabled: { cursor: "not-allowed", opacity: "0.5" },
    },
    control: {
      display: "inline-flex",
      width: "2.25rem",
      height: "1.25rem",
      padding: "2px",
      borderRadius: "full",
      background: "border.default",
      flexShrink: 0,
      _checked: { background: "accent.primary" },
    },
    thumb: {
      width: "1rem",
      height: "1rem",
      borderRadius: "full",
      background: "bg.surface",
      boxShadow: "0 1px 3px rgb(11 27 43 / 0.2)",
      transition: "transform 150ms ease",
      _checked: { transform: "translateX(1rem)" },
      _motionReduce: { transition: "none" },
    },
    label: { textStyle: "caption", color: "fg.supporting" },
  },
});
