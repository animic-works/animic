import type { Meta, StoryObj } from "@storybook/react-vite";
import { Container } from "@animic/react/container";
import { Grid } from "@animic/react/grid";
import { Split } from "@animic/react/split";
import { Stack } from "@animic/react/stack";
import { Surface } from "@animic/react/surface";
import { Heading } from "@animic/react/heading";
import { Text } from "@animic/react/text";
import { Field } from "@animic/react/field";
import { Input } from "@animic/react/input";
import { Button } from "@animic/react/button";
const meta = { title: "Layout boundaries" } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
function Card({ name }: { name: string }) {
  return (
    <Surface appearance="raised" padding="compact" data-testid="boundary-card">
      <Stack>
        <Heading level={2} size="sm">
          {name}を見比べる
        </Heading>
        <Text variant="code" data-testid="boundary-code">
          ABCD2345
        </Text>
        <Field label="表示する名前" error="入力内容を確認してください。長い説明は省略しません。">
          <Input defaultValue="保存する作品の名前" />
        </Field>
        <Button>内容を確認して保存する</Button>
      </Stack>
    </Surface>
  );
}
function Columns({ columns }: { columns: 1 | 2 | 3 | 4 }) {
  return (
    <Container size="wide">
      <Stack space="section">
        <Heading level={1} size="lg">
          複数列と入力
        </Heading>
        <Grid columns={columns}>
          {Array.from({ length: columns }, (_, index) => (
            <Card key={index} name={`作品${index + 1}`} />
          ))}
        </Grid>
      </Stack>
    </Container>
  );
}
export const OneColumn: Story = { render: () => <Columns columns={1} /> };
export const TwoColumns: Story = { render: () => <Columns columns={2} /> };
export const ThreeColumns: Story = { render: () => <Columns columns={3} /> };
export const FourColumns: Story = { render: () => <Columns columns={4} /> };
export const MainAndAside: Story = {
  render: () => (
    <Container size="wide">
      <Stack space="section">
        <Heading level={1} size="lg">
          主領域と補助領域
        </Heading>
        <Split layout="main-aside">
          <Card name="主領域" />
          <Card name="補助領域" />
        </Split>
      </Stack>
    </Container>
  ),
};
export const EqualSplit: Story = {
  render: () => (
    <Container size="wide">
      <Split layout="equal" data-testid="equal-split">
        <Card name="作品1" />
        <Card name="作品2" />
      </Split>
    </Container>
  ),
};
export const AsideAndMain: Story = {
  render: () => (
    <Container size="wide">
      <Split layout="aside-main">
        <Card name="補助領域" />
        <Card name="主領域" />
      </Split>
    </Container>
  ),
};
export const NestedGrid: Story = {
  render: () => (
    <Container size="wide">
      <Grid columns={2} data-testid="outer-grid">
        <Grid columns={4} data-testid="inner-grid">
          <Card name="内側1" />
          <Card name="内側2" />
        </Grid>
        <Card name="外側" />
      </Grid>
    </Container>
  ),
};
export const StackedRegions: Story = {
  render: () => (
    <Container size="wide">
      <Stack space="section">
        <Heading level={1} size="lg">
          縦方向の構成
        </Heading>
        <Card name="主領域" />
        <Card name="補助領域" />
      </Stack>
    </Container>
  ),
};
