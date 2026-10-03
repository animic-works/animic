import { definePreset } from "@pandacss/dev";

import { conditions } from "./conditions";
import { globalCss } from "./global";
import { center } from "./patterns/center";
import { cluster } from "./patterns/cluster";
import { container } from "./patterns/container";
import { grid } from "./patterns/grid";
import { stack } from "./patterns/stack";
import { artImage } from "./recipes/art";
import { badge } from "./recipes/badge";
import { button } from "./recipes/button";
import { icon, iconButton } from "./recipes/icon";
import { logo } from "./recipes/logo";
import { spinner } from "./recipes/spinner";
import { surface } from "./recipes/surface";
import { text } from "./recipes/text";
import { avatar } from "./recipes/slots/avatar";
import {
  actionRow,
  artFrame,
  battleLayout,
  hud,
  panelHead,
  promptComposer,
  screenOverlay,
  shotGrid,
  versusList,
} from "./recipes/slots/battle";
import { codeDisplay, codeInput } from "./recipes/slots/code";
import { dialog } from "./recipes/slots/dialog";
import { entryCard, providerButton } from "./recipes/slots/entry";
import { field } from "./recipes/slots/field";
import {
  appBar,
  cornerLogo,
  gallery,
  hero,
  landingNav,
  landingScreen,
  pager,
  scoreCards,
  sectionHead,
  siteFooter,
  stepCarousel,
} from "./recipes/slots/landing";
import {
  countdownOverlay,
  goPanel,
  inviteCard,
  levelArt,
  lobbyLayout,
  playerBoard,
  readyStatus,
  rulesList,
  segmentedControl,
  topBar,
  waitingList,
} from "./recipes/slots/lobby";
import { backLink, docPage, mobileBar, pageDeco } from "./recipes/slots/page";
import { resultBoard } from "./recipes/slots/result";
import { select } from "./recipes/slots/select";
import { toast } from "./recipes/slots/toast";
import { entrance, pageWipe } from "./recipes/slots/transition";
import { animationStyles } from "./styles/animation";
import { keyframes } from "./styles/keyframes";
import { layerStyles } from "./styles/layer";
import { textStyles } from "./styles/text";
import { colors } from "./tokens/primitive/colors";
import {
  borderWidths,
  breakpoints,
  durations,
  easings,
  shadows,
  zIndex,
} from "./tokens/primitive/effects";
import { radii } from "./tokens/primitive/radii";
import { sizes, spacing } from "./tokens/primitive/spacing";
import {
  fontSizes,
  fontWeights,
  fonts,
  letterSpacings,
  lineHeights,
} from "./tokens/primitive/typography";
import { colors as semanticColors } from "./tokens/semantic/colors";
import { radii as semanticRadii, shadows as semanticShadows } from "./tokens/semantic/effects";

// デザインシステムとPandaの境界。トークン・スタイル・レシピ・パターン・条件・土台をまとめて公開する
export const animicPreset = definePreset({
  name: "@animic/design-system",
  conditions: { extend: conditions },
  globalCss,
  theme: {
    breakpoints,
    tokens: {
      colors,
      spacing,
      sizes,
      radii,
      fonts,
      fontSizes,
      fontWeights,
      lineHeights,
      letterSpacings,
      shadows,
      borderWidths,
      durations,
      easings,
      zIndex,
    },
    semanticTokens: { colors: semanticColors, shadows: semanticShadows, radii: semanticRadii },
    textStyles,
    layerStyles,
    animationStyles,
    keyframes,
    recipes: {
      button,
      surface,
      badge,
      spinner,
      text,
      logo,
      icon,
      iconButton,
      artImage,
      cornerLogo,
      readyStatus,
      pageDeco,
      backLink,
      actionRow,
    },
    slotRecipes: {
      dialog,
      field,
      select,
      avatar,
      landingNav,
      appBar,
      pager,
      landingScreen,
      hero,
      sectionHead,
      stepCarousel,
      scoreCards,
      gallery,
      siteFooter,
      codeInput,
      codeDisplay,
      entryCard,
      providerButton,
      topBar,
      playerBoard,
      lobbyLayout,
      waitingList,
      rulesList,
      segmentedControl,
      levelArt,
      goPanel,
      inviteCard,
      countdownOverlay,
      hud,
      battleLayout,
      panelHead,
      artFrame,
      versusList,
      promptComposer,
      shotGrid,
      screenOverlay,
      resultBoard,
      docPage,
      mobileBar,
      pageWipe,
      entrance,
      toast,
    },
  },
  patterns: { extend: { stack, cluster, grid, container, center } },
});
