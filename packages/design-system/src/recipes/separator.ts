import { defineRecipe } from "@pandacss/dev";
export const separator = defineRecipe({
  className: "separator",
  base: {
    margin: "0",
    borderWidth: "0",
    borderColor: "border.default",
    borderStyle: "solid",
    borderTopWidth: "1",
    width: "100%",
  },
});
