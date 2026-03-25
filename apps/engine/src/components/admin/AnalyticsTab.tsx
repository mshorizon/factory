import React, { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Eye, MousePointerClick, TrendingUp, Globe, Smartphone } from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface StatValue {
  value: number;
  prev?: number;
  change?: number;
}

interface AnalyticsData {
  websiteId: string;
  stats: Record<string, StatValue | number>;
  pageviews:
    | { pageviews: Array<{ x: string; y: number }>; sessions?: Array<{ x: string; y: number }> }
    | Array<{ x: string; y: number }>;
  pages: Array<{ x: string; y: number }>;
  referrers: Array<{ x: string; y: number }>;
  devices: Array<{ x: string; y: number }>;
  utmSources: Array<{ x: string; y: number }>;
  utmCampaigns: Array<{ x: string; y: number }>;
}

const PERIODS = [
  { label: "Dziś", value: "1d" },
  { label: "7 dni", value: "7d" },
  { label: "30 dni", value: "30d" },
  { label: "90 dni", value: "90d" },
];

// chart-1..5 as CSS oklch vars — Recharts needs hex/hsl, so we use hsl fallbacks
const CHART_COLORS = [
  "var(--color-chart-1, hsl(217 91% 60%))",
  "var(--color-chart-2, hsl(221 83% 53%))",
  "var(--color-chart-3, hsl(224 76% 48%))",
  "var(--color-chart-4, hsl(226 71% 44%))",
  "var(--color-chart-5, hsl(228 64% 39%))",
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

function getPageviewsArray(pv: AnalyticsData["pageviews"]): Array<{ x: string; y: number }> {
  if (!pv) return [];
  if (Array.isArray(pv)) return pv;
  if (Array.isArray(pv.pageviews)) return pv.pageviews;
  return [];
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
            <p className="text-2xl font-semibold tabular-nums">{value.toLocaleString("pl-PL")}</p>
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

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border bg-background px-3 py-2 shadow-sm text-xs">
      <p className="text-muted-foreground mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="font-medium" style={{ color: p.color }}>
          {p.value.toLocaleString("pl-PL")}
        </p>
      ))}
    </div>
  );
};

const BarTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="rounded-md border border-border bg-background px-3 py-2 shadow-sm text-xs">
      <p className="text-muted-foreground truncate max-w-[200px]">{item?.payload?.x || "(direct)"}</p>
      <p className="font-medium mt-0.5">{item?.value?.toLocaleString("pl-PL")}</p>
    </div>
  );
};

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
  const pages = data?.pages ?? [];
  const referrers = data?.referrers ?? [];
  const devices = (data?.devices ?? []).map((d) => ({
    name: d.x || "Inne",
    value: d.y,
  }));

  return (
    <div className="space-y-5">
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
            ? "Analytics nie jest skonfigurowane. Dodaj UMAMI_URL i UMAMI_USERNAME/UMAMI_PASSWORD do .env."
            : error}
        </div>
      )}

      {!loading && data && (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-3 gap-3">
            <StatCard
              icon={Eye}
              label="Wyświetlenia"
              value={getStatValue(data.stats?.pageviews)}
              prev={getStatPrev(data.stats?.pageviews)}
            />
            <StatCard
              icon={Users}
              label="Odwiedzający"
              value={getStatValue(data.stats?.visitors)}
              prev={getStatPrev(data.stats?.visitors)}
            />
            <StatCard
              icon={MousePointerClick}
              label="Sesje"
              value={getStatValue(data.stats?.visits)}
              prev={getStatPrev(data.stats?.visits)}
            />
          </div>

          {/* Area chart */}
          {pageviewsArray.length > 0 && (
            <Card>
              <CardHeader className="pb-0 pt-4 px-5">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  Wyświetlenia w czasie
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-3 pb-4 px-5">
                <ResponsiveContainer width="100%" height={140}>
                  <AreaChart data={pageviewsArray} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_COLORS[0]} stopOpacity={0.2} />
                        <stop offset="95%" stopColor={CHART_COLORS[0]} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="x"
                      tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false}
                      tickLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="y"
                      stroke={CHART_COLORS[0]}
                      strokeWidth={2}
                      fill="url(#areaGradient)"
                      dot={false}
                      activeDot={{ r: 4, fill: CHART_COLORS[0] }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Bottom row */}
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            {/* Top pages bar chart */}
            <Card className="xl:col-span-1">
              <CardHeader className="pb-0 pt-4 px-5">
                <CardTitle className="text-sm font-medium">Top strony</CardTitle>
              </CardHeader>
              <CardContent className="pt-3 pb-4 px-5">
                {pages.length > 0 ? (
                  <ResponsiveContainer width="100%" height={pages.length * 28 + 8}>
                    <BarChart
                      layout="vertical"
                      data={pages.slice(0, 7)}
                      margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
                    >
                      <XAxis type="number" hide />
                      <YAxis
                        type="category"
                        dataKey="x"
                        width={100}
                        tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => (v?.length > 16 ? v.slice(0, 15) + "…" : v || "/")}
                      />
                      <Tooltip content={<BarTooltip />} cursor={{ fill: "hsl(var(--muted))" }} />
                      <Bar dataKey="y" fill={CHART_COLORS[1]} radius={[0, 3, 3, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-xs text-muted-foreground py-4">Brak danych</p>
                )}
              </CardContent>
            </Card>

            {/* Referrers */}
            <Card>
              <CardHeader className="pb-0 pt-4 px-5">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                  Źródła ruchu
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-3 pb-4 px-5">
                {referrers.length > 0 ? (
                  <ResponsiveContainer width="100%" height={referrers.length * 28 + 8}>
                    <BarChart
                      layout="vertical"
                      data={referrers.slice(0, 5)}
                      margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
                    >
                      <XAxis type="number" hide />
                      <YAxis
                        type="category"
                        dataKey="x"
                        width={100}
                        tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => (v?.length > 16 ? v.slice(0, 15) + "…" : v || "(direct)")}
                      />
                      <Tooltip content={<BarTooltip />} cursor={{ fill: "hsl(var(--muted))" }} />
                      <Bar dataKey="y" fill={CHART_COLORS[2]} radius={[0, 3, 3, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-xs text-muted-foreground py-4">Brak danych</p>
                )}
              </CardContent>
            </Card>

            {/* Devices pie */}
            <Card>
              <CardHeader className="pb-0 pt-4 px-5">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Smartphone className="h-3.5 w-3.5 text-muted-foreground" />
                  Urządzenia
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-3 pb-4 px-5">
                {devices.length > 0 ? (
                  <div className="flex items-center gap-4">
                    <ResponsiveContainer width={90} height={90}>
                      <PieChart>
                        <Pie
                          data={devices}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={22}
                          outerRadius={40}
                          strokeWidth={2}
                          stroke="hsl(var(--background))"
                        >
                          {devices.map((_, i) => (
                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          content={({ active, payload }) =>
                            active && payload?.length ? (
                              <div className="rounded-md border border-border bg-background px-2 py-1 shadow-sm text-xs">
                                <span className="font-medium">{payload[0].name}: {payload[0].value}</span>
                              </div>
                            ) : null
                          }
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-1.5 flex-1 min-w-0">
                      {devices.map((d, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <span
                            className="h-2 w-2 rounded-full flex-shrink-0"
                            style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                          />
                          <span className="text-muted-foreground truncate">{d.name}</span>
                          <span className="ml-auto tabular-nums font-medium">{d.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground py-4">Brak danych</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* UTM */}
          {((data.utmSources ?? []).length > 0 || (data.utmCampaigns ?? []).length > 0) && (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <Card>
                <CardHeader className="pb-0 pt-4 px-5">
                  <CardTitle className="text-sm font-medium">UTM Source</CardTitle>
                </CardHeader>
                <CardContent className="pt-3 pb-4 px-5">
                  {(data.utmSources ?? []).length > 0 ? (
                    <ResponsiveContainer width="100%" height={(data.utmSources.length) * 28 + 8}>
                      <BarChart
                        layout="vertical"
                        data={data.utmSources.slice(0, 7)}
                        margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
                      >
                        <XAxis type="number" hide />
                        <YAxis
                          type="category"
                          dataKey="x"
                          width={110}
                          tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(v) => (v?.length > 18 ? v.slice(0, 17) + "…" : v || "(none)")}
                        />
                        <Tooltip content={<BarTooltip />} cursor={{ fill: "hsl(var(--muted))" }} />
                        <Bar dataKey="y" fill={CHART_COLORS[3]} radius={[0, 3, 3, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-xs text-muted-foreground py-4">Brak danych UTM</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-0 pt-4 px-5">
                  <CardTitle className="text-sm font-medium">UTM Campaign</CardTitle>
                </CardHeader>
                <CardContent className="pt-3 pb-4 px-5">
                  {(data.utmCampaigns ?? []).length > 0 ? (
                    <ResponsiveContainer width="100%" height={(data.utmCampaigns.length) * 28 + 8}>
                      <BarChart
                        layout="vertical"
                        data={data.utmCampaigns.slice(0, 7)}
                        margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
                      >
                        <XAxis type="number" hide />
                        <YAxis
                          type="category"
                          dataKey="x"
                          width={110}
                          tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(v) => (v?.length > 18 ? v.slice(0, 17) + "…" : v || "(none)")}
                        />
                        <Tooltip content={<BarTooltip />} cursor={{ fill: "hsl(var(--muted))" }} />
                        <Bar dataKey="y" fill={CHART_COLORS[4]} radius={[0, 3, 3, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-xs text-muted-foreground py-4">Brak danych UTM</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}
