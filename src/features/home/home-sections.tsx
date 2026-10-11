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
import { getDifficulty } from "../battle/battle-labels";
import { scoringMetrics } from "../scoring/scoring-metrics";
import type { ScoringWeights } from "../scoring/scoring-metrics";
import { howSteps, scoringSteps } from "./home-content";
import type { GalleryItem, HomeItem } from "./home-content";
import {
  HowBackdrop,
  Logo,
  SampleArtwork,
  ScoreArtwork,
  ScoreWeightSwatch,
  ScoreWeightsBar,
  StepArtwork,
} from "./visuals/home-artwork";

// 画像を登録していない項目に出すイラスト・重みのグラフの有無は、項目のIDで決める。
const stepIllustration = (id: string) =>
  howSteps.find((step) => step.id === id)?.illustration ?? "image";
const scoringStep = (id: string) => scoringSteps.find((step) => step.id === id);

export function HowToPlay({
  steps,
  index,
  onIndexChange,
}: {
  steps: HomeItem[];
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
                  <CarouselItem key={step.id} index={item}>
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
                        <StepArtwork kind={stepIllustration(step.id)} src={step.image} />
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

export function Scoring({ steps, weights }: { steps: HomeItem[]; weights: ScoringWeights }) {
  // 採点方法の説明には、管理画面の「採点の重み」で保存した今の重みを出す。
  const metricWeights = scoringMetrics.map((metric) => ({
    ...metric,
    weight: weights[metric.key],
  }));
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
            {steps.map((step, item) => (
              <div key={step.id} role="listitem">
                <HomeReveal order={item === 0 ? 1 : item === 1 ? 2 : 3} fill>
                  <Surface appearance="illustrated" padding="frame" fill>
                    <Stack space="compact">
                      <ScoreArtwork
                        kind={scoringStep(step.id)?.illustration ?? "similarity"}
                        src={step.image}
                      />
                      <Surface padding="inset">
                        <Stack space="compact">
                          <Heading level={3} size="illustrated">
                            {step.title}
                          </Heading>
                          <Text as="p" variant="body.detail" tone="supporting">
                            {step.description}
                          </Text>
                          {scoringStep(step.id)?.upcoming === false && (
                            <Stack space="compact">
                              <ScoreWeightsBar weights={metricWeights} />
                              <Grid columns={2} space="compact" collapse="none">
                                {[metricWeights.slice(0, 3), metricWeights.slice(3)].map(
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
  items,
  index,
  onIndexChange,
}: {
  items: GalleryItem[];
  index: number;
  onIndexChange: (index: number) => void;
}) {
  const match = items[index] ?? items[0];
  const difficulty = match ? getDifficulty(match.difficulty) : null;
  const header = (
    <HomeReveal fill>
      <Stack space="compact" fill justify="between">
        <Text variant="eyebrow" tone="accent">
          GALLERY
        </Text>
        <Heading id="gallery-title" level={2} size="section">
          ギャラリー
        </Heading>
        <Text as="p" variant="body.detail" tone="supporting">
          {match
            ? "みんなの対戦をのぞいてみよう。お題と提出された1枚を並べて見られます。"
            : "対戦の例はまだありません。"}
        </Text>
      </Stack>
    </HomeReveal>
  );
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
        {/* 例が1件もなければ、見出しと案内だけを出す（節とフッターは残す） */}
        {!match || !difficulty ? (
          header
        ) : (
          <Carousel
            label="みんなの対戦"
            count={items.length}
            index={index}
            onIndexChange={onIndexChange}
          >
            <Split
              layout="content-intrinsic"
              collapseOrder="reverse"
              space="section"
              header={header}
            >
              <HomeReveal order={1}>
                <Surface appearance="card" padding="content">
                  <Stack>
                    <Cluster justify="between">
                      <Text variant="numeric.counter" tone="accent">
                        {index + 1}
                        <Text variant="numeric.fraction" tone="subtle">
                          {" "}
                          / {items.length}
                        </Text>
                      </Text>
                      <CarouselControls itemLabel="対戦" />
                    </Cluster>
                    <div aria-live="polite" aria-atomic="true">
                      <Stack space="compact">
                        <Badge tone="surface" shape="rounded">
                          {difficulty.label}
                        </Badge>
                        <Heading level={3} size="card">
                          {difficulty.description}
                        </Heading>
                      </Stack>
                    </div>
                    <Stack space="compact">
                      <Separator appearance="dashed" />
                      <Meter
                        label="再現度"
                        value={match.score}
                        valueText={match.score.toFixed(1)}
                      />
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
                            <SampleArtwork src={match.topicSrc} alt={match.topicAlt} />
                          </ImagePairItem>
                          <ImagePairItem
                            label="提出"
                            detail={
                              <Cluster space="compact">
                                <Text as="p" variant="caption" tone="supporting">
                                  {scoringMetrics.map((metric, row) => (
                                    <Fragment key={metric.key}>
                                      {row > 0 && <br />}
                                      <ScoreWeightSwatch metric={metric.key} />
                                      {`\u00a0${metric.label}`}
                                    </Fragment>
                                  ))}
                                </Text>
                                <Text as="p" variant="caption" emphasis="strong">
                                  {scoringMetrics.map((metric, row) => (
                                    <Fragment key={metric.key}>
                                      {row > 0 && <br />}
                                      {match.metrics[metric.key].toFixed(1)}
                                    </Fragment>
                                  ))}
                                </Text>
                              </Cluster>
                            }
                          >
                            <SampleArtwork src={match.shotSrc} alt={match.shotAlt} />
                          </ImagePairItem>
                        </ImagePair>
                      </Stack>
                    </HomeReveal>
                  </Surface>
                </CarouselItem>
              </CarouselViewport>
            </Split>
          </Carousel>
        )}
      </Stack>
    </Section>
  );
}
