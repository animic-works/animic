import { Button } from "@base-ui/react/button";
import { Input } from "@base-ui/react/input";
import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";
import { useState } from "react";
import * as v from "valibot";

import { setRoomSettings } from "../room/room.functions";
import type { BattleSettings } from "./battle-state";
import { startBattle } from "./battle.functions";
import { difficultySchema } from "./battle-state";
import styles from "./battle.module.css";

export function BattleSetup({
  code,
  canStart,
  initialSettings,
  previousBattleId,
}: {
  code: string;
  previousBattleId: string | null;
  canStart: boolean;
  initialSettings: BattleSettings | null;
}) {
  const [difficulty, setDifficulty] = useState<v.InferOutput<typeof difficultySchema>>(
    initialSettings?.difficulty ?? "easy",
  );
  const [duration, setDuration] = useState(
    initialSettings ? String(initialSettings.durationSeconds) : "",
  );
  const [selection, setSelection] = useState(
    initialSettings ? String(initialSettings.selectionSeconds) : "",
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  return (
    <form
      className={styles.setup}
      onSubmit={async (event) => {
        event.preventDefault();
        if (pending) return;
        setPending(true);
        setError("");
        try {
          const settings = {
            difficulty,
            durationSeconds: Number(duration),
            selectionSeconds: Number(selection),
          };
          await setRoomSettings({ data: { code, settings, previousBattleId } });
          const result = await startBattle({ data: { code, settings, previousBattleId } });
          if (result.error) setError(result.error);
        } catch {
          setError("対戦を開始できませんでした。接続と参加者を確認してください。");
        } finally {
          setPending(false);
        }
      }}
    >
      <h2>対戦の設定</h2>
      <fieldset>
        <legend>難易度</legend>
        <RadioGroup
          value={difficulty}
          onValueChange={(value) => setDifficulty(v.parse(difficultySchema, value))}
          className={styles.difficulties}
        >
          <label>
            <Radio.Root value="easy" className={styles.radio}>
              <Radio.Indicator className={styles.indicator} />
            </Radio.Root>
            かんたん
          </label>
          <label>
            <Radio.Root value="normal" className={styles.radio}>
              <Radio.Indicator className={styles.indicator} />
            </Radio.Root>
            ふつう
          </label>
          <label>
            <Radio.Root value="hard" className={styles.radio}>
              <Radio.Indicator className={styles.indicator} />
            </Radio.Root>
            むずかしい（Extra）
          </label>
        </RadioGroup>
      </fieldset>
      <label htmlFor="battle-duration">制限時間（秒）</label>
      <Input
        id="battle-duration"
        type="number"
        min={1}
        max={3600}
        step={1}
        required
        value={duration}
        onValueChange={setDuration}
      />
      <label htmlFor="battle-selection">画像を選ぶ猶予（秒）</label>
      <Input
        id="battle-selection"
        type="number"
        min={1}
        max={3600}
        step={1}
        required
        value={selection}
        onValueChange={setSelection}
      />
      <p>準備状態を確認して開始してください。全員の準備完了は必須ではありません。</p>
      <Button type="submit" disabled={!canStart || pending}>
        {pending ? "開始中…" : previousBattleId ? "次の対戦を始める" : "対戦を始める"}
      </Button>
      {error && <p role="alert">{error}</p>}
    </form>
  );
}
