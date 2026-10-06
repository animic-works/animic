import { useState } from "react";
import type { FormEvent } from "react";
import * as v from "valibot";

import { Button } from "../../components/button";
import { EntryCard, EntryContext, EntryPage } from "../../components/entry";
import { TextField } from "../../components/field";
import { Stack } from "../../components/layout";
import { BackLink, PageDeco } from "../../components/page";
import { participantNameSchema } from "./room-state";

const errorMessage = (error: unknown) =>
  error instanceof Error && error.message
    ? error.message
    : "うまくいきませんでした。もう一度お試しください。";

type EntryFlowProps = {
  /** ルームを作る（create）か、招待されたルームに参加する（join）か */
  mode: "create" | "join";
  /** 参加するルームのコード（join のとき） */
  code?: string;
  /** 表示名を決めたあとの処理（ルームの作成・参加と画面の移動）。失敗したら理由を投げる */
  onSubmit: (name: string) => Promise<void>;
  /** 左上の「戻る」とその行き先 */
  back: { href: string; label: string };
};

// 表示名を決めてルームを作る・参加する画面。ログインは使わず、名前の入力だけを見せる
export function EntryFlow({ mode, code, onSubmit, back }: EntryFlowProps) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const valid = v.safeParse(participantNameSchema, name);

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

  const submitLabel = mode === "join" ? "ルームに参加" : "ルームを作る";
  const busyLabel = mode === "join" ? "参加しています…" : "ルームを作っています…";

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
        <EntryCard
          logoSrc="/animic-logo.svg"
          title="表示名を決めよう"
          titleId="entry-name-title"
          sub="対戦相手に表示される名前です。"
        >
          {mode === "join" && code ? (
            <EntryContext>
              ルーム <code>{code}</code> に参加します
            </EntryContext>
          ) : null}
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
                disabled={!valid.success}
              >
                {submitLabel}
              </Button>
            </Stack>
          </form>
        </EntryCard>
      </EntryPage>
    </>
  );
}
