import { Dialog as ArkDialog } from "@ark-ui/react/dialog";
import { Portal } from "@ark-ui/react/portal";
import type { ReactElement, ReactNode } from "react";

import { variant } from "./cx";
import dialogStyles from "./dialog.module.css";

export type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 見出し。読み上げではダイアログの名前になる */
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  /** 下のボタンの並び。左に「やめる」（DialogClose）、右に主な操作を置く */
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
  /** スマホで画面下からのシートにするか（退出の確認など、中央のままは false） */
  sheet?: boolean;
  /** トップの「ルームに参加」など、詰めた余白と小さめの見出しにする */
  density?: "card" | "compact";
  /** 取り消せない操作の確認ではalertdialogにする */
  role?: "dialog" | "alertdialog";
  /** 開いたときに最初にフォーカスする要素。なければ最初の操作できる要素 */
  initialFocusEl?: () => HTMLElement | null;
  /** 説明の置き場。見出しの下（top）か、中身の下（bottom。提出の確認など） */
  descriptionPlacement?: "top" | "bottom";
};

// 画面の手前に開く窓。フォーカスの閉じ込め・Escで閉じる・背景のスクロール止めはArk UIのDialogが行う
export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = "md",
  density = "card",
  sheet = false,
  role = "dialog",
  initialFocusEl,
  descriptionPlacement = "top",
}: DialogProps) {
  const cls = (part: string) => variant(dialogStyles, part, { size, density, sheet });
  const descriptionNode = description ? (
    <ArkDialog.Description className={cls("description")}>{description}</ArkDialog.Description>
  ) : null;
  return (
    <ArkDialog.Root
      open={open}
      onOpenChange={(details) => onOpenChange(details.open)}
      role={role}
      initialFocusEl={initialFocusEl}
      lazyMount
      unmountOnExit
    >
      <Portal>
        <ArkDialog.Backdrop className={cls("backdrop")} />
        <ArkDialog.Positioner className={cls("positioner")}>
          <ArkDialog.Content className={cls("content")}>
            <ArkDialog.Title className={cls("title")}>{title}</ArkDialog.Title>
            {descriptionPlacement === "top" ? descriptionNode : null}
            {children ? <div className={cls("body")}>{children}</div> : null}
            {descriptionPlacement === "bottom" ? descriptionNode : null}
            {footer ? <div className={cls("footer")}>{footer}</div> : null}
          </ArkDialog.Content>
        </ArkDialog.Positioner>
      </Portal>
    </ArkDialog.Root>
  );
}

// ダイアログを閉じるボタン。中身にはButtonを渡す（例: <DialogClose><Button variant="secondary">やめる</Button></DialogClose>）
export function DialogClose({ children }: { children: ReactElement }) {
  return <ArkDialog.CloseTrigger asChild>{children}</ArkDialog.CloseTrigger>;
}
