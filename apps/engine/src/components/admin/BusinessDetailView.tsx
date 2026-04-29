import React, { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Circle,
  Clock,
  Copy,
  ExternalLink,
  File,
  Loader2,
  Mail,
  RefreshCw,
  Rocket,
  Shield,
  Trash2,
  XCircle,
  ZapOff,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

interface BusinessFile {
  id: number;
  name: string;
  originalName: string;
  url: string;
  r2Key: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

interface TaskRecord {
  id: string;
  status: string;
  domain: string;
  template: string;
  location: string;
  description: string;
  clarification: string | null;
  createdAt: string;
  updatedAt: string;
}

interface UptimeStats {
  total: number;
  healthy: number;
  degraded: number;
  unhealthy: number;
  uptimePercent: number;
  avgLatencyMs: number;
}

interface LatestCheck {
  id: number;
  status: string;
  latencyMs: number | null;
  checkedAt: string;
}

interface SiteDetail {
  id: number;
  subdomain: string;
  businessName: string;
  industry: string | null;
  status: string;
  config: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  lastDeployedAt: string | null;
}

interface DetailData {
  site: SiteDetail;
  files: BusinessFile[];
  tasks: TaskRecord[];
  uptime: {
    stats: UptimeStats;
    latestCheck: LatestCheck | null;
  };
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmt(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function TaskStatusIcon({ status }: { status: string }) {
  if (status === "done") return <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />;
  if (status === "failed") return <XCircle className="h-3.5 w-3.5 text-destructive" />;
  if (status === "in-progress") return <Loader2 className="h-3.5 w-3.5 text-blue-500 animate-spin" />;
  if (status === "on_hold") return <AlertTriangle className="h-3.5 w-3.5 text-yellow-500" />;
  return <Circle className="h-3.5 w-3.5 text-muted-foreground" />;
}

function SiteStatusBadge({ status }: { status: string }) {
  if (status === "released") return <Badge className="bg-green-600/15 text-green-700 border-green-600/25">released</Badge>;
  if (status === "suspended") return <Badge className="bg-yellow-500/15 text-yellow-700 border-yellow-500/25">suspended</Badge>;
  return <Badge variant="secondary">{status}</Badge>;
}

// ── Email templates ────────────────────────────────────────────────────────────

function buildEmailHtml(params: {
  type: "proposal" | "go-live" | "suspension" | "renewal";
  businessName: string;
  subdomain: string;
  customBody: string;
}) {
  const { businessName, subdomain, customBody } = params;
  return `<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;color:#0f172a;max-width:600px;margin:0 auto;padding:24px;">
<p>Dzień dobry,</p>
${customBody.split("\n").map((p) => `<p>${p}</p>`).join("")}
<p style="margin-top:24px;color:#64748b;font-size:13px;">Z poważaniem,<br/>Hazelgrouse Studio</p>
</body>
</html>`;
}

const EMAIL_TEMPLATES: Record<
  string,
  (businessName: string, subdomain: string) => { subject: string; body: string }
> = {
  proposal: (businessName, subdomain) => ({
    subject: `Podgląd strony dla ${businessName} jest gotowy`,
    body: `Przygotowaliśmy podgląd strony internetowej dla "${businessName}".\n\nMożesz ją zobaczyć tutaj: https://${subdomain}.dev.hazelgrouse.pl\n\nCzy jesteś zainteresowany/a współpracą? Chętnie omówimy szczegóły.`,
  }),
  "go-live": (businessName, subdomain) => ({
    subject: `Strona ${businessName} jest już na żywo!`,
    body: `Twoja strona internetowa "${businessName}" jest teraz dostępna publicznie.\n\nAdres: https://${subdomain}.hazelgrouse.pl\n\nZapraszamy do sprawdzenia i przekazania opinii.`,
  }),
  suspension: (businessName, _subdomain) => ({
    subject: `Zawieszenie strony ${businessName}`,
    body: `Informujemy, że strona "${businessName}" została tymczasowo zawieszona.\n\nAby przywrócić dostęp, prosimy o kontakt.`,
  }),
  renewal: (businessName, _subdomain) => ({
    subject: `Przypomnienie o odnowieniu usługi — ${businessName}`,
    body: `Przypominamy, że termin odnowienia Twojej subskrypcji dla "${businessName}" zbliża się.\n\nAby zachować ciągłość działania strony, prosimy o dokonanie płatności.`,
  }),
};

// ── Email Action Modal ─────────────────────────────────────────────────────────

interface EmailModalProps {
  open: boolean;
  type: string;
  site: SiteDetail;
  onClose: () => void;
}

function EmailModal({ open, type, site, onClose }: EmailModalProps) {
  const templateFn = EMAIL_TEMPLATES[type];
  const defaults = templateFn
    ? templateFn(site.businessName, site.subdomain)
    : { subject: "", body: "" };

  const [subject, setSubject] = useState(defaults.subject);
  const [body, setBody] = useState(defaults.body);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && templateFn) {
      const d = templateFn(site.businessName, site.subdomain);
      setSubject(d.subject);
      setBody(d.body);
      setSent(false);
      setError(null);
    }
  }, [open, type, site.businessName, site.subdomain]);

  const send = async () => {
    setSending(true);
    setError(null);
    try {
      const html = buildEmailHtml({ type: type as any, businessName: site.businessName, subdomain: site.subdomain, customBody: body });
      const res = await fetch(`/api/admin/businesses/${site.id}/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailType: type, subject, html }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to send"); return; }
      setSent(true);
      setTimeout(onClose, 1500);
    } catch {
      setError("Network error");
    } finally {
      setSending(false);
    }
  };

  const typeLabels: Record<string, string> = {
    proposal: "Send Proposal",
    "go-live": "Send Go-live Confirmation",
    suspension: "Send Suspension Notice",
    renewal: "Send Renewal Reminder",
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{typeLabels[type] ?? "Send Email"}</DialogTitle>
          <DialogDescription>
            Preview and edit before sending to the business owner.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 my-2">
          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2 text-sm text-destructive">{error}</div>
          )}
          {sent && (
            <div className="rounded-md bg-green-500/10 border border-green-500/30 px-3 py-2 text-sm text-green-700">Email sent!</div>
          )}
          <div className="space-y-1.5">
            <Label>Subject</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Body</Label>
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={6} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={sending}>Cancel</Button>
          <Button onClick={send} disabled={sending || sent}>
            {sending ? <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" />Sending…</> : "Send Email"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Delete Confirmation Modal ──────────────────────────────────────────────────

interface DeleteModalProps {
  open: boolean;
  site: SiteDetail;
  onClose: () => void;
  onDeleted: () => void;
}

function DeleteModal({ open, site, onClose, onDeleted }: DeleteModalProps) {
  const [confirm, setConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (confirm !== site.businessName) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/businesses/${site.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Delete failed"); return; }
      onDeleted();
    } catch {
      setError("Network error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-destructive">Delete Business</DialogTitle>
          <DialogDescription>
            This will permanently delete <strong>{site.businessName}</strong> and all associated files from R2. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 my-2">
          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2 text-sm text-destructive">{error}</div>
          )}
          <Label>Type <strong>{site.businessName}</strong> to confirm:</Label>
          <Input
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder={site.businessName}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={deleting}>Cancel</Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={confirm !== site.businessName || deleting}
          >
            {deleting ? "Deleting…" : "Delete Forever"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

interface Props {
  siteId: number;
}

export function BusinessDetailView({ siteId }: Props) {
  const [data, setData] = useState<DetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [emailModal, setEmailModal] = useState<string | null>(null);
  const [showDelete, setShowDelete] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/businesses/${siteId}`, { credentials: "include" });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Failed to load");
      setData(d);
    } catch (e: any) {
      setError(e.message ?? "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [siteId]);

  useEffect(() => { load(); }, [load]);

  const showAction = (msg: string, isError = false) => {
    if (isError) { setActionError(msg); setTimeout(() => setActionError(null), 4000); }
    else { setActionSuccess(msg); setTimeout(() => setActionSuccess(null), 3000); }
  };

  const updateStatus = async (status: string) => {
    if (!data) return;
    const res = await fetch(`/api/admin/businesses/${siteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
      credentials: "include",
    });
    if (res.ok) { load(); showAction(`Status updated to ${status}`); }
    else { const d = await res.json(); showAction(d.error ?? "Failed to update", true); }
  };

  const triggerRegenerate = async (mode: "regenerate" | "redeploy") => {
    const res = await fetch(`/api/admin/businesses/${siteId}/regenerate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode }),
      credentials: "include",
    });
    if (res.ok) { showAction(`${mode === "regenerate" ? "Regeneration" : "Redeploy"} task queued`); }
    else { const d = await res.json(); showAction(d.error ?? "Failed", true); }
  };

  const copyJson = () => {
    if (!data) return;
    navigator.clipboard.writeText(JSON.stringify(data.site.config, null, 2));
    showAction("Copied to clipboard");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Loading…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
        {error ?? "Unknown error"}
      </div>
    );
  }

  const { site, files, tasks, uptime } = data;
  const config = site.config as any;

  return (
    <div className="space-y-6">
      {/* Breadcrumb + header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <a href="/admin" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-1">
            <ArrowLeft className="h-3.5 w-3.5" />
            Admin
          </a>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm">/</span>
            <a href="/admin?tab=businesses" className="text-sm text-muted-foreground hover:text-foreground">Businesses</a>
            <span className="text-muted-foreground text-sm">/</span>
            <h1 className="text-lg font-semibold">{site.businessName}</h1>
            <SiteStatusBadge status={site.status} />
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <a href={`https://${site.subdomain}.dev.hazelgrouse.pl`} target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="outline">
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" />Dev
            </Button>
          </a>
          <a href={`https://${site.subdomain}.hazelgrouse.pl`} target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="outline">
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" />Live
            </Button>
          </a>
          <a href={`https://${site.subdomain}.dev.hazelgrouse.pl/admin`} target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="outline">
              Owner Panel
            </Button>
          </a>
        </div>
      </div>

      {/* Action feedback */}
      {actionSuccess && (
        <div className="rounded-md bg-green-500/10 border border-green-500/30 px-3 py-2 text-sm text-green-700">{actionSuccess}</div>
      )}
      {actionError && (
        <div className="rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2 text-sm text-destructive">{actionError}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left: main content ── */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="tasks">
            <TabsList>
              <TabsTrigger value="tasks">Tasks ({tasks.length})</TabsTrigger>
              <TabsTrigger value="uptime">Uptime</TabsTrigger>
              <TabsTrigger value="json">JSON</TabsTrigger>
              <TabsTrigger value="files">Files ({files.length})</TabsTrigger>
            </TabsList>

            {/* Task history */}
            <TabsContent value="tasks" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Task History</CardTitle>
                  <CardDescription>All tasks ever created for this business</CardDescription>
                </CardHeader>
                <CardContent>
                  {tasks.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">No tasks yet</p>
                  ) : (
                    <div className="space-y-3">
                      {tasks.map((t) => (
                        <div key={t.id} className="flex gap-3 p-3 rounded-lg border bg-muted/30">
                          <TaskStatusIcon status={t.status} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline" className="text-[10px]">{t.status}</Badge>
                              <span className="text-xs text-muted-foreground">{fmt(t.createdAt)}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{t.description.slice(0, 200)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Uptime */}
            <TabsContent value="uptime" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Uptime (last 7 days)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-2xl font-bold">{uptime.stats.uptimePercent.toFixed(1)}%</p>
                      <p className="text-xs text-muted-foreground">Uptime</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{uptime.stats.avgLatencyMs}ms</p>
                      <p className="text-xs text-muted-foreground">Avg latency</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{uptime.stats.total}</p>
                      <p className="text-xs text-muted-foreground">Checks</p>
                    </div>
                  </div>
                  {uptime.latestCheck && (
                    <div className="text-xs text-muted-foreground border-t pt-3">
                      Last check: {fmt(uptime.latestCheck.checkedAt)} — {uptime.latestCheck.status}
                      {uptime.latestCheck.latencyMs != null && ` (${uptime.latestCheck.latencyMs}ms)`}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Raw JSON */}
            <TabsContent value="json" className="mt-4">
              <Card>
                <CardHeader className="flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-sm">Raw business.json</CardTitle>
                    <CardDescription>Read-only view of the current config</CardDescription>
                  </div>
                  <Button size="sm" variant="outline" onClick={copyJson}>
                    <Copy className="h-3.5 w-3.5 mr-1.5" />Copy
                  </Button>
                </CardHeader>
                <CardContent>
                  <textarea
                    readOnly
                    value={JSON.stringify(site.config, null, 2)}
                    className="w-full h-96 font-mono text-xs bg-muted rounded-md p-3 border resize-y outline-none"
                  />
                  <div className="mt-2 text-xs text-muted-foreground">
                    Template: {config?.meta?.template ?? config?.template ?? "—"}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* R2 Files */}
            <TabsContent value="files" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">R2 Storage</CardTitle>
                  <CardDescription>Files stored for this business</CardDescription>
                </CardHeader>
                <CardContent>
                  {files.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">No files stored</p>
                  ) : (
                    <div className="space-y-2">
                      {files.map((f) => (
                        <div key={f.id} className="flex items-center gap-3 p-2 rounded border bg-muted/30">
                          <File className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium truncate">{f.originalName}</p>
                            <p className="text-xs text-muted-foreground">{formatBytes(f.size)} · {f.mimeType}</p>
                          </div>
                          <a href={f.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground flex-shrink-0">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Timestamps */}
          <Card>
            <CardContent className="pt-4">
              <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">Created</dt>
                  <dd className="font-medium">{fmt(site.createdAt)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Last updated</dt>
                  <dd className="font-medium">{fmt(site.updatedAt)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Last deployed</dt>
                  <dd className="font-medium">{fmt(site.lastDeployedAt)}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>

        {/* ── Right: Actions panel ── */}
        <div className="space-y-4">
          {/* Email actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Mail className="h-4 w-4" />Email Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { type: "proposal", label: "Send Proposal" },
                { type: "go-live", label: "Go-live Confirmation" },
                { type: "suspension", label: "Suspension Notice" },
                { type: "renewal", label: "Renewal Reminder" },
              ].map(({ type, label }) => (
                <Button key={type} variant="outline" size="sm" className="w-full justify-start" onClick={() => setEmailModal(type)}>
                  <Mail className="h-3.5 w-3.5 mr-2" />{label}
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Status actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Shield className="h-4 w-4" />Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {site.status !== "suspended" ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-yellow-700 border-yellow-500/30 hover:bg-yellow-500/10"
                  onClick={() => {
                    if (confirm("Suspend this business? The site will be disabled.")) {
                      updateStatus("suspended");
                    }
                  }}
                >
                  <ZapOff className="h-3.5 w-3.5 mr-2" />Suspend
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-green-700 border-green-500/30 hover:bg-green-500/10"
                  onClick={() => updateStatus("released")}
                >
                  <CheckCircle2 className="h-3.5 w-3.5 mr-2" />Reactivate
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Site actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Rocket className="h-4 w-4" />Site Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => triggerRegenerate("regenerate")}>
                <RefreshCw className="h-3.5 w-3.5 mr-2" />Regenerate Site
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => triggerRegenerate("redeploy")}>
                <Rocket className="h-3.5 w-3.5 mr-2" />Force Redeploy
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start" onClick={copyJson}>
                <Copy className="h-3.5 w-3.5 mr-2" />Copy business.json
              </Button>
            </CardContent>
          </Card>

          {/* Danger zone */}
          <Card className="border-destructive/30">
            <CardHeader>
              <CardTitle className="text-sm text-destructive flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                variant="destructive"
                size="sm"
                className="w-full"
                onClick={() => setShowDelete(true)}
              >
                <Trash2 className="h-3.5 w-3.5 mr-2" />Delete Business
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modals */}
      {emailModal && (
        <EmailModal
          open={true}
          type={emailModal}
          site={site}
          onClose={() => setEmailModal(null)}
        />
      )}
      <DeleteModal
        open={showDelete}
        site={site}
        onClose={() => setShowDelete(false)}
        onDeleted={() => { window.location.href = "/admin"; }}
      />
    </div>
  );
}
