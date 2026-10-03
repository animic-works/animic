import type { Meta, StoryObj } from "@storybook/react-vite";

import { Grid } from "../layout/grid";
import { Text } from "../text/text";
import { Surface } from "./surface";

const meta = { title: "Layout/Surface", component: Surface } satisfies Meta<typeof Surface>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Layers: Story = {
  parameters: { layout: "padded" },
  render: () => (
    <Grid columns={3} gap="4">
      {(["sunken", "outline", "raised", "accent", "inverse"] as const).map((variant) => (
        <Surface key={variant} variant={variant}>
          <Text variant="label" tone={variant === "inverse" ? "inverse" : "default"}>
            {variant}
          </Text>
        </Surface>
      ))}
    </Grid>
  ),
};
