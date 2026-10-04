import { definePattern } from "@pandacss/dev";
export const stack = definePattern({
  strict: true,
  properties: {
    space: { type: "enum", value: ["compact", "normal", "section"] },
    align: { type: "enum", value: ["stretch", "start", "center"] },
  },
  defaultValues: { space: "normal", align: "stretch" },
  transform({ space, align }, { map }) {
    return {
      display: "flex",
      flexDirection: "column",
      minWidth: 0,
      gap: map(space, (v) => (v === "compact" ? "3" : v === "section" ? "6" : "5")),
      alignItems: align,
    };
  },
});
