/** 送れなかった生成の要求。同じ入力で送り直すときに同じ処理IDを使うために覚えておく。 */
export type UnsentGeneration = { battleId: string; input: string; generationId: string };

/**
 * 生成の要求に使う処理ID。送れなかった要求を同じ対戦・同じ入力で送り直すときは同じIDを使い、
 * サーバーが受け付け済みなら二重に生成させない。そのIDが本人の生成履歴（`generationIds`）に
 * 届いていれば、サーバーは受け付け済みで同じIDでは何も起きないため、次の生成として新しいIDを使う。
 */
export function getGenerationId(
  unsent: UnsentGeneration | null,
  request: { battleId: string; input: string },
  generationIds: readonly string[],
) {
  return unsent?.battleId === request.battleId &&
    unsent.input === request.input &&
    !generationIds.includes(unsent.generationId)
    ? unsent.generationId
    : crypto.randomUUID();
}
