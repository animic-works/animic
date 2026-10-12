import { expect, test } from "@playwright/test";
import { create } from "./api";

const title = "Animic | その一枚に、どこまで近づける？";
const description =
  "お題のイラストをAI画像生成で再現し、どれだけ似せられたかを友だちと競うプロンプト対戦ゲーム";
const shareDescription =
  "お題のイラストを、プロンプトだけでAIに再現させよう。より近い1枚を作ったほうが勝ち！";
const inviteDescription = `Animicでの対戦に招待されました。${shareDescription}`;
const origin = "https://animic.party";

test("検索・共有メタ情報とサイト名が初期HTMLに一度だけ出る", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  try {
    await page.goto("/?utm_source=seo-test");
    await expect(page).toHaveTitle(title);
    await expect(page.locator("title")).toHaveCount(1);
    await expect(page.locator("html")).toHaveAttribute("lang", "ja");
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `${origin}/`);
    for (const [attribute, name, content] of [
      ["name", "description", description],
      ["property", "og:title", "Animic"],
      ["property", "og:description", shareDescription],
      ["property", "og:url", `${origin}/`],
      ["property", "og:site_name", "Animic"],
      ["property", "og:locale", "ja_JP"],
      ["property", "og:image", `${origin}/og-image.png`],
      ["property", "og:image:type", "image/png"],
      ["property", "og:image:width", "1200"],
      ["property", "og:image:height", "630"],
      ["name", "twitter:card", "summary_large_image"],
      ["name", "twitter:title", "Animic"],
      ["name", "twitter:description", shareDescription],
      ["name", "twitter:image", `${origin}/og-image.png`],
    ]) {
      const meta = page.locator(`meta[${attribute}="${name}"]`);
      await expect(meta).toHaveCount(1);
      await expect(meta).toHaveAttribute("content", content);
    }
    const data = page.locator('head script[type="application/ld+json"]');
    await expect(data).toHaveCount(1);
    expect(JSON.parse((await data.textContent()) ?? "null")).toEqual({
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Animic",
      url: `${origin}/`,
      description,
      inLanguage: "ja",
    });
    await expect(page.locator("main h1")).toHaveCount(1);
    // カルーセルの未選択項目も、操作せずにHTMLから読める。
    for (const text of [
      "ルームに集まる",
      "お題が公開される",
      "プロンプトで生成",
      "1枚を提出して勝負",
      "採点方法",
    ])
      await expect(
        page.getByRole("heading", { name: text, exact: true, includeHidden: true }),
      ).toHaveCount(1);
    for (const path of ["/terms", "/privacy"])
      await expect(page.locator(`main a[href="${path}"]`)).toHaveCount(1);
  } finally {
    await context.close();
  }
});

test("画面遷移でトップのメタ情報を残さず、戻ると復元する", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-animic-scrollbars", "ready");
  await page.locator('main a[href="/terms"]').click();
  await expect(page).toHaveURL("/terms");
  await expect(page).toHaveTitle("利用規約 | Animic");
  await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(0);
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
    "content",
    `${origin}/terms`,
  );
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
    "content",
    "利用規約 | Animic",
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
  await page.goBack();
  await expect(page).toHaveTitle(title);
  await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(1);
  await expect(page.locator('meta[property="og:title"]')).toHaveCount(1);
});

test("サイトマップは検索対象の正規URLだけを返し、robotsは取得を妨げない", async ({ request }) => {
  const robots = await request.get("/robots.txt");
  expect(robots.status()).toBe(200);
  expect(robots.headers()["content-type"]).toContain("text/plain");
  expect(await robots.text()).toContain(`Sitemap: ${origin}/sitemap.xml`);
  expect(await robots.text()).not.toMatch(/^Disallow:\s*\//m);
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  expect(sitemap.headers()["content-type"]).toContain("xml");
  const locations = [...(await sitemap.text()).matchAll(/<loc>(.*?)<\/loc>/g)].map(
    (match) => match[1],
  );
  expect(locations).toEqual([`${origin}/`]);
  for (const url of locations) {
    const response = await request.get(new URL(url).pathname, {
      headers: { Host: "animic.party" },
    });
    expect(response.status()).toBe(200);
    expect(response.headers()["x-robots-tag"]).toBeUndefined();
  }
});

test("本番でも個人画面・規約・認証・エラーを検索対象にしない", async ({ request }) => {
  for (const path of [
    "/start",
    "/mypage",
    "/admin",
    "/terms",
    "/privacy",
    "/api/auth/get-session",
    "/not-a-route",
    "/site-images/missing",
  ]) {
    const response = await request.get(path, { headers: { Host: "animic.party" } });
    expect(response.headers()["x-robots-tag"], path).toBe("noindex");
    if (path === "/not-a-route" || path === "/site-images/missing")
      expect(response.status()).toBe(404);
  }
});

test("OGPとアイコンを配信し、非本番では静的ファイルもnoindexにする", async ({ request }) => {
  const image = await request.get("/og-image.png", { headers: { Host: "animic.party" } });
  expect(image.status()).toBe(200);
  expect(image.headers()["content-type"]).toBe("image/png");
  expect(image.headers()["x-robots-tag"]).toBeUndefined();
  const bytes = await image.body();
  expect(bytes.readUInt32BE(16)).toBe(1200);
  expect(bytes.readUInt32BE(20)).toBe(630);
  for (const host of ["animic.example.workers.dev", "dev.animic.party"]) {
    const preview = await request.get("/og-image.png", { headers: { Host: host } });
    expect(preview.status()).toBe(200);
    expect(preview.headers()["x-robots-tag"]).toBe("noindex");
  }
  for (const path of ["/favicon.ico", "/favicon.svg", "/apple-touch-icon.png", "/site.webmanifest"])
    expect((await request.get(path)).status(), path).toBe(200);
});

test("ハッシュ付きアセットだけを長期キャッシュする", async ({ page, request }) => {
  await page.goto("/");
  const css = await page.locator('link[rel="stylesheet"]').getAttribute("href");
  expect(css).toMatch(/^\/assets\/.+-[^/]+\.css$/);
  const response = await request.get(css ?? "");
  expect(response.status()).toBe(200);
  expect(response.headers()["cache-control"]).toBe("public, max-age=31536000, immutable");
  for (const path of ["/robots.txt", "/sitemap.xml", "/og-image.png"])
    expect((await request.get(path)).headers()["cache-control"]).not.toContain("immutable");
});

test("招待と各ページが共通画像の共有カードを初期HTMLへ出し、個人情報を含めない", async ({
  browser,
  page,
}) => {
  const privateName = "OGPに出さない参加者";
  const code = await create(page, privateName);
  const context = await browser.newContext({ javaScriptEnabled: false });
  const guest = await context.newPage();
  try {
    for (const [path, cardTitle, cardDescription, target] of [
      [`/rooms/${code}`, `ルーム: ${code} | Animic`, inviteDescription, `/rooms/${code}`],
      ["/start", "ルームを作る | Animic", shareDescription, "/start"],
      ["/terms", "利用規約 | Animic", "Animicの利用規約です。", "/terms"],
      [
        "/privacy",
        "プライバシーポリシー | Animic",
        "Animicの個人情報の取り扱いについて。",
        "/privacy",
      ],
      ["/mypage", "Animic", shareDescription, "/"],
      [`/mypage/matches/${crypto.randomUUID()}`, "Animic", shareDescription, "/"],
    ]) {
      const response = await guest.goto(`${path}?utm_source=share-test#ignored`);
      expect(response?.status()).toBe(200);
      expect(response?.headers()["x-robots-tag"]).toBe("noindex");
      for (const [attribute, name, content] of [
        ["property", "og:title", cardTitle],
        ["property", "og:description", cardDescription],
        ["property", "og:url", `${origin}${target}`],
        ["property", "og:image", `${origin}/og-image.png`],
        ["name", "twitter:title", cardTitle],
        ["name", "twitter:description", cardDescription],
        ["name", "twitter:image", `${origin}/og-image.png`],
        ["name", "twitter:card", "summary_large_image"],
      ]) {
        const meta = guest.locator(`head meta[${attribute}="${name}"]`);
        await expect(meta).toHaveCount(1);
        await expect(meta).toHaveAttribute("content", content);
      }
      expect(await guest.locator("head").innerHTML()).not.toContain(privateName);
      await expect(guest.locator('meta[name="description"]')).toHaveCount(0);
    }
    await page.goto(`/rooms/${code}`);
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      "content",
      `ルーム: ${code} | Animic`,
    );
    expect(await page.locator("head").innerHTML()).not.toContain(privateName);
  } finally {
    await context.close();
  }
});

test("管理画面と存在しないルーム・ページには共有カードを出さない", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  try {
    for (const path of ["/admin", "/not-a-route", "/rooms/ABCDEFGH", "/rooms/invalid"]) {
      const response = await page.goto(path);
      expect(response?.status()).toBe(path === "/admin" ? 200 : 404);
      await expect(page.locator('meta[property^="og:"], meta[name^="twitter:"]')).toHaveCount(0);
    }
  } finally {
    await context.close();
  }
});
