import * as v from "valibot";

import { roomSnapshotSchema } from "./room-state";
import type { RoomSnapshot } from "./room-state";

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
  function connect() {
    if (disposed) return;
    const url = new URL(`/rooms/${initial.code}/connection`, window.location.href);
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    socket = new WebSocket(url);
    socket.addEventListener("open", () => {
      failures = 0;
      lastMessage = Date.now();
      onConnection("接続済み");
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
        if (parsed.success && parsed.output.version > current.version) {
          current = parsed.output;
          onRoom(current);
        }
      } catch {
        onConnection("受信した情報を確認できませんでした。");
      }
    });
    socket.addEventListener("close", (event) => {
      clearInterval(heartbeat);
      if (disposed) return;
      if ([4401, 4403, 4404].includes(event.code)) {
        onConnection(
          event.code === 4401
            ? "セッションが失効しました。ページを再読み込みしてください。"
            : event.code === 4403
              ? "ルームから退出しました。"
              : "ルームは終了しました。",
        );
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
