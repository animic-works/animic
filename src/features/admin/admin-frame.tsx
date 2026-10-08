import { useState } from "react";
import type { FormEvent, ReactNode } from "react";

import { Badge } from "../../components/badge";
import { Button } from "../../components/button";
import { EntryCard, EntryPage } from "../../components/entry";
import { TextField } from "../../components/field";
import { Icon } from "../../components/icon";
import { Stack } from "../../components/layout";
import { Text } from "../../components/text";
import { loginAdmin, logoutAdmin } from "../../lib/admin.functions";
import { AdminShell } from "./admin-parts";
import type { AdminNavItem } from "./admin-parts";

// 管理画面の遷移先。左のナビとルートのパスに1対1で対応する。
type AdminHref =
  | "/admin/topics"
  | "/admin/battle-options"
  | "/admin/prompts"
  | "/admin/image-generation"
  | "/admin/scoring/workers"
  | "/admin/scoring/jobs"
  | "/admin/backup";

// 左のナビの並び（件数は出さない）
const NAV: { href: AdminHref; label: string; icon: AdminNavItem["icon"] }[] = [
  { href: "/admin/topics", label: "お題", icon: "grid" },
  { href: "/admin/battle-options", label: "対戦条件", icon: "stopwatch" },
  { href: "/admin/prompts", label: "よく使う表現", icon: "tag" },
  { href: "/admin/image-generation", label: "画像生成", icon: "sparkle" },
  { href: "/admin/scoring/workers", label: "採点ワーカー", icon: "server" },
  { href: "/admin/scoring/jobs", label: "採点ジョブ", icon: "target" },
  { href: "/admin/backup", label: "バックアップ", icon: "download" },
];

// パスワードを入力してログインする画面。ログインするまで中身は読み込まない
export function AdminLogin({ onLoggedIn }: { onLoggedIn: () => Promise<void> }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setError(null);
    try {
      const result = await loginAdmin({ data: { password } });
      if (result.error) {
        setError(result.error);
        return;
      }
      setPassword("");
      await onLoggedIn();
    } catch {
      setError("ログインできませんでした。");
    } finally {
      setSending(false);
    }
  }

  return (
    <EntryPage>
      <EntryCard
        logoSrc="/animic-logo.svg"
        title="管理画面"
        titleId="admin-login-title"
        sub="パスワードでログインしてください。"
      >
        <form onSubmit={(event) => void submit(event)}>
          <Stack gap="4">
            <TextField
              label="パスワード"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            {error ? (
              <Text variant="note" tone="danger" role="alert">
                {error}
              </Text>
            ) : null}
            <Button type="submit" fullWidth size="lg" loading={sending}>
              ログイン
            </Button>
          </Stack>
        </form>
        <Button variant="link" asChild>
          <a href="/">トップへ戻る</a>
        </Button>
      </EntryCard>
    </EntryPage>
  );
}

export type AdminFrameProps = {
  pathname: string;
  onNavigate: (href: AdminHref) => void;
  onLoggedOut: () => Promise<void>;
  children: ReactNode;
};

// ログイン後の枠。上のバー・左のナビ・右の中身。ナビのクリックはルーターに渡す
export function AdminFrame({ pathname, onNavigate, onLoggedOut, children }: AdminFrameProps) {
  async function logout() {
    await logoutAdmin();
    await onLoggedOut();
  }

  const nav: AdminNavItem[] = NAV.map((item) => ({
    ...item,
    current: pathname.startsWith(item.href),
  }));

  return (
    <AdminShell
      logoSrc="/animic-logo.svg"
      logoHref="/"
      badge={
        <Badge tone="accent" size="sm">
          管理
        </Badge>
      }
      end={
        <Button
          variant="secondary"
          size="sm"
          leadingIcon={<Icon name="exit" size="md" />}
          onClick={() => void logout()}
        >
          ログアウト
        </Button>
      }
      nav={nav}
      onNavigate={(href, event) => {
        // 修飾キー・左以外のクリックは、別タブで開くなどの既定の動きに任せる。
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0)
          return;
        const item = NAV.find((entry) => entry.href === href);
        if (!item) return;
        event.preventDefault();
        onNavigate(item.href);
      }}
    >
      {children}
    </AdminShell>
  );
}
