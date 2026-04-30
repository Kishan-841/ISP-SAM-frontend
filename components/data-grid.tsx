'use client';

import type { ReactNode } from 'react';
import { dataTableClasses } from './data-table';

export type Column<T> = {
  key: string;
  header: string;
  align?: 'left' | 'right' | 'center';
  width?: string; // e.g., 'w-32', 'w-full'
  cell: (row: T) => ReactNode;
  // For two-line cells: optional secondary text rendered below the primary cell
  secondary?: (row: T) => ReactNode;
  // Override the default <td> class for this column (e.g., monospace code).
  className?: string;
};

export function DataGrid<T>({
  columns,
  rows,
  rowKey,
  emptyMessage = 'No data',
  onRowClick,
  minWidth,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey?: (row: T, index: number) => string;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  minWidth?: string;          // e.g., 'min-w-[900px]' for horizontal scroll
}) {
  const tableClass = `${dataTableClasses.table} ${minWidth ?? ''}`.trim();

  return (
    <div className="overflow-x-auto">
      <table className={tableClass}>
        <thead className={dataTableClasses.thead}>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={`${dataTableClasses.th} ${alignClass(col.align)} ${col.width ?? ''}`.trim()}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={dataTableClasses.tbody}>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-5 py-10 text-center text-gray-500 italic"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr
                key={rowKey ? rowKey(row, i) : i}
                className={`${dataTableClasses.tr} ${onRowClick ? 'cursor-pointer' : ''}`.trim()}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`${col.className ?? dataTableClasses.td} ${alignClass(col.align)}`.trim()}
                  >
                    <div className={col.secondary ? dataTableClasses.twoLine.primary : ''}>
                      {col.cell(row)}
                    </div>
                    {col.secondary && (
                      <div className={dataTableClasses.twoLine.secondary}>
                        {col.secondary(row)}
                      </div>
                    )}
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

function alignClass(align: 'left' | 'right' | 'center' | undefined): string {
  if (align === 'right') return 'text-right';
  if (align === 'center') return 'text-center';
  return '';
}
