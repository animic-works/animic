import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { crc32, deflateSync } from "node:zlib";

import webpDecoderFactory from "@jsquash/webp/codec/dec/webp_dec.js";
import type { WebPModule as WebPDecoder } from "@jsquash/webp/codec/dec/webp_dec.js";
import { initEmscriptenModule } from "@jsquash/webp/utils.js";
import { describe, expect, it } from "vite-plus/test";

import { readOpaquePixels, toPlainWebp } from "./generated-image";

const require = createRequire(import.meta.url);

function wasm(path: string) {
  return new WebAssembly.Module(readFileSync(require.resolve(path)));
}

function concat(...parts: Uint8Array[]) {
  const result = new Uint8Array(parts.reduce((total, part) => total + part.byteLength, 0));
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.byteLength;
  }
  return result;
}

function chunk(type: string, data: Uint8Array) {
  const typed = concat(new TextEncoder().encode(type), data);
  const result = new Uint8Array(typed.byteLength + 8);
  const view = new DataView(result.buffer);
  view.setUint32(0, data.byteLength);
  result.set(typed, 4);
  view.setUint32(typed.byteLength + 4, crc32(typed));
  return result;
}

// PNGの仕様どおりに、左・上・左上の値を引いて行を符号化する。
function filterRow(filter: number, row: Uint8Array, previous: Uint8Array, channels: number) {
  return row.map((value, i) => {
    const left = i < channels ? 0 : row[i - channels];
    const up = previous[i];
    const upLeft = i < channels ? 0 : previous[i - channels];
    const paeth = () => {
      const estimate = left + up - upLeft;
      const distances = [left, up, upLeft].map((candidate) => Math.abs(estimate - candidate));
      const [toLeft, toUp, toUpLeft] = distances;
      if (toLeft <= toUp && toLeft <= toUpLeft) return left;
      return toUp <= toUpLeft ? up : upLeft;
    };
    const predicted = [0, left, up, (left + up) >> 1, paeth()][filter];
    return (value - predicted) & 0xff;
  });
}

/** 行ごとにフィルターの種類を変えたPNG。`extra`はIHDRの後に入れるチャンク。 */
function png(options: {
  width: number;
  height: number;
  channels: 3 | 4;
  pixels: number[];
  depth?: number;
  interlace?: number;
  extra?: Uint8Array[];
}) {
  const { width, height, channels } = options;
  const header = new Uint8Array(13);
  const view = new DataView(header.buffer);
  view.setUint32(0, width);
  view.setUint32(4, height);
  view.setUint8(8, options.depth ?? 8);
  view.setUint8(9, channels === 4 ? 6 : 2);
  view.setUint8(12, options.interlace ?? 0);
  const stride = width * channels;
  let previous = new Uint8Array(stride);
  const rows: Uint8Array[] = [];
  for (let y = 0; y < height; y += 1) {
    const row = Uint8Array.from(options.pixels.slice(y * stride, (y + 1) * stride));
    const filter = y % 5;
    rows.push(Uint8Array.of(filter), filterRow(filter, row, previous, channels));
    previous = row;
  }
  return concat(
    Uint8Array.of(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a),
    chunk("IHDR", header),
    ...(options.extra ?? []),
    chunk("IDAT", deflateSync(concat(...rows))),
    chunk("IEND", new Uint8Array()),
  );
}

/** 位置で色が変わる画素。アルファは255と254を混ぜる（NovelAIが最下位ビットに情報を埋め込むのと同じ形）。 */
function samplePixels(width: number, height: number, channels: 3 | 4) {
  const pixels: number[] = [];
  for (let y = 0; y < height; y += 1)
    for (let x = 0; x < width; x += 1) {
      pixels.push((x * 37) & 0xff, (y * 53) & 0xff, ((x + y) * 29) & 0xff);
      if (channels === 4) pixels.push((x + y) % 3 ? 255 : 254);
    }
  return pixels;
}

function opaque(pixels: number[], channels: 3 | 4) {
  const result: number[] = [];
  for (let i = 0; i < pixels.length; i += channels) result.push(...pixels.slice(i, i + 3), 255);
  return Uint8Array.from(result);
}

function webpChunks(webp: Uint8Array) {
  const view = new DataView(webp.buffer, webp.byteOffset, webp.byteLength);
  const names: string[] = [];
  for (let offset = 12; offset + 8 <= webp.byteLength;) {
    names.push(String.fromCharCode(...webp.subarray(offset, offset + 4)));
    const size = view.getUint32(offset + 4, true);
    offset += 8 + size + (size % 2);
  }
  return names;
}

describe("生成した画像の画素の読み取り", () => {
  it.each([3, 4] as const)(
    "%iチャンネルのPNGを5種類のフィルターから戻し、アルファを不透明にする",
    async (channels) => {
      const pixels = samplePixels(7, 10, channels);
      expect(await readOpaquePixels(png({ width: 7, height: 10, channels, pixels }))).toEqual({
        width: 7,
        height: 10,
        pixels: opaque(pixels, channels),
      });
    },
  );
  it("16bit・インターレース・画素の足りないPNGを拒否する", async () => {
    const base = { width: 2, height: 2, channels: 4, pixels: samplePixels(2, 2, 4) } as const;
    await expect(readOpaquePixels(png({ ...base, depth: 16 }))).rejects.toThrow("形式");
    await expect(readOpaquePixels(png({ ...base, interlace: 1 }))).rejects.toThrow("形式");
    await expect(readOpaquePixels(png({ ...base, height: 3 }))).rejects.toThrow("画素の数");
    await expect(readOpaquePixels(png(base).slice(0, 40))).rejects.toThrow();
  });
});

describe("生成した画像のWebPへの変換", () => {
  it("テキストのチャンクとアルファを残さず、同じ大きさのWebPにする", async () => {
    const pixels = samplePixels(32, 24, 4);
    const comment = new TextEncoder().encode('Comment\0{"prompt":"secret style"}');
    const webp = await toPlainWebp(
      png({ width: 32, height: 24, channels: 4, pixels, extra: [chunk("tEXt", comment)] }),
      wasm("@jsquash/webp/codec/enc/webp_enc_simd.wasm"),
    );
    expect(new TextDecoder().decode(webp.subarray(0, 4))).toBe("RIFF");
    expect(new TextDecoder().decode(webp.subarray(8, 12))).toBe("WEBP");
    // VP8Xがないため、透過（ALPH）・EXIF・XMPを持てない単純な形式になる。
    expect(webpChunks(webp)).toEqual(["VP8 "]);
    expect(new TextDecoder().decode(webp)).not.toContain("secret style");

    const decoder: WebPDecoder = await initEmscriptenModule(
      webpDecoderFactory,
      wasm("@jsquash/webp/codec/dec/webp_dec.wasm"),
    );
    const decoded = decoder.decode(new Uint8Array(webp));
    expect(decoded && { width: decoded.width, height: decoded.height }).toEqual({
      width: 32,
      height: 24,
    });
    expect(decoded?.data.filter((_, i) => i % 4 === 3).every((alpha) => alpha === 255)).toBe(true);
  });
});
