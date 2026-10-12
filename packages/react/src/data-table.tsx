import type { ReactNode } from "react";
import { cx } from "@animic/styled-system/css";
import { dataTable } from "@animic/styled-system/recipes";
import { domProps, type CommonProps } from "./dom";
import { useScrollViewport } from "./use-scroll-viewport";

export interface DataTableColumn<Row> {
  id: string;
  header: string;
  cell: (row: Row) => ReactNode;
  rowHeader?: boolean;
}

export interface DataTableProps<Row> extends Omit<CommonProps, "children"> {
  label: string;
  columns: readonly DataTableColumn<Row>[];
  rows: readonly Row[];
  getRowKey: (row: Row) => string;
  empty: ReactNode;
}

export function DataTable<Row>({ ref, ...props }: DataTableProps<Row>) {
  const classes = dataTable();
  const { ref: viewportRef, scrollbars } = useScrollViewport<HTMLDivElement>(props.label, ref);
  return (
    <>
      <div
        {...domProps(props)}
        ref={viewportRef}
        role="region"
        aria-label={`${props.label}の表`}
        tabIndex={0}
        className={classes.viewport}
        data-animic-scroll-viewport=""
      >
        <table className={classes.table} aria-label={props.label}>
          <thead>
            <tr>
              {props.columns.map((column) => (
                <th key={column.id} scope="col" className={classes.heading}>
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {props.rows.map((row) => (
              <tr key={props.getRowKey(row)}>
                {props.columns.map((column) =>
                  column.rowHeader ? (
                    <th
                      key={column.id}
                      scope="row"
                      className={cx(classes.cell, classes.rowHeading)}
                    >
                      {column.cell(row)}
                    </th>
                  ) : (
                    <td key={column.id} className={classes.cell}>
                      {column.cell(row)}
                    </td>
                  ),
                )}
              </tr>
            ))}
            {props.rows.length === 0 && (
              <tr>
                <td colSpan={props.columns.length} className={classes.empty}>
                  {props.empty}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {scrollbars}
    </>
  );
}
