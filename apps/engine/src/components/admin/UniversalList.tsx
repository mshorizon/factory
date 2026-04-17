import { useState, type ReactNode } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Loader2, type LucideIcon } from "lucide-react";
import { DataTable } from "./DataTable";

export interface UniversalListRowAction<T> {
  label: string;
  onClick: (row: T, index: number) => void | Promise<void>;
  variant?: "default" | "ghost" | "outline" | "destructive" | "secondary";
  icon?: LucideIcon;
  className?: string;
  show?: (row: T, index: number) => boolean;
  disabled?: (row: T, index: number) => boolean;
  title?: string;
  /** When provided, shows a window.confirm() dialog before invoking onClick. */
  confirm?: (row: T) => string;
  /** Marks this action as the "busy tracked" one (e.g. delete). Shows "…" while running. */
  trackBusy?: boolean;
  /** Render icon only (no label) — useful for tight rows. */
  iconOnly?: boolean;
}

export interface UniversalListProps<T> {
  /** Table rows. */
  data: T[];
  /** Column definitions (tanstack). */
  columns: ColumnDef<T, unknown>[];

  /** Toolbar heading. */
  title: string;
  /** Optional subtitle / count hint below the title. */
  subtitle?: ReactNode;

  /** Primary action in the header (e.g. "New Service", "Upload File"). */
  primaryAction?: {
    label: string;
    icon?: LucideIcon;
    onClick: () => void;
    disabled?: boolean;
  };

  /** Extra toolbar content rendered below the title row (e.g. status filter tabs). */
  toolbarExtras?: ReactNode;

  /** Row-level actions — rendered as a trailing column. */
  rowActions?: UniversalListRowAction<T>[];

  /** Empty-state copy. */
  emptyIcon?: LucideIcon;
  emptyTitle?: string;
  emptyHint?: string;
  /** If omitted but `primaryAction` is set, the primary action is reused as the empty CTA. */
  emptyCta?: { label: string; onClick: () => void };

  /** Async states. */
  loading?: boolean;
  loadingLabel?: string;
  error?: string | null;

  /**
   * Stable row id for tracking which row is "busy" during an async action.
   * Defaults to the row index.
   */
  getRowId?: (row: T, index: number) => string | number;

  /** Wrap the table body in a shadcn Card shell. */
  wrapInCard?: boolean;
}

export function UniversalList<T>({
  data,
  columns,
  title,
  subtitle,
  primaryAction,
  toolbarExtras,
  rowActions,
  emptyIcon: EmptyIcon,
  emptyTitle,
  emptyHint,
  emptyCta,
  loading,
  loadingLabel = "Loading…",
  error,
  getRowId,
  wrapInCard,
}: UniversalListProps<T>) {
  const [busyRowId, setBusyRowId] = useState<string | number | null>(null);

  const PrimaryIcon = primaryAction?.icon ?? Plus;

  const runAction = async (
    action: UniversalListRowAction<T>,
    row: T,
    index: number,
  ) => {
    if (action.confirm) {
      const msg = action.confirm(row);
      if (!confirm(msg)) return;
    }
    const rowId = getRowId ? getRowId(row, index) : index;
    if (action.trackBusy) setBusyRowId(rowId);
    try {
      await action.onClick(row, index);
    } finally {
      if (action.trackBusy) setBusyRowId(null);
    }
  };

  const columnsWithActions: ColumnDef<T, unknown>[] =
    rowActions && rowActions.length > 0
      ? [
          ...columns,
          {
            id: "__actions",
            header: () => <span className="sr-only">Actions</span>,
            enableSorting: false,
            cell: ({ row }) => {
              const rowId = getRowId
                ? getRowId(row.original, row.index)
                : row.index;
              const isBusy = busyRowId === rowId;
              return (
                <div className="flex items-center justify-end gap-1">
                  {rowActions.map((action, i) => {
                    if (action.show && !action.show(row.original, row.index)) {
                      return null;
                    }
                    const Icon = action.icon;
                    const disabled =
                      (action.disabled?.(row.original, row.index) ?? false) ||
                      (action.trackBusy && isBusy);
                    const busyThisAction = action.trackBusy && isBusy;
                    return (
                      <Button
                        key={`${action.label}-${i}`}
                        size="sm"
                        variant={action.variant ?? "ghost"}
                        className={action.className}
                        disabled={disabled}
                        title={action.title ?? action.label}
                        onClick={() => runAction(action, row.original, row.index)}
                      >
                        {busyThisAction ? (
                          "…"
                        ) : (
                          <>
                            {Icon && (
                              <Icon
                                className={
                                  action.iconOnly ? "h-4 w-4" : "h-4 w-4 mr-1.5"
                                }
                              />
                            )}
                            {!action.iconOnly && action.label}
                          </>
                        )}
                      </Button>
                    );
                  })}
                </div>
              );
            },
          },
        ]
      : columns;

  const toolbar = (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
        {primaryAction && (
          <Button
            size="sm"
            onClick={primaryAction.onClick}
            disabled={primaryAction.disabled}
          >
            <PrimaryIcon className="h-4 w-4 mr-1.5" />
            {primaryAction.label}
          </Button>
        )}
      </div>
      {toolbarExtras}
    </div>
  );

  // Loading
  if (loading) {
    return (
      <div className="space-y-4">
        {toolbar}
        <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          {loadingLabel}
        </div>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="space-y-4">
        {toolbar}
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      </div>
    );
  }

  // Empty
  if (data.length === 0) {
    const cta = emptyCta ?? (
      primaryAction
        ? { label: primaryAction.label, onClick: primaryAction.onClick }
        : undefined
    );
    return (
      <div className="space-y-4">
        {toolbar}
        <div className="text-center py-12 bg-muted/30 rounded-lg border border-border">
          {EmptyIcon && (
            <EmptyIcon className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
          )}
          <p className="text-muted-foreground mb-1">
            {emptyTitle ?? `No ${title.toLowerCase()} yet`}
          </p>
          {emptyHint && (
            <p className="text-xs text-muted-foreground mb-4">{emptyHint}</p>
          )}
          {cta && (
            <Button onClick={cta.onClick} className="mt-3">
              {cta.label}
            </Button>
          )}
        </div>
      </div>
    );
  }

  const tableEl = (
    <DataTable
      columns={columnsWithActions}
      data={data}
      toolbar={toolbar}
    />
  );

  return wrapInCard ? (
    <Card>
      <CardContent className="pt-4 px-5 pb-4">{tableEl}</CardContent>
    </Card>
  ) : (
    tableEl
  );
}
