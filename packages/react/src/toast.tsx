import type { ReactNode } from "react";
import { createContext, useContext, useState } from "react";
import { createToaster, Toaster, Toast as ArkToast } from "@ark-ui/react/toast";
import { Portal } from "@ark-ui/react/portal";
import { toast } from "@animic/styled-system/recipes";
export interface ToastMessage {
  title: string;
  /** 理由や次の操作。あるときは読む時間を取るため長く表示する。 */
  description?: string;
}
export interface ToastController {
  show: (message: ToastMessage) => string;
  dismiss: (id: string) => void;
}
const ToastContext = createContext<ToastController | null>(null);
const duration = { title: 2200, description: 4400 };
// safe-areaの環境変数は物理方向なので、Portalの書字方向から下端（block-end）の方向を対応付ける。
function toastViewport(node: HTMLDivElement | null) {
  if (!node) return undefined;
  const updateSafeArea = () => {
    const { writingMode } = getComputedStyle(node);
    const blockEnd =
      writingMode === "horizontal-tb" ? "bottom" : writingMode.endsWith("-rl") ? "left" : "right";
    node.style.setProperty(
      "--animic-toast-safe-block-end",
      `env(safe-area-inset-${blockEnd}, 0px)`,
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
  // 表示数の上限で1件に絞ると、表示中の通知にポインターが乗っている間（Arkはタイマーを止める）
  // 次の通知が出ない。上限は既定のままにし、表示のたびに前の通知を閉じて置き換える。
  const [store] = useState(() => createToaster({ placement: "bottom", overlap: true, gap: 8 }));
  const classes = toast();
  const controller: ToastController = {
    show: (message) => {
      store.dismiss();
      return store.create({
        title: message.title,
        description: message.description,
        type: "info",
        duration: message.description ? duration.description : duration.title,
      });
    },
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
            <ArkToast.Root className={classes.root}>
              <ArkToast.Title className={classes.title}>{message.title}</ArkToast.Title>
              {message.description && (
                <ArkToast.Description className={classes.description}>
                  {message.description}
                </ArkToast.Description>
              )}
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
