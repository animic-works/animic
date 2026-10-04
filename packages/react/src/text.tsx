import { css, cx } from "@animic/styled-system/css";
import type { CommonProps } from "./dom";
import { domProps } from "./dom";
interface TextContentProps extends Omit<CommonProps, "ref"> {
  variant?: "body.md" | "body.sm" | "body.prose" | "label" | "caption" | "code" | "numeric";
  tone?: "default" | "muted" | "inverse" | "success" | "danger";
}
export type TextProps = TextContentProps &
  (
    | { as?: "span"; ref?: CommonProps<HTMLSpanElement>["ref"] }
    | { as: "p"; ref?: CommonProps<HTMLParagraphElement>["ref"] }
  );
const variants = {
  "body.md": css({ textStyle: "body.md" }),
  "body.sm": css({ textStyle: "body.sm" }),
  "body.prose": css({ textStyle: "body.prose" }),
  label: css({ textStyle: "label" }),
  caption: css({ textStyle: "caption" }),
  code: css({ textStyle: "code" }),
  numeric: css({ textStyle: "numeric" }),
};
const tones = {
  default: css({ color: "fg.default" }),
  muted: css({ color: "fg.muted" }),
  inverse: css({ color: "fg.inverse" }),
  success: css({ color: "status.success.fg" }),
  danger: css({ color: "status.danger.fg" }),
};
export function Text(props: TextProps) {
  const className = cx(
    css({ margin: "0" }),
    variants[props.variant ?? "body.md"],
    tones[props.tone ?? "default"],
  );
  if (props.as === "p") {
    const { ref, ...attributes } = props;
    return (
      <p {...domProps(attributes)} ref={ref} className={className}>
        {props.children}
      </p>
    );
  }
  const { ref, ...attributes } = props;
  return (
    <span {...domProps(attributes)} ref={ref} className={className}>
      {props.children}
    </span>
  );
}
