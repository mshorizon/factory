import React, { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Loader2, CheckCircle2, XCircle, AlertTriangle, Terminal } from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface ScriptMeta {
  label: string;
  description: string;
  danger?: boolean;
}

type RunStatus = "idle" | "running" | "success" | "error";

interface ScriptState {
  status: RunStatus;
  lines: { type: "stdout" | "stderr" | "error"; text: string }[];
}

// ── Script Card ───────────────────────────────────────────────────────────────

function ScriptCard({ id, meta }: { id: string; meta: ScriptMeta }) {
  const [state, setState] = useState<ScriptState>({ status: "idle", lines: [] });
  const [open, setOpen] = useState(false);
  const logRef = useRef<HTMLPreElement>(null);

  // Auto-scroll log to bottom
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [state.lines]);

  const run = async () => {
    setState({ status: "running", lines: [] });
    setOpen(true);

    const res = await fetch("/api/admin/run-script", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ script: id }),
    });

    if (!res.ok || !res.body) {
      const text = await res.text().catch(() => "Unknown error");
      setState({ status: "error", lines: [{ type: "error", text }] });
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buf += decoder.decode(value, { stream: true });
      const parts = buf.split("\n\n");
      buf = parts.pop() ?? "";

      for (const part of parts) {
        const dataLine = part.trim();
        if (!dataLine.startsWith("data:")) continue;
        try {
          const { type, data } = JSON.parse(dataLine.slice(5).trim());

          if (type === "exit") {
            const code = Number(data);
            setState((prev) => ({
              ...prev,
              status: code === 0 ? "success" : "error",
            }));
          } else {
            // Split multi-line chunks into individual lines
            const newLines = (data as string).split("\n").filter(Boolean).map((text: string) => ({
              type: type as "stdout" | "stderr" | "error",
              text,
            }));
            setState((prev) => ({
              ...prev,
              lines: [...prev.lines, ...newLines],
            }));
          }
        } catch {
          // malformed SSE line — skip
        }
      }
    }
  };

  const isRunning = state.status === "running";
  const isDanger = meta.danger;

  const statusIcon = {
    idle: null,
    running: <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />,
    success: <CheckCircle2 className="w-4 h-4 text-green-500" />,
    error: <XCircle className="w-4 h-4 text-destructive" />,
  }[state.status];

  return (
    <Card className={isDanger ? "border-destructive/40" : ""}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {isDanger && (
                <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0" />
              )}
              <CardTitle className="text-sm font-semibold">{meta.label}</CardTitle>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{meta.description}</p>
            <code className="text-xs text-muted-foreground/70 font-mono">pnpm {id}</code>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {statusIcon}
            <Button
              size="sm"
              variant={isDanger ? "destructive" : "default"}
              disabled={isRunning}
              onClick={run}
              className="min-w-[80px]"
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Running…
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 mr-1.5" />
                  Run
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      {open && state.lines.length > 0 && (
        <CardContent className="pt-0">
          <div
            className={`rounded-md border text-xs font-mono overflow-hidden ${
              state.status === "error"
                ? "border-destructive/40 bg-destructive/5"
                : "border-border bg-muted/40"
            }`}
          >
            {/* Log header */}
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/60">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Terminal className="w-3 h-3" />
                output
              </span>
              <button
                className="text-muted-foreground hover:text-foreground text-xs"
                onClick={() => setOpen(false)}
              >
                hide
              </button>
            </div>
            {/* Log body */}
            <pre
              ref={logRef}
              className="p-3 max-h-64 overflow-y-auto whitespace-pre-wrap break-all leading-relaxed"
            >
              {state.lines.map((line, i) => (
                <span
                  key={i}
                  className={
                    line.type === "stderr"
                      ? "text-yellow-600 dark:text-yellow-400"
                      : line.type === "error"
                      ? "text-destructive"
                      : "text-foreground"
                  }
                >
                  {line.text}
                  {"\n"}
                </span>
              ))}
              {isRunning && (
                <span className="text-muted-foreground animate-pulse">▋</span>
              )}
            </pre>
          </div>

          {state.status === "success" && (
            <p className="text-xs text-green-600 dark:text-green-400 mt-2 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Completed successfully.
            </p>
          )}
          {state.status === "error" && (
            <p className="text-xs text-destructive mt-2 flex items-center gap-1">
              <XCircle className="w-3 h-3" /> Exited with error.
            </p>
          )}
        </CardContent>
      )}
    </Card>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function ScriptsView() {
  const [scripts, setScripts] = useState<Record<string, ScriptMeta>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/run-script")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(setScripts)
      .catch(() => setError("Failed to load scripts. Super-admin role required."))
      .finally(() => setLoading(false));
  }, []);

  // Separate danger scripts from safe ones
  const safe = Object.entries(scripts).filter(([, m]) => !m.danger);
  const danger = Object.entries(scripts).filter(([, m]) => m.danger);

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Scripts</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Run server-side scripts from the admin panel. Super-admin only.
        </p>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-8">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading…
        </div>
      )}

      {error && (
        <div className="rounded-md bg-destructive/10 text-destructive px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="space-y-8">
          {safe.length > 0 && (
            <section className="space-y-3">
              {safe.map(([id, meta]) => (
                <ScriptCard key={id} id={id} meta={meta} />
              ))}
            </section>
          )}

          {danger.length > 0 && (
            <section>
              <p className="text-xs font-medium text-destructive uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" /> Destructive
              </p>
              <div className="space-y-3">
                {danger.map(([id, meta]) => (
                  <ScriptCard key={id} id={id} meta={meta} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
