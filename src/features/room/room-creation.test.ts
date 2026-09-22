import { describe, expect, it } from "vite-plus/test";
import { createRoomCode, isRoomCreationRetry } from "./room-creation";

const request = {
  participantId: "participant-a",
  requestId: "ae997386-88dc-4abe-9d80-146084055ec3",
  name: "参加者",
};

describe("ルーム作成の再送", () => {
  it("同じ要求は同じコードになり、本人・要求・衝突回数が変われば別の候補になる", async () => {
    const code = await createRoomCode(request.participantId, request.requestId, 0);
    expect(code).toMatch(/^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{8}$/);
    expect(await createRoomCode(request.participantId, request.requestId, 0)).toBe(code);
    for (const candidate of await Promise.all([
      createRoomCode("participant-b", request.requestId, 0),
      createRoomCode(request.participantId, "ef709657-77cf-4e42-bcbc-7e83999de4cc", 0),
      createRoomCode(request.participantId, request.requestId, 1),
    ]))
      expect(candidate).not.toBe(code);
  });

  it("作成者と要求IDの両方が一致する再送だけを受け付ける", () => {
    expect(isRoomCreationRetry(request, { ...request })).toBe(true);
    expect(isRoomCreationRetry(null, request)).toBe(false);
    expect(isRoomCreationRetry(request, { ...request, participantId: "participant-b" })).toBe(
      false,
    );
    expect(isRoomCreationRetry(request, { ...request, requestId: "another-request" })).toBe(false);
    expect(() => isRoomCreationRetry(request, { ...request, name: "変更した名前" })).toThrow(
      "表示名を変更できません",
    );
  });
});
