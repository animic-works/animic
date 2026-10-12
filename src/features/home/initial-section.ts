// URLの初期位置はホームが所有する。外部スクリプトの取得前にも適用する。
export const initialSection = `(() => {
  if (!location.hash) return;
  const page = document;
  const update = () => {
    const header = page.querySelector('[data-animic-navigation]');
    if (!header?.nextElementSibling) return;
    const links = [...page.querySelectorAll('[data-animic-navigation] nav > a, [data-animic-section-links] > a')];
    const target = links.some(link => link.getAttribute('href') === location.hash);
    if (!target) { observer.disconnect(); return; }
    for (const link of links) {
      if (link.getAttribute('href') === location.hash) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    }
    header.setAttribute('data-initial-visible', '');
    const section = document.getElementById(location.hash.slice(1));
    if (!section || !page.contains(section)) return;
    section.scrollIntoView({ behavior: 'instant' });
    if (Math.abs(section.getBoundingClientRect().top) <= 1) observer.disconnect();
  };
  const observer = new MutationObserver(update);
  observer.observe(page, { childList: true, subtree: true });
  addEventListener('load', () => observer.disconnect(), { once: true });
})();`;
