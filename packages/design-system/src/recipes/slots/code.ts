import { defineSlotRecipe } from "@pandacss/dev";

// ルームコードの入力: 8マスに1文字ずつ入れる（Ark UIのPinInputに対応づける）
export const codeInput = defineSlotRecipe({
  className: "code-input",
  description: "8文字のルームコードを1文字ずつ入れる入力。貼り付け・読み上げに対応する",
  slots: ["root", "label", "control", "input", "message"],
  base: {
    root: { display: "grid", gap: "4", minWidth: "0" },
    label: { textStyle: "label", color: "fg.default" },
    control: {
      display: "grid",
      gridTemplateColumns: "repeat(8, minmax(0, 1fr))",
      gap: "clamp(0.25rem, 1.2vw, 0.4rem)",
    },
    input: {
      width: "full",
      minWidth: "0",
      aspectRatio: "3 / 4",
      p: "0",
      borderWidth: "thick",
      borderStyle: "solid",
      borderColor: "border.default",
      borderRadius: "0.6rem",
      bg: "bg.surface",
      fontFamily: "mono",
      fontSize: "clamp(1.1rem, 5vw, 1.5rem)",
      fontWeight: "bold",
      lineHeight: "none",
      textAlign: "center",
      textTransform: "uppercase",
      color: "fg.default",
      caretColor: "accent.brand",
      outline: "none",
      transitionProperty: "border-color, background-color, box-shadow",
      transitionDuration: "fast",
      // 空のマスは小さな点で示す
      _placeholder: { color: "border.default" },
      "&[data-filled]": { borderColor: "border.strong", bg: "accent.subtle" },
      // 次に入力するマス
      _focus: { borderColor: "accent.brand", boxShadow: "0 0 0 3px rgb(255 45 135 / 0.18)" },
      "&[data-invalid]": {
        borderColor: "danger.default",
        bg: "danger.subtle",
        color: "danger.default",
      },
      "&[data-complete]": { borderColor: "accent.brand" },
    },
    message: {
      m: "0",
      minHeight: "1.4em",
      textAlign: "center",
      fontSize: "0.8rem",
      color: "fg.description",
      "&[data-error]": { color: "danger.default", fontWeight: "bold" },
    },
  },
});

// ルームコードの表示: 1文字ずつマスに入れて見せる（入力はできない）
export const codeDisplay = defineSlotRecipe({
  className: "code-display",
  description: "決まったルームコードを1文字ずつマスで見せる。大きさは置く場所で選ぶ",
  slots: ["root", "cell"],
  base: {
    root: { display: "grid", gap: "0.3rem" },
    cell: {
      display: "grid",
      placeItems: "center",
      aspectRatio: "3 / 4",
      borderRadius: "0.6rem",
      bg: "bg.surface",
      borderWidth: "thick",
      borderStyle: "solid",
      borderColor: "border.default",
      fontFamily: "mono",
      fontWeight: "bold",
      color: "fg.default",
      // 画面遷移のあと、1文字ずつ弾んで現れる
      _entering: {
        animation: "char-pop 0.45s token(easings.pop) both",
        animationDelay: "calc(1.1s + var(--char-index, 0) * 0.05s)",
      },
    },
  },
  variants: {
    size: {
      // ロビーの見出しの横
      md: {
        root: {
          gridTemplateColumns: "repeat(8, 2.2rem)",
          mdDown: { gridTemplateColumns: "repeat(8, minmax(0, 1fr))" },
        },
        cell: { fontSize: "1.2rem" },
      },
      // 招待のダイアログ
      sm: {
        root: { display: "flex", justifyContent: "center" },
        cell: { width: "2.1rem", borderRadius: "sm", fontSize: "1.1rem" },
      },
    },
  },
  defaultVariants: { size: "md" },
});
