import { useEffect, useState } from "react";

export function BattleTimer({
  serverTime,
  deadline,
  label,
}: {
  serverTime: number;
  deadline: number;
  label: string;
}) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const started = performance.now();
    const timer = setInterval(() => setElapsed(performance.now() - started), 250);
    return () => clearInterval(timer);
  }, []);
  const seconds = Math.max(0, Math.ceil((deadline - serverTime - elapsed) / 1000));
  return (
    <p role="timer" aria-label={label}>
      {label}: {Math.floor(seconds / 60)}分{String(seconds % 60).padStart(2, "0")}秒
    </p>
  );
}
