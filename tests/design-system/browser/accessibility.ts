import type { AxeBuilder } from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import * as v from "valibot";
import { acceptsTextContrast } from "../contrast-policy";

const colorPair = v.object({ fgColor: v.string(), bgColor: v.string() });
type Violations = Awaited<ReturnType<AxeBuilder["analyze"]>>["violations"];

export function reviewViolations(violations: Violations) {
  const accepted: Violations = [];
  const unexpected: Violations = [];
  for (const violation of violations) {
    const allowed = new Set(
      violation.id === "color-contrast"
        ? violation.nodes.filter((node) => {
            const checks = [...node.any, ...node.all, ...node.none];
            return (
              checks.length > 0 &&
              checks.every((check) => {
                const pair = v.safeParse(colorPair, check.data);
                return (
                  check.id === "color-contrast" &&
                  pair.success &&
                  acceptsTextContrast(pair.output.fgColor, pair.output.bgColor)
                );
              })
            );
          })
        : [],
    );
    const remaining = violation.nodes.filter((node) => !allowed.has(node));
    if (allowed.size) accepted.push({ ...violation, nodes: [...allowed] });
    if (remaining.length) unexpected.push({ ...violation, nodes: remaining });
  }
  return { accepted, unexpected };
}

export async function expectAccessible(builder: AxeBuilder) {
  const { accepted, unexpected } = reviewViolations((await builder.analyze()).violations);
  if (accepted.length)
    await test.info().attach("accepted-text-contrast", {
      body: JSON.stringify(accepted, null, 2),
      contentType: "application/json",
    });
  expect(unexpected).toEqual([]);
}
