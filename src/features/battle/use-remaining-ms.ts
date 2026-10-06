import { useEffect, useState } from "react";

/**
 * 状態を配信した時点のサーバー時刻と締切から、残り時間（ミリ秒）を返す。
 * 受信後の経過は端末の時計ではなく`performance.now()`で数える。
 */
export function useRemainingMs(serverTime: number, deadline: number | null) {
  const [clock, setClock] = useState({ serverTime, elapsed: 0 });
  // 新しい状態を受け取ったら、描画の前に経過時間を0に戻す。
  if (clock.serverTime !== serverTime) setClock({ serverTime, elapsed: 0 });
  useEffect(() => {
    const receivedAt = performance.now();
    const timer = setInterval(
      () => setClock({ serverTime, elapsed: performance.now() - receivedAt }),
      200,
    );
    return () => clearInterval(timer);
  }, [serverTime]);
  const elapsed = clock.serverTime === serverTime ? clock.elapsed : 0;
  return deadline === null ? null : Math.max(0, deadline - serverTime - elapsed);
}
