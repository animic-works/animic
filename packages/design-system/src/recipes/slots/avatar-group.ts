import { defineSlotRecipe } from "@pandacss/dev";
import { focus } from "../control";
export const avatarGroup = defineSlotRecipe({
  className: "avatar-group",
  slots: ["frame", "summary", "root", "item", "text", "name", "detail", "value", "marker"],
  base: {
    // 一覧の利用可能幅は外側の枠で測り、一覧は項目の幅に合わせて端へ寄せる。
    frame: {
      display: "flex",
      alignItems: "center",
      justifyContent: "end",
      gap: "3",
      minWidth: 0,
      containerType: "inline-size",
      containerName: "animic-avatar-group",
    },
    summary: { display: "grid", flexShrink: 0 },
    root: {
      flex: "0 1 auto",
      minWidth: 0,
      _avatarGroupNarrow: {
        flex: "1 1 auto",
        justifyContent: "space-between",
        border: "0",
        background: "bg.subtle",
        padding: "0.15rem 0.3rem",
      },
      display: "flex",
      alignItems: "center",
      justifyContent: "start",
      gap: "2",
      listStyle: "none",
      margin: "0",
      padding: "0.3rem",
      border: "2px solid token(colors.border.default)",
      borderRadius: "full",
      background: "bg.surface",
      overflowX: "auto",
      _focusVisible: focus,
    },
    item: {
      position: "relative",
      display: "flex",
      alignItems: "center",
      gap: "2",
      minWidth: 0,
      borderRadius: "full",
      // 本人の項目は淡いピンクの地に、内側へ白い縁を足して明るくする。
      "&[data-current]": {
        background:
          "color-mix(in srgb, token(colors.bg.accent.primary) 70%, token(colors.neutral.0))",
        boxShadow: "inset 0 0 0 2px token(colors.neutral.0)",
      },
    },
    text: { minWidth: 0, display: "grid", _avatarGroupCompact: { display: "none" } },
    name: {
      textStyle: "label.supporting",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
    },
    detail: { textStyle: "caption", whiteSpace: "nowrap", color: "fg.supporting" },
    value: {
      marginInlineStart: "auto",
      textStyle: "numeric.supporting",
      whiteSpace: "nowrap",
      _avatarGroupCompact: { fontSize: "0.85rem" },
    },
    marker: {
      position: "absolute",
      top: "-0.45rem",
      left: "1.6rem",
      display: "grid",
      placeItems: "center",
      minWidth: "1.3rem",
      height: "1.3rem",
      paddingInline: "1",
      borderRadius: "full",
      background: "bg.inverse",
      color: "fg.inverse",
      textStyle: "code.compact",
      fontSize: "0.62rem",
    },
  },
  variants: {
    // 狭い幅で全員の名前を並べきれない人数（4人以上）。アバターだけにする。
    crowded: { true: {}, false: {} },
    presentation: {
      // 項目は同じ幅から等しく縮め、状態の文言が変わっても並びをずらさない。
      // 縮めきれない人数では一覧を横にスクロールする。
      compact: {
        item: {
          flex: "0 1 8.25rem",
          minWidth: "6rem",
          gap: "0.4rem",
          padding: "0.2rem 0.85rem 0.2rem 0.2rem",
          // 本人の項目は状態の文言を省略しない幅を保つ。
          "&[data-current]": { flex: "0 0 auto", minWidth: "9.25rem", maxWidth: "11rem" },
          _avatarGroupCompact: {
            flexBasis: "auto",
            minWidth: 0,
            padding: "0.2rem",
            "&[data-current]": { minWidth: 0 },
          },
        },
        // 名前と状態は小さめの文字で2行に収め、一覧の高さを抑える。
        name: { fontSize: "0.8rem", lineHeight: "1.2" },
        detail: {
          fontSize: "0.65rem",
          lineHeight: "1.2",
          overflow: "hidden",
          textOverflow: "ellipsis",
        },
      },
      // 一覧は項目の幅に合わせて中央に置き、収まらない人数では横にスクロールする。
      expanded: {
        text: { _avatarGroupCompact: { display: "grid" } },
        frame: { justifyContent: "center" },
        root: {
          flex: "0 1 auto",
          justifyContent: "start",
          flexWrap: "nowrap",
          padding: "0.8rem",
          borderRadius: "1.4rem",
          _avatarGroupNarrow: {
            background: "bg.surface",
            border: "2px solid token(colors.border.default)",
            padding: "2",
            justifyContent: "start",
          },
        },
        item: {
          flex: "0 0 12.5rem",
          padding: "0.45rem 0.9rem 0.45rem 0.45rem",
          background: "bg.surface",
          border: "2px solid token(colors.border.default)",
          // 本人の項目は白い面に濃いピンクの枠で示し、値の色の読みやすさを保つ。
          "&[data-current]": { background: "bg.surface", borderColor: "accent.primary" },
          transition: "background 300ms, transform 400ms cubic-bezier(.3,1.6,.5,1), opacity 300ms",
          // 待機中の項目も同じ枠と高さで並べ、薄くして区別する。
          "&[data-state=pending]": { background: "bg.subtle", opacity: "0.55" },
          "&[data-state=active]": {
            background: "bg.surface",
            borderColor: "accent.primary",
            transform: "translateY(-3px)",
            boxShadow:
              "0 10px 22px -12px color-mix(in srgb, token(colors.accent.primary) 70%, transparent)",
          },
          _motionReduce: { transition: "none" },
          _avatarGroupNarrow: { flexBasis: "auto" },
        },
        // 順位などの印はアバターに重ねず、項目の右端（値の後ろ）に並べる。
        value: { order: 1, fontSize: "1.05rem" },
        marker: { position: "static", order: 2, flexShrink: 0 },
      },
    },
  },
  compoundVariants: [
    // 人数が多ければ、狭い画面ではアバターだけを均等に並べる（状態は輪と印で示す）。
    {
      presentation: "compact",
      crowded: true,
      css: {
        text: { _avatarGroupNarrow: { display: "none" } },
        item: {
          _avatarGroupNarrow: {
            flexBasis: "auto",
            minWidth: 0,
            padding: "0.2rem",
            "&[data-current]": { minWidth: 0 },
          },
        },
      },
    },
    // 人数が少なければ、狭い幅でも名前と状態を出し、項目を左から並べる。
    {
      presentation: "compact",
      crowded: false,
      css: {
        root: { _avatarGroupNarrow: { justifyContent: "start" } },
        text: { _avatarGroupCompact: { display: "grid" } },
        item: {
          _avatarGroupCompact: {
            flex: "0 1 auto",
            padding: "0.2rem 0.85rem 0.2rem 0.2rem",
          },
        },
      },
    },
  ],
  defaultVariants: { presentation: "compact", crowded: true },
});
