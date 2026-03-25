import React, { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Eye, MousePointerClick, Clock, TrendingUp, Globe, Smartphone } from "lucide-react";

interface StatValue {
  value: number;
  prev?: number;
  change?: number;
}

interface AnalyticsData {
  websiteId: string;
  stats: Record<string, StatValue | number>;
  pageviews: {
    pageviews: Array<{ x: string; y: number }>;
    sessions?: Array<{ x: string; y: number }>;
  } | Array<{ x: string; y: number }>;
  pages: Array<{ x: string; y: number }>;
  referrers: Array<{ x: string; y: number }>;
  devices: Array<{ x: string; y: number }>;
}

const PERIODS = [
  { label: "Dziś", value: "1d" },
  { label: "7 dni", value: "7d" },
  { label: "30 dni", value: "30d" },
  { label: "90 dni", value: "90d" },
];

function getStatValue(stat: StatValue | number | undefined): number {
  if (stat == null) return 0;
  if (typeof stat === "number") return stat;
  return stat.value ?? 0;
}

function getStatPrev(stat: StatValue | number | undefined): number {
  if (stat == null || typeof stat === "number") return 0;
  return stat.prev ?? stat.change ?? 0;
}

function StatCard({
  icon: Icon,
  label,
  value,
  prev,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  prev: number;
}) {
  const change = prev > 0 ? Math.round(((value - prev) / prev) * 100) : null;
  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground mb-1">{label}</p>
            <p className="text-2xl font-semibold tabular-nums">{value.toLocaleString()}</p>
          </div>
          <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
        {change !== null && (
          <p className={`text-xs mt-2 ${change >= 0 ? "text-green-600" : "text-red-500"}`}>
            {change >= 0 ? "+" : ""}{change}% vs poprzedni okres
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function MiniBar({ items }: { items: Array<{ x: string; y: number }> }) {
  const max = items[0]?.y ?? 1;
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground truncate w-40 flex-shrink-0" title={item.x || "Direct"}>
            {item.x || "(direct)"}
          </span>
          <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full bg-primary rounded-full"
              style={{ width: `${max > 0 ? (item.y / max) * 100 : 0}%` }}
            />
          </div>
          <span className="tabular-nums text-right w-8 flex-shrink-0">{item.y}</span>
        </div>
      ))}
    </div>
  );
}

function SparkLine({ data }: { data: Array<{ x: string; y: number }> }) {
  if (!data.length) return null;
  const max = Math.max(...data.map((d) => d.y), 1);
  const width = 100;
  const height = 40;
  const points = data.map((d, i) => {
    const x = (i / Math.max(data.length - 1, 1)) * width;
    const y = height - (d.y / max) * height;
    return `${x},${y}`;
  });
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-10" preserveAspectRatio="none">
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function getPageviewsArray(pv: AnalyticsData["pageviews"]): Array<{ x: string; y: number }> {
  if (!pv) return [];
  if (Array.isArray(pv)) return pv;
  if (Array.isArray(pv.pageviews)) return pv.pageviews;
  return [];
}

interface AnalyticsTabProps {
  businessId: string;
}

export function AnalyticsTab({ businessId }: AnalyticsTabProps) {
  const [period, setPeriod] = useState("7d");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (p: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/analytics?period=${p}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Błąd ładowania danych");
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nieznany błąd");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(period);
  }, [period, fetchData]);

  const pageviewsArray = data ? getPageviewsArray(data.pageviews) : [];

  const statsPageviews = getStatValue(data?.stats?.pageviews);
  const statsPageviewsPrev = getStatPrev(data?.stats?.pageviews);
  const statsVisitors = getStatValue(data?.stats?.visitors);
  const statsVisitorsPrev = getStatPrev(data?.stats?.visitors);
  const statsVisits = getStatValue(data?.stats?.visits);
  const statsVisitsPrev = getStatPrev(data?.stats?.visits);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Analytics</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Ruch na stronie {businessId}</p>
        </div>
        <div className="flex gap-1">
          {PERIODS.map((p) => (
            <Button
              key={p.value}
              variant={period === p.value ? "default" : "ghost"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setPeriod(p.value)}
            >
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
          Ładowanie danych...
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error.includes("not configured")
            ? "Analytics nie jest skonfigurowane. Dodaj UMAMI_URL i UMAMI_USERNAME/UMAMI_PASSWORD do pliku .env."
            : error}
        </div>
      )}

      {!loading && data && (
        <>
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
            <StatCard icon={Eye} label="Wyświetlenia" value={statsPageviews} prev={statsPageviewsPrev} />
            <StatCard icon={Users} label="Odwiedzający" value={statsVisitors} prev={statsVisitorsPrev} />
            <StatCard icon={MousePointerClick} label="Sesje" value={statsVisits} prev={statsVisitsPrev} />
          </div>

          {pageviewsArray.length > 0 && (
            <Card>
              <CardHeader className="pb-2 pt-4">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  Wyświetlenia w czasie
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                <SparkLine data={pageviewsArray} />
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                  <span>{pageviewsArray[0]?.x}</span>
                  <span>{pageviewsArray[pageviewsArray.length - 1]?.x}</span>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <Card>
              <CardHeader className="pb-2 pt-4">
                <CardTitle className="text-sm font-medium">Top strony</CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                {(data.pages ?? []).length > 0 ? (
                  <MiniBar items={data.pages} />
                ) : (
                  <p className="text-xs text-muted-foreground">Brak danych</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 pt-4">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                  Źródła ruchu
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                {(data.referrers ?? []).length > 0 ? (
                  <MiniBar items={data.referrers} />
                ) : (
                  <p className="text-xs text-muted-foreground">Brak danych</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 pt-4">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Smartphone className="h-3.5 w-3.5 text-muted-foreground" />
                  Urządzenia
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                {(data.devices ?? []).length > 0 ? (
                  <MiniBar items={data.devices} />
                ) : (
                  <p className="text-xs text-muted-foreground">Brak danych</p>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
