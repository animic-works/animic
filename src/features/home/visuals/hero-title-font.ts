// 内容の解析前に監視を開始し、本文の途中でHTMLの解析を止めない。
// 固定文字列だけを埋め込み、書体と対象文字は実際のHeadingから取得する。
export const heroTitleFontScript = `(() => {
  if (!document.fonts || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const page = document.currentScript.parentElement;
  const prepare = () => {
    const group = page.querySelector("[data-hero-title]");
    const heading = group?.querySelector("h2");
    if (!heading || !group.nextElementSibling) return;
    content.disconnect();
    const style = getComputedStyle(heading);
    const font = style.fontStyle + " " + style.fontWeight + " " + style.fontSize + " " + style.fontFamily;
    const text = heading.textContent;
    if (document.fonts.check(font, text)) return;
    group.dataset.fontState = "pending";
    let settled = false;
    const show = () => {
      if (settled) return;
      settled = true;
      clearTimeout(deadline);
      group.dataset.fontState = "ready";
    };
    // 取得に失敗・停滞しても、この見出しを隠したままにしない。
    const deadline = setTimeout(show, 1500);
    document.fonts.load(font, text).then(show, show);
  };
  const content = new MutationObserver(prepare);
  content.observe(page, { childList: true, subtree: true });
  addEventListener("DOMContentLoaded", () => content.disconnect(), { once: true });
})();`;
