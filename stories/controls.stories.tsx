import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "@animic/react/button";
import { IconButton } from "@animic/react/icon-button";
import { Link } from "@animic/react/link";
import { Text } from "@animic/react/text";
import { Heading } from "@animic/react/heading";
import { Field } from "@animic/react/field";
import { Input } from "@animic/react/input";
import { Textarea } from "@animic/react/textarea";
import { SegmentedControl } from "@animic/react/segmented-control";
import { Avatar } from "@animic/react/avatar";
import { Progress } from "@animic/react/progress";
import { Readout } from "@animic/react/readout";
import { Spinner } from "@animic/react/spinner";
import { Surface } from "@animic/react/surface";
import { Stack } from "@animic/react/stack";
import { Cluster } from "@animic/react/cluster";
import { Container } from "@animic/react/container";
const meta = { title: "Controls" } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
export const Buttons: Story = {
  render: () => (
    <Container size="reading">
      <Stack space="section">
        <Heading level={1} size="lg">
          操作と状態
        </Heading>
        <Cluster>
          <Button size="sm">Small</Button>
          <Button>Primary</Button>
          <Button size="lg">Large</Button>
          <Button appearance="secondary">Secondary</Button>
        </Cluster>
        <Cluster>
          <Button disabled>利用できません</Button>
          <Button loading>処理中です</Button>
          <IconButton label="閉じる">×</IconButton>
          <IconButton label="削除できません" disabled>
            ×
          </IconButton>
        </Cluster>
        <Button>入力内容を確認して次の操作へ進む、とても長いラベルです</Button>
        <Link href="#details">詳細を読む</Link>
        <Text id="details">キーボードでもすべての操作を利用できます。</Text>
      </Stack>
    </Container>
  ),
};

function PlaybackControls() {
  const [fast, setFast] = useState(false);
  return (
    <Cluster>
      <Button
        appearance="outlined"
        size="xs"
        shape="pill"
        aria-pressed={fast}
        onClick={() => setFast(!fast)}
      >
        ×3
      </Button>
      <Button appearance="outlined" size="xs" shape="pill">
        スキップ
      </Button>
    </Cluster>
  );
}
export const AuxiliaryButtons: Story = { render: () => <PlaybackControls /> };
function Form() {
  const [choice, setChoice] = useState("one");
  return (
    <Container size="reading">
      <Surface>
        <Stack space="section">
          <Heading level={1} size="lg">
            入力
          </Heading>
          <Field label="表示名" description="ほかの参加者に表示されます。" required>
            <Input name="displayName" placeholder="表示名を入力" />
          </Field>
          <Field
            label="招待コード"
            description="招待されたコードを入力してください。"
            error="入力が長すぎます。送られた内容をもう一度確認してください。"
          >
            <Input defaultValue="INVALID-CODE-TOO-LONG" />
          </Field>
          <Field label="無効な入力" disabled>
            <Input defaultValue="変更できません" />
          </Field>
          <Field label="参照専用" readOnly>
            <Input defaultValue="閲覧のみ" />
          </Field>
          <Field label="説明">
            <Textarea placeholder="画像の特徴を説明します" />
          </Field>
          <SegmentedControl
            label="表示方法"
            options={[
              { value: "one", label: "一覧を表示" },
              { value: "two", label: "詳細と説明を表示" },
              { value: "three", label: "利用できません", disabled: true },
            ]}
            value={choice}
            onValueChange={setChoice}
          />
          <Text>選択: {choice}</Text>
          <Button>入力内容を確認する</Button>
        </Stack>
      </Surface>
    </Container>
  );
}
export const Inputs: Story = { render: () => <Form /> };
export const Feedback: Story = {
  render: () => (
    <Container size="reading">
      <Stack space="section">
        <Heading level={1} size="lg">
          進行と状態
        </Heading>
        <Cluster>
          <Avatar name="花子" />
          <Avatar name="画像エラー" src="/missing-avatar.png" />
          <Avatar
            name="青い図形"
            src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64'%3E%3Crect width='64' height='64' fill='%230b1b2b'/%3E%3C/svg%3E"
          />
        </Cluster>
        <Progress label="アップロード" value={64} />
        <Progress label="完了" value={100} />
        <Progress label="読み込み" value={null} />
        <Spinner label="処理中です" />
      </Stack>
    </Container>
  ),
};
export const ProgressStates: Story = {
  render: () => (
    <Container size="reading">
      <Stack space="section">
        <Heading level={1} size="lg">
          進捗率と強調
        </Heading>
        <Progress label="通常の進捗" value={75} />
        <Progress label="縞の進捗" value={75} striped />
        <Progress label="強調する進捗" value={75} striped emphasis="urgent" presentation="track" />
        <Progress label="割合が未確定" value={null} striped />
        <Readout label="残り時間" value="1:09" role="timer" format="clock" emphasis="urgent" />
      </Stack>
    </Container>
  ),
};
export const FocusStates: Story = {
  render: () => (
    <Container size="reading">
      <Stack space="section">
        <Heading level={1} size="lg">
          FocusとControlの状態
        </Heading>
        <Button>Primary focus</Button>
        <Button appearance="secondary">Strong border focus</Button>
        <Field label="通常の入力">
          <Input />
        </Field>
        <Field label="エラーの入力" error="入力内容を確認してください。">
          <Input />
        </Field>
        <IconButton label="Focusを確認">×</IconButton>
        <Link href="#focus-description">Link focus</Link>
        <SegmentedControl
          label="Focus表示の選択"
          defaultValue="one"
          options={[
            { value: "one", label: "選択肢1" },
            { value: "two", label: "選択肢2" },
          ]}
        />
        <Text id="focus-description">Tabと矢印キーで操作位置を確認します。</Text>
      </Stack>
    </Container>
  ),
};

export const FieldAssociations: Story = {
  render: () => (
    <Container size="reading">
      <Stack space="section">
        <Text id="unrelated-label">別のラベル</Text>
        <Text id="unrelated-description">別の説明</Text>
        <Field
          id="email"
          label="メール"
          description="連絡先を入力します。"
          error="形式を確認してください。"
        >
          <Input
            id="ignored-input"
            aria-labelledby="unrelated-label"
            aria-describedby="unrelated-description"
            aria-errormessage="unrelated-description"
            aria-invalid={false}
          />
        </Field>
        <Field
          id="message"
          label="メッセージ"
          description="内容を入力します。"
          error="内容を確認してください。"
        >
          <Textarea
            id="ignored-textarea"
            aria-labelledby="unrelated-label"
            aria-describedby="unrelated-description"
            aria-errormessage="unrelated-description"
            aria-invalid={false}
          />
        </Field>
        <Input
          id="standalone-input"
          aria-label="単独のInput"
          aria-describedby="unrelated-description"
        />
        <Textarea
          id="standalone-textarea"
          aria-label="単独のTextarea"
          aria-describedby="unrelated-description"
        />
      </Stack>
    </Container>
  ),
};
