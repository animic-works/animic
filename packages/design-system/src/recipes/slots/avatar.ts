import { defineSlotRecipe } from "@pandacss/dev";
export const avatar = defineSlotRecipe({
  className: "avatar",
  slots: ["root", "image", "fallback"],
  base: {
    root: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: "3rem",
      height: "3rem",
      borderRadius: "full",
      overflow: "hidden",
      background: "bg.subtle",
      color: "fg.default",
      flexShrink: 0,
    },
    image: { width: "100%", height: "100%", objectFit: "cover" },
    fallback: { textStyle: "label" },
  },
});
