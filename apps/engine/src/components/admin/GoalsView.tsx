import React, { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Target, CheckCircle, SkipForward, RefreshCw, Save, Terminal, Play } from "lucide-react";

// ── Types (mirror the DB row shapes) ────────────────────────────────────────

interface Goal {
  id: string;
  title: string;
  avoidList: string | null;
  status: string;
}

interface GoalStep {
  id: string;
  goalId: string;
  title: string;
  type: "human" | "code" | "bug";
  rationale: string | null;
  milestoneLabel: string | null;
  status: string;
}

interface Task {
  id: string;
  status: string;
  summary: string | null;
}

interface Snapshot {
  goal: Goal | null;
  currentStep: GoalStep | null;
  task: Task | null;
}

// ── Constants ────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<GoalStep["type"], string> = {
  human: "Human",
  code: "Code",
  bug: "Bug",
};

// ── Main Component ────────────────────────────────────────────────────────────

export default function GoalsView() {
  const [snap, setSnap] = useState<Snapshot>({ goal: null, currentStep: null, task: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [titleDraft, setTitleDraft] = useState("");
  const [avoidDraft, setAvoidDraft] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/goals");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: Snapshot = await res.json();
      setSnap(data);
      setTitleDraft(data.goal?.title ?? "");
      setAvoidDraft(data.goal?.avoidList ?? "");
    } catch {
      setError("Failed to load goal.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const post = async (payload: Record<string, unknown>) => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      const data: Snapshot = await res.json();
      setSnap(data);
      setTitleDraft(data.goal?.title ?? "");
      setAvoidDraft(data.goal?.avoidList ?? "");
    } catch (e: any) {
      setError(e.message ?? "Action failed.");
    } finally {
      setSaving(false);
    }
  };

  const step = snap.currentStep;
  const task = snap.task;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-lg font-semibold">
          <Target className="w-5 h-5" /> Kaizen Growth
        </h1>
        <Button size="sm" variant="ghost" onClick={load} disabled={loading}>
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 text-destructive px-4 py-3 text-sm">{error}</div>
      )}

      {/* North-star goal */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">North-star goal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="northstar">The one big goal everything ladders up to</Label>
            <div className="flex gap-2">
              <Input
                id="northstar"
                placeholder="e.g. 10 paying clients"
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
              />
              <Button
                size="sm"
                onClick={() => post({ action: "set-goal", title: titleDraft })}
                disabled={saving || !titleDraft.trim() || titleDraft.trim() === snap.goal?.title}
              >
                <Save className="w-3.5 h-3.5 mr-1" /> Save
              </Button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="avoid">Off-limits (one per line) — never suggested</Label>
            <Textarea
              id="avoid"
              rows={3}
              placeholder="e.g. no in-person events"
              value={avoidDraft}
              onChange={(e) => setAvoidDraft(e.target.value)}
              disabled={!snap.goal}
            />
            <div className="flex justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={() => post({ action: "update-avoidlist", avoidList: avoidDraft })}
                disabled={saving || !snap.goal || avoidDraft === (snap.goal?.avoidList ?? "")}
              >
                <Save className="w-3.5 h-3.5 mr-1" /> Save off-limits
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* The single next step */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your next step</CardTitle>
        </CardHeader>
        <CardContent>
          {!snap.goal ? (
            <p className="text-sm text-muted-foreground">Set a north-star goal above to begin.</p>
          ) : !step ? (
            <div className="text-sm text-muted-foreground space-y-2">
              <p>No step yet.</p>
              <p className="flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5" />
                Run <code className="rounded bg-muted px-1.5 py-0.5">pnpm goal:next</code> locally to compute your next step.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary">{TYPE_LABELS[step.type]}</Badge>
                {step.milestoneLabel && (
                  <span className="text-xs text-muted-foreground">→ {step.milestoneLabel}</span>
                )}
                {step.status === "accepted" && (
                  <Badge variant="outline">Accepted</Badge>
                )}
              </div>
              <p className="font-medium">{step.title}</p>
              {step.rationale && <p className="text-sm text-muted-foreground">{step.rationale}</p>}
              {task && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Task:</span>
                  <Badge variant="outline">{task.status}</Badge>
                  {task.summary && <span className="italic">— {task.summary}</span>}
                </div>
              )}
              {step.status === "accepted" && step.type === "bug" && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Terminal className="w-3.5 h-3.5" />
                  Run <code className="rounded bg-muted px-1.5 py-0.5">pnpm goal:resolve</code> locally to fix this interactively.
                </div>
              )}
              <div className="flex gap-2 pt-1">
                {step.status === "proposed" && (
                  <Button
                    size="sm"
                    onClick={() => post({ action: "step-action", id: step.id, verb: "accept" })}
                    disabled={saving}
                  >
                    Accept
                  </Button>
                )}
                {step.status === "accepted" && step.type === "code" && !task && (
                  <Button
                    size="sm"
                    onClick={() => post({ action: "run-step", id: step.id })}
                    disabled={saving}
                  >
                    <Play className="w-3.5 h-3.5 mr-1" /> Run now
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => post({ action: "step-action", id: step.id, verb: "resolve" })}
                  disabled={saving}
                >
                  <CheckCircle className="w-3.5 h-3.5 mr-1" /> Resolved
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => post({ action: "step-action", id: step.id, verb: "skip" })}
                  disabled={saving}
                >
                  <SkipForward className="w-3.5 h-3.5 mr-1" /> Skip
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
