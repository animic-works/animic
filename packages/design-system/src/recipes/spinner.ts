import { defineRecipe } from "@pandacss/dev";
export const spinner = defineRecipe({
  className: "spinner",
  base: {
    display: "inline-block",
    flexShrink: 0,
    boxSizing: "border-box",
    width: "icon.1",
    height: "icon.1",
    borderRadius: "full",
    borderWidth: "2",
    borderStyle: "solid",
    borderColor: "border.default",
    borderTopColor: "fg.default",
    animationStyle: "loading",
  },
});
