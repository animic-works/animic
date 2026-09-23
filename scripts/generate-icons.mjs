import { readFile, writeFile } from "node:fs/promises";

import { chromium } from "@playwright/test";

const publicDirectory = new URL("../public/", import.meta.url);
const source = await readFile(new URL("favicon.svg", publicDirectory));
const browser = await chromium.launch({ channel: "chromium" });
try {
  const page = await browser.newPage();
  const sourceUrl = `data:image/svg+xml;base64,${source.toString("base64")}`;
  async function render(size, opaque = false, maskable = false) {
    const base64 = await page.evaluate(
      async (options) => {
        const image = new Image();
        image.src = options.sourceUrl;
        await image.decode();
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = options.size;
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Canvasを初期化できません。");
        const inset = options.maskable ? options.size * 0.12 : 0;
        context.drawImage(image, inset, inset, options.size - inset * 2, options.size - inset * 2);
        if (options.maskable) {
          // マーク全体が中央の半径40%の円に収まることを確認する。
          const pixels = context.getImageData(0, 0, options.size, options.size).data;
          for (let y = 0; y < options.size; y++) {
            for (let x = 0; x < options.size; x++) {
              if (
                pixels[(y * options.size + x) * 4 + 3] &&
                Math.hypot(x + 0.5 - options.size / 2, y + 0.5 - options.size / 2) >
                  options.size * 0.4
              ) {
                throw new Error("マークがmaskableアイコンの安全領域を超えています。");
              }
            }
          }
        }
        if (options.opaque) {
          context.globalCompositeOperation = "destination-over";
          context.fillStyle = "#ffffff";
          context.fillRect(0, 0, options.size, options.size);
        }
        return canvas.toDataURL("image/png").split(",")[1];
      },
      { sourceUrl, size, opaque, maskable },
    );
    if (!base64) throw new Error("PNGを生成できません。");
    return Buffer.from(base64, "base64");
  }

  for (const [file, size, maskable] of [
    ["apple-touch-icon.png", 180, false],
    ["icon-192.png", 192, false],
    ["icon-512.png", 512, false],
    ["icon-maskable-512.png", 512, true],
  ]) {
    await writeFile(new URL(file, publicDirectory), await render(size, true, maskable));
  }

  const logo = await readFile(new URL("animic-logo.svg", publicDirectory));
  const ogImage = await page.evaluate(
    async (logoUrl) => {
      const image = new Image();
      image.src = logoUrl;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = 1200;
      canvas.height = 630;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvasを初期化できません。");
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      const width = 900;
      const height = (width * image.naturalHeight) / image.naturalWidth;
      context.drawImage(
        image,
        (canvas.width - width) / 2,
        (canvas.height - height) / 2,
        width,
        height,
      );
      return canvas.toDataURL("image/png").split(",")[1];
    },
    `data:image/svg+xml;base64,${logo.toString("base64")}`,
  );
  if (!ogImage) throw new Error("OGP画像を生成できません。");
  await writeFile(new URL("og-image.png", publicDirectory), Buffer.from(ogImage, "base64"));

  // ICOのディレクトリに各サイズのPNGを格納する。
  const sizes = [16, 32, 48];
  const images = await Promise.all(sizes.map((size) => render(size)));
  const header = Buffer.alloc(6 + sizes.length * 16);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(sizes.length, 4);
  let offset = header.length;
  for (const [index, image] of images.entries()) {
    const entry = 6 + index * 16;
    header[entry] = header[entry + 1] = sizes[index];
    header.writeUInt16LE(1, entry + 4);
    header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(image.length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += image.length;
  }
  await writeFile(new URL("favicon.ico", publicDirectory), Buffer.concat([header, ...images]));
} finally {
  await browser.close();
}
