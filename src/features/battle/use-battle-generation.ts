import { useRef } from "react";
import type { GenerationInput } from "../image-generation/generation-input";
import { generateImage } from "../image-generation/image-generation.functions";

/** 画像の生成を要求する。受付を拒否されたか通信に失敗したら例外を投げる。 */
export function useBattleGeneration({ code, battleId }: { code: string; battleId: string }) {
  // 送れなかった要求を同じ入力で送り直すときは同じ処理IDを使い、サーバーが受け付け済みなら二重に生成させない。
  const unsent = useRef<{ battleId: string; input: string; generationId: string } | null>(null);

  return async function generate({ prompt, characters }: GenerationInput) {
    const input = JSON.stringify({ prompt, characters });
    const previous = unsent.current;
    const generationId =
      previous?.battleId === battleId && previous.input === input
        ? previous.generationId
        : crypto.randomUUID();
    unsent.current = { battleId, input, generationId };
    await generateImage({ data: { code, battleId, generationId, prompt, characters } });
    unsent.current = null;
  };
}
