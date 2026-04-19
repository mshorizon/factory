import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
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
} from "lucide-react";

export type TaskRecord = {
  id: string;
  status: "pending" | "in-progress" | "done" | "failed";
  domain: string;
  template: string;
  location: string;
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
};

const TEMPLATE_OPTIONS = [
  { value: "specialist", label: "specialist" },
  { value: "portfolio-law", label: "portfolio-law" },
];

const LOCATION_GROUPS: Array<{
  label: string;
  options: Array<{ value: string; label: string; description: string }>;
}> = [
  {
    label: "Pages",
    options: [
      { value: "home-hero", label: "home-hero", description: "Hero section on home page" },
      { value: "home-services", label: "home-services", description: "Services block on home page" },
      { value: "home-about-preview", label: "home-about-preview", description: "About preview on home" },
      { value: "about", label: "about", description: "About page content & sections" },
      { value: "services", label: "services", description: "Services page content & sections" },
      { value: "contact", label: "contact", description: "Contact page & form" },
      { value: "blog", label: "blog", description: "Blog index and posts" },
    ],
  },
  {
    label: "System",
    options: [
      { value: "admin-panel", label: "admin-panel", description: "Admin UI (apps/engine/src/components/admin)" },
      { value: "data", label: "data", description: "Templates and seeded DB data" },
      { value: "schema", label: "schema", description: "packages/schema (JSON schema + types)" },
      { value: "engine", label: "engine", description: "Astro engine (routes, API, layouts)" },
      { value: "other", label: "other", description: "Something else — Claude will ask" },
    ],
  },
];

const DEFAULT_LOCATION = "admin-panel";

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - then);
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} ${min === 1 ? "minute" : "minutes"} ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} ${hr === 1 ? "hour" : "hours"} ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day} ${day === 1 ? "day" : "days"} ago`;
  const mo = Math.floor(day / 30);
  if (mo < 12) return `${mo} ${mo === 1 ? "month" : "months"} ago`;
  const yr = Math.floor(day / 365);
  return `${yr} ${yr === 1 ? "year" : "years"} ago`;
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
      <Badge className="gap-1 bg-blue-500 text-white hover:bg-blue-500/90 dark:bg-blue-600 dark:hover:bg-blue-600/90">
        <Loader2 className="h-3 w-3 animate-spin" />
        In Progress
      </Badge>
    );
  }
  if (status === "done") {
    return (
      <Badge className="gap-1 bg-emerald-600 text-white hover:bg-emerald-600/90 dark:bg-emerald-700 dark:hover:bg-emerald-700/90">
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
}: TaskManagerProps) {
  const domainOptions = useMemo(() => {
    const set = new Set<string>([currentDomain, ...(availableDomains ?? [])].filter(Boolean));
    return Array.from(set);
  }, [currentDomain, availableDomains]);

  const [domain, setDomain] = useState(currentDomain);
  const [template, setTemplate] = useState(currentTemplate || "specialist");
  const [location, setLocation] = useState(DEFAULT_LOCATION);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tasks", { credentials: "include" });
      if (!res.ok) throw new Error(`Failed to load tasks (${res.status})`);
      const data = await res.json();
      setTasks(data.tasks ?? []);
    } catch (err) {
      setBanner({
        type: "err",
        msg: err instanceof Error ? err.message : "Failed to load tasks",
      });
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
    const timer = setTimeout(() => setBanner(null), 4000);
    return () => clearTimeout(timer);
  }, [banner]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
          location,
          description: description.trim(),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `Failed (${res.status})`);
      }
      setDescription("");
      setBanner({ type: "ok", msg: "Task added" });
      await loadTasks();
    } catch (err) {
      setBanner({
        type: "err",
        msg: err instanceof Error ? err.message : "Failed to add task",
      });
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
        Queue work for the <code className="rounded bg-muted px-1 py-0.5 text-xs">/task</code> slash
        command. Claude Code picks up pending tasks and executes them sequentially.
      </p>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add new task
          </CardTitle>
          <CardDescription>
            Describe what Claude should do. Choose the target domain, template and location in the codebase.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="task-domain">Domain</Label>
                <Select value={domain} onValueChange={(v) => setDomain(v as string)}>
                  <SelectTrigger id="task-domain" className="w-full">
                    <SelectValue placeholder="Select domain" />
                  </SelectTrigger>
                  <SelectContent>
                    {domainOptions.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
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
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="task-location">Location</Label>
                <Select value={location} onValueChange={(v) => setLocation(v as string)}>
                  <SelectTrigger id="task-location" className="w-full">
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {LOCATION_GROUPS.map((group) => (
                      <SelectGroup key={group.label}>
                        <SelectLabel>{group.label}</SelectLabel>
                        {group.options.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            <div className="flex flex-col">
                              <span>{opt.label}</span>
                              <span className="text-xs text-muted-foreground">{opt.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

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
              <Button type="submit" disabled={submitting || description.trim().length < 3}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Add Task
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Separator />

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Queue</h2>
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
                      {task.isSuperAdmin && (
                        <Badge variant="ghost" className="text-[10px] uppercase tracking-wide">
                          super admin
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">{timeAgo(task.createdAt)}</span>
                  </div>

                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span>{task.domain}</span>
                    <span>/</span>
                    <span>{task.template}</span>
                    <span>/</span>
                    <span className="font-medium text-foreground/80">{task.location}</span>
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
