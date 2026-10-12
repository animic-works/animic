import { definePattern } from "@pandacss/dev";
export const center = definePattern({
  strict: true,
  properties: { axis: { type: "enum", value: ["both", "inline"] } },
  defaultValues: { axis: "both" },
  transform({ axis }, { map }) {
    return {
      display: "flex",
      minWidth: 0,
      justifyContent: "center",
      alignItems: map(axis, (v) => (v === "both" ? "center" : "stretch")),
    };
  },
});
