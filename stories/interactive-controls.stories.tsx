import { Container } from "@animic/react/container";
import { Grid } from "@animic/react/grid";
import { MediaObject } from "@animic/react/media-object";
import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Avatar, AvatarButton } from "@animic/react/avatar";
import { Button } from "@animic/react/button";
import { ChoiceCard } from "@animic/react/choice-card";
import { CollectionBrowser } from "@animic/react/collection-browser";
import { Composer } from "@animic/react/composer";
import { Dialog } from "@animic/react/dialog";
import { FileButton } from "@animic/react/file-button";
import { Heading } from "@animic/react/heading";
import { Input } from "@animic/react/input";
import { Meter } from "@animic/react/meter";
import { Progress } from "@animic/react/progress";
import { ProgressList } from "@animic/react/progress-list";
import { QrCode } from "@animic/react/qr-code";
import { SegmentedControl } from "@animic/react/segmented-control";
import { Stack } from "@animic/react/stack";
import { Surface } from "@animic/react/surface";
import { Switch } from "@animic/react/switch";
import { Text } from "@animic/react/text";
import { TokenInput, AdjustableToken } from "@animic/react/token-input";

const meta = { title: "Interactive controls" } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
function EditingExample() {
  const [value, setValue] = useState("");
  const [tokens, setTokens] = useState<string[]>([]);
  const [weight, setWeight] = useState(1);
  const [mode, setMode] = useState("text");
  const [quick, setQuick] = useState(false);
  const suggestions = ["blue sky", "blue eyes", "pink hair"].filter(
    (word) => value && word.includes(value),
  );
  function add(word: string) {
    setTokens((current) => (current.includes(word) ? current : [...current, word]));
    setValue("");
  }
  return (
    <Surface appearance="card" padding="content">
      <Composer
        title={
          <Heading level={1} size="panel">
            入力
          </Heading>
        }
        eyebrow="EDITOR"
        controls={
          <SegmentedControl
            label="入力方法"
            appearance="pill"
            tone="violet"
            options={[
              { value: "text", label: "文章" },
              { value: "tag", label: "タグ" },
            ]}
            value={mode}
            onValueChange={setMode}
          />
        }
        tabs={
          <SegmentedControl
            label="対象"
            appearance="chips"
            options={[
              { value: "base", label: "ベース", tone: "green" },
              { value: "item", label: "対象", tone: "yellow" },
            ]}
            defaultValue="base"
          />
        }
        tools={<Switch checked={quick} onCheckedChange={setQuick} label="確認を省略" />}
        summary={<Text variant="caption">{tokens.length}語</Text>}
        action={
          <Button onClick={() => add(value)} disabled={!value}>
            追加
          </Button>
        }
      >
        <TokenInput
          label="語句"
          value={value}
          onValueChange={setValue}
          onCommit={() => add(value)}
          onSuggestion={add}
          suggestions={suggestions.map((word) => ({
            value: word,
            label: word,
            description: "候補",
          }))}
        >
          {tokens.map((word) => (
            <AdjustableToken
              key={word}
              label={word}
              value={weight.toFixed(1)}
              onIncrease={() => setWeight(Math.min(2, weight + 0.1))}
              onDecrease={() => setWeight(Math.max(0.1, weight - 0.1))}
              increaseDisabled={weight >= 2}
              decreaseDisabled={weight <= 0.1}
              onEdit={() => {
                setValue(word);
                setTokens(tokens.filter((item) => item !== word));
              }}
            />
          ))}
        </TokenInput>
      </Composer>
    </Surface>
  );
}
export const Editor: Story = { render: () => <EditingExample /> };
function CollectionExample() {
  const [open, setOpen] = useState(false),
    [group, setGroup] = useState("all"),
    [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const words = ["空", "森", "海", "山", "朝", "夜"].filter((word) => word.includes(query));
  return (
    <>
      <Button onClick={() => setOpen(true)}>候補を開く</Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        size="expanded"
        title="候補を選ぶ"
        headerActions={
          <Input
            type="search"
            aria-label="候補を検索"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        }
        footer={<Button onClick={() => setOpen(false)}>決定（{selected.length}件）</Button>}
      >
        <CollectionBrowser
          label="候補"
          heading={<Text>{words.length}件</Text>}
          empty="候補がありません"
          filters={
            <SegmentedControl
              label="カテゴリ"
              appearance="list"
              value={group}
              onValueChange={setGroup}
              options={[
                { value: "all", label: "すべて" },
                { value: "recent", label: "最近使ったもの" },
              ]}
            />
          }
        >
          {words.map((word) => (
            <ChoiceCard
              key={word}
              label={word}
              selected={selected.includes(word)}
              onSelect={() =>
                setSelected((current) =>
                  current.includes(word)
                    ? current.filter((item) => item !== word)
                    : [...current, word],
                )
              }
            >
              <Text>{word}</Text>
            </ChoiceCard>
          ))}
        </CollectionBrowser>
      </Dialog>
    </>
  );
}
export const Collection: Story = { render: () => <CollectionExample /> };
function IdentityExample() {
  const [open, setOpen] = useState(false),
    [file, setFile] = useState("");
  return (
    <Stack>
      <Heading level={1} size="md">
        プロフィール
      </Heading>
      <AvatarButton
        name="あおい"
        label="アイコンを変更"
        size="large"
        onClick={() => setOpen(true)}
        ring
      />
      <Dialog open={open} onOpenChange={setOpen} title="アイコン" size="compact">
        <Stack>
          <FileButton label="画像を選ぶ" accept="image/*" onFile={(value) => setFile(value.name)} />
          <Text>{file || "画像を選んでください"}</Text>
          <Button onClick={() => setOpen(false)}>保存</Button>
        </Stack>
      </Dialog>
      <QrCode label="プロフィールのURL" value="https://example.test/profile" />
      <Meter
        label="入力済み"
        description="任意の項目"
        value={75}
        valueText="75"
        presentation="row"
      />
    </Stack>
  );
}
export const Identity: Story = { render: () => <IdentityExample /> };

function ProcessingExample() {
  const [done, setDone] = useState(false);
  return (
    <Stack>
      <Progress label="処理全体" value={done ? 100 : 40} presentation="track" tone="gradient" />
      <ProgressList
        label="処理手順"
        groups={[
          {
            id: "process",
            label: "処理",
            items: [
              { id: "read", label: "読み込み", state: "complete", value: "完了" },
              {
                id: "convert",
                label: "変換",
                state: done ? "complete" : "active",
                progress: 50,
                value: done ? "完了" : "50%",
              },
              {
                id: "save",
                label: "保存",
                state: done ? "complete" : "pending",
                value: done ? "完了" : "待機中",
              },
            ],
          },
        ]}
      />
      <Button appearance="secondary" onClick={() => setDone(!done)}>
        {done ? "やり直す" : "完了する"}
      </Button>
    </Stack>
  );
}
export const Processing: Story = { render: () => <ProcessingExample /> };

function AvatarChoicesExample() {
  const [choice, setChoice] = useState("pink");
  const palettes = ["pink", "cyan", "yellow", "gray"] as const;
  return (
    <Container size="narrow">
      <Stack space="section">
        <Heading level={1} size="panel">
          アバターを選ぶ
        </Heading>
        <Grid columns={4} collapse="none" space="compact" data-testid="avatar-choices">
          {palettes.map((palette) => (
            <AvatarButton
              key={palette}
              name={palette}
              label={`${palette}を選択`}
              data-testid={`choose-${palette}`}
              aria-describedby="avatar-choice-help"
              palette={palette}
              size="fill"
              fallback="あ"
              selected={choice === palette}
              disabled={palette === "gray"}
              onClick={() => setChoice(palette)}
            />
          ))}
        </Grid>
        <Text id="avatar-choice-help">選択中：{choice}</Text>
      </Stack>
    </Container>
  );
}
export const AvatarChoices: Story = { render: () => <AvatarChoicesExample /> };
export const ProfileActions: Story = {
  render: () => (
    <Container size="summary">
      <Stack space="section">
        <Heading level={1} size="panel">
          プロフィールの操作
        </Heading>
        <MediaObject
          data-testid="profile-actions"
          media={<Avatar name="あおい" size="fluid" />}
          actions={<Button appearance="secondary">プロフィールを編集</Button>}
        >
          <Heading level={2} size="sm">
            あおい
          </Heading>
          <Text>作品を描くことが好きです。</Text>
        </MediaObject>
        <MediaObject
          data-testid="adaptive-profile"
          layout="adaptive"
          media={<Avatar name="さくら" />}
          actions={<Button appearance="secondary">通知を確認</Button>}
        >
          <Text>画像と本文と操作を利用可能な幅に合わせて並べます。</Text>
        </MediaObject>
        <SegmentedControl
          label="表示する期間"
          appearance="pill"
          enclosure="outlined"
          defaultValue="all"
          options={[
            { value: "all", label: "すべて" },
            { value: "week", label: "今週" },
            { value: "month", label: "今月" },
          ]}
        />
      </Stack>
    </Container>
  ),
};
function FilesExample() {
  const [files, setFiles] = useState<string[]>([]);
  const [selections, setSelections] = useState(0);
  return (
    <Stack>
      <FileButton
        label="画像をまとめて選ぶ"
        accept="image/png,image/jpeg,image/webp"
        multiple
        onFiles={(selected) => {
          setFiles(selected.map((file) => file.name));
          setSelections((count) => count + 1);
        }}
      />
      <div role="status">
        <Text>{selections}回選択</Text>
        {files.map((name) => (
          <Text key={name}>{name}</Text>
        ))}
      </div>
    </Stack>
  );
}
export const Files: Story = { render: () => <FilesExample /> };
