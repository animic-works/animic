import * as v from "valibot";

/** 参加者のログインに使うサービス。Better Authの`providerId`と同じ値。 */
export const loginProviderSchema = v.picklist(["google", "discord"]);
export type LoginProvider = v.InferOutput<typeof loginProviderSchema>;

/** 画面に出すサービスの名前 */
export const loginProviderNames: Record<LoginProvider, string> = {
  google: "Google",
  discord: "Discord",
};
