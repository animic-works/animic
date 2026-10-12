import { defineStyles } from "@pandacss/dev";

/** 入力・表示・確定演出で共有する、1文字の配置と書体。寸法と状態は各Recipeが持つ。 */
export const codeCharacter = defineStyles({
  boxSizing: "border-box",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: 0,
  padding: "0",
  textStyle: "code.character",
});
