import { split } from "./patterns/split";
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
import { shadows } from "./tokens/primitive/shadow";
import { sizes } from "./tokens/primitive/size";
import { spacing } from "./tokens/primitive/spacing";
import { fonts, fontSizes, fontWeights, lineHeights } from "./tokens/primitive/typography";
import { colors as semanticColors } from "./tokens/semantic/color";

export const animicPreset = definePreset({
  name: "@animic/design-system",
  conditions,
  globalCss,
  patterns: { stack, cluster, container, center, grid, split },
  utilities: base.utilities,
  theme: {
    colorPalette: { enabled: false },
    textStyles,
    layerStyles,
    animationStyles,
    keyframes,
    recipes: { button, iconButton, surface, badge, input, link, separator, spinner },
    slotRecipes: { field, dialog, segmentedControl, avatar, progress, toast },
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
    semanticTokens: { colors: semanticColors, zIndex },
  },
});
