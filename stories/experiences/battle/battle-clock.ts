export const selectionDuration = 15_000;

export function battleClock(elapsed: number, generationDuration: number, selectionEndsAt: number) {
  const selecting = elapsed >= generationDuration;
  const duration = selecting ? selectionDuration : generationDuration;
  const remaining = Math.min(
    duration,
    Math.max(0, (selecting ? selectionEndsAt : generationDuration) - elapsed),
  );
  return {
    stage: selecting ? ("selection" as const) : ("generation" as const),
    remaining: Math.ceil(remaining / 1000),
    progress: (remaining / duration) * 100,
  };
}

export type BattleClock = ReturnType<typeof battleClock>;
