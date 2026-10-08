import { defineSlotRecipe } from "@pandacss/dev";
import { focus } from "../control";
import { codeCharacter } from "../code-character";
export const codeDisplay = defineSlotRecipe({
  className: "code-display",
  slots: ["root", "cell", "compact", "copyIcon", "value"],
  base: {
    value: { srOnly: true },
    root: {
      display: "inline-flex",
      maxWidth: "100%",
      alignItems: "center",
      gap: "0.3rem",
      border: "0",
      padding: "0",
      background: "transparent",
      color: "fg.default",
      borderRadius: "0.6rem",
      _focusVisible: focus,
    },
    cell: {
      ...codeCharacter,
      flexShrink: 1,
      width: "2.2rem",
      aspectRatio: "3 / 4",
      border: "2px solid token(colors.border.default)",
      borderRadius: "0.6rem",
      background: "bg.surface",
      fontSize: "1.2rem",
    },
    copyIcon: {
      display: "none",
      flexShrink: 0,
      width: "1.125rem",
      height: "1.125rem",
      color: "fg.supporting",
    },
    compact: { display: "none", textStyle: "code.display", letterSpacing: "0" },
  },
  variants: {
    rolling: {
      true: {
        root: {
          justifyContent: "center",
          maxWidth: "calc(100vw - 2rem)",
          gap: "clamp(0.25rem, 1vw, 0.5rem)",
        },
        cell: {
          width: "clamp(2.1rem, 9.5vw, 3.6rem)",
          border: "0",
          background: "bg.surface",
          color: "fg.subtle",
          fontSize: "clamp(1.2rem, 5vw, 2rem)",
          boxShadow: "0 5px 0 color-mix(in srgb, token(colors.fg.default) 35%, transparent)",
          "&[data-settled]": {
            color: "fg.default",
            animation: "codeSettle 350ms cubic-bezier(0.3, 1.6, 0.5, 1)",
            _motionReduce: { animation: "none" },
          },
        },
      },
    },
    presentation: {
      cells: {},
      inline: {
        root: { verticalAlign: "baseline", whiteSpace: "nowrap", flexShrink: 0 },
        cell: { display: "none" },
        compact: { display: "inline", fontSize: "2" },
      },
      adaptive: {
        root: {
          _codeDisplayCompact: {
            flex: "1 1 0",
            justifyContent: "space-between",
            gap: "2",
            minHeight: "3.25rem",
            background: "bg.subtle",
            border: "2px dashed token(colors.border.default)",
            padding: "0.7rem 0.8rem",
            borderRadius: "0.875rem",
          },
        },
        copyIcon: { _codeDisplayCompact: { display: "block" } },
        cell: { _codeDisplayCompact: { display: "none" } },
        compact: { _codeDisplayCompact: { display: "inline" } },
      },
    },
    size: { md: {}, sm: { compact: { fontSize: "0" } } },
  },
  defaultVariants: { presentation: "adaptive" },
});
