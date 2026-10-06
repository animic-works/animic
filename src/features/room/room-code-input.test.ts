import { describe, expect, it } from "vite-plus/test";

import { readRoomCodeInput } from "./room-code-input";

describe("ルームコードの入力", () => {
  it("小文字を大文字にし、空白や記号を除いて8文字までにする", () => {
    expect(readRoomCodeInput(" abcd-efgh-jk ")).toEqual({
      code: "ABCDEFGH",
      invalid: null,
      complete: true,
    });
  });

  it("8文字に満たなければ未完了として扱う", () => {
    expect(readRoomCodeInput("abc")).toEqual({ code: "ABC", invalid: null, complete: false });
  });

  it("ルームコードに使わない文字を返し、8文字でも完了にしない", () => {
    expect(readRoomCodeInput("A0CDEFGH")).toEqual({
      code: "A0CDEFGH",
      invalid: "0",
      complete: false,
    });
    expect(readRoomCodeInput("il")).toMatchObject({ code: "IL", invalid: "I" });
  });
});
