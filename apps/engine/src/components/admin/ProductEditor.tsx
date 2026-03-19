import { useState } from "react";
import { Button } from "@/components/ui/button";

interface ProductEditorProps {
  product?: any;
  onSave: (product: any) => void;
  onCancel: () => void;
}

export function ProductEditor({ product, onSave, onCancel }: ProductEditorProps) {
  const isEditing = !!product;

  const [formData, setFormData] = useState({
    id: product?.id || "",
    title: product?.title || "",
    description: product?.description || "",
    price: product?.price ?? 0,
    image: product?.image || "",
    category: product?.category || "",
    inStock: product?.inStock ?? true,
  });

  const generateId = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const handleTitleChange = (title: string) => {
    if (!isEditing && !formData.id) {
      setFormData({ ...formData, title, id: generateId(title) });
    } else {
      setFormData({ ...formData, title });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">
          {isEditing ? "Edit Product" : "Create New Product"}
        </h2>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          <Button type="submit">
            {isEditing ? "Update" : "Create"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Left column */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary/20 bg-background"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">ID *</label>
            <input
              type="text"
              required
              value={formData.id}
              onChange={(e) => setFormData({ ...formData, id: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary/20 bg-background"
            />
            <p className="text-xs opacity-60 mt-1">Unique identifier for this product</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary/20 resize-none bg-background"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Image URL</label>
            <input
              type="url"
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary/20 bg-background"
              placeholder="https://..."
            />
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Price *</label>
            <input
              type="number"
              required
              step="0.01"
              min="0"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary/20 bg-background"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary/20 bg-background"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Stock Status</label>
            <select
              value={formData.inStock ? "true" : "false"}
              onChange={(e) => setFormData({ ...formData, inStock: e.target.value === "true" })}
              className="w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary/20 bg-background"
            >
              <option value="true">In Stock</option>
              <option value="false">Out of Stock</option>
            </select>
          </div>
        </div>
      </div>
    </form>
  );
}
