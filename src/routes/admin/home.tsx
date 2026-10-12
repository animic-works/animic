import { createFileRoute, useRouter } from "@tanstack/react-router";

import { HomeContentScreen } from "../../features/admin/home-content-screen";
import { getHomeContent } from "../../features/home/home-content.functions";

// トップページの遊び方・採点方法・ギャラリーとOGP画像。
export const Route = createFileRoute("/admin/home")({
  loader: ({ context }) => (context.admin.authenticated ? getHomeContent() : null),
  head: () => ({ meta: [{ title: "トップページ | 管理画面 | Animic" }] }),
  component: Home,
});

function Home() {
  const content = Route.useLoaderData();
  const router = useRouter();
  if (!content) return null;
  return <HomeContentScreen content={content} onChanged={() => router.invalidate()} />;
}
