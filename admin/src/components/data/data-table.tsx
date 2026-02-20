import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type DataTableColumn<T> = {
  key: keyof T | string;
  header: string;
  render?: (row: T) => ReactNode;
  className?: string;
};

type DataTableProps<T> = {
  columns: Array<DataTableColumn<T>>;
  rows: T[];
  emptyText?: string;
};

export function DataTable<T extends Record<string, unknown>>({
  columns,
  rows,
  emptyText = "No records found",
}: DataTableProps<T>) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <table className="w-full text-sm">
        <thead className="bg-muted/60 text-left">
          <tr>
            {columns.map((column) => (
              <th key={String(column.key)} className={cn("px-4 py-3 font-semibold", column.className)}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td className="px-4 py-6 text-muted-foreground" colSpan={columns.length}>
                {emptyText}
              </td>
            </tr>
          ) : (
            rows.map((row, idx) => (
              <tr key={idx} className="border-t border-border">
                {columns.map((column) => (
                  <td key={String(column.key)} className={cn("px-4 py-3 align-top", column.className)}>
                    {column.render ? column.render(row) : (row[column.key as keyof T] as ReactNode)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
