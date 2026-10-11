import * as v from "valibot";
import { describe, expect, it } from "vite-plus/test";

import { defaultScoringWeights, scoringWeightsSchema, weightedTotal } from "./scoring-metrics";

const scores = { ccip: 90, pixai: 70, siglip2: 60, dinov2: 50, depth: 40 };

describe("weightedTotal", () => {
  it("既定の重みでは採点ノードと同じ加重平均を小数3桁で返す", () => {
    // 0.35*90 + 0.25*70 + 0.20*60 + 0.10*50 + 0.10*40
    expect(weightedTotal(scores, defaultScoringWeights)).toBe(70);
    expect(weightedTotal({ ...scores, pixai: 71.11 }, defaultScoringWeights)).toBe(70.278);
  });

  it("点のない指標を除き、残りの重みで割り直す", () => {
    // (0.25*70 + 0.20*60 + 0.10*50 + 0.10*40) / 0.65
    expect(weightedTotal({ ...scores, ccip: null }, defaultScoringWeights)).toBe(59.231);
  });

  it("点のある指標の重みがすべて0ならnullにする", () => {
    const onlyCcip = { ccip: 100, pixai: 0, siglip2: 0, dinov2: 0, depth: 0 };
    expect(weightedTotal({ ...scores, ccip: null }, onlyCcip)).toBeNull();
    expect(
      weightedTotal(
        { ccip: null, pixai: null, siglip2: null, dinov2: null, depth: null },
        defaultScoringWeights,
      ),
    ).toBeNull();
  });
});

const message = (input: unknown) => v.safeParse(scoringWeightsSchema, input).issues?.[0].message;

describe("scoringWeightsSchema", () => {
  it("合計100の整数を受け付ける", () => {
    expect(v.parse(scoringWeightsSchema, defaultScoringWeights)).toEqual(defaultScoringWeights);
  });

  it("合計が100でない・整数でない・CCIPだけに重みがある値を拒否する", () => {
    expect(message({ ...defaultScoringWeights, depth: 20 })).toBe(
      "重みの合計を100にしてください。",
    );
    expect(message({ ...defaultScoringWeights, depth: 9.5, dinov2: 10.5 })).toBe(
      "重みは整数で入力してください。",
    );
    expect(message({ ccip: 100, pixai: 0, siglip2: 0, dinov2: 0, depth: 0 })).toBe(
      "CCIP以外の指標にも重みを付けてください。人物のいない画像はCCIPを除いて採点します。",
    );
  });
});
