import * as v from "valibot";
import { describe, expect, it } from "vite-plus/test";

import { galleryItemTextSchema, howSteps, mergeHomeItems, siteImageIdOf } from "./home-content";

const metrics = { ccip: 57.4, pixai: 37.8, siglip2: 94.8, dinov2: 54, depth: 53.8 };
const gallery = {
  difficulty: "easy",
  score: 59.3,
  metrics,
  topicAlt: " お題の説明 ",
  shotAlt: "提出の説明",
};

function issue(input: unknown) {
  const result = v.safeParse(galleryItemTextSchema, input);
  return result.success ? null : result.issues[0].message;
}

describe("トップページの内容", () => {
  it("保存していない遊び方の項目は既定の文言にし、固定の順番で並べる", () => {
    const saved = { id: "how-3", title: "生成", description: "本文", image: "/site-images/x" };
    const items = mergeHomeItems(howSteps, [saved]);
    expect(items.map((item) => item.id)).toEqual(["how-1", "how-2", "how-3", "how-4"]);
    expect(items[2]).toEqual(saved);
    expect(items[0]).toEqual({
      id: "how-1",
      title: howSteps[0].title,
      description: howSteps[0].description,
      image: null,
    });
  });

  it("ギャラリーの点数は0〜100、説明は空にできない", () => {
    expect(v.parse(galleryItemTextSchema, gallery).topicAlt).toBe("お題の説明");
    expect(issue({ ...gallery, score: 100.1 })).toBe("再現度は0〜100で入力してください。");
    expect(issue({ ...gallery, metrics: { ...metrics, ccip: -1 } })).toBe(
      "キャラクターは0〜100で入力してください。",
    );
    expect(issue({ ...gallery, score: Number.NaN })).toBe("再現度を数字で入力してください。");
    expect(issue({ ...gallery, shotAlt: " " })).toBe("提出の説明を入力してください。");
  });

  it("登録した画像のパスから画像IDを取り出し、初期データの画像では取り出さない", () => {
    const id = "0b6a5c9e-3f1d-4c2a-9e8b-7d6f5a4b3c2d";
    expect(siteImageIdOf(`/site-images/${id}`)).toBe(id);
    expect(siteImageIdOf("/images/gallery-c12-topic.webp")).toBeNull();
  });
});
