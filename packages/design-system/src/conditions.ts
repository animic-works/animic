// Animic独自の条件。_hover・_focusなどPanda標準のものは定義し直さない
export const conditions = {
  // 指で操作する端末（スマホ・タブレット）
  touch: "@media (hover: none) and (pointer: coarse)",
  // マウスで乗せられる端末
  hoverable: "@media (hover: hover) and (pointer: fine)",
  motionSafe: "@media (prefers-reduced-motion: no-preference)",
  motionReduce: "@media (prefers-reduced-motion: reduce)",
  portrait: "@media (orientation: portrait)",
  landscape: "@media (orientation: landscape)",
  // スマホを横にしたときの背の低い画面
  shortLandscape: "@media (orientation: landscape) and (max-height: 500px)",
  // 広い画面で高さが低いとき（ギャラリーとフッターを1画面に収める）
  wideShort: "@media (min-width: 901px) and (max-height: 800px)",
  // トップの表示方法。JavaScriptが動くと html に data-scroll を付ける（src/routes/index.tsx）
  // scrolling: 縦にスクロールして画面ごとに吸い付く / plain: JavaScriptなし（全画面を縦に並べる）
  scrolling: "html[data-scroll] &",
  plain: "html:not([data-scroll]) &",
  // 画面遷移の帯が抜けたあと、中身が順に現れている間（@animic/react の PageWipe が body に付ける）
  entering: "body[data-entering] &",
} satisfies Record<string, string>;
