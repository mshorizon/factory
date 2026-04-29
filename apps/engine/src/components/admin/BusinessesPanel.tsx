import React, { useEffect, useState, useCallback } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { UniversalList } from "./UniversalList";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Building2,
  ExternalLink,
  LayoutDashboard,
  Plus,
  RefreshCw,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

type BusinessStatus = "draft" | "released" | "suspended" | "error";

interface BusinessRow {
  id: number;
  subdomain: string;
  businessName: string;
  industry: string | null;
  status: BusinessStatus;
  storedStatus: string;
  healthStatus: string;
  lastCheckedAt: string | null;
  createdAt: string;
  updatedAt: string;
  lastDeployedAt: string | null;
}

const TEMPLATES = [
  "template-specialist",
  "template-tech",
  "template-art",
  "template-law",
];

// ── Status Badge ───────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: BusinessStatus }) {
  if (status === "error") {
    return (
      <span className="inline-flex items-center gap-1.5">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive" />
        </span>
        <Badge variant="destructive" className="text-[11px]">error</Badge>
      </span>
    );
  }
  if (status === "released") {
    return <Badge className="bg-green-600/15 text-green-700 border-green-600/25 text-[11px]">released</Badge>;
  }
  if (status === "suspended") {
    return <Badge className="bg-yellow-500/15 text-yellow-700 border-yellow-500/25 text-[11px]">suspended</Badge>;
  }
  return <Badge variant="secondary" className="text-[11px]">draft</Badge>;
}

// ── New Business Modal ─────────────────────────────────────────────────────────

interface NewBusinessModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

function NewBusinessModal({ open, onClose, onCreated }: NewBusinessModalProps) {
  const [form, setForm] = useState({
    businessName: "",
    subdomain: "",
    industry: "",
    existingWebsiteUrl: "",
    template: "",
    primaryColor: "#000000",
    phone: "",
    email: "",
    address: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const autoSubdomain = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setForm((f) => ({
      ...f,
      businessName: name,
      subdomain: f.subdomain || autoSubdomain(name),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.businessName || !form.subdomain || !form.industry) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/businesses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to create business");
        return;
      }
      onCreated();
      onClose();
      setForm({
        businessName: "",
        subdomain: "",
        industry: "",
        existingWebsiteUrl: "",
        template: "",
        primaryColor: "#000000",
        phone: "",
        email: "",
        address: "",
        notes: "",
      });
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Business</DialogTitle>
          <DialogDescription>
            Create a new business site. Claude Code will generate the full website based on your inputs.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="nb-name">Business name *</Label>
              <Input id="nb-name" value={form.businessName} onChange={handleNameChange} placeholder="Jan Kowalski Electrician" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nb-sub">Subdomain *</Label>
              <Input id="nb-sub" value={form.subdomain} onChange={set("subdomain")} placeholder="jan-electrician" required />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="nb-ind">Industry / niche *</Label>
            <Input id="nb-ind" value={form.industry} onChange={set("industry")} placeholder="Electrician, Warsaw — residential wiring & repairs" required />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="nb-url">Existing website URL</Label>
            <Input id="nb-url" type="url" value={form.existingWebsiteUrl} onChange={set("existingWebsiteUrl")} placeholder="https://old-site.pl" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Template</Label>
              <Select value={form.template} onValueChange={(v) => setForm((f) => ({ ...f, template: v ?? "" }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Auto-select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Auto-select based on industry</SelectItem>
                  {TEMPLATES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nb-color">Primary color</Label>
              <div className="flex items-center gap-2">
                <input type="color" id="nb-color" value={form.primaryColor} onChange={set("primaryColor")} className="h-9 w-9 rounded border cursor-pointer" />
                <Input value={form.primaryColor} onChange={set("primaryColor")} className="font-mono text-sm" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="nb-phone">Phone</Label>
              <Input id="nb-phone" value={form.phone} onChange={set("phone")} placeholder="+48 123 456 789" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nb-email">Contact email</Label>
              <Input id="nb-email" type="email" value={form.email} onChange={set("email")} placeholder="owner@business.pl" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="nb-addr">Address</Label>
            <Input id="nb-addr" value={form.address} onChange={set("address")} placeholder="ul. Przykładowa 1, 00-001 Warszawa" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="nb-notes">Notes / instructions for Claude</Label>
            <Textarea id="nb-notes" value={form.notes} onChange={set("notes")} rows={3} placeholder="Any special requirements, style preferences, target audience, tone of voice…" />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button type="submit" disabled={saving || !form.businessName || !form.subdomain || !form.industry}>
              {saving ? "Creating…" : "Create Business"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Panel ─────────────────────────────────────────────────────────────────

export function BusinessesPanel() {
  const [businesses, setBusinesses] = useState<BusinessRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/businesses", { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load");
      setBusinesses(data.businesses ?? []);
    } catch (e: any) {
      setError(e.message ?? "Failed to load businesses");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSuspend = async (row: BusinessRow) => {
    const newStatus = row.storedStatus === "suspended" ? "released" : "suspended";
    await fetch(`/api/admin/businesses/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
      credentials: "include",
    });
    load();
  };

  const columns: ColumnDef<BusinessRow, unknown>[] = [
    {
      id: "name",
      header: "Business",
      cell: ({ row }) => (
        <div className="min-w-0">
          <div className="font-medium text-sm truncate">{row.original.businessName}</div>
          <div className="text-xs text-muted-foreground">{row.original.subdomain}.hazelgrouse.pl</div>
          {row.original.industry && (
            <div className="text-xs text-muted-foreground/70 truncate max-w-[200px]">{row.original.industry}</div>
          )}
        </div>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status as BusinessStatus} />,
    },
    {
      id: "expiry",
      header: "Expiry",
      cell: () => <span className="text-xs text-muted-foreground">Never expires</span>,
    },
    {
      id: "links",
      header: "Links",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <a
            href={`https://${row.original.subdomain}.hazelgrouse.pl`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground"
            title="Live site"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <a
            href={`https://${row.original.subdomain}.dev.hazelgrouse.pl`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground text-[10px] font-medium px-1 py-0.5 rounded bg-muted"
            title="Dev site"
          >
            dev
          </a>
          <a
            href={`https://${row.original.subdomain}.dev.hazelgrouse.pl/admin`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground"
            title="Admin panel"
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
          </a>
        </div>
      ),
    },
  ];

  return (
    <>
      <UniversalList<BusinessRow>
        title="Businesses"
        subtitle={`${businesses.length} site${businesses.length !== 1 ? "s" : ""}`}
        data={businesses}
        columns={columns}
        loading={loading}
        loadingLabel="Loading businesses…"
        error={error}
        emptyIcon={Building2}
        emptyTitle="No businesses yet"
        emptyHint="Create your first business to get started."
        primaryAction={{
          label: "New Business",
          icon: Plus,
          onClick: () => setShowNew(true),
        }}
        toolbarExtras={
          <div className="flex justify-end">
            <Button size="sm" variant="ghost" onClick={load} title="Refresh">
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Refresh
            </Button>
          </div>
        }
        getRowId={(row) => row.id}
        rowActions={[
          {
            label: "Dashboard",
            icon: LayoutDashboard,
            onClick: (row) => { window.location.href = `/admin/businesses/${row.id}`; },
            iconOnly: true,
            title: "Open dashboard",
          },
          {
            label: "Suspend",
            onClick: handleSuspend,
            variant: "outline",
            show: (row) => row.storedStatus !== "suspended",
            title: "Suspend site",
          },
          {
            label: "Reactivate",
            onClick: handleSuspend,
            variant: "outline",
            show: (row) => row.storedStatus === "suspended",
            title: "Reactivate site",
          },
        ]}
        wrapInCard
      />

      <NewBusinessModal
        open={showNew}
        onClose={() => setShowNew(false)}
        onCreated={load}
      />
    </>
  );
}
