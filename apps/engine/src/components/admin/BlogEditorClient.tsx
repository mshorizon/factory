import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface BlogEditorClientProps {
  blog?: any;
  businessId: string;
  onSave: () => void;
  onCancel: () => void;
}

export default function BlogEditorClient({ blog, businessId, onSave, onCancel }: BlogEditorClientProps) {
  const isEditing = !!blog;
  const editorRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    slug: blog?.slug || "",
    title: blog?.title || "",
    description: blog?.description || "",
    content: blog?.content || "",
    image: blog?.image || "",
    author: blog?.author || "",
    category: blog?.category || "",
    tags: blog?.tags?.join(", ") || "",
    status: blog?.status || "draft",
    metaTitle: blog?.metaTitle || "",
    metaDescription: blog?.metaDescription || "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Load content into editor
  useEffect(() => {
    if (editorRef.current && blog?.content) {
      editorRef.current.innerHTML = blog.content;
    }
  }, [blog?.content]);

  // Generate slug from title
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const handleTitleChange = (title: string) => {
    setFormData({ ...formData, title });
    if (!isEditing && !formData.slug) {
      setFormData({ ...formData, title, slug: generateSlug(title) });
    }
  };

  const handleFormat = (command: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const endpoint = isEditing
        ? "/api/admin/blogs/update"
        : "/api/admin/blogs/create";

      const content = editorRef.current?.innerHTML || "";

      const payload = {
        businessId,
        ...(isEditing && { blogId: blog.id }),
        blog: {
          ...formData,
          content, // HTML content
          tags: formData.tags.split(",").map((t) => t.trim()).filter(Boolean),
        },
      };

      const response = await fetch(endpoint, {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save blog");
      }

      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">
          {isEditing ? "Edit Blog Post" : "Create New Blog Post"}
        </h2>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : isEditing ? "Update" : "Create"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-md text-destructive">
          {error}
        </div>
      )}

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
            <p className="text-xs opacity-60 mt-1">URL: /blog/{formData.slug || "slug"}</p>
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
            <label className="block text-sm font-medium mb-1">Author</label>
            <input
              type="text"
              value={formData.author}
              onChange={(e) => setFormData({ ...formData, author: e.target.value })}
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
            <label className="block text-sm font-medium mb-1">Tags (comma-separated)</label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary/20 bg-background"
              placeholder="tag1, tag2, tag3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary/20 bg-background"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content editor */}
      <div>
        <label className="block text-sm font-medium mb-1">Content *</label>
        <div className="border border-border rounded-md overflow-hidden">
          {/* Toolbar */}
          <div className="bg-muted/30 border-b border-border p-2 flex flex-wrap gap-1">
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                handleFormat("bold");
              }}
              className="px-3 py-1 rounded text-sm font-medium bg-muted/50 hover:bg-muted"
              title="Bold"
            >
              <strong>B</strong>
            </button>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                handleFormat("italic");
              }}
              className="px-3 py-1 rounded text-sm font-medium bg-muted/50 hover:bg-muted"
              title="Italic"
            >
              <em>I</em>
            </button>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                handleFormat("formatBlock", "h2");
              }}
              className="px-3 py-1 rounded text-sm font-medium bg-muted/50 hover:bg-muted"
              title="Heading 2"
            >
              H2
            </button>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                handleFormat("formatBlock", "h3");
              }}
              className="px-3 py-1 rounded text-sm font-medium bg-muted/50 hover:bg-muted"
              title="Heading 3"
            >
              H3
            </button>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                handleFormat("insertUnorderedList");
              }}
              className="px-3 py-1 rounded text-sm font-medium bg-muted/50 hover:bg-muted"
              title="Bullet List"
            >
              • List
            </button>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                handleFormat("insertOrderedList");
              }}
              className="px-3 py-1 rounded text-sm font-medium bg-muted/50 hover:bg-muted"
              title="Numbered List"
            >
              1. List
            </button>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                handleFormat("formatBlock", "blockquote");
              }}
              className="px-3 py-1 rounded text-sm font-medium bg-muted/50 hover:bg-muted"
              title="Quote"
            >
              " Quote
            </button>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                handleFormat("formatBlock", "p");
              }}
              className="px-3 py-1 rounded text-sm font-medium bg-muted/50 hover:bg-muted"
              title="Paragraph"
            >
              ¶
            </button>
          </div>
          {/* Editor */}
          <div
            ref={editorRef}
            contentEditable
            className="prose prose-sm max-w-none focus:outline-none min-h-[400px] p-4 bg-background"
            onMouseDown={(e) => {
              // Prevent loss of selection when clicking toolbar buttons
              if (e.target === e.currentTarget) {
                e.currentTarget.focus();
              }
            }}
          />
        </div>
        <p className="text-xs opacity-60 mt-1">
          Use the toolbar to format your content. Content is saved as HTML.
        </p>
      </div>

      {/* SEO section */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4">SEO Settings</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Meta Title</label>
            <input
              type="text"
              value={formData.metaTitle}
              onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary/20 bg-background"
              placeholder="Leave empty to use blog title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Meta Description</label>
            <textarea
              rows={2}
              value={formData.metaDescription}
              onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary/20 resize-none bg-background"
              placeholder="Leave empty to use blog description"
            />
          </div>
        </div>
      </div>
    </form>
  );
}
