import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Badge } from "@animic/react/badge";
import { CodeDisplay } from "@animic/react/code-display";
import { Overlay } from "@animic/react/overlay";
import { Button } from "@animic/react/button";
import { Container } from "@animic/react/container";
import { Heading } from "@animic/react/heading";
import { Stack } from "@animic/react/stack";
import { Text } from "@animic/react/text";
const meta = { title: "Display details" } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;
function CodesExample() {
  const [count, setCount] = useState(3);
  return (
    <Container size="reading">
      <Stack>
        <Heading level={1} size="panel">
          コード表示
        </Heading>
        <CodeDisplay value="ABCD2345" />
        <CodeDisplay value="ABCD2345" presentation="cells" settledCount={count} />
        <Badge appearance="annotation">area · selected</Badge>
        <Text>
          コード：
          <CodeDisplay value="ABCD2345" presentation="inline" />
        </Text>
        <Button onClick={() => setCount(count === 8 ? 0 : count + 1)}>次の文字を確定</Button>
      </Stack>
    </Container>
  );
}
export const Codes: Story = { render: () => <CodesExample /> };
function OverlayExample() {
  const [open, setOpen] = useState(false);
  return (
    <Container size="reading">
      <Stack>
        <Heading level={1} size="panel">
          装飾の重なり
        </Heading>
        <Text>装飾を表示しても背後の操作を妨げません。</Text>
        <Button onClick={() => setOpen(!open)}>{open ? "装飾を消す" : "装飾を表示"}</Button>
        {open && (
          <Overlay>
            <svg width="100%" height="100%" aria-hidden="true">
              <circle cx="80%" cy="30%" r="80" fill="#00b4fc" opacity=".25" />
            </svg>
          </Overlay>
        )}
      </Stack>
    </Container>
  );
}
export const Decoration: Story = { render: () => <OverlayExample /> };
