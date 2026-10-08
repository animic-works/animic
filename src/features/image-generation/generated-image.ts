import webpEncoderFactory from "@jsquash/webp/codec/enc/webp_enc_simd.js";
import type { WebPModule } from "@jsquash/webp/codec/enc/webp_enc.js";
import { defaultOptions } from "@jsquash/webp/meta.js";
import { initEmscriptenModule } from "@jsquash/webp/utils.js";

// お題の画像（topic-image-file.ts）と同じ品質にする。
const webpQuality = 90;

let encoder: Promise<WebPModule> | undefined;

async function inflate(data: Uint8Array<ArrayBuffer>) {
  const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

function concat(parts: Uint8Array[]) {
  const result = new Uint8Array(parts.reduce((total, part) => total + part.byteLength, 0));
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.byteLength;
  }
  return result;
}

// PNGのフィルターで、左・上・左上の値から予測する値。
function predict(filter: number, left: number, up: number, upLeft: number) {
  if (filter === 0) return 0;
  if (filter === 1) return left;
  if (filter === 2) return up;
  if (filter === 3) return (left + up) >> 1;
  if (filter === 4) {
    const estimate = left + up - upLeft;
    const toLeft = Math.abs(estimate - left);
    const toUp = Math.abs(estimate - up);
    const toUpLeft = Math.abs(estimate - upLeft);
    if (toLeft <= toUp && toLeft <= toUpLeft) return left;
    return toUp <= toUpLeft ? up : upLeft;
  }
  throw new Error(`対応していないPNGのフィルターです: ${filter}`);
}

/**
 * PNGの画素をRGBAで取り出す。アルファは捨て、すべて不透明にする。
 * 8bitのRGB・RGBAで、インターレースのないPNGだけを扱う。
 */
export async function readOpaquePixels(png: Uint8Array) {
  const view = new DataView(png.buffer, png.byteOffset, png.byteLength);
  const data: Uint8Array[] = [];
  let header: { width: number; height: number; channels: number } | undefined;
  for (let offset = 8; offset + 8 <= png.byteLength;) {
    const length = view.getUint32(offset);
    const type = String.fromCharCode(...png.subarray(offset + 4, offset + 8));
    const body = png.subarray(offset + 8, offset + 8 + length);
    if (body.byteLength !== length) throw new Error("PNGのチャンクが途中で切れています。");
    if (type === "IHDR") {
      const depth = view.getUint8(offset + 16);
      const colorType = view.getUint8(offset + 17);
      const interlace = view.getUint8(offset + 20);
      // 2はRGB、6はRGBA。
      const channels = colorType === 6 ? 4 : colorType === 2 ? 3 : 0;
      if (depth !== 8 || !channels || interlace !== 0)
        throw new Error("対応していないPNGの形式です。");
      header = { width: view.getUint32(offset + 8), height: view.getUint32(offset + 12), channels };
    }
    if (type === "IDAT") data.push(body);
    if (type === "IEND") break;
    offset += 12 + length;
  }
  if (!header) throw new Error("PNGのヘッダーが見つかりません。");
  const { width, height, channels } = header;
  const raw = await inflate(concat(data));
  const stride = width * channels;
  if (raw.byteLength !== height * (stride + 1)) throw new Error("PNGの画素の数が合いません。");
  const pixels = new Uint8Array(width * height * 4);
  let previous = new Uint8Array(stride);
  let current = new Uint8Array(stride);
  for (let y = 0; y < height; y += 1) {
    const start = y * (stride + 1);
    const filter = raw[start];
    for (let i = 0; i < stride; i += 1) {
      const left = i < channels ? 0 : current[i - channels];
      const upLeft = i < channels ? 0 : previous[i - channels];
      current[i] = (raw[start + 1 + i] + predict(filter, left, previous[i], upLeft)) & 0xff;
    }
    for (let x = 0; x < width; x += 1) {
      const target = (y * width + x) * 4;
      pixels.set(current.subarray(x * channels, x * channels + 3), target);
      pixels[target + 3] = 0xff;
    }
    [previous, current] = [current, previous];
  }
  return { width, height, pixels };
}

/**
 * NovelAIのPNGを、メタデータと透過のない非可逆のWebPにする。
 * NovelAIはtEXtチャンクと、アルファ値の最下位ビット（`stealth_pngcomp`）にプロンプトなどの生成の条件を埋め込む。
 * 画素だけを取り出してアルファを捨て、libwebpで書き出し直す。
 * Workersは実行時にWASMをコンパイルできないため、ビルドで読み込んだlibwebpのモジュールを受け取る。
 */
export async function toPlainWebp(png: Uint8Array, webpEncoderWasm: WebAssembly.Module) {
  const { width, height, pixels } = await readOpaquePixels(png);
  encoder ??= initEmscriptenModule(webpEncoderFactory, webpEncoderWasm);
  const webp = (await encoder).encode(pixels, width, height, {
    ...defaultOptions,
    quality: webpQuality,
  });
  if (!webp) throw new Error("WebPに変換できませんでした。");
  return webp;
}
