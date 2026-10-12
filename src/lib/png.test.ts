import { crc32 } from "node:zlib";
import { describe, expect, it } from "vite-plus/test";

import { inspectPng } from "./png";

function chunk(name: string, data: Uint8Array = new Uint8Array()) {
  const bytes = new Uint8Array(12 + data.byteLength);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, data.byteLength);
  bytes.set(new TextEncoder().encode(name), 4);
  bytes.set(data, 8);
  view.setUint32(8 + data.byteLength, crc32(bytes.subarray(4, 8 + data.byteLength)));
  return bytes;
}

function png(width: number, height: number, ...extra: Uint8Array[]) {
  const header = new Uint8Array(13);
  const view = new DataView(header.buffer);
  view.setUint32(0, width);
  view.setUint32(4, height);
  header.set([8, 6, 0, 0, 0], 8);
  const parts = [
    new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    ...extra,
    chunk("IDAT", new Uint8Array([0])),
    chunk("IEND"),
  ];
  const bytes = new Uint8Array(parts.reduce((total, part) => total + part.byteLength, 0));
  let offset = 0;
  for (const part of parts) {
    bytes.set(part, offset);
    offset += part.byteLength;
  }
  return bytes;
}

const size = { width: 1200, height: 630 };

describe("inspectPng", () => {
  it("決まった大きさで、メタデータのないPNGを通す", () => {
    expect(inspectPng(png(1200, 630), size)).toBeNull();
    expect(inspectPng(png(1200, 630, chunk("sRGB", new Uint8Array([0]))), size)).toBeNull();
  });

  it("大きさが違う・メタデータがある・PNGでない・途中で切れたデータを拒否する", () => {
    expect(inspectPng(png(1200, 600), size)).toBe(
      "画像の大きさを1200×630にしてください（1200×600）。",
    );
    expect(inspectPng(png(1200, 630, chunk("tEXt", new Uint8Array([65]))), size)).toBe(
      "画像にメタデータが残っています。",
    );
    expect(inspectPng(png(1200, 630, chunk("acTL", new Uint8Array(8))), size)).toBe(
      "PNGに対応していない内容（acTL）があります。",
    );
    expect(inspectPng(new TextEncoder().encode("not a png at all, really not"), size)).toBe(
      "PNGの画像ではありません。",
    );
    const whole = png(1200, 630);
    expect(inspectPng(whole.slice(0, whole.byteLength - 4), size)).toBe(
      "PNGの形式が正しくありません。",
    );
  });
});
