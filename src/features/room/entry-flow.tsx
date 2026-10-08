import { useNavigate } from "@tanstack/react-router";
import { createClientOnlyFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import * as v from "valibot";

import { Button } from "../../components/button";
import {
  EntryAlert,
  EntryCard,
  EntryContext,
  EntryDivider,
  EntryPage,
  EntryProviders,
  EntryTerms,
  EntryWelcome,
  ProviderButton,
} from "../../components/entry";
import { TextField } from "../../components/field";
import { Icon } from "../../components/icon";
import { Stack } from "../../components/layout";
import { BackLink, PageDeco } from "../../components/page";
import { toast } from "../../components/toast";
import { signInWith, signOut } from "../../lib/auth.client";
import { loginProviderNames, loginProviderSchema } from "../../lib/login-providers";
import type { LoginProvider } from "../../lib/login-providers";
import { initialDisplayName, loginErrorMessage } from "./entry-login";
import { participantNameSchema } from "./room-state";

// ログインとログアウトはブラウザ専用のため、サーバーのバンドルから外す。
const signInOnClient = createClientOnlyFn(signInWith);
const signOutOnClient = createClientOnlyFn(signOut);

const errorMessage = (error: unknown) =>
  error instanceof Error && error.message
    ? error.message
    : "うまくいきませんでした。もう一度お試しください。";

const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

type EntryFlowProps = {
  /** ルームを作る（create）か、招待されたルームに参加する（join）か */
  mode: "create" | "join";
  /** 参加するルームのコード（join のとき） */
  code?: string;
  /** ログイン中のアカウント。ログインしていなければ null */
  account: { name: string; provider: LoginProvider | null } | null;
  /** 認証の失敗で戻ったときのURLの`?error=` */
  loginError?: string;
  /** 認証の後と、認証に失敗したときに戻る画面（ルート相対のパス） */
  returnTo: string;
  /** 表示名を決めたあとの処理（ルームの作成・参加と画面の移動）。失敗したら理由を投げる */
  onSubmit: (name: string) => Promise<void>;
  /** ログアウトした後に、ログイン中のアカウントを読み直す */
  onSignedOut: () => Promise<void>;
  /** 左上の「戻る」とその行き先 */
  back: { href: string; label: string };
};

type Step = "method" | "name";

/**
 * ログイン方法を選び、表示名を決めてルームを作る・参加する画面。
 *
 * ルームを作るにはログインが必要で、ルームURLから参加するときはログインせずにも進める。
 * ログイン中は方法の選択を省き、アカウントの名前を表示名の欄に入れておく。
 */
export function EntryFlow({
  mode,
  code,
  account,
  loginError,
  returnTo,
  onSubmit,
  onSignedOut,
  back,
}: EntryFlowProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("method");
  // 手順の切り替え: 今のカードが左へ抜け、次のカードが右から入る
  const [swap, setSwap] = useState<{ card: Step; phase: "in" | "out"; back: boolean } | null>(null);
  const [name, setName] = useState(() => (account ? initialDisplayName(account.name) : ""));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // 認証画面へ移動中のサービス
  const [connecting, setConnecting] = useState<LoginProvider | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [alert, setAlert] = useState(() => (loginError ? loginErrorMessage(loginError) : null));
  const valid = v.safeParse(participantNameSchema, name);

  // 再読み込みで同じ理由を出し直さないよう、表示したらURLから?error=を除く。
  useEffect(() => {
    if (!loginError) return;
    void navigate({
      to: ".",
      search: (previous: Record<string, unknown>) => ({ ...previous, error: undefined }),
      replace: true,
    });
  }, [loginError, navigate]);

  async function swapStep(to: Step, backward = false) {
    setAlert(null);
    if (reducedMotion()) {
      setStep(to);
      return;
    }
    setSwap({ card: step, phase: "out", back: backward });
    await new Promise((resolve) => setTimeout(resolve, 280));
    setStep(to);
    setSwap({ card: to, phase: "in", back: backward });
  }

  async function submit(value: string) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await onSubmit(value);
    } catch (caught) {
      setError(errorMessage(caught));
      setBusy(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (valid.success) void submit(valid.output);
  }

  async function login(provider: LoginProvider) {
    setConnecting(provider);
    setAlert(null);
    try {
      // 成功するとサービスの認証画面へ移動するため、接続中の表示のまま待つ。
      await signInOnClient(provider, { callbackURL: returnTo, errorCallbackURL: returnTo });
    } catch (caught) {
      setConnecting(null);
      setAlert(errorMessage(caught));
    }
  }

  async function logout() {
    setSigningOut(true);
    setAlert(null);
    try {
      await signOutOnClient();
      toast("ログアウトしました");
      setStep("method");
      await onSignedOut();
    } catch (caught) {
      setAlert(errorMessage(caught));
    } finally {
      setSigningOut(false);
    }
  }

  const submitLabel = mode === "join" ? "ルームに参加" : "ルームを作る";
  const busyLabel = mode === "join" ? "参加しています…" : "ルームを作っています…";
  const stepProps = (card: Step) =>
    swap?.card === card
      ? { step: swap.phase, back: swap.back, onStepAnimationEnd: () => setSwap(null) }
      : {};
  const context =
    mode === "join" && code ? (
      <EntryContext>
        ルーム <code>{code}</code> に参加します
      </EntryContext>
    ) : null;

  let card;
  if (!account && (mode === "create" || step === "method")) {
    card = (
      <EntryCard
        logoSrc="/animic-logo.svg"
        title="ログインしてはじめよう"
        titleId="entry-login-title"
        sub={
          mode === "create"
            ? "ルームを作るには、ログインが必要です。"
            : "別の端末でも同じ参加者として遊べます。"
        }
        {...stepProps("method")}
      >
        {context}
        {alert ? <EntryAlert>{alert}</EntryAlert> : null}
        <EntryProviders>
          {loginProviderSchema.options.map((provider) => (
            <ProviderButton
              key={provider}
              provider={provider}
              loading={connecting === provider}
              loadingText={`${loginProviderNames[provider]}に接続中…`}
              disabled={connecting !== null && connecting !== provider}
              onClick={() => void login(provider)}
            >
              {loginProviderNames[provider]}でログイン
            </ProviderButton>
          ))}
        </EntryProviders>
        {mode === "join" ? (
          <>
            <EntryDivider>または</EntryDivider>
            <Button
              size="lg"
              fullWidth
              trailingIcon={<Icon name="chevronRight" size="2xs" />}
              disabled={connecting !== null}
              onClick={() => void swapStep("name")}
            >
              ログインせずに進む
            </Button>
          </>
        ) : null}
        <EntryTerms>
          続行すると、<a href="/terms">利用規約</a>と<a href="/privacy">プライバシーポリシー</a>
          に同意したものとみなします。
        </EntryTerms>
      </EntryCard>
    );
  } else {
    card = (
      <EntryCard
        logoSrc="/animic-logo.svg"
        title="表示名を決めよう"
        titleId="entry-name-title"
        sub="対戦相手に表示される名前です。"
        {...stepProps("name")}
      >
        {context}
        {account ? (
          <EntryWelcome
            provider={account.provider}
            title={
              account.provider
                ? `${loginProviderNames[account.provider]}でログインしました`
                : "ログインしました"
            }
            action={
              <Button
                variant="link"
                loading={signingOut}
                loadingText="ログアウトしています…"
                disabled={busy}
                onClick={() => void logout()}
              >
                ログアウト
              </Button>
            }
          >
            {account.name}
          </EntryWelcome>
        ) : null}
        {alert ? <EntryAlert>{alert}</EntryAlert> : null}
        <form onSubmit={handleSubmit} noValidate>
          <Stack gap="5">
            <TextField
              label="表示名"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={20}
              autoComplete="nickname"
              placeholder="例：ねこぜ"
              required
              helperText="20文字まで。"
              errorText={error ?? undefined}
            />
            <Button
              type="submit"
              size="lg"
              fullWidth
              loading={busy}
              loadingText={busyLabel}
              disabled={!valid.success || signingOut}
            >
              {submitLabel}
            </Button>
          </Stack>
        </form>
        {account ? null : (
          <Button variant="link" disabled={busy} onClick={() => void swapStep("method", true)}>
            ログイン方法を選び直す
          </Button>
        )}
      </EntryCard>
    );
  }

  return (
    <>
      <PageDeco variant="entry" />
      <BackLink href={back.href}>{back.label}</BackLink>
      <EntryPage
        mobile={{
          backHref: back.href,
          backLabel: back.label,
          logoSrc: "/animic-logo.svg",
          characterSrc: "/images/hero-character.webp",
        }}
      >
        {card}
      </EntryPage>
    </>
  );
}
