import type { ColumnDef } from "@tanstack/react-table";
import { UniversalList } from "./UniversalList";

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
  ];

  return (
    <UniversalList<Project>
      title="Projects"
      data={projects}
      columns={columns}
      primaryAction={{ label: "New Project", onClick: onCreate }}
      emptyTitle="No projects yet"
      emptyCta={{ label: "Create Your First Project", onClick: onCreate }}
      getRowId={(row) => row.id}
      rowActions={[
        {
          label: "Edit",
          onClick: (project) => onEdit(project),
        },
        {
          label: "Delete",
          variant: "ghost",
          className: "text-destructive hover:text-destructive",
          trackBusy: true,
          confirm: (project) => `Are you sure you want to delete "${project.title}"?`,
          onClick: (project) => onDelete(project.id),
        },
      ]}
    />
  );
}
