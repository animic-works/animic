import { useScrollViewport } from "./use-scroll-viewport";
import { useId, type ReactNode } from "react";
import { Popover as ArkPopover } from "@ark-ui/react/popover";
import { Portal } from "@ark-ui/react/portal";
import { popover } from "@animic/styled-system/recipes";

export interface PopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  label: string;
  title: string;
  titleVisibility?: "visible" | "hidden";
  trigger: ReactNode;
  children: ReactNode;
}

export function Popover(props: PopoverProps) {
  const { ref: scrollingRef, scrollbars: scrollingBars } = useScrollViewport<HTMLDivElement>(
    props.title,
  );
  const titleId = useId();
  const classes = popover({ titleVisibility: props.titleVisibility });
  return (
    <ArkPopover.Root
      open={props.open}
      onOpenChange={({ open }) => props.onOpenChange(open)}
      modal={false}
      lazyMount
      unmountOnExit
      positioning={{ placement: "bottom-end", gutter: 8, overflowPadding: 16 }}
    >
      <ArkPopover.Trigger type="button" className={classes.trigger} aria-label={props.label}>
        {props.trigger}
      </ArkPopover.Trigger>
      <Portal>
        <ArkPopover.Positioner className={classes.positioner} style={{ zIndex: undefined }}>
          <ArkPopover.Content
            className={classes.content}
            data-animic-scroll-viewport=""
            ref={scrollingRef}
            aria-labelledby={titleId}
          >
            <ArkPopover.Title id={titleId} className={classes.title}>
              {props.title}
            </ArkPopover.Title>
            <div className={classes.body}>{props.children}</div>
            {scrollingBars}
          </ArkPopover.Content>
        </ArkPopover.Positioner>
      </Portal>
    </ArkPopover.Root>
  );
}
