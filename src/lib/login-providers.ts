import * as v from "valibot";

/** 参加者のログインに使うサービス。Better Authの`providerId`と同じ値。 */
export const loginProviderSchema = v.picklist(["google", "discord"]);
