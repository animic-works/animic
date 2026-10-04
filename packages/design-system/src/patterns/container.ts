import { definePattern } from "@pandacss/dev";
export const container = definePattern({
  strict: true,
  properties: { size: { type: "enum", value: ["narrow", "reading", "wide"] } },
  transform({ size }, { map }) {
    return {
      boxSizing: "border-box",
      width: "100%",
      marginInline: "auto",
      paddingInline: "5",
      maxWidth: map(size, (v) => (v === "narrow" ? "27rem" : v === "reading" ? "50rem" : "72rem")),
    };
  },
});
