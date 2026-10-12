import { createFileRoute, useRouter } from "@tanstack/react-router";

import { BattleOptionsScreen } from "../../features/admin/battle-options-screen";
import { getBattleOptions } from "../../features/room/battle-options.functions";

// ロビーで選べる制限時間・画像選択の猶予の候補と既定値。
export const Route = createFileRoute("/admin/battle-options")({
  loader: ({ context }) => (context.admin.authenticated ? getBattleOptions() : null),
  head: () => ({ meta: [{ title: "対戦条件 | 管理画面 | Animic" }] }),
  component: BattleOptions,
});

function BattleOptions() {
  const options = Route.useLoaderData();
  const router = useRouter();
  if (!options) return null;
  return (
    <BattleOptionsScreen
      key={JSON.stringify(options)}
      options={options}
      onSaved={() => router.invalidate()}
    />
  );
}
