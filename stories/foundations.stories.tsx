import type { Meta, StoryObj } from "@storybook/react-vite";
import { Text } from "@animic/react/text";
import { Heading } from "@animic/react/heading";
import { Surface } from "@animic/react/surface";
import { Stack } from "@animic/react/stack";
import { Cluster } from "@animic/react/cluster";
import { Container } from "@animic/react/container";
import { Center } from "@animic/react/center";
import { Grid } from "@animic/react/grid";
import { Split } from "@animic/react/split";
import { Badge } from "@animic/react/badge";
import { Separator } from "@animic/react/separator";
const meta = { title: "Foundations", parameters: { layout: "fullscreen" } } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
export const Typography: Story = {
  render: () => (
    <Container size="reading">
      <Stack space="section">
        <Heading level={1} size="display">
          Animic あなたの表現
        </Heading>
        <Heading level={2} size="lg">
          作品を主役にする
        </Heading>
        <Heading level={3} size="md">
          意味は変えず、構成を変える
        </Heading>
        <Heading level={4} size="sm">
          可読性と操作性を優先する
        </Heading>
        {(
          [
            "body.md",
            "body.sm",
            "body.prose",
            "label",
            "caption",
            "code",
            "numeric",
          ] satisfies Array<NonNullable<Parameters<typeof Text>[0]["variant"]>>
        ).map((variant) => (
          <Text key={variant} variant={variant} as="p">
            {variant}: 作品の細部まで見比べる。 ABCD2345 123,456.78
          </Text>
        ))}
        <Text tone="muted">補足説明は静かに保ちます。</Text>
        <Text tone="success">保存が完了しました。</Text>
        <Text tone="danger">入力内容を確認してください。</Text>
      </Stack>
    </Container>
  ),
};
export const Surfaces: Story = {
  render: () => (
    <Container size="wide">
      <Stack space="section">
        <Heading level={1} size="lg">
          Surface
        </Heading>
        <Grid columns={3}>
          {(
            ["plain", "raised", "framed"] satisfies Array<
              NonNullable<Parameters<typeof Surface>[0]["appearance"]>
            >
          ).map((appearance) => (
            <Surface key={appearance} appearance={appearance}>
              <Stack>
                <Heading level={2} size="sm">
                  {appearance}
                </Heading>
                <Text>画像と判断すべき情報を明確にします。</Text>
                <Cluster>
                  <Badge>補足</Badge>
                  <Badge tone="success">保存済み</Badge>
                  <Badge tone="danger">要確認</Badge>
                </Cluster>
              </Stack>
            </Surface>
          ))}
        </Grid>
        <Separator />
        <Surface padding="md">
          <Text>compact</Text>
        </Surface>
        <Surface padding="xl">
          <Text>spacious</Text>
        </Surface>
      </Stack>
    </Container>
  ),
};
function Panel({ label }: { label: string }) {
  return (
    <Surface appearance="raised">
      <Stack>
        <Heading level={2} size="sm">
          {label}
        </Heading>
        <Text>長い説明でも文字を縮めず、読める幅と操作領域を確保します。</Text>
      </Stack>
    </Surface>
  );
}
export const Layouts: Story = {
  render: () => (
    <Container size="wide">
      <Stack space="section">
        <Heading level={1} size="lg">
          Layout Grammar
        </Heading>
        <Center>
          <Badge>Center</Badge>
        </Center>
        <Cluster justify="between">
          <Text>Cluster / start</Text>
          <Text>end</Text>
        </Cluster>
        <Grid columns={2}>
          <Panel label="Grid A" />
          <Panel label="Grid B" />
        </Grid>
        <Split layout="main-aside">
          <Panel label="Main" />
          <Panel label="Aside" />
        </Split>
        <Split layout="aside-main">
          <Panel label="Aside" />
          <Panel label="Main" />
        </Split>
        <Split layout="equal">
          <Panel label="Equal A" />
          <Panel label="Equal B" />
        </Split>
      </Stack>
    </Container>
  ),
};
