import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Loader2, Plus, ShieldAlert } from "lucide-react";
import type { BusinessPageMeta } from "./AdminForm";

async function fetchWithRefresh(input: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(input, { ...init, credentials: "include" });
  if (res.status !== 401) return res;
  const refreshRes = await fetch("/api/auth/refresh", { method: "POST", credentials: "include" });
  if (!refreshRes.ok) return res;
  return fetch(input, { ...init, credentials: "include" });
}

// Fallback used only if the templates API is unreachable. The live list is
// fetched from /api/admin/templates so new templates from the repo show up
// without editing this file.
const FALLBACK_TEMPLATE_OPTIONS = [
  { value: "template-specialist", label: "template-specialist" },
  { value: "template-law", label: "template-law" },
  { value: "template-tech", label: "template-tech" },
  { value: "template-art", label: "template-art" },
];

const WHOLE_WEBSITE_PAGE: BusinessPageMeta & { label: string } = {
  name: "whole-website",
  label: "Whole website",
  sections: [],
};

const ADMIN_PAGES = [
  { name: "dashboards", label: "Dashboards", sections: ["analytics", "status"] },
  { name: "business", label: "Business", sections: ["business-general", "notifications", "business-assets"] },
  { name: "data", label: "Data", sections: ["data-products", "data-services", "blog", "projects", "orders", "bookings", "files"] },
  { name: "website", label: "Website", sections: ["theme", "navbar", "footer", "translations"] },
  { name: "pages", label: "Pages", sections: ["page-home", "page-about", "page-services", "page-contact", "page-blog"] },
  { name: "administration", label: "Administration (super-admin)", sections: ["strategy", "tasks", "businesses", "overview", "users", "scripts", "business-json"] },
];

type Props = {
  open: boolean;
  onClose: () => void;
  currentDomain: string;
  currentTemplate?: string;
  isSuperAdmin: boolean;
  availableDomains?: string[];
  businessPages?: BusinessPageMeta[];
};

export function AddTaskDialog({
  open,
  onClose,
  currentDomain,
  currentTemplate,
  isSuperAdmin,
  availableDomains = [],
  businessPages = [],
}: Props) {
  const domainOptions = useMemo(() => {
    const set = new Set<string>([currentDomain, ...availableDomains].filter(Boolean));
    return Array.from(set);
  }, [currentDomain, availableDomains]);

  const [domain, setDomain] = useState(currentDomain);
  const [template, setTemplate] = useState(currentTemplate || "specialist");
  const [templateOptions, setTemplateOptions] = useState(FALLBACK_TEMPLATE_OPTIONS);
  const [isAdminPanel, setIsAdminPanel] = useState(false);
  const [page, setPage] = useState<string | null>(null);
  const [section, setSection] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [banner, setBanner] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  // Load the live template list from the repo's templates/ folder when opened
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    fetchWithRefresh("/api/admin/templates")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data?.templates?.length) return;
        setTemplateOptions(
          data.templates.map((name: string) => ({ value: name, label: name }))
        );
      })
      .catch(() => {/* keep fallback list */});
    return () => {
      cancelled = true;
    };
  }, [open]);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setDomain(currentDomain);
      setTemplate(currentTemplate || "specialist");
      setIsAdminPanel(false);
      setPage(null);
      setSection(null);
      setDescription("");
      setBanner(null);
    }
  }, [open, currentDomain, currentTemplate]);

  useEffect(() => {
    setPage(null);
    setSection(null);
  }, [isAdminPanel]);

  useEffect(() => {
    setSection(null);
  }, [page]);

  useEffect(() => {
    if (!banner) return;
    const t = setTimeout(() => setBanner(null), 4000);
    return () => clearTimeout(t);
  }, [banner]);

  const currentPages = isAdminPanel
    ? ADMIN_PAGES
    : [WHOLE_WEBSITE_PAGE, ...businessPages];

  const currentSections = useMemo(() => {
    if (!page) return [];
    if (isAdminPanel) {
      const p = ADMIN_PAGES.find((p) => p.name === page);
      return p?.sections ?? [];
    }
    if (page === "whole-website") return ["navbar", "footer"];
    const p = businessPages.find((p) => p.name === page);
    const pageSections = (p?.sections ?? []).filter((s) => s !== "navbar" && s !== "footer");
    return ["navbar", ...pageSections, "footer"];
  }, [page, isAdminPanel, businessPages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (description.trim().length < 3) {
      setBanner({ type: "err", msg: "Description must be at least 3 characters" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetchWithRefresh("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain,
          template,
          page: page ?? null,
          section: section ?? null,
          isAdminPanel,
          description: description.trim(),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `Failed (${res.status})`);
      }
      setBanner({ type: "ok", msg: "Task added" });
      setTimeout(() => onClose(), 1200);
    } catch (err) {
      setBanner({ type: "err", msg: err instanceof Error ? err.message : "Failed to add task" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add new task
          </DialogTitle>
          <DialogDescription>
            Select the target domain, template, page and section. Toggle admin panel mode if the
            issue is in the admin UI itself.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="quick-task-domain">Domain</Label>
              <Select value={domain} onValueChange={(v) => setDomain(v as string)}>
                <SelectTrigger id="quick-task-domain" className="w-full">
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
              <Label htmlFor="quick-task-template">Template</Label>
              <Select value={template} onValueChange={(v) => setTemplate(v as string)}>
                <SelectTrigger id="quick-task-template" className="w-full">
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  {templateOptions.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5">
            <ShieldAlert className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex flex-col gap-0.5 flex-1">
              <span className="text-sm font-medium">Admin panel</span>
              <span className="text-xs text-muted-foreground">
                Enable when the admin panel itself is broken or needs fixing
              </span>
            </div>
            <Switch
              id="quick-task-admin-panel"
              checked={isAdminPanel}
              onCheckedChange={setIsAdminPanel}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="quick-task-page">
                {isAdminPanel ? "Admin group" : "Page"}
                <span className="ml-1 text-xs text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Select value={page ?? undefined} onValueChange={(v) => setPage(v ?? null)}>
                <SelectTrigger id="quick-task-page" className="w-full">
                  <SelectValue placeholder={isAdminPanel ? "Select admin group" : "Select page"} />
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false}>
                  {currentPages.length === 0 ? (
                    <SelectItem value="__none" disabled>No pages available</SelectItem>
                  ) : (
                    currentPages.map((p) => (
                      <SelectItem key={p.name} value={p.name}>
                        {(p as { label?: string }).label ?? p.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="quick-task-section">
                {isAdminPanel ? "Admin tab" : "Section"}
                <span className="ml-1 text-xs text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Select
                key={page ?? "__no-page"}
                value={section ?? undefined}
                onValueChange={(v) => setSection(v ?? null)}
                disabled={!page || currentSections.length === 0}
              >
                <SelectTrigger id="quick-task-section" className="w-full">
                  <SelectValue placeholder={
                    !page
                      ? "Select page first"
                      : currentSections.length === 0
                      ? "No sections"
                      : isAdminPanel ? "Select tab" : "Select section"
                  } />
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false}>
                  {currentSections.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="quick-task-description">Task description</Label>
            <Textarea
              id="quick-task-description"
              rows={5}
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

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || description.trim().length < 3}>
              {submitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" />Adding...</>
              ) : (
                <><Plus className="h-4 w-4" />Add Task</>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
