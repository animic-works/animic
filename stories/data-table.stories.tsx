import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "@animic/react/button";
import { Container } from "@animic/react/container";
import { DataTable, type DataTableColumn } from "@animic/react/data-table";
import { Heading } from "@animic/react/heading";
import { Stack } from "@animic/react/stack";
import { Text } from "@animic/react/text";

const meta = { title: "Data table", component: DataTable } satisfies Meta<typeof DataTable>;
export default meta;
type Story = StoryObj;
const rows = [
  {
    id: "one",
    name: "東スタジオ",
    created: "2026/10/08 12:30:00",
    state: "有効",
    detail: "GPU A（空き4GB／8GB）",
  },
  {
    id: "two",
    name: "西スタジオ",
    created: "2026/10/08 12:45:00",
    state: "失効",
    detail: "GPU B（空き8GB／16GB）",
  },
];
type RecordRow = (typeof rows)[number];
function recordColumns(onSelect: (name: string) => void): DataTableColumn<RecordRow>[] {
  return [
    { id: "name", header: "名前", rowHeader: true, cell: (row) => row.name },
    { id: "created", header: "登録日時", cell: (row) => row.created },
    { id: "detail", header: "詳細", cell: (row) => row.detail },
    { id: "state", header: "状態", cell: (row) => row.state },
    {
      id: "action",
      header: "操作",
      cell: (row) => (
        <Button size="sm" appearance="secondary" onClick={() => onSelect(row.name)}>
          詳細を開く
        </Button>
      ),
    },
  ];
}
function RecordsTable() {
  const [selected, setSelected] = useState("");

  return (
    <Container size="wide">
      <Stack>
        <Heading level={1} size="panel">
          登録一覧
        </Heading>
        <DataTable
          label="登録一覧"
          rows={rows}
          getRowKey={(row) => row.id}
          empty="登録はありません。"
          columns={recordColumns(setSelected)}
        />
        <Text aria-live="polite">
          {selected ? `${selected}を選択しました。` : "一覧から操作できます。"}
        </Text>
      </Stack>
    </Container>
  );
}
export const Records: Story = { render: () => <RecordsTable /> };
export const Empty: Story = {
  render: () => (
    <Container size="reading">
      <DataTable<{ id: string }>
        label="登録一覧"
        rows={[]}
        getRowKey={(row) => row.id}
        columns={[{ id: "id", header: "ID", rowHeader: true, cell: (row) => row.id }]}
        empty="登録はありません。"
      />
    </Container>
  ),
};
