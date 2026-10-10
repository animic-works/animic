import { useScrollViewport } from "./use-scroll-viewport";
import type { ReactNode } from "react";
import { Dialog as ArkDialog } from "@ark-ui/react/dialog";
import { Portal } from "@ark-ui/react/portal";
import { cx } from "@animic/styled-system/css";
import { dialog, iconButton } from "@animic/styled-system/recipes";
interface DialogContentProps {
  headerMedia?: ReactNode;
  headerActions?: ReactNode;
  footer?: ReactNode;
  closeButton?: boolean;
  dismissible?: boolean;
  appearance?: "surface" | "immersive" | "transparent";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  titleAlign?: "start" | "center";
  titleVisibility?: "visible" | "hidden";
}
export type DialogProps = DialogContentProps &
  (
    | { presentation: "fullscreen"; size?: never }
    | { presentation?: "adaptive" | "centered"; size?: "standard" | "compact" | "expanded" }
  );
export function Dialog(props: DialogProps) {
  const { ref: scrollingRef, scrollbars: scrollingBars } = useScrollViewport<HTMLDivElement>(
    props.title,
  );
  const classes = dialog({
    headerMedia: Boolean(props.headerMedia),
    appearance: props.appearance,
    presentation: props.presentation,
    size: props.size,
    titleAlign: props.titleAlign,
    titleVisibility: props.titleVisibility,
    closeButton: props.closeButton ?? true,
  });
  return (
    <ArkDialog.Root
      closeOnEscape={props.dismissible !== false}
      closeOnInteractOutside={props.dismissible !== false}
      open={props.open}
      onOpenChange={({ open }) => props.onOpenChange(open)}
      lazyMount
      unmountOnExit
      restoreFocus
    >
      <Portal>
        <ArkDialog.Backdrop className={classes.scrim} />
        <ArkDialog.Positioner className={classes.positioner}>
          <ArkDialog.Content
            className={classes.content}
            data-animic-scroll-viewport=""
            ref={scrollingRef}
            data-animic-dialog=""
          >
            {props.headerMedia && <div className={classes.headerMedia}>{props.headerMedia}</div>}
            {props.titleVisibility === "hidden" && (
              <ArkDialog.Title className={classes.title}>{props.title}</ArkDialog.Title>
            )}
            {(props.titleVisibility !== "hidden" || props.headerActions) && (
              <div className={classes.header}>
                {props.titleVisibility !== "hidden" && (
                  <ArkDialog.Title className={classes.title}>{props.title}</ArkDialog.Title>
                )}
                {props.headerActions && (
                  <div className={classes.headerActions}>{props.headerActions}</div>
                )}
              </div>
            )}
            {props.description && (
              <ArkDialog.Description className={classes.description}>
                {props.description}
              </ArkDialog.Description>
            )}
            <div className={classes.body}>{props.children}</div>
            {props.footer && <div className={classes.footer}>{props.footer}</div>}
            {props.closeButton !== false && (
              <ArkDialog.CloseTrigger
                type="button"
                className={cx(iconButton({ size: "sm", shape: "circle" }), classes.close)}
                aria-label="閉じる"
              >
                ×
              </ArkDialog.CloseTrigger>
            )}
            {scrollingBars}
          </ArkDialog.Content>
        </ArkDialog.Positioner>
      </Portal>
    </ArkDialog.Root>
  );
}
