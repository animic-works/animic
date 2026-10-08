import { describe, expect, it } from "vite-plus/test";

import { initialDisplayName, loginErrorMessage, parseLoginSearch } from "./entry-login";

describe("表示名の初期値", () => {
  it("アカウントの名前の前後の空白を除き、先頭20文字を使う", () => {
    expect(initialDisplayName("  ねこぜ ")).toBe("ねこぜ");
    expect(initialDisplayName("とても長いアカウントの名前で二十文字を超えています")).toBe(
      "とても長いアカウントの名前で二十文字を超",
    );
    expect(initialDisplayName("a".repeat(20))).toBe("a".repeat(20));
  });

  it("上限をまたぐ絵文字は途中で切らずに外す", () => {
    expect(initialDisplayName(`${"a".repeat(19)}😀`)).toBe("a".repeat(19));
    expect(initialDisplayName(`${"a".repeat(18)}😀b`)).toBe(`${"a".repeat(18)}😀`);
  });

  it("切った末尾の空白を除き、空白だけの名前は空にする", () => {
    expect(initialDisplayName(`${"a".repeat(19)} b`)).toBe("a".repeat(19));
    expect(initialDisplayName("   ")).toBe("");
  });
});

describe("認証の失敗の表示", () => {
  it("理由ごとに文言を選び、知らない理由は共通の文言にする", () => {
    expect(loginErrorMessage("access_denied")).toBe("ログインを取り消しました。");
    expect(loginErrorMessage("account_not_linked")).toContain("別のログイン方法で登録");
    for (const code of ["state_not_found", "state_mismatch", "invalid_code"])
      expect(loginErrorMessage(code)).toBe("ログインの期限が切れました。もう一度お試しください。");
    expect(loginErrorMessage("unknown")).toBe("ログインできませんでした。もう一度お試しください。");
  });

  it("URLのerrorは文字列のときだけ受け取る", () => {
    expect(parseLoginSearch({ error: "access_denied" })).toEqual({ error: "access_denied" });
    expect(parseLoginSearch({ error: 1 })).toEqual({});
    expect(parseLoginSearch({})).toEqual({});
  });
});
