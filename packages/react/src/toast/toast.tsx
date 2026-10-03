import { Toast, Toaster as ArkToaster, createToaster } from "@ark-ui/react/toast";
import { toast as toastRecipe } from "@animic/styled-system/recipes";

// 画面の下の中央に短く出す通知
const toaster = createToaster({ placement: "bottom", overlap: true, gap: 8, max: 1 });

/** 通知を出す。同じ場所に1つだけ出し、2.2秒で消える */
export function toast(message: string) {
  toaster.create({ title: message, type: "info", duration: 2200 });
}

// 通知の置き場。アプリのルートに1つだけ置く
export function Toaster() {
  const classes = toastRecipe();
  return (
    <ArkToaster toaster={toaster}>
      {(item) => (
        <Toast.Root key={item.id} className={classes.root}>
          <Toast.Title className={classes.title}>{item.title}</Toast.Title>
        </Toast.Root>
      )}
    </ArkToaster>
  );
}
