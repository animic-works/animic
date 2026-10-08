import type { ReactNode } from "react";
import { Badge } from "./badge";
import { imagePair } from "@animic/styled-system/patterns";
import type { CommonProps } from "./dom";
import { domProps } from "./dom";

export interface ImagePairProps extends CommonProps {
  summary?: ReactNode;
  sizing?: "fill" | "intrinsic";
}
const styles = {
  fill: imagePair({ sizing: "fill" }),
  intrinsic: imagePair({ sizing: "intrinsic" }),
};
export function ImagePair({ ref, sizing = "fill", ...props }: ImagePairProps) {
  return (
    <div {...domProps(props)} ref={ref} className={styles[sizing]}>
      <div data-animic-image-pair-layout>{props.children}</div>
      {props.summary && <div data-animic-image-pair-summary>{props.summary}</div>}
    </div>
  );
}

export function ImagePairItem({
  label,
  children,
  labelPlacement = "overlay",
}: {
  label: ReactNode;
  children: ReactNode;
  labelPlacement?: "overlay" | "above";
}) {
  return (
    <figure>
      {children}
      <figcaption data-placement={labelPlacement}>
        {labelPlacement === "overlay" ? <Badge tone="surface">{label}</Badge> : label}
      </figcaption>
    </figure>
  );
}
