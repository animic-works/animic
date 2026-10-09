/** HTML解析中とReact起動後で同じ計測を使う。インライン配信するため外部の値を参照しない。 */
export function observeNavigationLayout(page: HTMLElement, onLayout?: () => void) {
  if (!page) return () => {};
  const handoff = "animic:navigation-layout-handoff";
  page.dispatchEvent(new Event(handoff));
  let header: HTMLElement | null = null;
  let disposed = false;
  const observed = new Set<Element>();
  const mutations = {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: ["class", "dir", "data-initial-visible"],
  };

  function update() {
    if (disposed) return;
    const next = page.querySelector<HTMLElement>("[data-animic-navigation]");
    if (next !== header) {
      header = next;
      mutation.disconnect();
      mutation.observe(header ?? page, mutations);
    }
    const content = header?.querySelector<HTMLElement>("[data-animic-navigation-content]");
    const links = content?.querySelector<HTMLElement>("nav");
    const primary = content?.querySelector<HTMLElement>("[data-animic-navigation-primary]");
    if (!header || !content || !links) return;

    header.removeAttribute("data-navigation-overflow");
    // 文字や操作を複製せず、同じ要素で優先順に収まりを調べる。
    const choices = [
      ["inline", "full"],
      ["inline", "short"],
      ["stacked", "full"],
      ["stacked", "short"],
    ];
    let fits = false;
    for (const [layout, labels] of choices) {
      header.setAttribute("data-navigation-layout", layout);
      header.setAttribute("data-navigation-labels", labels);
      const visibleLinks = [...links.querySelectorAll("a")].filter(
        (link) => link.getClientRects().length,
      );
      const linksWidth =
        visibleLinks.reduce((sum, link) => sum + link.getBoundingClientRect().width, 0) +
        Math.max(0, visibleLinks.length - 1) * parseFloat(getComputedStyle(links).columnGap);
      const primaryWidth = primary?.getBoundingClientRect().width ?? 0;
      const gap = linksWidth && primaryWidth ? parseFloat(getComputedStyle(content).columnGap) : 0;
      const required =
        layout === "inline" ? linksWidth + gap + primaryWidth : Math.max(linksWidth, primaryWidth);
      if (required <= content.getBoundingClientRect().width + 0.5) {
        fits = true;
        break;
      }
    }
    // 文字拡大などで最後の候補にも収まらない場合は、各グループ内の折り返しを許す。
    header.toggleAttribute("data-navigation-overflow", !fits);
    const height = `${header.getBoundingClientRect().height}px`;
    if (page.style.getPropertyValue("--animic-navigation-height") !== height)
      page.style.setProperty("--animic-navigation-height", height);
    const nodes = new Set<Element>([
      header,
      links,
      ...links.querySelectorAll("a"),
      ...header.querySelectorAll(":scope > div"),
    ]);
    if (primary) {
      nodes.add(primary);
      for (const child of primary.children) nodes.add(child);
    }
    for (const node of observed)
      if (!nodes.has(node)) {
        resize.unobserve(node);
        observed.delete(node);
      }
    for (const node of nodes)
      if (!observed.has(node)) {
        resize.observe(node);
        observed.add(node);
      }
    onLayout?.();
  }
  const resize = new ResizeObserver(update);
  const mutation = new MutationObserver(update);
  mutation.observe(page, mutations);
  addEventListener("resize", update);
  document.fonts.addEventListener("loadingdone", update);
  void document.fonts.ready.then(update);
  page.addEventListener(handoff, dispose, { once: true });
  update();
  function dispose() {
    disposed = true;
    resize.disconnect();
    mutation.disconnect();
    removeEventListener("resize", update);
    document.fonts.removeEventListener("loadingdone", update);
    page.removeEventListener(handoff, dispose);
  }
  return dispose;
}

export const initialNavigationLayout = `(() => {
  const observe = ${observeNavigationLayout.toString()};
  const start = () => {
    const page = document.querySelector('[data-animic-page]');
    if (!page?.querySelector('[data-animic-navigation]')) return;
    pending.disconnect();
    observe(page);
  };
  const pending = new MutationObserver(start);
  pending.observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('DOMContentLoaded', () => pending.disconnect(), { once: true });
  start();
})();`;
