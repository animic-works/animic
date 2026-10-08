import { defineSlotRecipe } from "@pandacss/dev";
import { focus } from "../control";
export const tileCollection = defineSlotRecipe({
  className: "tile-collection",
  slots: ["root", "item", "tile", "media", "body", "footer", "badge"],
  base: {
    root: {
      display: "grid",
      gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
      gap: "1rem 0.8rem",
      margin: "0",
      padding: "0.6rem 0 0.2rem",
      listStyle: "none",
      _tileCollectionCompact: { gridTemplateColumns: "minmax(0, 1fr)", gap: "3" },
    },
    item: {
      display: "grid",
      minWidth: 0,
      minHeight: "9.2rem",
      _tileCollectionCompact: { minHeight: "0", _empty: { display: "none" } },
    },
    tile: {
      position: "relative",
      display: "grid",
      width: "100%",
      minWidth: 0,
      justifyItems: "center",
      alignContent: "start",
      gap: "0.3rem",
      padding: "1.05rem 0.5rem 0.8rem",
      border: "2px solid token(colors.border.default)",
      borderRadius: "1.1rem",
      background: "bg.surface",
      color: "fg.default",
      textAlign: "center",
      _tileCollectionCompact: {
        gridTemplateColumns: "auto minmax(0, 1fr) auto",
        alignItems: "center",
        justifyItems: "start",
        textAlign: "start",
        padding: "0.625rem 0.75rem",
        minHeight: "4rem",
        gap: "0.1rem 0.8rem",
        borderRadius: "1rem",
        borderWidth: "1.5px",
      },
    },
    media: {
      display: "grid",
      placeItems: "center",
      _tileCollectionCompact: { gridArea: "1 / 1 / span 2" },
    },
    body: {
      minWidth: 0,
      overflowWrap: "anywhere",
      _tileCollectionCompact: { gridArea: "1 / 2", alignSelf: "end" },
    },
    footer: {
      marginBlockStart: "auto",
      _tileCollectionCompact: { marginBlockStart: "0", gridArea: "2 / 2", alignSelf: "start" },
    },
    badge: {
      position: "absolute",
      top: "-0.75rem",
      left: "50%",
      translate: "-50% 0",
      _tileCollectionCompact: { position: "static", gridArea: "1 / 3 / span 2", translate: "none" },
    },
  },
  variants: {
    selected: {
      true: {
        tile: {
          borderColor: "accent.primary",
          _tileCollectionCompact: {
            background:
              "color-mix(in srgb, token(colors.accent.primary) 4%, token(colors.bg.surface))",
            boxShadow: "none",
          },
          boxShadow: "0 0 0 3px color-mix(in srgb, token(colors.accent.primary) 12%, transparent)",
        },
      },
    },
    interactive: {
      true: {
        tile: {
          cursor: "pointer",
          _focusVisible: focus,
          _hover: { borderColor: "accent.primary" },
        },
      },
    },
    appearance: {
      outline: {},
      placeholder: {
        media: {
          width: "2.75rem",
          height: "2.75rem",
          borderRadius: "full",
          border: "2px dashed token(colors.accent.primary)",
        },
        body: { _tileCollectionCompact: { gridArea: "1 / 2 / span 2", alignSelf: "center" } },
        tile: {
          borderStyle: "dashed",
          borderColor: "accent.primary",
          color: "accent.primary",
          alignContent: "center",
        },
      },
    },
  },
});
