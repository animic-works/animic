import { Fragment } from "react";
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
import { Meter } from "@animic/react/meter";
import { Section } from "@animic/react/section";
import { Split } from "@animic/react/split";
import { Stack } from "@animic/react/stack";
import { Surface } from "@animic/react/surface";
import { Text } from "@animic/react/text";
import { scoringMetrics } from "../scoring/scoring-metrics";
import { scoringSteps, steps } from "./home-content";
import { matches } from "./home-samples";
import {
  HowBackdrop,
  Logo,
  SampleArtwork,
  ScoreArtwork,
  ScoreWeightSwatch,
  ScoreWeightsBar,
  StepArtwork,
} from "./visuals/home-artwork";

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
      <Stack>
        <HomeReveal>
          <Stack space="compact">
            <Text variant="eyebrow" tone="accent">
              SCORE
            </Text>
            <Heading id="score-title" level={2} size="section">
              採点方法
            </Heading>
          </Stack>
        </HomeReveal>
        <div role="list">
          <Grid columns={3} space="section" collapse="single">
            {scoringSteps.map((step, item) => (
              <div key={step.title} role="listitem">
                <HomeReveal order={item === 0 ? 1 : item === 1 ? 2 : 3} fill>
                  <Surface appearance="illustrated" padding="frame" fill>
                    <Stack space="compact">
                      <ScoreArtwork kind={step.illustration} />
                      <Surface padding="inset">
                        <Stack space="compact">
                          <Heading level={3} size="illustrated">
                            {step.title}
                          </Heading>
                          <Text as="p" variant="body.detail" tone="supporting">
                            {step.description}
                          </Text>
                          {!step.upcoming && (
                            <Stack space="compact">
                              <ScoreWeightsBar weights={scoringMetrics} />
                              <Grid columns={2} space="compact" collapse="none">
                                {[scoringMetrics.slice(0, 3), scoringMetrics.slice(3)].map(
                                  (column) => (
                                    <Text key={column[0].key} as="p" variant="caption">
                                      {column.map((metric, index) => (
                                        <Fragment key={metric.key}>
                                          {index > 0 && <br />}
                                          <ScoreWeightSwatch metric={metric.key} />
                                          {`\u00a0${metric.label}\u00a0`}
                                          <Text variant="caption" emphasis="strong">
                                            {metric.weight}%
                                          </Text>
                                        </Fragment>
                                      ))}
                                    </Text>
                                  ),
                                )}
                              </Grid>
                            </Stack>
                          )}
                        </Stack>
                      </Surface>
                    </Stack>
                  </Surface>
                </HomeReveal>
              </div>
            ))}
          </Grid>
        </div>
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
