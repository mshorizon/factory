import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { DataTable } from "./DataTable";

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

  if (products.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Products</h2>
          <Button size="sm" onClick={onCreate}>
            <Plus className="h-4 w-4 mr-1.5" />
            New Product
          </Button>
        </div>
        <div className="text-center py-12 bg-muted/30 rounded-lg border border-border">
          <p className="text-muted-foreground mb-4">No products yet</p>
          <Button onClick={onCreate}>Create Your First Product</Button>
        </div>
      </div>
    );
  }

  return (
    <DataTable
      columns={columns}
      data={products}
      toolbar={
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Products</h2>
          <Button size="sm" onClick={onCreate}>
            <Plus className="h-4 w-4 mr-1.5" />
            New Product
          </Button>
        </div>
      }
    />
  );
}
