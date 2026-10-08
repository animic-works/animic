import type { ReactNode } from "react";

import { variant } from "./cx";
import dataTableStyles from "./data-table.module.css";

export type DataTableProps = {
  /** 狭い幅での列の扱い。wrapは折り返す、scrollは列の幅を保って横にスクロールする */
  overflow?: "wrap" | "scroll";
  /** 表の名前（読み上げ用。見た目には出さない） */
  caption: string;
  /** 列の見出し（同じ表で重ならない文言） */
  columns: string[];
  children: ReactNode;
};

// 行と列の表。狭い画面では横にスクロールする。ボタンのない表もキーボードでスクロールできるよう、
// スクロールする枠をフォーカスできる名前付きの領域にする
export function DataTable({ overflow = "wrap", caption, columns, children }: DataTableProps) {
  return (
    <div className={dataTableStyles.wrap} role="region" aria-label={caption} tabIndex={0}>
      <table className={variant(dataTableStyles, "table", { overflow })}>
        <caption className={dataTableStyles.caption}>{caption}</caption>
        <thead className={dataTableStyles.head}>
          <tr>
            {columns.map((column) => (
              <th key={column} scope="col" className={dataTableStyles.headCell}>
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export type DataRowProps = {
  /** 選んでいる行（淡いピンク） */
  selected?: boolean;
  children: ReactNode;
};

export function DataRow({ selected = false, children }: DataRowProps) {
  return (
    <tr className={dataTableStyles.row} data-selected={selected || undefined}>
      {children}
    </tr>
  );
}

export type DataCellProps = {
  /** number: 右寄せの等幅、strong: 太字、actions: 操作のボタンを右に並べる */
  kind?: "text" | "number" | "strong" | "actions";
  /** 行の見出しにする（その行の名前） */
  header?: boolean;
  children?: ReactNode;
};

export function DataCell({ kind = "text", header = false, children }: DataCellProps) {
  const content =
    kind === "actions" ? <div className={dataTableStyles.actions}>{children}</div> : children;
  return header ? (
    <th scope="row" className={dataTableStyles.cell} data-kind={kind}>
      {content}
    </th>
  ) : (
    <td className={dataTableStyles.cell} data-kind={kind}>
      {content}
    </td>
  );
}

export type DataCodeProps = {
  /** 省略して見せるときの全文（IDの先頭だけを出す場合など） */
  title?: string;
  children: ReactNode;
};

// タグやIDなど、そのまま入力する文字を等幅の札で見せる
export function DataCode({ title, children }: DataCodeProps) {
  return (
    <code className={dataTableStyles.code} title={title}>
      {children}
    </code>
  );
}
