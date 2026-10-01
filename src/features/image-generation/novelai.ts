// V5 Fullのテキストからの生成だけを扱う。値はNovelAI公式アプリの既定値に合わせる。
const qualityTags = "very aesthetic, masterpiece, no text";
const undesiredContent =
  ", lowres, bad hands, bad anatomy, artistic error, sepia, white haze, worst quality, very displeasing, jpeg artifacts, 0::ai-generated::, ";

const minimumTimeMs = 20_000;
const abortMarginMs = 5000;
const defaultRetryMs = 2000;

const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const zipLocalFileSignature = 0x04034b50;
const zipCentralDirectorySignature = 0x02014b50;
const zipEndOfCentralDirectorySignature = 0x06054b50;

export type ImageResult =
  | { ok: true; image: Uint8Array }
  | {
      ok: false;
      reason: "deadline" | "http" | "network" | "invalid-response";
      status?: number;
      detail?: string;
    };

function joinTags(head: string, tail: string) {
  return head ? `${head}, ${tail}` : tail;
}

// Text:の段落の後ろに付けると、品質タグが画像内の文字として描かれる。
function withQualityTags(prompt: string) {
  const match = /(?:^|\n)Text:/.exec(prompt);
  if (!match) return joinTags(prompt, qualityTags);
  const start = match.index + (match[0].startsWith("\n") ? 1 : 0);
  return `${joinTags(prompt.slice(0, start).trimEnd(), qualityTags)}\n${prompt.slice(start)}`;
}

export function buildGeneratePayload(prompt: string, seed: number) {
  return {
    action: "generate",
    input: prompt,
    model: "nai-diffusion-5-full",
    use_new_shared_trial: true,
    parameters: {
      params_version: 4,
      legacy: false,
      legacy_v3_extend: false,
      deliberate_euler_ancestral_bug: false,
      prefer_brownian: true,
      autoSmea: false,
      sm: false,
      sm_dyn: false,
      add_original_image: false,
      dynamic_thresholding: false,
      legacy_uc: false,
      normalize_reference_strength_multiple: false,
      use_coords: false,
      width: 832,
      height: 1216,
      steps: 28,
      scale: 5,
      sampler: "k_euler_ancestral",
      seed,
      n_samples: 1,
      negative_prompt: undesiredContent,
      qualityToggle: true,
      ucPreset: 1,
      cfg_rescale: 0,
      controlnet_strength: 1,
      characterPrompts: [],
      v4_prompt: {
        caption: { base_caption: withQualityTags(prompt), char_captions: [] },
        use_coords: false,
        use_order: true,
      },
      v4_negative_prompt: {
        caption: { base_caption: undesiredContent, char_captions: [] },
        legacy_uc: false,
      },
    },
  };
}

async function inflateRaw(data: Uint8Array<ArrayBuffer>) {
  const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

function findEndOfCentralDirectory(view: DataView) {
  const minimumOffset = Math.max(0, view.byteLength - 65_557);
  for (let offset = view.byteLength - 22; offset >= minimumOffset; offset -= 1) {
    if (view.getUint32(offset, true) === zipEndOfCentralDirectorySignature) return offset;
  }
  throw new Error("ZIPの終端が見つかりません。");
}

async function extractFirstFile(bytes: Uint8Array) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const entry = view.getUint32(findEndOfCentralDirectory(view) + 16, true);
  if (view.getUint32(entry, true) !== zipCentralDirectorySignature)
    throw new Error("ZIPの中央ディレクトリが見つかりません。");
  const method = view.getUint16(entry + 10, true);
  const size = view.getUint32(entry + 20, true);
  const header = view.getUint32(entry + 42, true);
  if (view.getUint32(header, true) !== zipLocalFileSignature)
    throw new Error("ZIPのファイルヘッダーが見つかりません。");
  const start = header + 30 + view.getUint16(header + 26, true) + view.getUint16(header + 28, true);
  if (start + size > bytes.byteLength) throw new Error("ZIPのデータが途中で切れています。");
  const data = bytes.slice(start, start + size);
  if (method === 0) return data;
  if (method === 8) return inflateRaw(data);
  throw new Error(`対応していないZIPの圧縮方式です: ${method}`);
}

// NovelAIは画像をZIPで返すことがある。
export async function readImageResponse(bytes: Uint8Array, contentType: string | null) {
  const isZip =
    (contentType ?? "").includes("zip") ||
    (bytes.byteLength >= 4 &&
      new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(0, true) ===
        zipLocalFileSignature);
  const image = isZip ? await extractFirstFile(bytes) : bytes;
  if (!pngSignature.every((byte, index) => image[index] === byte))
    throw new Error("PNG画像ではありません。");
  return image;
}

function retryDelay(retryAfter: string | null) {
  const seconds = retryAfter === null ? Number.NaN : Number(retryAfter);
  return Number.isFinite(seconds) && seconds >= 0 ? seconds * 1000 : defaultRetryMs;
}

// 期限までに必ず終わる。完了の通知と保存の時間を残し、間に合わない生成はNovelAIへ送らない。
export async function requestImage(request: {
  apiUrl: string;
  token: string;
  prompt: string;
  deadline: number;
}): Promise<ImageResult> {
  const body = JSON.stringify(
    buildGeneratePayload(request.prompt, Math.floor(Math.random() * 1_000_000_000)),
  );
  for (;;) {
    if (request.deadline - Date.now() < minimumTimeMs) return { ok: false, reason: "deadline" };
    let response: Response;
    let bytes: Uint8Array;
    try {
      response = await fetch(`${request.apiUrl}/ai/generate-image`, {
        method: "POST",
        headers: { Authorization: `Bearer ${request.token}`, "Content-Type": "application/json" },
        body,
        signal: AbortSignal.timeout(request.deadline - abortMarginMs - Date.now()),
      });
      bytes = new Uint8Array(await response.arrayBuffer());
    } catch {
      return { ok: false, reason: "network" };
    }
    if (response.ok) {
      try {
        return {
          ok: true,
          image: await readImageResponse(bytes, response.headers.get("Content-Type")),
        };
      } catch {
        return { ok: false, reason: "invalid-response" };
      }
    }
    const detail = new TextDecoder().decode(bytes).slice(0, 200);
    const wait = retryDelay(response.headers.get("Retry-After"));
    // 429は同じアカウントの別の生成が終わっていない場合に返る。
    if (response.status !== 429 || request.deadline - Date.now() - wait < minimumTimeMs)
      return { ok: false, reason: "http", status: response.status, detail };
    await new Promise((resolve) => setTimeout(resolve, wait));
  }
}
