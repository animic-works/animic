import { Footer } from "@animic/react/footer";
import { HomeReveal } from "./visuals/home-reveal";
import { Badge } from "@animic/react/badge";
import { Carousel, CarouselControls, CarouselItem, CarouselViewport } from "@animic/react/carousel";
import { Center } from "@animic/react/center";
import { Cluster } from "@animic/react/cluster";
import { Grid } from "@animic/react/grid";
import { Heading } from "@animic/react/heading";
import { Separator } from "@animic/react/separator";
import { ImagePair, ImagePairItem } from "@animic/react/image-pair";
import { Link } from "@animic/react/link";
import { MediaObject } from "@animic/react/media-object";
import { Meter } from "@animic/react/meter";
import { Section } from "@animic/react/section";
import { Split } from "@animic/react/split";
import { Stack } from "@animic/react/stack";
import { Surface } from "@animic/react/surface";
import { Text } from "@animic/react/text";
import { steps, scoring } from "./home-content";
import { ScoreIcon } from "./home-icons";
import { matches } from "./home-samples";
import { HowBackdrop, Logo, SampleArtwork, StepArtwork } from "./visuals/home-artwork";

export function HowToPlay({
  index,
  onIndexChange,
}: {
  index: number;
  onIndexChange: (index: number) => void;
}) {
  return (
    <Section
      inset="navigation"
      align="start"
      id="how"
      aria-labelledby="how-title"
      decoration={<HowBackdrop />}
    >
      <Stack>
        <HomeReveal>
          <Stack space="compact">
            <Text variant="eyebrow" tone="accent">
              HOW TO PLAY
            </Text>
            <Heading id="how-title" level={2} size="section">
              遊び方
            </Heading>
          </Stack>
        </HomeReveal>
        <HomeReveal order={1}>
          <Carousel
            label="遊び方の手順"
            count={steps.length}
            index={index}
            onIndexChange={onIndexChange}
          >
            <Stack space="section">
              <CarouselViewport preview>
                {steps.map((step, item) => (
                  <CarouselItem key={step.title} index={item}>
                    <Surface appearance="illustrated" padding="frame">
                      <Split layout="content-media" collapseOrder="reverse" space="compact">
                        <Center>
                          <Surface padding="inset">
                            <Stack space="fluid">
                              <Text variant="numeric.ordinal" tone="accent">
                                {item + 1}
                                <Text variant="numeric.fraction" tone="subtle">
                                  {" "}
                                  / {steps.length}
                                </Text>
                              </Text>
                              <Heading level={3} size="illustrated">
                                {step.title}
                              </Heading>
                              <Text as="p" variant="body.detail" tone="supporting">
                                {step.description}
                              </Text>
                            </Stack>
                          </Surface>
                        </Center>
                        <StepArtwork kind={step.illustration} />
                      </Split>
                    </Surface>
                  </CarouselItem>
                ))}
              </CarouselViewport>
              <CarouselControls itemLabel="手順" placement="sides" />
            </Stack>
          </Carousel>
        </HomeReveal>
      </Stack>
    </Section>
  );
}

export function Scoring() {
  return (
    <Section inset="navigation" align="start" id="score" aria-labelledby="score-title">
      <Stack space="spacious">
        <HomeReveal>
          <Stack space="compact">
            <Text variant="eyebrow" tone="accent">
              SCORE
            </Text>
            <Heading id="score-title" level={2} size="section">
              採点方法
            </Heading>
            <Text as="p" variant="body.detail" tone="supporting">
              3つの要素を合わせた最終スコアで勝敗が決まります。
            </Text>
          </Stack>
        </HomeReveal>
        <div role="list">
          <Grid columns={3} space="section" collapse="single">
            {scoring.map((item, index) => (
              <div key={item.title} role="listitem">
                <HomeReveal order={index === 0 ? 1 : index === 1 ? 2 : 3}>
                  <Surface appearance="card" accent={item.tone} padding="section">
                    <MediaObject
                      layout="stacked"
                      media={
                        <Surface appearance={item.tone} padding="sm">
                          <Center>
                            <ScoreIcon kind={item.icon} />
                          </Center>
                        </Surface>
                      }
                    >
                      <Stack space="compact">
                        <Heading level={3} size="card">
                          {item.title}
                        </Heading>
                        <Text as="p" variant="body.detail" tone="supporting">
                          {item.description}
                        </Text>
                      </Stack>
                    </MediaObject>
                  </Surface>
                </HomeReveal>
              </div>
            ))}
          </Grid>
        </div>
        <HomeReveal order={4}>
          <Surface appearance="adaptive" padding="narrow-only">
            <Cluster justify="center" space="compact">
              <Text as="p" variant="label.fluid">
                再現度 ＋ 提出速度 ＋ 生成回数 ＝
              </Text>
              <Badge tone="inverse" size="md">
                最終スコア
              </Badge>
            </Cluster>
          </Surface>
        </HomeReveal>
      </Stack>
    </Section>
  );
}

export function Gallery({
  index,
  onIndexChange,
}: {
  index: number;
  onIndexChange: (index: number) => void;
}) {
  const match = matches[index];
  return (
    <Section
      inset="navigation"
      align="start"
      id="gallery"
      aria-labelledby="gallery-title"
      footer={
        <Footer>
          <Stack space="compact">
            <Cluster justify="between" layout="adaptive" space="compact">
              <Logo size="footer" />
              <nav aria-label="規約">
                <Cluster space="normal">
                  <Link appearance="quiet" href="/terms">
                    利用規約
                  </Link>
                  <Link appearance="quiet" href="/privacy">
                    プライバシーポリシー
                  </Link>
                </Cluster>
              </nav>
            </Cluster>
            <Center>
              <Text variant="caption" tone="subtle">
                © 2026 Animic
              </Text>
            </Center>
          </Stack>
        </Footer>
      }
    >
      <Stack space="section">
        <Carousel
          label="みんなの対戦"
          count={matches.length}
          index={index}
          onIndexChange={onIndexChange}
        >
          <Split
            layout="content-intrinsic"
            collapseOrder="reverse"
            space="section"
            header={
              <HomeReveal fill>
                <Stack space="compact" fill justify="between">
                  <Text variant="eyebrow" tone="accent">
                    GALLERY
                  </Text>
                  <Heading id="gallery-title" level={2} size="section">
                    ギャラリー
                  </Heading>
                  <Text as="p" variant="body.detail" tone="supporting">
                    みんなの対戦をのぞいてみよう。お題と提出された1枚を並べて見られます。
                  </Text>
                </Stack>
              </HomeReveal>
            }
          >
            <HomeReveal order={1}>
              <Surface appearance="card" padding="content">
                <Stack>
                  <Cluster justify="between">
                    <Text variant="numeric.counter" tone="accent">
                      {index + 1}
                      <Text variant="numeric.fraction" tone="subtle">
                        {" "}
                        / {matches.length}
                      </Text>
                    </Text>
                    <CarouselControls itemLabel="対戦" />
                  </Cluster>
                  <div aria-live="polite" aria-atomic="true">
                    <Stack space="compact">
                      <Badge tone="surface" shape="rounded">
                        {match.level}
                      </Badge>
                      <Heading level={3} size="card">
                        {match.rule}
                      </Heading>
                    </Stack>
                  </div>
                  <Stack space="compact">
                    <Separator appearance="dashed" />
                    <Meter label="再現度" value={match.score} />
                  </Stack>
                </Stack>
              </Surface>
            </HomeReveal>
            <CarouselViewport transition="replace">
              <CarouselItem index={index}>
                <Surface appearance="card" padding="frame">
                  <HomeReveal order={1} fill>
                    <Stack fill justify="center">
                      <ImagePair sizing="intrinsic">
                        <ImagePairItem label="お題">
                          <SampleArtwork tint={match.topic} />
                        </ImagePairItem>
                        <ImagePairItem label="提出">
                          <SampleArtwork tint={match.shot} />
                        </ImagePairItem>
                      </ImagePair>
                    </Stack>
                  </HomeReveal>
                </Surface>
              </CarouselItem>
            </CarouselViewport>
          </Split>
        </Carousel>
      </Stack>
    </Section>
  );
}
