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
  variants: {
    appearance: { solid: {}, dashed: { borderStyle: "dashed" } },
    labeled: {
      true: {
        display: "flex",
        alignItems: "center",
        gap: "4",
        borderWidth: "0",
        textStyle: "caption",
        color: "fg.supporting",
        "&::before, &::after": {
          content: '""',
          flex: "1",
          height: "1px",
          background: "border.default",
        },
      },
      false: {},
    },
  },
  defaultVariants: { appearance: "solid" },
});
