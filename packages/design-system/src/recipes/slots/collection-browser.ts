import { defineSlotRecipe } from "@pandacss/dev";
export const collectionBrowser = defineSlotRecipe({
  className: "collection-browser",
  slots: ["root", "filters", "main", "heading", "items", "empty"],
  base: {
    root: {
      display: "grid",
      gridTemplateColumns: "11rem minmax(0, 1fr)",
      minHeight: 0,
      height: "100%",
      _collectionCompact: {
        gridTemplateColumns: "minmax(0, 1fr)",
        gridTemplateRows: "auto minmax(0, 1fr)",
      },
    },
    filters: {
      minWidth: 0,
      minHeight: 0,
      overflowY: "auto",
      padding: "3",
      borderRight: "1px solid token(colors.border.default)",
      background: "bg.subtle",
      _collectionCompact: {
        overflowX: "auto",
        overflowY: "hidden",
        borderRight: "0",
        borderBottom: "1px solid token(colors.border.default)",
      },
    },
    main: { minWidth: 0, minHeight: 0, overflowY: "auto", padding: "4" },
    heading: { marginBottom: "3" },
    items: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 9rem), 1fr))",
      gap: "3",
      listStyle: "none",
      padding: "0",
      margin: "0",
      alignItems: "start",
    },
    empty: { paddingBlock: "8", textAlign: "center" },
  },
});
