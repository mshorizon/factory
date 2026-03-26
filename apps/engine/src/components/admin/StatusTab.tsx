import React, { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, Clock, AlertTriangle, CheckCircle, XCircle, Database, HardDrive } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface HealthCheckEntry {
  id: number;
  siteId: number | null;
  status: string;
  checks: Record<string, { status: string; latencyMs: number; error?: string }>;
  latencyMs: number | null;
  checkedAt: string;
}

interface HealthStats {
  total: number;
  healthy: number;
  degraded: number;
  unhealthy: number;
  uptimePercent: number;
  avgLatencyMs: number;
}

interface HealthData {
  stats: HealthStats;
  latest: HealthCheckEntry | null;
  history: HealthCheckEntry[];
}

const PERIODS = [
  { label: "1h", value: 1 },
  { label: "24h", value: 24 },
  { label: "7d", value: 168 },
  { label: "30d", value: 720 },
];

const CHART_COLORS = [
  "var(--color-chart-1, hsl(217 91% 60%))",
  "var(--color-chart-2, hsl(221 83% 53%))",
];

const STATUS_CONFIG = {
  healthy: { color: "text-green-600", bg: "bg-green-500/10 border-green-500/30", icon: CheckCircle, label: "Zdrowy" },
  degraded: { color: "text-yellow-600", bg: "bg-yellow-500/10 border-yellow-500/30", icon: AlertTriangle, label: "Zdegradowany" },
  unhealthy: { color: "text-red-600", bg: "bg-red-500/10 border-red-500/30", icon: XCircle, label: "Niedostępny" },
} as const;

function StatusBanner({ status }: { status: string }) {
  const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.unhealthy;
  const Icon = config.icon;
  return (
    <div className={`rounded-lg border p-4 flex items-center gap-3 ${config.bg}`}>
      <Icon className={`h-6 w-6 ${config.color}`} />
      <div>
        <p className={`text-sm font-semibold ${config.color}`}>{config.label}</p>
        <p className="text-xs text-muted-foreground">Aktualny status serwisu</p>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, unit }: { icon: React.ElementType; label: string; value: string | number; unit?: string }) {
  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground mb-1">{label}</p>
            <p className="text-2xl font-semibold tabular-nums">
              {value}{unit && <span className="text-sm text-muted-foreground ml-1">{unit}</span>}
            </p>
          </div>
          <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
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
          {p.value} ms
        </p>
      ))}
    </div>
  );
};

interface StatusTabProps {
  businessId: string;
}

export function StatusTab({ businessId }: StatusTabProps) {
  const [hours, setHours] = useState(24);
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (h: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/health-checks?business=${businessId}&hours=${h}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Błąd ładowania danych");
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nieznany błąd");
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    fetchData(hours);
  }, [hours, fetchData]);

  const chartData = (data?.history ?? [])
    .slice()
    .reverse()
    .map((entry) => ({
      time: new Date(entry.checkedAt).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" }),
      latency: entry.latencyMs ?? 0,
      status: entry.status,
    }));

  const incidents = (data?.history ?? []).filter((e) => e.status !== "healthy").slice(0, 10);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Status serwisu</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Monitoring dostępności {businessId}</p>
        </div>
        <div className="flex gap-1">
          {PERIODS.map((p) => (
            <Button
              key={p.value}
              variant={hours === p.value ? "default" : "ghost"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setHours(p.value)}
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

      {!loading && data && (
        <>
          {/* Status banner */}
          <StatusBanner status={data.latest?.status ?? "healthy"} />

          {/* Stat cards */}
          <div className="grid grid-cols-3 gap-3">
            <StatCard
              icon={CheckCircle}
              label="Uptime"
              value={data.stats.uptimePercent}
              unit="%"
            />
            <StatCard
              icon={Clock}
              label="Śr. latencja"
              value={data.stats.avgLatencyMs}
              unit="ms"
            />
            <StatCard
              icon={AlertTriangle}
              label="Incydenty"
              value={data.stats.unhealthy}
            />
          </div>

          {/* Latency chart */}
          {chartData.length > 0 && (
            <Card>
              <CardHeader className="pb-0 pt-4 px-5">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  Latencja w czasie
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-3 pb-4 px-5">
                <ResponsiveContainer width="100%" height={140}>
                  <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="latencyGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_COLORS[0]} stopOpacity={0.2} />
                        <stop offset="95%" stopColor={CHART_COLORS[0]} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="time"
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
                      dataKey="latency"
                      stroke={CHART_COLORS[0]}
                      strokeWidth={2}
                      fill="url(#latencyGradient)"
                      dot={false}
                      activeDot={{ r: 4, fill: CHART_COLORS[0] }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Service breakdown */}
          {data.latest?.checks && (
            <Card>
              <CardHeader className="pb-0 pt-4 px-5">
                <CardTitle className="text-sm font-medium">Serwisy</CardTitle>
              </CardHeader>
              <CardContent className="pt-3 pb-4 px-5">
                <div className="space-y-2">
                  {Object.entries(data.latest.checks).map(([name, check]) => {
                    const isUp = check.status === "up";
                    const Icon = name === "database" ? Database : HardDrive;
                    return (
                      <div key={name} className="flex items-center justify-between py-1.5 border-b last:border-0">
                        <div className="flex items-center gap-2">
                          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm capitalize">{name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground tabular-nums">{check.latencyMs}ms</span>
                          <span className={`text-xs font-medium ${isUp ? "text-green-600" : "text-red-600"}`}>
                            {isUp ? "OK" : "DOWN"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent incidents */}
          {incidents.length > 0 && (
            <Card>
              <CardHeader className="pb-0 pt-4 px-5">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  Ostatnie incydenty
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-3 pb-4 px-5">
                <div className="space-y-2">
                  {incidents.map((entry) => {
                    const cfg = STATUS_CONFIG[entry.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.unhealthy;
                    return (
                      <div key={entry.id} className="flex items-center justify-between py-1.5 border-b last:border-0">
                        <div className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${entry.status === "degraded" ? "bg-yellow-500" : "bg-red-500"}`} />
                          <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(entry.checkedAt).toLocaleString("pl-PL", {
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {data.stats.total === 0 && (
            <div className="text-center py-8 text-sm text-muted-foreground">
              Brak danych. Health check cron uruchamia się co 5 minut.
            </div>
          )}
        </>
      )}
    </div>
  );
}
