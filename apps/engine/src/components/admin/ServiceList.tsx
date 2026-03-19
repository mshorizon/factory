import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { DataTable } from "./DataTable";

interface Service {
  id: string;
  slug: string;
  title: string;
  description?: string;
  price?: number;
  priceLabel?: string;
  image?: string;
  icon?: string;
  category?: string;
  duration?: string;
  available?: boolean;
}

interface ServiceListProps {
  services: Service[];
  onEdit: (service: Service, index: number) => void;
  onDelete: (index: number) => void;
  onCreate: () => void;
}

const formatPrice = (service: Service) => {
  if (service.priceLabel) return service.priceLabel;
  if (service.price != null) {
    return new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN" }).format(service.price);
  }
  return "—";
};

export function ServiceList({ services, onEdit, onDelete, onCreate }: ServiceListProps) {
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);

  const handleDelete = async (index: number, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;
    setDeletingIndex(index);
    try {
      await onDelete(index);
    } finally {
      setDeletingIndex(null);
    }
  };

  const columns: ColumnDef<Service, unknown>[] = [
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => (
        <div>
          <div className="font-medium text-sm">{row.original.title}</div>
          {row.original.duration && (
            <div className="text-xs text-muted-foreground">{row.original.duration}</div>
          )}
        </div>
      ),
    },
    {
      id: "price",
      header: "Price",
      accessorFn: (row) => row.price ?? 0,
      cell: ({ row }) => (
        <span className="text-sm">{formatPrice(row.original)}</span>
      ),
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.category || "—"}
        </span>
      ),
    },
    {
      accessorKey: "available",
      header: "Status",
      cell: ({ row }) => (
        <span
          className={`inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-full uppercase tracking-wider ${
            row.original.available !== false
              ? "bg-green-600/10 text-green-600"
              : "bg-amber-600/10 text-amber-600"
          }`}
        >
          {row.original.available !== false ? "Available" : "Unavailable"}
        </span>
      ),
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onEdit(row.original, row.index)}
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={() => handleDelete(row.index, row.original.title)}
            disabled={deletingIndex === row.index}
          >
            {deletingIndex === row.index ? "..." : "Delete"}
          </Button>
        </div>
      ),
    },
  ];

  if (services.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Services</h2>
          <Button size="sm" onClick={onCreate}>
            <Plus className="h-4 w-4 mr-1.5" />
            New Service
          </Button>
        </div>
        <div className="text-center py-12 bg-muted/30 rounded-lg border border-border">
          <p className="text-muted-foreground mb-4">No services yet</p>
          <Button onClick={onCreate}>Create Your First Service</Button>
        </div>
      </div>
    );
  }

  return (
    <DataTable
      columns={columns}
      data={services}
      toolbar={
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Services</h2>
          <Button size="sm" onClick={onCreate}>
            <Plus className="h-4 w-4 mr-1.5" />
            New Service
          </Button>
        </div>
      }
    />
  );
}
