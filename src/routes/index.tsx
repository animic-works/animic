import { Collapsible } from "@base-ui/react/collapsible";
import { createFileRoute } from "@tanstack/react-router";

import { RoomEntry } from "../features/room/room-entry";

import styles from "./-index.module.css";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <main className={styles.page}>
      <p className={styles.eyebrow}>AIイラスト再現バトル</p>
      <h1>Animic</h1>
      <p>お題のイラストを、あなたのプロンプトで再現しよう。</p>
      <RoomEntry />
      <Collapsible.Root>
        <Collapsible.Trigger className={styles.trigger}>遊び方</Collapsible.Trigger>
        <Collapsible.Panel>
          <ol className={styles.steps}>
            <li>お題を見ながら、プロンプトを入力して画像を生成。</li>
            <li>生成履歴から好きな1枚を選んで提出。</li>
            <li>再現度・提出速度・生成回数で勝負。</li>
          </ol>
        </Collapsible.Panel>
      </Collapsible.Root>
    </main>
  );
}
