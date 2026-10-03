import { Dialog as ArkDialog } from "@ark-ui/react/dialog";
import { Portal } from "@ark-ui/react/portal";
import { dialog } from "@animic/styled-system/recipes";
import type { DialogVariantProps } from "@animic/styled-system/recipes";
import type { ReactElement, ReactNode } from "react";

export type DialogProps = DialogVariantProps & {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 見出し。読み上げではダイアログの名前になる */
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  /** 下のボタンの並び。左に「やめる」（DialogClose）、右に主な操作を置く */
  footer?: ReactNode;
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
  size,
  density,
  sheet,
  role = "dialog",
  initialFocusEl,
  descriptionPlacement = "top",
}: DialogProps) {
  const classes = dialog({ size, density, sheet });
  const descriptionNode = description ? (
    <ArkDialog.Description className={classes.description}>{description}</ArkDialog.Description>
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
        <ArkDialog.Backdrop className={classes.backdrop} />
        <ArkDialog.Positioner className={classes.positioner}>
          <ArkDialog.Content className={classes.content}>
            <ArkDialog.Title className={classes.title}>{title}</ArkDialog.Title>
            {descriptionPlacement === "top" ? descriptionNode : null}
            {children ? <div className={classes.body}>{children}</div> : null}
            {descriptionPlacement === "bottom" ? descriptionNode : null}
            {footer ? <div className={classes.footer}>{footer}</div> : null}
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
