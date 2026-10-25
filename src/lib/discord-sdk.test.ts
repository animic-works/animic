import { Common, Responses } from "@discord/embedded-app-sdk";
import { describe, expect, it, vi } from "vite-plus/test";

describe("Discord SDKのスキーマ互換性", () => {
  it("既知のscopeを維持し、未知のscopeを既存の値へフォールバックする", () => {
    expect(Common.Scopes.parse("identify")).toBe("identify");
    expect(Common.Scopes.parse("future.discord.scope")).toBe(-1);
    expect(
      Responses.AuthenticateResponse.shape.scopes.parse([
        "identify",
        "email",
        "future.discord.scope",
      ]),
    ).toEqual(["identify", "email", -1]);
  });

  it("外部リンクの応答が不正でも既定値を返す", () => {
    expect(Responses.OpenExternalLinkResponse.parse({ opened: true })).toEqual({ opened: true });
    expect(Responses.OpenExternalLinkResponse.parse({ opened: "unknown" })).toEqual({
      opened: null,
    });
    expect(Responses.OpenExternalLinkResponse.parse(undefined)).toEqual({ opened: null });
  });

  it("認可応答の不正な型を拒否する", () => {
    expect(Responses.AuthorizeResponse.safeParse({ code: 123 }).success).toBe(false);
  });

  it("上限超過の配列は各要素を検証する前に拒否する", () => {
    const validateGuild = vi.fn(() => true);
    const schema = Responses.GetGuildsResponse.shape.guilds.element
      .refine(validateGuild)
      .array()
      .max(1);
    const input = Array.from({ length: 10_000 }, () => ({ id: "guild", name: "Guild" }));
    const result = schema.safeParse(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toHaveLength(1);
      expect(result.error.issues[0]?.code).toBe("too_big");
    }
    expect(validateGuild).not.toHaveBeenCalled();
    expect(schema.parse([input[0]])).toEqual([input[0]]);
    expect(validateGuild).toHaveBeenCalledOnce();
  });

  it("非同期検証でも上限超過の配列は各要素を検証しない", async () => {
    const validateGuild = vi.fn(() => Promise.resolve(true));
    const schema = Responses.GetGuildsResponse.shape.guilds.element
      .refine(validateGuild)
      .array()
      .max(1);
    const result = await schema.safeParseAsync(
      Array.from({ length: 10_000 }, () => ({ id: "guild", name: "Guild" })),
    );
    expect(result.success).toBe(false);
    expect(validateGuild).not.toHaveBeenCalled();
  });
});
