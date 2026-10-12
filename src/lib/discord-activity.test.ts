import { describe, expect, it } from "vite-plus/test";
import { isDiscordActivityRequest } from "./discord-activity";

describe("Discordの埋め込み用Cookieの選択", () => {
  it("設定したアプリのproxy originだけを許可する", () => {
    for (const origin of [
      "https://other.discordsays.com",
      "https://123.discordsays.com.evil.test",
      "null",
      "http://123.discordsays.com",
    ])
      expect(isDiscordActivityRequest(new Headers({ Origin: origin }), "123")).toBe(false);
    expect(
      isDiscordActivityRequest(new Headers({ Origin: "https://123.discordsays.com" }), "123"),
    ).toBe(true);
  });
  it("GETのRefererにも対応するが、別OriginをRefererで上書きしない", () => {
    const headers = new Headers({ Referer: "https://123.discordsays.com/activity?frame_id=test" });
    expect(isDiscordActivityRequest(headers, "123")).toBe(true);
    headers.set("Origin", "https://evil.test");
    expect(isDiscordActivityRequest(headers, "123")).toBe(false);
    expect(isDiscordActivityRequest(new Headers(), "123")).toBe(false);
  });
});
