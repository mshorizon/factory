import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface Blog {
  id: number;
  slug: string;
  title: string;
  status: string;
  publishedAt: string | null;
  createdAt: string;
}

interface BlogListProps {
  blogs: Blog[];
  onEdit: (blog: Blog) => void;
  onDelete: (blogId: number) => void;
  onCreate: () => void;
}

export function BlogList({ blogs, onEdit, onDelete, onCreate }: BlogListProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDelete = async (blogId: number, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This will also delete all comments.`)) return;
    setDeletingId(blogId);
    try {
      await onDelete(blogId);
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not published";
    return new Date(dateString).toLocaleDateString("pl-PL", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Blog Posts</h2>
        <Button size="sm" onClick={onCreate}>
          <Plus className="h-4 w-4 mr-1.5" />
          New Post
        </Button>
      </div>

      {blogs.length === 0 ? (
        <div className="text-center py-12 bg-muted/30 rounded-lg border border-border">
          <p className="text-muted-foreground mb-4">No blog posts yet</p>
          <Button onClick={onCreate}>Create Your First Post</Button>
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Title</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Published</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {blogs.map((blog) => (
                <tr key={blog.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="font-medium text-sm">{blog.title}</div>
                    <div className="text-xs text-muted-foreground">/blog/{blog.slug}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-full uppercase tracking-wider ${
                        blog.status === "published"
                          ? "bg-green-600/10 text-green-600"
                          : "bg-amber-600/10 text-amber-600"
                      }`}
                    >
                      {blog.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {formatDate(blog.publishedAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button size="sm" variant="ghost" onClick={() => onEdit(blog)}>Edit</Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(blog.id, blog.title)}
                        disabled={deletingId === blog.id}
                      >
                        {deletingId === blog.id ? "..." : "Delete"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
