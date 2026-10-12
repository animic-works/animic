import { Split } from "@animic/react/split";
import { useState } from "react";
import * as v from "valibot";
import { Button } from "@animic/react/button";
import { Cluster } from "@animic/react/cluster";
import { Field } from "@animic/react/field";
import { Input } from "@animic/react/input";
import { Stack } from "@animic/react/stack";
import { SegmentedControl } from "@animic/react/segmented-control";
import { Surface } from "@animic/react/surface";
import { Heading } from "@animic/react/heading";
import { Text } from "@animic/react/text";
import { useToast } from "@animic/react/toast";
import { saveBattleOptions } from "../room/battle-options.functions";
import {
  BATTLE_OPTION_LABELS,
  battleOptionKinds,
  battleOptionsSchema,
  DEFAULT_BATTLE_OPTIONS,
  maxBattleChoices,
} from "../room/battle-options";
import type { BattleOptions, BattleOptionKind } from "../room/battle-options";
import { AdminGuide, AdminHead } from "./admin-parts";
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
  const toast = useToast();
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
    if (saving) return;
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
      toast.show({ title: "保存しました" });
      await onSaved();
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Stack space="section">
      <AdminHead eyebrow="Admin" title="対戦条件" description="ロビーでホストが選べる候補です。" />
      <Split layout="main-aside">
        <Stack>
          {battleOptionKinds.map((kind) => {
            const label = BATTLE_OPTION_LABELS[kind];
            const { choices } = draft[kind];
            const numbers = optionNumbers(choices);
            const selectedDefault = effectiveDefault(numbers, draft[kind].defaultSeconds);
            return (
              <Surface key={kind} appearance="subtle" padding="lg">
                <Stack>
                  <Heading level={2} size="sm">
                    {label}
                  </Heading>
                  {choices.map((choice, index) => (
                    <Cluster key={index} layout="nowrap">
                      <Field label={`${label}の候補${index + 1}（秒）`}>
                        <Input
                          inputMode="numeric"
                          value={choice}
                          disabled={saving}
                          onChange={(event) => setChoice(kind, index, event.target.value)}
                        />
                      </Field>
                      <Button
                        appearance="quiet"
                        size="sm"
                        aria-label={`${label}の候補${index + 1}を削除`}
                        disabled={choices.length <= 1}
                        loading={saving}
                        onClick={() => removeChoice(kind, index)}
                      >
                        削除
                      </Button>
                    </Cluster>
                  ))}
                  <Cluster>
                    <Button
                      appearance="secondary"
                      size="sm"
                      aria-label={`${label}の候補を追加`}
                      disabled={choices.length >= maxBattleChoices}
                      loading={saving}
                      onClick={() => addChoice(kind)}
                    >
                      候補を追加
                    </Button>
                  </Cluster>
                  {numbers.length > 0 && (
                    <SegmentedControl
                      label={`${label}の既定値`}
                      options={numbers.map((seconds) => ({
                        value: String(seconds),
                        label: `${seconds}秒`,
                      }))}
                      value={String(selectedDefault)}
                      disabled={saving}
                      onValueChange={(value) =>
                        updateKind(kind, { ...draft[kind], defaultSeconds: Number(value) })
                      }
                    />
                  )}
                </Stack>
              </Surface>
            );
          })}
          {error && (
            <div role="alert">
              <Text tone="danger">{error}</Text>
            </div>
          )}
          <Cluster>
            <Button loading={saving} onClick={() => void save()}>
              {saving ? "保存しています…" : "保存する"}
            </Button>
            <Button
              appearance="quiet"
              loading={saving}
              onClick={() => setDraft(toDraft(DEFAULT_BATTLE_OPTIONS))}
            >
              元の候補に戻す
            </Button>
          </Cluster>
        </Stack>
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
      </Split>
    </Stack>
  );
}
