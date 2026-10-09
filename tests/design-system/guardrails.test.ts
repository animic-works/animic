import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { checkRepository, inspectSource } from "../../scripts/design-guardrails.mjs";

describe("デザインシステムのパッケージ依存", () => {
  it.each([
    'import { Dialog } from "@ark-ui/react/dialog";',
    'export { Button } from "@animic/react/button";',
    'const react = import("react");',
    'const styles = require("@animic/styled-system/css");',
    'import { Button } from "../../react/src/button";',
    'import feature from "../../../src/features/feature";',
    "const other = import(target);",
  ])("デザイン定義からUI・生成物・アプリケーションへ依存できない: %s", (source) => {
    expect(inspectSource("packages/design-system/src/example.ts", source).length).toBeGreaterThan(
      0,
    );
  });
  it.each([
    'import { animicPreset } from "@animic/design-system/preset";',
    'export { defineRecipe } from "@pandacss/dev";',
    'import recipe from "../../design-system/src/recipes/button";',
    'import feature from "../../../src/features/feature";',
    'import { keyframes } from "@animic/styled-system/css";',
    'import * as styles from "@animic/styled-system/css";',
    "const other = require(target);",
  ])("React実装でデザイン定義・アプリケーションへ依存できない: %s", (source) => {
    expect(inspectSource("packages/react/src/example.tsx", source).length).toBeGreaterThan(0);
  });
  it("定義はPanda、React実装は生成SDKとArkを利用できる", () => {
    expect(
      inspectSource(
        "packages/design-system/src/example.ts",
        'import {defineRecipe} from "@pandacss/dev";',
      ),
    ).toEqual([]);
    expect(
      inspectSource(
        "packages/react/src/example.tsx",
        'import {Dialog} from "@ark-ui/react/dialog"; import {dialog} from "@animic/styled-system/recipes"; import {cx} from "@animic/styled-system/css";',
      ),
    ).toEqual([]);
  });
  it("パッケージの実ファイルを検査し、対象が存在しなければ失敗する", async () => {
    const root = mkdtempSync(join(tmpdir(), "animic-package-guard-"));
    try {
      await expect(checkRepository({ root })).rejects.toThrow();
      for (const name of ["design-system", "react"])
        mkdirSync(join(root, "packages", name, "src"), { recursive: true });
      writeFileSync(
        join(root, "packages/react/src/view.tsx"),
        'import {button} from "@animic/styled-system/recipes";',
      );
      expect(await checkRepository({ root })).toEqual([]);
      writeFileSync(
        join(root, "packages/react/src/view.tsx"),
        'import {defineRecipe} from "@pandacss/dev";',
      );
      expect((await checkRepository({ root })).join("\n")).toContain("生成SDK");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
