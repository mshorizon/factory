import type { ColumnDef } from "@tanstack/react-table";
import { UniversalList } from "./UniversalList";

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
  ];

  return (
    <UniversalList<Service>
      title="Services"
      data={services}
      columns={columns}
      primaryAction={{ label: "New Service", onClick: onCreate }}
      emptyTitle="No services yet"
      emptyCta={{ label: "Create Your First Service", onClick: onCreate }}
      rowActions={[
        {
          label: "Edit",
          onClick: (service, index) => onEdit(service, index),
        },
        {
          label: "Delete",
          variant: "ghost",
          className: "text-destructive hover:text-destructive",
          trackBusy: true,
          confirm: (service) => `Are you sure you want to delete "${service.title}"?`,
          onClick: (_service, index) => onDelete(index),
        },
      ]}
    />
  );
}
