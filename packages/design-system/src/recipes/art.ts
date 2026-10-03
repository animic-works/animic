import { defineRecipe } from "@pandacss/dev";

// 挿絵のSVG（キャラクターの絵）。枠いっぱいに広げる
export const artImage = defineRecipe({
  className: "art-image",
  description: "キャラクターの挿絵。置いた枠いっぱいに広がる",
  base: { display: "block", width: "full", height: "full" },
});
