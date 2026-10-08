// 管理画面で使う日時と失敗の文言。

// サーバーとブラウザで同じ文字列にし、表示の食い違いを起こさない。
const dateTimeFormat = new Intl.DateTimeFormat("ja-JP", {
  timeZone: "Asia/Tokyo",
  dateStyle: "short",
  timeStyle: "medium",
});
const dateFormat = new Intl.DateTimeFormat("ja-JP", {
  timeZone: "Asia/Tokyo",
  month: "2-digit",
  day: "2-digit",
});

/** 日時（なければ「—」）。UNIX時刻のミリ秒かDateを受け取る。 */
export function formatDateTime(value: number | Date | null) {
  return value === null ? "—" : dateTimeFormat.format(value);
}

/** 月日（「10/08」）。 */
export function formatDate(value: number | Date) {
  return dateFormat.format(value);
}

/** Server Functionなどの失敗を、画面に出す文言にする。 */
export function errorMessage(error: unknown) {
  return error instanceof Error && error.message ? error.message : "操作できませんでした。";
}
