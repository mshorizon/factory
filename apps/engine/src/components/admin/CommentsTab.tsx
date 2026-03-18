import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

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

export function CommentsTab({ businessId }: CommentsTabProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("pending");
  const [moderating, setModerating] = useState<number | null>(null);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const url = filter === "all"
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pl-PL", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const pendingCount = comments.filter((c) => c.status === "pending").length;
  const filters = ["all", "pending", "approved", "rejected", "spam"];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          Comments {pendingCount > 0 && (
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

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading comments...</div>
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-12 bg-muted/30 rounded-lg">
          <p className="text-muted-foreground">No {filter !== "all" ? filter : ""} comments found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="bg-card border border-border rounded-lg p-4 space-y-3"
            >
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="font-semibold text-sm">{comment.authorName}</span>
                  <span className="text-xs text-muted-foreground">({comment.authorEmail})</span>
                  <span
                    className={`px-2 py-0.5 text-[10px] font-semibold rounded-full uppercase tracking-wider ${
                      comment.status === "approved"
                        ? "bg-green-600/10 text-green-600"
                        : comment.status === "rejected"
                        ? "bg-destructive/10 text-destructive"
                        : comment.status === "spam"
                        ? "bg-amber-600/10 text-amber-600"
                        : "bg-amber-500/10 text-amber-500"
                    }`}
                  >
                    {comment.status}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mb-2">
                  On: <a href={`/blog/${comment.blogSlug}`} className="hover:underline" target="_blank">{comment.blogTitle}</a>
                </div>
                <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span>{formatDate(comment.createdAt)}</span>
                  {comment.ipAddress && <span>IP: {comment.ipAddress}</span>}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-border">
                {comment.status !== "approved" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleModerate(comment.id, "approved")}
                    disabled={moderating === comment.id}
                    className="text-green-600 border-green-600/30 hover:bg-green-600/10"
                  >
                    Approve
                  </Button>
                )}
                {comment.status !== "rejected" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleModerate(comment.id, "rejected")}
                    disabled={moderating === comment.id}
                    className="text-destructive border-destructive/30 hover:bg-destructive/10"
                  >
                    Reject
                  </Button>
                )}
                {comment.status !== "spam" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleModerate(comment.id, "spam")}
                    disabled={moderating === comment.id}
                    className="text-amber-600 border-amber-600/30 hover:bg-amber-600/10"
                  >
                    Spam
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    if (confirm("Permanently delete this comment?")) {
                      handleModerate(comment.id, "delete");
                    }
                  }}
                  disabled={moderating === comment.id}
                  className="ml-auto text-muted-foreground"
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
