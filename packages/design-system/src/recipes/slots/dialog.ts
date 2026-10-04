import { defineSlotRecipe, defineStyles } from "@pandacss/dev";
const centered = defineStyles({
  alignSelf: "center",
  width: "calc(100% - 2 * token(spacing.5))",
  maxWidth: "50rem",
  maxHeight: "calc(100dvh - 2 * token(spacing.5))",
  borderRadius: "3",
});
export const dialog = defineSlotRecipe({
  className: "dialog",
  slots: ["scrim", "positioner", "content", "title", "description", "body", "close"],
  base: {
    scrim: { position: "fixed", inset: 0, zIndex: "overlay", layerStyle: "overlay.scrim" },
    positioner: {
      position: "fixed",
      inset: 0,
      zIndex: "overlay",
      display: "flex",
      alignItems: "flex-end",
      justifyContent: "center",
      containerType: "inline-size",
      containerName: "animic-dialog",
      fontSize: "2",
    },
    content: {
      boxSizing: "border-box",
      layerStyle: "surface.floating",
      borderRadius: "3",
      borderEndStartRadius: "0",
      borderEndEndRadius: "0",
      padding: "6",
      width: "100%",
      maxHeight: "calc(100dvh - token(spacing.5))",
      overflowY: "auto",
      position: "relative",
      color: "fg.default",
      fontSynthesis: "none",
      "& *, &::before, &::after, & *::before, & *::after": { boxSizing: "border-box" },
    },
    title: {
      textStyle: "heading.md",
      margin: "0",
      paddingInlineEnd: "10",
      overflowWrap: "anywhere",
    },
    description: {
      textStyle: "body.md",
      marginBlockStart: "3",
      marginBlockEnd: "0",
      color: "fg.muted",
    },
    body: { marginBlockStart: "6", minWidth: 0 },
    close: { position: "absolute", insetBlockStart: "5", insetInlineEnd: "5" },
  },
  variants: {
    presentation: {
      adaptive: { content: { _dialogCentered: centered } },
      centered: { content: centered },
    },
  },
  defaultVariants: { presentation: "adaptive" },
});
