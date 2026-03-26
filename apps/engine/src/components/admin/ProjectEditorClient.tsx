import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { Languages, Loader2, Star } from "lucide-react";

interface ProjectEditorClientProps {
  project?: any;
  businessId: string;
  lang: "en" | "pl";
  primaryLanguage: "en" | "pl";
  onSave: () => void;
  onCancel: () => void;
}

export function ProjectEditorClient({
  project,
  businessId,
  lang,
  primaryLanguage,
  onSave,
  onCancel,
}: ProjectEditorClientProps) {
  const isEditing = !!project;
  const isPrimary = lang === primaryLanguage;

  const [formData, setFormData] = useState({
    slug: project?.slug || "",
    title: project?.title || "",
    description: project?.description || "",
    image: project?.image || "",
    category: project?.category || "",
    tags: project?.tags?.join(", ") || "",
    status: project?.status || "draft",
  });

  const [saving, setSaving] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [error, setError] = useState("");

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

  const handleTranslateFromPrimary = async () => {
    setTranslating(true);
    setError("");

    try {
      const slug = formData.slug || project?.slug;
      if (!slug) {
        setError("Save the project in the primary language first (slug is required).");
        setTranslating(false);
        return;
      }

      const listRes = await fetch(
        `/api/admin/projects/list?business=${businessId}&lang=${primaryLanguage}`
      );
      if (!listRes.ok) throw new Error("Failed to fetch primary language projects");

      const listData = await listRes.json();
      const primaryProject = listData.projects?.find((p: any) => p.slug === slug);

      if (!primaryProject) {
        setError(
          `No project with slug "${slug}" found in ${primaryLanguage === "en" ? "English" : "Polski"}. Write it in the primary language first.`
        );
        setTranslating(false);
        return;
      }

      const fieldsToTranslate: { key: string; value: string }[] = [];
      const textFields = ["title", "description", "category"] as const;

      for (const field of textFields) {
        if (!formData[field]?.trim() && primaryProject[field]?.trim()) {
          fieldsToTranslate.push({ key: field, value: primaryProject[field] });
        }
      }

      if (fieldsToTranslate.length === 0) {
        setError("All fields are already filled. Nothing to translate.");
        setTranslating(false);
        return;
      }

      const res = await fetch("/api/admin/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          texts: fieldsToTranslate.map((f) => f.value),
          from: primaryLanguage,
          to: lang,
        }),
      });
      if (!res.ok) throw new Error("Translation failed");
      const data = await res.json();

      const newFormData = { ...formData };
      fieldsToTranslate.forEach((f, i) => {
        (newFormData as any)[f.key] = data.translations[i];
      });

      if (!newFormData.image && primaryProject.image) newFormData.image = primaryProject.image;
      if (!newFormData.tags && primaryProject.tags?.length) newFormData.tags = primaryProject.tags.join(", ");

      setFormData(newFormData);
    } catch (err) {
      setError("Translation error: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setTranslating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const endpoint = isEditing
        ? "/api/admin/projects/update"
        : "/api/admin/projects/create";

      const payload = {
        businessId,
        ...(isEditing && { projectId: project.id }),
        project: {
          ...formData,
          lang,
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
        throw new Error(data.error || "Failed to save project");
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
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold">
            {isEditing ? "Edit Project" : "Create New Project"}
          </h2>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-muted">
            {isPrimary && <Star className="h-3 w-3 text-amber-500 fill-amber-500" />}
            {lang === "en" ? "English" : "Polski"}
          </span>
        </div>
        <div className="flex gap-2">
          {!isPrimary && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleTranslateFromPrimary}
                    disabled={translating}
                  >
                    {translating ? (
                      <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" />Translating...</>
                    ) : (
                      <><Languages className="h-4 w-4 mr-1.5" />Translate from primary</>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Only empty fields will be translated</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : isEditing ? "Update" : "Create"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-md text-destructive">
          {error}
        </div>
      )}

      {!isPrimary && (
        <div className="p-3 rounded-lg border bg-blue-500/5 border-blue-500/20 text-sm">
          <span className="font-medium">
            {lang === "pl" ? "Secondary language" : "Secondary language"}
          </span>
          {" — "}
          {primaryLanguage === "en" ? "English" : "Polski"}{" "}
          is the primary language. Use the "Translate" button to fill empty fields.
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
              className="w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary/20 bg-background"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Slug *</label>
            <input
              type="text"
              required
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary/20 bg-background"
            />
            <p className="text-xs opacity-60 mt-1">Identifier: {formData.slug || "slug"}</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary/20 resize-none bg-background"
            />
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Image URL</label>
            <input
              type="url"
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary/20 bg-background"
              placeholder="https://..."
            />
            {formData.image && (
              <div className="mt-2 rounded-md overflow-hidden border border-border">
                <img src={formData.image} alt="Preview" className="w-full h-32 object-cover" />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary/20 bg-background"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Tags (comma-separated)</label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary/20 bg-background"
              placeholder="tag1, tag2, tag3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary/20 bg-background"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
        </div>
      </div>
    </form>
  );
}
