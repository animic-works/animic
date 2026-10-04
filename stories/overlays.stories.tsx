import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Dialog } from "@animic/react/dialog";
import { ToastProvider, useToast } from "@animic/react/toast";
import { Button } from "@animic/react/button";
import { Heading } from "@animic/react/heading";
import { Field } from "@animic/react/field";
import { Input } from "@animic/react/input";
import { Stack } from "@animic/react/stack";
import { Cluster } from "@animic/react/cluster";
import { Container } from "@animic/react/container";
import { Text } from "@animic/react/text";
const meta = { title: "Overlays" } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
function Notifications() {
  const toast = useToast();
  return (
    <Button
      onClick={() =>
        toast.show({
          title: "保存が完了しました",
          description: "変更内容を保存しました。続けて編集できます。",
        })
      }
    >
      通知を表示
    </Button>
  );
}
function Example({
  initialOpen = false,
  presentation,
}: {
  initialOpen?: boolean;
  presentation?: "adaptive" | "centered";
}) {
  const [open, setOpen] = useState(initialOpen);
  return (
    <ToastProvider>
      <Container size="reading">
        <Stack>
          <Heading level={1} size="lg">
            Dialog / Toast
          </Heading>
          <Button onClick={() => setOpen(true)}>ダイアログを開く</Button>
          <Notifications />
          <Dialog
            presentation={presentation}
            open={open}
            onOpenChange={setOpen}
            title="入力した内容を確認して保存します"
            description="変更内容を確認してください。長い説明も操作領域を縮めずに表示します。"
          >
            <Stack space="section">
              <Field label="名前" description="あとから変更できます。" required>
                <Input />
              </Field>
              <Text as="p">
                作品を比較し、細部まで確認できるようにします。情報が多い場合はスクロールして読み進められます。
              </Text>
              <Cluster>
                <Button onClick={() => setOpen(false)}>確認して保存する</Button>
                <Button appearance="secondary" onClick={() => setOpen(false)}>
                  編集を続ける
                </Button>
                <Notifications />
              </Cluster>
            </Stack>
          </Dialog>
        </Stack>
      </Container>
    </ToastProvider>
  );
}
export const DialogAndToast: Story = { render: () => <Example /> };
export const OpenDialog: Story = { render: () => <Example initialOpen /> };
export const CenteredDialog: Story = {
  render: () => <Example initialOpen presentation="centered" />,
};

export const WithoutDescription: Story = {
  render: () => (
    <Dialog open onOpenChange={() => {}} title="お知らせ">
      <Text>説明文を省略したDialogです。</Text>
    </Dialog>
  ),
};
