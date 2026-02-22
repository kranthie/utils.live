"use client";

import { useState, useMemo, useRef } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface TableColumn {
  key: string;
  header: string;
  type?: "string" | "number" | "boolean" | "date";
  sortable?: boolean;
  filterable?: boolean;
  width?: number;
}

interface TableViewerProps {
  /**
   * Column definitions
   */
  columns: TableColumn[];
  /**
   * Table data rows
   */
  data: Record<string, unknown>[];
  /**
   * Whether to enable sorting
   * @default true
   */
  sortable?: boolean;
  /**
   * Whether to enable filtering
   * @default true
   */
  filterable?: boolean;
  /**
   * Whether to enable pagination
   * @default true
   */
  paginated?: boolean;
  /**
   * Whether to enable virtualization for large datasets
   * When enabled, pagination is disabled and virtual scrolling is used
   * @default false
   */
  virtualized?: boolean;
  /**
   * Rows per page (when paginated) or estimated row height (when virtualized)
   * @default 10 for pagination, 35 for virtualization
   */
  pageSize?: number;
  /**
   * Maximum height for virtualized table container
   * @default 400
   */
  maxHeight?: number;
  /**
   * Row height estimate for virtualization
   * @default 35
   */
  rowHeight?: number;
  /**
   * Threshold of rows to auto-enable virtualization
   * @default 100
   */
  virtualizeThreshold?: number;
  /**
   * Whether to show row count
   * @default true
   */
  showRowCount?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

export function TableViewer({
  columns,
  data,
  sortable = true,
  filterable = true,
  paginated = true,
  virtualized = false,
  pageSize = 10,
  maxHeight = 400,
  rowHeight = 35,
  virtualizeThreshold = 100,
  showRowCount = true,
  className,
}: TableViewerProps): React.ReactElement {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  // Auto-enable virtualization for large datasets
  const shouldVirtualize = virtualized || data.length >= virtualizeThreshold;
  const usePagination = paginated && !shouldVirtualize;

  // Ref for virtualization container
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const tableColumns = useMemo<ColumnDef<Record<string, unknown>>[]>(() => {
    return columns.map((col) => ({
      accessorKey: col.key,
      header: ({ column }) => {
        if (sortable && col.sortable !== false) {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
              className="-ml-4 h-8 px-4"
            >
              {col.header}
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        }
        return col.header;
      },
      cell: ({ getValue }) => {
        const value = getValue();
        if (value === null || value === undefined) {
          return <span className="text-muted-foreground">—</span>;
        }
        if (col.type === "boolean") {
          return value ? "Yes" : "No";
        }
        if (col.type === "date" && value instanceof Date) {
          return value.toLocaleDateString();
        }
        return typeof value === "object"
          ? JSON.stringify(value)
          : String(value as string | number);
      },
      size: col.width,
    }));
  }, [columns, sortable]);

  const table = useReactTable({
    data,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: sortable ? getSortedRowModel() : undefined,
    getFilteredRowModel: filterable ? getFilteredRowModel() : undefined,
    getPaginationRowModel: usePagination ? getPaginationRowModel() : undefined,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize,
      },
    },
  });

  // Get rows for virtualization
  const { rows } = table.getRowModel();

  // Virtual row renderer
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => rowHeight,
    overscan: 10,
  });

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search/Filter */}
      {filterable && (
        <div className="flex items-center gap-4">
          <Input
            placeholder="Search all columns..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="max-w-sm"
          />
          {showRowCount && (
            <span className="text-muted-foreground text-sm">
              {table.getFilteredRowModel().rows.length} rows
            </span>
          )}
        </div>
      )}

      {/* Table */}
      <div
        ref={tableContainerRef}
        className="overflow-auto rounded-md border"
        style={shouldVirtualize ? { maxHeight: `${maxHeight}px` } : undefined}
      >
        <Table>
          <TableHeader
            className={
              shouldVirtualize ? "bg-background sticky top-0 z-10" : undefined
            }
          >
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={{ width: header.getSize() }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {rows.length > 0 ? (
              shouldVirtualize ? (
                // Virtualized rendering
                <>
                  {/* Padding before visible rows */}
                  {rowVirtualizer.getVirtualItems().length > 0 && (
                    <tr
                      style={{
                        height: `${rowVirtualizer.getVirtualItems()[0]?.start ?? 0}px`,
                      }}
                    />
                  )}
                  {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                    const row = rows[virtualRow.index]!;
                    return (
                      <TableRow
                        key={row.id}
                        data-index={virtualRow.index}
                        style={{ height: `${virtualRow.size}px` }}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    );
                  })}
                  {/* Padding after visible rows */}
                  {rowVirtualizer.getVirtualItems().length > 0 && (
                    <tr
                      style={{
                        height: `${
                          rowVirtualizer.getTotalSize() -
                          (rowVirtualizer.getVirtualItems()[
                            rowVirtualizer.getVirtualItems().length - 1
                          ]?.end ?? 0)
                        }px`,
                      }}
                    />
                  )}
                </>
              ) : (
                // Standard rendering
                rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No data
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination (only shown when not virtualized) */}
      {usePagination && table.getPageCount() > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-sm">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Virtualization info */}
      {shouldVirtualize && (
        <div className="text-muted-foreground text-xs">
          Showing {rowVirtualizer.getVirtualItems().length} of {rows.length}{" "}
          rows (virtualized)
        </div>
      )}
    </div>
  );
}
