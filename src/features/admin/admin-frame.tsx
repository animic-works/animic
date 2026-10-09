import { useState, type FormEvent, type ReactNode } from "react";
import { AppFrame } from "@animic/react/app-frame";
import { Badge } from "@animic/react/badge";
import { Button } from "@animic/react/button";
import { Container } from "@animic/react/container";
import { Field } from "@animic/react/field";
import { Heading } from "@animic/react/heading";
import { Input } from "@animic/react/input";
import { Link } from "@animic/react/link";
import { Page } from "@animic/react/page";
import { Split } from "@animic/react/split";
import { Stack } from "@animic/react/stack";
import { Surface } from "@animic/react/surface";
import { Text } from "@animic/react/text";
import { useToast } from "@animic/react/toast";
import { loginAdmin, logoutAdmin } from "../../lib/admin.functions";
import { AppBrand } from "../shared/app-brand";
import { AdminError } from "./admin-parts";
const NAV = [
  { href: "/admin/topics", label: "お題" },
  { href: "/admin/battle-options", label: "対戦条件" },
  { href: "/admin/prompts", label: "よく使う表現" },
  { href: "/admin/image-generation", label: "画像生成" },
  { href: "/admin/scoring/workers", label: "採点ワーカー" },
  { href: "/admin/scoring/jobs", label: "採点ジョブ" },
  { href: "/admin/backup", label: "バックアップ" },
] as const;
type AdminHref = (typeof NAV)[number]["href"];
export function AdminLogin({ onLoggedIn }: { onLoggedIn: () => Promise<void> }) {
  const [password, setPassword] = useState(""),
    [error, setError] = useState<string | null>(null),
    [sending, setSending] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) return;
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
    <Page>
      <AppFrame brand={<AppBrand />}>
        <Container size="narrow">
          <Surface appearance="card">
            <form onSubmit={(event) => void submit(event)}>
              <Stack>
                <Heading level={1} size="panel">
                  管理画面
                </Heading>
                <Text>パスワードでログインしてください。</Text>
                <Field label="パスワード">
                  <Input
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                </Field>
                <AdminError>{error}</AdminError>
                <Button type="submit" loading={sending}>
                  ログイン
                </Button>
                <Link href="/">トップへ戻る</Link>
              </Stack>
            </form>
          </Surface>
        </Container>
      </AppFrame>
    </Page>
  );
}
export function AdminFrame({
  pathname,
  onNavigate,
  onLoggedOut,
  children,
}: {
  pathname: string;
  onNavigate: (href: AdminHref) => void;
  onLoggedOut: () => Promise<void>;
  children: ReactNode;
}) {
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  async function logout() {
    setBusy(true);
    try {
      await logoutAdmin();
      await onLoggedOut();
    } catch {
      toast.show({ title: "ログアウトできませんでした。" });
    } finally {
      setBusy(false);
    }
  }
  return (
    <Page>
      <AppFrame
        brand={<AppBrand />}
        context={<Badge>管理</Badge>}
        actions={
          <Button appearance="secondary" size="sm" loading={busy} onClick={() => void logout()}>
            ログアウト
          </Button>
        }
      >
        <Split layout="aside-main" align="start">
          <nav aria-label="管理メニュー">
            <Surface appearance="card">
              <Stack>
                <Text variant="eyebrow">Admin</Text>
                {NAV.map((item) => (
                  <Link
                    key={item.href}
                    appearance="navigation"
                    href={item.href}
                    aria-current={pathname.startsWith(item.href) ? "page" : undefined}
                    onClick={(event) => {
                      if (
                        event.metaKey ||
                        event.ctrlKey ||
                        event.shiftKey ||
                        event.altKey ||
                        event.button !== 0
                      )
                        return;
                      event.preventDefault();
                      onNavigate(item.href);
                    }}
                  >
                    {item.label}
                  </Link>
                ))}
              </Stack>
            </Surface>
          </nav>
          <Stack space="section">{children}</Stack>
        </Split>
      </AppFrame>
    </Page>
  );
}
