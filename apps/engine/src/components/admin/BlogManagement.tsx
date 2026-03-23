import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BlogsTab } from "./BlogsTab";
import { CommentsTab } from "./CommentsTab";

interface BlogManagementProps {
  businessId: string;
  primaryLanguage?: "en" | "pl";
}

export function BlogManagement({ businessId, primaryLanguage = "en" }: BlogManagementProps) {
  return (
    <Tabs defaultValue="posts">
      <TabsList>
        <TabsTrigger value="posts">Blog Posts</TabsTrigger>
        <TabsTrigger value="comments">Comments</TabsTrigger>
      </TabsList>

      <TabsContent value="posts" className="mt-4">
        <BlogsTab businessId={businessId} primaryLanguage={primaryLanguage} />
      </TabsContent>

      <TabsContent value="comments" className="mt-4">
        <CommentsTab businessId={businessId} />
      </TabsContent>
    </Tabs>
  );
}
