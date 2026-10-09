import { judgingMoment } from "./judging-timeline";
import { ScoreReveal, RankStamp } from "./visuals/result-artwork";
import { Avatar } from "@animic/react/avatar";
import { Badge } from "@animic/react/badge";
import { Cluster } from "@animic/react/cluster";
import { Heading } from "@animic/react/heading";
import { Meter } from "@animic/react/meter";
import { OutputPanel, OutputTags } from "@animic/react/output-panel";
import { Progress } from "@animic/react/progress";
import { ProgressList } from "@animic/react/progress-list";
import { Stack } from "@animic/react/stack";
import { Surface } from "@animic/react/surface";
import { Text } from "@animic/react/text";
import { playerPalettes } from "../../../src/features/room/room-presentation";
import type { RoomRules } from "../room/room-presentation";
import { evaluationCategories, evaluationModels } from "./evaluation-labels";
import type { rankResults } from "./result-preview";
import { judgingPreview, modelValue } from "./judging-preview";

export function JudgingPanel({
  player,
  index,
  count,
  elapsed,
  seed,
  level,
  rank,
}: {
  player: ReturnType<typeof rankResults>[number];
  index: number;
  count: number;
  elapsed: number;
  seed: string;
  level: RoomRules["level"];
  rank: number;
}) {
  const moment = judgingMoment(elapsed, Boolean(player.entry));
  const {
    inference: infer,
    modelsComplete: done,
    modelIndex,
    modelProgress: progress,
    scoreVisible: revealed,
  } = moment;
  const current = evaluationModels[modelIndex];
  const { metrics, models, mine, topic } = judgingPreview(player, seed, level);
  const score = (player.score?.total ?? 0) * moment.scoreProgress;
  return (
    <Surface appearance="card" padding="content">
      <Stack space="compact">
        <Cluster justify="between">
          <Cluster>
            <Avatar
              name={player.name}
              fallback={Array.from(player.name)[0]}
              palette={playerPalettes[player.seat % playerPalettes.length]}
            />
            <Stack space="tight">
              <Text variant="eyebrow.strong" tone="supporting">
                NOW JUDGING
              </Text>
              <Heading level={1} size="sm">
                {player.name}
                {player.isMe && <Badge>あなた</Badge>}
              </Heading>
            </Stack>
          </Cluster>
          <Text variant="code.compact" tone="muted">
            {index + 1} / {count}
          </Text>
        </Cluster>
        {player.entry && (
          <>
            {!revealed && (
              <Stack space="tight">
                <Cluster justify="between">
                  <Text variant="caption">
                    {done ? "4つの指標から再現度を集計" : `${current.name} を実行中`}
                  </Text>
                  <Text variant="code.compact" tone="muted">
                    {(Math.min(15000, infer) / 1000).toFixed(1)}s / ~15s
                  </Text>
                </Cluster>
                <Progress
                  tone="gradient"
                  striped
                  label="推論の進行"
                  value={Math.min(100, infer / 150)}
                  presentation="track"
                />
              </Stack>
            )}
            <ProgressList
              label="再現度の評価"
              groups={evaluationCategories.map((category) => {
                const items = models.filter((model) => model.category === category.id);
                const categoryDone =
                  done || items.every((model) => models.indexOf(model) < modelIndex);
                return {
                  id: category.id,
                  label: category.label,
                  value: categoryDone ? metrics[category.id].toFixed(1) : undefined,
                  items: items.map((model) => {
                    const i = models.indexOf(model);
                    return {
                      id: model.id,
                      label: model.name,
                      state:
                        i < modelIndex || done
                          ? "complete"
                          : i === modelIndex
                            ? "active"
                            : "pending",
                      value: i < modelIndex || done ? modelValue(model.id, model.value) : undefined,
                      progress: progress * 100,
                    };
                  }),
                };
              })}
            />
            {!revealed && (done || current.category === "tag") && (
              <OutputPanel
                title={done ? "再現度の集計" : current.name}
                value={done ? player.score?.sim.toFixed(1) : `${Math.round(progress * 20) * 5}%`}
              >
                {done ? (
                  <Stack space="tight">
                    {evaluationCategories.map((category) => (
                      <Meter
                        key={category.id}
                        label={category.label}
                        description={`${category.models}・×0.25`}
                        appearance="inverse"
                        presentation="row"
                        tone={
                          category.id === "char"
                            ? "highlight"
                            : category.id === "tag"
                              ? "success"
                              : category.id === "content"
                                ? "secondary"
                                : "primary"
                        }
                        value={metrics[category.id]}
                        valueText={metrics[category.id].toFixed(1)}
                      />
                    ))}
                  </Stack>
                ) : (
                  <OutputTags
                    groups={[topic, mine].map((tags, i) => ({
                      label: i === 0 ? "お題" : "提出画像",
                      items: tags.slice(
                        0,
                        Math.ceil(progress * Math.max(topic.length, mine.length)),
                      ),
                    }))}
                  />
                )}
              </OutputPanel>
            )}
          </>
        )}
        {!player.entry && !revealed && (
          <Text variant="caption" tone="supporting">
            提出がないため、推論はしません
          </Text>
        )}
        {revealed && (
          <ScoreReveal>
            <Stack space="tight">
              <Cluster justify="between">
                <Stack space="tight">
                  <Text variant="eyebrow.strong" tone="accent">
                    SCORE
                  </Text>
                  <Text variant="numeric.score">
                    {player.entry ? score.toFixed(1) : "未提出"}
                    {player.entry && (
                      <Text variant="body.sm" tone="muted">
                        pt
                      </Text>
                    )}
                  </Text>
                </Stack>
                {moment.rankVisible && <RankStamp rank={player.entry ? rank : null} />}
              </Cluster>
              {player.score && done && (
                <Stack space="tight">
                  <Meter
                    presentation="row"
                    label="再現度"
                    value={player.score.sim}
                    valueText={player.score.sim.toFixed(1)}
                  />
                  <Meter
                    presentation="row"
                    label="回答時間"
                    value={player.score.speed * 5}
                    valueText={`+${player.score.speed}`}
                    tone="secondary"
                  />
                  <Meter
                    presentation="row"
                    label="生成回数"
                    value={(player.score.bonus / 15) * 100}
                    valueText={`+${player.score.bonus}`}
                    tone="highlight"
                  />
                </Stack>
              )}
            </Stack>
          </ScoreReveal>
        )}
      </Stack>
    </Surface>
  );
}
