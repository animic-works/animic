import { defineSlotRecipe } from "@pandacss/dev";
import { focus } from "../control";
export const segmentedControl = defineSlotRecipe({
  className: "segmented-control",
  slots: ["root", "item", "label", "control"],
  base: {
    root: {
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
      "&:has(> input:focus-visible)": focus,
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
});
