import { createFileRoute, redirect } from "@tanstack/react-router";

// 管理画面の入口はお題の一覧。ログイン前は枠がパスワードの入力を表示する。
export const Route = createFileRoute("/admin/")({
  beforeLoad: ({ context }) => {
    if (context.admin.authenticated) throw redirect({ to: "/admin/topics" });
  },
});
