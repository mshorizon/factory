import React, { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Trophy, RefreshCw, ChevronDown, Sparkles } from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface Suggestion {
  id: number;
  title: string;
  rationale: string;
  category: string;
  priority: number;
  effort: string;
  status: string;
  createdBy: string;
  createdAt: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  tech_debt: "Tech Debt",
  feature: "Feature",
  marketing: "Marketing",
  client_acquisition: "Client Acquisition",
  infrastructure: "Infrastructure",
};

const CATEGORY_COLORS: Record<string, string> = {
  tech_debt: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  feature: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  marketing: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  client_acquisition: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  infrastructure: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
};

const PRIORITY_COLORS: Record<number, string> = {
  5: "bg-red-500 text-white",
  4: "bg-orange-500 text-white",
  3: "bg-yellow-500 text-black",
  2: "bg-blue-400 text-white",
  1: "bg-gray-400 text-white",
};

const EFFORT_LABELS: Record<string, string> = {
  s: "S",
  m: "M",
  l: "L",
  xl: "XL",
};

const ALL_CATEGORIES = Object.keys(CATEGORY_LABELS);

// ── Suggestion Card ───────────────────────────────────────────────────────────

function SuggestionCard({
  suggestion,
  onAction,
}: {
  suggestion: Suggestion;
  onAction: (id: number, action: string) => Promise<void>;
}) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleAction = async (action: string) => {
    setLoading(action);
    await onAction(suggestion.id, action);
    setLoading(null);
  };

  const isPending = suggestion.status === "pending";
  const isAccepted = suggestion.status === "accepted";
  const isDone = suggestion.status === "done";
  const isRejected = suggestion.status === "rejected";

  return (
    <Card
      className={`transition-opacity ${isRejected || isDone ? "opacity-60" : ""}`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm font-semibold leading-snug flex-1">
            {suggestion.title}
          </CardTitle>
          <div className="flex items-center gap-1.5 shrink-0">
            <span
              className={`inline-flex items-center justify-center rounded-full text-xs font-bold w-6 h-6 ${
                PRIORITY_COLORS[suggestion.priority] ?? "bg-gray-300"
              }`}
            >
              {suggestion.priority}
            </span>
            <span className="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium bg-muted text-muted-foreground">
              {EFFORT_LABELS[suggestion.effort] ?? suggestion.effort.toUpperCase()}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
          {suggestion.rationale}
        </p>

        {isPending && (
          <div className="flex gap-2 flex-wrap">
            <Button
              size="sm"
              className="flex-1 min-w-[80px]"
              onClick={() => handleAction("accepted")}
              disabled={loading !== null}
            >
              {loading === "accepted" ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1" />
              ) : (
                <CheckCircle className="w-3.5 h-3.5 mr-1" />
              )}
              Accept
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 min-w-[80px]"
              onClick={() => handleAction("done")}
              disabled={loading !== null}
            >
              {loading === "done" ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1" />
              ) : (
                <Trophy className="w-3.5 h-3.5 mr-1" />
              )}
              Done
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="flex-1 min-w-[80px] text-destructive hover:text-destructive"
              onClick={() => handleAction("rejected")}
              disabled={loading !== null}
            >
              {loading === "rejected" ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1" />
              ) : (
                <XCircle className="w-3.5 h-3.5 mr-1" />
              )}
              Reject
            </Button>
          </div>
        )}

        {isAccepted && (
          <div className="flex items-center gap-1.5 mt-1">
            <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
              <CheckCircle className="w-3 h-3" /> Accepted — task queued
            </span>
            <Button
              size="sm"
              variant="ghost"
              className="text-xs h-6 px-2 text-muted-foreground"
              onClick={() => handleAction("done")}
              disabled={loading !== null}
            >
              Mark done
            </Button>
          </div>
        )}

        {isDone && (
          <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
            <Trophy className="w-3 h-3" /> Done
          </span>
        )}

        {isRejected && (
          <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
            <XCircle className="w-3 h-3" /> Rejected
          </span>
        )}
      </CardContent>
    </Card>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function StrategyView() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/strategy");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSuggestions(await res.json());
    } catch (e) {
      setError("Failed to load suggestions.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch_();
  }, [fetch_]);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/strategy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate" }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      await fetch_();
    } catch (e: any) {
      setError(e.message ?? "Failed to generate suggestions.");
    } finally {
      setGenerating(false);
    }
  };

  const handleAction = async (id: number, action: string) => {
    await fetch(`/api/admin/strategy`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, id }),
    });
    await fetch_();
  };

  const visible = showAll
    ? suggestions
    : suggestions.filter((s) => s.status === "pending" || s.status === "accepted");

  const grouped = ALL_CATEGORIES.reduce<Record<string, Suggestion[]>>((acc, cat) => {
    acc[cat] = visible.filter((s) => s.category === cat);
    return acc;
  }, {});

  const pendingCount = suggestions.filter((s) => s.status === "pending").length;
  const hiddenCount = suggestions.length - visible.length;

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold">Strategic Suggestions</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {pendingCount} pending · generated daily by Claude
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowAll((v) => !v)}
          >
            <ChevronDown className={`w-3.5 h-3.5 mr-1 transition-transform ${showAll ? "rotate-180" : ""}`} />
            {showAll ? "Hide resolved" : `Show all (${suggestions.length})`}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleGenerate}
            disabled={generating || loading}
          >
            <Sparkles className={`w-3.5 h-3.5 mr-1 ${generating ? "animate-pulse" : ""}`} />
            {generating ? "Generating…" : "Generate more"}
          </Button>
          <Button size="sm" variant="ghost" onClick={fetch_} disabled={loading}>
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 text-destructive px-4 py-3 text-sm mb-4">
          {error}
        </div>
      )}

      {loading && suggestions.length === 0 && (
        <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
          <RefreshCw className="w-4 h-4 animate-spin mr-2" /> Loading…
        </div>
      )}

      {!loading && visible.length === 0 && (
        <div className="text-center py-16 text-muted-foreground text-sm">
          No pending suggestions. The scheduler runs daily at 08:00.
        </div>
      )}

      {/* Grid by category */}
      <div className="space-y-8">
        {ALL_CATEGORIES.map((cat) => {
          if (grouped[cat].length === 0) return null;
          return (
            <section key={cat}>
              <div className="flex items-center gap-2 mb-3">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${CATEGORY_COLORS[cat]}`}
                >
                  {CATEGORY_LABELS[cat]}
                </span>
                <span className="text-xs text-muted-foreground">
                  {grouped[cat].length}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {grouped[cat].map((s) => (
                  <SuggestionCard key={s.id} suggestion={s} onAction={handleAction} />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {!showAll && hiddenCount > 0 && (
        <button
          className="mt-6 w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-2"
          onClick={() => setShowAll(true)}
        >
          + {hiddenCount} resolved suggestions hidden
        </button>
      )}
    </div>
  );
}
