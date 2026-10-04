import type { CSSProperties, ReactNode } from "react";
import { createContext, useContext, useState } from "react";
import { createToaster, Toaster, Toast as ArkToast } from "@ark-ui/react/toast";
import { Portal } from "@ark-ui/react/portal";
import { cx } from "@animic/styled-system/css";
import { toast, iconButton } from "@animic/styled-system/recipes";
export interface ToastMessage {
  title: string;
  description?: string;
}
export interface ToastController {
  show: (message: ToastMessage) => string;
  dismiss: (id: string) => void;
}
const ToastContext = createContext<ToastController | null>(null);
// safe-areaの環境変数は物理方向なので、Portalの書字方向から論理方向へ対応付ける。
function toastViewport(node: HTMLDivElement | null) {
  if (!node) return undefined;
  const updateSafeArea = () => {
    const { writingMode, direction } = getComputedStyle(node);
    const rtl = direction === "rtl";
    const vertical = writingMode !== "horizontal-tb";
    const blockStart = vertical ? (writingMode.endsWith("-rl") ? "right" : "left") : "top";
    const inlineEnd = vertical
      ? rtl !== (writingMode === "sideways-lr")
        ? "top"
        : "bottom"
      : rtl
        ? "left"
        : "right";
    node.style.setProperty(
      "--animic-toast-safe-block-start",
      `env(safe-area-inset-${blockStart}, 0px)`,
    );
    node.style.setProperty(
      "--animic-toast-safe-inline-end",
      `env(safe-area-inset-${inlineEnd}, 0px)`,
    );
  };
  updateSafeArea();
  const observer = new MutationObserver(updateSafeArea);
  // Portalの祖先で継承元の指定が変わった場合も、物理方向との対応を更新する。
  for (let parent = node.parentElement; parent; parent = parent.parentElement) {
    observer.observe(parent, { attributes: true, attributeFilter: ["dir", "style", "class"] });
  }
  return () => observer.disconnect();
}
export function ToastProvider({ children }: { children: ReactNode }) {
  const [store] = useState(() =>
    createToaster({
      placement: "top-end",
      max: 3,
      overlap: false,
      offsets: "var(--animic-toast-inset)",
    }),
  );
  const classes = toast();
  const placement: CSSProperties & {
    "--animic-toast-offset": string;
    "--animic-toast-opacity": string;
  } = {
    top: undefined,
    "--animic-toast-offset": "var(--y)",
    "--animic-toast-opacity": "var(--opacity)",
  };
  const controller: ToastController = {
    show: (message) =>
      store.create({ title: message.title, description: message.description, duration: Infinity }),
    dismiss: (id) => store.dismiss(id),
  };
  return (
    <ToastContext.Provider value={controller}>
      {children}
      <Portal>
        <Toaster
          toaster={store}
          ref={toastViewport}
          aria-label="通知"
          // Arkが指定する物理位置・safe-areaの加算式・積層値を外し、Recipeの指定を適用する。
          style={{
            zIndex: undefined,
            top: undefined,
            bottom: undefined,
            insetInlineStart: undefined,
            insetInlineEnd: undefined,
          }}
          className={classes.viewport}
        >
          {(message) => (
            <ArkToast.Root style={placement} className={classes.root}>
              <ArkToast.Title className={classes.title}>{message.title}</ArkToast.Title>
              {message.description && (
                <ArkToast.Description className={classes.description}>
                  {message.description}
                </ArkToast.Description>
              )}
              <ArkToast.CloseTrigger
                type="button"
                className={cx(iconButton({ size: "sm" }), classes.close)}
                aria-label="通知を閉じる"
              >
                ×
              </ArkToast.CloseTrigger>
            </ArkToast.Root>
          )}
        </Toaster>
      </Portal>
    </ToastContext.Provider>
  );
}
export function useToast(): ToastController {
  const value = useContext(ToastContext);
  if (!value) throw new Error("ToastProviderの内側でuseToastを利用してください。");
  return value;
}
