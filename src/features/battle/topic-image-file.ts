import { maxTopicSourceBytes, topicSourceImageTypes } from "./topic-admin";
import { maxTopicImageBytes } from "./topic-images";

/**
 * 選んだ画像を、白で塗ったcanvasに描き直してWebPにする（ブラウザー専用）。
 * NovelAIのPNGに埋め込まれたプロンプト（お題の答え）などのメタデータと透過は、ここで消える。
 */
export async function toTopicWebp(file: File): Promise<Blob> {
  if (!topicSourceImageTypes.includes(file.type))
    throw new Error("PNG・WebP・JPEGの画像を選んでください。");
  if (file.size > maxTopicSourceBytes) throw new Error("10MB以下の画像を選んでください。");
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch (error) {
    throw new Error("画像を読み込めませんでした。", { cause: error });
  }
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("画像を変換できませんでした。");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, 0, 0);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", 0.9),
  );
  // WebPを書き出せないブラウザーはPNGを返すため、形式も確かめる。
  if (blob?.type !== "image/webp")
    throw new Error("このブラウザーでは画像をWebPに変換できません。Chromeなどで操作してください。");
  if (blob.size > maxTopicImageBytes)
    throw new Error("変換した画像が5MBを超えました。小さい画像を選んでください。");
  return blob;
}
