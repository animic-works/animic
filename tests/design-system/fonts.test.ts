import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { describe, expect, it } from "vite-plus/test";
import * as v from "valibot";
import { fontImports, fontCss } from "../../scripts/generate-fonts.mjs";
import { textStyles } from "../../packages/design-system/src/styles/text";
import { fonts, fontWeights } from "../../packages/design-system/src/tokens/primitive/typography";
import { fontAssets } from "../../packages/design-system/src/font-assets";

const assetRequire = createRequire(
  new URL("../../packages/styled-system/package.json", import.meta.url),
);
describe("Text StyleからのFont asset生成", () => {
  it("全Text Styleが必要とする組だけを生成し、Fontsource CSSを解決する", async () => {
    const styles = v.parse(
      v.record(
        v.string(),
        v.object({
          value: v.object({
            fontFamily: v.string(),
            fontWeight: v.string(),
            fontStyle: v.optional(v.picklist(["normal", "italic"])),
          }),
        }),
      ),
      textStyles,
    );
    const families = new Map(Object.entries(fonts));
    const weights = new Map(Object.entries(fontWeights));
    const assets = new Map(Object.entries(fontAssets));
    const requirements = new Set(
      Object.values(styles).map(({ value }) => {
        const family = families.get(value.fontFamily)?.value;
        const weight = weights.get(value.fontWeight)?.value;
        expect(family).toContain('"');
        return `${assets.get(value.fontFamily)}/${weight}${value.fontStyle === "italic" ? "-italic" : ""}.css`;
      }),
    );
    expect(fontImports()).toEqual(
      [...requirements].toSorted((left, right) => left.localeCompare(right, "en")),
    );
    for (const specifier of fontImports()) {
      const css = await readFile(assetRequire.resolve(specifier), "utf8");
      expect(css).toContain("@font-face");
      expect(css).toContain("font-display: swap;");
      const filename = specifier.split("/").at(-1) ?? "";
      expect(css).toContain(`font-weight: ${Number.parseInt(filename, 10)};`);
      expect(css).toContain(`font-style: ${filename.includes("-italic") ? "italic" : "normal"};`);
    }
    const generated = await readFile(
      new URL("../../packages/styled-system/generated/fonts.css", import.meta.url),
      "utf8",
    );
    expect(generated).toBe(fontCss());
    expect(generated).toBe(
      fontImports()
        .map((specifier) => `@import "${specifier}";\n`)
        .join(""),
    );
  });
  it("Text Styleの追加・削除・weight変更に追従し、generatorに組を固定しない", () => {
    const styles = { sample: { value: { fontFamily: "body", fontWeight: "emphasis" } } };
    const families = { body: { value: '"Zen Kaku Gothic New", sans-serif' } };
    const weights = { emphasis: { value: 700 } };
    const assets = { body: "@fontsource/zen-kaku-gothic-new" };
    expect(fontImports(styles, families, weights, assets)).toEqual([
      "@fontsource/zen-kaku-gothic-new/700.css",
    ]);
    expect(fontImports({}, families, weights, assets)).toEqual([]);
    expect(fontImports(styles, families, { emphasis: { value: 500 } }, assets)).toEqual([
      "@fontsource/zen-kaku-gothic-new/500.css",
    ]);
    expect(
      fontImports({ ...styles, duplicate: styles.sample }, families, weights, assets),
    ).toHaveLength(1);
  });
  it("未解決Token・対応情報・提供されないweightは生成を失敗させる", () => {
    const styles = { sample: { value: { fontFamily: "body", fontWeight: "regular" } } };
    const families = { body: { value: '"Dela Gothic One", sans-serif' } };
    const weights = { regular: { value: 400 } };
    const assets = { body: "@fontsource/dela-gothic-one" };
    expect(() => fontImports(styles, {}, weights, assets)).toThrow();
    expect(() => fontImports(styles, families, {}, assets)).toThrow();
    expect(() => fontImports(styles, families, weights, {})).toThrow();
    expect(() => fontImports(styles, families, { regular: { value: 900 } }, assets)).toThrow();
  });
  it("normalとitalicを区別し、実在する書体だけを配信する", () => {
    const families = { latin: { value: '"Montserrat", sans-serif' } };
    const weights = { medium: { value: 500 } };
    const assets = { latin: "@fontsource/montserrat" };
    const value = { fontFamily: "latin", fontWeight: "medium" };
    expect(
      fontImports(
        {
          regular: { value },
          italic: { value: { ...value, fontStyle: "italic" } },
          duplicate: { value: { ...value, fontStyle: "normal" } },
        },
        families,
        weights,
        assets,
      ),
    ).toEqual(["@fontsource/montserrat/500-italic.css", "@fontsource/montserrat/500.css"]);
    expect(() =>
      fontImports(
        { invalid: { value: { ...value, fontStyle: "oblique" } } },
        families,
        weights,
        assets,
      ),
    ).toThrow("fontStyle");
    expect(() =>
      fontImports(
        {
          italic: { value: { fontFamily: "display", fontWeight: "regular", fontStyle: "italic" } },
        },
        { display: { value: '"Dela Gothic One"' } },
        { regular: { value: 400 } },
        { display: "@fontsource/dela-gothic-one" },
      ),
    ).toThrow();
  });
});
