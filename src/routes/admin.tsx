import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import type { FormEvent } from "react";

import { ScoringAdmin } from "../features/scoring/scoring-admin";
import { getScoringAdminData } from "../features/scoring/scoring-admin.functions";
import { getAdminSession, loginAdmin, logoutAdmin } from "../lib/admin.functions";
import styles from "./-admin.module.css";

export const Route = createFileRoute("/admin")({
  headers: () => ({ "Cache-Control": "private, no-store" }),
  head: () => ({ meta: [{ title: "管理画面 | Animic" }] }),
  loader: async () => ({
    scoring: (await getAdminSession()).authenticated ? await getScoringAdminData() : null,
  }),
  component: AdminPage,
});

function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const result = await loginAdmin({ data: { password } });
      if (result.error) setError(result.error);
      else {
        setPassword("");
        await router.invalidate();
      }
    } catch {
      setError("ログインできませんでした。");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className={styles.page}>
      <h1>管理画面</h1>
      <form onSubmit={(event) => void submit(event)} className={styles.login}>
        <label>
          パスワード
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        <button type="submit" disabled={pending}>
          ログイン
        </button>
      </form>
      {error && <p role="alert">{error}</p>}
    </main>
  );
}

function AdminPage() {
  const router = useRouter();
  const { scoring } = Route.useLoaderData();
  if (!scoring) return <AdminLogin />;

  async function logout() {
    await logoutAdmin();
    await router.invalidate();
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1>管理画面</h1>
        <nav aria-label="管理メニュー">
          <ul className={styles.menu}>
            <li>
              <a href="#link-code">リンクコードの発行</a>
            </li>
            <li>
              <a href="#workers">採点ワーカー</a>
            </li>
            <li>
              <a href="#jobs">採点ジョブ</a>
            </li>
          </ul>
        </nav>
        <button type="button" onClick={() => void router.invalidate()}>
          最新の状態にする
        </button>
        <button type="button" onClick={() => void logout()}>
          ログアウト
        </button>
      </header>
      <ScoringAdmin {...scoring} />
    </main>
  );
}
