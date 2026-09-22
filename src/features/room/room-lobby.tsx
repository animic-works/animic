import { Button } from "@base-ui/react/button";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "@tanstack/react-router";
import { QRCodeSVG } from "qrcode.react";
import * as v from "valibot";

import { leaveRoom, setReady } from "./room.functions";
import { roomSnapshotSchema } from "./room-state";
import type { RoomSnapshot } from "./room-state";
import styles from "./room.module.css";

export function RoomLobby({
  initial,
  participantId,
  inviteUrl,
  renderBattle,
}: {
  initial: RoomSnapshot;
  participantId: string;
  inviteUrl: string;
  renderBattle: (room: RoomSnapshot, connected: boolean) => ReactNode;
}) {
  const router = useRouter();
  const [room, setRoom] = useState(initial);
  const [connection, setConnection] = useState("接続中…");
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let disposed = false;
    let socket: WebSocket;
    let retry: ReturnType<typeof setTimeout> | undefined;
    let heartbeat: ReturnType<typeof setInterval> | undefined;
    let lastMessage = Date.now();
    let failures = 0;
    function connect() {
      if (disposed) return;
      const url = new URL(`/rooms/${initial.code}/connection`, window.location.href);
      url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
      socket = new WebSocket(url);
      socket.addEventListener("open", () => {
        failures = 0;
        lastMessage = Date.now();
        setConnection("接続済み");
        heartbeat = setInterval(() => {
          if (Date.now() - lastMessage > 45_000) socket.close();
          else if (socket.readyState === WebSocket.OPEN) socket.send("ping");
        }, 15_000);
      });
      socket.addEventListener("message", (event: MessageEvent<unknown>) => {
        lastMessage = Date.now();
        if (event.data === "pong") return;
        if (typeof event.data !== "string") return;
        try {
          const parsed = v.safeParse(roomSnapshotSchema, JSON.parse(event.data));
          if (parsed.success)
            setRoom((current) =>
              parsed.output.version > current.version ? parsed.output : current,
            );
        } catch {
          setConnection("受信した情報を確認できませんでした。");
        }
      });
      socket.addEventListener("close", (event) => {
        clearInterval(heartbeat);
        if (disposed) return;
        if ([4401, 4403, 4404].includes(event.code)) {
          setConnection(
            event.code === 4401
              ? "セッションが失効しました。ページを再読み込みしてください。"
              : event.code === 4403
                ? "ルームから退出しました。"
                : "ルームは終了しました。",
          );
          return;
        }
        setConnection("再接続中…");
        retry = setTimeout(connect, Math.min(1000 * 2 ** failures++, 15_000));
      });
    }
    connect();
    return () => {
      disposed = true;
      clearTimeout(retry);
      clearInterval(heartbeat);
      socket?.close();
    };
  }, [initial.code]);

  const me = room.members.find((member) => member.id === participantId);
  async function perform(action: () => Promise<unknown>) {
    setPending(true);
    setNotice("");
    try {
      await action();
    } catch {
      setNotice("操作できませんでした。接続を確認してください。");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className={styles.lobby}>
      <p role="status">{connection}</p>
      <h2>参加者</h2>
      <ul className={styles.members}>
        {room.members.map((member) => (
          <li key={member.id}>
            <span>
              {member.name}
              {member.id === participantId ? "（あなた）" : ""}
            </span>
            <span>
              {member.id === room.hostId ? "ホスト · " : ""}
              {member.connected ? (member.ready ? "準備完了" : "準備中") : "再接続待ち"}
            </span>
          </li>
        ))}
      </ul>
      <div className={styles.actions}>
        <Button
          type="button"
          disabled={
            pending ||
            connection !== "接続済み" ||
            !me ||
            Boolean(room.battle && !room.battle.result)
          }
          onClick={() => perform(() => setReady({ data: { code: room.code, ready: !me?.ready } }))}
        >
          {me?.ready ? "準備完了を取り消す" : "準備完了"}
        </Button>
        <Button
          type="button"
          disabled={pending}
          onClick={() =>
            perform(async () => {
              await leaveRoom({ data: { code: room.code } });
              await router.navigate({ to: "/" });
            })
          }
        >
          退出する
        </Button>
      </div>
      {renderBattle(room, connection === "接続済み")}
      <h2>友だちを招待</h2>
      {inviteUrl && (
        <>
          <a href={inviteUrl}>{inviteUrl}</a>
          <Button
            type="button"
            onClick={() =>
              perform(async () => {
                await navigator.clipboard.writeText(inviteUrl);
                setNotice("招待リンクをコピーしました。");
              })
            }
          >
            招待リンクをコピー
          </Button>
          <QRCodeSVG value={inviteUrl} marginSize={4} size={192} title="ルームへの招待QRコード" />
        </>
      )}
      {notice && <p role="status">{notice}</p>}
    </section>
  );
}
