import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Plus,
  CheckCircle2,
  XCircle,
  Circle,
  ListTodo,
  ShieldAlert,
} from "lucide-react";
import type { BusinessPageMeta } from "./AdminForm";

export type TaskRecord = {
  id: string;
  status: "pending" | "in-progress" | "done" | "failed";
  domain: string;
  template: string;
  location: string;
  page: string | null;
  section: string | null;
  isAdminPanel: boolean;
  description: string;
  isSuperAdmin: boolean;
  createdAt: string;
  updatedAt: string;
};

type TaskManagerProps = {
  currentDomain: string;
  currentTemplate?: string;
  isSuperAdmin: boolean;
  availableDomains?: string[];
  businessPages?: BusinessPageMeta[];
};

const TEMPLATE_OPTIONS = [
  { value: "specialist", label: "specialist" },
  { value: "portfolio-law", label: "portfolio-law" },
  { value: "portfolio-tech", label: "portfolio-tech" },
  { value: "portfolio-art", label: "portfolio-art" },
];

// Admin panel "pages" = nav groups, "sections" = nav items within that group
const ADMIN_PAGES = [
  {
    name: "dashboards",
    label: "Dashboards",
    sections: ["analytics", "status"],
  },
  {
    name: "business",
    label: "Business",
    sections: ["business-general", "notifications", "business-assets"],
  },
  {
    name: "data",
    label: "Data",
    sections: ["data-products", "data-services", "blog", "projects", "orders", "bookings", "files"],
  },
  {
    name: "website",
    label: "Website",
    sections: ["theme", "navbar", "footer", "translations"],
  },
  {
    name: "pages",
    label: "Pages",
    sections: ["page-home", "page-about", "page-services", "page-contact", "page-blog"],
  },
  {
    name: "automation",
    label: "Automation",
    sections: ["tasks"],
  },
  {
    name: "administration",
    label: "Administration (super-admin)",
    sections: ["overview", "users"],
  },
];

function timeAgo(iso: string): string {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  return `${Math.floor(day / 30)}mo ago`;
}

function StatusBadge({ status }: { status: TaskRecord["status"] }) {
  if (status === "pending") {
    return (
      <Badge variant="outline" className="gap-1">
        <Circle className="h-3 w-3" />
        Pending
      </Badge>
    );
  }
  if (status === "in-progress") {
    return (
      <Badge className="gap-1 bg-blue-500 text-white hover:bg-blue-500/90 dark:bg-blue-600">
        <Loader2 className="h-3 w-3 animate-spin" />
        In Progress
      </Badge>
    );
  }
  if (status === "done") {
    return (
      <Badge className="gap-1 bg-emerald-600 text-white hover:bg-emerald-600/90 dark:bg-emerald-700">
        <CheckCircle2 className="h-3 w-3" />
        Done
      </Badge>
    );
  }
  return (
    <Badge variant="destructive" className="gap-1">
      <XCircle className="h-3 w-3" />
      Failed
    </Badge>
  );
}

export default function TaskManager({
  currentDomain,
  currentTemplate,
  isSuperAdmin,
  availableDomains = [],
  businessPages = [],
}: TaskManagerProps) {
  const domainOptions = useMemo(() => {
    const set = new Set<string>([currentDomain, ...availableDomains].filter(Boolean));
    return Array.from(set);
  }, [currentDomain, availableDomains]);

  // Form state
  const [domain, setDomain] = useState(currentDomain);
  const [template, setTemplate] = useState(currentTemplate || "specialist");
  const [isAdminPanel, setIsAdminPanel] = useState(false);
  const [page, setPage] = useState("");
  const [section, setSection] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [banner, setBanner] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  // Task list state
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // When switching between site/admin mode, reset page/section
  useEffect(() => {
    setPage("");
    setSection("");
  }, [isAdminPanel]);

  // When page changes, reset section
  useEffect(() => {
    setSection("");
  }, [page]);

  const currentPages = isAdminPanel ? ADMIN_PAGES : businessPages;

  const currentSections = useMemo(() => {
    if (!page) return [];
    const p = currentPages.find((p) => p.name === page);
    return p?.sections ?? [];
  }, [page, currentPages]);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tasks", { credentials: "include" });
      if (!res.ok) throw new Error(`Failed to load tasks (${res.status})`);
      const data = await res.json();
      setTasks(data.tasks ?? []);
    } catch (err) {
      setBanner({ type: "err", msg: err instanceof Error ? err.message : "Failed to load tasks" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
    const interval = setInterval(loadTasks, 15000);
    return () => clearInterval(interval);
  }, [loadTasks]);

  useEffect(() => {
    if (!banner) return;
    const t = setTimeout(() => setBanner(null), 4000);
    return () => clearTimeout(t);
  }, [banner]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!page) {
      setBanner({ type: "err", msg: "Select a page" });
      return;
    }
    if (description.trim().length < 3) {
      setBanner({ type: "err", msg: "Description must be at least 3 characters" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain,
          template,
          page,
          section: section || null,
          isAdminPanel,
          description: description.trim(),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `Failed (${res.status})`);
      }
      setPage("");
      setSection("");
      setDescription("");
      setBanner({ type: "ok", msg: "Task added" });
      await loadTasks();
    } catch (err) {
      setBanner({ type: "err", msg: err instanceof Error ? err.message : "Failed to add task" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 max-w-4xl mx-auto w-full">
      <div className="flex items-center gap-2">
        <ListTodo className="h-5 w-5" />
        <h1 className="text-xl font-semibold">Tasks for Claude Code</h1>
      </div>
      <p className="text-sm text-muted-foreground -mt-4">
        Queue work for the{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-xs">/task</code> slash command.
        Claude Code picks up pending tasks and executes them sequentially.
      </p>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add new task
          </CardTitle>
          <CardDescription>
            Select the target domain, template, page and section. Toggle admin panel mode if the
            issue is in the admin UI itself.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {/* Row 1: domain + template */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="task-domain">Domain</Label>
                <Select value={domain} onValueChange={(v) => setDomain(v as string)}>
                  <SelectTrigger id="task-domain" className="w-full">
                    <SelectValue placeholder="Select domain" />
                  </SelectTrigger>
                  <SelectContent>
                    {domainOptions.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!isSuperAdmin && (
                  <p className="text-xs text-muted-foreground">Your business only.</p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="task-template">Template</Label>
                <Select value={template} onValueChange={(v) => setTemplate(v as string)}>
                  <SelectTrigger id="task-template" className="w-full">
                    <SelectValue placeholder="Select template" />
                  </SelectTrigger>
                  <SelectContent>
                    {TEMPLATE_OPTIONS.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Admin panel switch */}
            <div className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5">
              <ShieldAlert className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex flex-col gap-0.5 flex-1">
                <span className="text-sm font-medium">Admin panel</span>
                <span className="text-xs text-muted-foreground">
                  Enable when the admin panel itself is broken or needs fixing
                </span>
              </div>
              <Switch
                id="task-admin-panel"
                checked={isAdminPanel}
                onCheckedChange={setIsAdminPanel}
              />
            </div>

            {/* Row 2: page + section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="task-page">
                  {isAdminPanel ? "Admin group" : "Page"}
                </Label>
                <Select value={page} onValueChange={(v) => setPage(v as string)}>
                  <SelectTrigger id="task-page" className="w-full">
                    <SelectValue placeholder={isAdminPanel ? "Select admin group" : "Select page"} />
                  </SelectTrigger>
                  <SelectContent>
                    {currentPages.length === 0 ? (
                      <SelectItem value="__none" disabled>No pages available</SelectItem>
                    ) : (
                      currentPages.map((p) => (
                        <SelectItem key={p.name} value={p.name}>
                          {isAdminPanel ? (p as typeof ADMIN_PAGES[0]).label ?? p.name : p.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="task-section">
                  {isAdminPanel ? "Admin tab" : "Section"}
                  <span className="ml-1 text-xs text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Select
                  value={section}
                  onValueChange={(v) => setSection(v as string)}
                  disabled={!page || currentSections.length === 0}
                >
                  <SelectTrigger id="task-section" className="w-full">
                    <SelectValue placeholder={
                      !page
                        ? "Select page first"
                        : currentSections.length === 0
                        ? "No sections"
                        : isAdminPanel ? "Select tab" : "Select section"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {currentSections.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="task-description">Task description</Label>
              <Textarea
                id="task-description"
                rows={3}
                placeholder="Describe what Claude Code should do..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={submitting}
              />
            </div>

            {banner && (
              <div
                className={`text-sm rounded-md border px-3 py-2 ${
                  banner.type === "ok"
                    ? "border-emerald-600/30 bg-emerald-600/10 text-emerald-700 dark:text-emerald-400"
                    : "border-destructive/30 bg-destructive/10 text-destructive"
                }`}
              >
                {banner.msg}
              </div>
            )}

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={submitting || !page || description.trim().length < 3}
              >
                {submitting ? (
                  <><Loader2 className="h-4 w-4 animate-spin" />Adding...</>
                ) : (
                  <><Plus className="h-4 w-4" />Add Task</>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Separator />

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">
            Queue
            {tasks.length > 0 && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({tasks.filter((t) => t.status === "pending").length} pending)
              </span>
            )}
          </h2>
          <Button variant="ghost" size="sm" onClick={loadTasks} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
          </Button>
        </div>

        {loading && tasks.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Loading tasks...
          </div>
        ) : tasks.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No tasks yet. Add your first task above.
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {tasks.map((task) => (
              <Card key={task.id} size="sm">
                <CardContent className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <StatusBadge status={task.status} />
                      {task.isAdminPanel && (
                        <Badge variant="outline" className="gap-1 text-[10px]">
                          <ShieldAlert className="h-2.5 w-2.5" />
                          admin panel
                        </Badge>
                      )}
                      {task.isSuperAdmin && (
                        <Badge variant="ghost" className="text-[10px] uppercase tracking-wide">
                          super admin
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">{timeAgo(task.createdAt)}</span>
                  </div>

                  <div className="flex items-center gap-1 text-xs text-muted-foreground flex-wrap">
                    <span>{task.domain}</span>
                    <span>/</span>
                    <span>{task.template}</span>
                    <span>/</span>
                    <span className="font-medium text-foreground/80">
                      {task.page ?? task.location}
                    </span>
                    {task.section && (
                      <>
                        <span>#</span>
                        <span className="font-medium text-foreground/80">{task.section}</span>
                      </>
                    )}
                  </div>

                  <div className="text-sm whitespace-pre-wrap break-words">{task.description}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
