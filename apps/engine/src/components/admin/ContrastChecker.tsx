import { checkThemeContrast, type WcagLevel } from "../../lib/contrast.js";

interface Props {
  colors: Record<string, unknown>;
}

const LEVEL_STYLES: Record<WcagLevel, { badge: string; text: string }> = {
  AAA: { badge: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", text: "AAA" },
  AA: { badge: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", text: "AA" },
  "AA Large": { badge: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400", text: "AA Large" },
  Fail: { badge: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", text: "Fail" },
};

export function ContrastChecker({ colors }: Props) {
  const pairs = checkThemeContrast(colors);
  const failures = pairs.filter((p) => p.level === "Fail" || p.level === "AA Large");

  if (pairs.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Kontrast WCAG</h3>
        {failures.length === 0 ? (
          <span className="text-xs text-green-600 dark:text-green-400 font-medium">✓ Wszystko OK</span>
        ) : (
          <span className="text-xs text-red-600 dark:text-red-400 font-medium">
            {failures.length} {failures.length === 1 ? "problem" : "problemy"}
          </span>
        )}
      </div>

      <div className="space-y-2">
        {pairs.map((pair) => {
          const style = LEVEL_STYLES[pair.level];
          return (
            <div key={pair.label} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                {/* Color preview */}
                <div className="flex-shrink-0 w-7 h-5 rounded border border-border overflow-hidden flex">
                  <div className="flex-1" style={{ backgroundColor: pair.bg }} />
                  <div className="w-2" style={{ backgroundColor: pair.fg }} />
                </div>
                <span className="text-xs text-muted-foreground truncate">{pair.label}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs text-muted-foreground tabular-nums">
                  {pair.ratio !== null ? pair.ratio.toFixed(2) : "–"}:1
                </span>
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${style.badge}`}>
                  {style.text}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {failures.length > 0 && (
        <p className="text-[11px] text-muted-foreground border-t border-border pt-2">
          WCAG AA wymaga minimum 4.5:1 dla tekstu, 3:1 dla dużych nagłówków.
        </p>
      )}
    </div>
  );
}
