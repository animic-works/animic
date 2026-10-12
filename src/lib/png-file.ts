import { maxPngBytes } from "./png";
import { sourceImageTypes } from "./webp-file";

const maxSourceBytes = 10 * 1024 * 1024;

/**
 * 選んだ画像を、白で塗ったcanvasに描き直してPNGにする（ブラウザー専用）。メタデータと透過は、ここで消える。
 * 大きさが`size`と違う画像は拒否する（OGP画像は1200×630で作ってもらう）。
 */
export async function toPng(file: File, size: { width: number; height: number }): Promise<Blob> {
  if (!sourceImageTypes.includes(file.type))
    throw new Error("PNG・WebP・JPEGの画像を選んでください。");
  if (file.size > maxSourceBytes) throw new Error("10MB以下の画像を選んでください。");
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch (error) {
    throw new Error("画像を読み込めませんでした。", { cause: error });
  }
  if (bitmap.width !== size.width || bitmap.height !== size.height) {
    const actual = `${bitmap.width}×${bitmap.height}`;
    bitmap.close();
    throw new Error(`${size.width}×${size.height}の画像を選んでください（${actual}）。`);
  }
  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("画像を変換できませんでした。");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, size.width, size.height);
  context.drawImage(bitmap, 0, 0);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("画像を変換できませんでした。");
  if (blob.size > maxPngBytes)
    throw new Error("変換した画像が5MBを超えました。色数の少ない画像を選んでください。");
  return blob;
}
