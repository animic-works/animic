import { createAuthClient } from "better-auth/react";
import { anonymousClient } from "better-auth/client/plugins";

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
