import type { Meta, StoryObj } from "@storybook/react-vite";

import { Icon } from "../icon/icon";
import { GalleryCarousel, GallerySection, SiteFooter } from "./gallery";
import { Hero } from "./hero";
import { AppBar, CornerLogo, LandingNav, NavCta, NavLogin, Pager } from "./landing-nav";
import { LandingScreen, Reveal, SectionHead } from "./landing-screen";
import {
  ScoreCardBody,
  ScoreCardItem,
  ScoreCardList,
  ScoreHead,
  ScoreSection,
  ScoreTotal,
} from "./score-cards";
import { StepCarousel, StepSection } from "./step-carousel";

const meta = {
  title: "Screens/Landing",
  parameters: { layout: "fullscreen" },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const NAV_ITEMS = [
  { id: "top", label: "ホーム" },
  { id: "how", label: "遊び方" },
  { id: "score", label: "採点方法" },
  { id: "gallery", label: "ギャラリー" },
];
const LABELS = NAV_ITEMS.map((item) => item.label);

function Nav({ currentId }: { currentId: string }) {
  return (
    <LandingNav
      items={NAV_ITEMS}
      currentId={currentId}
      onSelect={() => {}}
      actions={
        <>
          <NavCta
            kind="start"
            href="#start"
            icon={<Icon name="play" size="xs" />}
            onClick={(event) => event.preventDefault()}
          >
            スタート
          </NavCta>
          <NavCta
            kind="join"
            href="#join"
            icon={<Icon name="enter" size="md" />}
            onClick={(event) => event.preventDefault()}
          >
            ルームに参加
          </NavCta>
        </>
      }
      account={<NavLogin onClick={() => {}} />}
    />
  );
}

// ホーム: 右側の帯とキャラクター、ロゴ、キャッチコピー、2つのボタン
export const Home: Story = {
  render: () => (
    <>
      <Nav currentId="top" />
      <LandingScreen id="top" kind="hero" active aria-label="ホーム">
        <Hero
          logoSrc="/animic-logo.svg"
          characterSrc="/hero-character.webp"
          title={
            <>
              <span>
                その<b>一枚</b>に、
              </span>
              <span>
                どこまで<em>近づける</em>？
              </span>
            </>
          }
          lead={
            <>
              <span>お題のイラストを、</span>
              <span>プロンプトだけで</span>
              <span>AIに再現させよう。</span>
              <br />
              <span>より近い1枚を</span>
              <span>作ったほうが勝ち！</span>
            </>
          }
          onStart={() => {}}
          onJoin={() => {}}
          onNext={() => {}}
        />
      </LandingScreen>
    </>
  ),
};

// 遊び方: 中央のカードを大きく見せるカルーセル（1枚目は挿絵）
export const HowToPlay: Story = {
  render: () => (
    <>
      <Nav currentId="how" />
      <AppBar
        logoSrc="/animic-logo.svg"
        shown
        onHome={(event) => event.preventDefault()}
        onStart={() => {}}
        onJoin={() => {}}
        account={<NavLogin compact onClick={() => {}} />}
      />
      <LandingScreen id="how" kind="how" active aria-labelledby="how-title">
        <StepSection>
          <StepCarousel
            titleId="how-title"
            head={
              <Reveal delay="0">
                <SectionHead eyebrow="HOW TO PLAY" title="遊び方" titleId="how-title" />
              </Reveal>
            }
            steps={[
              {
                title: "ルームに集まる",
                description:
                  "「スタート」でルームを作って、相手を招待できます。ルーム作成画面で難易度と制限時間を設定することができます。",
                image: { src: "/how-step-1.webp", width: 1600, height: 1095 },
                tint: "cyan",
              },
              {
                title: "お題が公開される",
                description: "ゲームを開始すると、難易度に応じてお題のイラストが公開されます。",
                icon: "image",
                tint: "pink",
              },
              {
                title: "プロンプトで生成",
                description:
                  "日本語の文章でOK。よく使う表現は選択肢から、慣れたらDanbooruタグでも。時間内なら何度でも生成できます。",
                icon: "prompt",
                tint: "yellow",
              },
              {
                title: "1枚を提出して勝負",
                description:
                  "生成した中からいちばん似ている1枚を提出。AIが採点して、最終スコアの高いほうが勝ちです。",
                icon: "trophy",
                tint: "cyan",
              },
            ]}
          />
        </StepSection>
      </LandingScreen>
    </>
  ),
};

// 採点方法: 3枚のカードと合計の式
export const Score: Story = {
  render: () => (
    <LandingScreen id="score" kind="score" active aria-labelledby="score-title">
      <ScoreSection>
        <ScoreHead>
          <SectionHead
            eyebrow="SCORE"
            title="採点方法"
            titleId="score-title"
            description="3つの要素を合わせた最終スコアで勝敗が決まります。"
          />
        </ScoreHead>
        <ScoreCardList>
          {(
            [
              {
                title: "再現度",
                description:
                  "お題にどれだけ近いかをAIが評価します。スコアのいちばん大きな要素です。",
                icon: "target",
                tint: "pink",
              },
              {
                title: "提出速度",
                description:
                  "制限時間内に早く提出するほど加点されます。時間切れ後の提出は加点なし。",
                icon: "stopwatch",
                tint: "cyan",
              },
              {
                title: "生成回数",
                description: "提出までに成功した生成の回数。少ない回数で仕上げるほど有利です。",
                icon: "refresh",
                tint: "yellow",
              },
            ] as const
          ).map((card) => (
            <ScoreCardItem key={card.title} card={card}>
              <ScoreCardBody card={card} />
            </ScoreCardItem>
          ))}
        </ScoreCardList>
        <ScoreTotal terms={["再現度", "提出速度", "生成回数"]} result="最終スコア" />
      </ScoreSection>
    </LandingScreen>
  ),
};

// ギャラリー: 対戦を1つずつ見せるカルーセルとフッター。左上のロゴと右端の現在位置も出す
export const Gallery: Story = {
  render: () => (
    <>
      <Nav currentId="gallery" />
      <CornerLogo
        src="/animic-logo.svg"
        href="#top"
        shown
        onClick={(event) => event.preventDefault()}
      />
      <Pager labels={LABELS} current={3} onSelect={() => {}} />
      <LandingScreen id="gallery" kind="gallery" active aria-labelledby="gallery-title">
        <GallerySection>
          <GalleryCarousel
            head={
              <SectionHead
                eyebrow="GALLERY"
                title="ギャラリー"
                titleId="gallery-title"
                description="みんなの対戦をのぞいてみよう。お題と提出された1枚を並べて見られます。"
              />
            }
            matches={[
              {
                level: "かんたん",
                rule: "背景なし・1キャラクター",
                similarity: 92,
                tints: ["cyan", "pink"],
              },
              {
                level: "ふつう",
                rule: "背景あり・1キャラクター",
                similarity: 85,
                tints: ["yellow", "cyan"],
              },
              {
                level: "むずかしい",
                rule: "背景あり・2キャラクター",
                similarity: 78,
                tints: ["pink", "yellow"],
              },
            ]}
          />
          <SiteFooter
            logoSrc="/animic-logo.svg"
            links={[
              { href: "#terms", label: "利用規約" },
              { href: "#privacy", label: "プライバシーポリシー" },
            ]}
            copyright="© 2026 Animic"
          />
        </GallerySection>
      </LandingScreen>
    </>
  ),
};
