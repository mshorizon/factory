import { useState } from "react";
import { ProductList } from "./ProductList";
import { ProductEditor } from "./ProductEditor";

interface ProductsTabProps {
  products: any[];
  onChange: (products: any[]) => void;
}

export function ProductsTab({ products, onChange }: ProductsTabProps) {
  const [view, setView] = useState<"list" | "edit" | "create">("list");
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const handleCreate = () => {
    setSelectedProduct(null);
    setSelectedIndex(null);
    setView("create");
  };

  const handleEdit = (product: any, index: number) => {
    setSelectedProduct(product);
    setSelectedIndex(index);
    setView("edit");
  };

  const handleDelete = (index: number) => {
    const newProducts = products.filter((_, i) => i !== index);
    onChange(newProducts);
  };

  const handleSave = (product: any) => {
    const newProducts = [...products];
    if (view === "create") {
      newProducts.push(product);
    } else if (selectedIndex !== null) {
      newProducts[selectedIndex] = product;
    }
    onChange(newProducts);
    setView("list");
    setSelectedProduct(null);
    setSelectedIndex(null);
  };

  const handleCancel = () => {
    setView("list");
    setSelectedProduct(null);
    setSelectedIndex(null);
  };

  if (view === "create" || view === "edit") {
    return (
      <ProductEditor
        product={selectedProduct}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <ProductList
      products={products}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onCreate={handleCreate}
    />
  );
}
