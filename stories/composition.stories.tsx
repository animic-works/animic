import { Lead } from "@animic/react/lead";
import { SectionNavigation } from "@animic/react/section-navigation";
import { MediaObject } from "@animic/react/media-object";
import { Grid } from "@animic/react/grid";
import { Split } from "@animic/react/split";
import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Container } from "@animic/react/container";
import { Stack } from "@animic/react/stack";
import { Cluster } from "@animic/react/cluster";
import { Surface } from "@animic/react/surface";
import { Heading } from "@animic/react/heading";
import { Text } from "@animic/react/text";
import { Button } from "@animic/react/button";
import { ButtonLink, Link } from "@animic/react/link";
import { Dialog } from "@animic/react/dialog";
import { Field } from "@animic/react/field";
import { CodeInput } from "@animic/react/code-input";
import { Meter } from "@animic/react/meter";
import { OutputPanel, OutputTags } from "@animic/react/output-panel";
import { Notice } from "@animic/react/notice";
import { Podium } from "@animic/react/podium";
import { Popover } from "@animic/react/popover";
import { Avatar } from "@animic/react/avatar";
import { Page } from "@animic/react/page";
import { Section } from "@animic/react/section";
import { ActionGroup } from "@animic/react/action-group";
import { ImagePair, ImagePairItem } from "@animic/react/image-pair";
import { NavigationBar, NavigationBarLabel } from "@animic/react/navigation-bar";
import { Layer, LayerItem } from "@animic/react/layer";
import { Carousel, CarouselViewport, CarouselItem, CarouselControls } from "@animic/react/carousel";

const meta = { title: "Composition", parameters: { layout: "fullscreen" } } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
export const Actions: Story = {
  render: () => (
    <Container size="wide">
      <Stack space="section">
        <Heading level={1} size="hero">
          その一枚に、
        </Heading>
        <Text variant="eyebrow">HOW TO PLAY</Text>
        <Cluster>
          <Button appearance="primary" size="hero" shape="pill" prominence="raised">
            スタート
          </Button>
          <Button appearance="secondary" size="hero" shape="pill">
            ルームに参加する
          </Button>
        </Cluster>
        <Cluster>
          <Button appearance="primary" shape="pill">
            参加する
          </Button>
          <Button appearance="primary" size="nav" shape="pill" prominence="lifted">
            スタート
          </Button>
        </Cluster>
        <Cluster>
          <ButtonLink
            appearance="primary"
            size="hero"
            shape="pill"
            prominence="raised"
            href="#example"
          >
            作品を見る
          </ButtonLink>
          <ButtonLink appearance="secondary" size="hero" shape="pill" href="#example">
            詳しく見る
          </ButtonLink>
        </Cluster>
        <Cluster>
          <Button appearance="primary" size="hero" shape="pill" prominence="raised" disabled>
            無効な操作
          </Button>
          <Button appearance="primary" size="hero" shape="pill" prominence="raised" loading>
            処理中
          </Button>
        </Cluster>
        <Cluster>
          <Link appearance="navigation" href="#example" aria-current="location">
            遊び方
          </Link>
          <Button appearance="secondary" size="nav" shape="pill">
            ルームに参加
          </Button>
          <Link appearance="quiet" href="#example">
            利用規約
          </Link>
        </Cluster>
        <Text variant="numeric.supporting">24</Text>
        <Text>
          大事な部分を<Text emphasis="highlight">強調します。</Text>
        </Text>
      </Stack>
    </Container>
  ),
};
function InputExample() {
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
  const error = /[^A-Z0-9]/.test(value) ? "英数字で入力してください" : undefined;
  const input = (
    <Field label="確認コード" description="8文字で入力してください" error={error}>
      <CodeInput
        length={8}
        value={value}
        onChange={(event) => setValue(event.target.value.toUpperCase().slice(0, 8))}
      />
    </Field>
  );
  return (
    <Container size="reading">
      <Stack>
        <Heading level={1} size="lg">
          コード入力
        </Heading>
        {input}
        <Field label="無効なコード" disabled>
          <CodeInput length={8} value="ABCD2345" onChange={() => {}} />
        </Field>
        <Field label="参照専用のコード" readOnly>
          <CodeInput length={8} value="EFGH6789" onChange={() => {}} size="compact" />
        </Field>
        <Button onClick={() => setOpen(true)}>入力を開く</Button>
        <Dialog
          open={open}
          onOpenChange={setOpen}
          title="コードを入力"
          size="compact"
          titleAlign="center"
        >
          {input}
        </Dialog>
      </Stack>
    </Container>
  );
}
export const CodeEntry: Story = { render: () => <InputExample /> };
function PopoverExample() {
  const [open, setOpen] = useState(false);
  return (
    <Container size="reading">
      <Stack>
        <Heading level={1} size="lg">
          プロフィール
        </Heading>
        <Popover
          open={open}
          onOpenChange={setOpen}
          label="プロフィールを開く"
          title="プロフィール"
          trigger={<Avatar name="あにみく" fallback="あ" size="compact" badge="✓" />}
        >
          <Stack>
            <Text>表示名と関連情報</Text>
            <Meter label="達成率" value={87.5} />
            <Button onClick={() => setOpen(false)}>閉じる</Button>
          </Stack>
        </Popover>
        <Link href="#outside">外側のリンク</Link>
      </Stack>
    </Container>
  );
}
export const FloatingContent: Story = { render: () => <PopoverExample /> };
function CarouselExample() {
  const [index, setIndex] = useState(0);
  return (
    <Container size="reading">
      <Stack>
        <Heading level={1} size="lg">
          手順
        </Heading>
        <Carousel label="手順の一覧" count={4} index={index} onIndexChange={setIndex}>
          <CarouselViewport preview>
            {["集まる", "選ぶ", "作る", "比べる"].map((title, item) => (
              <CarouselItem key={title} index={item}>
                <Surface appearance="card" accent="primary">
                  <Stack>
                    <Text variant="numeric.ordinal">{item + 1}</Text>
                    <Heading level={2} size="card">
                      {title}
                    </Heading>
                    <Text>内容を確認して次の手順へ進みます。</Text>
                    <Link href="#example">詳しく見る</Link>
                  </Stack>
                </Surface>
              </CarouselItem>
            ))}
          </CarouselViewport>
          <CarouselControls itemLabel="手順" />
        </Carousel>
        <Meter label="再現度" value={92.4} />
      </Stack>
    </Container>
  );
}
export const Slides: Story = { render: () => <CarouselExample /> };

function PageExample() {
  const [snap, setSnap] = useState(true);
  const [hidden, setHidden] = useState(false);
  return (
    <Page scroll={snap ? "sections" : "continuous"}>
      <NavigationBar
        label="ページ内の案内"
        brand={<Text variant="label">Animic</Text>}
        compactHidden={hidden}
        actions={
          <Button appearance="secondary" size="nav" shape="pill">
            参加する
          </Button>
        }
      >
        <Link appearance="navigation" href="#page-start">
          はじめに
        </Link>
        <Link appearance="navigation" href="#page-images">
          比較
        </Link>
      </NavigationBar>
      <Section id="page-start" aria-labelledby="page-title">
        <Stack>
          <Heading id="page-title" level={1} size="lg">
            ページの構成
          </Heading>
          <Text as="p">内容が画面よりも長い場合は、通常のスクロールで読み進められます。</Text>
          <ActionGroup layout="paired">
            <Button appearance="primary" size="hero" shape="pill" prominence="raised">
              はじめる
            </Button>
            <Button appearance="secondary" size="hero" shape="pill">
              内容を確認する
            </Button>
          </ActionGroup>
          <ActionGroup>
            <Button onClick={() => setSnap(!snap)}>区切りで止まる動作を切り替える</Button>
            <Button onClick={() => setHidden(!hidden)}>狭い画面の案内を切り替える</Button>
          </ActionGroup>
        </Stack>
      </Section>
      <Section id="page-images" aria-labelledby="page-images-title">
        <Stack>
          <Heading id="page-images-title" level={2} size="lg">
            2枚を比較する
          </Heading>
          <ImagePair>
            <Surface appearance="primary">
              <Text>お題の画像</Text>
            </Surface>
            <Surface appearance="secondary">
              <Text>提出された画像</Text>
            </Surface>
          </ImagePair>
        </Stack>
      </Section>
    </Page>
  );
}
export const PageLayout: Story = { render: () => <PageExample /> };

function Arrow() {
  return (
    <svg width="12" height="20" viewBox="0 0 12 20">
      <path d="m2 2 8 8-8 8" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function ResponsiveActionsExample() {
  const [count, setCount] = useState(0);
  return (
    <Section height="content">
      <Stack space="section">
        <Heading level={1} size="fluid">
          作品の
          <Text variant="inherit" tone="primary">
            比較
          </Text>
        </Heading>
        <Text variant="eyebrow" tone="secondary">
          合計<Text variant="inherit">{count}</Text>
        </Text>
        <Text>
          説明の
          <Text variant="inherit" emphasis="strong">
            大事な部分
          </Text>
          を強調します。
        </Text>
        <ActionGroup layout="adaptive">
          <Button
            appearance="primary"
            size="hero"
            shape="pill"
            prominence="raised"

            trailingIcon={<Arrow />}
            onClick={() => setCount(count + 1)}
          >
            選択する
          </Button>
          <Button
            appearance="secondary"
            size="hero"
            shape="pill"

            trailingIcon={<Arrow />}
            onClick={() => setCount(count - 1)}
          >
            選択を戻す
          </Button>
        </ActionGroup>
        <ActionGroup layout="adaptive">
          <Button
            appearance="primary"
            size="hero"
            shape="pill"
            prominence="raised"

            disabled
          >
            無効な選択
          </Button>
          <Button
            appearance="secondary"
            size="hero"
            shape="pill"

            loading
          >
            保存中
          </Button>
        </ActionGroup>
      </Stack>
    </Section>
  );
}
export const ResponsiveActions: Story = { render: () => <ResponsiveActionsExample /> };

export const Layers: Story = {
  render: () => (
    <Page>
      <NavigationBar
        label="作品の案内"
        brand={<Text variant="label">Animic</Text>}
        primaryActions={
          <Button appearance="secondary" size="nav" shape="pill">
            選ぶ
          </Button>
        }
        actions={
          <Link appearance="navigation" href="#profile" aria-label="プロフィール">
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
              <circle cx="8" cy="4" r="3" fill="currentColor" />
              <path d="M1 16a7 7 0 0 1 14 0" fill="currentColor" />
            </svg>
            <NavigationBarLabel>プロフィール</NavigationBarLabel>
          </Link>
        }
      >
        <Link appearance="navigation" href="#layers">
          作品を見る
        </Link>
      </NavigationBar>
      <Section id="layers" align="stretch" inset="navigation">
        <Layer layout="adaptive" data-testid="layers">
          <LayerItem placement="background">
            <svg width="100%" height="100%" aria-hidden="true">
              <path d="M0 0 800 600" stroke="#e6e8ec" />
            </svg>
          </LayerItem>
          <LayerItem placement="content">
            <Heading level={1} size="lg">
              作品と説明を重ねる
            </Heading>
          </LayerItem>
          <LayerItem placement="artwork">
            <svg width="160" height="160" viewBox="0 0 160 160" aria-hidden="true">
              <path d="m80 0 20 60 60 20-60 20-20 60-20-60L0 80l60-20Z" fill="#00b4fc" />
            </svg>
          </LayerItem>
          <LayerItem placement="content">
            <Text as="p">縦に並ぶ場合も、内容と操作の順序を維持します。</Text>
            <Button>内容を確認</Button>
          </LayerItem>
        </Layer>
      </Section>
    </Page>
  ),
};

function ContentLayoutExample() {
  const [current, setCurrent] = useState("overview");
  return (
    <Section height="content" align="start">
      <SectionNavigation
        label="内容の案内"
        current={current}
        onNavigate={setCurrent}
        items={[
          { id: "overview", label: "概要", href: "#overview" },
          { id: "details", label: "詳細", href: "#details" },
        ]}
      />
      <Stack space="spacious">
        <Split
          data-testid="content-split"
          layout="aside-main"
          collapseOrder="reverse"
          space="section"
          header={
            <Heading level={1} size="section">
              作品の比較
            </Heading>
          }
        >
          <Surface appearance="card">
            <Meter label="一致率" value={92} />
          </Surface>
          <ImagePair>
            <ImagePairItem label="お題">
              <Surface appearance="secondary">
                <Text>参照する作品</Text>
              </Surface>
            </ImagePairItem>
            <ImagePairItem label="提出">
              <Surface appearance="primary">
                <Text>比較する作品</Text>
              </Surface>
            </ImagePairItem>
          </ImagePair>
        </Split>
        <Grid data-testid="single-grid" columns={3} collapse="single" space="section">
          {["pink", "cyan", "violet"].map((palette) => (
            <Surface key={palette} appearance="card" accent="primary">
              <MediaObject
                layout="adaptive"
                media={
                  <Avatar
                    name="参加者"
                    palette={palette === "pink" ? "pink" : palette === "cyan" ? "cyan" : "violet"}
                    fallback="あ"
                    ring
                  />
                }
              >
                <Text as="p">画像と説明を画面の幅に合わせて配置します。</Text>
              </MediaObject>
            </Surface>
          ))}
        </Grid>
        <Cluster data-testid="adaptive-cluster" layout="adaptive" justify="between" space="normal">
          <Avatar name="緑のアバター" palette="green" fallback="あ" />
          <Avatar name="黄のアバター" palette="yellow" fallback="あ" />
          <Avatar name="橙のアバター" palette="orange" fallback="あ" />
          <Avatar name="濃色のアバター" palette="ink" fallback="あ" />
          <Avatar name="標準のアバター" palette="brand" fallback="あ" />
        </Cluster>
      </Stack>
    </Section>
  );
}
export const ContentLayout: Story = { render: () => <ContentLayoutExample /> };

export const IntrinsicMedia: Story = {
  render: () => (
    <Section height="content" align="start">
      <Stack space="section">
        <Split
          layout="content-intrinsic"
          collapseOrder="reverse"
          space="section"
          header={
            <Heading level={1} size="section">
              作品を比較する
            </Heading>
          }
        >
          <Surface appearance="card">
            <Stack>
              <Text>画像の縦横比を保ち、説明に使える幅を確保します。</Text>
              <Meter label="一致率" value={92} />
            </Stack>
          </Surface>
          <Surface appearance="card" padding="md">
            <ImagePair sizing="intrinsic">
              <ImagePairItem label="お題">
                <svg width="208" height="304" viewBox="0 0 208 304" aria-hidden="true">
                  <rect width="208" height="304" rx="16" fill="#dff7ff" />
                  <circle cx="104" cy="152" r="48" fill="#00b4fc" />
                </svg>
              </ImagePairItem>
              <ImagePairItem label="提出">
                <svg width="208" height="304" viewBox="0 0 208 304" aria-hidden="true">
                  <rect width="208" height="304" rx="16" fill="#ffe3f0" />
                  <circle cx="104" cy="152" r="44" fill="#ff2d87" />
                </svg>
              </ImagePairItem>
            </ImagePair>
          </Surface>
        </Split>
        <Surface appearance="adaptive" padding="md" data-testid="adaptive-surface">
          <Cluster justify="center">
            <Text variant="label.fluid">画像と説明を確認してください。</Text>
          </Cluster>
        </Surface>
      </Stack>
    </Section>
  ),
};

export const Introduction: Story = {
  render: () => (
    <Container size="reading">
      <Stack space="section">
        <Heading level={1} size="section">
          画像で遊ぼう
        </Heading>
        <Lead
          conclusion={
            <>
              思い描いた一枚を<mark>形にしよう。</mark>
            </>
          }
        >
          <span>言葉を組み合わせて、</span>
          <span>
            <strong>AIと一緒に</strong>
          </span>
          <span>イラストを作ろう。</span>
        </Lead>
        <Button appearance="primary" size="hero" shape="pill" prominence="raised" feedback="press">
          試してみる
        </Button>
      </Stack>
    </Container>
  ),
};

export const Notices: Story = {
  render: () => (
    <Container size="reading">
      <Stack space="section">
        <Notice
          title="内容を保存できます"
          icon="↑"
          actions={
            <Button appearance="inverse" shape="pill" leadingIcon={<Arrow />}>
              保存する
            </Button>
          }
        >
          保存した内容はあとから確認できます。
        </Notice>
        <Notice
          tone="success"
          title="保存しました"
          icon="✓"
          actions={
            <Link appearance="inverse" href="#saved">
              保存先を見る
            </Link>
          }
        >
          この内容を保存先で確認できます。
        </Notice>
        <Notice tone="neutral" density="compact" title="説明を確認する" icon="i">
          関連する操作と補足情報をまとめて案内します。
        </Notice>
        <Notice tone="danger" density="compact">
          操作を完了できませんでした。もう一度お試しください。
        </Notice>
        <ActionGroup layout="responsive" align="center">
          <Button shape="pill">続ける</Button>
          <Button appearance="inverse" shape="pill">
            内容を共有する
          </Button>
          <Button appearance="secondary" shape="pill">
            一覧に戻る
          </Button>
        </ActionGroup>
      </Stack>
    </Container>
  ),
};

export const SmallPodiums: Story = {
  render: () => (
    <Container size="reading">
      <Stack space="section">
        {[1, 2, 3].map((count) => (
          <Podium
            key={count}
            items={Array.from({ length: count }, (_, i) => ({
              id: String(i),
              src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='130' height='190'%3E%3Crect width='130' height='190' fill='%23e7f7ff'/%3E%3C/svg%3E",
              label: `作品${i + 1}`,
              name: `参加者${i + 1}`,
              value: 100 - i * 5,
              rank: i + 1,
            }))}
          />
        ))}
      </Stack>
    </Container>
  ),
};

export const DataOutputs: Story = {
  render: () => (
    <Container size="narrow">
      <Stack>
        <OutputPanel title="検出した特徴" value="80%">
          <OutputTags
            groups={["入力 A", "入力 B"].map((label) => ({
              label,
              items: Array.from({ length: 30 }, (_, i) => ({
                label: `特徴 ${i + 1}`,
                value: "0.85",
                highlighted: i % 3 === 0,
              })),
            }))}
          />
        </OutputPanel>
        <OutputPanel title="評価の内訳">
          <Stack space="tight">
            <Meter
              appearance="inverse"
              presentation="row"
              tone="success"
              label="一致度"
              description="特徴量・×0.50"
              value={80}
            />
            <Meter
              appearance="inverse"
              presentation="row"
              tone="secondary"
              label="信頼度"
              description="評価値・×0.50"
              value={72}
            />
          </Stack>
        </OutputPanel>
      </Stack>
    </Container>
  ),
};
