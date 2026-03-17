import { useState, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";

interface BlogEditorProps {
  blog?: any;
  businessId: string;
  onSave: () => void;
  onCancel: () => void;
}

export function BlogEditor({ blog, businessId, onSave, onCancel }: BlogEditorProps) {
  const isEditing = !!blog;

  const [formData, setFormData] = useState({
    slug: blog?.slug || "",
    title: blog?.title || "",
    description: blog?.description || "",
    content: blog?.content || null,
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

  // Initialize TipTap editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Write your blog content here...",
      }),
    ],
    content: blog?.content || "",
    onUpdate: ({ editor }) => {
      setFormData((prev) => ({ ...prev, content: editor.getJSON() }));
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none min-h-[400px] p-4 border border-gray-300 rounded-md bg-white text-gray-900",
      },
    },
  });

  // Update editor content when blog changes
  useEffect(() => {
    if (editor && blog?.content) {
      editor.commands.setContent(blog.content);
    }
  }, [editor, blog]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const endpoint = isEditing
        ? "/api/admin/blogs/update"
        : "/api/admin/blogs/create";

      const payload = {
        businessId,
        ...(isEditing && { blogId: blog.id }),
        blog: {
          ...formData,
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
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : isEditing ? "Update" : "Create"}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-800">
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Slug *</label>
            <input
              type="text"
              required
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
            />
            <p className="text-xs text-gray-500 mt-1">URL: /blog/{formData.slug || "slug"}</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 resize-none bg-white text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Image URL</label>
            <input
              type="url"
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Tags (comma-separated)</label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
              placeholder="tag1, tag2, tag3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
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
        <div className="border border-gray-300 rounded-md overflow-hidden">
          {/* TipTap Toolbar */}
          <div className="bg-gray-50 border-b border-gray-300 p-2 flex flex-wrap gap-1">
            <button
              type="button"
              onClick={() => editor?.chain().focus().toggleBold().run()}
              className={`px-3 py-1 rounded text-sm font-medium ${
                editor?.isActive("bold") ? "bg-blue-100 text-blue-700" : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              Bold
            </button>
            <button
              type="button"
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              className={`px-3 py-1 rounded text-sm font-medium ${
                editor?.isActive("italic") ? "bg-blue-100 text-blue-700" : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              Italic
            </button>
            <button
              type="button"
              onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
              className={`px-3 py-1 rounded text-sm font-medium ${
                editor?.isActive("heading", { level: 2 }) ? "bg-blue-100 text-blue-700" : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              H2
            </button>
            <button
              type="button"
              onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
              className={`px-3 py-1 rounded text-sm font-medium ${
                editor?.isActive("heading", { level: 3 }) ? "bg-blue-100 text-blue-700" : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              H3
            </button>
            <button
              type="button"
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
              className={`px-3 py-1 rounded text-sm font-medium ${
                editor?.isActive("bulletList") ? "bg-blue-100 text-blue-700" : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              Bullet List
            </button>
            <button
              type="button"
              onClick={() => editor?.chain().focus().toggleOrderedList().run()}
              className={`px-3 py-1 rounded text-sm font-medium ${
                editor?.isActive("orderedList") ? "bg-blue-100 text-blue-700" : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              Ordered List
            </button>
            <button
              type="button"
              onClick={() => editor?.chain().focus().toggleBlockquote().run()}
              className={`px-3 py-1 rounded text-sm font-medium ${
                editor?.isActive("blockquote") ? "bg-blue-100 text-blue-700" : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              Quote
            </button>
          </div>
          {/* Editor Content */}
          <EditorContent editor={editor} />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Use the toolbar to format your content. Content is saved as structured data.
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
              placeholder="Leave empty to use blog title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Meta Description</label>
            <textarea
              rows={2}
              value={formData.metaDescription}
              onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 resize-none bg-white text-gray-900"
              placeholder="Leave empty to use blog description"
            />
          </div>
        </div>
      </div>
    </form>
  );
}
