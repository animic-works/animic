import { useEffect, useRef, useState } from "react";
import { createClientOnlyFn } from "@tanstack/react-start";
import { useRouter } from "@tanstack/react-router";
import { Button } from "@animic/react/button";
import { Field } from "@animic/react/field";
import { FocusLayout, FocusLayoutBrand } from "@animic/react/focus-layout";
import { IconButton } from "@animic/react/icon-button";
import { Link } from "@animic/react/link";
import { Heading } from "@animic/react/heading";
import { Input } from "@animic/react/input";
import { Page } from "@animic/react/page";
import { Separator } from "@animic/react/separator";
import { Stack } from "@animic/react/stack";
import { Surface } from "@animic/react/surface";
import { Text } from "@animic/react/text";
import { useToast } from "@animic/react/toast";
import { CodeDisplay } from "@animic/react/code-display";
import { LoginArtwork, LoginLogo, LoginStep } from "../account/visuals/login-artwork";
import { ArrowIcon } from "../shared/icons";
import { DecoratedBackdrop } from "../shared/visuals/decorated-backdrop";
import { PageBackButton } from "../shared/page-back-button";
import { usePageTransition } from "../navigation/page-transition-provider";
import { ensureParticipant, signOut } from "../../lib/auth.client";
import type { LoginProvider } from "../../lib/login-providers";
import { initialDisplayName, loginErrorMessage } from "./entry-login";
import { LoginAccount } from "./login-account";
import { LoginButtons, useLogin } from "./login-buttons";
import { LoginError } from "./login-error";
import { LoginTerms } from "./login-terms";
import { createRoom, joinRoom } from "./room.functions";

const ensureOnClient = createClientOnlyFn(ensureParticipant);
const signOutOnClient = createClientOnlyFn(signOut);

export function RoomEntry({
  code,
  account,
  loginError,
}: {
  code?: string;
  account: { name: string; provider: LoginProvider | null } | null;
  loginError?: string;
}) {
  const { navigate, enterRoom } = usePageTransition();
  const router = useRouter();
  const toast = useToast();
  const request = useRef<{ name: string; id: string } | null>(null);
  const [guest, setGuest] = useState(false);
  const [animateStep, setAnimateStep] = useState(false);
  const [name, setName] = useState(() => (account ? initialDisplayName(account.name) : ""));
  const [pending, setPending] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState<string>();
  const [alert, setAlert] = useState(() => (loginError ? loginErrorMessage(loginError) : null));
  const {
    connecting,
    error: loginStartError,
    login,
  } = useLogin(code ? `/rooms/${code}` : "/start");
  const authenticationError = alert ?? loginStartError;
  const enteringName = Boolean(account) || Boolean(code && guest);
  useEffect(() => {
    if (!loginError) return;
    void router.navigate({
      to: ".",
      search: {},
      replace: true,
    });
  }, [loginError, router]);

  async function submit() {
    const displayName = name.trim();
    if (pending || signingOut || !displayName || (!code && !account)) return;
    setPending(true);
    setError(undefined);
    try {
      if (request.current?.name !== displayName)
        request.current = { name: displayName, id: crypto.randomUUID() };
      const id = request.current.id;
      await enterRoom({
        kind: code ? "join" : "create",
        name: displayName,
        task: async () => {
          if (code) {
            await ensureOnClient();
            await joinRoom({ data: { code, name: displayName } });
            return code;
          }
          return createRoom({ data: { name: displayName, requestId: id } });
        },
        onEntered: code
          ? async () => {
              await router.invalidate();
            }
          : undefined,
      });
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "ルームに参加できませんでした。もう一度お試しください。",
      );
    } finally {
      setPending(false);
    }
  }

  async function logout() {
    if (signingOut || pending) return;
    setSigningOut(true);
    setAlert(null);
    try {
      await signOutOnClient();
      toast.show({ title: "ログアウトしました" });
      await router.invalidate();
    } catch (cause) {
      setAlert(
        cause instanceof Error
          ? cause.message
          : "ログアウトできませんでした。ログインしたままです。",
      );
    } finally {
      setSigningOut(false);
    }
  }

  function changeStep(anonymous: boolean) {
    setGuest(anonymous);
    setAnimateStep(true);
    setAlert(null);
    setError(undefined);
  }

  return (
    <Page decoration={<DecoratedBackdrop />}>
      <FocusLayout
        back={<PageBackButton label="トップへ戻る" onClick={() => navigate("/")} />}
        artwork={<LoginArtwork />}
        compactBack={
          <IconButton label="トップへ戻る" shape="circle" onClick={() => navigate("/")}>
            <ArrowIcon direction="left" />
          </IconButton>
        }
        compactTitle={
          <Link href="/" aria-label="ホーム">
            <LoginLogo size="compact" />
          </Link>
        }
      >
        <Surface appearance="sheet" padding="fluid">
          <LoginStep key={enteringName ? "name" : "method"} active={animateStep}>
            <Stack>
              <FocusLayoutBrand>
                <LoginLogo compactHidden />
              </FocusLayoutBrand>
              <Stack space="compact" align="center">
                <Heading level={1} size="illustrated">
                  {enteringName ? "表示名を決めよう" : "ログインしてはじめよう"}
                </Heading>
                <Text as="p" variant="body.sm" tone="supporting" align="center">
                  {enteringName
                    ? "対戦相手に表示される名前です。"
                    : code
                      ? "別の端末でも同じ参加者として遊べます。"
                      : "ルームを作るには、ログインが必要です。"}
                </Text>
                {code && (
                  <Text variant="body.sm" align="center">
                    ルーム <CodeDisplay value={code} presentation="inline" /> に参加します
                  </Text>
                )}
              </Stack>
              {enteringName ? (
                <>
                  {account && (
                    <LoginAccount
                      provider={account.provider}
                      name={account.name}
                      action={
                        <Button
                          appearance="quiet"
                          size="sm"
                          loading={signingOut || pending}
                          onClick={() => void logout()}
                        >
                          ログアウト
                        </Button>
                      }
                    />
                  )}
                  {alert && <LoginError message={alert} />}
                  <form
                    onSubmit={(event) => {
                      event.preventDefault();
                      void submit();
                    }}
                  >
                    <Stack>
                      <Field label="表示名" description="20文字まで入力できます。" error={error}>
                        <Input
                          value={name}
                          onChange={(event) => setName(event.target.value)}
                          maxLength={20}
                          autoComplete="nickname"
                          placeholder="例：ねこぜ"
                          required
                          disabled={pending || signingOut}
                        />
                      </Field>
                      <Button
                        type="submit"
                        shape="pill"
                        size="lg"
                        prominence="raised"
                        loading={pending || signingOut}
                        disabled={!name.trim()}
                      >
                        {pending
                          ? code
                            ? "参加しています…"
                            : "ルームを作っています…"
                          : code
                            ? "ルームに参加"
                            : "ルームを作る"}
                      </Button>
                    </Stack>
                  </form>
                  {!account && (
                    <Button appearance="quiet" loading={pending} onClick={() => changeStep(false)}>
                      ログイン方法を選び直す
                    </Button>
                  )}
                </>
              ) : (
                <>
                  {authenticationError && <LoginError message={authenticationError} />}
                  <LoginButtons
                    connecting={connecting}
                    onLogin={(provider) => {
                      setAlert(null);
                      void login(provider);
                    }}
                  />
                  {code && (
                    <>
                      <Separator label="または" />
                      <Button
                        shape="pill"
                        size="lg"
                        trailingIcon={<ArrowIcon />}
                        loading={connecting !== null}
                        onClick={() => changeStep(true)}
                      >
                        ログインせずに進む
                      </Button>
                    </>
                  )}
                  <LoginTerms />
                </>
              )}
            </Stack>
          </LoginStep>
        </Surface>
      </FocusLayout>
    </Page>
  );
}
