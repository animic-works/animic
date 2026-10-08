import { useState } from "react";
import * as v from "valibot";

import { Button } from "../../components/button";
import { TextField } from "../../components/field";
import { Icon, IconButton } from "../../components/icon";
import { Stack } from "../../components/layout";
import { SegmentedControl } from "../../components/segmented-control";
import { Surface } from "../../components/surface";
import { Heading, Text } from "../../components/text";
import { toast } from "../../components/toast";
import { saveBattleOptions } from "../room/battle-options.functions";
import {
  BATTLE_OPTION_LABELS,
  battleOptionKinds,
  battleOptionsSchema,
  DEFAULT_BATTLE_OPTIONS,
  maxBattleChoices,
} from "../room/battle-options";
import type { BattleOptions, BattleOptionKind } from "../room/battle-options";
import { AdminColumns, AdminGuide, AdminHead } from "./admin-parts";
import { errorMessage } from "./admin-format";

type Draft = Record<BattleOptionKind, { choices: string[]; defaultSeconds: number }>;

function toDraft(options: BattleOptions): Draft {
  return {
    duration: {
      choices: options.duration.choices.map(String),
      defaultSeconds: options.duration.defaultSeconds,
    },
    selection: {
      choices: options.selection.choices.map(String),
      defaultSeconds: options.selection.defaultSeconds,
    },
  };
}

/** 入力のうち、1〜3600の整数として読めて重複しない秒数を、入力順に返す。 */
function optionNumbers(choices: readonly string[]): number[] {
  const seen = new Set<number>();
  const result: number[] = [];
  for (const choice of choices) {
    const seconds = Number(choice);
    if (Number.isInteger(seconds) && seconds >= 1 && seconds <= 3600 && !seen.has(seconds)) {
      seen.add(seconds);
      result.push(seconds);
    }
  }
  return result;
}

/** 候補に残っていない既定値は、最初の候補に寄せる。 */
function effectiveDefault(numbers: readonly number[], current: number): number {
  return numbers.includes(current) ? current : (numbers[0] ?? current);
}

/** 失敗した項目の種類（duration/selection）を見出しの文言にする。 */
function issueKindLabel(path: string | null | undefined): string | null {
  for (const kind of battleOptionKinds)
    if (path?.startsWith(kind)) return BATTLE_OPTION_LABELS[kind];
  return null;
}

// 対戦条件: ロビーで選べる制限時間・画像選択の猶予の候補と既定値
export function BattleOptionsScreen({
  options,
  onSaved,
}: {
  options: BattleOptions;
  onSaved: () => Promise<void>;
}) {
  const [draft, setDraft] = useState<Draft>(() => toDraft(options));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function updateKind(kind: BattleOptionKind, next: Draft[BattleOptionKind]) {
    setDraft((current) => ({ ...current, [kind]: next }));
  }

  function setChoice(kind: BattleOptionKind, index: number, value: string) {
    const choices = draft[kind].choices.map((choice, i) => (i === index ? value : choice));
    updateKind(kind, { ...draft[kind], choices });
  }

  function removeChoice(kind: BattleOptionKind, index: number) {
    const choices = draft[kind].choices.filter((_, i) => i !== index);
    updateKind(kind, { ...draft[kind], choices });
  }

  function addChoice(kind: BattleOptionKind) {
    updateKind(kind, { ...draft[kind], choices: [...draft[kind].choices, ""] });
  }

  function buildOptions(): BattleOptions {
    const build = (kind: BattleOptionKind) => ({
      choices: draft[kind].choices.map(Number),
      defaultSeconds: effectiveDefault(
        optionNumbers(draft[kind].choices),
        draft[kind].defaultSeconds,
      ),
    });
    return { duration: build("duration"), selection: build("selection") };
  }

  async function save() {
    const parsed = v.safeParse(battleOptionsSchema, buildOptions());
    if (!parsed.success) {
      const [issue] = parsed.issues;
      const label = issueKindLabel(v.getDotPath(issue));
      setError(label ? `${label}: ${issue.message}` : issue.message);
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await saveBattleOptions({ data: parsed.output });
      toast("保存しました");
      await onSaved();
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <AdminHead eyebrow="Admin" title="対戦条件" description="ロビーでホストが選べる候補です。" />
      <AdminColumns
        layout="form"
        primary={
          <Stack gap="4">
            {battleOptionKinds.map((kind) => {
              const label = BATTLE_OPTION_LABELS[kind];
              const { choices } = draft[kind];
              const numbers = optionNumbers(choices);
              const selectedDefault = effectiveDefault(numbers, draft[kind].defaultSeconds);
              return (
                <Surface key={kind} as="section" variant="soft" padding="lg">
                  <Stack gap="4">
                    <Heading variant="heading-sm">{label}</Heading>
                    <Stack gap="3">
                      {choices.map((choice, index) => (
                        <Stack key={index} direction="row" gap="2" align="end">
                          <TextField
                            label={`${label}の候補${index + 1}（秒）`}
                            type="number"
                            inputMode="numeric"
                            min={1}
                            max={3600}
                            value={choice}
                            onChange={(event) => setChoice(kind, index, event.target.value)}
                          />
                          <IconButton
                            variant="rowDanger"
                            icon="trash"
                            label={`${label}の候補${index + 1}を削除`}
                            disabled={choices.length <= 1}
                            onClick={() => removeChoice(kind, index)}
                          />
                        </Stack>
                      ))}
                    </Stack>
                    <Stack direction="row">
                      <Button
                        variant="secondary"
                        size="sm"
                        leadingIcon={<Icon name="plus" size="sm" />}
                        aria-label={`${label}の候補を追加`}
                        disabled={choices.length >= maxBattleChoices}
                        onClick={() => addChoice(kind)}
                      >
                        候補を追加
                      </Button>
                    </Stack>
                    {numbers.length ? (
                      <Stack gap="2">
                        <Text as="p" variant="label" aria-hidden="true">
                          既定値
                        </Text>
                        <SegmentedControl
                          label={`${label}の既定値`}
                          options={numbers.map((seconds) => ({
                            value: String(seconds),
                            label: `${seconds}秒`,
                          }))}
                          value={String(selectedDefault)}
                          onValueChange={(value) =>
                            updateKind(kind, { ...draft[kind], defaultSeconds: Number(value) })
                          }
                        />
                      </Stack>
                    ) : null}
                  </Stack>
                </Surface>
              );
            })}
            {error ? (
              <Text tone="danger" variant="note" role="alert">
                {error}
              </Text>
            ) : null}
            <Stack direction="row" gap="2">
              <Button
                leadingIcon={<Icon name="check" size="sm" />}
                loading={saving}
                loadingText="保存しています…"
                onClick={() => void save()}
              >
                保存する
              </Button>
              <Button variant="ghost" onClick={() => setDraft(toDraft(DEFAULT_BATTLE_OPTIONS))}>
                元の候補に戻す
              </Button>
            </Stack>
          </Stack>
        }
        secondary={
          <AdminGuide
            items={[
              {
                term: "反映",
                body: "保存した後に開いたロビーから、この候補を選べます。進行中の対戦と、ルームに保存済みの条件は変わりません。",
              },
              { term: "範囲", body: "1〜3600秒の整数を、1つの条件につき5個まで登録できます。" },
              {
                term: "未保存のとき",
                body: "保存するまでは、制限時間60・90・120秒（既定90秒）、画像選択の猶予10・15・30秒（既定15秒）を使います。",
              },
            ]}
          />
        }
      />
    </>
  );
}
