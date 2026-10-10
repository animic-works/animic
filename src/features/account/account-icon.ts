import type { AvatarProps } from "@animic/react/avatar";
import * as v from "valibot";

type AvatarPalette = NonNullable<AvatarProps["palette"]>;

/** アイコンに選べる色。Avatarの`palette`の名前。 */
export const accountIconColors = [
  "pink",
  "cyan",
  "yellow",
  "green",
  "violet",
  "orange",
  "ink",
] as const satisfies readonly AvatarPalette[];

/** アイコンに選べるイラストの番号。画像は`public/images/account-icons/illustration-<番号>.svg`。 */
export const accountIconIllustrations = ["1", "2", "3", "4", "5", "6", "7", "8"] as const;

/** 選んだアイコン。`color:<色>`か`illustration:<番号>`の文字列で保存する。 */
export const accountIconSchema = v.picklist([
  ...accountIconColors.map((color) => `color:${color}` as const),
  ...accountIconIllustrations.map((id) => `illustration:${id}` as const),
]);
export type AccountIcon = v.InferOutput<typeof accountIconSchema>;

/** 保存された値を読み、選べない値やnullは「選んでいない」として扱う。 */
export function parseAccountIcon(value: unknown): AccountIcon | null {
  const parsed = v.safeParse(accountIconSchema, value);
  return parsed.success ? parsed.output : null;
}

export function illustrationSrc(id: (typeof accountIconIllustrations)[number]) {
  return `/images/account-icons/illustration-${id}.svg`;
}

/** Avatarに渡す画像と色。アイコンを選んでいない参加者は`fallback`の色で表示する。 */
export function accountIconAvatar(
  icon: AccountIcon | null,
  fallback?: AvatarPalette,
): { src?: string; palette?: AvatarPalette } {
  const color = accountIconColors.find((item) => icon === `color:${item}`);
  if (color) return { palette: color };
  const illustration = accountIconIllustrations.find((item) => icon === `illustration:${item}`);
  if (illustration) return { src: illustrationSrc(illustration), palette: fallback };
  return { palette: fallback };
}
