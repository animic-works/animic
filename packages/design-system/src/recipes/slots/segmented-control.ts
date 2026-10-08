import { defineSlotRecipe } from "@pandacss/dev";
import { focus } from "../control";
export const segmentedControl = defineSlotRecipe({
  className: "segmented-control",
  slots: [
    "root",
    "layout",
    "groupLabel",
    "group",
    "item",
    "label",
    "control",
    "icon",
    "marker",
    "detail",
  ],
  base: {
    marker: {
      width: "0.45rem",
      height: "0.45rem",
      borderRadius: "full",
      flexShrink: 0,
      background: "fg.default",
    },
    icon: { display: "inline-flex", alignItems: "center", flexShrink: 0 },
    detail: {
      display: "inline-flex",
      alignItems: "center",
      gap: "2",
      marginInlineStart: "auto",
      textStyle: "caption",
      color: "fg.muted",
    },
    root: { minWidth: 0 },
    layout: { display: "grid", gap: "3", minWidth: 0 },
    groupLabel: { textStyle: "label.supporting" },
    group: {
      display: "flex",
      flexWrap: "wrap",
      gap: "3",
      padding: "2",
      borderRadius: "2",
      layerStyle: "surface.subtle",
    },
    item: {
      boxSizing: "border-box",
      display: "inline-flex",
      alignItems: "center",
      gap: "3",
      minHeight: "control.0",
      paddingInline: "4",
      paddingBlock: "3",
      borderWidth: "2",
      borderStyle: "solid",
      borderColor: "border.default",
      borderRadius: "1",
      background: "bg.surface",
      color: "fg.default",
      cursor: "pointer",
      _checked: {
        background: "selection.bg",
        borderColor: "selection.border",
        color: "selection.fg",
      },
      // Itemはlabel要素で、フォーカス対象は子のradio。ポインター操作だけではリングを出さない。
      _focusWithinVisible: focus,
      _disabled: {
        background: "disabled.bg",
        color: "disabled.fg",
        borderColor: "disabled.border",
        cursor: "not-allowed",
      },
    },
    label: { textStyle: "label", overflowWrap: "anywhere" },
    control: {
      width: "icon.0",
      height: "icon.0",
      borderWidth: "2",
      borderStyle: "solid",
      borderColor: "border.strong",
      borderRadius: "full",
      _checked: {
        background: "selection.border",
        boxShadow: "inset 0 0 0 3px token(colors.bg.surface)",
      },
    },
  },
  compoundVariants: [
    {
      appearance: "pill",
      density: "comfortable",
      css: {
        item: {
          _segmentedControlCompact: {
            minHeight: "2.5rem",
            padding: "0 0.2rem",
          },
        },
        label: { _segmentedControlCompact: { fontSize: "0.9rem" } },
      },
    },
    {
      appearance: "pill",
      density: "compact",
      css: {
        item: { minHeight: "1.5rem", padding: "0.2rem 0.6rem" },
        label: { textStyle: "caption", fontWeight: "bold" },
      },
    },
  ],
  variants: {
    markerTone: {
      ink: { marker: { background: "fg.default" } },
      pink: { marker: { background: "pink.2" } },
      rose: { marker: { background: "pink.1" } },
      red: { marker: { background: "red.0" } },
      orange: { marker: { background: "orange.0" } },
      amber: { marker: { background: "yellow.1" } },
      yellow: { marker: { background: "yellow.0" } },
      green: { marker: { background: "green.0.5" } },
      forest: { marker: { background: "green.1" } },
      cyan: { marker: { background: "cyan.0" } },
      purple: { marker: { background: "violet.0" } },
      slate: { marker: { background: "neutral.5" } },
    },
    labelVisibility: {
      hidden: {
        groupLabel: {
          position: "absolute",
          width: "1px",
          height: "1px",
          overflow: "hidden",
          clipPath: "inset(50%)",
          whiteSpace: "nowrap",
        },
      },
      visible: {
        root: {
          containerType: "inline-size",
          containerName: "animic-segmented-control",
        },
      },
    },
    labelPlacement: {
      stacked: {},
      inline: {
        layout: {
          gridTemplateColumns: "minmax(0, 1fr)",
          alignItems: "center",
          gap: "0.45rem",
          _segmentedControlWide: {
            _segmentedControlInline: {
              gridTemplateColumns: "6.4rem minmax(0, 1fr)",
              gap: "0.75rem",
            },
          },
        },
        groupLabel: {
          fontSize: "0.8rem",
          color: "fg.muted",
          _segmentedControlWide: {
            _segmentedControlInline: {
              fontSize: "0.85rem",
              color: "fg.default",
            },
          },
        },
      },
    },
    density: { comfortable: {}, compact: {} },
    enclosure: {
      subtle: {},
      outlined: {
        group: { background: "bg.surface", border: "2px solid token(colors.border.default)" },
      },
    },
    appearance: {
      list: {
        group: {
          display: "flex",
          flexDirection: "column",
          gap: "1",
          padding: "0",
          _collectionCompact: { flexDirection: "row", flexWrap: "nowrap" },
        },
        item: {
          minHeight: "2.25rem",
          padding: "0.5rem 0.7rem",
          border: "0",
          borderRadius: "0.7rem",
          background: "transparent",
          _checked: {
            background: "bg.accent.primary",
            color: "action.link.fg",
          },
          _collectionCompact: { flexShrink: 0 },
        },
        label: { textStyle: "label.supporting", whiteSpace: "nowrap" },
        control: { display: "none" },
      },
      chips: {
        group: { padding: "0", gap: "2", background: "transparent" },
        item: {
          minHeight: "1.7rem",
          padding: "0.25rem 0.6rem",
          borderRadius: "full",
          borderWidth: "1",
          borderColor: "transparent",
          background: "var(--animic-option-bg, token(colors.bg.subtle))",
          color: "var(--animic-option-fg, token(colors.fg.default))",
          _checked: {
            background: "var(--animic-option-bg, token(colors.selection.bg))",
            borderColor: "var(--animic-option-border, token(colors.selection.border))",
            color: "var(--animic-option-fg, token(colors.fg.default))",
          },
        },
        label: { textStyle: "caption" },
        control: { display: "none" },
      },
      outlined: {},
      pill: {
        group: {
          display: "grid",
          gridAutoFlow: "column",
          gridAutoColumns: "minmax(0, 1fr)",
          gap: "0",
          padding: "2",
          borderRadius: "full",
        },
        item: {
          minWidth: 0,
          justifyContent: "center",
          border: "0",
          borderRadius: "full",
          padding: "0.5rem 0.3rem",
          minHeight: "2.25rem",
          background: "transparent",
          color: "fg.muted",
          _checked: { background: "fg.default", color: "fg.inverse" },
          _disabled: { background: "disabled.bg", color: "disabled.fg" },
        },
        label: {
          textStyle: "label.supporting",
          fontSize: "0.85rem",
        },
        control: { display: "none" },
      },
    },
    tone: {
      violet: {
        item: {
          "&[data-state=checked]:not([data-disabled])": {
            background: "violet.0",
            color: "fg.inverse",
          },
        },
      },
      green: {
        item: {
          "--animic-option-bg": "token(colors.green.0)",
          "--animic-option-fg": "token(colors.green.1)",
          "--animic-option-border": "token(colors.teal.0)",
        },
      },
      yellow: {
        item: {
          "--animic-option-bg": "token(colors.bg.accent.highlight)",
          "--animic-option-fg": "token(colors.fg.accent.highlight)",
          "--animic-option-border": "token(colors.accent.highlight)",
        },
      },
      cyan: {
        item: {
          "--animic-option-bg": "token(colors.bg.accent.secondary)",
          "--animic-option-fg": "token(colors.fg.accent.secondary)",
          "--animic-option-border": "token(colors.accent.secondary)",
        },
      },
      neutral: {},
      accent: {
        item: {
          "&[data-state=checked]:not([data-disabled])": {
            background: "accent.primary",
            color: "fg.inverse",
          },
        },
      },
    },
  },
  defaultVariants: {
    labelVisibility: "hidden",
    labelPlacement: "stacked",
    density: "comfortable",
  },
});
