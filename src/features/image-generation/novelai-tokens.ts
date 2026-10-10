/** `NOVELAI_API_TOKEN`のカンマ区切りの値から、前後の空白・空の要素・重複を除いたトークンを読む。 */
export function readApiTokens(value: string | undefined) {
  return [
    ...new Set(
      (value ?? "")
        .split(",")
        .map((token) => token.trim())
        .filter(Boolean),
    ),
  ];
}

/**
 * NovelAIは1アカウントで同時に1件しか生成できないため、トークンごとに同時1件までにして、
 * 受付順に空いたトークンを渡す。トークンはトークンの並びの添字で表す。
 */
export class TokenPool {
  // 空いているトークン。最も長く使っていないものを先頭に置き、アカウントごとの負荷を分ける。
  #idle: number[];
  #usable: number;
  #waiting: ((token: number | null) => void)[] = [];

  constructor(count: number) {
    this.#idle = Array.from({ length: count }, (_, index) => index);
    this.#usable = count;
  }

  /** 順番を待っている要求の数。 */
  get waiting() {
    return this.#waiting.length;
  }

  /** 空いたトークンを受付順に渡す。使えるトークンが1つもなければnull。 */
  acquire(): Promise<number | null> {
    if (this.#usable === 0) return Promise.resolve(null);
    const token = this.#idle.shift();
    if (token !== undefined) return Promise.resolve(token);
    return new Promise((resolve) => this.#waiting.push(resolve));
  }

  /** トークンを返す。`usable`がfalseなら、そのトークンを以後渡さない。 */
  release(token: number, usable = true) {
    if (!usable) {
      this.#usable -= 1;
      if (this.#usable === 0) for (const resolve of this.#waiting.splice(0)) resolve(null);
      return;
    }
    const next = this.#waiting.shift();
    if (next) next(token);
    else this.#idle.push(token);
  }
}
