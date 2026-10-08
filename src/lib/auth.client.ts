import { createAuthClient } from "better-auth/react";
import { anonymousClient } from "better-auth/client/plugins";

import type { LoginProvider } from "./login-providers";

const authClient = createAuthClient({ plugins: [anonymousClient()] });

export async function ensureParticipant() {
  const ensure = async () => {
    const current = await authClient.getSession();
    if (current.error) throw new Error("参加者情報を確認できませんでした。");
    if (current.data) return;
    const result = await authClient.signIn.anonymous();
    if (result.error) throw new Error("参加の準備ができませんでした。もう一度お試しください。");
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
  const result = await authClient.signIn.social({ provider, ...urls });
  if (result.error) throw new Error("ログインを始められませんでした。もう一度お試しください。");
}

/** このブラウザのセッションをサーバーで失効させてからCookieを消す。 */
export async function signOut() {
  const result = await authClient.signOut();
  if (result.error) throw new Error("ログアウトできませんでした。ログインしたままです。");
}
