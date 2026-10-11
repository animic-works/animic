/** R2に保存するPNG（OGP画像）の上限。 */
export const maxPngBytes = 5 * 1024 * 1024;

const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
// 画像のデータと、ブラウザーが書き出すPNGに入りうる色の情報のチャンク。テキスト・EXIFなどのメタデータは認めない。
const allowedChunks = new Set([
  "IHDR",
  "PLTE",
  "tRNS",
  "IDAT",
  "IEND",
  "sRGB",
  "gAMA",
  "cHRM",
  "iCCP",
  "pHYs",
]);

function chunkName(bytes: Uint8Array, offset: number) {
  return String.fromCodePoint(...bytes.subarray(offset, offset + 4));
}

function uint32(bytes: Uint8Array, offset: number) {
  return new DataView(bytes.buffer, bytes.byteOffset + offset, 4).getUint32(0);
}

/**
 * 管理画面で登録する画像として保存できるPNGかを確かめる。
 * 大きさが`size`と違う、メタデータ（NovelAIのプロンプトを含みうる）やアニメーションがあれば理由を返す。
 */
export function inspectPng(
  bytes: Uint8Array,
  size: { width: number; height: number },
): string | null {
  if (bytes.byteLength > maxPngBytes) return "画像が5MBを超えています。";
  if (bytes.byteLength < 33 || signature.some((value, index) => bytes[index] !== value))
    return "PNGの画像ではありません。";
  let offset = 8;
  let ended = false;
  while (offset < bytes.byteLength) {
    if (ended) return "PNGの終わりの後にデータがあります。";
    if (offset + 12 > bytes.byteLength) return "PNGの形式が正しくありません。";
    const length = uint32(bytes, offset);
    const name = chunkName(bytes, offset + 4);
    const next = offset + 12 + length;
    if (next > bytes.byteLength) return "PNGの形式が正しくありません。";
    if (offset === 8) {
      if (name !== "IHDR" || length !== 13) return "PNGの形式が正しくありません。";
      const width = uint32(bytes, offset + 8);
      const height = uint32(bytes, offset + 12);
      if (width !== size.width || height !== size.height)
        return `画像の大きさを${size.width}×${size.height}にしてください（${width}×${height}）。`;
    }
    if (!allowedChunks.has(name))
      return ["tEXt", "zTXt", "iTXt", "eXIf"].includes(name)
        ? "画像にメタデータが残っています。"
        : `PNGに対応していない内容（${name}）があります。`;
    if (name === "IEND") ended = true;
    offset = next;
  }
  return ended ? null : "PNGの形式が正しくありません。";
}
