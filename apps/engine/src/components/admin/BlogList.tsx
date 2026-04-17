import type { ColumnDef } from "@tanstack/react-table";
import { UniversalList } from "./UniversalList";

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

const formatDate = (dateString: string | null) => {
  if (!dateString) return "Not published";
  return new Date(dateString).toLocaleDateString("pl-PL", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export function BlogList({ blogs, onEdit, onDelete, onCreate }: BlogListProps) {
  const columns: ColumnDef<Blog, unknown>[] = [
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => (
        <div>
          <div className="font-medium text-sm">{row.original.title}</div>
          <div className="text-xs text-muted-foreground">/blog/{row.original.slug}</div>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <span
          className={`inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-full uppercase tracking-wider ${
            row.original.status === "published"
              ? "bg-green-600/10 text-green-600"
              : "bg-amber-600/10 text-amber-600"
          }`}
        >
          {row.original.status}
        </span>
      ),
    },
    {
      accessorKey: "publishedAt",
      header: "Published",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(row.original.publishedAt)}
        </span>
      ),
    },
  ];

  return (
    <UniversalList<Blog>
      title="Blog Posts"
      data={blogs}
      columns={columns}
      primaryAction={{ label: "New Post", onClick: onCreate }}
      emptyTitle="No blog posts yet"
      emptyCta={{ label: "Create Your First Post", onClick: onCreate }}
      getRowId={(row) => row.id}
      rowActions={[
        {
          label: "Edit",
          onClick: (blog) => onEdit(blog),
        },
        {
          label: "Delete",
          variant: "ghost",
          className: "text-destructive hover:text-destructive",
          trackBusy: true,
          confirm: (blog) => `Are you sure you want to delete "${blog.title}"? This will also delete all comments.`,
          onClick: (blog) => onDelete(blog.id),
        },
      ]}
    />
  );
}
