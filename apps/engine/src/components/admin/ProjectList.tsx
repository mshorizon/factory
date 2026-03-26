import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { DataTable } from "./DataTable";

interface Project {
  id: number;
  slug: string;
  title: string;
  status: string;
  publishedAt: string | null;
  createdAt: string;
}

interface ProjectListProps {
  projects: Project[];
  onEdit: (project: Project) => void;
  onDelete: (projectId: number) => void;
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

export function ProjectList({ projects, onEdit, onDelete, onCreate }: ProjectListProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDelete = async (projectId: number, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;
    setDeletingId(projectId);
    try {
      await onDelete(projectId);
    } finally {
      setDeletingId(null);
    }
  };

  const columns: ColumnDef<Project, unknown>[] = [
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => (
        <div>
          <div className="font-medium text-sm">{row.original.title}</div>
          <div className="text-xs text-muted-foreground">/projects/{row.original.slug}</div>
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
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <Button size="sm" variant="ghost" onClick={() => onEdit(row.original)}>
            Edit
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={() => handleDelete(row.original.id, row.original.title)}
            disabled={deletingId === row.original.id}
          >
            {deletingId === row.original.id ? "..." : "Delete"}
          </Button>
        </div>
      ),
    },
  ];

  if (projects.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Projects</h2>
          <Button size="sm" onClick={onCreate}>
            <Plus className="h-4 w-4 mr-1.5" />
            New Project
          </Button>
        </div>
        <div className="text-center py-12 bg-muted/30 rounded-lg border border-border">
          <p className="text-muted-foreground mb-4">No projects yet</p>
          <Button onClick={onCreate}>Create Your First Project</Button>
        </div>
      </div>
    );
  }

  return (
    <DataTable
      columns={columns}
      data={projects}
      toolbar={
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Projects</h2>
          <Button size="sm" onClick={onCreate}>
            <Plus className="h-4 w-4 mr-1.5" />
            New Project
          </Button>
        </div>
      }
    />
  );
}
