import { CodeDisplay } from "@animic/react/code-display";
import { createPreviewRoom, joinPreviewRoom } from "../room/room-preview-store";
import { useEffect, useRef, useState } from "react";
import { Button } from "@animic/react/button";
import { Center } from "@animic/react/center";
import { Cluster } from "@animic/react/cluster";
import { Field } from "@animic/react/field";
import { FocusLayout, FocusLayoutBrand } from "@animic/react/focus-layout";
import { Heading } from "@animic/react/heading";
import { IconButton } from "@animic/react/icon-button";
import { ArrowIcon } from "../../../src/features/shared/icons";
import { TrophyIcon, ImageIcon, AccountIcon } from "../shared/icons";
import { PageBackButton } from "../../../src/features/shared/page-back-button";
import { Input } from "@animic/react/input";
import { Link } from "@animic/react/link";
import { Notice } from "@animic/react/notice";
import { Page } from "@animic/react/page";
import { ProviderButton } from "@animic/react/provider-button";
import { Separator } from "@animic/react/separator";
import { Stack } from "@animic/react/stack";
import { Surface } from "@animic/react/surface";
import { Text } from "@animic/react/text";
import { useToast } from "@animic/react/toast";
import { ProviderIcon } from "../../../src/features/account/visuals/provider-icon";
import {
  lastName,
  useAccountPreview,
  usePendingResultPreview,
  rememberName,
  saveAccount,
  savePendingResult,
  type AccountPreview,
} from "./account-preview";
import { DecoratedBackdrop } from "../../../src/features/shared/visuals/decorated-backdrop";
import {
  LoginArtwork,
  LoginLogo,
  LoginStep,
} from "../../../src/features/account/visuals/login-artwork";
import { LoginSuccessArtwork } from "./visuals/login-success-artwork";
import { usePageTransition } from "../../../src/features/navigation/page-transition-provider";

export type AccountEntry =
  | { kind: "create" }
  | { kind: "join"; code: string }
  | { kind: "login" | "save"; returnTo: string };

export function LoginPage({ intent }: { intent: AccountEntry }) {
  const account = useAccountPreview();
  const [saved, setSaved] = useState(false);
  return (
    <LoginForm
      key={`${account?.provider ?? "guest"}:${account?.name ?? ""}`}
      intent={intent}
      account={account}
      saved={saved}
      onSaved={() => setSaved(true)}
    />
  );
}

function LoginForm({
  intent,
  account,
  saved,
  onSaved,
}: {
  intent: AccountEntry;
  account: AccountPreview | null;
  saved: boolean;
  onSaved: () => void;
}) {
  const { navigate, enterRoom } = usePageTransition();
  const pendingResult = usePendingResultPreview();
  const back = intent.kind === "login" || intent.kind === "save" ? intent.returnTo : "/";
  const toast = useToast();
  const [step, setStep] = useState<"method" | "name" | "done">(
    saved ? "done" : account && intent.kind !== "save" ? "name" : "method",
  );
  const [provider, setProvider] = useState<AccountPreview["provider"] | null>(
    account?.provider ?? null,
  );
  const [pending, setPending] = useState<AccountPreview["provider"] | null>(null);
  const [name, setName] = useState(account?.name ?? "");
  const input = useRef<HTMLInputElement>(null);
  const [entering, setEntering] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const accountOnly = intent.kind === "login" || intent.kind === "save";
  const joining = intent.kind === "join";
  const backLabel = intent.kind === "save" ? "結果へ戻る" : accountOnly ? "戻る" : "トップへ戻る";
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    if (step === "name") input.current?.focus();
  }, [step]);
  function login(method: AccountPreview["provider"]) {
    setPending(method);
    timer.current = setTimeout(() => {
      const displayName =
        account?.name ?? (lastName() || (method === "Google" ? "ねこぜ" : "ぴくせる侍"));
      setProvider(method);
      setName(displayName);
      setPending(null);
      if (intent.kind === "save") {
        try {
          saveAccount({ name: displayName, provider: method });
          if (!savePendingResult()) {
            toast.show({
              title: "保存する戦績がありません",
              description: "結果画面から、もう一度保存してください。",
            });
            return;
          }
          onSaved();
          setStep("done");
        } catch {
          toast.show({
            title: "戦績を保存できませんでした",
            description: "この端末の保存領域を確認してください。",
          });
        }
      } else setStep("name");
    }, 1100);
  }
  async function submit() {
    if (entering) return;
    const value = name.trim();
    if (!value) return;
    try {
      rememberName(value);
      if (provider) saveAccount({ ...account, name: value, provider });
    } catch {
      toast.show({
        title: "表示名を保存できませんでした",
        description: "この端末の保存領域を確認してください。",
      });
      return;
    }
    if (intent.kind === "login") {
      navigate(back);
      return;
    }
    setEntering(true);
    try {
      await enterRoom({
        kind: intent.kind === "join" ? "join" : "create",
        name: value,
        task: async () => {
          if (intent.kind === "join") {
            const room = joinPreviewRoom(intent.code, value);
            if (!room) throw new Error("ルームに参加できませんでした。");
            return room.code;
          }
          return createPreviewRoom(value).code;
        },
      });
    } catch (cause) {
      toast.show({
        title: "ルームに参加できませんでした",
        description: cause instanceof Error ? cause.message : "もう一度お試しください。",
      });
    } finally {
      setEntering(false);
    }
  }

  const title =
    intent.kind === "login"
      ? "ログイン"
      : intent.kind === "save"
        ? "結果を戦績に残そう"
        : "ログインしてはじめよう";
  const subtitle =
    intent.kind === "login"
      ? "ログインしなくても遊べます。"
      : intent.kind === "save"
        ? "ログインすると、この対戦の結果を保存できます。"
        : "ログインすると戦績や生成履歴が残ります。";
  return (
    <Page decoration={<DecoratedBackdrop />}>
      <FocusLayout
        back={<PageBackButton label={backLabel} onClick={() => navigate(back)} />}
        compactBack={
          <IconButton label={backLabel} shape="circle" onClick={() => navigate(back)}>
            <ArrowIcon direction="left" />
          </IconButton>
        }
        compactTitle={
          <Link href="/" aria-label="ホーム">
            <LoginLogo size="compact" />
          </Link>
        }
        artwork={<LoginArtwork />}
      >
        <LoginStep key={step}>
          <Surface appearance="sheet" padding="fluid">
            <Stack>
              {step !== "done" && (
                <FocusLayoutBrand>
                  <LoginLogo compactHidden />
                </FocusLayoutBrand>
              )}
              {step === "done" && (
                <Center>
                  <LoginSuccessArtwork />
                </Center>
              )}
              <Stack space="compact" align="center">
                <Heading level={1} size="illustrated">
                  {step === "method"
                    ? title
                    : step === "name"
                      ? "表示名を決めよう"
                      : "戦績に保存しました"}
                </Heading>
                <Text as="p" variant="body.sm" tone="supporting" align="center">
                  {step === "method"
                    ? subtitle
                    : step === "name"
                      ? "対戦相手に表示される名前です。"
                      : `${name} さんの戦績に、この対戦の結果を残しました。`}
                </Text>
              </Stack>
              {step === "method" && (
                <>
                  {joining && (
                    <Surface appearance="primary" padding="sm">
                      <Center>
                        <Text variant="body.sm">
                          ルーム{" "}
                          <CodeDisplay
                            value={intent.kind === "join" ? intent.code : ""}
                            presentation="inline"
                          />{" "}
                          に参加します
                        </Text>
                      </Center>
                    </Surface>
                  )}
                  {intent.kind === "save" && pendingResult?.rank != null && (
                    <Surface appearance="primary" padding="sm">
                      <Text as="p" variant="body.sm" align="center">
                        <strong>{pendingResult.rank}位</strong>
                        {pendingResult.total != null &&
                          `・${pendingResult.total.toFixed(1)}pt`}{" "}
                        の結果を保存します
                      </Text>
                    </Surface>
                  )}
                  {accountOnly && (
                    <Stack space="tight">
                      {[
                        {
                          title: "戦績が残る",
                          description: "順位とスコアを、あとから見返せます",
                          icon: <TrophyIcon />,
                        },
                        {
                          title: "提出画像も保存",
                          description: "お気に入りの1枚をなくしません",
                          icon: <ImageIcon />,
                        },
                        {
                          title: "表示名を覚える",
                          description: "次からは名前の入力を省けます",
                          icon: <AccountIcon />,
                        },
                      ].map(({ title: benefitTitle, description, icon }) => (
                        <Notice
                          key={benefitTitle}
                          tone="neutral"
                          density="compact"
                          title={benefitTitle}
                          icon={icon}
                        >
                          {description}
                        </Notice>
                      ))}
                    </Stack>
                  )}
                  <Stack space="compact">
                    {(["Google", "Discord"] as const).map((method) => (
                      <ProviderButton
                        key={method}
                        provider={method === "Google" ? "google" : "discord"}
                        icon={<ProviderIcon provider={method} inverse />}
                        loading={pending === method}
                        disabled={pending !== null}
                        onClick={() => login(method)}
                      >
                        {pending === method ? `${method}に接続中…` : `${method}でログイン`}
                      </ProviderButton>
                    ))}
                  </Stack>
                  {!accountOnly ? (
                    <>
                      <Separator label="または" />
                      <Button
                        appearance="primary"
                        shape="pill"
                        size="lg"
                        prominence="raised"
                        disabled={pending !== null}
                        onClick={() => {
                          setProvider(null);
                          setName(lastName());
                          setStep("name");
                        }}
                      >
                        ログインせずに進む 〉
                      </Button>
                    </>
                  ) : (
                    <Button
                      appearance="quiet"
                      disabled={pending !== null}
                      onClick={() => navigate(back)}
                    >
                      {intent.kind === "save" ? "保存せずに結果へ戻る" : "ログインせずに戻る"}
                    </Button>
                  )}
                  <Separator appearance="dashed" />
                  <Text as="p" variant="caption" tone="supporting" align="center">
                    続行すると、
                    <Link appearance="quiet" href="/terms">
                      利用規約
                    </Link>
                    と
                    <Link appearance="quiet" href="/privacy">
                      プライバシーポリシー
                    </Link>
                    に同意したものとみなします。
                  </Text>
                </>
              )}
              {step === "name" && (
                <>
                  {provider && (
                    <Surface appearance="subtle" padding="sm">
                      <Cluster>
                        <ProviderIcon provider={provider} />
                        <Text variant="body.sm">{provider}でログインしました</Text>
                      </Cluster>
                    </Surface>
                  )}
                  <form
                    id="name-form"
                    onSubmit={(event) => {
                      event.preventDefault();
                      void submit();
                    }}
                  >
                    <Field label="表示名" description="20文字まで。あとから変更できます。">
                      <Input
                        ref={input}
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        maxLength={20}
                        autoComplete="nickname"
                        placeholder="例：ねこぜ"
                        required
                      />
                    </Field>
                  </form>
                  <Button
                    type="submit"
                    form="name-form"
                    appearance="primary"
                    shape="pill"
                    size="lg"
                    prominence="raised"
                    disabled={entering || !name.trim()}
                  >
                    {intent.kind === "login"
                      ? "保存してもどる"
                      : joining
                        ? "ルームに参加"
                        : "ルームを作る"}
                  </Button>
                  <Button appearance="quiet" onClick={() => setStep("method")}>
                    ログイン方法を選び直す
                  </Button>
                </>
              )}
              {step === "done" && (
                <>
                  <Notice
                    tone="neutral"
                    density="compact"
                    title={`${provider}でログインしました`}
                    icon={provider && <ProviderIcon provider={provider} />}
                  >
                    次からは対戦の結果が自動で残ります。
                  </Notice>
                  <Button
                    appearance="primary"
                    shape="pill"
                    size="lg"
                    prominence="raised"
                    onClick={() => navigate(back)}
                  >
                    結果にもどる
                  </Button>
                </>
              )}
            </Stack>
          </Surface>
        </LoginStep>
      </FocusLayout>
    </Page>
  );
}
