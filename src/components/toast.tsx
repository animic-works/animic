import { Toast, Toaster as ArkToaster, createToaster } from "@ark-ui/react/toast";

import toastStyles from "./toast.module.css";

// 画面の下の中央に短く出す通知。
// 表示する数の上限（max）で1つに絞ると、新しい通知は表示中の通知の後ろに並び、
// 表示中の通知にポインターが乗っている間（Ark UIはタイマーを止める）いつまでも出ない。
// そのため上限は既定のままにし、toast() が前の通知を閉じてから次を出す
const toaster = createToaster({ placement: "bottom", overlap: true, gap: 8 });

/**
 * 通知を出す。前の通知は閉じて新しい通知に置き換え（閉じる動きの間だけ後ろに重なる）、2.2秒で消える。
 * ポインターが前の通知に乗っていても、新しい通知はすぐに出る
 */
export function toast(message: string) {
  toaster.dismiss();
  toaster.create({ title: message, type: "info", duration: 2200 });
}

// 通知の置き場。アプリのルートに1つだけ置く。
// 置き場（aria-live="polite"の領域）は常にあり、加わった通知（role="status"）を読み上げる
export function Toaster() {
  return (
    <ArkToaster toaster={toaster}>
      {(item) => (
        <Toast.Root key={item.id} className={toastStyles.root}>
          <Toast.Title className={toastStyles.title}>{item.title}</Toast.Title>
        </Toast.Root>
      )}
    </ArkToaster>
  );
}
