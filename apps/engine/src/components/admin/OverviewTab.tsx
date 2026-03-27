import React, { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Activity,
  CheckCircle,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Eye,
  Users,
  MousePointerClick,
  Globe,
  Clock,
  BarChart2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// ── Types ──

interface BusinessStatus {
  subdomain: string;
  businessName: string;
  industry: string | null;
  status: "healthy" | "degraded" | "unhealthy" | "unknown";
  checks: Record<string, { status: string; latencyMs: number }>;
  stats: {
    total: number;
    healthy: number;
    degraded: number;
    unhealthy: number;
    uptimePercent: number;
    avgLatencyMs: number;
  };
  lastCheckedAt: string | null;
}

interface BusinessAnalytics {
  subdomain: string;
  businessName: string;
  stats: {
    pageviews: { value: number };
    visitors: { value: number };
    visits: { value: number };
    bounces: { value: number };
    totaltime: { value: number };
  } | null;
  error?: string;
}

// ── Constants ──

const PERIODS = [
  { label: "1h", hoursValue: 1, analyticsPeriod: "1d" },
  { label: "24h", hoursValue: 24, analyticsPeriod: "1d" },
  { label: "7d", hoursValue: 168, analyticsPeriod: "7d" },
  { label: "30d", hoursValue: 720, analyticsPeriod: "30d" },
];

const CHART_COLORS = [
  "var(--color-chart-1, hsl(217 91% 60%))",
  "var(--color-chart-2, hsl(221 83% 53%))",
  "var(--color-chart-3, hsl(142 71% 45%))",
  "var(--color-chart-4, hsl(47 96% 53%))",
  "var(--color-chart-5, hsl(0 84% 60%))",
];

const STATUS_CONFIG = {
  healthy: { color: "text-green-600", bg: "bg-green-500", icon: CheckCircle },
  degraded: { color: "text-yellow-600", bg: "bg-yellow-500", icon: AlertTriangle },
  unhealthy: { color: "text-red-600", bg: "bg-red-500", icon: XCircle },
  unknown: { color: "text-muted-foreground", bg: "bg-muted-foreground", icon: HelpCircle },
} as const;

// ── Sub-components ──

function StatusDot({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.unknown;
  return <span className={`inline-block h-2.5 w-2.5 rounded-full ${cfg.bg}`} />;
}

function SummaryCards({
  businesses,
  analytics,
}: {
  businesses: BusinessStatus[];
  analytics: BusinessAnalytics[];
}) {
  const totalSites = businesses.length;
  const healthyCount = businesses.filter((b) => b.status === "healthy").length;
  const unhealthyCount = businesses.filter((b) => b.status === "unhealthy" || b.status === "degraded").length;
  const totalPageviews = analytics.reduce((sum, a) => sum + (a.stats?.pageviews?.value ?? 0), 0);
  const totalVisitors = analytics.reduce((sum, a) => sum + (a.stats?.visitors?.value ?? 0), 0);

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Serwisy</p>
              <p className="text-2xl font-semibold tabular-nums">{totalSites}</p>
            </div>
            <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center">
              <Globe className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Zdrowe</p>
              <p className="text-2xl font-semibold tabular-nums text-green-600">{healthyCount}</p>
            </div>
            <div className="h-8 w-8 rounded-md bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="h-4 w-4 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Problemy</p>
              <p className="text-2xl font-semibold tabular-nums text-red-600">{unhealthyCount}</p>
            </div>
            <div className="h-8 w-8 rounded-md bg-red-500/10 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Wyświetlenia</p>
              <p className="text-2xl font-semibold tabular-nums">{totalPageviews.toLocaleString("pl-PL")}</p>
            </div>
            <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center">
              <Eye className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Odwiedzający</p>
              <p className="text-2xl font-semibold tabular-nums">{totalVisitors.toLocaleString("pl-PL")}</p>
            </div>
            <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center">
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

const BarTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="rounded-md border border-border bg-background px-3 py-2 shadow-sm text-xs">
      <p className="text-muted-foreground truncate max-w-[200px]">{item?.payload?.name}</p>
      <p className="font-medium mt-0.5">{item?.value?.toLocaleString("pl-PL")}</p>
    </div>
  );
};

// ── Main Component ──

export function OverviewTab() {
  const [periodIdx, setPeriodIdx] = useState(1); // default 24h
  const [businesses, setBusinesses] = useState<BusinessStatus[]>([]);
  const [analytics, setAnalytics] = useState<BusinessAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const period = PERIODS[periodIdx];

  const fetchData = useCallback(async (p: typeof PERIODS[number]) => {
    setLoading(true);
    setError(null);
    try {
      const [statusRes, analyticsRes] = await Promise.all([
        fetch(`/api/admin/global-status?hours=${p.hoursValue}`),
        fetch(`/api/admin/global-analytics?period=${p.analyticsPeriod}`).catch(() => null),
      ]);

      const statusJson = await statusRes.json();
      if (!statusRes.ok) throw new Error(statusJson.error || "Błąd ładowania statusu");
      setBusinesses(statusJson.businesses || []);

      if (analyticsRes?.ok) {
        const analyticsJson = await analyticsRes.json();
        setAnalytics(analyticsJson.businesses || []);
      } else {
        setAnalytics([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nieznany błąd");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(period);
  }, [periodIdx, fetchData]);

  // Chart data
  const pageviewsChart = analytics
    .filter((a) => a.stats?.pageviews?.value)
    .sort((a, b) => (b.stats?.pageviews?.value ?? 0) - (a.stats?.pageviews?.value ?? 0))
    .map((a) => ({
      name: a.businessName,
      value: a.stats?.pageviews?.value ?? 0,
    }));

  const visitorsChart = analytics
    .filter((a) => a.stats?.visitors?.value)
    .sort((a, b) => (b.stats?.visitors?.value ?? 0) - (a.stats?.visitors?.value ?? 0))
    .map((a) => ({
      name: a.businessName,
      value: a.stats?.visitors?.value ?? 0,
    }));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Przegląd wszystkich serwisów</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Status i analityka dla {businesses.length} biznesów
          </p>
        </div>
        <div className="flex gap-1">
          {PERIODS.map((p, i) => (
            <Button
              key={p.label}
              variant={periodIdx === i ? "default" : "ghost"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setPeriodIdx(i)}
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
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Summary cards */}
          <SummaryCards businesses={businesses} analytics={analytics} />

          {/* Status table */}
          <Card>
            <CardHeader className="pb-0 pt-4 px-5">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                Status serwisów
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3 pb-2 px-5">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-xs text-muted-foreground">
                      <th className="text-left py-2 pr-4 font-medium">Serwis</th>
                      <th className="text-left py-2 pr-4 font-medium">Status</th>
                      <th className="text-right py-2 pr-4 font-medium">Uptime</th>
                      <th className="text-right py-2 pr-4 font-medium">Latencja</th>
                      <th className="text-right py-2 font-medium">Ostatni check</th>
                    </tr>
                  </thead>
                  <tbody>
                    {businesses.map((b) => {
                      const cfg = STATUS_CONFIG[b.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.unknown;
                      const analyticsData = analytics.find((a) => a.subdomain === b.subdomain);
                      return (
                        <tr key={b.subdomain} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                          <td className="py-2.5 pr-4">
                            <div>
                              <span className="font-medium">{b.businessName}</span>
                              <span className="text-xs text-muted-foreground ml-2">{b.subdomain}</span>
                            </div>
                            {b.industry && (
                              <span className="text-xs text-muted-foreground">{b.industry}</span>
                            )}
                          </td>
                          <td className="py-2.5 pr-4">
                            <div className="flex items-center gap-2">
                              <StatusDot status={b.status} />
                              <span className={`text-xs font-medium ${cfg.color}`}>
                                {b.status === "healthy" ? "OK" : b.status === "degraded" ? "Degraded" : b.status === "unhealthy" ? "Down" : "—"}
                              </span>
                            </div>
                          </td>
                          <td className="py-2.5 pr-4 text-right tabular-nums">
                            <span className={b.stats.uptimePercent < 99 ? "text-yellow-600" : ""}>
                              {b.stats.total > 0 ? `${b.stats.uptimePercent}%` : "—"}
                            </span>
                          </td>
                          <td className="py-2.5 pr-4 text-right tabular-nums text-muted-foreground">
                            {b.stats.avgLatencyMs > 0 ? `${b.stats.avgLatencyMs}ms` : "—"}
                          </td>
                          <td className="py-2.5 text-right text-xs text-muted-foreground">
                            {b.lastCheckedAt
                              ? new Date(b.lastCheckedAt).toLocaleString("pl-PL", {
                                  day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
                                })
                              : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {businesses.length === 0 && (
                <p className="text-center py-6 text-sm text-muted-foreground">Brak danych</p>
              )}
            </CardContent>
          </Card>

          {/* Analytics charts */}
          {(pageviewsChart.length > 0 || visitorsChart.length > 0) && (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {/* Pageviews per business */}
              {pageviewsChart.length > 0 && (
                <Card>
                  <CardHeader className="pb-0 pt-4 px-5">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                      Wyświetlenia per biznes
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-3 pb-4 px-5">
                    <ResponsiveContainer width="100%" height={pageviewsChart.length * 36 + 8}>
                      <BarChart
                        layout="vertical"
                        data={pageviewsChart}
                        margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
                      >
                        <XAxis type="number" hide />
                        <YAxis
                          type="category"
                          dataKey="name"
                          width={120}
                          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(v) => (v?.length > 18 ? v.slice(0, 17) + "…" : v)}
                        />
                        <Tooltip content={<BarTooltip />} cursor={{ fill: "hsl(var(--muted))" }} />
                        <Bar dataKey="value" fill={CHART_COLORS[0]} radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Visitors per business */}
              {visitorsChart.length > 0 && (
                <Card>
                  <CardHeader className="pb-0 pt-4 px-5">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Users className="h-3.5 w-3.5 text-muted-foreground" />
                      Odwiedzający per biznes
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-3 pb-4 px-5">
                    <ResponsiveContainer width="100%" height={visitorsChart.length * 36 + 8}>
                      <BarChart
                        layout="vertical"
                        data={visitorsChart}
                        margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
                      >
                        <XAxis type="number" hide />
                        <YAxis
                          type="category"
                          dataKey="name"
                          width={120}
                          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(v) => (v?.length > 18 ? v.slice(0, 17) + "…" : v)}
                        />
                        <Tooltip content={<BarTooltip />} cursor={{ fill: "hsl(var(--muted))" }} />
                        <Bar dataKey="value" fill={CHART_COLORS[2]} radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Per-business analytics detail */}
          {analytics.length > 0 && (
            <Card>
              <CardHeader className="pb-0 pt-4 px-5">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <BarChart2 className="h-4 w-4 text-muted-foreground" />
                  Analityka per biznes
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-3 pb-2 px-5">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-xs text-muted-foreground">
                        <th className="text-left py-2 pr-4 font-medium">Serwis</th>
                        <th className="text-right py-2 pr-4 font-medium">Wyświetlenia</th>
                        <th className="text-right py-2 pr-4 font-medium">Odwiedzający</th>
                        <th className="text-right py-2 pr-4 font-medium">Sesje</th>
                        <th className="text-right py-2 font-medium">Bounce</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.map((a) => (
                        <tr key={a.subdomain} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                          <td className="py-2.5 pr-4 font-medium">{a.businessName}</td>
                          {a.stats ? (
                            <>
                              <td className="py-2.5 pr-4 text-right tabular-nums">
                                {(a.stats.pageviews?.value ?? 0).toLocaleString("pl-PL")}
                              </td>
                              <td className="py-2.5 pr-4 text-right tabular-nums">
                                {(a.stats.visitors?.value ?? 0).toLocaleString("pl-PL")}
                              </td>
                              <td className="py-2.5 pr-4 text-right tabular-nums">
                                {(a.stats.visits?.value ?? 0).toLocaleString("pl-PL")}
                              </td>
                              <td className="py-2.5 text-right tabular-nums text-muted-foreground">
                                {(a.stats.bounces?.value ?? 0).toLocaleString("pl-PL")}
                              </td>
                            </>
                          ) : (
                            <td colSpan={4} className="py-2.5 text-right text-xs text-muted-foreground">
                              {a.error || "Brak danych"}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
