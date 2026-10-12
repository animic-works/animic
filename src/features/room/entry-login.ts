/** 認証の失敗で戻ったURLの`?error=`を受け取る。文字列でなければ無視する。 */
export function parseLoginSearch(search: Record<string, unknown>): { error?: string } {
  return typeof search.error === "string" ? { error: search.error } : {};
}

/** Better Authが`?error=`に付ける理由から、参加者に伝える文言を選ぶ。 */
export function loginErrorMessage(error: string) {
  switch (error) {
    case "access_denied":
      return "ログインを取り消しました。";
    case "account_not_linked":
      return "このメールアドレスは別のログイン方法で登録されています。そのサービスでログインしてください。";
    case "email_not_found":
      return "メールアドレスを取得できませんでした。サービスの設定を確認してください。";
    case "state_not_found":
    case "state_mismatch":
    case "invalid_code":
    case "invalid_callback_request":
      return "ログインの期限が切れました。もう一度お試しください。";
    default:
      return "ログインできませんでした。もう一度お試しください。";
  }
}

/**
 * アカウントの名前から、表示名の欄に入れておく値を作る。
 *
 * 表示名の上限（20文字）に収まる先頭だけを使い、絵文字などを途中で切らない。
 */
export function initialDisplayName(accountName: string) {
  let name = "";
  for (const char of accountName.trim()) {
    if (name.length + char.length > 20) break;
    name += char;
  }
  return name.trimEnd();
}
