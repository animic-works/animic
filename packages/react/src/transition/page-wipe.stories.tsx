import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "../button/button";
import { EntryCard, EntryPage } from "../entry/entry-card";
import { Stack } from "../layout/stack";
import { Surface } from "../surface/surface";
import { Text } from "../text/text";
import { Entrance, WipeProvider, useWipe } from "./page-wipe";

const meta = { title: "Motion/PageWipe", parameters: { layout: "fullscreen" } } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

function Demo() {
  const wipe = useWipe();
  return (
    <EntryPage>
      <EntryCard logoSrc="/animic-logo.svg" title="画面遷移の演出" titleId="wipe-title">
        <Stack gap="3">
          <Button size="lg" fullWidth onClick={() => void wipe.wipeTo(() => {})}>
            帯で塗りつぶす
          </Button>
          <Button
            variant="secondary"
            size="lg"
            fullWidth
            onClick={() =>
              void wipe.buildRoom({
                label: "ルームを作っています",
                done: "ルームができました！",
                sub: "このコードを相手に伝えよう",
                task: () => new Promise((resolve) => setTimeout(() => resolve("K7QX2MPA"), 1200)),
                navigate: () => {},
              })
            }
          >
            ルームコードを回す
          </Button>
        </Stack>
      </EntryCard>
    </EntryPage>
  );
}

// 3色の帯で塗りつぶし、抜けたあとにカードが弾んで現れる
export const Interactive: Story = {
  render: () => (
    <WipeProvider logoSrc="/favicon.svg">
      <Demo />
    </WipeProvider>
  ),
};

// 遷移先で順に出てくる要素
export const Entering: Story = {
  parameters: { layout: "padded" },
  render: () => (
    <Stack gap="4">
      {(["0", "1", "2"] as const).map((order) => (
        <Entrance key={order} order={order}>
          <Surface variant="soft">
            <Text variant="label">順番 {order}</Text>
          </Surface>
        </Entrance>
      ))}
    </Stack>
  ),
};
