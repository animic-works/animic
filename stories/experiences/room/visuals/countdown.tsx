import { css, keyframes } from "@animic/styled-system/css";
import { Text } from "@animic/react/text";

const pop = keyframes({
  from: { transform: "scale(1.6)", opacity: 0 },
  "30%, to": { transform: "scale(1)", opacity: 1 },
});
const number = css({
  animationName: `[${pop}]`,
  animationDuration: "[900ms]",
  animationTimingFunction: "[ease-out]",
  animationFillMode: "both",
  "&[data-start]": { animationName: "[none]" },
  _motionReduce: { animationName: "[none]" },
});
export function Countdown({ value }: { value: number | "START!" }) {
  return (
    <div className={number} key={value} data-start={value === "START!" || undefined}>
      <Text variant={value === "START!" ? "display.announcement" : "numeric.hero"} tone="highlight">
        {value}
      </Text>
    </div>
  );
}
