import base from "@pandacss/preset-base";
// 利用先ごとの成立条件。同じ値でも他のComponentへ自動適用しない。
const twoColumnsMin = "30em";
const wideLayoutMin = "54em";
// Workspaceの編集欄を下端に固定する画面。スマホの縦長（幅560px以下で高さ480pxを超える）と、
// 縦長のタブレット（iPadの縦向きなど、幅860px以下で幅が高さの4/5以下）。
// `workspaceFlow`はその補集合、`DockedShort`はそのうち高さ720px以下の画面。
const dockedPhone = "(max-width: 35em) and (height > 30em)";
const dockedTablet = "(max-width: 53.75em) and (height > 30em) and (aspect-ratio <= 4/5)";
const workspaceDocked = `@media ${dockedPhone}, ${dockedTablet}`;
const workspaceDockedShort = `@media ${dockedPhone} and (height <= 45em), ${dockedTablet} and (height <= 45em)`;
// アートワークの配置を切り替える条件。Visualの検査もこの一覧を参照する。
export const artworkConditions = {
  artworkNarrow: "@media (max-width: 900px)",
  artworkMedium: "@media (max-width: 1100px)",
  artworkVertical: "@media (orientation: portrait)",
  artworkCompact: "@media (max-width: 560px)",
  artworkPortrait: "@media (min-width: 561px) and (max-width: 1100px) and (orientation: portrait)",
};
export const conditions = {
  segmentedControlCompact: "@media (max-width: 35em)",
  segmentedControlWide: "@media (width > 35em)",
  segmentedControlInline: "@container animic-segmented-control (min-width: 22em)",
  buttonCompact: "@media (max-width: 35em)",
  progressListCompact: "@media (max-width: 35em)",
  footerCompact: "@media (max-width: 35em)",
  footerShort: "@media (min-width: 901px) and (max-height: 800px)",
  collectionCompact: "@media (max-width: 53.75em), (max-aspect-ratio: 1/1)",
  dialogExpandedCompact: "@media (max-width: 53.75em), (max-aspect-ratio: 1/1)",
  avatarGroupNarrow: "@media (max-width: 35em)",
  composerCompact: "@media (max-width: 35em)",
  // Workspaceの下端に固定した編集欄の中（Workspaceの`workspaceDocked`と同じ条件）。
  composerDocked: workspaceDocked,
  composerDockedShort: workspaceDockedShort,
  // プロンプト欄の幅が狭いとき（幅1150px前後の画面の左の列）。部品を一回り小さくする。
  composerNarrow: "@container animic-composer (max-width: 16.875rem)",
  readoutCompact: "@media (max-width: 35em)",
  readoutNarrow: "@media (max-width: 53.75em)",
  avatarGroupCompact: "@container animic-avatar-group (max-width: 24em)",
  thumbnailCompact: "@media (max-width: 75em)",
  thumbnailLabelCompact: "@media (max-width: 35em)",
  mediaCompact: "@media (max-width: 35em)",
  recordCompact: "@media (max-width: 35em)",
  statGroupNarrow: "@media (max-width: 53.75em)",
  statGroupCompact: "@media (max-width: 35em)",
  podiumCompact: "@media (max-width: 35em)",
  comparisonStageCompact: "@container animic-comparison-stage (max-width: 53.75em)",
  noticeCompact: "@container animic-notice (max-width: 35em)",
  // 縦長の画面では、編集欄を下端に固定して1画面に収める。
  workspaceDocked,
  workspaceFlow:
    "@media (height <= 30em), (width > 53.75em), (width > 35em) and (aspect-ratio > 4/5)",
  // 下端の編集欄のうち、高さ720px以下の画面。比較画像と余白を詰めて編集欄の高さを残す。
  workspaceDockedShort,
  // 下端の編集欄のうち、スマホとそれより広い縦長のタブレット（互いに重ならない）。
  // タブレットの比較欄は見出しと枠を持つため、畳んだときの寸法を別に取る。
  workspaceDockedPhone: `@media ${dockedPhone}`,
  workspaceDockedTablet: `@media (width > 35em) and ${dockedTablet}`,
  workspaceCompact: "@container animic-workspace (max-width: 53.75em)",
  workspaceNarrow: "@container animic-workspace (max-width: 35em)",
  workspaceVertical: "@container animic-workspace (width < 40em)",
  workspaceTall: "@media (height > 40em)",
  workspaceShort: "@media (max-height: 40em)",
  workspaceLandscape: "@media (min-width: 40em) and (max-height: 40em)",
  workspaceHorizontal: "@container animic-workspace (min-width: 40em)",
  comparisonWide: "@media (min-width: 75em)",
  comparisonNarrow: "@media (max-width: 53.75em)",
  comparisonCompact: "@media (max-width: 35em)",
  comparisonShort: "@media (max-width: 35em) and (height <= 45em)",
  tokenInputCompact: "@media (max-width: 51.25em)",
  articleCompact: "@media (max-width: 35em)",
  documentCompact: "@media (max-width: 35em)",
  appFrameCompact: "@media (max-width: 35em)",
  // 本文72remと、その左右にロゴ・外側余白を置く9remずつが収まる幅。
  appFrameBrandBeside: "@media (min-width: 90em)",
  actionBarDocked: "@media (max-width: 51.25em)",
  actionBarCompact: "@media (max-width: 35em)",
  tileCollectionCompact: "@media (max-width: 35em)",
  codeDisplayCompact: "@media (max-width: 35em)",
  splitBalancedColumns: "@container animic-split (min-width: 52em)",
  mediaObjectActionsWide: "@container animic-media-object (min-width: 30em)",
  splitBalanced: "@container animic-split (min-width: 49.25em)",
  focusLayoutCompact: "@media (max-width: 35em)",
  layoutHeaderCompact: "@media (max-width: 35em)",
  ...base.conditions,
  focusVisible:
    "&:is(:focus-visible, [data-focus-visible]):not(:where([data-animic-input=pointer] *))",
  focusWithinVisible: "&:has(input:focus-visible):not(:where([data-animic-input=pointer] *))",
  ...artworkConditions,
  invalid: "&:is([aria-invalid=true], [data-invalid])",
  gridTwo: `@container animic-grid (min-width: ${twoColumnsMin})`,
  gridFull: `@container animic-grid (min-width: ${wideLayoutMin})`,
  splitEqual: `@container animic-split (min-width: ${twoColumnsMin})`,
  splitMedia: "@container animic-split (min-width: 32em)",
  splitIllustrated: "@media (min-width: 901px)",
  numericCompact: "@media (max-width: 900px)",
  splitIntrinsic: "@container animic-split (width > 49.5em)",
  splitShort: "@media (min-width: 901px) and (max-height: 800px)",
  imagePairCompact: "@media (max-width: 35em)",
  surfaceNarrow: "@media (max-width: 35em)",
  surfaceExpanded: "@media (width > 35em)",
  sectionDense: "@media (min-width: 561px) and (max-width: 900px)",
  sectionShort: "@media (min-width: 901px) and (max-height: 800px)",
  splitAsymmetric: `@container animic-split (min-width: ${wideLayoutMin})`,
  dialogCentered: `@container animic-dialog (min-width: ${twoColumnsMin})`,
  dialogCompactCentered: "@container animic-dialog (min-width: 35.001em)",
  imagePairWide: `@container animic-image-pair (min-width: ${twoColumnsMin})`,
  sectionNavigationCompact: "@media (max-width: 900px)",
  clusterCompact: "@media (max-width: 35em)",
  sectionPortrait: "@media (min-width: 561px) and (max-width: 1100px) and (orientation: portrait)",
  stackCompact: "@media (max-width: 900px)",
  actionPortrait: "@media (min-width: 561px) and (max-width: 1100px) and (orientation: portrait)",
  mediaObjectInline: "@container animic-media-object (min-width: 22em)",
  surfaceCompact: "@media (max-width: 900px)",
  carouselWide: "@media (min-width: 901px)",
  carouselNarrow: "@media (max-width: 560px)",
  carouselCompact: "@media (max-width: 900px)",
  sectionWide: "@media (min-width: 901px)",
  sectionCompact: "@media (max-width: 35em)",
  headingCompact: "@media (max-width: 35em)",
  headingPortrait: "@media (min-width: 561px) and (max-width: 1100px) and (orientation: portrait)",
  navigationDense: "@media (min-width: 561px) and (max-width: 900px)",
  navigationWide: "@media (min-width: 901px)",
  navigationConstrained: "@media (min-width: 901px) and (max-width: 1200px)",
  navigationCompact: "@media (max-width: 35em)",
  // 幅400px未満。メニューの操作を1行に収めるため、ロゴ・ボタン・アカウントの表示を小さくする。
  navigationNarrow: "@media (max-width: 24.99em)",
  actionNarrow: "@media (max-width: 400px)",
  actionCompact: "@media (max-width: 35em)",
  layerStack: "@media (max-width: 560px), (max-width: 1100px) and (orientation: portrait)",
  layerPortrait: "@media (min-width: 561px) and (max-width: 1100px) and (orientation: portrait)",
};
