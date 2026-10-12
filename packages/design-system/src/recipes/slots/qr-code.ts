import { defineSlotRecipe } from "@pandacss/dev";
export const qrCode = defineSlotRecipe({
  className: "qr-code",
  slots: ["root", "frame"],
  base: {
    root: {
      width: "9.5rem",
      padding: "3",
      border: "2px solid token(colors.border.default)",
      borderRadius: "1rem",
      background: "bg.surface",
    },
    frame: { width: "100%", height: "auto", fill: "fg.default" },
  },
});
