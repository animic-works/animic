import { surface } from "@animic/styled-system/recipes";
import type { CommonProps } from "./dom";
import { domProps } from "./dom";
export interface SurfaceProps extends CommonProps {
  appearance?: "plain" | "raised" | "framed";
  padding?: "compact" | "normal" | "spacious";
}
export function Surface({ ref, ...props }: SurfaceProps) {
  return (
    <div
      {...domProps(props)}
      ref={ref}
      className={surface({ appearance: props.appearance, padding: props.padding })}
    >
      {props.children}
    </div>
  );
}
