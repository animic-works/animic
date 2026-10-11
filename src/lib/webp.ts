/** R2に保存するWebP（お題の画像・表現の挿絵）の上限。 */
export const maxWebpBytes = 5 * 1024 * 1024;

// 画像のデータを表すチャンクと、ブラウザーが書き出すWebPに入りうる付属のチャンク。
const imageChunks = new Set(["VP8 ", "VP8L"]);
const allowedChunks = new Set([...imageChunks, "VP8X", "ALPH", "ICCP"]);

function fourCc(bytes: Uint8Array, offset: number) {
  return String.fromCodePoint(...bytes.subarray(offset, offset + 4));
}

function uint32(bytes: Uint8Array, offset: number) {
  return new DataView(bytes.buffer, bytes.byteOffset + offset, 4).getUint32(0, true);
}

/**
 * 管理画面で登録する画像として保存できるWebPかを確かめる。
 * EXIF・XMPのメタデータ（NovelAIのプロンプトを含みうる）やアニメーションがあれば理由を返す。
 */
export function inspectWebp(bytes: Uint8Array): string | null {
  if (bytes.byteLength > maxWebpBytes) return "画像が5MBを超えています。";
  if (bytes.byteLength < 20 || fourCc(bytes, 0) !== "RIFF" || fourCc(bytes, 8) !== "WEBP")
    return "WebPの画像ではありません。";
  if (uint32(bytes, 4) !== bytes.byteLength - 8) return "WebPの長さが正しくありません。";
  let offset = 12;
  let hasImage = false;
  while (offset < bytes.byteLength) {
    if (offset + 8 > bytes.byteLength) return "WebPの形式が正しくありません。";
    const name = fourCc(bytes, offset);
    const size = uint32(bytes, offset + 4);
    const next = offset + 8 + size + (size % 2);
    if (next > bytes.byteLength) return "WebPの形式が正しくありません。";
    if (!allowedChunks.has(name))
      return name === "EXIF" || name === "XMP "
        ? "画像にメタデータが残っています。"
        : `WebPに対応していない内容（${name.trim()}）があります。`;
    if (imageChunks.has(name)) {
      if (hasImage) return "WebPに画像が2つ以上あります。";
      hasImage = true;
    }
    offset = next;
  }
  return hasImage ? null : "WebPに画像がありません。";
}
