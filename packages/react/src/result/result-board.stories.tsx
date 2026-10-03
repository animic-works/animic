import type { Meta, StoryObj } from "@storybook/react-vite";

import { Badge } from "../badge/badge";
import { ArtFrame, ArtMissing, ActionRow } from "../battle/battle";
import { Button } from "../button/button";
import { ART_TOPIC, CharacterArt } from "../character-art/character-art";
import { Icon } from "../icon/icon";
import { TopBar } from "../lobby/top-bar";
import { Text } from "../text/text";
import {
  Breakdown,
  MissingNote,
  PlayerCard,
  PlayerTotal,
  PlayerWho,
  ResultBoardGrid,
  ResultBurst,
  ResultMain,
  ResultNote,
  ResultTopic,
  Verdict,
} from "./result-board";

const meta = { title: "Screens/Result", parameters: { layout: "fullscreen" } } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

function Screen({ outcome }: { outcome: "win" | "lose" | "none" }) {
  const titles = {
    win: ["YOU WIN!", "ぴよ丸 さんに勝ちました！"],
    lose: ["YOU LOSE…", "ぴよ丸 さんの勝ちです。次こそは！"],
    none: ["NO GAME", "どちらも提出しなかったため、勝負不成立です"],
  } as const;
  const [title, sub] = titles[outcome];
  return (
    <>
      <ResultBurst />
      <TopBar logoSrc="/animic-logo.svg" logoHref="#top" variant="result">
        <Badge variant="outline">
          ルーム{" "}
          <Text as="code" variant="code">
            K7QX2MPA
          </Text>
        </Badge>
      </TopBar>
      <ResultMain>
        <Verdict
          eyebrow="RESULT"
          title={title}
          sub={sub}
          tone={outcome === "win" ? "win" : "lose"}
        />
        <ResultBoardGrid>
          <PlayerCard winner={outcome === "win"}>
            <PlayerWho name="ねこぜ" role="あなた" player="1" />
            {outcome === "none" ? (
              <ArtFrame variant="missing">
                <ArtMissing>未提出</ArtMissing>
              </ArtFrame>
            ) : (
              <ArtFrame variant="submission">
                <CharacterArt
                  features={{ ...ART_TOPIC, outfit: "hoodie" }}
                  label="ねこぜさんの提出画像"
                />
              </ArtFrame>
            )}
            <PlayerTotal label="最終スコア" value={outcome === "none" ? "—" : "84.6"} />
            {outcome === "none" ? (
              <MissingNote>時間内に提出されませんでした</MissingNote>
            ) : (
              <Breakdown
                rows={[
                  { term: "再現度", percent: 84.6, value: "84.6", tone: "pink" },
                  { term: "提出速度", percent: 45, value: "+9", tone: "cyan" },
                  { term: "生成回数", percent: 60, value: "+9", note: "（3回）", tone: "yellow" },
                ]}
              />
            )}
          </PlayerCard>
          <ResultTopic meta="お題・かんたん・90秒">
            <ArtFrame variant="topicResult" tag="THEME">
              <CharacterArt features={ART_TOPIC} label="お題のイラスト" />
            </ArtFrame>
          </ResultTopic>
          <PlayerCard winner={outcome === "lose"}>
            <PlayerWho name="ぴよ丸" role="対戦相手" player="2" />
            <ArtFrame variant="submission">
              <CharacterArt
                features={{ ...ART_TOPIC, style: "bob", bg: "sky" }}
                label="ぴよ丸さんの提出画像"
              />
            </ArtFrame>
            <PlayerTotal label="最終スコア" value="79.2" />
            <Breakdown
              rows={[
                { term: "再現度", percent: 79.2, value: "79.2", tone: "pink" },
                { term: "提出速度", percent: 25, value: "+5", tone: "cyan" },
                { term: "生成回数", percent: 20, value: "+3", note: "（5回）", tone: "yellow" },
              ]}
            />
          </PlayerCard>
        </ResultBoardGrid>
        <ActionRow>
          <Button size="lg">同じメンバーで再戦</Button>
          <Button variant="inverse" size="lg" leadingIcon={<Icon name="x" size="sm" />}>
            結果をシェア
          </Button>
          <Button variant="secondary" size="lg">
            トップへ戻る
          </Button>
        </ActionRow>
        <ResultNote>
          ※ スコアの計算方法は仮です（再現度＋提出速度の加点＋生成回数の加点）
        </ResultNote>
      </ResultMain>
    </>
  );
}

export const Win: Story = { render: () => <Screen outcome="win" /> };
export const Lose: Story = { render: () => <Screen outcome="lose" /> };
export const NoGame: Story = { render: () => <Screen outcome="none" /> };
