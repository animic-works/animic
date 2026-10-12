import * as v from "valibot";

import { idleConnectionMs, roomSnapshotSchema } from "./room-state";
import type { RoomSnapshot } from "./room-state";

/** サーバーが再接続できない理由で閉じたときのclose codeと、画面に出す案内。 */
const closedMessages = new Map([
  [4401, "セッションが失効しました。ページを再読み込みしてください。"],
  [4403, "ルームから退出しました。"],
  [4404, "ルームは終了しました。"],
  [
    4410,
    `${idleConnectionMs / 60_000}分間操作がなかったため、接続を切りました。ページを再読み込みすると戻れます。`,
  ],
]);

const invalidMessage = "受信した情報を確認できませんでした。";

/**
 * 配信のメッセージを読む。JSONとして読めないものと、ルームの状態の形に合わないものは`invalid`にする。
 * 生存確認の応答（`pong`）と文字列でないものは読まない（`ignored`）。
 */
export function readRoomMessage(
  data: unknown,
): { kind: "ignored" } | { kind: "invalid" } | { kind: "room"; room: RoomSnapshot } {
  if (data === "pong" || typeof data !== "string") return { kind: "ignored" };
  let json: unknown;
  try {
    json = JSON.parse(data);
  } catch {
    return { kind: "invalid" };
  }
  const parsed = v.safeParse(roomSnapshotSchema, json);
  return parsed.success ? { kind: "room", room: parsed.output } : { kind: "invalid" };
}

export function connectRoom(
  initial: RoomSnapshot,
  onRoom: (room: RoomSnapshot) => void,
  onConnection: (status: string) => void,
) {
  let current = initial;
  let disposed = false;
  let socket: WebSocket;
  let retry: ReturnType<typeof setTimeout> | undefined;
  let heartbeat: ReturnType<typeof setInterval> | undefined;
  let lastMessage = Date.now();
  let failures = 0;
  let invalid = false;
  function connect() {
    if (disposed) return;
    const url = new URL(`/rooms/${initial.code}/connection`, window.location.href);
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    socket = new WebSocket(url);
    socket.addEventListener("open", () => {
      failures = 0;
      invalid = false;
      lastMessage = Date.now();
      onConnection("接続済み");
      heartbeat = setInterval(() => {
        if (Date.now() - lastMessage > 45_000) socket.close();
        else if (socket.readyState === WebSocket.OPEN) socket.send("ping");
      }, 15_000);
    });
    socket.addEventListener("message", (event: MessageEvent<unknown>) => {
      lastMessage = Date.now();
      const message = readRoomMessage(event.data);
      if (message.kind === "ignored") return;
      // 確認できなかったことを毎回伝えられるよう、正しく受信したら接続済みの状態へ戻す。
      if (message.kind === "invalid") {
        invalid = true;
        onConnection(invalidMessage);
        return;
      }
      if (invalid) {
        invalid = false;
        onConnection("接続済み");
      }
      if (message.room.version > current.version) {
        current = message.room;
        onRoom(current);
      }
    });
    socket.addEventListener("close", (event) => {
      clearInterval(heartbeat);
      if (disposed) return;
      const closed = closedMessages.get(event.code);
      if (closed) {
        onConnection(closed);
        return;
      }
      onConnection("再接続中…");
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
}
