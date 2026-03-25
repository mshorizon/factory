import { useState, useEffect } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTable } from "./DataTable";

interface Comment {
  id: number;
  blogTitle: string;
  blogSlug: string;
  authorName: string;
  authorEmail: string;
  content: string;
  status: string;
  createdAt: string;
  ipAddress: string | null;
}

interface CommentsTabProps {
  businessId: string;
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("pl-PL", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const statusBadge = (status: string) => {
  const styles =
    status === "approved"
      ? "bg-green-600/10 text-green-600"
      : status === "rejected"
        ? "bg-destructive/10 text-destructive"
        : status === "spam"
          ? "bg-amber-600/10 text-amber-600"
          : "bg-amber-500/10 text-amber-500";

  return (
    <span
      className={`inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-full uppercase tracking-wider ${styles}`}
    >
      {status}
    </span>
  );
};

export function CommentsTab({ businessId }: CommentsTabProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("pending");
  const [moderating, setModerating] = useState<number | null>(null);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const url =
        filter === "all"
          ? `/api/admin/comments/list?business=${businessId}`
          : `/api/admin/comments/list?business=${businessId}&status=${filter}`;

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [businessId, filter]);

  const handleModerate = async (commentId: number, action: string) => {
    if (action === "delete" && !confirm("Permanently delete this comment?")) return;
    setModerating(commentId);
    try {
      const response = await fetch("/api/admin/comments/moderate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId, action, moderatedBy: "admin" }),
      });

      if (response.ok) {
        await fetchComments();
      } else {
        alert("Failed to moderate comment");
      }
    } catch (error) {
      console.error("Error moderating comment:", error);
      alert("Error moderating comment");
    } finally {
      setModerating(null);
    }
  };

  const pendingCount = comments.filter((c) => c.status === "pending").length;
  const filters = ["all", "pending", "approved", "rejected", "spam"];

  const columns: ColumnDef<Comment, unknown>[] = [
    {
      accessorKey: "authorName",
      header: "Author",
      cell: ({ row }) => (
        <div>
          <div className="font-medium text-sm">{row.original.authorName}</div>
          <div className="text-xs text-muted-foreground">{row.original.authorEmail}</div>
        </div>
      ),
    },
    {
      accessorKey: "blogTitle",
      header: "Blog",
      cell: ({ row }) => (
        <a
          href={`/blog/${row.original.blogSlug}`}
          className="text-sm hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          {row.original.blogTitle}
        </a>
      ),
    },
    {
      accessorKey: "content",
      header: "Content",
      enableSorting: false,
      cell: ({ row }) => (
        <p className="text-sm text-muted-foreground truncate max-w-[250px]">
          {row.original.content}
        </p>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => statusBadge(row.original.status),
    },
    {
      accessorKey: "createdAt",
      header: "Date",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {formatDate(row.original.createdAt)}
        </span>
      ),
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      enableSorting: false,
      cell: ({ row }) => {
        const comment = row.original;
        const isDisabled = moderating === comment.id;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger disabled={isDisabled}>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0"
                disabled={isDisabled}
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {comment.status !== "approved" && (
                <DropdownMenuItem
                  onClick={() => handleModerate(comment.id, "approved")}
                >
                  Approve
                </DropdownMenuItem>
              )}
              {comment.status !== "rejected" && (
                <DropdownMenuItem
                  onClick={() => handleModerate(comment.id, "rejected")}
                >
                  Reject
                </DropdownMenuItem>
              )}
              {comment.status !== "spam" && (
                <DropdownMenuItem
                  onClick={() => handleModerate(comment.id, "spam")}
                >
                  Mark as Spam
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => handleModerate(comment.id, "delete")}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const toolbar = (
    <div className="flex items-center justify-between">
      <h2 className="text-lg font-semibold">
        Comments{" "}
        {pendingCount > 0 && (
          <span className="ml-2 px-2 py-0.5 text-xs bg-amber-500/15 text-amber-600 rounded-full font-medium">
            {pendingCount} pending
          </span>
        )}
      </h2>
      <div className="flex gap-1">
        {filters.map((f) => (
          <Button
            key={f}
            size="sm"
            variant={filter === f ? "default" : "ghost"}
            onClick={() => setFilter(f)}
            className="capitalize"
          >
            {f}
          </Button>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-4">
        {toolbar}
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading comments...</div>
        </div>
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="space-y-4">
        {toolbar}
        <div className="text-center py-12 bg-muted/30 rounded-lg">
          <p className="text-muted-foreground">
            No {filter !== "all" ? filter : ""} comments found
          </p>
        </div>
      </div>
    );
  }

  return <DataTable columns={columns} data={comments} toolbar={toolbar} />;
}
