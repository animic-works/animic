import { readFile } from "node:fs/promises";

import { animicPreset } from "@animic/design-system/preset";
import * as v from "valibot";
import { describe, expect, it } from "vite-plus/test";
import { acceptsTextContrast } from "./contrast-policy";

const specSchema = v.object({
  schemaVersion: v.literal(1),
  tokens: v.record(
    v.string(),
    v.object({
      category: v.string(),
      cssVar: v.optional(v.string()),
      semantic: v.optional(v.boolean()),
      originalValue: v.optional(v.string()),
    }),
  ),
  conditions: v.record(v.string(), v.unknown()),
  values: v.array(
    v.object({ token: v.string(), value: v.string(), refs: v.optional(v.array(v.string())) }),
  ),
});

const generatedRoot = new URL("../../packages/styled-system/generated/", import.meta.url);
const spec = v.parse(
  specSchema,
  JSON.parse(await readFile(new URL("specs/design-system.json", generatedRoot), "utf8")),
);
const values = new Map(spec.values.map((entry) => [entry.token, entry.value]));

function resolvedColor(path: string): string {
  const value = values.get(path);
  if (!value) throw new Error(`Missing generated token: ${path}`);
  return value;
}

function luminance(color: string): number {
  if (!/^#[\da-f]{6}$/i.test(color)) throw new Error(`Expected a resolved RGB color: ${color}`);
  const channels = [1, 3, 5].map((offset) => {
    const channel = Number.parseInt(color.slice(offset, offset + 2), 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  const [red = 0, green = 0, blue = 0] = channels;
  return red * 0.2126 + green * 0.7152 + blue * 0.0722;
}

function contrast(foreground: string, background: string): number {
  const fg = luminance(foreground);
  const bg = luminance(background);
  return (Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05);
}

describe("generated design-system contract", () => {
  it("resolves semantic aliases and emits matching CSS custom properties", async () => {
    const css = await readFile(new URL("styles.css", generatedRoot), "utf8");
    for (const [path, definition] of Object.entries(spec.tokens)) {
      if (!definition.semantic || definition.category !== "colors") continue;
      if (definition.originalValue?.startsWith("{")) {
        expect(definition.originalValue).toMatch(/^\{colors\.[a-z]+\.[0-9]+(?:\.[0-9]+)?\}$/);
        const reference = definition.originalValue.slice(1, -1);
        expect(values.get(path)).toBe(values.get(reference));
      } else {
        expect(definition.originalValue).toMatch(
          /^color-mix\(in srgb, \{colors\.[a-z]+\.[0-9]+\} (?:12|35)%, \{colors.neutral.0\}\)$/,
        );
        expect(values.get(path)).not.toContain("{colors.");
      }
      expect(definition.cssVar).toBeDefined();
      expect(css).toContain(definition.cssVar);
    }
    expect(spec.tokens["colors.action.primary.bg"].cssVar).toBe(
      "--animic-colors-action-primary-bg",
    );
  });

  it("defines stacking as semantic roles without a primitive scale", () => {
    const names = Object.keys(spec.tokens).filter((name) => name.startsWith("zIndex."));
    expect(names.toSorted()).toEqual([
      "zIndex.navigation",
      "zIndex.overlay",
      "zIndex.scrollbar",
      "zIndex.toast",
    ]);
    expect(animicPreset.theme?.tokens).not.toHaveProperty("zIndex");
    expect(animicPreset.theme?.semanticTokens?.zIndex).toEqual({
      navigation: { value: 1 },
      scrollbar: { value: 2 },
      overlay: { value: 10 },
      toast: { value: 20 },
    });
    expect(values.get("zIndex.overlay")).toBe("10");
    expect(values.get("zIndex.toast")).toBe("20");
  });

  it("does not acquire a default theme or responsive breakpoints", () => {
    expect(Object.keys(spec.tokens).some((name) => name.startsWith("colors.blue."))).toBe(false);
    expect(Object.keys(spec.tokens).some((name) => name.startsWith("breakpoints."))).toBe(false);
    expect(spec.conditions).not.toHaveProperty("sm");
    expect(spec.conditions).not.toHaveProperty("md");
    expect(spec.conditions).not.toHaveProperty("lg");
    expect(spec.conditions).toHaveProperty("_focusVisible");
    expect(spec.conditions).toHaveProperty("_motionReduce");
  });

  it("exposes only declared package subpaths", () => {
    expect(import.meta.resolve("@animic/design-system/preset")).toContain("/src/preset.ts");
    expect(import.meta.resolve("@animic/styled-system/css")).toContain("/generated/css/index.js");
    expect(() => import.meta.resolve("@animic/design-system")).toThrow();
    expect(() => import.meta.resolve("@animic/design-system/src/tokens/primitive/color")).toThrow();
    expect(() => import.meta.resolve("@animic/styled-system")).toThrow();
    expect(() => import.meta.resolve("@animic/styled-system/jsx")).toThrow();
    for (const subpath of ["tokens", "types", "generated/tokens/index.js"])
      expect(() => import.meta.resolve(`@animic/styled-system/${subpath}`)).toThrow();
    for (const subpath of ["dom", "src/dom", "styles.css"])
      expect(() => import.meta.resolve(`@animic/react/${subpath}`)).toThrow();
    expect(() => import.meta.resolve("@animic/react")).toThrow();
    expect(() => import.meta.resolve("@animic/design-system/font-assets")).toThrow();
    expect(import.meta.resolve("@animic/styled-system/styles.css")).toMatch(
      /styled-system\/styles\.css$/,
    );
  });

  it("keeps primary interaction colors equal without conflating accent and action", () => {
    expect(values.get("colors.action.primary.hover")).toBe(values.get("colors.action.primary.bg"));
    expect(values.get("colors.action.primary.pressed")).toBe(
      values.get("colors.action.primary.bg"),
    );
    expect(values.get("colors.accent.primary")).toBe(values.get("colors.action.primary.bg"));
    expect(values.get("colors.disabled.bg")).toBe(values.get("colors.neutral.2"));
  });

  it("enforces text contrast with only the approved color pairs accepted", () => {
    const pairs = [
      [resolvedColor("colors.fg.default"), resolvedColor("colors.bg.canvas")],
      [resolvedColor("colors.fg.muted"), resolvedColor("colors.bg.surface")],
      [resolvedColor("colors.fg.inverse"), resolvedColor("colors.bg.inverse")],
      [resolvedColor("colors.action.primary.fg"), resolvedColor("colors.action.primary.bg")],
      [resolvedColor("colors.selection.fg"), resolvedColor("colors.selection.bg")],
      [resolvedColor("colors.status.success.fg"), resolvedColor("colors.status.success.bg")],
      [resolvedColor("colors.status.danger.fg"), resolvedColor("colors.status.danger.bg")],
    ];
    for (const palette of [
      "pink",
      "cyan",
      "yellow",
      "rose",
      "gray",
      "green",
      "violet",
      "orange",
      "ink",
    ]) {
      pairs.push([
        resolvedColor(`colors.avatar.${palette}.fg`),
        resolvedColor(`colors.avatar.${palette}.bg`),
      ]);
    }
    pairs.push([resolvedColor("colors.fg.default"), resolvedColor("colors.accent.primary")]);
    for (const [foreground = "", background = ""] of pairs) {
      expect(
        contrast(foreground, background) >= 4.5 || acceptsTextContrast(foreground, background),
        `${foreground} on ${background}: ${contrast(foreground, background)}:1`,
      ).toBe(true);
    }
    expect(
      contrast(resolvedColor("colors.focus.ring"), resolvedColor("colors.bg.surface")),
    ).toBeGreaterThanOrEqual(3);
  });
});
