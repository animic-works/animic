import { createClientOnlyFn } from "@tanstack/react-start";
import { useState } from "react";

import { EntryProviders, ProviderButton } from "../../components/entry";
import { signInWith } from "../../lib/auth.client";
import { loginProviderNames, loginProviderSchema } from "../../lib/login-providers";
import type { LoginProvider } from "../../lib/login-providers";

// ログインはブラウザ専用のため、サーバーのバンドルから外す。
const signInOnClient = createClientOnlyFn(signInWith);

/**
 * サービスの認証画面へ移動する処理と、移動中のサービス・開始に失敗した理由。
 *
 * 認証の後と、認証に失敗したときは`returnTo`（ルート相対のパス）へ戻る。
 */
export function useLogin(returnTo: string) {
  const [connecting, setConnecting] = useState<LoginProvider | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function login(provider: LoginProvider) {
    setConnecting(provider);
    setError(null);
    try {
      // 成功するとサービスの認証画面へ移動するため、接続中の表示のまま待つ。
      await signInOnClient(provider, { callbackURL: returnTo, errorCallbackURL: returnTo });
    } catch (caught) {
      setConnecting(null);
      setError(
        caught instanceof Error && caught.message
          ? caught.message
          : "うまくいきませんでした。もう一度お試しください。",
      );
    }
  }

  return { connecting, error, login };
}

// ログインに使うサービスのボタン。押したボタンは接続中を表示し、ほかのボタンは押せなくする
export function LoginButtons({
  connecting,
  onLogin,
}: {
  connecting: LoginProvider | null;
  onLogin: (provider: LoginProvider) => void;
}) {
  return (
    <EntryProviders>
      {loginProviderSchema.options.map((provider) => (
        <ProviderButton
          key={provider}
          provider={provider}
          loading={connecting === provider}
          loadingText={`${loginProviderNames[provider]}に接続中…`}
          disabled={connecting !== null && connecting !== provider}
          onClick={() => onLogin(provider)}
        >
          {loginProviderNames[provider]}でログイン
        </ProviderButton>
      ))}
    </EntryProviders>
  );
}
