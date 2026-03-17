import { useState, useEffect } from "react";

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
        body: JSON.stringify({
          commentId,
          action,
          moderatedBy: "admin",
        }),
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">
          Comments {pendingCount > 0 && (
            <span className="ml-2 px-2 py-1 text-sm bg-yellow-100 text-yellow-800 rounded-full">
              {pendingCount} pending
            </span>
          )}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1 rounded ${
              filter === "all" ? "bg-gray-800 text-white" : "bg-gray-200 text-gray-700"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("pending")}
            className={`px-3 py-1 rounded ${
              filter === "pending" ? "bg-yellow-600 text-white" : "bg-gray-200 text-gray-700"
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter("approved")}
            className={`px-3 py-1 rounded ${
              filter === "approved" ? "bg-green-600 text-white" : "bg-gray-200 text-gray-700"
            }`}
          >
            Approved
          </button>
          <button
            onClick={() => setFilter("rejected")}
            className={`px-3 py-1 rounded ${
              filter === "rejected" ? "bg-red-600 text-white" : "bg-gray-200 text-gray-700"
            }`}
          >
            Rejected
          </button>
          <button
            onClick={() => setFilter("spam")}
            className={`px-3 py-1 rounded ${
              filter === "spam" ? "bg-orange-600 text-white" : "bg-gray-200 text-gray-700"
            }`}
          >
            Spam
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Loading comments...</div>
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No {filter !== "all" ? filter : ""} comments found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="bg-white border border-gray-300 rounded-lg p-4 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-gray-900">{comment.authorName}</span>
                    <span className="text-sm text-gray-500">({comment.authorEmail})</span>
                    <span
                      className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                        comment.status === "approved"
                          ? "bg-green-100 text-green-800"
                          : comment.status === "rejected"
                          ? "bg-red-100 text-red-800"
                          : comment.status === "spam"
                          ? "bg-orange-100 text-orange-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {comment.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    On: <a href={`/blog/${comment.blogSlug}`} className="text-blue-600 hover:underline" target="_blank">{comment.blogTitle}</a>
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span>{formatDate(comment.createdAt)}</span>
                    {comment.ipAddress && <span>IP: {comment.ipAddress}</span>}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                {comment.status !== "approved" && (
                  <button
                    onClick={() => handleModerate(comment.id, "approved")}
                    disabled={moderating === comment.id}
                    className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                  >
                    {moderating === comment.id ? "..." : "✓ Approve"}
                  </button>
                )}
                {comment.status !== "rejected" && (
                  <button
                    onClick={() => handleModerate(comment.id, "rejected")}
                    disabled={moderating === comment.id}
                    className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                  >
                    {moderating === comment.id ? "..." : "✗ Reject"}
                  </button>
                )}
                {comment.status !== "spam" && (
                  <button
                    onClick={() => handleModerate(comment.id, "spam")}
                    disabled={moderating === comment.id}
                    className="px-3 py-1 text-sm bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
                  >
                    {moderating === comment.id ? "..." : "⚠ Mark as Spam"}
                  </button>
                )}
                <button
                  onClick={() => {
                    if (confirm("Are you sure you want to permanently delete this comment?")) {
                      handleModerate(comment.id, "delete");
                    }
                  }}
                  disabled={moderating === comment.id}
                  className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 ml-auto"
                >
                  {moderating === comment.id ? "..." : "🗑 Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
