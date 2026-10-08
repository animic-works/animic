import { createFileRoute } from "@tanstack/react-router";

import { BackupScreen } from "../../features/admin/backup-screen";

// お題・対戦条件・よく使う表現の書き出しと読み込み。
export const Route = createFileRoute("/admin/backup")({
  head: () => ({ meta: [{ title: "バックアップ | 管理画面 | Animic" }] }),
  component: Backup,
});

function Backup() {
  const { admin } = Route.useRouteContext();
  if (!admin.authenticated) return null;
  return <BackupScreen />;
}
