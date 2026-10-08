import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { TileCollection, Tile } from "@animic/react/tile-collection";
import { ThumbnailList } from "@animic/react/thumbnail-list";
import { RecordList, RecordItem } from "@animic/react/record-list";
import { StatGroup } from "@animic/react/stat-group";
import { StatusLabel } from "@animic/react/status-label";
import { Avatar } from "@animic/react/avatar";
import { Badge } from "@animic/react/badge";
import { Button } from "@animic/react/button";
import { Container } from "@animic/react/container";
import { Heading } from "@animic/react/heading";
import { Media, MediaPlaceholder } from "@animic/react/media";
import { Stack } from "@animic/react/stack";
import { Text } from "@animic/react/text";

const meta = { title: "Collections" } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
const image =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='260' height='380'%3E%3Cpath fill='%23fddb13' d='M0 0h260v380H0z'/%3E%3Ccircle fill='%23ff2d87' cx='130' cy='150' r='65'/%3E%3C/svg%3E";
function TilesExample() {
  const [selected, setSelected] = useState(0);
  return (
    <Container size="wide">
      <Stack>
        <Heading level={1} size="section">
          選択と状態
        </Heading>
        <TileCollection label="項目" capacity={4}>
          {["あおい", "さくら"].map((name, i) => (
            <Tile
              key={name}
              label={name}
              selected={selected === i}
              onClick={() => setSelected(i)}
              media={<Avatar name={name} />}
              badge={<Badge>{i + 1}</Badge>}
              footer={
                <StatusLabel tone={i ? "neutral" : "success"} appearance="badge">
                  {i ? "待機中" : "準備OK"}
                </StatusLabel>
              }
            >
              <Text variant="label.name">{name}</Text>
            </Tile>
          ))}
          <Tile appearance="placeholder">
            <Text>空き</Text>
          </Tile>
        </TileCollection>
        <StatusLabel tone="success">準備OK 1 / 2人</StatusLabel>
      </Stack>
    </Container>
  );
}
export const Tiles: Story = { render: () => <TilesExample /> };
function ImagesExample() {
  const [value, setValue] = useState("0");
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(
    Array.from({ length: 6 }, (_, i) => ({
      id: String(i),
      src: image,
      label: `画像 ${i + 1}`,
      disabled: i === 5,
    })),
  );
  return (
    <Container size="reading">
      <Stack>
        <Heading level={1} size="panel">
          画像一覧
        </Heading>
        <Media
          src={image}
          alt="選んだ画像"
          aspect="portrait"
          size="preview"
          appearance="accented"
          label={<Badge>選択中</Badge>}
          caption={<Text variant="caption">画像の説明</Text>}
          onOpen={() => setOpen(!open)}
        />
        {open && <Text>拡大操作を受け取りました。</Text>}
        <ThumbnailList
          label="画像の履歴"
          items={items}
          value={value}
          onValueChange={setValue}
          empty={<Text>画像がありません</Text>}
          compactEmpty={<Text>まだありません</Text>}
        />
        <Button onClick={() => setItems([])}>空にする</Button>
        <MediaPlaceholder
          label="未取得の画像"
          description="取得すると表示されます"
          footer={<Text variant="caption">待機中</Text>}
        >
          <Text>未取得</Text>
        </MediaPlaceholder>
      </Stack>
    </Container>
  );
}
export const Images: Story = { render: () => <ImagesExample /> };
export const Records: Story = {
  render: () => (
    <Container size="summary">
      <Stack>
        <Heading level={1} size="statement" emphasis="offset">
          1st!
        </Heading>
        <StatGroup
          items={[
            { label: "作品数", value: 12, unit: "枚" },
            { label: "最高点", value: "98.5", accent: true },
            { label: "対戦数", value: 4, unit: "回" },
          ]}
        />
        <RecordList label="記録" entering>
          {Array.from({ length: 3 }, (_, i) => (
            <RecordItem
              key={i}
              density="compact"
              image={i === 2 ? null : image}
              emphasis={i === 0}
              leading={<Text variant="numeric.supporting">{i + 1}</Text>}
              avatar={<Avatar name="あおい" size="small" />}
              value={<Text variant="numeric.supporting">98.5</Text>}
              supplement={<Text variant="code.compact">内訳 78.5 + 20</Text>}
            >
              <Text variant="label">長い名前の作品 {i + 1}</Text>
            </RecordItem>
          ))}
        </RecordList>
        <RecordList label="過去の記録" layout="grid">
          <RecordItem image={image} imagePosition="start" href="#" label="過去の作品を開く">
            <Text>過去の作品</Text>
          </RecordItem>
        </RecordList>
      </Stack>
    </Container>
  ),
};

export const AggregateStats: Story = {
  render: () => (
    <Container size="summary">
      <Stack>
        <Heading level={1} size="panel">
          集計
        </Heading>
        <StatGroup
          items={[
            { label: "1位", value: 12, unit: "回", accent: true },
            { label: "対戦", value: 24, unit: "回" },
            { label: "勝率", value: 50, unit: "%" },
            { label: "最高点", value: "98.5", unit: "pt" },
            { label: "平均", value: "84.2", unit: "pt" },
          ]}
        />
        <Text variant="numeric.rank">1st</Text>
      </Stack>
    </Container>
  ),
};
