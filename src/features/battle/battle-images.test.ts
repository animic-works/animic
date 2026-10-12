import { describe, expect, it } from "vite-plus/test";
import { getBattleImages, getImagesNotice } from "./battle-images";

const image = (id: string, acceptedAt: number) => ({
  id,
  acceptedAt,
  status: "succeeded" as const,
  finishedAt: acceptedAt + 1,
  imageUrl: `https://example.invalid/${id}.png`,
});

describe("生成履歴と提出候補", () => {
  const generations = [
    image("b", 20),
    { id: "p", acceptedAt: 30, status: "pending" as const },
    image("a", 10),
  ];
  it("受付順に並べ、番号を付け、最新の完成画像を提出候補にする", () => {
    const images = getBattleImages(generations, null, null);
    expect(images.ordered.map((item) => item.id)).toEqual(["a", "b", "p"]);
    expect(images.numberOf("p")).toBe(3);
    expect(images.selected?.id).toBe("b");
    expect(images.pendings.map((item) => item.id)).toEqual(["p"]);
  });
  it("選んだ画像を候補にし、選んだ後に新しい画像が完成したら最新に戻す", () => {
    expect(getBattleImages(generations, { id: "a", after: 2 }, null).selected?.id).toBe("a");
    expect(getBattleImages(generations, { id: "a", after: 1 }, null).selected?.id).toBe("b");
  });
  it("提出した画像を返す", () => {
    expect(getBattleImages(generations, null, "a").submitted?.id).toBe("a");
  });
});

describe("比較の見出しの案内", () => {
  it("選べる画像がまだなければ、選ぶように促さない", () => {
    expect(getImagesNotice(getBattleImages([], null, null), false)).toBeNull();
    const pending = [{ id: "p", acceptedAt: 10, status: "pending" as const }];
    expect(getImagesNotice(getBattleImages(pending, null, null), false)).toBeNull();
  });
  it("選んでいる画像は比較の枠で見えるため、案内を出さない", () => {
    expect(getImagesNotice(getBattleImages([image("a", 10)], null, null), false)).toBeNull();
  });
  it("提出済み・時間切れのときはそのことを出す", () => {
    expect(getImagesNotice(getBattleImages([image("a", 10)], null, "a"), false)).toBe(
      "#1 を提出しました",
    );
    const failed = [{ id: "f", acceptedAt: 10, status: "failed" as const, finishedAt: 11 }];
    expect(getImagesNotice(getBattleImages(failed, null, null), true)).toBe(
      "時間切れのため提出できません",
    );
  });
});
