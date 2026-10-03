import { defineSemanticTokens } from "@pandacss/dev";

// 影と動きの用途。部品はこちらを使う
export const shadows = defineSemanticTokens.shadows({
  surface: { value: "{shadows.md}" },
  elevated: { value: "{shadows.lg}" },
  accent: { value: "{shadows.glow}" },
});

export const radii = defineSemanticTokens.radii({
  // 部品の角丸の役割
  control: { value: "{radii.full}" },
  // 入力欄（ルームコードや表示名）
  field: { value: "0.9rem" },
  card: { value: "{radii.xl}" },
  panel: { value: "{radii.lg}" },
  chip: { value: "{radii.sm}" },
});
