import { describe, expect, it } from "vite-plus/test";
import { scrollAxis, scrollKey } from "../../packages/react/src/scroll-metrics";

describe("scrollbar geometry and keyboard navigation", () => {
  it("keeps both ends reachable with a minimum thumb and clamps elastic overscroll", () => {
    const value = scrollAxis(9900, 100, 10000, 96, 28);
    expect(value.thumb).toBe(28);
    expect(value.offset + value.thumb).toBe(96);
    expect(scrollAxis(-30, 100, 10000, 96, 28).position).toBe(0);
    expect(scrollAxis(11000, 100, 10000, 96, 28).position).toBe(9900);
  });
  it("uses viewport-sized page steps and supports both axes", () => {
    const value = scrollAxis(600, 300, 1800, 296, 28);
    expect(scrollKey("PageDown", false, "vertical", value)).toBe(900);
    expect(scrollKey(" ", true, "vertical", value)).toBe(300);
    expect(scrollKey("Home", false, "vertical", value)).toBe(0);
    expect(scrollKey("End", false, "vertical", value)).toBe(1500);
    expect(scrollKey("ArrowRight", false, "horizontal", value)).toBe(640);
    expect(scrollKey("ArrowDown", false, "horizontal", value)).toBeNull();
  });
});
