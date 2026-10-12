import { test, expect } from "@playwright/test";

type Frame = {
  time: number;
  boxes: { x: number; y: number; width: number; height: number; opacity: string }[];
  scrollOpacity: number;
};

declare global {
  interface Window {
    homePaintFrames: Frame[];
    stopHomePaintCapture: boolean;
  }
}

test.use({ launchOptions: { ignoreDefaultArgs: ["--hide-scrollbars"] } });

for (const viewportWidth of [1440, 900, 720, 390]) {
  test(`最初の描画から説明文と操作を揃え、読み込み中も配置を変えない（${viewportWidth}px）`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: viewportWidth, height: 900 });
    await page.addInitScript(() => {
      window.homePaintFrames = [];
      const frames = window.homePaintFrames;
      window.stopHomePaintCapture = false;
      const capture = () => {
        const logo = document.querySelector("#top h1");
        if (logo && getComputedStyle(logo).marginTop === "0px") {
          const boxes = [...document.querySelectorAll("#top h1, #top h2, #top p, #top button")].map(
            (node) => {
              const { x, y, width, height } = node.getBoundingClientRect();
              return { x, y, width, height, opacity: getComputedStyle(node).opacity };
            },
          );
          const scroll = document.querySelector("#top [data-animic-section-navigation] a");
          frames.push({
            time: performance.now(),
            boxes,
            scrollOpacity: scroll ? Number(getComputedStyle(scroll).opacity) : 0,
          });
        }
        if (!window.stopHomePaintCapture) requestAnimationFrame(capture);
      };
      requestAnimationFrame(capture);
    });
    // 同じブラウザで初回取得とキャッシュ済みの再読み込みを確認する。
    for (const cached of [false, true]) {
      if (cached) await page.reload({ waitUntil: "networkidle" });
      else await page.goto("/", { waitUntil: "networkidle" });
      await expect(page.locator("html")).toHaveAttribute("data-animic-scrollbars", "ready");
      await page.evaluate(() => document.fonts.ready);
      if (viewportWidth === 1440)
        await expect(page.locator("#top [data-animic-section-navigation] a")).toHaveCSS(
          "opacity",
          "1",
        );
      const frames = await page.evaluate(() => {
        window.stopHomePaintCapture = true;
        const firstPaint = performance.getEntriesByName("first-contentful-paint")[0];
        if (!firstPaint) throw new Error("最初の描画時刻を取得できませんでした");
        return window.homePaintFrames.filter((frame) => frame.time >= firstPaint.startTime);
      });
      expect(frames.length).toBeGreaterThan(1);
      const final = frames.at(-1)!.boxes;
      expect(final).toHaveLength(5);
      for (const frame of frames) {
        // 描画前のHTML解析途中を除き、FCP後の配置を確認する。
        expect(frame.boxes).toHaveLength(5);
        for (const [index, box] of frame.boxes.entries()) {
          expect(box.opacity).toBe("1");
          for (const key of ["x", "y", "width", "height"] as const)
            expect(Math.abs(box[key] - final[index][key])).toBeLessThanOrEqual(0.5);
        }
      }
      if (viewportWidth === 1440) {
        const opacities = frames.map((frame) => frame.scrollOpacity);
        expect(opacities[0]).toBe(0);
        expect(opacities.at(-1)).toBe(1);
        expect(
          opacities.every((value, index) => index === 0 || value >= opacities[index - 1]),
        ).toBe(true);
        // 起動処理がメインスレッドを使っても、合成側のフェードを検証する。
        const middleOpacity = await page
          .locator("#top [data-animic-section-navigation] a")
          .evaluate((node) => {
            const animation = node.getAnimations()[0];
            if (!animation?.effect) throw new Error("スクロール案内のフェードがありません");
            const { delay, duration } = animation.effect.getTiming();
            animation.pause();
            animation.currentTime = (delay ?? 0) + Number(duration) / 2;
            const opacity = Number(getComputedStyle(node).opacity);
            animation.finish();
            return opacity;
          });
        expect(middleOpacity).toBeGreaterThan(0);
        expect(middleOpacity).toBeLessThan(1);
      }
    }
  });
}
