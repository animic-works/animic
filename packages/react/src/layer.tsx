import { layer } from "@animic/styled-system/patterns";
import type { CommonProps } from "./dom";
import { domProps } from "./dom";

export interface LayerProps extends CommonProps {
  layout?: "overlay" | "adaptive";
}
const styles = { overlay: layer({ layout: "overlay" }), adaptive: layer({ layout: "adaptive" }) };
export function Layer({ ref, layout = "overlay", ...props }: LayerProps) {
  return (
    <div {...domProps(props)} ref={ref} className={styles[layout]}>
      {props.children}
    </div>
  );
}

export interface LayerItemProps extends CommonProps {
  placement: "background" | "artwork" | "content";
}
export function LayerItem({ ref, placement, ...props }: LayerItemProps) {
  return (
    <div
      {...domProps(props)}
      ref={ref}
      data-animic-layer={placement}
      aria-hidden={placement === "content" ? props["aria-hidden"] : true}
      inert={placement !== "content" ? true : undefined}
    >
      {props.children}
    </div>
  );
}
