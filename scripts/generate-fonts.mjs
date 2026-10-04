import { mkdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fontAssets } from "../packages/design-system/src/font-assets.ts";
import { textStyles } from "../packages/design-system/src/styles/text.ts";
import { fonts, fontWeights } from "../packages/design-system/src/tokens/primitive/typography.ts";

const requireAsset = createRequire(
  new URL("../packages/styled-system/package.json", import.meta.url),
);

export function fontImports(
  styles = textStyles,
  families = fonts,
  weights = fontWeights,
  assets = fontAssets,
) {
  const imports = new Set();
  for (const [name, { value }] of Object.entries(styles)) {
    const family = families[value.fontFamily]?.value;
    const weight = weights[value.fontWeight]?.value;
    const asset = assets[value.fontFamily];
    if (typeof family !== "string" || typeof weight !== "number" || !asset) {
      throw new Error(
        `Text Style ${name}: font family / weight tokenまたはasset対応を解決できません。`,
      );
    }
    const specifier = `${asset}/${weight}.css`;
    // styled-systemが配信するアセットを、そのパッケージの依存関係から解決する。
    requireAsset.resolve(specifier);
    imports.add(specifier);
  }
  return [...imports].toSorted((left, right) => left.localeCompare(right, "en"));
}

export function fontCss() {
  return (
    fontImports()
      .map((specifier) => `@import "${specifier}";`)
      .join("\n") + "\n"
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const output = new URL("../packages/styled-system/generated/", import.meta.url);
  const css = fontCss();
  await mkdir(output, { recursive: true });
  await writeFile(new URL("fonts.css", output), css);
  console.log("Text Styleが必要とするFontsource CSSを生成しました。");
}
