import { Cluster } from "@animic/react/cluster";
import { Fragment } from "react";
import { Heading } from "@animic/react/heading";
import { Meter } from "@animic/react/meter";
import { Stack } from "@animic/react/stack";
import { Surface } from "@animic/react/surface";
import { Text } from "@animic/react/text";
import type { HistoryEntry } from "./history-entry";
import { evaluationCategories } from "../battle/evaluation-labels";
export function ScoreBreakdown({
  entry,
}: {
  entry: Pick<HistoryEntry, "sim" | "speed" | "bonus" | "gens" | "total" | "cats">;
}) {
  return (
    <Stack space="compact">
      <Heading level={2} size="sm">
        スコアの内訳
      </Heading>
      <Cluster space="compact">
        {[
          { label: "再現度", value: entry.sim?.toFixed(1) },
          { label: "提出速度", value: entry.speed },
          { label: `生成回数${entry.gens ? `（${entry.gens}回）` : ""}`, value: entry.bonus },
          { label: "合計", value: entry.total?.toFixed(1) },
        ].map((term, i) => (
          <Fragment key={term.label}>
            {i > 0 && <Text tone="muted">{i === 3 ? "=" : "+"}</Text>}
            <Surface appearance={i === 3 ? "primary" : "subtle"} padding="xs">
              <Stack space="tight">
                <Text variant="caption" tone="muted">
                  {term.label}
                </Text>
                <Text variant="code" tone={i === 3 ? "accent" : "default"}>
                  {term.value ?? "—"}
                </Text>
              </Stack>
            </Surface>
          </Fragment>
        ))}
      </Cluster>
      {entry.cats &&
        evaluationCategories.map((category) => (
          <Meter
            key={category.id}
            label={category.label}
            description={category.models}
            value={entry.cats?.[category.id] ?? 0}
            valueText={entry.cats?.[category.id].toFixed(1)}
            presentation="row"
          />
        ))}
    </Stack>
  );
}
