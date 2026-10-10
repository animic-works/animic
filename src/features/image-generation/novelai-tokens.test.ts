import { describe, expect, it } from "vite-plus/test";

import { readApiTokens, TokenPool } from "./novelai-tokens";

/** 受け取ったトークンを、受け取った順に記録する。 */
function track(pool: TokenPool) {
  const received: [string, number | null][] = [];
  const take = async (name: string) => {
    received.push([name, await pool.acquire()]);
  };
  return { received, take };
}

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("readApiTokens", () => {
  it("カンマで分け、前後の空白・空の要素・重複を除く", () => {
    expect(readApiTokens(" pst-a , pst-b,, pst-a ,")).toEqual(["pst-a", "pst-b"]);
    expect(readApiTokens("pst-a")).toEqual(["pst-a"]);
  });
  it("未設定や空ならトークンなし", () => {
    expect(readApiTokens(undefined)).toEqual([]);
    expect(readApiTokens(" , ")).toEqual([]);
  });
});

describe("TokenPool", () => {
  it("トークンの数まで同時に渡し、残りは受付順に待たせる", async () => {
    const pool = new TokenPool(2);
    const { received, take } = track(pool);
    for (const name of ["a", "b", "c", "d"]) void take(name);
    await settle();
    expect(received).toEqual([
      ["a", 0],
      ["b", 1],
    ]);
    expect(pool.waiting).toBe(2);

    pool.release(1);
    await settle();
    expect(received.at(-1)).toEqual(["c", 1]);
    pool.release(0);
    await settle();
    expect(received.at(-1)).toEqual(["d", 0]);
    expect(pool.waiting).toBe(0);
  });

  it("1つなら1件ずつ渡す", async () => {
    const pool = new TokenPool(1);
    const { received, take } = track(pool);
    void take("a");
    void take("b");
    await settle();
    expect(received).toEqual([["a", 0]]);
    pool.release(0);
    await settle();
    expect(received).toEqual([
      ["a", 0],
      ["b", 0],
    ]);
  });

  it("空いているトークンは、最も長く使っていないものから渡す", async () => {
    const pool = new TokenPool(3);
    const first = [await pool.acquire(), await pool.acquire()];
    expect(first).toEqual([0, 1]);
    pool.release(0);
    expect(await pool.acquire()).toBe(2);
    expect(await pool.acquire()).toBe(0);
  });

  it("使えないトークンは以後渡さず、待っている要求は残りのトークンで受付順に進める", async () => {
    const pool = new TokenPool(2);
    const { received, take } = track(pool);
    for (const name of ["a", "b", "c"]) void take(name);
    await settle();
    pool.release(0, false);
    await settle();
    expect(received).toEqual([
      ["a", 0],
      ["b", 1],
    ]);
    pool.release(1);
    await settle();
    expect(received.at(-1)).toEqual(["c", 1]);
    pool.release(1);
    expect(await pool.acquire()).toBe(1);
  });

  it("使えるトークンがなくなったら、待っている要求と新しい要求にnullを返す", async () => {
    const pool = new TokenPool(1);
    const { received, take } = track(pool);
    void take("a");
    void take("b");
    await settle();
    pool.release(0, false);
    await settle();
    expect(received).toEqual([
      ["a", 0],
      ["b", null],
    ]);
    expect(await pool.acquire()).toBeNull();
    expect(await new TokenPool(0).acquire()).toBeNull();
  });
});
