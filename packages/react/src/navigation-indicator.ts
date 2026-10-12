/** 配置の変更は即座に反映し、表示中の選択変更だけをアニメーションする。 */
export function observeNavigationIndicator(header: HTMLElement) {
  const links = header.querySelector<HTMLElement>("nav")!;
  const indicator = links.querySelector<HTMLElement>("[data-animic-navigation-indicator]")!;
  let previous: {
    link: Element;
    x: number;
    y: number;
    width: number;
    originX: number;
    originY: number;
  } | null = null;
  let animation: Animation | undefined;

  function update() {
    const link = links.querySelector<HTMLElement>('a[aria-current]:not([aria-current="false"])');
    const box = link?.getBoundingClientRect();
    if (!link || !box?.width || !box.height || getComputedStyle(links).visibility === "hidden") {
      animation?.cancel();
      animation = undefined;
      previous = null;
      header.removeAttribute("data-indicator-ready");
      return;
    }
    const origin = links.getBoundingClientRect();
    const x = box.left - origin.left;
    const y = box.bottom - origin.top - indicator.offsetHeight;
    const width = box.width;
    if (
      previous?.link === link &&
      previous.x === x &&
      previous.y === y &&
      previous.width === width &&
      previous.originX === origin.x &&
      previous.originY === origin.y
    )
      return;

    const current = indicator.getBoundingClientRect();
    const old = previous;
    animation?.cancel();
    animation = undefined;
    const transform = `translate(${x}px, ${y}px)`;
    indicator.style.transform = transform;
    indicator.style.width = `${width}px`;
    header.setAttribute("data-indicator-ready", "");
    previous = { link, x, y, width, originX: origin.x, originY: origin.y };

    if (!old || old.link === link) return;
    const style = getComputedStyle(indicator);
    const timing = style.getPropertyValue("--animic-indicator-duration").trim();
    const duration = parseFloat(timing) * (timing.endsWith("ms") ? 1 : 1000);
    if (!duration) return;
    animation = indicator.animate(
      [
        {
          transform: `translate(${current.left - origin.left - (origin.x - old.originX)}px, ${current.top - origin.top - (origin.y - old.originY)}px)`,
          width: `${current.width}px`,
        },
        { transform, width: `${width}px` },
      ],
      { duration, easing: style.getPropertyValue("--animic-indicator-easing").trim() },
    );
  }
  const selection = new MutationObserver(update);
  selection.observe(links, { subtree: true, attributes: true, attributeFilter: ["aria-current"] });
  return {
    update,
    dispose() {
      selection.disconnect();
      animation?.cancel();
      header.removeAttribute("data-indicator-ready");
    },
  };
}
