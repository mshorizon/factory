import { useState } from "react";
import { BlogsTab } from "./BlogsTab";
import { CommentsTab } from "./CommentsTab";

interface BlogManagementProps {
  businessId: string;
}

export function BlogManagement({ businessId }: BlogManagementProps) {
  const [activeSubTab, setActiveSubTab] = useState<"posts" | "comments">("posts");

  return (
    <div className="space-y-6">
      {/* Sub-navigation */}
      <div className="flex gap-2 border-b pb-4" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <button
          onClick={() => setActiveSubTab("posts")}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            activeSubTab === "posts"
              ? "bg-blue-600 text-white"
              : "text-gray-400 hover:text-white hover:bg-gray-800"
          }`}
        >
          Blog Posts
        </button>
        <button
          onClick={() => setActiveSubTab("comments")}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            activeSubTab === "comments"
              ? "bg-blue-600 text-white"
              : "text-gray-400 hover:text-white hover:bg-gray-800"
          }`}
        >
          Comments
        </button>
      </div>

      {/* Content */}
      <div>
        {activeSubTab === "posts" && <BlogsTab businessId={businessId} />}
        {activeSubTab === "comments" && <CommentsTab businessId={businessId} />}
      </div>
    </div>
  );
}
