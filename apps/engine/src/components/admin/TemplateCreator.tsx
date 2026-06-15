import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import {
  Rocket, Pause, Play, Ban, GitMerge, Loader2, AlertTriangle, Activity, BookOpen, Gauge,
} from "lucide-react";

const API = "/api/admin/template-creator";

// Mirrors @mshorizon/sitc-core DEFAULT_COST_MODEL (sitc-core is node-only, not
// importable into the client bundle — keep these in sync).
function estimateCost(sectionCount: number, avgIters: number, maxWorkers: number) {
  const tokensPerIter = 12_000 + 4_000 + 6_000;
  const usdPerMTok = 6;
  const perIterSec = 25 + 4;
  const iterations = Math.max(0, Math.round(sectionCount * avgIters) + 6);
  const totalTokens = iterations * tokensPerIter;
  const usd = Math.round(((totalTokens / 1_000_000) * usdPerMTok) * 100) / 100;
  const hours = Math.round(((iterations / Math.max(1, maxWorkers)) * perIterSec) / 360) / 10;
  return { iterations, usd, hours };
}

interface Run {
  id: number;
  templateName: string;
  targetUrl: string;
  status: string;
  maxWorkers: number;
  themeLocked: boolean;
  atomsLocked: boolean;
  bestOverallScore: number | null;
}
interface Lesson {
  id: number;
  scope: string;
  trigger: string;
  lesson: string;
  confidence: number;
  uses: number;
  wins: number;
}
interface Payload {
  deployed: boolean;
  reason?: string;
  runs: Run[];
  lessons: Lesson[];
  judgeHealth: { total: number; checked: number; agreement: number | null };
}

const TERMINAL = new Set(["done", "aborted"]);
const statusVariant = (s: string) =>
  s === "done" ? "default" : s === "needs_review" ? "secondary" : s === "aborted" ? "destructive" : "outline";

export default function TemplateCreator() {
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  // start-form state
  const [templateName, setTemplateName] = useState("template-");
  const [targetUrl, setTargetUrl] = useState("");
  const [sections, setSections] = useState(8);
  const [avgIters, setAvgIters] = useState(4);
  const [maxWorkers, setMaxWorkers] = useState(3);

  const cost = useMemo(() => estimateCost(sections, avgIters, maxWorkers), [sections, avgIters, maxWorkers]);

  const refresh = async () => {
    try {
      const r = await fetch(API);
      setData(await r.json());
    } catch {
      setData({ deployed: false, reason: "API unreachable", runs: [], lessons: [], judgeHealth: { total: 0, checked: 0, agreement: null } });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    refresh();
  }, []);

  const start = async () => {
    setBusy(true);
    try {
      const r = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start", templateName, targetUrl, maxWorkers, budgetIterations: Math.round(sections * avgIters) }),
      });
      if (!r.ok) alert((await r.json()).error ?? "failed");
      else await refresh();
    } finally {
      setBusy(false);
    }
  };

  const command = async (runId: number, type: string) => {
    await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "command", runId, type }),
    });
    await refresh();
  };

  return (
    <div className="max-w-5xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Self-Improving Template Creator</h1>
        <Badge variant="outline">Phase 7 · admin</Badge>
      </div>

      {data && !data.deployed && (
        <Card className="border-amber-500/40">
          <CardContent className="flex items-start gap-2 py-3 text-sm">
            <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-500" />
            <div>
              <div className="font-medium">Control-plane schema not deployed.</div>
              <div className="text-muted-foreground">
                Push the <code>sitc_*</code> tables to the control DB to enable runs:{" "}
                <code>cd packages/db &amp;&amp; DATABASE_URL=… pnpm db:push</code>. You can still draft a run below.
                {data.reason ? <span className="block opacity-70">({data.reason})</span> : null}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="new">
        <TabsList>
          <TabsTrigger value="new"><Rocket className="mr-1.5 h-4 w-4" />New Run</TabsTrigger>
          <TabsTrigger value="runs"><Activity className="mr-1.5 h-4 w-4" />Runs</TabsTrigger>
          <TabsTrigger value="lessons"><BookOpen className="mr-1.5 h-4 w-4" />Lessons</TabsTrigger>
          <TabsTrigger value="health"><Gauge className="mr-1.5 h-4 w-4" />Judge / Ops</TabsTrigger>
        </TabsList>

        {/* NEW RUN */}
        <TabsContent value="new">
          <Card>
            <CardHeader><CardTitle className="text-base">Start a run</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tn">Template name</Label>
                  <Input id="tn" value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder="template-restaurant" />
                  {!templateName.startsWith("template-") && <p className="mt-1 text-xs text-destructive">must start with “template-”</p>}
                </div>
                <div>
                  <Label htmlFor="url">Target URL</Label>
                  <Input id="url" value={targetUrl} onChange={(e) => setTargetUrl(e.target.value)} placeholder="https://example.framer.website/" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><Label htmlFor="sec">Sections</Label><Input id="sec" type="number" value={sections} onChange={(e) => setSections(+e.target.value)} /></div>
                <div><Label htmlFor="it">Avg iters/section</Label><Input id="it" type="number" value={avgIters} onChange={(e) => setAvgIters(+e.target.value)} /></div>
                <div><Label htmlFor="mw">Max workers</Label><Input id="mw" type="number" value={maxWorkers} onChange={(e) => setMaxWorkers(+e.target.value)} /></div>
              </div>
              <Separator />
              <div className="flex items-center gap-6 text-sm">
                <div><span className="text-muted-foreground">Est. iterations</span><div className="text-lg font-semibold">{cost.iterations}</div></div>
                <div><span className="text-muted-foreground">Est. cost</span><div className="text-lg font-semibold">${cost.usd}</div></div>
                <div><span className="text-muted-foreground">Est. wall-clock</span><div className="text-lg font-semibold">{cost.hours} h</div></div>
              </div>
              <Button onClick={start} disabled={busy || !templateName.startsWith("template-") || !targetUrl}>
                {busy ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Rocket className="mr-1.5 h-4 w-4" />}
                Create run
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* RUNS */}
        <TabsContent value="runs">
          <Card>
            <CardContent className="py-2">
              {loading ? (
                <div className="flex items-center gap-2 py-6 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading…</div>
              ) : !data?.runs.length ? (
                <div className="py-6 text-sm text-muted-foreground">No runs yet.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow><TableHead>#</TableHead><TableHead>Template</TableHead><TableHead>Status</TableHead><TableHead>Tiers</TableHead><TableHead>Score</TableHead><TableHead>Controls</TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.runs.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>{r.id}</TableCell>
                        <TableCell className="font-medium">{r.templateName}</TableCell>
                        <TableCell><Badge variant={statusVariant(r.status) as never}>{r.status}</Badge></TableCell>
                        <TableCell className="text-xs text-muted-foreground">{r.themeLocked ? "theme" : "—"} / {r.atomsLocked ? "atoms" : "—"}</TableCell>
                        <TableCell>{r.bestOverallScore?.toFixed(2) ?? "—"}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="xs" variant="ghost" disabled={TERMINAL.has(r.status)} onClick={() => command(r.id, "pause")}><Pause className="h-3.5 w-3.5" /></Button>
                            <Button size="xs" variant="ghost" disabled={TERMINAL.has(r.status)} onClick={() => command(r.id, "resume")}><Play className="h-3.5 w-3.5" /></Button>
                            {r.status === "needs_review" && <Button size="xs" variant="outline" onClick={() => command(r.id, "approve_merge")}><GitMerge className="mr-1 h-3.5 w-3.5" />Merge</Button>}
                            <Button size="xs" variant="ghost" disabled={TERMINAL.has(r.status)} onClick={() => command(r.id, "abort")}><Ban className="h-3.5 w-3.5" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* LESSONS */}
        <TabsContent value="lessons">
          <Card>
            <CardContent className="py-2">
              {!data?.lessons.length ? (
                <div className="py-6 text-sm text-muted-foreground">No lessons yet — they accumulate as runs complete.</div>
              ) : (
                <Table>
                  <TableHeader><TableRow><TableHead>Scope</TableHead><TableHead>Lesson</TableHead><TableHead>Conf.</TableHead><TableHead>W/U</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {data.lessons.map((l) => (
                      <TableRow key={l.id}>
                        <TableCell><Badge variant="outline">{l.scope}</Badge></TableCell>
                        <TableCell className="max-w-md text-sm">{l.lesson}</TableCell>
                        <TableCell>{l.confidence.toFixed(2)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{l.wins}/{l.uses}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* JUDGE / OPS */}
        <TabsContent value="health">
          <Card>
            <CardHeader><CardTitle className="text-base">Judge health</CardTitle></CardHeader>
            <CardContent className="text-sm">
              <div className="flex gap-8">
                <div><span className="text-muted-foreground">Calibration triples</span><div className="text-lg font-semibold">{data?.judgeHealth.total ?? 0}</div></div>
                <div><span className="text-muted-foreground">Human agreement</span><div className="text-lg font-semibold">{data?.judgeHealth.agreement != null ? `${Math.round(data.judgeHealth.agreement * 100)}%` : "—"}</div></div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">A drop in agreement warns of model/prompt drift (DESIGN §7.2a). Grow the calibration set with subtle deltas before autonomous runs.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
