import { ActionBar } from "@animic/react/action-bar";
import { Badge } from "@animic/react/badge";
import { Button } from "@animic/react/button";
import { Cluster } from "@animic/react/cluster";
import { Heading } from "@animic/react/heading";
import { Media } from "@animic/react/media";
import { SegmentedControl } from "@animic/react/segmented-control";
import { Stack } from "@animic/react/stack";
import { Surface } from "@animic/react/surface";
import { Text } from "@animic/react/text";
import type { BattleSettings } from "../battle/battle-state";
import { choicesWith, type BattleOptions } from "./battle-options";
import type { getLobbyPlayers } from "./lobby-players";
import { levels } from "./room-presentation";

/** ホストは選択肢から選び、ほかの参加者は決まった値だけを見る。 */
function RuleField({
  label,
  editable,
  disabled,
  value,
  options,
  onChange,
  tone,
}: {
  label: string;
  editable: boolean;
  disabled: boolean;
  value: string;
  options: readonly { value: string; label: string }[];
  onChange: (value: string) => void;
  tone?: "accent";
}) {
  if (!editable)
    return (
      <Cluster justify="between">
        <Text variant="label.supporting">{label}</Text>
        <Text variant="label">{options.find((option) => option.value === value)?.label}</Text>
      </Cluster>
    );
  return (
    <SegmentedControl
      label={label}
      disabled={disabled}
      labelVisibility="visible"
      labelPlacement="inline"
      appearance="pill"
      tone={tone}
      value={value}
      options={options}
      onValueChange={onChange}
    />
  );
}

const secondsOptions = (choices: readonly number[], current: number) =>
  choicesWith(choices, current).map((value) => ({ value: String(value), label: `${value}秒` }));

/** 対戦のルールと、開始・準備の操作。 */
export function LobbyRulesPanel({
  isHost,
  rules,
  battleOptions,
  lobby,
  pending,
  error,
  waitingForNext,
  onRulesChange,
  onStart,
  onReadyChange,
}: {
  isHost: boolean;
  rules: BattleSettings;
  battleOptions: BattleOptions;
  lobby: ReturnType<typeof getLobbyPlayers>;
  pending: boolean;
  error: string | undefined;
  waitingForNext: boolean;
  onRulesChange: (rules: BattleSettings) => void;
  onStart: () => void;
  onReadyChange: (ready: boolean) => void;
}) {
  const level = levels[rules.difficulty];
  const disabled = pending || waitingForNext;
  const ready = lobby.me?.ready ?? false;
  return (
    <Surface appearance="card" padding="content">
      <Stack space="compact">
        <Heading level={2} size="title">
          ルール
        </Heading>
        <RuleField
          label="難易度"
          editable={isHost}
          disabled={disabled}
          tone="accent"
          value={rules.difficulty}
          options={Object.entries(levels).map(([value, item]) => ({ value, label: item.label }))}
          onChange={(value) =>
            (value === "easy" || value === "normal" || value === "hard") &&
            onRulesChange({ ...rules, difficulty: value })
          }
        />
        <Media
          presentation="captioned"
          src={level.image}
          alt={`${level.label}のお題のイメージ`}
          label={<Badge appearance="glass">TOPIC IMAGE</Badge>}
          caption={
            <Stack space="tight">
              <Cluster>
                <Text variant="label.artwork" emphasis="outline" tone="inverse">
                  {level.word}
                </Text>
                {rules.difficulty === "hard" && <Badge appearance="sticker">EXTRA</Badge>}
              </Cluster>
              <Text variant="label.caption" emphasis="accent-shadow" tone="inverse">
                {level.description}
              </Text>
            </Stack>
          }
        />
        <RuleField
          label="制限時間"
          editable={isHost}
          disabled={disabled}
          value={String(rules.durationSeconds)}
          options={secondsOptions(battleOptions.duration.choices, rules.durationSeconds)}
          onChange={(value) => onRulesChange({ ...rules, durationSeconds: Number(value) })}
        />
        <RuleField
          label="画像選択の猶予"
          editable={isHost}
          disabled={disabled}
          value={String(rules.selectionSeconds)}
          options={secondsOptions(battleOptions.selection.choices, rules.selectionSeconds)}
          onChange={(value) => onRulesChange({ ...rules, selectionSeconds: Number(value) })}
        />
        {error && (
          <div role="alert">
            <Text tone="danger">{error}</Text>
          </div>
        )}
        {waitingForNext && (
          <div role="status">
            <Text>対戦中です。次の対戦から参加できます。</Text>
          </div>
        )}
        <ActionBar
          tone={lobby.allReady ? "success" : "neutral"}
          summary={
            <>
              <Text variant="caption" tone="supporting">
                準備OK
              </Text>
              <Text variant="numeric">
                {lobby.readyCount}/{lobby.players.length}
              </Text>
            </>
          }
        >
          {isHost ? (
            <Button
              shape="pill"
              size="lg"
              prominence="raised"
              disabled={lobby.connectedCount < 2 || waitingForNext}
              loading={pending}
              onClick={onStart}
            >
              対戦をはじめる
            </Button>
          ) : (
            <Button
              shape="pill"
              size="lg"
              appearance={ready ? "secondary" : "primary"}
              disabled={!lobby.me || waitingForNext}
              loading={pending}
              onClick={() => onReadyChange(!ready)}
            >
              {ready ? "準備完了を取り消す" : "準備完了にする"}
            </Button>
          )}
          {!isHost && (
            <Text variant="caption" tone="muted" align="center">
              ホストが開始します
            </Text>
          )}
        </ActionBar>
      </Stack>
    </Surface>
  );
}
