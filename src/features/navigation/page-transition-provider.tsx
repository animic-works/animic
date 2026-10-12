import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "@tanstack/react-router";
import { useToast } from "@animic/react/toast";
import { Stack } from "@animic/react/stack";
import { Text } from "@animic/react/text";
import { CodeDisplay } from "@animic/react/code-display";
import { Button } from "@animic/react/button";
import { SkipIcon } from "../shared/icons";
import { PageTransition } from "./visuals/page-transition";
interface RoomTransition {
  kind: "create" | "join";
  /** 参加者の表示名。参加の演出で表示する。 */
  name: string;
  task: () => Promise<string>;
  onEntered?: (code: string) => Promise<void>;
}
const TransitionContext = createContext<{
  navigate: (href: string) => void;
  enterRoom: (options: RoomTransition) => Promise<void>;
  transition: (update: () => void | Promise<void>) => Promise<void>;
  transitioning: boolean;
} | null>(null);
const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
export function PageTransitionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const toast = useToast();
  const [phase, setPhase] = useState<"cover" | "uncover" | null>(null);
  const [creation, setCreation] = useState<{
    code: string;
    settled: number;
    kind: "create" | "join";
    name: string;
  } | null>(null);
  const completeExit = useRef<(() => void) | undefined>(undefined);
  const skipCurrent = useRef<(() => void) | undefined>(undefined);
  const running = useRef(false);
  const version = useRef(0);
  useEffect(
    () => () => {
      version.current++;
      completeExit.current?.();
    },
    [],
  );
  const runTransition = useCallback(
    async (update: (code?: string) => void | Promise<void>, room?: RoomTransition) => {
      if (running.current) return;
      running.current = true;
      const current = ++version.current;
      let roomCode: string | undefined;
      const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
      const skipState = { requested: reduced };
      const start = performance.now();
      const requestSkip = () => {
        skipState.requested = true;
        completeExit.current?.();
      };
      skipCurrent.current = requestSkip;
      const skip = (event: KeyboardEvent) => {
        if (
          event.repeat ||
          performance.now() - start < 400 ||
          ["Tab", "Shift", "Control", "Alt", "Meta", "CapsLock"].includes(event.key)
        )
          return;
        event.preventDefault();
        event.stopImmediatePropagation();
        requestSkip();
      };
      async function sleep(ms: number) {
        const until = performance.now() + ms;
        while (!skipState.requested && performance.now() < until && current === version.current)
          await wait(Math.min(50, until - performance.now()));
      }
      async function run() {
        try {
          setCreation(
            room ? { code: "--------", settled: 0, kind: room.kind, name: room.name } : null,
          );
          if (!reduced) setPhase("cover");
          if (room) roomCode = await room.task();
          if (!reduced) {
            if (roomCode && room) {
              await sleep(900);
              const alphabet = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
              const spinStartedAt = performance.now();
              while (!skipState.requested && current === version.current) {
                const elapsed = performance.now() - spinStartedAt;
                if (elapsed >= 1900) break;
                const settled = Math.min(8, Math.max(0, Math.floor((elapsed - 700) / 150) + 1));
                setCreation({
                  code:
                    roomCode.slice(0, settled) +
                    Array.from(
                      { length: 8 - settled },
                      () => alphabet[Math.floor(Math.random() * alphabet.length)],
                    ).join(""),
                  settled,
                  kind: room.kind,
                  name: room.name,
                });
                await sleep(55 - ((performance.now() - spinStartedAt) % 55));
              }
              setCreation({ code: roomCode, settled: 8, kind: room.kind, name: room.name });
              await sleep(900);
            } else await sleep(1600);
          }
          if (current !== version.current) return;
          await update(roomCode);
          if (current !== version.current) return;
          // 更新後のDOMを描画してから退場を開始する。
          await new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
          );
          await sleep(roomCode ? 450 : 250);
          if (current !== version.current) return;
          if (!skipState.requested) {
            await new Promise<void>((resolve) => {
              const finish = () => {
                clearTimeout(timer);
                completeExit.current = undefined;
                resolve();
              };
              const timer = setTimeout(finish, 1800);
              completeExit.current = finish;
              setPhase("uncover");
            });
          }
        } finally {
          removeEventListener("keydown", skip, true);
          if (current === version.current) {
            setPhase(null);
            setCreation(null);
            skipCurrent.current = undefined;
            running.current = false;
          }
        }
      }
      addEventListener("keydown", skip, true);
      await run();
    },
    [],
  );
  function navigate(href: string) {
    void runTransition(() => router.navigate({ href })).catch(() => {
      toast.show({ title: "画面を開けませんでした", description: "もう一度お試しください。" });
    });
  }
  async function enterRoom(options: RoomTransition) {
    await runTransition(async (code) => {
      if (!code) throw new Error("ルームコードを取得できませんでした。");
      if (options.onEntered) await options.onEntered(code);
      else await router.navigate({ to: "/rooms/$code", params: { code } });
    }, options);
  }
  return (
    <TransitionContext
      value={{ navigate, enterRoom, transition: runTransition, transitioning: phase !== null }}
    >
      <div inert={phase !== null}>{children}</div>
      {phase && (
        <PageTransition
          phase={phase}
          onExitComplete={() => completeExit.current?.()}
          action={
            creation && phase === "cover" ? (
              <Button
                appearance="overlay"
                size="compact"
                shape="pill"
                trailingIcon={<SkipIcon />}
                aria-label="演出をスキップしてロビーへ進む"
                onClick={() => skipCurrent.current?.()}
              >
                スキップ
              </Button>
            ) : undefined
          }
        >
          {creation && (
            <Stack align="center">
              <Text variant="label.announcement" tone="inverse" align="center">
                {creation.kind === "create"
                  ? creation.settled === 8
                    ? "ルームができました！"
                    : "ルームを作っています"
                  : creation.settled === 8
                    ? "ルームに入りました！"
                    : "ルームに参加しています"}
              </Text>
              <CodeDisplay
                value={creation.code}
                presentation="cells"
                settledCount={creation.settled}
              />
              <Text variant="label.supporting" tone="inverse" align="center">
                {creation.kind === "create"
                  ? "このコードを相手に伝えよう"
                  : `${creation.name} さんとして参加`}
              </Text>
            </Stack>
          )}
        </PageTransition>
      )}
    </TransitionContext>
  );
}
export function usePageTransition() {
  const value = useContext(TransitionContext);
  if (!value) throw new Error("PageTransitionProviderが必要です。");
  return value;
}
