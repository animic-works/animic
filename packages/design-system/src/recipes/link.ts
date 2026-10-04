import { defineRecipe } from "@pandacss/dev";
import { focus } from "./control";
export const link = defineRecipe({
  className: "link",
  base: {
    textStyle: "body.md",
    color: "action.link.fg",
    textDecorationLine: "underline",
    textUnderlineOffset: "0.2em",
    borderRadius: "0",
    _hover: { textDecorationThickness: "2px" },
    _focusVisible: focus,
  },
});
