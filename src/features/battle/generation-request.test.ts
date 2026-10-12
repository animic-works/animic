import { describe, expect, it } from "vite-plus/test";
import { getGenerationId } from "./generation-request";

describe("生成の要求の処理ID", () => {
  const unsent = { battleId: "battle", input: "prompt", generationId: "sent-id" };
  it("送れなかった要求を同じ対戦・同じ入力で送り直すときは同じIDを使う", () => {
    expect(getGenerationId(unsent, { battleId: "battle", input: "prompt" }, [])).toBe("sent-id");
  });
  it("入力や対戦が変わったら新しいIDを使う", () => {
    expect(getGenerationId(unsent, { battleId: "battle", input: "changed" }, [])).not.toBe(
      "sent-id",
    );
    expect(getGenerationId(unsent, { battleId: "next", input: "prompt" }, [])).not.toBe("sent-id");
    expect(getGenerationId(null, { battleId: "battle", input: "prompt" }, [])).not.toBe("sent-id");
  });
  it("送れなかったはずの要求が生成履歴に届いていれば、受け付け済みのため新しいIDを使う", () => {
    const id = getGenerationId(unsent, { battleId: "battle", input: "prompt" }, ["sent-id"]);
    expect(id).not.toBe("sent-id");
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });
});
