import { createClientOnlyFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { ProviderButton } from "@animic/react/provider-button";
import { Stack } from "@animic/react/stack";
import { signInWith } from "../../lib/auth.client";
import {
  loginProviderNames,
  loginProviderSchema,
  type LoginProvider,
} from "../../lib/login-providers";
import { ProviderIcon } from "../account/visuals/provider-icon";

const signInOnClient = createClientOnlyFn(signInWith);

export function useLogin(returnTo: string) {
  const [connecting, setConnecting] = useState<LoginProvider | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);
  useEffect(() => {
    const restore = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      inFlight.current = false;
      setConnecting(null);
    };
    addEventListener("pageshow", restore);
    return () => removeEventListener("pageshow", restore);
  }, []);
  async function login(provider: LoginProvider) {
    if (inFlight.current) return;
    inFlight.current = true;
    setConnecting(provider);
    try {
      await signInOnClient(provider, { callbackURL: returnTo, errorCallbackURL: returnTo });
    } catch (cause) {
      inFlight.current = false;
      setConnecting(null);
      setError(
        cause instanceof Error
          ? cause.message
          : "ログインできませんでした。もう一度お試しください。",
      );
    }
  }
  return { connecting, error, login };
}

export function LoginButtons({
  connecting,
  onLogin,
}: {
  connecting: LoginProvider | null;
  onLogin: (provider: LoginProvider) => void;
}) {
  return (
    <Stack space="compact">
      {loginProviderSchema.options.map((provider) => (
        <ProviderButton
          key={provider}
          provider={provider}
          icon={
            <ProviderIcon
              provider={provider === "google" ? "Google" : "Discord"}
              inverse={provider === "discord"}
            />
          }
          loading={connecting === provider}
          aria-busy={connecting !== null}
          onClick={() => onLogin(provider)}
        >
          {loginProviderNames[provider]}
          {connecting === provider ? "に接続中…" : "でログイン"}
        </ProviderButton>
      ))}
    </Stack>
  );
}
