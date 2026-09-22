// ランダムな要求IDと本人のIDから候補を再現し、通信の再送でも同じDOへ到達する。
export async function createRoomCode(participantId: string, requestId: string, attempt: number) {
  const alphabet = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
  let code = "";
  for (let block = 0; code.length < 8; block += 1) {
    const input = new TextEncoder().encode(
      JSON.stringify([participantId, requestId, attempt, block]),
    );
    const bytes = new Uint8Array(await crypto.subtle.digest("SHA-256", input));
    for (const byte of bytes) {
      if (byte < 248 && code.length < 8) code += alphabet[byte % alphabet.length];
    }
  }
  return code;
}

export type RoomCreation = { participantId: string; requestId: string; name: string };

export function isRoomCreationRetry(previous: RoomCreation | null, request: RoomCreation) {
  if (
    !previous ||
    previous.participantId !== request.participantId ||
    previous.requestId !== request.requestId
  )
    return false;
  if (previous.name !== request.name) throw new Error("同じ作成要求で表示名を変更できません。");
  return true;
}
