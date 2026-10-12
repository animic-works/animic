import { defineSlotRecipe } from "@pandacss/dev";
export const documentLayout = defineSlotRecipe({
  className: "document-layout",
  slots: ["main", "top"],
  base: {
    main: {
      position: "relative",
      width: "100%",
      maxWidth: "50rem",
      marginInline: "auto",
      padding: "5rem 1rem 4rem",
      _documentCompact: { padding: "0.75rem 1rem calc(5rem + env(safe-area-inset-bottom, 0px))" },
    },
    top: {
      position: "fixed",
      zIndex: "navigation",
      right: "4",
      bottom: "calc(1rem + env(safe-area-inset-bottom, 0px))",
    },
  },
});
