import { describe, expect, it } from "vite-plus/test";

import { getScoreRank } from "./score-rank";

describe("点数のランク", () => {
  it("85点以上をS、70点以上をA、55点以上をB、40点以上をC、それより低い点をDにする", () => {
    expect(
      [100, 85, 84.9, 70, 69.9, 55, 54.9, 40, 39.9, 0].map((score) => getScoreRank(score).rank),
    ).toEqual(["S", "S", "A", "A", "B", "B", "C", "C", "D", "D"]);
  });
});
