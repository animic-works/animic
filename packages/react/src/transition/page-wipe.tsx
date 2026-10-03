import { pageWipe, entrance } from "@animic/styled-system/recipes";
import type { EntranceVariantProps } from "@animic/styled-system/recipes";
import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

// 画面遷移の演出: 3色の帯で画面を塗りつぶしてから移動し、次の画面で帯を抜いて中身を登場させる。
// ルーム作成では、コードがスロットのように回って確定する

const CODE_CHARS = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
const CODE_LENGTH = 8;
const MODIFIER_KEYS = ["Shift", "Control", "Alt", "Meta", "CapsLock", "Fn"];

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

// 「飛ばす」の合図。resolve を呼ぶと待ちを打ち切れる
function createSignal() {
  const signal: { promise: Promise<void>; resolve: () => void } = {
    promise: Promise.resolve(),
    resolve: noop,
  };
  signal.promise = new Promise<void>((done) => {
    signal.resolve = done;
  });
  return signal;
}
const noop = () => {};
const reducedMotion = () =>
  typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

// 演出中に何かキーを押したら飛ばす（修飾キーだけは除く）。そのキーは画面側のキー操作には渡さない。
// ボタンを Enter で押して演出を始めた場合に同じキーで飛ばさないよう、開始直後は受け付けない
function onSkipKey(callback: () => void, armDelay = 400) {
  const armedAt = performance.now() + armDelay;
  const handler = (event: KeyboardEvent) => {
    if (event.repeat || MODIFIER_KEYS.includes(event.key) || performance.now() < armedAt) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    callback();
  };
  addEventListener("keydown", handler, true);
  return () => removeEventListener("keydown", handler, true);
}

type RoomContent = { type: "room"; label: string; sub: string };
type WipeState = {
  phase: "in" | "cover" | "out";
  content: { type: "logo" } | RoomContent;
  chars: string[];
  settled: number;
  spinning: boolean;
  skipDisabled: boolean;
};

export type BuildRoomOptions = {
  /** 演出中の説明（例: ルームを作っています） */
  label: string;
  /** コードが決まったあとの説明（例: ルームができました！） */
  done: string;
  /** 補足（例: このコードを相手に伝えよう） */
  sub: string;
  /** ルームコードを決める処理（サーバーへの作成・参加） */
  task: () => Promise<string>;
  /** 決まったコードの画面へ移動する */
  navigate: (code: string) => Promise<void> | void;
};

export type WipeApi = {
  /** 帯で画面を塗りつぶしてから移動する */
  wipeTo: (navigate: () => Promise<void> | void) => Promise<void>;
  /** 帯で塗りつぶし、ルームコードを回して確定させてから移動する。task が失敗したら演出を消して投げ直す */
  buildRoom: (options: BuildRoomOptions) => Promise<void>;
  /** 演出中かどうか（画面側のホイール・キー操作を止めるために使う） */
  active: boolean;
};

const WipeContext = createContext<WipeApi | null>(null);

export function useWipe(): WipeApi {
  const api = useContext(WipeContext);
  if (!api) throw new Error("useWipe は WipeProvider の中で使います。");
  return api;
}

export type WipeProviderProps = { logoSrc: string; children: ReactNode };

export function WipeProvider({ logoSrc, children }: WipeProviderProps) {
  const [state, setState] = useState<WipeState | null>(null);
  const activeRef = useRef(false);
  const finishOut = useRef<(() => void) | null>(null);
  const skipButton = useRef<HTMLButtonElement>(null);

  // 前の画面が帯で塗りつぶして来た場合、帯を抜いて中身を登場させる
  const playOut = useCallback(async () => {
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      stopKey();
      finishOut.current = null;
      setState(null);
      delete document.body.dataset.entering;
    };
    finishOut.current = finish;
    // キーを押したら、帯とカードの登場を待たずにすぐ画面を出す
    const stopKey = onSkipKey(finish, 0);
    // まず塗りつぶした状態で表示し、フォントの読み込みを待つ（途中で文字の大きさが変わらないように）
    await Promise.all([wait(250), Promise.race([document.fonts.ready, wait(1500)])]);
    if (finished) return;
    document.body.dataset.entering = "";
    setState((current) => (current ? { ...current, phase: "out" } : current));
    setTimeout(finish, 2800);
  }, []);

  const wipeTo = useCallback<WipeApi["wipeTo"]>(
    async (navigate) => {
      if (reducedMotion()) {
        await navigate();
        return;
      }
      if (activeRef.current) return;
      activeRef.current = true;
      try {
        setState({
          phase: "in",
          content: { type: "logo" },
          chars: [],
          settled: 0,
          spinning: false,
          skipDisabled: false,
        });
        // 3色の帯が塗り終わり、ロゴが弾んでから移動する。キーを押したら、遷移先の演出も省いてすぐ移動する
        let skipped = false;
        const signal = createSignal();
        const stop = onSkipKey(() => {
          skipped = true;
          signal.resolve();
        });
        await Promise.race([wait(1600), signal.promise]);
        stop();
        if (skipped) {
          setState(null);
          await navigate();
          return;
        }
        setState((current) => (current ? { ...current, phase: "cover" } : current));
        await navigate();
        await playOut();
      } catch (error) {
        setState(null);
        delete document.body.dataset.entering;
        throw error;
      } finally {
        activeRef.current = false;
      }
    },
    [playOut],
  );

  const buildRoom = useCallback<WipeApi["buildRoom"]>(
    async ({ label, done, sub, task, navigate }) => {
      if (reducedMotion()) {
        await navigate(await task());
        return;
      }
      if (activeRef.current) return;
      activeRef.current = true;
      let spin: ReturnType<typeof setInterval> | undefined;
      let stopKey = () => {};
      try {
        const content: RoomContent = { type: "room", label, sub };
        let chars = Array.from({ length: CODE_LENGTH }, () => "-");
        let settled = 0;
        setState({ phase: "in", content, chars, settled, spinning: true, skipDisabled: false });
        // 演出とサーバーの処理を同時に進める
        const result = task();
        result.catch(() => {});

        // スキップ: 待ち時間を途中で打ち切れるようにする
        let skipped = false;
        const signal = createSignal();
        const skip = () => {
          if (skipped) return;
          skipped = true;
          signal.resolve();
        };
        skipButton.current?.addEventListener("click", skip);
        stopKey = onSkipKey(skip);
        const pause = (ms: number) => Promise.race([wait(ms), signal.promise]);
        const update = () =>
          setState((current) => (current ? { ...current, chars: [...chars], settled } : current));

        await pause(900);
        if (!skipped) {
          skipButton.current?.focus({ preventScroll: true });
          spin = setInterval(() => {
            for (let i = settled; i < CODE_LENGTH; i++)
              chars[i] = CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)] ?? "-";
            update();
          }, 55);
          await pause(700);
          const code = await result;
          for (let i = 0; i < CODE_LENGTH; i++) {
            if (skipped) break;
            settled = i + 1;
            chars[i] = code[i] ?? "-";
            update();
            await pause(150);
          }
          clearInterval(spin);
          if (!skipped) {
            setState((current) =>
              current
                ? { ...current, content: { ...content, label: done }, spinning: false }
                : current,
            );
            await pause(900);
          }
        }
        clearInterval(spin);
        stopKey();
        setState((current) => (current ? { ...current, skipDisabled: true } : current));
        const code = await result;
        chars = Array.from(code);
        // 飛ばした場合は、ロビー側でコードを見せ直す演出も省いてすぐ表示する
        if (skipped) {
          setState(null);
          await navigate(code);
          return;
        }
        setState((current) =>
          current ? { ...current, phase: "cover", chars, settled: CODE_LENGTH } : current,
        );
        await navigate(code);
        await playOut();
      } catch (error) {
        setState(null);
        delete document.body.dataset.entering;
        throw error;
      } finally {
        clearInterval(spin);
        stopKey();
        activeRef.current = false;
      }
    },
    [playOut],
  );

  const api = useMemo<WipeApi>(
    () => ({ wipeTo, buildRoom, active: state !== null }),
    [wipeTo, buildRoom, state],
  );

  const classes = pageWipe({
    phase: state?.phase ?? "in",
    content: state?.content.type === "room" ? "room" : "logo",
  });

  return (
    <WipeContext.Provider value={api}>
      {children}
      {state ? (
        <div className={classes.root} data-wipe="">
          {/* 最後に抜ける帯（水色）のアニメーションが終わったら片付ける */}
          <span
            className={classes.band}
            aria-hidden="true"
            onAnimationEnd={state.phase === "out" ? () => finishOut.current?.() : undefined}
          />
          <span className={classes.band} aria-hidden="true" />
          <span className={classes.band} aria-hidden="true" />
          <img className={classes.logo} src={logoSrc} alt="" />
          {state.content.type === "room" ? (
            <>
              <div className={classes.room}>
                <p className={classes.roomLabel} role="status">
                  {state.content.label}
                </p>
                <div className={classes.code} aria-hidden="true">
                  {state.chars.map((char, index) => (
                    <span
                      key={index}
                      className={classes.char}
                      data-spinning={state.spinning && index >= state.settled ? "" : undefined}
                      data-set={index < state.settled ? "" : undefined}
                    >
                      {char}
                    </span>
                  ))}
                </div>
                <p className={classes.roomSub}>{state.content.sub}</p>
              </div>
              <button
                ref={skipButton}
                type="button"
                className={classes.skip}
                aria-label="演出をスキップしてロビーへ進む"
                disabled={state.skipDisabled}
              >
                スキップ
                <kbd className={classes.kbd} aria-hidden="true">
                  どのキーでも
                </kbd>
              </button>
            </>
          ) : null}
        </div>
      ) : null}
    </WipeContext.Provider>
  );
}

export type EntranceProps = EntranceVariantProps & {
  as?: "div" | "section";
  children: ReactNode;
  "aria-labelledby"?: string;
};

// 遷移先で順に出てくる要素（ロビーのパネルなど）
export function Entrance({ as: Element = "div", order, motion, children, ...rest }: EntranceProps) {
  const classes = entrance({ order, motion });
  return (
    <Element {...rest} className={classes.root}>
      {children}
    </Element>
  );
}
