import React, { useEffect, useState, useCallback } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { UniversalList } from "./UniversalList";
import { Globe, Loader2, Plus, XCircle, Users } from "lucide-react";

// Matches the scrape API presets
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

interface Lead {
  id: number;
  name: string;
  businessType: string;
  city: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  source: string;
  status: string;
  siteId: number | null;
  generatedSubdomain: string | null;
  createdAt: string;
}

interface SiteOption {
  id: number;
  subdomain: string;
  businessName: string;
  industry: string | null;
  status: string;
}

const STATUS_BADGE: Record<string, { variant: "default" | "secondary" | "outline" | "destructive"; label: string }> = {
  new: { variant: "outline", label: "New" },
  site_generated: { variant: "default", label: "Site Generated" },
  rejected: { variant: "destructive", label: "Not interested" },
};

const STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "new", label: "New" },
  { value: "site_generated", label: "Site Generated" },
  { value: "rejected", label: "Not interested" },
];

export function LeadsTab() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Scraper form state
  const [scrapeCount, setScrapeCount] = useState(10);
  const [scrapeType, setScrapeType] = useState("electrician");
  const [scrapeCustomType, setScrapeCustomType] = useState("");
  const [scrapeCity, setScrapeCity] = useState("Kraków");
  const [scraping, setScraping] = useState(false);
  const [scrapeMsg, setScrapeMsg] = useState<string | null>(null);

  // Generate site dialog
  const [generateLead, setGenerateLead] = useState<Lead | null>(null);
  const [genTemplate, setGenTemplate] = useState("template-specialist");
  const [genSubdomain, setGenSubdomain] = useState("");
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  // Clone from existing business
  const [cloneMode, setCloneMode] = useState(false);
  const [sites, setSites] = useState<SiteOption[]>([]);
  const [sitesLoading, setSitesLoading] = useState(false);
  const [cloneFrom, setCloneFrom] = useState("");

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/leads");
      const data = await res.json();
      setLeads(data.leads ?? []);
    } catch {
      setError("Failed to load leads");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

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
      });
      const data = await res.json();
      if (!res.ok) {
        setScrapeMsg(`Error: ${data.error}`);
      } else {
        setScrapeMsg(`Saved ${data.saved} new lead${data.saved !== 1 ? "s" : ""}${data.message ? ` — ${data.message}` : ""}`);
        await fetchLeads();
      }
    } catch {
      setScrapeMsg("Network error");
    } finally {
      setScraping(false);
    }
  };

  const handleReject = async (lead: Lead) => {
    const res = await fetch("/api/admin/leads", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: lead.id, status: "rejected" }),
    });
    if (res.ok) {
      const { lead: updated } = await res.json();
      setLeads((prev) => prev.map((l) => (l.id === lead.id ? updated : l)));
    }
  };

  const openGenerate = (lead: Lead) => {
    const slug = lead.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 30);
    setGenSubdomain(slug);
    setGenTemplate("template-specialist");
    setGenError(null);
    setCloneMode(false);
    setCloneFrom("");
    setGenerateLead(lead);
    fetchSites();
  };

  const handleGenerateSite = async () => {
    if (!generateLead) return;
    setGenerating(true);
    setGenError(null);
    try {
      const res = await fetch("/api/admin/leads/generate-site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: generateLead.id,
          template: cloneMode ? undefined : genTemplate,
          cloneFrom: cloneMode ? cloneFrom : undefined,
          subdomain: genSubdomain,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setGenError(data.error ?? "Failed to generate site");
      } else {
        setGenerateLead(null);
        await fetchLeads();
      }
    } catch {
      setGenError("Network error");
    } finally {
      setGenerating(false);
    }
  };

  const columns: ColumnDef<Lead, unknown>[] = [
    {
      accessorKey: "name",
      header: "Business",
      cell: ({ row }) => (
        <div className="min-w-0">
          <p className="font-medium truncate">{row.original.name}</p>
          <p className="text-xs text-muted-foreground truncate">{row.original.businessType} · {row.original.city}</p>
        </div>
      ),
    },
    {
      accessorKey: "phone",
      header: "Contact",
      cell: ({ row }) => (
        <div className="min-w-0 text-sm">
          {row.original.phone && <p className="truncate">{row.original.phone}</p>}
          {row.original.email && <p className="text-muted-foreground truncate">{row.original.email}</p>}
        </div>
      ),
    },
    {
      accessorKey: "address",
      header: "Address",
      cell: ({ row }) => (
        <p className="text-sm text-muted-foreground truncate max-w-[180px]">{row.original.address || "—"}</p>
      ),
    },
    {
      id: "google",
      header: "",
      cell: ({ row }) => {
        const q = encodeURIComponent(`${row.original.name} ${row.original.city}`);
        return (
          <a
            href={`https://www.google.com/search?q=${q}`}
            target="_blank"
            rel="noopener noreferrer"
            title={`Search Google for "${row.original.name}"`}
            className="inline-flex items-center justify-center rounded-md p-1.5 text-muted-foreground hover:bg-muted transition-colors"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          </a>
        );
      },
    },
    {
      accessorKey: "website",
      header: "Website",
      cell: ({ row }) => row.original.website
        ? <a href={row.original.website} target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline-offset-2 hover:underline truncate max-w-[160px] block">{row.original.website}</a>
        : <span className="text-sm text-muted-foreground">—</span>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const s = STATUS_BADGE[row.original.status] ?? { variant: "outline" as const, label: row.original.status };
        return (
          <div className="flex flex-col gap-1">
            <Badge variant={s.variant}>{s.label}</Badge>
            {row.original.generatedSubdomain && (
              <a
                href={`https://${row.original.generatedSubdomain}.hazelgrouse.pl`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <Globe className="h-3 w-3" />
                {row.original.generatedSubdomain}.hazelgrouse.pl
              </a>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col gap-spacing-lg p-spacing-lg">
      {/* Scraper Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Generate Leads</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleScrape} className="flex flex-wrap items-end gap-spacing-md">
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

            <div className="flex flex-col gap-1.5 min-w-[160px]">
              <Label htmlFor="scrape-type">Business Type</Label>
              <Select value={scrapeType} onValueChange={setScrapeType}>
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
              <div className="flex flex-col gap-1.5 min-w-[160px]">
                <Label htmlFor="scrape-custom">Custom Type</Label>
                <Input
                  id="scrape-custom"
                  placeholder="e.g. tax_advisor"
                  value={scrapeCustomType}
                  onChange={(e) => setScrapeCustomType(e.target.value)}
                />
              </div>
            )}

            <div className="flex flex-col gap-1.5 min-w-[160px]">
              <Label htmlFor="scrape-city">City</Label>
              <Select value={scrapeCity} onValueChange={setScrapeCity}>
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

            <Button type="submit" disabled={scraping} className="gap-2">
              {scraping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {scraping ? "Scraping…" : "Scrape Leads"}
            </Button>
          </form>

          {scrapeMsg && (
            <p className="mt-spacing-md text-sm text-muted-foreground">{scrapeMsg}</p>
          )}
        </CardContent>
      </Card>

      {/* Leads List */}
      <UniversalList
        title="Leads"
        subtitle={`${leads.length} total`}
        data={statusFilter ? leads.filter((l) => l.status === statusFilter) : leads.filter((l) => l.status !== "rejected")}
        columns={columns}
        loading={loading}
        error={error}
        emptyIcon={Users}
        emptyTitle="No leads yet"
        emptyHint="Use the form above to scrape leads from OpenStreetMap."
        toolbarExtras={
          <div className="flex gap-1 flex-wrap">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                  statusFilter === f.value
                    ? "bg-foreground text-background"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {f.label}
                {f.value === "" && ` (${leads.filter((l) => l.status !== "rejected").length})`}
                {f.value !== "" && ` (${leads.filter((l) => l.status === f.value).length})`}
              </button>
            ))}
          </div>
        }
        rowActions={[
          {
            label: "Generate Site",
            icon: Globe,
            onClick: openGenerate,
            show: (row) => row.status === "new",
          },
          {
            label: "Not interested",
            icon: XCircle,
            variant: "ghost",
            onClick: handleReject,
            trackBusy: true,
            iconOnly: true,
            show: (row) => row.status !== "rejected",
          },
        ]}
      />

      {/* Generate Site Dialog */}
      <Dialog open={!!generateLead} onOpenChange={(open) => { if (!open) setGenerateLead(null); }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Generate Website</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-spacing-md py-2">
            <p className="text-sm text-muted-foreground">
              Create a site for <strong>{generateLead?.name}</strong>. Claude Code will generate the full config as a background task.
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
                <Select value={genTemplate} onValueChange={setGenTemplate}>
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
                <Select value={cloneFrom} onValueChange={setCloneFrom} disabled={sitesLoading}>
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

            {genError && <p className="text-sm text-destructive">{genError}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setGenerateLead(null)}>Cancel</Button>
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
