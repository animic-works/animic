import { maxWebpBytes } from "./webp";

/** 管理画面で選べる画像の形式。WebPに変換する前のファイルに使う。 */
export const sourceImageTypes = ["image/png", "image/webp", "image/jpeg"];
const maxSourceBytes = 10 * 1024 * 1024;

/**
 * 選んだ画像を、白で塗ったcanvasに描き直してWebPにする（ブラウザー専用）。
 * NovelAIのPNGに埋め込まれたプロンプト（お題の答え）などのメタデータと透過は、ここで消える。
 * `maxSide`を渡すと、長い辺がそれより大きい画像を縮める。
 */
export async function toWebp(file: File, maxSide?: number): Promise<Blob> {
  if (!sourceImageTypes.includes(file.type))
    throw new Error("PNG・WebP・JPEGの画像を選んでください。");
  if (file.size > maxSourceBytes) throw new Error("10MB以下の画像を選んでください。");
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch (error) {
    throw new Error("画像を読み込めませんでした。", { cause: error });
  }
  const scale = maxSide ? Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height)) : 1;
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("画像を変換できませんでした。");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.imageSmoothingQuality = "high";
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", 0.9),
  );
  // WebPを書き出せないブラウザーはPNGを返すため、形式も確かめる。
  if (blob?.type !== "image/webp")
    throw new Error("このブラウザーでは画像をWebPに変換できません。Chromeなどで操作してください。");
  if (blob.size > maxWebpBytes)
    throw new Error("変換した画像が5MBを超えました。小さい画像を選んでください。");
  return blob;
}
