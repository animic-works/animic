import type { ReactNode } from "react";
import { Dialog as ArkDialog } from "@ark-ui/react/dialog";
import { Portal } from "@ark-ui/react/portal";
import { cx } from "@animic/styled-system/css";
import { dialog, iconButton } from "@animic/styled-system/recipes";
export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  presentation?: "adaptive" | "centered";
}
export function Dialog(props: DialogProps) {
  const classes = dialog({ presentation: props.presentation });
  return (
    <ArkDialog.Root
      open={props.open}
      onOpenChange={({ open }) => props.onOpenChange(open)}
      lazyMount
      unmountOnExit
      restoreFocus
    >
      <Portal>
        <ArkDialog.Backdrop className={classes.scrim} />
        <ArkDialog.Positioner className={classes.positioner}>
          <ArkDialog.Content className={classes.content}>
            <ArkDialog.Title className={classes.title}>{props.title}</ArkDialog.Title>
            {props.description && (
              <ArkDialog.Description className={classes.description}>
                {props.description}
              </ArkDialog.Description>
            )}
            <div className={classes.body}>{props.children}</div>
            <ArkDialog.CloseTrigger
              type="button"
              className={cx(iconButton({ size: "sm" }), classes.close)}
              aria-label="閉じる"
            >
              ×
            </ArkDialog.CloseTrigger>
          </ArkDialog.Content>
        </ArkDialog.Positioner>
      </Portal>
    </ArkDialog.Root>
  );
}
