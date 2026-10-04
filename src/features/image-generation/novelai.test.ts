import { afterEach, describe, expect, it, vi } from "vite-plus/test";

import { buildGeneratePayload, readImageResponse, requestImage } from "./novelai";

const undesiredContent =
  ", lowres, bad hands, bad anatomy, artistic error, sepia, white haze, worst quality, very displeasing, jpeg artifacts, 0::ai-generated::, ";
// nai-desktop-studioのbuildGeneratePayloadに同じ入力（V5 Full・seed 12345）を渡した結果。
const referencePayload = {
  action: "generate",
  input: "1girl, solo",
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
    seed: 12345,
    n_samples: 1,
    negative_prompt: undesiredContent,
    qualityToggle: true,
    ucPreset: 1,
    cfg_rescale: 0,
    controlnet_strength: 1,
    characterPrompts: [],
    v4_prompt: {
      caption: {
        base_caption: "1girl, solo, very aesthetic, masterpiece, no text",
        char_captions: [],
      },
      use_coords: false,
      use_order: true,
    },
    v4_negative_prompt: {
      caption: { base_caption: undesiredContent, char_captions: [] },
      legacy_uc: false,
    },
  },
};

const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3, 4]);

function concat(...parts: Uint8Array[]) {
  const result = new Uint8Array(parts.reduce((total, part) => total + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }
  return result;
}

async function zip(data: Uint8Array<ArrayBuffer>, method: 0 | 8) {
  const body =
    method === 8
      ? new Uint8Array(
          await new Response(
            new Blob([data]).stream().pipeThrough(new CompressionStream("deflate-raw")),
          ).arrayBuffer(),
        )
      : data;
  const name = new TextEncoder().encode("image_0.png");
  const local = new Uint8Array(30 + name.length);
  const localView = new DataView(local.buffer);
  localView.setUint32(0, 0x04034b50, true);
  localView.setUint16(8, method, true);
  localView.setUint32(18, body.length, true);
  localView.setUint32(22, data.length, true);
  localView.setUint16(26, name.length, true);
  local.set(name, 30);
  const central = new Uint8Array(46 + name.length);
  const centralView = new DataView(central.buffer);
  centralView.setUint32(0, 0x02014b50, true);
  centralView.setUint16(10, method, true);
  centralView.setUint32(20, body.length, true);
  centralView.setUint32(24, data.length, true);
  centralView.setUint16(28, name.length, true);
  central.set(name, 46);
  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);
  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(8, 1, true);
  endView.setUint16(10, 1, true);
  endView.setUint32(12, central.length, true);
  endView.setUint32(16, local.length + body.length, true);
  return concat(local, body, central, end);
}

describe("NovelAIへのペイロード", () => {
  it("V5 Fullの固定値と品質タグを参考実装と同じ形で送る", () => {
    expect(buildGeneratePayload("1girl, solo", 12345)).toStrictEqual(referencePayload);
  });
  it("品質タグはText:の段落より前に入れ、inputには元のプロンプトを送る", () => {
    expect(buildGeneratePayload("1girl, solo\nText: Hello", 12345)).toStrictEqual({
      ...referencePayload,
      input: "1girl, solo\nText: Hello",
      parameters: {
        ...referencePayload.parameters,
        v4_prompt: {
          ...referencePayload.parameters.v4_prompt,
          caption: {
            base_caption: "1girl, solo, very aesthetic, masterpiece, no text\nText: Hello",
            char_captions: [],
          },
        },
      },
    });
  });
});

describe("NovelAIの応答の読み取り", () => {
  it("無圧縮とdeflateのZIPから最初の画像を取り出す", async () => {
    expect(await readImageResponse(await zip(png, 0), "application/x-zip-compressed")).toEqual(png);
    expect(await readImageResponse(await zip(png, 8), null)).toEqual(png);
  });
  it("ZIPでないPNGはそのまま使う", async () => {
    expect(await readImageResponse(png, "image/png")).toEqual(png);
  });
  it("短いデータ・壊れたZIP・PNGでないデータを拒否する", async () => {
    await expect(readImageResponse(png.slice(0, 2), null)).rejects.toThrow();
    await expect(readImageResponse((await zip(png, 0)).slice(0, 40), null)).rejects.toThrow();
    await expect(
      readImageResponse(await zip(new TextEncoder().encode("not png"), 0), null),
    ).rejects.toThrow();
  });
});

describe("NovelAIへの生成の要求", () => {
  const request = { apiUrl: "https://novelai.example", token: "pst-test", prompt: "1girl" };
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("トークンとペイロードを送り、ZIPの画像を返す", async () => {
    const zipped = await zip(png, 8);
    const fetch = vi.fn<typeof globalThis.fetch>(
      async () =>
        new Response(zipped, { headers: { "Content-Type": "application/x-zip-compressed" } }),
    );
    vi.stubGlobal("fetch", fetch);
    expect(await requestImage({ ...request, deadline: Date.now() + 60_000 })).toEqual({
      ok: true,
      image: png,
    });
    const [url, init] = fetch.mock.calls[0] ?? [];
    expect(url).toBe("https://novelai.example/ai/generate-image");
    expect(new Headers(init?.headers).get("Authorization")).toBe("Bearer pst-test");
    expect(typeof init?.body === "string" && JSON.parse(init.body)).toMatchObject({
      input: "1girl",
    });
  });
  it("429は送り直さず、すぐ失敗にする", async () => {
    const fetch = vi.fn<typeof globalThis.fetch>(
      async () =>
        new Response('{"statusCode":429,"message":"Concurrent generation is locked"}', {
          status: 429,
        }),
    );
    vi.stubGlobal("fetch", fetch);
    expect(await requestImage({ ...request, deadline: Date.now() + 60_000 })).toEqual({
      ok: false,
      reason: "http",
      status: 429,
      detail: '{"statusCode":429,"message":"Concurrent generation is locked"}',
    });
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it("エラー文に含まれたトークンを伏せる", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof globalThis.fetch>(
        async () => new Response('{"message":"Invalid API key: pst-test"}', { status: 401 }),
      ),
    );
    expect(await requestImage({ ...request, deadline: Date.now() + 60_000 })).toEqual({
      ok: false,
      reason: "http",
      status: 401,
      detail: '{"message":"Invalid API key: ***"}',
    });
  });
  it("期限までの残りが短ければNovelAIへ送らない", async () => {
    const fetch = vi.fn<typeof globalThis.fetch>();
    vi.stubGlobal("fetch", fetch);
    expect(await requestImage({ ...request, deadline: Date.now() + 10_000 })).toEqual({
      ok: false,
      reason: "deadline",
    });
    expect(fetch).not.toHaveBeenCalled();
  });
  it("通信の失敗と読めない応答を区別する", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof globalThis.fetch>(async () => {
        throw new TypeError("network");
      }),
    );
    expect(await requestImage({ ...request, deadline: Date.now() + 60_000 })).toEqual({
      ok: false,
      reason: "network",
    });
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof globalThis.fetch>(async () => new Response("not png")),
    );
    expect(await requestImage({ ...request, deadline: Date.now() + 60_000 })).toEqual({
      ok: false,
      reason: "invalid-response",
    });
  });
});
