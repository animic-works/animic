import { createClientOnlyFn } from "@tanstack/react-start";

import { ensureParticipant } from "./auth.client";

// 画面の操作から匿名セッションを用意する。ルートはサーバーでも読み込まれるため、ブラウザでだけ動かす
export const prepareParticipant = createClientOnlyFn(() => ensureParticipant());
