import { useState, useEffect } from "react";
import { ProjectList } from "./ProjectList";
import { ProjectEditorClient } from "./ProjectEditorClient";
import { Star } from "lucide-react";

interface ProjectsTabProps {
  businessId: string;
  primaryLanguage?: "en" | "pl";
}

export function ProjectsTab({ businessId, primaryLanguage = "en" }: ProjectsTabProps) {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "edit" | "create">("list");
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [activeLang, setActiveLang] = useState<"en" | "pl">(primaryLanguage);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/projects/list?business=${businessId}&lang=${activeLang}`);
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [businessId, activeLang]);

  const handleCreate = () => {
    setSelectedProject(null);
    setView("create");
  };

  const handleEdit = (project: any) => {
    setSelectedProject(project);
    setView("edit");
  };

  const handleDelete = async (projectId: number) => {
    try {
      const response = await fetch("/api/admin/projects/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });

      if (response.ok) {
        await fetchProjects();
      } else {
        alert("Failed to delete project");
      }
    } catch (error) {
      console.error("Error deleting project:", error);
      alert("Error deleting project");
    }
  };

  const handleSave = async () => {
    await fetchProjects();
    setView("list");
    setSelectedProject(null);
  };

  const handleCancel = () => {
    setView("list");
    setSelectedProject(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="opacity-60">Loading projects...</div>
      </div>
    );
  }

  if (view === "create" || view === "edit") {
    return (
      <ProjectEditorClient
        project={selectedProject}
        businessId={businessId}
        lang={activeLang}
        primaryLanguage={primaryLanguage}
        onSave={handleSave}
        onCancel={handleCancel}
      />
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

      <ProjectList
        projects={projects}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onCreate={handleCreate}
      />
    </div>
  );
}
