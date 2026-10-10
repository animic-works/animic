import { definePattern } from "@pandacss/dev";

export const imagePair = definePattern({
  strict: true,
  properties: { sizing: { type: "enum", value: ["fill", "intrinsic"] } },
  defaultValues: { sizing: "fill" },
  transform({ sizing }, { map }) {
    return {
      position: "relative",
      "& > [data-animic-image-pair-summary]": {
        position: "absolute",
        top: "50%",
        left: "50%",
        translate: "-50% -50%",
        width: "5rem",
        height: "5rem",
        borderRadius: "full",
        background: "bg.inverse",
        color: "fg.inverse",
        border: "4px solid token(colors.bg.surface)",
        display: "grid",
        alignContent: "center",
        justifyItems: "center",
        zIndex: 1,
      },
      containerType: map(sizing, (v) => (v === "intrinsic" ? "normal" : "inline-size")),
      containerName: "animic-image-pair",
      minWidth: 0,
      "& figure > svg, & figure > img": {
        display: "block",
        maxWidth: map(sizing, (v) => (v === "intrinsic" ? "100%" : undefined)),
        height: map(sizing, (v) => (v === "intrinsic" ? "auto" : undefined)),
      },
      "& > [data-animic-image-pair-layout] > figure": {
        position: "relative",
        display: "flex",
        flexDirection: "column",
        margin: "0",
        minWidth: 0,
      },
      // 画像の右下に重ねる補足（採点の内訳など）。狭い画面では画像を隠しすぎるため出さない。
      "& > [data-animic-image-pair-layout] > figure > [data-animic-image-pair-detail]": {
        position: "absolute",
        insetBlockEnd: "3",
        insetInlineEnd: "3",
        zIndex: 1,
        layerStyle: "surface.raised",
        borderRadius: "1",
        paddingBlock: "2",
        paddingInline: "3",
        _imagePairCompact: { display: "none" },
      },
      "& > [data-animic-image-pair-layout] > figure > figcaption": {
        position: "absolute",
        insetBlockStart: "3",
        insetInlineStart: "3",
        "&[data-placement=above]": {
          position: "static",
          order: -1,
          marginBottom: "3",
          textStyle: "label.supporting",
        },
      },
      "& > [data-animic-image-pair-layout]": {
        display: "grid",
        gridTemplateColumns: map(sizing, (v) =>
          v === "intrinsic" ? "repeat(2, minmax(0, max-content))" : "repeat(2, minmax(0, 1fr))",
        ),
        justifyContent: "center",
        gap: map(sizing, (v) => (v === "intrinsic" ? "4" : "3")),
        _imagePairCompact: { gap: "3" },
        _imagePairWide: { gap: "4" },
        "& > *": { minWidth: 0 },
      },
    };
  },
});
