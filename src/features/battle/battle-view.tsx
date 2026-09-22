import { Button } from "@base-ui/react/button";
import { useState } from "react";

import type { BattleSnapshot } from "./battle-state";
import { BattleTimer } from "./battle-timer";
import { submitBattleImage } from "./battle.functions";
import styles from "./battle.module.css";

export function BattleView({
  code,
  battle,
  participantId,
  connected,
}: {
  code: string;
  battle: BattleSnapshot;
  participantId: string;
  connected: boolean;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  if (!battle.participantIds.includes(participantId))
    return <p role="status">次の対戦を待っています。</p>;
  const images = battle.myGenerations.filter((item) => item.status === "succeeded");
  return (
    <section className={styles.battle}>
      {battle.result && (
        <div role="status">
          <h2>対戦結果</h2>
          {battle.result.kind === "no-contest" ? (
            <p>両者とも未提出のため、勝負不成立です。</p>
          ) : (
            <p>
              {battle.result.winnerId === participantId
                ? "あなたの勝ちです。相手が未提出でした。"
                : "あなたの負けです。提出期限までに画像が提出されませんでした。"}
            </p>
          )}
        </div>
      )}
      <h2>今回のお題</h2>
      <img src={battle.topic.imageUrl} alt="再現するお題のイラスト" />
      <p>制限時間: {battle.settings.durationSeconds}秒</p>
      {!battle.mySubmission &&
        !battle.result &&
        (!battle.generationClosed ? (
          <BattleTimer
            key={`generation:${battle.serverTime}`}
            serverTime={battle.serverTime}
            deadline={battle.generationEndsAt}
            label="生成の残り時間"
          />
        ) : battle.selectionEndsAt !== null ? (
          <BattleTimer
            key={`selection:${battle.serverTime}`}
            serverTime={battle.serverTime}
            deadline={battle.selectionEndsAt}
            label="提出までの残り時間"
          />
        ) : (
          <p role="status">
            受付済みの生成処理の終了を待っています。終了後に画像を選ぶ猶予が始まります。
          </p>
        ))}
      {battle.mySubmission?.status === "submitted" ? (
        <p role="status">提出済みです。画像は変更できません。</p>
      ) : battle.mySubmission?.status === "not-submitted" ? (
        <p role="status">提出期限を過ぎたため、未提出になりました。</p>
      ) : (
        <>
          {battle.generationClosed && (
            <p role="status">生成時間が終了しました。提出する画像を選んでください。</p>
          )}
          <h2>あなたの生成履歴</h2>
          {battle.myGenerations.some((item) => item.status === "pending") && (
            <p>画像を生成しています。</p>
          )}
          {battle.myGenerations.some((item) => item.status === "failed") && (
            <p>生成できなかった画像があります。失敗は生成回数に含みません。</p>
          )}
          {images.length === 0 ? (
            <p>生成した画像はありません。</p>
          ) : (
            <form
              onSubmit={async (event) => {
                event.preventDefault();
                if (!selected || pending) return;
                setPending(true);
                setError("");
                try {
                  await submitBattleImage({
                    data: { code, battleId: battle.id, generationId: selected },
                  });
                } catch {
                  setError("提出できませんでした。接続と提出期限を確認してください。");
                } finally {
                  setPending(false);
                }
              }}
            >
              <fieldset disabled={pending || !connected}>
                <legend>提出する画像を1枚選択</legend>
                {images.map((item, index) => (
                  <label key={item.id}>
                    <input
                      type="radio"
                      name="submission"
                      value={item.id}
                      checked={selected === item.id}
                      onChange={() => setSelected(item.id)}
                    />
                    <img src={item.imageUrl} alt={`生成した画像 ${index + 1}`} />
                  </label>
                ))}
                <p>提出後は変更できません。</p>
                <Button type="submit" disabled={!selected || pending || !connected}>
                  {pending ? "提出中…" : "選んだ画像を提出"}
                </Button>
              </fieldset>
            </form>
          )}
        </>
      )}
      {battle.submissionsClosed && <p role="status">全員の提出受付が終了しました。</p>}
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
