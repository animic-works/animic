import { dataTable } from "./recipes/slots/data-table";
import { statusLabel } from "./recipes/status-label";
import { scrollbar } from "./recipes/slots/scrollbar";
import { layoutHeader } from "./recipes/slots/layout-header";
import { qrCode } from "./recipes/slots/qr-code";
import { footer } from "./recipes/footer";
import { text } from "./recipes/text";
import { collectionBrowser } from "./recipes/slots/collection-browser";
import { composer } from "./recipes/slots/composer";
import { readout } from "./recipes/slots/readout";
import { outputPanel } from "./recipes/slots/output-panel";
import { notice } from "./recipes/slots/notice";
import { comparisonStage } from "./recipes/slots/comparison-stage";
import { recordList } from "./recipes/slots/record-list";
import { statGroup } from "./recipes/slots/stat-group";
import { podium } from "./recipes/slots/podium";
import { choiceCard } from "./recipes/slots/choice-card";
import { thumbnailList } from "./recipes/slots/thumbnail-list";
import { avatarGroup } from "./recipes/slots/avatar-group";
import { workspace } from "./recipes/slots/workspace";
import { comparison } from "./recipes/slots/comparison";
import { switchRecipe } from "./recipes/slots/switch";
import { tokenInput } from "./recipes/slots/token-input";
import { article } from "./recipes/slots/article";
import { documentLayout } from "./recipes/slots/document-layout";
import { appFrame } from "./recipes/slots/app-frame";
import { progressList } from "./recipes/slots/progress-list";
import { actionBar } from "./recipes/slots/action-bar";
import { media } from "./recipes/slots/media";
import { tileCollection } from "./recipes/slots/tile-collection";
import { codeDisplay } from "./recipes/slots/code-display";
import { overlay } from "./patterns/overlay";
import { focusLayout } from "./recipes/slots/focus-layout";
import { providerButton } from "./recipes/provider-button";
import { lead } from "./recipes/lead";
import { mediaObject } from "./patterns/media-object";
import { split } from "./patterns/split";
import { actionGroup } from "./patterns/action-group";
import { imagePair } from "./patterns/image-pair";
import { page } from "./patterns/page";
import { section } from "./patterns/section";
import { layer } from "./patterns/layer";
import { meter } from "./recipes/slots/meter";
import { popover } from "./recipes/slots/popover";
import { codeInput } from "./recipes/slots/code-input";
import { carousel } from "./recipes/slots/carousel";
import { sectionNavigation } from "./recipes/slots/section-navigation";
import { navigationBar } from "./recipes/slots/navigation-bar";
import { grid } from "./patterns/grid";
import { center } from "./patterns/center";
import { container } from "./patterns/container";
import { cluster } from "./patterns/cluster";
import { stack } from "./patterns/stack";
import { toast } from "./recipes/slots/toast";
import { progress } from "./recipes/slots/progress";
import { avatar } from "./recipes/slots/avatar";
import { segmentedControl } from "./recipes/slots/segmented-control";
import { dialog } from "./recipes/slots/dialog";
import { field } from "./recipes/slots/field";
import { spinner } from "./recipes/spinner";
import { separator } from "./recipes/separator";
import { link } from "./recipes/link";
import { input } from "./recipes/input";
import { badge } from "./recipes/badge";
import { surface } from "./recipes/surface";
import { iconButton } from "./recipes/icon-button";
import { heading } from "./recipes/heading";
import { button } from "./recipes/button";
import { keyframes } from "./styles/keyframes";
import { animationStyles } from "./styles/animation";
import { layerStyles } from "./styles/layer";
import { textStyles } from "./styles/text";
import { definePreset } from "@pandacss/dev";
import base from "@pandacss/preset-base";
import { conditions } from "./conditions";
import { globalCss } from "./global";
import { zIndex } from "./tokens/semantic/z-index";

import { borderWidths } from "./tokens/primitive/border";
import { colors } from "./tokens/primitive/color";
import { durations, easings } from "./tokens/primitive/motion";
import { radii } from "./tokens/primitive/radius";
import { shadows as semanticShadows } from "./tokens/semantic/shadow";
import { shadows } from "./tokens/primitive/shadow";
import { sizes } from "./tokens/primitive/size";
import { spacing } from "./tokens/primitive/spacing";
import { fonts, fontSizes, fontWeights, lineHeights } from "./tokens/primitive/typography";
import { colors as semanticColors } from "./tokens/semantic/color";

export const animicPreset = definePreset({
  name: "@animic/design-system",
  conditions,
  globalCss,
  patterns: {
    overlay,
    stack,
    cluster,
    container,
    center,
    grid,
    split,
    mediaObject,
    actionGroup,
    imagePair,
    page,
    section,
    layer,
  },
  utilities: base.utilities,
  theme: {
    colorPalette: { enabled: false },
    textStyles,
    layerStyles,
    animationStyles,
    keyframes,
    recipes: {
      statusLabel,
      text,
      footer,
      lead,
      heading,
      button,
      providerButton,
      iconButton,
      surface,
      badge,
      input,
      link,
      separator,
      spinner,
    },
    slotRecipes: {
      dataTable,
      outputPanel,
      scrollbar,
      layoutHeader,
      qrCode,
      progressList,
      actionBar,
      collectionBrowser,
      composer,
      readout,
      notice,
      comparisonStage,
      recordList,
      statGroup,
      podium,
      choiceCard,
      thumbnailList,
      avatarGroup,
      workspace,
      comparison,
      switchRecipe,
      tokenInput,
      article,
      documentLayout,
      appFrame,
      media,
      tileCollection,
      codeDisplay,
      focusLayout,
      field,
      dialog,
      segmentedControl,
      avatar,
      progress,
      toast,
      meter,
      popover,
      codeInput,
      carousel,
      navigationBar,
      sectionNavigation,
    },
    tokens: {
      colors,
      spacing,
      radii,
      fonts,
      fontSizes,
      fontWeights,
      lineHeights,
      durations,
      easings,
      shadows,
      borderWidths,
      sizes,
    },
    semanticTokens: { colors: semanticColors, shadows: semanticShadows, zIndex },
  },
});
