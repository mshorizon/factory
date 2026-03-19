import { useState } from "react";
import { Button } from "@/components/ui/button";

interface ServiceEditorProps {
  service?: any;
  onSave: (service: any) => void;
  onCancel: () => void;
}

export function ServiceEditor({ service, onSave, onCancel }: ServiceEditorProps) {
  const isEditing = !!service;

  const [formData, setFormData] = useState({
    id: service?.id || "",
    slug: service?.slug || "",
    title: service?.title || "",
    description: service?.description || "",
    content: service?.content || "",
    price: service?.price ?? "",
    priceLabel: service?.priceLabel || "",
    image: service?.image || "",
    icon: service?.icon || "",
    category: service?.category || "",
    duration: service?.duration || "",
    features: service?.features?.join(", ") || "",
    available: service?.available ?? true,
  });

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const handleTitleChange = (title: string) => {
    if (!isEditing && !formData.slug) {
      setFormData({ ...formData, title, slug: generateSlug(title), id: generateSlug(title) });
    } else {
      setFormData({ ...formData, title });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const output: any = {
      ...formData,
      price: formData.price !== "" ? parseFloat(formData.price as any) || 0 : undefined,
      features: formData.features
        ? formData.features.split(",").map((f: string) => f.trim()).filter(Boolean)
        : [],
    };
    // Remove empty optional strings
    if (!output.priceLabel) delete output.priceLabel;
    if (!output.content) delete output.content;
    if (!output.image) delete output.image;
    if (!output.icon) delete output.icon;
    if (!output.duration) delete output.duration;
    if (!output.category) delete output.category;
    if (!output.description) delete output.description;
    onSave(output);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">
          {isEditing ? "Edit Service" : "Create New Service"}
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
            <label className="block text-sm font-medium mb-1">Slug *</label>
            <input
              type="text"
              required
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary/20 bg-background"
            />
            <p className="text-xs opacity-60 mt-1">URL: /services/{formData.slug || "slug"}</p>
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

          <div>
            <label className="block text-sm font-medium mb-1">Icon URL</label>
            <input
              type="text"
              value={formData.icon}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary/20 bg-background"
              placeholder="https://..."
            />
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Price</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary/20 bg-background"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Price Label</label>
            <input
              type="text"
              value={formData.priceLabel}
              onChange={(e) => setFormData({ ...formData, priceLabel: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary/20 bg-background"
              placeholder="e.g., From $50 or Contact for pricing"
            />
            <p className="text-xs opacity-60 mt-1">Overrides price number if set</p>
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
            <label className="block text-sm font-medium mb-1">Duration</label>
            <input
              type="text"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary/20 bg-background"
              placeholder="e.g., 30 min, 1 hour"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Features (comma-separated)</label>
            <input
              type="text"
              value={formData.features}
              onChange={(e) => setFormData({ ...formData, features: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary/20 bg-background"
              placeholder="feature 1, feature 2, feature 3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Availability</label>
            <select
              value={formData.available ? "true" : "false"}
              onChange={(e) => setFormData({ ...formData, available: e.target.value === "true" })}
              className="w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary/20 bg-background"
            >
              <option value="true">Available</option>
              <option value="false">Unavailable</option>
            </select>
          </div>
        </div>
      </div>
    </form>
  );
}
