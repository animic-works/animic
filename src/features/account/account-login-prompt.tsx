import { useEffect, useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { Heading } from "@animic/react/heading";
import { Stack } from "@animic/react/stack";
import { Surface } from "@animic/react/surface";
import { Text } from "@animic/react/text";
import { loginErrorMessage } from "../room/entry-login";
import { LoginButtons, useLogin } from "../room/login-buttons";
import { LoginError } from "../room/login-error";
import { LoginTerms } from "../room/login-terms";

/** ログインしていない人への案内。ログインの後は`returnTo`へ戻る。 */
export function AccountLoginPrompt({
  returnTo,
  loginError,
}: {
  returnTo: string;
  loginError?: string;
}) {
  const router = useRouter();
  const [alert] = useState(() => (loginError ? loginErrorMessage(loginError) : null));
  const { connecting, error, login } = useLogin(returnTo);
  useEffect(() => {
    if (!loginError) return;
    void router.navigate({ to: ".", search: {}, replace: true });
  }, [loginError, router]);
  const message = error ?? alert;
  return (
    <Surface appearance="card" padding="section">
      <Stack align="center" space="section">
        <Stack align="center" space="compact">
          <Heading level={2} size="lg">
            ログインして戦績を残そう
          </Heading>
          <Text as="p" align="center" tone="muted">
            ログインすると、順位やスコア、提出した画像をあとから見返せます。
          </Text>
        </Stack>
        {message && <LoginError message={message} />}
        <LoginButtons connecting={connecting} onLogin={(provider) => void login(provider)} />
        <Text as="p" variant="body.sm" tone="muted" align="center">
          ログインしなくても遊べます。ログインせずに参加した対戦は、戦績に残りません。
        </Text>
        <LoginTerms />
      </Stack>
    </Surface>
  );
}
