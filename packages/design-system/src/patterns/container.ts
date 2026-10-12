import { definePattern } from "@pandacss/dev";
export const container = definePattern({
  strict: true,
  properties: {
    size: { type: "enum", value: ["narrow", "summary", "reading", "wide"] },
    gutter: { type: "enum", value: ["page", "none"] },
  },
  transform({ size, gutter }, { map }) {
    return {
      boxSizing: "border-box",
      width: "100%",
      marginInline: "auto",
      paddingInline: map(gutter, (v) => (v === "none" ? "0" : "5")),
      maxWidth: map(size, (v) =>
        v === "narrow" ? "27rem" : v === "summary" ? "44rem" : v === "reading" ? "50rem" : "72rem",
      ),
    };
  },
});
