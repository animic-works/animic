import { useRef } from "react";
import type { GenerationInput } from "../image-generation/generation-input";
import { generateImage } from "../image-generation/image-generation.functions";
import type { BattleSnapshot } from "./battle-state";
import { getGenerationId } from "./generation-request";
import type { UnsentGeneration } from "./generation-request";

/** 画像の生成を要求する。受付を拒否されたか通信に失敗したら例外を投げる。 */
export function useBattleGeneration({
  code,
  battleId,
  generations,
}: {
  code: string;
  battleId: string;
  /** 本人の生成履歴。送れなかった要求をサーバーが受け付けていたかを確かめる。 */
  generations: BattleSnapshot["myGenerations"];
}) {
  // 送れなかった要求を同じ入力で送り直すときは同じ処理IDを使い、サーバーが受け付け済みなら二重に生成させない。
  const unsent = useRef<UnsentGeneration | null>(null);

  return async function generate({ prompt, characters }: GenerationInput) {
    const input = JSON.stringify({ prompt, characters });
    const generationId = getGenerationId(
      unsent.current,
      { battleId, input },
      generations.map((item) => item.id),
    );
    unsent.current = { battleId, input, generationId };
    await generateImage({ data: { code, battleId, generationId, prompt, characters } });
    unsent.current = null;
  };
}
