import { useEffect, useState, useSyncExternalStore } from "react";
import { connectRoom } from "./room-connection";
import type { RoomSnapshot } from "./room-state";

type ReceivedRoom = { room: RoomSnapshot; at: number | null; connection: string };

function createConnection(initial: RoomSnapshot) {
  const server: ReceivedRoom = { room: initial, at: null, connection: "接続中…" };
  let current = server;
  let disconnect: (() => void) | undefined;
  const listeners = new Set<() => void>();
  function publish(next: ReceivedRoom) {
    current = next;
    for (const listener of listeners) listener();
  }
  function receive(room: RoomSnapshot) {
    if (room.version > current.room.version) publish({ ...current, room, at: performance.now() });
  }
  return {
    getSnapshot: () => current,
    getServerSnapshot: () => server,
    receive,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      if (listeners.size === 1) {
        if (current.at === null) publish({ ...current, at: performance.now() });
        disconnect = connectRoom(current.room, receive, (connection) => {
          if (connection !== current.connection) publish({ ...current, connection });
        });
      }
      return () => {
        listeners.delete(listener);
        if (!listeners.size) disconnect?.();
      };
    },
  };
}

/** 配信の版と受信時刻を同じsnapshotに保持し、古いloader応答で巻き戻さない。 */
export function useRoomConnection(initial: RoomSnapshot) {
  const [connection] = useState(() => createConnection(initial));
  useEffect(() => connection.receive(initial), [connection, initial]);
  return useSyncExternalStore(
    connection.subscribe,
    connection.getSnapshot,
    connection.getServerSnapshot,
  );
}
