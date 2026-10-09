import { ordinal as rankOrdinal } from "../../../src/features/battle/battle-outcome";

/** 順位がない場合は「—」にする。 */
export function ordinal(rank: number | null) {
  return rank === null ? "—" : rankOrdinal(rank);
}
export function dateLabel(at: number) {
  return new Date(at).toLocaleString("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tokyo",
  });
}

export function relativeDateLabel(at: number, now: number) {
  const hours = Math.floor(Math.max(0, now - at) / 3600000);
  if (hours < 1) return "たったいま";
  return hours < 24 ? `${hours}時間前` : `${Math.floor(hours / 24)}日前`;
}
