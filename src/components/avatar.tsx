import { Avatar as ArkAvatar } from "@ark-ui/react/avatar";

import { variant } from "./cx";
import avatarStyles from "./avatar.module.css";

export type AvatarPlayer = "1" | "2" | "3" | "4" | "5" | "6" | "7";
type AvatarSize = "sm" | "md" | "lg" | "tile" | "row" | "who" | "nav" | "profile";

export type AvatarProps = {
  /** 参加者の名前。頭文字と、画像の代わりの文字に使う */
  name: string;
  /** アイコンの画像。読み込めなければ頭文字に戻す */
  src?: string;
  /** 参加者を見分ける色（参加順に1〜7） */
  player?: AvatarPlayer;
  size?: AvatarSize;
  /** 名前を横に並べて出すときは、読み上げが重ならないよう装飾として扱う */
  decorative?: boolean;
};

const segmenter = new Intl.Segmenter("ja", { granularity: "grapheme" });
// 最初の1文字（絵文字や結合文字も1文字として扱う）
const initialOf = (name: string) =>
  segmenter.segment(name)[Symbol.iterator]().next().value?.segment ?? "?";

const PLAYERS = ["1", "2", "3", "4", "5", "6", "7"] as const satisfies readonly AvatarPlayer[];
/** 参加順（0始まり）から色を選ぶ */
export const playerColor = (index: number): AvatarPlayer =>
  PLAYERS[((index % PLAYERS.length) + PLAYERS.length) % PLAYERS.length] ?? "1";

// 参加者の丸いアイコン（Ark UIのAvatarで、画像の読み込み失敗時に頭文字へ戻す）
export function Avatar({ name, src, player = "1", size = "md", decorative = false }: AvatarProps) {
  return (
    <ArkAvatar.Root
      className={variant(avatarStyles, "root", { player, size })}
      aria-hidden={decorative || undefined}
    >
      <ArkAvatar.Fallback className={avatarStyles.fallback}>{initialOf(name)}</ArkAvatar.Fallback>
      {src ? (
        <ArkAvatar.Image className={avatarStyles.image} src={src} alt={decorative ? "" : name} />
      ) : null}
    </ArkAvatar.Root>
  );
}
