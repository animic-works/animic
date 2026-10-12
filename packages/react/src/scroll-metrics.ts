export interface ScrollAxis {
  position: number;
  maximum: number;
  page: number;
  length: number;
  thumb: number;
  offset: number;
}
export function scrollAxis(
  position: number,
  page: number,
  total: number,
  length: number,
  minimumThumb: number,
): ScrollAxis {
  const maximum = Math.max(0, total - page);
  const thumb =
    maximum > 0 ? Math.min(length, Math.max(minimumThumb, (length * page) / total)) : length;
  // scrollWidthは整数、scrollLeftは小数なので、端の丸め誤差を吸収する。
  const clamped = Math.min(maximum, Math.max(0, position));
  const value = clamped <= 1 ? 0 : clamped >= maximum - 1 ? maximum : clamped;
  return {
    position: value,
    maximum,
    page,
    length,
    thumb,
    offset: maximum ? (value / maximum) * (length - thumb) : 0,
  };
}
export function scrollKey(
  key: string,
  shift: boolean,
  axis: "vertical" | "horizontal",
  value: ScrollAxis,
) {
  switch (key) {
    case "Home":
      return 0;
    case "End":
      return value.maximum;
    case "PageUp":
      return value.position - value.page;
    case "PageDown":
      return value.position + value.page;
    case " ":
      return value.position + (shift ? -1 : 1) * value.page;
    case "ArrowUp":
      return axis === "vertical" ? value.position - 40 : null;
    case "ArrowDown":
      return axis === "vertical" ? value.position + 40 : null;
    case "ArrowLeft":
      return axis === "horizontal" ? value.position - 40 : null;
    case "ArrowRight":
      return axis === "horizontal" ? value.position + 40 : null;
    default:
      return null;
  }
}
