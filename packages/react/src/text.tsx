import { text } from "@animic/styled-system/recipes";
import type { CommonProps } from "./dom";
import { domProps } from "./dom";
interface TextContentProps extends Omit<CommonProps, "ref"> {
  align?: "start" | "center" | "end";
  wrap?: "normal" | "balance";
  variant?:
    | "label.name"
    | "numeric.inline"
    | "numeric.remainder"
    | "display.announcement"
    | "display.signal"
    | "display.feedback"
    | "label.announcement"
    | "label.artwork"
    | "label.overline"
    | "label.caption"
    | "inherit"
    | "body.detail"
    | "body.lead"
    | "body.md"
    | "body.sm"
    | "body.prose"
    | "label"
    | "caption"
    | "code.compact"
    | "code"
    | "numeric"
    | "eyebrow"
    | "eyebrow.strong"
    | "label.display"
    | "numeric.score"
    | "numeric.hero"
    | "numeric.counter"
    | "numeric.display"
    | "numeric.ordinal"
    | "numeric.fraction"
    | "numeric.rank"
    | "numeric.supporting"
    | "label.supporting"
    | "label.fluid";
  tone?:
    | "default"
    | "muted"
    | "inverse"
    | "success"
    | "danger"
    | "primary"
    | "secondary"
    | "accent"
    | "highlight"
    | "accent-secondary"
    | "subtle"
    | "supporting";
  emphasis?: "strong" | "highlight" | "offset" | "outline" | "accent-shadow";
}
export type TextProps = TextContentProps &
  (
    | { as?: "span"; ref?: CommonProps<HTMLSpanElement>["ref"] }
    | { as: "p"; ref?: CommonProps<HTMLParagraphElement>["ref"] }
  );
export function Text(props: TextProps) {
  const className = text({
    variant: props.variant ?? "body.md",
    emphasis: props.emphasis,
    align: props.align,
    wrap: props.wrap,
    tone: props.tone ?? (props.variant === "inherit" ? undefined : "default"),
  });
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
