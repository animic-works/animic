import type { Meta, StoryObj } from "@storybook/react-vite";

import { Surface } from "../surface/surface";
import { Text } from "../text/text";
import { Center } from "./center";
import { Cluster } from "./cluster";
import { Container } from "./container";
import { Grid } from "./grid";
import { Stack } from "./stack";

const meta = { title: "Layout/Patterns", parameters: { layout: "fullscreen" } } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const Box = ({ label }: { label: string }) => (
  <Surface variant="sunken" padding="sm">
    <Text variant="label">{label}</Text>
  </Surface>
);

// レイアウトの語彙: stack（積む）・cluster（並べて折り返す）・grid（格子）・container（最大幅）・center（中央）
export const Grammar: Story = {
  render: () => (
    <Container size="md">
      <Stack gap="8">
        <Stack gap="2">
          <Text variant="eyebrow">Stack</Text>
          <Box label="1" />
          <Box label="2" />
        </Stack>
        <Stack gap="2">
          <Text variant="eyebrow">Cluster</Text>
          <Cluster justify="between">
            <Box label="左" />
            <Box label="右" />
          </Cluster>
        </Stack>
        <Stack gap="2">
          <Text variant="eyebrow">Grid</Text>
          <Grid columns={3} gap="3">
            {["1", "2", "3", "4", "5", "6"].map((label) => (
              <Box key={label} label={label} />
            ))}
          </Grid>
        </Stack>
        <Stack gap="2">
          <Text variant="eyebrow">Center</Text>
          <Surface variant="outline" padding="lg">
            <Center>
              <Box label="中央" />
            </Center>
          </Surface>
        </Stack>
      </Stack>
    </Container>
  ),
};
