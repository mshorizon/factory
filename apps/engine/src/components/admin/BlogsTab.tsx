import { useState, useEffect, lazy, Suspense } from "react";
import { BlogList } from "./BlogList";

// Lazy load BlogEditorClient to avoid SSR issues with Lexical
const BlogEditor = lazy(() => import("./BlogEditorClient"));

interface BlogsTabProps {
  businessId: string;
}

export function BlogsTab({ businessId }: BlogsTabProps) {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "edit" | "create">("list");
  const [selectedBlog, setSelectedBlog] = useState<any>(null);

  const fetchBlogs = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/blogs/list?business=${businessId}`);
      if (response.ok) {
        const data = await response.json();
        setBlogs(data.blogs);
      }
    } catch (error) {
      console.error("Error fetching blogs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, [businessId]);

  const handleCreate = () => {
    setSelectedBlog(null);
    setView("create");
  };

  const handleEdit = (blog: any) => {
    setSelectedBlog(blog);
    setView("edit");
  };

  const handleDelete = async (blogId: number) => {
    try {
      const response = await fetch("/api/admin/blogs/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blogId }),
      });

      if (response.ok) {
        await fetchBlogs();
      } else {
        alert("Failed to delete blog");
      }
    } catch (error) {
      console.error("Error deleting blog:", error);
      alert("Error deleting blog");
    }
  };

  const handleSave = async () => {
    await fetchBlogs();
    setView("list");
    setSelectedBlog(null);
  };

  const handleCancel = () => {
    setView("list");
    setSelectedBlog(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="opacity-60">Loading blogs...</div>
      </div>
    );
  }

  if (view === "create" || view === "edit") {
    return (
      <Suspense fallback={<div className="flex items-center justify-center py-12"><div className="opacity-60">Loading editor...</div></div>}>
        <BlogEditor
          blog={selectedBlog}
          businessId={businessId}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </Suspense>
    );
  }

  return (
    <BlogList
      blogs={blogs}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onCreate={handleCreate}
    />
  );
}
