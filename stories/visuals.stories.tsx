import type { Meta, StoryObj } from "@storybook/react-vite";
import { css, keyframes } from "@animic/styled-system/css";

const meta = { title: "Feature Visual" } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const sparkle = keyframes({
  from: { opacity: 0 },
  to: { opacity: 1 },
});
const artwork = css({
  position: "relative",
  top: "[-5px]",
  width: "[37px]",
  height: "[19px]",
  animationName: `[${sparkle}]`,
  animationDuration: "[800ms]",
  animationTimingFunction: "linear",
  animationIterationCount: "infinite",
  _motionReduce: { animationName: "[none]" },
});

export const LocalMotion: Story = {
  render: () => (
    <div>
      <div aria-hidden="true" data-testid="visual-artwork" className={artwork}>
        <svg viewBox="0 0 37 19">
          <path d="M18 0 22 6 37 9 22 12 18 19 14 12 0 9 14 6Z" />
        </svg>
      </div>
      <div
        aria-hidden="true"
        data-testid="visual-direct"
        className={css({ position: "relative", top: "[-5px]", transform: "rotate(12deg)" })}
      />
    </div>
  ),
};

const responsiveArtwork = css({
  position: "relative",
  top: "[80px]",
  width: "[200px]",
  transform: "rotate(-17deg)",
  _artworkCompact: { top: "[20px]", width: "[110px]", transform: "rotate(-9deg)" },
  _artworkPortrait: { top: "[40px]", width: "[160px]", transform: "rotate(-9deg)" },
});

export const ResponsiveArtwork: Story = {
  render: () => (
    <svg
      data-testid="responsive-artwork"
      aria-hidden="true"
      viewBox="0 0 200 100"
      className={responsiveArtwork}
    >
      <path d="M100 0 120 35 200 50 120 65 100 100 80 65 0 50 80 35Z" />
    </svg>
  ),
};
