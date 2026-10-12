import { describe, expect, it } from "vite-plus/test";

import { isSearchIndexable } from "./search-indexing";

describe("検索対象", () => {
  const image = "/site-images/550e8400-e29b-41d4-a716-446655440000";
  it.each([
    ["animic.party", "/", 200, "text/html; charset=utf-8", true],
    ["animic.party", "/?utm_source=x", 200, "text/html", true],
    ["animic.party", "/?frame_id=test&instance_id=test", 200, "text/html", false],
    ["animic.party", "/", 500, "text/html", false],
    ["animic.party", "/", 404, "text/html", false],
    ["animic.party", "/", 200, "application/json", false],
    ["animic.party", image, 200, "image/png", true],
    ["animic.party", image, 200, "image/webp", true],
    ["animic.party", image, 404, "text/plain", false],
    ["animic.party", image, 200, "text/html", false],
    ["animic.party", "/site-images/not-an-image", 200, "image/png", false],
    ["animic.party", "/generated-images/battle/image", 200, "image/webp", false],
    ["animic.party", "/topic-images/topic/image", 200, "image/webp", false],
    ["animic.party", "/phrase-images/phrase/image", 200, "image/webp", false],
    ["animic.party", "/rooms/ABCDEFGH", 200, "text/html", false],
    ["animic.party", "/mypage", 200, "text/html", false],
    ["animic.party", "/admin", 200, "text/html", false],
    ["dev.animic.party", "/", 200, "text/html", false],
    ["animic.example.workers.dev", image, 200, "image/png", false],
  ])("%s%s (%s, %s) → %s", (host, path, status, type, expected) => {
    expect(
      isSearchIndexable(
        new URL(`https://${host}${path}`),
        new Response(null, {
          status,
          headers: { "Content-Type": type },
        }),
      ),
    ).toBe(expected);
  });
});
