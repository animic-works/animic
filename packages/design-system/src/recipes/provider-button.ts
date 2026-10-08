import { defineRecipe } from "@pandacss/dev";
import { buttonControl, buttonAvailable } from "./control";

export const providerButton = defineRecipe({
  className: "provider-button",
  base: {
    ...buttonControl,
    display: "grid",
    gridTemplateColumns: "1.5rem 1fr 1.5rem",
    alignItems: "center",
    gap: "3",
    width: "100%",
    minHeight: "3.5rem",
    padding: "0.95rem 1.25rem",
    borderRadius: "full",
    textStyle: "label",
    "& > svg": { width: "1.4rem", height: "1.4rem" },
    [buttonAvailable]: {
      _hover: { transform: "translateY(-2px)" },
      _active: { transform: "translateY(1px)" },
      _motionReduce: {
        _hover: { transform: "none" },
        _active: { transform: "none" },
      },
    },
  },
  variants: {
    provider: {
      google: {
        [buttonAvailable]: {
          background: "bg.surface",
          color: "fg.default",
          borderColor: "border.default",
        },
      },
      discord: {
        [buttonAvailable]: {
          background: "brand.discord",
          color: "fg.inverse",
          borderColor: "brand.discord",
        },
      },
    },
  },
});
