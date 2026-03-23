import { useState, useEffect, lazy, Suspense } from "react";
import { BlogList } from "./BlogList";
import { Star } from "lucide-react";

// Lazy load BlogEditorClient to avoid SSR issues with Lexical
const BlogEditor = lazy(() => import("./BlogEditorClient"));

interface BlogsTabProps {
  businessId: string;
  primaryLanguage?: "en" | "pl";
}

export function BlogsTab({ businessId, primaryLanguage = "en" }: BlogsTabProps) {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "edit" | "create">("list");
  const [selectedBlog, setSelectedBlog] = useState<any>(null);
  const [activeLang, setActiveLang] = useState<"en" | "pl">(primaryLanguage);

  const fetchBlogs = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/blogs/list?business=${businessId}&lang=${activeLang}`);
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
  }, [businessId, activeLang]);

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
          lang={activeLang}
          primaryLanguage={primaryLanguage}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </Suspense>
    );
  }

  return (
    <div className="space-y-4">
      {/* Language tabs */}
      <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5 w-fit">
        {(["en", "pl"] as const).map((lang) => (
          <button
            key={lang}
            onClick={() => setActiveLang(lang)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all inline-flex items-center gap-1.5 ${
              activeLang === lang
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {lang === primaryLanguage && <Star className="h-3 w-3 text-amber-500 fill-amber-500" />}
            {lang === "en" ? "English" : "Polski"}
          </button>
        ))}
      </div>

      <BlogList
        blogs={blogs}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onCreate={handleCreate}
      />
    </div>
  );
}
