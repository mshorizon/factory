import React, { useEffect, useState, useCallback } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { UniversalList } from "./UniversalList";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Building2,
  ExternalLink,
  Globe,
  LayoutDashboard,
  Loader2,
  RefreshCw,
  Search,
  XCircle,
} from "lucide-react";

// ── Pipeline definition (mirrors BUSINESS_PIPELINE from @mshorizon/db) ───────

type SiteStatus =
  | "lead"
  | "site_generated"
  | "after_first_sms"
  | "after_first_call"
  | "demo_scheduled"
  | "after_demo"
  | "offer_sent"
  | "onboarding"
  | "active"
  | "not_interested"
  | "churned";

const PIPELINE: {
  status: SiteStatus;
  label: string;
  action: string | null;
  nextStatus: SiteStatus | null;
  actionType: "generate_site" | "advance" | null;
}[] = [
  { status: "lead", label: "Lead", action: "Generate website", nextStatus: "site_generated", actionType: "generate_site" },
  { status: "site_generated", label: "Site Generated", action: "Send first SMS", nextStatus: "after_first_sms", actionType: "advance" },
  { status: "after_first_sms", label: "After First SMS", action: "Make first call", nextStatus: "after_first_call", actionType: "advance" },
  { status: "after_first_call", label: "After First Call", action: "Schedule demo", nextStatus: "demo_scheduled", actionType: "advance" },
  { status: "demo_scheduled", label: "Demo Scheduled", action: "Conduct demo", nextStatus: "after_demo", actionType: "advance" },
  { status: "after_demo", label: "After Demo", action: "Send offer", nextStatus: "offer_sent", actionType: "advance" },
  { status: "offer_sent", label: "Offer Sent", action: "Close deal", nextStatus: "onboarding", actionType: "advance" },
  { status: "onboarding", label: "Onboarding", action: "Launch site", nextStatus: "active", actionType: "advance" },
  { status: "active", label: "Active", action: null, nextStatus: null, actionType: null },
  { status: "not_interested", label: "Not Interested", action: null, nextStatus: null, actionType: null },
  { status: "churned", label: "Churned", action: null, nextStatus: null, actionType: null },
];

const PIPELINE_MAP = new Map(PIPELINE.map((p) => [p.status, p]));

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: "", label: "All" },
  ...PIPELINE.map((p) => ({ value: p.status, label: p.label })),
];

const STATUS_STYLE: Record<SiteStatus, string> = {
  lead:             "bg-slate-500/10 text-slate-600 border-slate-400/40",
  site_generated:   "bg-sky-500/10 text-sky-700 border-sky-400/40",
  after_first_sms:  "bg-blue-500/10 text-blue-700 border-blue-400/40",
  after_first_call: "bg-indigo-500/10 text-indigo-700 border-indigo-400/40",
  demo_scheduled:   "bg-violet-500/10 text-violet-700 border-violet-400/40",
  after_demo:       "bg-purple-500/10 text-purple-700 border-purple-400/40",
  offer_sent:       "bg-amber-500/10 text-amber-700 border-amber-400/40",
  onboarding:       "bg-orange-500/10 text-orange-700 border-orange-400/40",
  active:           "bg-green-600/15 text-green-700 border-green-600/30",
  not_interested:   "bg-gray-500/10 text-gray-500 border-gray-400/40",
  churned:          "bg-red-500/15 text-red-700 border-red-500/30",
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface BusinessRow {
  id: number;
  subdomain: string | null;
  businessName: string;
  industry: string | null;
  status: SiteStatus;
  healthStatus: string;
  lastCheckedAt: string | null;
  city: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  source: string;
  createdAt: string;
  updatedAt: string;
  lastDeployedAt: string | null;
}

interface SiteOption {
  id: number;
  subdomain: string;
  businessName: string;
  industry: string | null;
  status: string;
}

// ── Scraper presets ───────────────────────────────────────────────────────────

const BUSINESS_TYPE_PRESETS = [
  { value: "electrician", label: "Electrician" },
  { value: "plumber", label: "Plumber" },
  { value: "hairdresser", label: "Hairdresser" },
  { value: "dentist", label: "Dentist" },
  { value: "restaurant", label: "Restaurant" },
  { value: "cafe", label: "Cafe" },
  { value: "lawyer", label: "Lawyer" },
  { value: "notary", label: "Notary" },
  { value: "accountant", label: "Accountant" },
  { value: "doctor", label: "Doctor" },
  { value: "pharmacy", label: "Pharmacy" },
  { value: "car_repair", label: "Car Repair" },
  { value: "beauty", label: "Beauty Salon" },
  { value: "gym", label: "Gym" },
  { value: "florist", label: "Florist" },
  { value: "carpenter", label: "Carpenter" },
  { value: "painter", label: "Painter" },
  { value: "locksmith", label: "Locksmith" },
  { value: "hotel", label: "Hotel" },
  { value: "veterinary", label: "Veterinary" },
  { value: "__custom__", label: "Custom..." },
];

const CITIES = [
  "Kraków", "Warszawa", "Wrocław", "Poznań", "Gdańsk",
  "Łódź", "Katowice", "Lublin", "Szczecin", "Bydgoszcz",
];

const TEMPLATES = [
  { value: "template-specialist", label: "Specialist" },
  { value: "template-tech", label: "Tech" },
  { value: "template-law", label: "Law" },
  { value: "template-art", label: "Art" },
  { value: "template-tech-agency", label: "Tech Agency" },
];

// ── Status Badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: SiteStatus }) {
  const stage = PIPELINE_MAP.get(status);
  const label = stage?.label ?? status;
  return <Badge className={`${STATUS_STYLE[status] ?? ""} text-[11px]`}>{label}</Badge>;
}

// ── Main Panel ────────────────────────────────────────────────────────────────

export function BusinessesPanel() {
  const [businesses, setBusinesses] = useState<BusinessRow[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Scraper
  const [scrapeCount, setScrapeCount] = useState(10);
  const [scrapeType, setScrapeType] = useState("electrician");
  const [scrapeCustomType, setScrapeCustomType] = useState("");
  const [scrapeCity, setScrapeCity] = useState("Kraków");
  const [scraping, setScraping] = useState(false);
  const [scrapeMsg, setScrapeMsg] = useState<string | null>(null);
  const [scrapeModalOpen, setScrapeModalOpen] = useState(false);

  // Generate site dialog
  const [generateBiz, setGenerateBiz] = useState<BusinessRow | null>(null);
  const [genTemplate, setGenTemplate] = useState("template-specialist");
  const [genSubdomain, setGenSubdomain] = useState("");
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [cloneMode, setCloneMode] = useState(false);
  const [sites, setSites] = useState<SiteOption[]>([]);
  const [sitesLoading, setSitesLoading] = useState(false);
  const [cloneFrom, setCloneFrom] = useState("");
  const [additionalRequirements, setAdditionalRequirements] = useState("");

  // ── Data loading ──────────────────────────────────────────────────────────

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

  const fetchSites = useCallback(async () => {
    setSitesLoading(true);
    try {
      const res = await fetch("/api/admin/sites");
      const data = await res.json();
      setSites(data.sites ?? []);
    } finally {
      setSitesLoading(false);
    }
  }, []);

  // ── Scraper ───────────────────────────────────────────────────────────────

  const handleScrape = async (e: React.FormEvent) => {
    e.preventDefault();
    setScraping(true);
    setScrapeMsg(null);
    const businessType = scrapeType === "__custom__" ? scrapeCustomType.trim() : scrapeType;
    if (!businessType) { setScraping(false); setScrapeMsg("Enter a business type"); return; }

    try {
      const res = await fetch("/api/admin/leads/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: scrapeCount, businessType, city: scrapeCity }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        setScrapeMsg(`Error: ${data.error}`);
      } else {
        setScrapeMsg(`Saved ${data.saved} new lead${data.saved !== 1 ? "s" : ""}`);
        await load();
      }
    } catch {
      setScrapeMsg("Network error");
    } finally {
      setScraping(false);
    }
  };

  // ── Pipeline actions ──────────────────────────────────────────────────────

  const advanceStatus = async (row: BusinessRow) => {
    const stage = PIPELINE_MAP.get(row.status);
    if (!stage?.nextStatus) return;
    await fetch(`/api/admin/businesses/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: stage.nextStatus }),
      credentials: "include",
    });
    load();
  };

  const handleReject = async (row: BusinessRow) => {
    await fetch(`/api/admin/businesses/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "not_interested" }),
      credentials: "include",
    });
    load();
  };

  // ── Generate site ─────────────────────────────────────────────────────────

  const openGenerate = (row: BusinessRow) => {
    const slug = row.businessName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 30);
    setGenSubdomain(slug);
    setGenTemplate("template-specialist");
    setGenError(null);
    setCloneMode(false);
    setCloneFrom("");
    setAdditionalRequirements("");
    setGenerateBiz(row);
    fetchSites();
  };

  const handleGenerateSite = async () => {
    if (!generateBiz) return;
    setGenerating(true);
    setGenError(null);
    try {
      const res = await fetch("/api/admin/leads/generate-site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: generateBiz.id,
          template: cloneMode ? undefined : genTemplate,
          cloneFrom: cloneMode ? cloneFrom : undefined,
          subdomain: genSubdomain,
          additionalRequirements: additionalRequirements.trim() || undefined,
        }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        setGenError(data.error ?? "Failed to generate site");
      } else {
        setGenerateBiz(null);
        await load();
      }
    } catch {
      setGenError("Network error");
    } finally {
      setGenerating(false);
    }
  };

  // ── Suggested action handler ──────────────────────────────────────────────

  const handleSuggestedAction = (row: BusinessRow) => {
    const stage = PIPELINE_MAP.get(row.status);
    if (!stage?.actionType) return;
    if (stage.actionType === "generate_site") {
      openGenerate(row);
    } else {
      advanceStatus(row);
    }
  };

  // ── Filtering ─────────────────────────────────────────────────────────────

  const filtered = statusFilter
    ? businesses.filter((b) => b.status === statusFilter)
    : businesses.filter((b) => b.status !== "not_interested");

  // ── Columns ───────────────────────────────────────────────────────────────

  const columns: ColumnDef<BusinessRow, unknown>[] = [
    {
      id: "name",
      accessorFn: (row) =>
        `${row.businessName} ${row.city} ${row.industry ?? ""} ${row.phone} ${row.email}`,
      header: "Business",
      cell: ({ row }) => {
        const b = row.original;
        return (
          <div className="min-w-0">
            <div className="font-medium text-sm truncate">{b.businessName}</div>
            {b.subdomain && (
              <div className="text-xs text-muted-foreground">{b.subdomain}.hazelgrouse.pl</div>
            )}
            {b.industry && (
              <div className="text-xs text-muted-foreground/70 truncate max-w-[200px]">{b.industry} · {b.city}</div>
            )}
          </div>
        );
      },
    },
    {
      id: "contact",
      header: "Contact",
      cell: ({ row }) => (
        <div className="min-w-0 text-sm">
          {row.original.phone && <p className="truncate">{row.original.phone}</p>}
          {row.original.email && <p className="text-muted-foreground truncate">{row.original.email}</p>}
        </div>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => {
        const b = row.original;
        return (
          <div className="flex flex-col gap-1">
            <StatusBadge status={b.status} />
            {b.subdomain && (
              <a
                href={`https://${b.subdomain}.hazelgrouse.pl`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <Globe className="h-3 w-3" />
                {b.subdomain}
              </a>
            )}
          </div>
        );
      },
    },
    {
      id: "suggested_action",
      header: "Suggested Action",
      cell: ({ row }) => {
        const stage = PIPELINE_MAP.get(row.original.status);
        if (!stage?.action) return null;
        return (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleSuggestedAction(row.original)}
            className="text-xs whitespace-nowrap"
          >
            {stage.action}
          </Button>
        );
      },
    },
    {
      id: "links",
      header: "",
      cell: ({ row }) => {
        const b = row.original;
        const q = encodeURIComponent(`${b.businessName} ${b.city}`);
        return (
          <div className="flex items-center gap-1.5">
            <a
              href={`https://www.google.com/search?q=${q}`}
              target="_blank"
              rel="noopener noreferrer"
              title={`Search Google for "${b.businessName}"`}
              className="inline-flex items-center justify-center rounded-md p-1.5 text-muted-foreground hover:bg-muted transition-colors"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            </a>
            {b.website && (
              <a
                href={b.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground"
                title="Original website"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
            {b.subdomain && (
              <>
                <a
                  href={`https://${b.subdomain}.dev.hazelgrouse.pl`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground text-[10px] font-medium px-1 py-0.5 rounded bg-muted"
                  title="Dev site"
                >
                  dev
                </a>
                <a
                  href={`https://${b.subdomain}.dev.hazelgrouse.pl/admin`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground"
                  title="Admin panel"
                >
                  <LayoutDashboard className="h-3.5 w-3.5" />
                </a>
              </>
            )}
          </div>
        );
      },
    },
  ];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-spacing-lg p-spacing-lg">
      {/* Businesses List */}
      <UniversalList<BusinessRow>
        title="Businesses"
        subtitle={`${businesses.length} total`}
        data={filtered}
        columns={columns}
        searchKey="name"
        searchPlaceholder="Search businesses…"
        pageSize={25}
        loading={loading}
        loadingLabel="Loading businesses…"
        error={error}
        emptyIcon={Building2}
        emptyTitle="No businesses yet"
        emptyHint="Use the scraper above or create a business manually."
        toolbarExtras={
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex gap-1 flex-wrap">
              {STATUS_FILTERS.map((f) => {
                const count = f.value === ""
                  ? businesses.filter((b) => b.status !== "not_interested").length
                  : businesses.filter((b) => b.status === f.value).length;
                const isSelected = statusFilter === f.value;
                const isEmpty = count === 0 && f.value !== "";
                return (
                  <button
                    key={f.value}
                    onClick={isEmpty ? undefined : () => setStatusFilter(f.value)}
                    className={`px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors ${
                      isSelected
                        ? "bg-foreground text-background border-transparent"
                        : isEmpty
                          ? "bg-muted text-muted-foreground/35 cursor-default border-transparent"
                          : f.value === ""
                            ? "bg-muted text-muted-foreground border-transparent hover:bg-muted/80"
                            : `${STATUS_STYLE[f.value as SiteStatus]} hover:opacity-90`
                    }`}
                  >
                    {f.label}{count > 0 ? ` (${count})` : ""}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => { setScrapeMsg(null); setScrapeModalOpen(true); }}>
                <Search className="h-3.5 w-3.5 mr-1.5" />
                Scrape Leads
              </Button>
              <Button size="sm" variant="ghost" onClick={load} title="Refresh">
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                Refresh
              </Button>
            </div>
          </div>
        }
        getRowId={(row) => row.id}
        rowActions={[
          {
            label: "Not interested",
            icon: XCircle,
            variant: "ghost",
            onClick: handleReject,
            trackBusy: true,
            iconOnly: true,
            show: (row) => row.status !== "not_interested" && row.status !== "active" && row.status !== "churned",
          },
          {
            label: "Dashboard",
            icon: LayoutDashboard,
            onClick: (row) => { window.location.href = `/admin/businesses/${row.id}`; },
            iconOnly: true,
            title: "Open dashboard",
            show: (row) => !!row.subdomain,
          },
        ]}
      />

      {/* Scrape Leads Dialog */}
      <Dialog open={scrapeModalOpen} onOpenChange={(open) => { if (!open) { setScrapeModalOpen(false); setScrapeMsg(null); } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Scrape Leads</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleScrape}>
            <div className="flex flex-col gap-spacing-md py-2">
              <div className="flex flex-col gap-1.5 w-20">
                <Label htmlFor="scrape-count">Count</Label>
                <Input
                  id="scrape-count"
                  type="number"
                  min={1}
                  max={100}
                  value={scrapeCount}
                  onChange={(e) => setScrapeCount(Number(e.target.value))}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="scrape-type">Business Type</Label>
                <Select value={scrapeType} onValueChange={(v) => v && setScrapeType(v)}>
                  <SelectTrigger id="scrape-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {BUSINESS_TYPE_PRESETS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {scrapeType === "__custom__" && (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="scrape-custom">Custom Type</Label>
                  <Input
                    id="scrape-custom"
                    placeholder="e.g. tax_advisor"
                    value={scrapeCustomType}
                    onChange={(e) => setScrapeCustomType(e.target.value)}
                  />
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="scrape-city">City</Label>
                <Select value={scrapeCity} onValueChange={(v) => v && setScrapeCity(v)}>
                  <SelectTrigger id="scrape-city">
                    <SelectValue placeholder="Select city" />
                  </SelectTrigger>
                  <SelectContent>
                    {CITIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {scrapeMsg && (
                <p className="text-sm text-muted-foreground">{scrapeMsg}</p>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setScrapeModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={scraping} className="gap-2">
                {scraping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                {scraping ? "Scraping…" : "Scrape Leads"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Generate Site Dialog */}
      <Dialog open={!!generateBiz} onOpenChange={(open) => { if (!open) setGenerateBiz(null); }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Generate Website</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-spacing-md py-2">
            <p className="text-sm text-muted-foreground">
              Create a site for <strong>{generateBiz?.businessName}</strong>. Claude Code will generate the full config as a background task.
            </p>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="gen-subdomain">Subdomain</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="gen-subdomain"
                  value={genSubdomain}
                  onChange={(e) => setGenSubdomain(e.target.value)}
                  placeholder="my-business"
                />
                <span className="text-sm text-muted-foreground whitespace-nowrap">.hazelgrouse.pl</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                id="clone-mode"
                checked={cloneMode}
                onCheckedChange={setCloneMode}
              />
              <Label htmlFor="clone-mode" className="cursor-pointer">Generate from existing business</Label>
            </div>

            {!cloneMode && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="gen-template">Template</Label>
                <Select value={genTemplate} onValueChange={(v) => v && setGenTemplate(v)}>
                  <SelectTrigger id="gen-template" className="w-full">
                    <SelectValue placeholder="Select template" />
                  </SelectTrigger>
                  <SelectContent className="w-full">
                    {TEMPLATES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {cloneMode && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="gen-clone-from">Clone from business</Label>
                <Select value={cloneFrom} onValueChange={(v) => v && setCloneFrom(v)} disabled={sitesLoading}>
                  <SelectTrigger id="gen-clone-from" className="w-full">
                    <SelectValue placeholder={sitesLoading ? "Loading…" : "Select a business"} />
                  </SelectTrigger>
                  <SelectContent className="w-[--radix-select-trigger-width]">
                    {sites.map((s) => (
                      <SelectItem key={s.subdomain} value={s.subdomain}>
                        <span className="font-medium">{s.businessName}</span>
                        <span className="ml-2 text-muted-foreground text-xs">{s.subdomain}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="gen-additional">Additional requirements</Label>
              <textarea
                id="gen-additional"
                value={additionalRequirements}
                onChange={(e) => setAdditionalRequirements(e.target.value)}
                placeholder="e.g. use dark color scheme, focus on emergency services, add a pricing table..."
                rows={4}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
              />
            </div>

            {genError && <p className="text-sm text-destructive">{genError}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setGenerateBiz(null)}>Cancel</Button>
            <Button onClick={handleGenerateSite} disabled={generating || !genSubdomain || (cloneMode && !cloneFrom)}>
              {generating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {generating ? "Creating…" : "Generate Site"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
