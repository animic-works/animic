import { Button } from "@animic/react/button";
import {
  EntryCard,
  EntryContext,
  EntryDivider,
  EntryPage,
  EntryProviders,
  EntryTerms,
  ProviderButton,
} from "@animic/react/entry";
import { TextField } from "@animic/react/field";
import { Icon } from "@animic/react/icon";
import { Stack } from "@animic/react/layout/stack";
import { BackLink, PageDeco } from "@animic/react/page";
import { toast } from "@animic/react/toast";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import * as v from "valibot";

import { participantNameSchema } from "./room-state";

// Xでのログインは提供しない（X APIが有料のため。#17）
const PROVIDERS = [
  { id: "google", name: "Google" },
  { id: "discord", name: "Discord" },
] as const;

const errorMessage = (error: unknown) =>
  error instanceof Error && error.message
    ? error.message
    : "うまくいきませんでした。もう一度お試しください。";

const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

export type EntryFlowProps = {
  /** ルームを作る（create）か、招待されたルームに参加する（join）か */
  mode: "create" | "join";
  /** 参加するルームのコード（join のとき） */
  code?: string;
  /** 表示名を決めたあとの処理（ルームの作成・参加と画面の移動）。失敗したら理由を投げる */
  onSubmit: (name: string) => Promise<void>;
};

type Step = "method" | "name";

// ルームを作る・参加する画面: ログイン方法を選び、表示名を決める
export function EntryFlow({ mode, code, onSubmit }: EntryFlowProps) {
  const [step, setStep] = useState<Step>("method");
  // 手順の切り替え: 今のカードが左へ抜け、次のカードが右から入る
  const [swap, setSwap] = useState<{ card: Step; phase: "in" | "out"; back: boolean } | null>(null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const valid = v.safeParse(participantNameSchema, name);

  async function swapStep(to: Step, back = false) {
    if (reducedMotion()) {
      setStep(to);
      return;
    }
    setSwap({ card: step, phase: "out", back });
    await new Promise((resolve) => setTimeout(resolve, 280));
    setStep(to);
    setSwap({ card: to, phase: "in", back });
  }

  useEffect(() => {
    if (step === "name" && !busy) input.current?.focus();
  }, [step, busy]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!valid.success || busy) return;
    setBusy(true);
    setError(null);
    try {
      await onSubmit(valid.output);
    } catch (caught) {
      setError(errorMessage(caught));
      setBusy(false);
    }
  }

  const submitLabel = mode === "join" ? "ルームに参加" : "ルームを作る";
  const stepProps = (card: Step) =>
    swap?.card === card
      ? { step: swap.phase, back: swap.back, onStepAnimationEnd: () => setSwap(null) }
      : {};

  return (
    <>
      <PageDeco variant="entry" />
      <BackLink href="/">トップへ戻る</BackLink>
      <EntryPage
        mobile={{
          backHref: "/",
          backLabel: "トップへ戻る",
          logoSrc: "/animic-logo.svg",
          characterSrc: "/hero-character.webp",
        }}
      >
        {step === "method" ? (
          <EntryCard
            logoSrc="/animic-logo.svg"
            title="ログインしてはじめよう"
            titleId="login-title"
            sub="ログインすると戦績や生成履歴が残ります。"
            {...stepProps("method")}
          >
            {mode === "join" && code ? (
              <EntryContext>
                ルーム <code>{code}</code> に参加します
              </EntryContext>
            ) : null}
            <EntryProviders>
              {PROVIDERS.map((provider) => (
                <ProviderButton
                  key={provider.id}
                  provider={provider.id}
                  onClick={() => toast(`${provider.name}でのログインは準備中です`)}
                >
                  {provider.name}でログイン
                </ProviderButton>
              ))}
            </EntryProviders>
            <EntryDivider>または</EntryDivider>
            <Button
              size="lg"
              fullWidth
              trailingIcon={<Icon name="chevronRight" size="2xs" />}
              onClick={() => void swapStep("name")}
            >
              ログインせずに進む
            </Button>
            <EntryTerms>
              続行すると、<a href="/terms">利用規約</a>と<a href="/privacy">プライバシーポリシー</a>
              に同意したものとみなします。
            </EntryTerms>
          </EntryCard>
        ) : (
          <EntryCard
            logoSrc="/animic-logo.svg"
            title="表示名を決めよう"
            titleId="name-title"
            sub="対戦相手に表示される名前です。"
            {...stepProps("name")}
          >
            <form onSubmit={(event) => void handleSubmit(event)} noValidate>
              <Stack gap="5">
                <TextField
                  ref={input}
                  label="表示名"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  maxLength={20}
                  autoComplete="nickname"
                  placeholder="例：ねこぜ"
                  required
                  helperText="20文字まで。あとから変更できます。"
                  errorText={error ?? undefined}
                />
                <Button
                  type="submit"
                  size="lg"
                  fullWidth
                  loading={busy}
                  loadingText={mode === "join" ? "参加しています…" : "ルームを作っています…"}
                  disabled={!valid.success}
                >
                  {submitLabel}
                </Button>
              </Stack>
            </form>
            <Button variant="link" disabled={busy} onClick={() => void swapStep("method", true)}>
              ログイン方法を選び直す
            </Button>
          </EntryCard>
        )}
      </EntryPage>
    </>
  );
}
