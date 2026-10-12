import { useMemo, useSyncExternalStore } from "react";
import * as v from "valibot";

import { loginProviderSchema } from "../../lib/login-providers";

// トップのHTMLには参加者の情報を含めないため、ナビの「マイページ」をアカウントのアイコンに替えるのは起動後になる。
// 前回ログインしていたブラウザーでは、このブラウザーに覚えたアイコンの表示を起動直後に出し、サーバーでの確認を待たない。
// 起動するまではその場所を隠し、「マイページ」からアイコンへ切り替わるちらつきを出さない。
// ログインしていない人には、最初から「マイページ」を出す。
const storageKey = "animic-account";
const pendingAttribute = "data-animic-navigation-actions-pending";

const accountSchema = v.object({
  name: v.string(),
  provider: v.nullable(loginProviderSchema),
  icon: v.nullable(v.string()),
});
type AccountHint = v.InferOutput<typeof accountSchema>;

/** 描画前に実行し、前回ログインしていればナビの補助操作を隠す。 */
export const initialAccountHint = `(() => {
  try {
    if (localStorage.getItem('${storageKey}'))
      document.documentElement.setAttribute('${pendingAttribute}', '');
  } catch {}
})();`;

function readStored() {
  try {
    return localStorage.getItem(storageKey);
  } catch {
    return null;
  }
}

/**
 * 前回ログインしていたときのアイコンの表示。覚えていなければ`null`。
 * サーバーの描画とhydrationでは`null`とし、起動直後にこのブラウザーの記録を読む。
 */
export function useAccountHint(): AccountHint | null {
  const stored = useSyncExternalStore(
    () => () => {},
    readStored,
    () => null,
  );
  return useMemo(() => {
    try {
      const parsed = v.safeParse(accountSchema, JSON.parse(stored ?? "null"));
      return parsed.success ? parsed.output : null;
    } catch {
      return null;
    }
  }, [stored]);
}

/**
 * ログインの確認が終わったら、次回のために結果を覚え、ナビの補助操作を表示する。
 * 確認できなかった場合（`undefined`）は、前回の結果を残したまま表示だけ戻す。
 */
export function settleAccountHint(account: AccountHint | null | undefined) {
  try {
    if (account) localStorage.setItem(storageKey, JSON.stringify(account));
    else if (account === null) localStorage.removeItem(storageKey);
  } catch {
    // 読み書きできない環境では覚えず、毎回ログインしていない人と同じ表示から始める。
  }
  document.documentElement.removeAttribute(pendingAttribute);
}
