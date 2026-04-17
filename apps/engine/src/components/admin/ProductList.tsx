import type { ColumnDef } from "@tanstack/react-table";
import { UniversalList } from "./UniversalList";

interface Product {
  id: string;
  title: string;
  price: number;
  description?: string;
  image?: string;
  category?: string;
  inStock?: boolean;
}

interface ProductListProps {
  products: Product[];
  onEdit: (product: Product, index: number) => void;
  onDelete: (index: number) => void;
  onCreate: () => void;
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN" }).format(price);
};

export function ProductList({ products, onEdit, onDelete, onCreate }: ProductListProps) {
  const columns: ColumnDef<Product, unknown>[] = [
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => (
        <div>
          <div className="font-medium text-sm">{row.original.title}</div>
          {row.original.description && (
            <div className="text-xs text-muted-foreground truncate max-w-[300px]">
              {row.original.description}
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: "price",
      header: "Price",
      cell: ({ row }) => (
        <span className="text-sm">{formatPrice(row.original.price)}</span>
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
      accessorKey: "inStock",
      header: "Stock",
      cell: ({ row }) => (
        <span
          className={`inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-full uppercase tracking-wider ${
            row.original.inStock !== false
              ? "bg-green-600/10 text-green-600"
              : "bg-amber-600/10 text-amber-600"
          }`}
        >
          {row.original.inStock !== false ? "In Stock" : "Out of Stock"}
        </span>
      ),
    },
  ];

  return (
    <UniversalList<Product>
      title="Products"
      data={products}
      columns={columns}
      primaryAction={{ label: "New Product", onClick: onCreate }}
      emptyTitle="No products yet"
      emptyCta={{ label: "Create Your First Product", onClick: onCreate }}
      rowActions={[
        {
          label: "Edit",
          onClick: (product, index) => onEdit(product, index),
        },
        {
          label: "Delete",
          variant: "ghost",
          className: "text-destructive hover:text-destructive",
          trackBusy: true,
          confirm: (product) => `Are you sure you want to delete "${product.title}"?`,
          onClick: (_product, index) => onDelete(index),
        },
      ]}
    />
  );
}
