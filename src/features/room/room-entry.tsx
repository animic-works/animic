import { Button } from "@base-ui/react/button";
import { Input } from "@base-ui/react/input";
import { useRef, useState } from "react";
import { createClientOnlyFn } from "@tanstack/react-start";
import { useRouter } from "@tanstack/react-router";

import { ensureParticipant } from "../../lib/auth.client";
import { createRoom, joinRoom } from "./room.functions";
import styles from "./room.module.css";

const prepareParticipant = createClientOnlyFn(() => ensureParticipant());

export function RoomEntry({ code }: { code?: string }) {
  const router = useRouter();
  const creation = useRef<{ requestId: string; name: string } | null>(null);
  const [name, setName] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  return (
    <form
      className={styles.form}
      onSubmit={async (event) => {
        event.preventDefault();
        if (pending) return;
        setPending(true);
        setError("");
        try {
          await prepareParticipant();
          const requestedName = name.trim();
          let destination = code;
          if (destination) {
            await joinRoom({ data: { code: destination, name: requestedName } });
          } else {
            const request =
              creation.current?.name === requestedName
                ? creation.current
                : { requestId: crypto.randomUUID(), name: requestedName };
            creation.current = request;
            destination = await createRoom({ data: request });
          }
          await router.invalidate();
          await router.navigate({ to: "/rooms/$code", params: { code: destination } });
        } catch {
          setError("ルームに参加できませんでした。接続を確認して、もう一度お試しください。");
        } finally {
          setPending(false);
        }
      }}
    >
      <label htmlFor="participant-name">表示名</label>
      <Input
        id="participant-name"
        value={name}
        onValueChange={setName}
        required
        maxLength={20}
        autoComplete="nickname"
      />
      <Button type="submit" disabled={pending || !name.trim()}>
        {pending ? "接続中…" : code ? "ルームに参加" : "ルームを作る"}
      </Button>
      {error && <p role="alert">{error}</p>}
    </form>
  );
}
