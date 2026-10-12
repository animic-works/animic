import { defineSlotRecipe } from "@pandacss/dev";
export const qrCode = defineSlotRecipe({
  className: "qr-code",
  slots: ["root", "content", "frame", "logo"],
  base: {
    root: {
      width: "calc(var(--qrcode-width) + 8 * var(--qrcode-pixel-size) + 4px)",
      maxWidth: "100%",
      // Keep four clear modules outside the pattern, including when it shrinks.
      padding: "calc(4 * var(--qrcode-pixel-size))",
      border: "2px solid token(colors.border.default)",
      borderRadius: "1rem",
      background: "bg.surface",
    },
    content: { position: "relative" },
    frame: { display: "block", width: "100%", height: "auto", fill: "fg.default" },
    logo: {
      position: "absolute",
      top: "50%",
      left: "50%",
      translate: "-50% -50%",
      display: "block",
      width: "42%",
      height: "auto",
      filter:
        "drop-shadow(2px 0 0 token(colors.bg.surface)) drop-shadow(-2px 0 0 token(colors.bg.surface)) drop-shadow(0 2px 0 token(colors.bg.surface)) drop-shadow(0 -2px 0 token(colors.bg.surface))",
      pointerEvents: "none",
    },
  },
});
