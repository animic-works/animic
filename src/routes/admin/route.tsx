import {
  createFileRoute,
  Outlet,
  useLocation,
  useNavigate,
  useRouter,
} from "@tanstack/react-router";

import { AdminFrame, AdminLogin } from "../../features/admin/admin-frame";
import { getAdminSession } from "../../lib/admin.functions";

// 管理画面の枠。ログインしていなければパスワードの入力だけを表示し、子の画面も読み込まない。
// 管理用のServer Functionsは、画面の表示とは別にサーバーでもログインを確かめる。
export const Route = createFileRoute("/admin")({
  headers: () => ({ "Cache-Control": "private, no-store" }),
  head: () => ({ meta: [{ title: "管理画面 | Animic" }] }),
  beforeLoad: async () => ({ admin: await getAdminSession() }),
  component: AdminLayout,
});

function AdminLayout() {
  const { admin } = Route.useRouteContext();
  const router = useRouter();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  if (!admin.authenticated) return <AdminLogin onLoggedIn={() => router.invalidate()} />;
  return (
    <AdminFrame
      pathname={pathname}
      onNavigate={(href) => void navigate({ to: href })}
      onLoggedOut={() => router.invalidate()}
    >
      <Outlet />
    </AdminFrame>
  );
}
