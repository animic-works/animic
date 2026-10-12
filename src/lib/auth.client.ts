import { createAuthClient } from "better-auth/react";
import { anonymousClient } from "better-auth/client/plugins";

import type { LoginProvider } from "./login-providers";

const authClient = createAuthClient({ plugins: [anonymousClient()] });

/**
 * 認証の要求を送り、通信の失敗を含めて失敗したら`message`のエラーにする。
 * ブラウザの英語のエラー文（Failed to fetchなど）を画面に出さない。
 */
async function request<T extends { error: unknown }>(send: () => Promise<T>, message: string) {
  let result: T;
  try {
    result = await send();
  } catch {
    throw new Error(message);
  }
  if (result.error) throw new Error(message);
  return result;
}

export async function ensureParticipant() {
  const ensure = async () => {
    const current = await request(
      () => authClient.getSession(),
      "参加者情報を確認できませんでした。",
    );
    if (current.data) return;
    await request(
      () => authClient.signIn.anonymous(),
      "参加の準備ができませんでした。もう一度お試しください。",
    );
  };
  // 複数タブでの初回参加が別々の匿名ユーザーを作らないよう直列化する。
  if (navigator.locks) await navigator.locks.request("animic-anonymous-session", ensure);
  else await ensure();
}

/**
 * サービスの認証画面へ移動する。認証の後は`callbackURL`、失敗したときは`?error=`を付けて
 * `errorCallbackURL`へ戻る。どちらもルート相対のパスで渡す。
 */
export async function signInWith(
  provider: LoginProvider,
  urls: { callbackURL: string; errorCallbackURL: string },
) {
  await request(
    () => authClient.signIn.social({ provider, ...urls }),
    "ログインを始められませんでした。もう一度お試しください。",
  );
}

/** このブラウザのセッションをサーバーで失効させてからCookieを消す。 */
export async function signOut() {
  await request(() => authClient.signOut(), "ログアウトできませんでした。ログインしたままです。");
}
