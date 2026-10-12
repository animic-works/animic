import { defineSlotRecipe } from "@pandacss/dev";
import { focus } from "../control";
export const sectionNavigation = defineSlotRecipe({
  className: "section-navigation",
  slots: ["root", "item"],
  base: {
    root: {
      position: "fixed",
      zIndex: "navigation",
      insetInlineEnd: "5",
      top: "50%",
      translate: "0 -50%",
      display: "grid",
      width: "1.75rem",
      padding: "0.5rem 0",
      background: "bg.surface",
      borderRadius: "full",
      boxShadow: "soft.1",
      _sectionNavigationCompact: { display: "none" },
    },
    item: {
      display: "grid",
      placeItems: "center",
      width: "1.75rem",
      height: "1.5rem",
      position: "relative",
      "&::before": { content: '""', position: "absolute", inset: "-0.25rem -0.5rem" },
      "&[aria-current=location]": { height: "2.5rem" },
      transition: "height 400ms cubic-bezier(0.65, 0, 0.35, 1)",
      _motionReduce: { transition: "none" },
      borderRadius: "full",
      _focusVisible: focus,
      "&::after": {
        content: '""',
        width: "0.625rem",
        height: "0.625rem",
        transition: "height 400ms cubic-bezier(0.65, 0, 0.35, 1), background-color 300ms ease",
        _motionReduce: { transition: "none" },
        border: "2px solid token(colors.border.strong)",
        borderRadius: "full",
      },
      "&[aria-current=location]::after": {
        height: "2rem",
        background: "accent.primary",
        borderColor: "accent.primary",
      },
    },
  },
});
