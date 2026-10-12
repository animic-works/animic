import { definePattern } from "@pandacss/dev";
export const split = definePattern({
  strict: true,
  properties: {
    layout: {
      type: "enum",
      value: [
        "equal",
        "balanced",
        "main-aside",
        "aside-main",
        "content-media",
        "content-intrinsic",
        "balanced-aside",
      ],
    },
    collapseOrder: { type: "enum", value: ["normal", "reverse"] },
    align: { type: "enum", value: ["start", "stretch"] },
    space: { type: "enum", value: ["compact", "normal", "section"] },
  },
  defaultValues: { collapseOrder: "normal", space: "normal" },
  transform({ layout, collapseOrder, space, align }, { map }) {
    const select = (layouts: readonly string[], value: string) =>
      map(layout, (current) =>
        layouts.some((candidate) => candidate === current) ? value : undefined,
      );
    const placeColumns = (layouts: readonly string[]) => ({
      "& > [data-animic-split-first]": { gridArea: select(layouts, "1 / 1") },
      "& > [data-animic-split-second]": { gridArea: select(layouts, "1 / 2") },
      "&:has(> [data-animic-split-header])": {
        "& > [data-animic-split-header]": { gridArea: select(layouts, "1 / 1") },
        "& > [data-animic-split-first]": { gridArea: select(layouts, "2 / 1") },
        "& > [data-animic-split-second]": { gridArea: select(layouts, "1 / 2 / span 2") },
      },
    });
    return {
      "--animic-split-column-gap": "clamp(2rem, 5vw, 5rem)",
      "--animic-split-row-gap": "clamp(1rem, 3svh, 1.75rem)",
      _splitShort: {
        "--animic-split-column-gap": "1.1rem",
        "--animic-split-row-gap": "1.1rem",
      },
      minWidth: 0,
      height: "100%",
      containerType: "inline-size",
      containerName: "animic-split",
      "& > [data-animic-split-layout]": {
        display: "grid",
        alignItems: align,
        height: "100%",
        minWidth: 0,
        gridTemplateColumns: "minmax(0, 1fr)",
        gap: map(space, (v) => (v === "compact" ? "3" : v === "section" ? "5" : "6")),
        "& > *": { minWidth: 0, display: "grid" },
        "& > [data-animic-split-header]": { gridRow: "1" },
        "& > [data-animic-split-first]": {
          gridRow: map(collapseOrder, (v) => (v === "reverse" ? "2" : "auto")),
        },
        "& > [data-animic-split-second]": {
          gridRow: map(collapseOrder, (v) => (v === "reverse" ? "1" : "auto")),
        },
        "&:has(> [data-animic-split-header])": {
          "& > [data-animic-split-first]": {
            gridRow: map(collapseOrder, (v) => (v === "reverse" ? "3" : "2")),
            alignSelf: "end",
          },
          "& > [data-animic-split-second]": {
            gridRow: map(collapseOrder, (v) => (v === "reverse" ? "2" : "3")),
          },
        },
        _splitEqual: {
          ...placeColumns(["equal"]),
          gridTemplateColumns: select(["equal"], "repeat(2, minmax(0, 1fr))"),
        },
        _splitBalancedColumns: {
          ...placeColumns(["balanced"]),
          gridTemplateColumns: select(["balanced"], "minmax(0, 1.1fr) minmax(0, 1fr)"),
        },
        _splitIntrinsic: {
          ...placeColumns(["content-intrinsic"]),
          gridTemplateColumns: select(["content-intrinsic"], "minmax(18rem, 1fr) max-content"),
          columnGap: select(["content-intrinsic"], "var(--animic-split-column-gap)"),
          rowGap: select(["content-intrinsic"], "var(--animic-split-row-gap)"),
          "& > [data-animic-split-second]": {
            gridArea: select(["content-intrinsic"], "1 / 2"),
            maxWidth: select(
              ["content-intrinsic"],
              "max(0px, calc(100cqw - 18rem - var(--animic-split-column-gap)))",
            ),
          },
        },
        _splitIllustrated: {
          _splitMedia: {
            ...placeColumns(["content-media"]),
            gridTemplateColumns: select(["content-media"], "minmax(0, 0.7fr) minmax(0, 1.3fr)"),
            gap: map(layout, (v) =>
              v === "content-media"
                ? map(space, (s) =>
                    s === "compact" ? "5" : s === "section" ? "clamp(2rem, 5vw, 5rem)" : "6",
                  )
                : undefined,
            ),
          },
        },
        _splitBalanced: {
          ...placeColumns(["balanced-aside"]),
          gridTemplateColumns: select(["balanced-aside"], "minmax(0, 1.55fr) minmax(0, 1fr)"),
          gap: select(["balanced-aside"], "clamp(1.25rem, 2.5vw, 1.75rem)"),
          // 既定は上揃え。`align="stretch"`なら左右の列の高さをそろえる。
          alignItems: select(["balanced-aside"], align === "stretch" ? "stretch" : "start"),
        },
        _splitAsymmetric: {
          ...placeColumns(["main-aside", "aside-main"]),
          gap: map(layout, (v) =>
            v === "main-aside" || v === "aside-main"
              ? map(space, (s) =>
                  s === "compact" ? "5" : s === "section" ? "clamp(2rem, 5vw, 5rem)" : "6",
                )
              : undefined,
          ),
          gridTemplateColumns: map(layout, (v) =>
            v === "main-aside"
              ? "minmax(0, 2fr) minmax(0, 1fr)"
              : v === "aside-main"
                ? "minmax(0, 1fr) minmax(0, 2fr)"
                : undefined,
          ),
        },
      },
    };
  },
});
